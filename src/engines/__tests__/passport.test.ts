import { describe, expect, it } from 'vitest';
import {
  calculateSheetLayout,
  PASSPORT_DPI,
  PASSPORT_PHOTO_MM,
  PASSPORT_PHOTO_PX,
} from '../passport';

describe('Indian Passport 8-Copy Printable Sheet Layout Math', () => {
  it('fits 8 non-overlapping 35x45mm photos on 6x4 inch landscape (1800x1200 px at 300 DPI)', () => {
    const spec = calculateSheetLayout('6x4-landscape');

    expect(spec.dpi).toBe(PASSPORT_DPI);
    expect(spec.sheetWidthPx).toBe(1800);
    expect(spec.sheetHeightPx).toBe(1200);
    expect(spec.photoWidthMm).toBe(PASSPORT_PHOTO_MM.width);
    expect(spec.photoHeightMm).toBe(PASSPORT_PHOTO_MM.height);
    expect(spec.photoWidthPx).toBe(PASSPORT_PHOTO_PX.width);
    expect(spec.photoHeightPx).toBe(PASSPORT_PHOTO_PX.height);
    expect(spec.copies).toBe(8);
    expect(spec.cells).toHaveLength(8);
    expect(spec.fitsWithoutOverflow).toBe(true);

    // Ensure every cell stays strictly inside margins and never overlaps another cell
    for (let i = 0; i < spec.cells.length; i++) {
      const a = spec.cells[i];
      expect(a.xPx).toBeGreaterThanOrEqual(spec.marginPx);
      expect(a.yPx).toBeGreaterThanOrEqual(spec.marginPx);
      expect(a.xPx + a.widthPx).toBeLessThanOrEqual(spec.sheetWidthPx - spec.marginPx);
      expect(a.yPx + a.heightPx).toBeLessThanOrEqual(spec.sheetHeightPx - spec.marginPx);

      for (let j = i + 1; j < spec.cells.length; j++) {
        const b = spec.cells[j];
        const overlapsX = a.xPx < b.xPx + b.widthPx && a.xPx + a.widthPx > b.xPx;
        const overlapsY = a.yPx < b.yPx + b.heightPx && a.yPx + a.heightPx > b.yPx;
        expect(overlapsX && overlapsY).toBe(false);
      }
    }
  });

  it('fits 8 non-overlapping 35x45mm photos on A4 portrait (2480x3508 px at 300 DPI)', () => {
    const spec = calculateSheetLayout('a4-portrait');

    expect(spec.sheetWidthPx).toBe(2480);
    expect(spec.sheetHeightPx).toBe(3508);
    expect(spec.copies).toBe(8);
    expect(spec.cells).toHaveLength(8);
    expect(spec.fitsWithoutOverflow).toBe(true);

    for (const cell of spec.cells) {
      expect(cell.widthPx).toBe(413);
      expect(cell.heightPx).toBe(531);
      expect(cell.xPx).toBeGreaterThanOrEqual(spec.marginPx);
      expect(cell.yPx).toBeGreaterThanOrEqual(spec.marginPx);
      expect(cell.xPx + cell.widthPx).toBeLessThanOrEqual(spec.sheetWidthPx - spec.marginPx);
      expect(cell.yPx + cell.heightPx).toBeLessThanOrEqual(spec.sheetHeightPx - spec.marginPx);
    }
  });
});
