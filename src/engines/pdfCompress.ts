import {
  isPasswordProtectedError,
  loadPdfJs,
  loadPdfLib,
  LOCKED_PDF_ERROR,
} from './fileValidation';

export interface PdfCompressOptions {
  targetMaxBytes: number;
  signal?: AbortSignal;
  onProgress?: (percent: number, detail: string) => void;
}

export interface PdfCompressResult {
  blob: Blob;
  bytes: Uint8Array;
  originalBytes: number;
  outputBytes: number;
  savedPercent: number;
  pageCount: number;
  usedDpi: number;
  usedQuality: number;
  reachedTarget: boolean;
  firstPagePreviewUrl?: string;
  pageWidthMm: number;
  pageHeightMm: number;
  warningMessage?: string;
}

const DPI_STEPS = [150, 125, 100]; // Never go below 100 DPI so text stays legible
const MIN_LEGIBLE_QUALITY = 0.25;
const MAX_QUALITY = 0.88;

export async function compressPdfToTarget(
  inputBytes: Uint8Array,
  options: PdfCompressOptions
): Promise<PdfCompressResult> {
  const checkAbort = () => {
    if (options.signal?.aborted) {
      throw new DOMException('PDF compression cancelled', 'AbortError');
    }
  };

  const [pdfjsLib, pdfLib] = await Promise.all([loadPdfJs(), loadPdfLib()]);
  checkAbort();

  let loadingTask: ReturnType<typeof pdfjsLib.getDocument>;
  let pdfDoc: Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;
  try {
    loadingTask = pdfjsLib.getDocument({ data: inputBytes.slice() });
    pdfDoc = await loadingTask.promise;
  } catch (err) {
    if (isPasswordProtectedError(err)) {
      throw new Error(LOCKED_PDF_ERROR);
    }
    throw new Error('Could not open this PDF. It may be corrupted or unsupported.');
  }

  const pageCount = pdfDoc.numPages;
  let pageWidthMm = 210;
  let pageHeightMm = 297;

  try {
    const firstPage = await pdfDoc.getPage(1);
    const vp = firstPage.getViewport({ scale: 1 });
    pageWidthMm = Number(((vp.width / 72) * 25.4).toFixed(1));
    pageHeightMm = Number(((vp.height / 72) * 25.4).toFixed(1));
  } catch {
    // fallback to A4 mm
  }

  const renderPagesAtDpiAndQuality = async (
    dpi: number,
    quality: number,
    progressBase: number,
    progressSpan: number
  ): Promise<{ bytes: Uint8Array; firstPageDataUrl?: string }> => {
    const outDoc = await pdfLib.PDFDocument.create();
    const scale = dpi / 72;
    let firstPageDataUrl: string | undefined;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      checkAbort();
      options.onProgress?.(
        Math.min(98, Math.round(progressBase + ((pageNum - 1) / pageCount) * progressSpan)),
        `Processing page ${pageNum} of ${pageCount} at ${dpi} DPI…`
      );

      const page = await pdfDoc.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });
      const renderViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(renderViewport.width));
      canvas.height = Math.max(1, Math.round(renderViewport.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable.');

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport: renderViewport, canvas }).promise;

      const jpegBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to encode PDF page as JPEG.'))),
          'image/jpeg',
          quality
        );
      });

      if (pageNum === 1) {
        firstPageDataUrl = URL.createObjectURL(jpegBlob);
      }

      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      const embedded = await outDoc.embedJpg(jpegBytes);
      const newPage = outDoc.addPage([baseViewport.width, baseViewport.height]);
      newPage.drawImage(embedded, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      });

      // Immediately release per-page canvas memory
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
    }

    const pdfBytes = await outDoc.save({ useObjectStreams: true });
    return { bytes: new Uint8Array(pdfBytes), firstPageDataUrl };
  };

  interface BestAttempt {
    bytes: Uint8Array;
    dpi: number;
    quality: number;
    previewUrl?: string;
  }

  const state: { bestAttempt: BestAttempt | null } = { bestAttempt: null };
  let reachedTarget = false;

  const replaceBest = (next: BestAttempt) => {
    if (state.bestAttempt?.previewUrl && state.bestAttempt.previewUrl !== next.previewUrl) {
      URL.revokeObjectURL(state.bestAttempt.previewUrl);
    }
    state.bestAttempt = next;
  };

  for (let dpiIdx = 0; dpiIdx < DPI_STEPS.length; dpiIdx++) {
    checkAbort();
    const dpi = DPI_STEPS[dpiIdx];
    const progressBase = Math.round((dpiIdx / DPI_STEPS.length) * 90);
    const progressSpan = Math.round(90 / DPI_STEPS.length);

    let low = MIN_LEGIBLE_QUALITY;
    let high = MAX_QUALITY;
    let bestAtDpi: { bytes: Uint8Array; quality: number; previewUrl?: string } | null = null;

    const minTest = await renderPagesAtDpiAndQuality(dpi, MIN_LEGIBLE_QUALITY, progressBase, progressSpan * 0.25);
    if (!state.bestAttempt || minTest.bytes.length < state.bestAttempt.bytes.length) {
      replaceBest({
        bytes: minTest.bytes,
        dpi,
        quality: MIN_LEGIBLE_QUALITY,
        previewUrl: minTest.firstPageDataUrl,
      });
    } else if (minTest.firstPageDataUrl) {
      URL.revokeObjectURL(minTest.firstPageDataUrl);
    }

    if (minTest.bytes.length > options.targetMaxBytes) {
      continue;
    }

    bestAtDpi = {
      bytes: minTest.bytes,
      quality: MIN_LEGIBLE_QUALITY,
      previewUrl: minTest.firstPageDataUrl,
    };

    for (let iter = 0; iter < 4; iter++) {
      checkAbort();
      const mid = (low + high) / 2;
      const attempt = await renderPagesAtDpiAndQuality(
        dpi,
        mid,
        progressBase + progressSpan * (0.25 + iter * 0.18),
        progressSpan * 0.18
      );
      if (attempt.bytes.length <= options.targetMaxBytes) {
        if (bestAtDpi?.previewUrl && bestAtDpi.previewUrl !== state.bestAttempt?.previewUrl) {
          URL.revokeObjectURL(bestAtDpi.previewUrl);
        }
        bestAtDpi = {
          bytes: attempt.bytes,
          quality: mid,
          previewUrl: attempt.firstPageDataUrl,
        };
        low = mid;
      } else {
        if (attempt.firstPageDataUrl) URL.revokeObjectURL(attempt.firstPageDataUrl);
        high = mid;
      }
    }

    if (bestAtDpi) {
      replaceBest({
        bytes: bestAtDpi.bytes,
        dpi,
        quality: bestAtDpi.quality,
        previewUrl: bestAtDpi.previewUrl,
      });
      reachedTarget = true;
      break;
    }
  }

  await loadingTask.destroy();

  if (!state.bestAttempt) {
    throw new Error('Unable to compress this PDF.');
  }

  const final = state.bestAttempt;

  options.onProgress?.(100, 'Done');

  const outBuf = new ArrayBuffer(final.bytes.byteLength);
  new Uint8Array(outBuf).set(final.bytes);
  const blob = new Blob([outBuf], { type: 'application/pdf' });

  const savedPercent =
    inputBytes.length > 0
      ? Number((((inputBytes.length - final.bytes.length) / inputBytes.length) * 100).toFixed(1))
      : 0;

  return {
    blob,
    bytes: final.bytes,
    originalBytes: inputBytes.length,
    outputBytes: final.bytes.length,
    savedPercent,
    pageCount,
    usedDpi: final.dpi,
    usedQuality: Number(final.quality.toFixed(2)),
    reachedTarget,
    firstPagePreviewUrl: final.previewUrl,
    pageWidthMm,
    pageHeightMm,
    warningMessage: reachedTarget
      ? undefined
      : `Could not reach ${(options.targetMaxBytes / 1024).toFixed(0)} KB without dropping below 100 DPI (which would make text unreadable). Best legible result is ${(final.bytes.length / 1024).toFixed(2)} KB. Try splitting the PDF or removing unnecessary pages.`,
  };
}
