/**
 * Pure binary JPEG metadata utilities (works in Browser, Web Worker, and Node/Vitest).
 * - Writes JFIF APP0 DPI density (e.g., 300 DPI) cleanly without re-encoding pixels.
 * - Pads JPEG with harmless COM (FF FE) comment segments to meet strict minimum KB limits.
 */

const JFIF_IDENTIFIER = [0x4a, 0x46, 0x49, 0x46, 0x00]; // "JFIF\0"

export function isValidJpegBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

/**
 * Stamps or updates the JFIF APP0 segment with units = 1 (dots per inch) and X/Y density = dpi.
 */
export function writeJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (!isValidJpegBytes(bytes)) return bytes;
  const safeDpi = Math.max(72, Math.min(1200, Math.round(dpi)));
  const hi = (safeDpi >> 8) & 0xff;
  const lo = safeDpi & 0xff;

  // Check if an APP0 JFIF segment already starts right after SOI (offset 2)
  if (
    bytes.length >= 20 &&
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    bytes[6] === JFIF_IDENTIFIER[0] &&
    bytes[7] === JFIF_IDENTIFIER[1] &&
    bytes[8] === JFIF_IDENTIFIER[2] &&
    bytes[9] === JFIF_IDENTIFIER[3] &&
    bytes[10] === JFIF_IDENTIFIER[4]
  ) {
    const out = new Uint8Array(bytes);
    out[13] = 1; // units: 1 = dots per inch
    out[14] = hi;
    out[15] = lo;
    out[16] = hi;
    out[17] = lo;
    return out;
  }

  // Otherwise insert a fresh 18-byte JFIF APP0 segment right after SOI (FF D8)
  const app0 = new Uint8Array([
    0xff,
    0xe0, // APP0 marker
    0x00,
    0x10, // length = 16 bytes (including length field)
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00, // "JFIF\0"
    0x01,
    0x01, // version 1.01
    0x01, // units = DPI
    hi,
    lo, // Xdensity
    hi,
    lo, // Ydensity
    0x00,
    0x00, // no thumbnail
  ]);

  const out = new Uint8Array(2 + app0.length + (bytes.length - 2));
  out[0] = 0xff;
  out[1] = 0xd8;
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}

/**
 * Reads JFIF APP0 DPI density from JPEG bytes (used for verification & unit tests).
 */
export function readJpegDpi(bytes: Uint8Array): { xDpi: number; yDpi: number } | null {
  if (!isValidJpegBytes(bytes)) return null;
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break; // SOS or EOI
    const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segLen < 2 || offset + 2 + segLen > bytes.length) break;

    if (
      marker === 0xe0 &&
      segLen >= 16 &&
      bytes[offset + 4] === 0x4a &&
      bytes[offset + 5] === 0x46 &&
      bytes[offset + 6] === 0x49 &&
      bytes[offset + 7] === 0x46 &&
      bytes[offset + 8] === 0x00
    ) {
      const units = bytes[offset + 11];
      const xDensity = (bytes[offset + 12] << 8) | bytes[offset + 13];
      const yDensity = (bytes[offset + 14] << 8) | bytes[offset + 15];
      if (units === 1) {
        return { xDpi: xDensity, yDpi: yDensity };
      }
      if (units === 2) {
        return {
          xDpi: Math.round(xDensity * 2.54),
          yDpi: Math.round(yDensity * 2.54),
        };
      }
    }
    offset += 2 + segLen;
  }
  return null;
}

/**
 * Finds the byte offset of the Start of Scan (FF DA) marker so COM segments are placed cleanly before image data.
 */
function findSosOffset(bytes: Uint8Array): number {
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xda) return offset;
    if (marker === 0xd9) return offset;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segLen < 2) break;
    offset += 2 + segLen;
  }
  // Fallback: insert right before EOI (FF D9) if present, else right after SOI
  if (bytes.length >= 4 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9) {
    return bytes.length - 2;
  }
  return 2;
}

/**
 * Pads a JPEG with harmless COM (FF FE) comment segment(s) to reach at least minBytes
 * without altering a single pixel of the visible image.
 */
export function padJpegToMinBytes(bytes: Uint8Array, minBytes: number): Uint8Array {
  if (!isValidJpegBytes(bytes) || bytes.length >= minBytes) {
    return bytes;
  }

  let needed = minBytes - bytes.length;
  // Minimum COM segment overhead is 4 bytes (FF FE + 2-byte length)
  if (needed < 4) {
    needed = 4;
  }

  const segments: Uint8Array[] = [];
  let remaining = needed;
  const MAX_SEG_TOTAL = 65533; // 2 marker bytes + 65531 length field max

  while (remaining > 0) {
    let chunkTotal: number;
    if (remaining <= MAX_SEG_TOTAL) {
      chunkTotal = Math.max(4, remaining);
    } else {
      // Leave at least 4 bytes for the final segment
      chunkTotal = Math.min(MAX_SEG_TOTAL, remaining - 4);
    }
    const segLenField = chunkTotal - 2; // includes the 2 length bytes themselves
    const seg = new Uint8Array(chunkTotal);
    seg[0] = 0xff;
    seg[1] = 0xfe; // COM marker
    seg[2] = (segLenField >> 8) & 0xff;
    seg[3] = segLenField & 0xff;
    // Fill comment body with harmless ASCII space (0x20)
    seg.fill(0x20, 4);
    segments.push(seg);
    remaining -= chunkTotal;
  }

  const totalInserted = segments.reduce((sum, seg) => sum + seg.length, 0);
  const insertAt = findSosOffset(bytes);
  const out = new Uint8Array(bytes.length + totalInserted);

  out.set(bytes.subarray(0, insertAt), 0);
  let cursor = insertAt;
  for (const seg of segments) {
    out.set(seg, cursor);
    cursor += seg.length;
  }
  out.set(bytes.subarray(insertAt), cursor);
  return out;
}
