import { mmToPx } from './fileValidation';
import { writeJpegDpi } from './jpegMetadata';
import type { CropRegion } from './imageCompress';

export type PassportSheetLayoutId = 'a4-portrait' | '6x4-landscape';

export interface SheetCell {
  row: number;
  col: number;
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
  xMm: number;
  yMm: number;
}

export interface SheetLayoutSpec {
  id: PassportSheetLayoutId;
  label: string;
  sheetWidthMm: number;
  sheetHeightMm: number;
  sheetWidthPx: number;
  sheetHeightPx: number;
  photoWidthMm: number;
  photoHeightMm: number;
  photoWidthPx: number;
  photoHeightPx: number;
  cols: number;
  rows: number;
  gapMm: number;
  gapPx: number;
  marginMm: number;
  marginPx: number;
  dpi: number;
  copies: number;
  cells: SheetCell[];
  fitsWithoutOverflow: boolean;
}

export const PASSPORT_PHOTO_MM = { width: 35, height: 45 } as const;
export const PASSPORT_PHOTO_PX = { width: 413, height: 531 } as const; // exact 35x45 mm at 300 DPI
export const PASSPORT_DPI = 300;

/**
 * Computes exact printable sheet coordinates at 300 DPI for 8 passport copies (35×45 mm).
 * - 6×4 inch landscape (1800×1200 px): 4×2 grid, 1.5 mm gaps, 3 mm minimum margins -> fits 8 copies cleanly.
 * - A4 portrait (2480×3508 px): 4×2 grid, 6 mm gaps, centered margins -> fits 8 copies cleanly.
 */
export function calculateSheetLayout(layout: PassportSheetLayoutId): SheetLayoutSpec {
  const dpi = PASSPORT_DPI;
  const photoWidthMm = PASSPORT_PHOTO_MM.width;
  const photoHeightMm = PASSPORT_PHOTO_MM.height;
  const photoWidthPx = PASSPORT_PHOTO_PX.width;
  const photoHeightPx = PASSPORT_PHOTO_PX.height;

  const isSixByFour = layout === '6x4-landscape';
  const sheetWidthMm = isSixByFour ? 152.4 : 210;
  const sheetHeightMm = isSixByFour ? 101.6 : 297;
  const sheetWidthPx = isSixByFour ? 1800 : 2480;
  const sheetHeightPx = isSixByFour ? 1200 : 3508;

  const cols = 4;
  const rows = 2;
  const gapMm = isSixByFour ? 1.5 : 6;
  const marginMm = isSixByFour ? 3 : 10;

  const gapPx = mmToPx(gapMm, dpi);
  const marginPx = mmToPx(marginMm, dpi);

  const usedWidthPx = cols * photoWidthPx + (cols - 1) * gapPx;
  const usedHeightPx = rows * photoHeightPx + (rows - 1) * gapPx;

  const usedWidthMm = cols * photoWidthMm + (cols - 1) * gapMm;
  const usedHeightMm = rows * photoHeightMm + (rows - 1) * gapMm;

  // Center the 4x2 grid inside the sheet while respecting >= marginPx on every edge
  const startXPx = Math.floor((sheetWidthPx - usedWidthPx) / 2);
  const startYPx = isSixByFour
    ? Math.floor((sheetHeightPx - usedHeightPx) / 2)
    : Math.max(marginPx, Math.floor((sheetHeightPx - usedHeightPx) / 6));

  const startXMm = (sheetWidthMm - usedWidthMm) / 2;
  const startYMm = isSixByFour ? (sheetHeightMm - usedHeightMm) / 2 : marginMm;

  const cells: SheetCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        row: r,
        col: c,
        xPx: startXPx + c * (photoWidthPx + gapPx),
        yPx: startYPx + r * (photoHeightPx + gapPx),
        widthPx: photoWidthPx,
        heightPx: photoHeightPx,
        xMm: Number((startXMm + c * (photoWidthMm + gapMm)).toFixed(2)),
        yMm: Number((startYMm + r * (photoHeightMm + gapMm)).toFixed(2)),
      });
    }
  }

  const fitsWithoutOverflow =
    startXPx >= marginPx &&
    startYPx >= marginPx &&
    startXPx + usedWidthPx <= sheetWidthPx - marginPx &&
    startYPx + usedHeightPx <= sheetHeightPx - marginPx &&
    usedWidthMm + 2 * marginMm <= sheetWidthMm + 0.01 &&
    usedHeightMm + 2 * marginMm <= sheetHeightMm + 0.01;

  return {
    id: layout,
    label: isSixByFour ? '6×4 inch Landscape (8 copies)' : 'A4 Portrait (8 copies)',
    sheetWidthMm,
    sheetHeightMm,
    sheetWidthPx,
    sheetHeightPx,
    photoWidthMm,
    photoHeightMm,
    photoWidthPx,
    photoHeightPx,
    cols,
    rows,
    gapMm,
    gapPx,
    marginMm,
    marginPx,
    dpi,
    copies: cols * rows,
    cells,
    fitsWithoutOverflow,
  };
}

export interface PassportRenderOptions {
  backgroundFill: '#FFFFFF' | '#E0F2FE' | '#F1F5F9';
  addBorder: boolean;
  includeNameDateStrip: boolean;
  candidateName: string;
  photoDate: string; // YYYY-MM-DD or display text
}

export interface PassportOutput {
  singleBlob: Blob;
  singleBytes: Uint8Array;
  singleWidth: number;
  singleHeight: number;
  sheetBlob: Blob;
  sheetBytes: Uint8Array;
  sheetSpec: SheetLayoutSpec;
}

function formatIndianDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoDate;
}

export async function renderPassportOutputs(
  source: CanvasImageSource,
  crop: CropRegion,
  options: PassportRenderOptions,
  sheetLayout: PassportSheetLayoutId
): Promise<PassportOutput> {
  const { width, height } = PASSPORT_PHOTO_PX;
  const singleCanvas = document.createElement('canvas');
  singleCanvas.width = width;
  singleCanvas.height = height;
  const ctx = singleCanvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  // Background fill (visible behind transparent PNGs or edge margins)
  ctx.fillStyle = options.backgroundFill;
  ctx.fillRect(0, 0, width, height);

  const stripHeight = options.includeNameDateStrip ? 74 : 0;
  const photoAreaHeight = height - stripHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, photoAreaHeight);

  // Optional bottom Name & Date white strip with auto-fitted text
  if (options.includeNameDateStrip) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, photoAreaHeight, width, stripHeight);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, photoAreaHeight + 0.5);
    ctx.lineTo(width, photoAreaHeight + 0.5);
    ctx.stroke();

    const cleanName = options.candidateName.trim().toUpperCase() || 'CANDIDATE NAME';
    const cleanDate = formatIndianDate(options.photoDate.trim()) || 'DD-MM-YYYY';
    const maxTextWidth = width - 24;

    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Auto-fit candidate name font size
    let nameFontSize = 24;
    ctx.font = `700 ${nameFontSize}px Inter, system-ui, sans-serif`;
    while (ctx.measureText(cleanName).width > maxTextWidth && nameFontSize > 12) {
      nameFontSize -= 1;
      ctx.font = `700 ${nameFontSize}px Inter, system-ui, sans-serif`;
    }
    ctx.fillText(cleanName, width / 2, photoAreaHeight + 24);

    // Date line
    let dateFontSize = 19;
    ctx.font = `600 ${dateFontSize}px Inter, system-ui, sans-serif`;
    const dateLabel = `DOP: ${cleanDate}`;
    while (ctx.measureText(dateLabel).width > maxTextWidth && dateFontSize > 11) {
      dateFontSize -= 1;
      ctx.font = `600 ${dateFontSize}px Inter, system-ui, sans-serif`;
    }
    ctx.fillText(dateLabel, width / 2, photoAreaHeight + 53);
  }

  // Optional thin black border
  if (options.addBorder) {
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
  }

  const rawSingleBlob = await new Promise<Blob>((resolve, reject) => {
    singleCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not generate passport JPEG.'))),
      'image/jpeg',
      0.94
    );
  });
  const singleBytes = writeJpegDpi(new Uint8Array(await rawSingleBlob.arrayBuffer()), PASSPORT_DPI);
  const singleBuf = new ArrayBuffer(singleBytes.byteLength);
  new Uint8Array(singleBuf).set(singleBytes);
  const singleBlob = new Blob([singleBuf], { type: 'image/jpeg' });

  // Printable 8-copy sheet with dashed cut lines
  const sheetSpec = calculateSheetLayout(sheetLayout);
  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = sheetSpec.sheetWidthPx;
  sheetCanvas.height = sheetSpec.sheetHeightPx;
  const sCtx = sheetCanvas.getContext('2d');
  if (!sCtx) throw new Error('Sheet Canvas 2D context unavailable.');

  sCtx.fillStyle = '#FFFFFF';
  sCtx.fillRect(0, 0, sheetSpec.sheetWidthPx, sheetSpec.sheetHeightPx);

  for (const cell of sheetSpec.cells) {
    sCtx.drawImage(singleCanvas, cell.xPx, cell.yPx, cell.widthPx, cell.heightPx);
    // Light cut-guide outline around each copy
    sCtx.save();
    sCtx.strokeStyle = '#94A3B8';
    sCtx.lineWidth = 1.5;
    sCtx.setLineDash([8, 6]);
    sCtx.strokeRect(cell.xPx - 1, cell.yPx - 1, cell.widthPx + 2, cell.heightPx + 2);
    sCtx.restore();
  }

  // Subtle crop tick marks along sheet edges
  const rawSheetBlob = await new Promise<Blob>((resolve, reject) => {
    sheetCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not generate printable sheet JPEG.'))),
      'image/jpeg',
      0.95
    );
  });
  const sheetBytes = writeJpegDpi(new Uint8Array(await rawSheetBlob.arrayBuffer()), PASSPORT_DPI);
  const sheetBuf = new ArrayBuffer(sheetBytes.byteLength);
  new Uint8Array(sheetBuf).set(sheetBytes);
  const sheetBlob = new Blob([sheetBuf], { type: 'image/jpeg' });

  return {
    singleBlob,
    singleBytes,
    singleWidth: width,
    singleHeight: height,
    sheetBlob,
    sheetBytes,
    sheetSpec,
  };
}
