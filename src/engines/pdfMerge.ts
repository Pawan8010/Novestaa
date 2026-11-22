import {
  isPasswordProtectedError,
  loadPdfLib,
  LOCKED_PDF_ERROR,
} from './fileValidation';
import { compressPdfToTarget } from './pdfCompress';

export interface MergeItem {
  id: string;
  file: File;
  kind: 'pdf' | 'image';
  rotation: 0 | 90 | 180 | 270;
  sizeBytes: number;
}

export interface MergeOptions {
  maxSizeBytes?: number; // Optional size cap (e.g., 2 MB)
  signal?: AbortSignal;
  onProgress?: (percent: number, detail: string) => void;
}

export interface MergeResult {
  blob: Blob;
  bytes: Uint8Array;
  totalPages: number;
  outputBytes: number;
  compressed: boolean;
  warningMessage?: string;
}

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const A4_MARGIN_PT = 36;

async function convertWebpOrPngToEmbeddable(
  file: File
): Promise<{ bytes: Uint8Array; type: 'jpg' | 'png' }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (isJpg) return { bytes, type: 'jpg' };
  if (isPng) return { bytes, type: 'png' };

  // Convert other browser-supported formats (e.g. WebP) cleanly to JPEG via Canvas
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas context unavailable for image conversion.');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const jpgBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not convert image.'))),
      'image/jpeg',
      0.92
    );
  });
  return { bytes: new Uint8Array(await jpgBlob.arrayBuffer()), type: 'jpg' };
}

export async function mergeItemsToPdf(
  items: MergeItem[],
  options: MergeOptions = {}
): Promise<MergeResult> {
  if (items.length === 0) {
    throw new Error('Add at least one PDF or image file to merge.');
  }

  const checkAbort = () => {
    if (options.signal?.aborted) {
      throw new DOMException('Merge cancelled', 'AbortError');
    }
  };

  const pdfLib = await loadPdfLib();
  const mergedDoc = await pdfLib.PDFDocument.create();

  for (let i = 0; i < items.length; i++) {
    checkAbort();
    const item = items[i];
    options.onProgress?.(
      Math.round(((i + 1) / items.length) * (options.maxSizeBytes ? 55 : 95)),
      `Adding ${item.file.name} (${i + 1}/${items.length})…`
    );

    if (item.kind === 'pdf') {
      const bytes = new Uint8Array(await item.file.arrayBuffer());
      let srcDoc: Awaited<ReturnType<typeof pdfLib.PDFDocument.load>>;
      try {
        srcDoc = await pdfLib.PDFDocument.load(bytes);
      } catch (err) {
        if (isPasswordProtectedError(err)) {
          throw new Error(`${item.file.name}: ${LOCKED_PDF_ERROR}`);
        }
        throw new Error(`Could not read "${item.file.name}". It may be corrupted or locked.`);
      }

      const indices = srcDoc.getPageIndices();
      const copiedPages = await mergedDoc.copyPages(srcDoc, indices);
      for (const page of copiedPages) {
        if (item.rotation !== 0) {
          const existing = page.getRotation().angle;
          page.setRotation(pdfLib.degrees((existing + item.rotation) % 360));
        }
        mergedDoc.addPage(page);
      }
    } else {
      const converted = await convertWebpOrPngToEmbeddable(item.file);
      const embedded =
        converted.type === 'jpg'
          ? await mergedDoc.embedJpg(converted.bytes)
          : await mergedDoc.embedPng(converted.bytes);

      const page = mergedDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
      const availW = A4_WIDTH_PT - A4_MARGIN_PT * 2;
      const availH = A4_HEIGHT_PT - A4_MARGIN_PT * 2;
      const scale = Math.min(availW / embedded.width, availH / embedded.height);
      const drawW = embedded.width * scale;
      const drawH = embedded.height * scale;
      const x = (A4_WIDTH_PT - drawW) / 2;
      const y = (A4_HEIGHT_PT - drawH) / 2;

      page.drawImage(embedded, {
        x,
        y,
        width: drawW,
        height: drawH,
      });

      if (item.rotation !== 0) {
        page.setRotation(pdfLib.degrees(item.rotation));
      }
    }
  }

  let finalBytes: Uint8Array = new Uint8Array(await mergedDoc.save({ useObjectStreams: true }));
  let compressed = false;
  let warningMessage: string | undefined;

  if (options.maxSizeBytes && finalBytes.length > options.maxSizeBytes) {
    options.onProgress?.(60, 'Applying size cap compression…');
    const compResult = await compressPdfToTarget(finalBytes, {
      targetMaxBytes: options.maxSizeBytes,
      signal: options.signal,
      onProgress: (pct, detail) => {
        options.onProgress?.(Math.min(99, 60 + Math.round(pct * 0.39)), detail);
      },
    });
    if (compResult.firstPagePreviewUrl) {
      URL.revokeObjectURL(compResult.firstPagePreviewUrl);
    }
    finalBytes = compResult.bytes;
    compressed = true;
    warningMessage = compResult.warningMessage;
  }

  options.onProgress?.(100, 'Merge complete');

  const outBuf = new ArrayBuffer(finalBytes.byteLength);
  new Uint8Array(outBuf).set(finalBytes);

  return {
    blob: new Blob([outBuf], { type: 'application/pdf' }),
    bytes: finalBytes,
    totalPages: mergedDoc.getPageCount(),
    outputBytes: finalBytes.length,
    compressed,
    warningMessage,
  };
}
