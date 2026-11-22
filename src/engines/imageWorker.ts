import type { DimensionRange } from '../config/examPresets';
import {
  applySignatureFilterToImageData,
  compressWithEncoder,
  type CropRegion,
  type ImageCompressResult,
  type SignatureEnhanceOptions,
} from './imageCompress';

export interface ImageWorkerRequest {
  id: string;
  bitmap: ImageBitmap;
  crop: CropRegion;
  targetWidth: number;
  targetHeight: number;
  minKB: number;
  maxKB: number;
  dpi: number;
  allowedRange?: DimensionRange;
  signatureEnhance?: SignatureEnhanceOptions;
}

export type ImageWorkerMessage =
  | { id: string; type: 'progress'; percent: number; detail: string }
  | {
      id: string;
      type: 'done';
      result: Omit<ImageCompressResult, 'blob'>;
    }
  | { id: string; type: 'error'; error: string };

// Web Worker message loop (executes only inside a Worker global scope)
if (typeof self !== 'undefined' && typeof (self as unknown as { document?: unknown }).document === 'undefined') {
  self.onmessage = async (event: MessageEvent<ImageWorkerRequest>) => {
    const req = event.data;
    try {
      if (typeof OffscreenCanvas === 'undefined') {
        throw new Error('OffscreenCanvas is unavailable in this worker.');
      }

      const result = await compressWithEncoder(
        async (w, h, quality) => {
          const canvas = new OffscreenCanvas(w, h);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable.');

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(
            req.bitmap,
            req.crop.sx,
            req.crop.sy,
            req.crop.sw,
            req.crop.sh,
            0,
            0,
            w,
            h
          );

          if (req.signatureEnhance?.enabled) {
            const imgData = ctx.getImageData(0, 0, w, h);
            applySignatureFilterToImageData(imgData, req.signatureEnhance);
            ctx.putImageData(imgData, 0, 0);
          }

          const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
          return new Uint8Array(await blob.arrayBuffer());
        },
        {
          targetWidth: req.targetWidth,
          targetHeight: req.targetHeight,
          minKB: req.minKB,
          maxKB: req.maxKB,
          dpi: req.dpi,
          allowedRange: req.allowedRange,
          signatureEnhance: req.signatureEnhance,
          onProgress: (percent, detail) => {
            const msg: ImageWorkerMessage = { id: req.id, type: 'progress', percent, detail };
            self.postMessage(msg);
          },
        }
      );

      req.bitmap.close();
      const { blob: _ignored, ...serializable } = result;
      const doneMsg: ImageWorkerMessage = { id: req.id, type: 'done', result: serializable };
      self.postMessage(doneMsg, { transfer: [serializable.bytes.buffer] });
    } catch (err) {
      try {
        req.bitmap.close();
      } catch {
        // ignore close errors
      }
      const errMsg: ImageWorkerMessage = {
        id: req.id,
        type: 'error',
        error: err instanceof Error ? err.message : 'Worker image compression failed.',
      };
      self.postMessage(errMsg);
    }
  };
}
