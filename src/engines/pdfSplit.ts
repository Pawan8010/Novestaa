import {
  isPasswordProtectedError,
  loadPdfJs,
  loadPdfLib,
  LOCKED_PDF_ERROR,
} from './fileValidation';

export interface PageRangeParseResult {
  valid: boolean;
  pages: number[]; // 1-indexed sorted unique page numbers
  error?: string;
}

/**
 * Parses human page ranges like "1, 3-5, 8" against totalPages with strict validation.
 */
export function parsePageRanges(input: string, totalPages: number): PageRangeParseResult {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    return { valid: false, pages: [], error: 'Document has no pages to extract.' };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      valid: false,
      pages: [],
      error: `Enter page numbers or ranges (for example: 1, 3-${Math.min(5, totalPages)}).`,
    };
  }

  const parts = trimmed.split(',').map((s) => s.trim());
  const selected = new Set<number>();

  for (const part of parts) {
    if (!part) {
      return {
        valid: false,
        pages: [],
        error: 'Remove empty commas in your page range (for example: 1, 3-5).',
      };
    }

    if (part.includes('-')) {
      const bounds = part.split('-').map((s) => s.trim());
      if (bounds.length !== 2 || !/^\d+$/.test(bounds[0]) || !/^\d+$/.test(bounds[1])) {
        return {
          valid: false,
          pages: [],
          error: `Invalid range "${part}". Use start-end format like 2-5.`,
        };
      }
      const start = Number(bounds[0]);
      const end = Number(bounds[1]);
      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        return {
          valid: false,
          pages: [],
          error: `Range "${part}" is out of bounds. This PDF has ${totalPages} page${totalPages === 1 ? '' : 's'}.`,
        };
      }
      if (start > end) {
        return {
          valid: false,
          pages: [],
          error: `Range "${part}" is reversed. Use ${end}-${start} instead.`,
        };
      }
      for (let p = start; p <= end; p++) {
        selected.add(p);
      }
    } else {
      if (!/^\d+$/.test(part)) {
        return {
          valid: false,
          pages: [],
          error: `"${part}" is not a valid page number.`,
        };
      }
      const pageNum = Number(part);
      if (pageNum < 1 || pageNum > totalPages) {
        return {
          valid: false,
          pages: [],
          error: `Page ${pageNum} does not exist. Enter pages between 1 and ${totalPages}.`,
        };
      }
      selected.add(pageNum);
    }
  }

  const pages = Array.from(selected).sort((a, b) => a - b);
  return { valid: true, pages };
}

export function formatPagesToRangeString(pages: number[]): string {
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  if (sorted.length === 0) return '';
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = curr;
      prev = curr;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}

export interface PdfThumbnailItem {
  pageNumber: number;
  url: string;
  widthMm: number;
  heightMm: number;
}

export async function renderPdfThumbnails(
  inputBytes: Uint8Array,
  signal?: AbortSignal,
  onProgress?: (percent: number, detail: string) => void
): Promise<{ pageCount: number; thumbnails: PdfThumbnailItem[] }> {
  const pdfjsLib = await loadPdfJs();
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
  const thumbnails: PdfThumbnailItem[] = [];

  try {
    for (let p = 1; p <= pageCount; p++) {
      if (signal?.aborted) {
        throw new DOMException('Thumbnail loading cancelled', 'AbortError');
      }
      onProgress?.(Math.round((p / pageCount) * 100), `Rendering preview ${p} of ${pageCount}…`);

      const page = await pdfDoc.getPage(p);
      const baseVp = page.getViewport({ scale: 1 });
      const thumbScale = Math.min(0.45, 220 / Math.max(baseVp.width, 1));
      const vp = page.getViewport({ scale: thumbScale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(vp.width));
      canvas.height = Math.max(1, Math.round(vp.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable.');

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Thumbnail failed'))),
          'image/jpeg',
          0.72
        );
      });

      thumbnails.push({
        pageNumber: p,
        url: URL.createObjectURL(blob),
        widthMm: Number(((baseVp.width / 72) * 25.4).toFixed(1)),
        heightMm: Number(((baseVp.height / 72) * 25.4).toFixed(1)),
      });

      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
    }
  } catch (err) {
    for (const item of thumbnails) URL.revokeObjectURL(item.url);
    await loadingTask.destroy();
    throw err;
  }

  await loadingTask.destroy();
  return { pageCount, thumbnails };
}

export async function extractPdfPages(
  inputBytes: Uint8Array,
  pages1Indexed: number[]
): Promise<{ blob: Blob; bytes: Uint8Array; pageCount: number; widthMm: number; heightMm: number }> {
  const pdfLib = await loadPdfLib();
  let srcDoc: Awaited<ReturnType<typeof pdfLib.PDFDocument.load>>;
  try {
    srcDoc = await pdfLib.PDFDocument.load(inputBytes);
  } catch (err) {
    if (isPasswordProtectedError(err)) {
      throw new Error(LOCKED_PDF_ERROR);
    }
    throw new Error('Could not read this PDF for page extraction.');
  }

  const outDoc = await pdfLib.PDFDocument.create();
  const zeroBased = pages1Indexed.map((p) => p - 1);
  const copied = await outDoc.copyPages(srcDoc, zeroBased);
  for (const page of copied) {
    outDoc.addPage(page);
  }

  const firstSize = outDoc.getPage(0).getSize();
  const widthMm = Number(((firstSize.width / 72) * 25.4).toFixed(1));
  const heightMm = Number(((firstSize.height / 72) * 25.4).toFixed(1));

  const outBytes = new Uint8Array(await outDoc.save({ useObjectStreams: true }));
  const outBuf = new ArrayBuffer(outBytes.byteLength);
  new Uint8Array(outBuf).set(outBytes);

  return {
    blob: new Blob([outBuf], { type: 'application/pdf' }),
    bytes: outBytes,
    pageCount: outDoc.getPageCount(),
    widthMm,
    heightMm,
  };
}
