export const MAX_IMAGE_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_PDF_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

export const LOCKED_PDF_ERROR = 'Unlock this file first.';

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0.00 KB';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export function formatKB(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0.00 KB';
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export function mmToPx(mm: number, dpi = 300): number {
  return Math.round((mm / 25.4) * dpi);
}

export function pxToMm(px: number, dpi = 300): number {
  return Number(((px * 25.4) / dpi).toFixed(1));
}

export interface FileValidationResult {
  ok: boolean;
  error?: string;
  warning?: string;
}

export async function validateImageFile(file: File): Promise<FileValidationResult> {
  if (!file || file.size === 0) {
    return { ok: false, error: 'This file is empty. Please choose a valid JPG, PNG, or WebP image.' };
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return {
      ok: false,
      error: `Image is too large (${formatFileSize(file.size)}). Please choose a file under 25 MB.`,
    };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng =
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47;
  const isWebp =
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50;

  if (!isJpeg && !isPng && !isWebp && !allowedTypes.includes(file.type)) {
    return {
      ok: false,
      error: 'Unsupported image format. Please upload a JPG, PNG, or WebP file.',
    };
  }

  const warning =
    file.size > 15 * 1024 * 1024
      ? `Large image detected (${formatFileSize(file.size)}). Processing locally may take a few seconds.`
      : undefined;

  return { ok: true, warning };
}

export async function validatePdfFile(file: File): Promise<FileValidationResult> {
  if (!file || file.size === 0) {
    return { ok: false, error: 'This PDF file is empty or unreadable.' };
  }
  if (file.size > MAX_PDF_FILE_BYTES) {
    return {
      ok: false,
      error: `PDF is too large (${formatFileSize(file.size)}). Please choose a file under 50 MB.`,
    };
  }

  const headerBytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const headerText = new TextDecoder('latin1').decode(headerBytes);
  if (!headerText.includes('%PDF-')) {
    return {
      ok: false,
      error: 'This file does not appear to be a valid PDF document.',
    };
  }

  const warning =
    file.size > 18 * 1024 * 1024
      ? `Large PDF (${formatFileSize(file.size)}). Processing happens locally page by page to keep your browser responsive.`
      : undefined;

  return { ok: true, warning };
}

export function isPasswordProtectedError(err: unknown): boolean {
  if (!err) return false;
  const name = typeof err === 'object' && 'name' in err ? String((err as { name: unknown }).name) : '';
  const msg = err instanceof Error ? err.message : String(err);
  return (
    name === 'PasswordException' ||
    /password|encrypted|need a password|incorrect password/i.test(msg)
  );
}

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

/**
 * Dynamically loads pdfjs-dist and configures its locally bundled worker (zero CDN).
 */
export async function loadPdfJs(): Promise<typeof import('pdfjs-dist')> {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjsLib, workerUrlModule]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrlModule.default;
      return pdfjsLib;
    });
  }
  return pdfjsPromise;
}

export async function loadPdfLib(): Promise<typeof import('pdf-lib')> {
  return import('pdf-lib');
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
