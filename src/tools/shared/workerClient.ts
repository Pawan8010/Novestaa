import {
  compressImageOnCanvas,
  type CropRegion,
  type ImageCompressOptions,
  type ImageCompressResult,
} from '../../engines/imageCompress';
import type { ImageWorkerMessage, ImageWorkerRequest } from '../../engines/imageWorker';

/**
 * Runs JPEG binary-search compression off the main thread in a Web Worker using OffscreenCanvas
 * when supported, falling back cleanly to the main-thread HTMLCanvasElement encoder.
 */
export async function compressImageWithWorker(
  image: HTMLImageElement,
  crop: CropRegion,
  options: ImageCompressOptions
): Promise<ImageCompressResult> {
  if (options.signal?.aborted) {
    throw new DOMException('Compression cancelled', 'AbortError');
  }

  const canUseWorker =
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof createImageBitmap === 'function';

  if (!canUseWorker) {
    return compressImageOnCanvas(image, crop, options);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(image);
  } catch {
    return compressImageOnCanvas(image, crop, options);
  }

  return new Promise<ImageCompressResult>((resolve, reject) => {
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('../../engines/imageWorker.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      bitmap.close();
      compressImageOnCanvas(image, crop, options).then(resolve, reject);
      return;
    }

    const requestId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let settled = false;

    const cleanup = () => {
      options.signal?.removeEventListener('abort', onAbort);
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new DOMException('Compression cancelled', 'AbortError'));
    };

    options.signal?.addEventListener('abort', onAbort, { once: true });

    worker.onmessage = (event: MessageEvent<ImageWorkerMessage>) => {
      const msg = event.data;
      if (!msg || msg.id !== requestId) return;

      if (msg.type === 'progress') {
        options.onProgress?.(msg.percent, msg.detail);
        return;
      }

      if (msg.type === 'done') {
        if (settled) return;
        settled = true;
        cleanup();
        const bytes = msg.result.bytes;
        const buf = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(buf).set(bytes);
        resolve({
          ...msg.result,
          blob: new Blob([buf], { type: 'image/jpeg' }),
        });
        return;
      }

      if (msg.type === 'error') {
        if (settled) return;
        settled = true;
        cleanup();
        // Fallback to main thread on OffscreenCanvas worker error
        compressImageOnCanvas(image, crop, options).then(resolve, reject);
      }
    };

    worker.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      compressImageOnCanvas(image, crop, options).then(resolve, reject);
    };

    const payload: ImageWorkerRequest = {
      id: requestId,
      bitmap,
      crop,
      targetWidth: options.targetWidth,
      targetHeight: options.targetHeight,
      minKB: options.minKB,
      maxKB: options.maxKB,
      dpi: options.dpi ?? 300,
      allowedRange: options.allowedRange,
      signatureEnhance: options.signatureEnhance,
    };

    worker.postMessage(payload, [bitmap]);
  });
}
