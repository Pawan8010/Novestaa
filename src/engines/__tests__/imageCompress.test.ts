import { describe, expect, it } from 'vitest';
import {
  applySignatureFilterToImageData,
  compressWithEncoder,
  type JpegEncodeFn,
} from '../imageCompress';
import { readJpegDpi, writeJpegDpi } from '../jpegMetadata';

/**
 * Generates a synthetically valid minimal JPEG binary (SOI + APP0 JFIF + SOS + payload + EOI)
 * whose byte length scales predictably with pixel area and quality.
 */
function makeSyntheticJpeg(payloadLength: number): Uint8Array {
  const safePayload = Math.max(64, Math.round(payloadLength));
  // SOI (2) + APP0 JFIF (18) + SOS marker (2) + SOS header (2) + payload + EOI (2)
  const total = 2 + 18 + 4 + safePayload + 2;
  const buf = new Uint8Array(total);
  let p = 0;

  // SOI
  buf[p++] = 0xff;
  buf[p++] = 0xd8;

  // APP0 JFIF (length 16 = 0x0010, default 72 DPI)
  buf[p++] = 0xff;
  buf[p++] = 0xe0;
  buf[p++] = 0x00;
  buf[p++] = 0x10;
  buf[p++] = 0x4a; // J
  buf[p++] = 0x46; // F
  buf[p++] = 0x49; // I
  buf[p++] = 0x46; // F
  buf[p++] = 0x00;
  buf[p++] = 0x01; // v1.1
  buf[p++] = 0x01;
  buf[p++] = 0x01; // DPI
  buf[p++] = 0x00;
  buf[p++] = 0x48; // 72
  buf[p++] = 0x00;
  buf[p++] = 0x48; // 72
  buf[p++] = 0x00;
  buf[p++] = 0x00;

  // SOS marker
  buf[p++] = 0xff;
  buf[p++] = 0xda;
  buf[p++] = 0x00;
  buf[p++] = 0x02;

  // Entropy payload bytes (non-0xFF to keep structure clean)
  buf.fill(0x55, p, p + safePayload);
  p += safePayload;

  // EOI
  buf[p++] = 0xff;
  buf[p++] = 0xd9;

  return buf;
}

describe('Image Compression Engine & JFIF Metadata', () => {
  it('writes and reads 300 DPI JFIF headers accurately', () => {
    const raw = makeSyntheticJpeg(4096);
    expect(readJpegDpi(raw)).toEqual({ xDpi: 72, yDpi: 72 });

    const stamped = writeJpegDpi(raw, 300);
    expect(readJpegDpi(stamped)).toEqual({ xDpi: 300, yDpi: 300 });
    expect(stamped[0]).toBe(0xff);
    expect(stamped[1]).toBe(0xd8);
    expect(stamped[stamped.length - 2]).toBe(0xff);
    expect(stamped[stamped.length - 1]).toBe(0xd9);
  });

  it('hits strictly inside [20KB, 50KB] for a large detailed SSC photo with 300 DPI', async () => {
    const largePhotoEncoder: JpegEncodeFn = async (w, h, quality) => {
      // Simulates a rich portrait photo (ranges ~12KB at q=0.05 to ~160KB at q=0.99 for 413x531)
      const areaFactor = (w * h) / (413 * 531);
      const size = Math.round(areaFactor * (11_000 + quality * quality * 150_000));
      return makeSyntheticJpeg(size);
    };

    const result = await compressWithEncoder(largePhotoEncoder, {
      targetWidth: 413,
      targetHeight: 531,
      minKB: 20,
      maxKB: 50,
      dpi: 300,
    });

    expect(result.fitsRange).toBe(true);
    expect(result.sizeBytes).toBeGreaterThanOrEqual(20 * 1024);
    expect(result.sizeBytes).toBeLessThanOrEqual(50 * 1024);
    expect(result.width).toBe(413);
    expect(result.height).toBe(531);
    expect(readJpegDpi(result.bytes)).toEqual({ xDpi: 300, yDpi: 300 });
  });

  it('scales down proportionally within allowedRange when an ultra-dense photo exceeds maxKB at min quality', async () => {
    const ultraDenseEncoder: JpegEncodeFn = async (w, h, quality) => {
      // At 1000x1000 even min quality is >340KB, forcing downscale inside 350..1000
      const pixels = w * h;
      const size = Math.round(pixels * (0.35 + quality * 0.6));
      return makeSyntheticJpeg(size);
    };

    const result = await compressWithEncoder(ultraDenseEncoder, {
      targetWidth: 1000,
      targetHeight: 1000,
      minKB: 20,
      maxKB: 300,
      dpi: 300,
      allowedRange: {
        minWidthPx: 350,
        maxWidthPx: 1000,
        minHeightPx: 350,
        maxHeightPx: 1000,
      },
    });

    expect(result.fitsRange).toBe(true);
    expect(result.scaled).toBe(true);
    expect(result.width).toBeGreaterThanOrEqual(350);
    expect(result.width).toBeLessThan(1000);
    expect(result.sizeBytes).toBeGreaterThanOrEqual(20 * 1024);
    expect(result.sizeBytes).toBeLessThanOrEqual(300 * 1024);
  });

  it('pads a small IBPS 140x60 signature safely with COM metadata to fit strictly inside [10KB, 20KB]', async () => {
    const tinySignatureEncoder: JpegEncodeFn = async (_w, _h, quality) => {
      // Clean 140x60 signature compresses to only ~3KB - 5KB even at quality 0.99
      return makeSyntheticJpeg(2800 + Math.round(quality * 2200));
    };

    const result = await compressWithEncoder(tinySignatureEncoder, {
      targetWidth: 140,
      targetHeight: 60,
      minKB: 10,
      maxKB: 20,
      dpi: 300,
    });

    expect(result.fitsRange).toBe(true);
    expect(result.padded).toBe(true);
    expect(result.width).toBe(140);
    expect(result.height).toBe(60);
    expect(result.sizeBytes).toBeGreaterThanOrEqual(10 * 1024);
    expect(result.sizeBytes).toBeLessThanOrEqual(20 * 1024);
    expect(readJpegDpi(result.bytes)).toEqual({ xDpi: 300, yDpi: 300 });
    // Verify JPEG ends properly with EOI
    expect(result.bytes[result.bytes.length - 2]).toBe(0xff);
    expect(result.bytes[result.bytes.length - 1]).toBe(0xd9);
  });

  it('handles sparse transparent-PNG-flattened images by scaling up within allowedRange first', async () => {
    const sparsePngEncoder: JpegEncodeFn = async (w, h, quality) => {
      // Flat white background + small foreground -> small size at 400x400, hits >=20KB at larger px
      const size = Math.round(((w * h) / (400 * 400)) * (8500 + quality * 4000));
      return makeSyntheticJpeg(size);
    };

    const result = await compressWithEncoder(sparsePngEncoder, {
      targetWidth: 400,
      targetHeight: 400,
      minKB: 20,
      maxKB: 300,
      dpi: 300,
      allowedRange: {
        minWidthPx: 350,
        maxWidthPx: 1000,
        minHeightPx: 350,
        maxHeightPx: 1000,
      },
    });

    expect(result.fitsRange).toBe(true);
    expect(result.scaled).toBe(true);
    expect(result.width).toBeGreaterThan(400);
    expect(result.width).toBeLessThanOrEqual(1000);
    expect(result.sizeBytes).toBeGreaterThanOrEqual(20 * 1024);
    expect(result.sizeBytes).toBeLessThanOrEqual(300 * 1024);
  });

  it('whitens light grey paper and converts ink cleanly in signature cleanup filter', () => {
    // 2 pixels: pixel 0 is light grey paper (220, 215, 210), pixel 1 is dark blue ink (20, 35, 110)
    const raw = new Uint8ClampedArray([220, 215, 210, 255, 20, 35, 110, 255]);
    const fakeImageData = { data: raw, width: 2, height: 1 } as unknown as ImageData;

    applySignatureFilterToImageData(fakeImageData, {
      enabled: true,
      grayscale: true,
      contrast: 1.5,
      whitenThreshold: 200,
    });

    // Paper pixel whitened to pure #FFFFFF
    expect([raw[0], raw[1], raw[2]]).toEqual([255, 255, 255]);
    // Ink pixel darkened and grayscale (R === G === B < 50)
    expect(raw[4]).toBe(raw[5]);
    expect(raw[5]).toBe(raw[6]);
    expect(raw[4]).toBeLessThan(50);
  });
});
