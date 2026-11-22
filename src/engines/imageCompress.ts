import type { DimensionRange } from '../config/examPresets';
import { padJpegToMinBytes, writeJpegDpi } from './jpegMetadata';

export interface CropRegion {
  /** Source x in pixels */
  sx: number;
  /** Source y in pixels */
  sy: number;
  /** Source width in pixels */
  sw: number;
  /** Source height in pixels */
  sh: number;
}

export interface SignatureEnhanceOptions {
  enabled: boolean;
  grayscale: boolean;
  contrast: number; // 0.5 to 2.5 (1 = normal)
  whitenThreshold: number; // 140 to 255 (255 = off)
}

export interface ImageCompressOptions {
  targetWidth: number;
  targetHeight: number;
  minKB: number;
  maxKB: number;
  dpi?: number;
  allowedRange?: DimensionRange;
  signatureEnhance?: SignatureEnhanceOptions;
  signal?: AbortSignal;
  onProgress?: (percent: number, detail: string) => void;
}

export interface ImageCompressResult {
  bytes: Uint8Array;
  blob: Blob;
  width: number;
  height: number;
  dpi: number;
  quality: number;
  sizeBytes: number;
  fitsRange: boolean;
  padded: boolean;
  scaled: boolean;
  failureReason?: string;
}

export type JpegEncodeFn = (
  width: number,
  height: number,
  quality: number
) => Promise<Uint8Array>;

const BINARY_SEARCH_ITERATIONS = 15;
const MIN_QUALITY = 0.05;
const MAX_QUALITY = 0.99;

/**
 * Pure algorithm core: binary searches JPEG quality (15 iterations) to hit [minKB, maxKB],
 * scales within allowedRange if needed, stamps JFIF DPI, and applies harmless COM padding
 * when below minKB with fixed dimensions.
 */
export async function compressWithEncoder(
  encode: JpegEncodeFn,
  options: ImageCompressOptions
): Promise<ImageCompressResult> {
  const dpi = options.dpi ?? 300;
  const minBytes = Math.max(0, Math.round(options.minKB * 1024));
  const maxBytes = Math.max(minBytes + 512, Math.round(options.maxKB * 1024));

  let width = Math.max(16, Math.round(options.targetWidth));
  let height = Math.max(16, Math.round(options.targetHeight));
  const aspect = width / height;

  const minAllowedW = options.allowedRange?.minWidthPx ?? width;
  const maxAllowedW = options.allowedRange?.maxWidthPx ?? width;
  const minAllowedH = options.allowedRange?.minHeightPx ?? height;
  const maxAllowedH = options.allowedRange?.maxHeightPx ?? height;
  const canScaleDown = width > minAllowedW || height > minAllowedH;
  const canScaleUp = width < maxAllowedW && height < maxAllowedH;

  let scaled = false;
  let padded = false;

  const checkAbort = () => {
    if (options.signal?.aborted) {
      throw new DOMException('Compression cancelled', 'AbortError');
    }
  };

  const encodeStamped = async (w: number, h: number, q: number): Promise<Uint8Array> => {
    checkAbort();
    const raw = await encode(w, h, q);
    return writeJpegDpi(raw, dpi);
  };

  const binarySearchAtSize = async (w: number, h: number) => {
    let low = MIN_QUALITY;
    let high = MAX_QUALITY;
    let bestFitting: { bytes: Uint8Array; quality: number } | null = null;
    let smallestSeen: { bytes: Uint8Array; quality: number } | null = null;
    let largestSeen: { bytes: Uint8Array; quality: number } | null = null;

    // First probe maximum quality to see if we're already under minBytes or already cleanly inside
    const maxBytesProbe = await encodeStamped(w, h, MAX_QUALITY);
    largestSeen = { bytes: maxBytesProbe, quality: MAX_QUALITY };
    smallestSeen = largestSeen;

    if (maxBytesProbe.length <= maxBytes && maxBytesProbe.length >= minBytes) {
      return {
        bestFitting: largestSeen,
        smallestSeen,
        largestSeen,
      };
    }

    if (maxBytesProbe.length < minBytes) {
      return {
        bestFitting: null,
        smallestSeen: largestSeen,
        largestSeen,
      };
    }

    // Binary search for 15 iterations to find the highest quality <= maxBytes
    for (let i = 0; i < BINARY_SEARCH_ITERATIONS; i++) {
      checkAbort();
      const mid = (low + high) / 2;
      const candidate = await encodeStamped(w, h, mid);
      options.onProgress?.(
        Math.min(85, Math.round(((i + 1) / BINARY_SEARCH_ITERATIONS) * 80)),
        `Optimizing quality (${i + 1}/${BINARY_SEARCH_ITERATIONS})…`
      );

      if (!smallestSeen || candidate.length < smallestSeen.bytes.length) {
        smallestSeen = { bytes: candidate, quality: mid };
      }
      if (!largestSeen || candidate.length > largestSeen.bytes.length) {
        largestSeen = { bytes: candidate, quality: mid };
      }

      if (candidate.length <= maxBytes) {
        if (!bestFitting || mid > bestFitting.quality) {
          bestFitting = { bytes: candidate, quality: mid };
        }
        low = mid;
      } else {
        high = mid;
      }
    }

    // One final check at MIN_QUALITY if nothing fit under maxBytes yet
    if (!bestFitting) {
      const minProbe = await encodeStamped(w, h, MIN_QUALITY);
      if (minProbe.length < smallestSeen.bytes.length) {
        smallestSeen = { bytes: minProbe, quality: MIN_QUALITY };
      }
      if (minProbe.length <= maxBytes) {
        bestFitting = { bytes: minProbe, quality: MIN_QUALITY };
      }
    }

    return { bestFitting, smallestSeen, largestSeen };
  };

  let search = await binarySearchAtSize(width, height);

  // Case 1: Still larger than maxBytes even at lowest quality -> scale down within allowedRange
  if (!search.bestFitting && canScaleDown) {
    for (let step = 0; step < 8; step++) {
      checkAbort();
      const nextW = Math.max(minAllowedW, Math.round(width * 0.85));
      const nextH = Math.max(minAllowedH, Math.round(nextW / aspect));
      if (nextW === width && nextH === height) break;
      width = nextW;
      height = Math.min(maxAllowedH, Math.max(minAllowedH, nextH));
      scaled = true;
      options.onProgress?.(88, `Scaling dimensions to ${width}×${height} px…`);
      search = await binarySearchAtSize(width, height);
      if (search.bestFitting) break;
    }
  }

  let chosen = search.bestFitting ?? search.smallestSeen!;

  // Case 2: Smaller than minBytes even at maximum quality -> first try scaling UP within allowedRange
  if (chosen.bytes.length < minBytes && canScaleUp) {
    for (let step = 0; step < 6; step++) {
      checkAbort();
      const nextW = Math.min(maxAllowedW, Math.round(width * 1.25));
      const nextH = Math.min(maxAllowedH, Math.round(nextW / aspect));
      if (nextW === width && nextH === height) break;
      width = nextW;
      height = Math.max(minAllowedH, nextH);
      scaled = true;
      options.onProgress?.(90, `Increasing dimensions to ${width}×${height} px…`);
      const upSearch = await binarySearchAtSize(width, height);
      chosen = upSearch.bestFitting ?? upSearch.largestSeen!;
      if (chosen.bytes.length >= minBytes && chosen.bytes.length <= maxBytes) {
        break;
      }
    }
  }

  // Case 3: If still below minBytes (fixed dimensions or maxed out allowedRange), pad safely with COM metadata
  if (chosen.bytes.length < minBytes) {
    // Target slightly inside [minBytes, maxBytes] (minBytes + 256 bytes or midpoint if tight)
    const padTarget = Math.min(maxBytes, Math.max(minBytes, minBytes + Math.min(256, Math.floor((maxBytes - minBytes) / 4))));
    const paddedBytes = padJpegToMinBytes(chosen.bytes, padTarget);
    if (paddedBytes.length <= maxBytes) {
      chosen = { bytes: paddedBytes, quality: chosen.quality };
      padded = true;
    }
  }

  const finalBytes = chosen.bytes;
  const fitsSize = finalBytes.length >= minBytes && finalBytes.length <= maxBytes;
  const fitsDims =
    width >= minAllowedW &&
    width <= maxAllowedW &&
    height >= minAllowedH &&
    height <= maxAllowedH;

  let failureReason: string | undefined;
  if (!fitsSize) {
    if (finalBytes.length > maxBytes) {
      failureReason = `Output (${(finalBytes.length / 1024).toFixed(2)} KB) still exceeds the ${options.maxKB} KB maximum limit at ${width}×${height} px. Try cropping tighter or reducing busy background detail.`;
    } else {
      failureReason = `Output (${(finalBytes.length / 1024).toFixed(2)} KB) is below the ${options.minKB} KB minimum limit.`;
    }
  } else if (!fitsDims) {
    failureReason = `Output dimensions (${width}×${height} px) fall outside the allowed pixel range.`;
  }

  options.onProgress?.(100, 'Complete');

  const blobBuffer = new ArrayBuffer(finalBytes.byteLength);
  new Uint8Array(blobBuffer).set(finalBytes);

  return {
    bytes: finalBytes,
    blob: new Blob([blobBuffer], { type: 'image/jpeg' }),
    width,
    height,
    dpi,
    quality: Number(chosen.quality.toFixed(3)),
    sizeBytes: finalBytes.length,
    fitsRange: fitsSize && fitsDims,
    padded,
    scaled,
    failureReason,
  };
}

/**
 * Applies optional signature grayscale, contrast, and background whitening directly on ImageData.
 */
export function applySignatureFilterToImageData(
  imageData: ImageData,
  opts: SignatureEnhanceOptions
): void {
  if (!opts.enabled) return;
  const data = imageData.data;
  const contrast = opts.contrast;
  const whiten = opts.whitenThreshold;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (opts.grayscale) {
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      r = lum;
      g = lum;
      b = lum;
    }

    // Contrast adjustment around midpoint 128
    r = Math.max(0, Math.min(255, Math.round((r - 128) * contrast + 128)));
    g = Math.max(0, Math.min(255, Math.round((g - 128) * contrast + 128)));
    b = Math.max(0, Math.min(255, Math.round((b - 128) * contrast + 128)));

    // Whiten light grey paper background to pure #FFFFFF
    const lumAfter = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lumAfter >= whiten) {
      r = 255;
      g = 255;
      b = 255;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
}

/**
 * Browser Canvas implementation of image compression (also called as main-thread fallback if Worker is unavailable).
 */
export async function compressImageOnCanvas(
  source: CanvasImageSource,
  crop: CropRegion,
  options: ImageCompressOptions
): Promise<ImageCompressResult> {
  const encode: JpegEncodeFn = async (w, h, quality) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');

    // Fill pure white first so transparent PNGs flatten cleanly without black artifacts
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h);

    if (options.signatureEnhance?.enabled) {
      const imgData = ctx.getImageData(0, 0, w, h);
      applySignatureFilterToImageData(imgData, options.signatureEnhance);
      ctx.putImageData(imgData, 0, 0);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to encode JPEG image.'))),
        'image/jpeg',
        quality
      );
    });
    return new Uint8Array(await blob.arrayBuffer());
  };

  return compressWithEncoder(encode, options);
}
