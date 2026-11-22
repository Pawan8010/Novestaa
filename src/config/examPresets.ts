export type ExamPresetType = 'photo' | 'signature';

export interface DimensionRange {
  minWidthPx: number;
  maxWidthPx: number;
  minHeightPx: number;
  maxHeightPx: number;
}

export interface ExamPreset {
  id: string;
  exam: string;
  shortLabel: string;
  type: ExamPresetType;
  widthPx: number;
  heightPx: number;
  dpi: number;
  minKB: number;
  maxKB: number;
  format: 'image/jpeg';
  allowedRange?: DimensionRange;
  dimensionLabel: string;
  notes: string;
  sourceUrl: string;
  lastVerified: string;
  status: 'active' | 'placeholder' | 'custom';
}

export const EXAM_PRESETS: ExamPreset[] = [
  {
    id: 'upsc-photo',
    exam: 'UPSC',
    shortLabel: 'UPSC Photo',
    type: 'photo',
    widthPx: 500,
    heightPx: 500,
    dpi: 300,
    minKB: 20,
    maxKB: 300,
    format: 'image/jpeg',
    allowedRange: {
      minWidthPx: 350,
      maxWidthPx: 1000,
      minHeightPx: 350,
      maxHeightPx: 1000,
    },
    dimensionLabel: '350×350 to 1000×1000 px (default 500×500)',
    notes:
      'Recent colour photograph with clear face visibility (3/4th of frame). Plain white background recommended; check if the current UPSC cycle asks for name and date on photo.',
    sourceUrl: 'https://upsconline.nic.in/',
    lastVerified: '2026-03-01',
    status: 'active',
  },
  {
    id: 'upsc-signature',
    exam: 'UPSC',
    shortLabel: 'UPSC Signature',
    type: 'signature',
    widthPx: 500,
    heightPx: 200,
    dpi: 300,
    minKB: 20,
    maxKB: 300,
    format: 'image/jpeg',
    allowedRange: {
      minWidthPx: 350,
      maxWidthPx: 1000,
      minHeightPx: 200,
      maxHeightPx: 1000,
    },
    dimensionLabel: '350×350 to 1000×1000 px (default 500×200)',
    notes:
      'Sign in black ink on plain white paper. Ensure crisp dark strokes with no shadow or grey paper cast. Note: some UPSC forms strictly enforce 350×350 minimum height—switch to Custom if required.',
    sourceUrl: 'https://upsconline.nic.in/',
    lastVerified: '2026-03-01',
    status: 'active',
  },
  {
    id: 'ssc-photo',
    exam: 'SSC (CGL/CHSL/GD)',
    shortLabel: 'SSC Photo',
    type: 'photo',
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    minKB: 20,
    maxKB: 50,
    format: 'image/jpeg',
    dimensionLabel: '3.5 × 4.5 cm (413×531 px at 300 DPI)',
    notes:
      'Without cap or spectacles, both ears visible, plain light background. Note that newer SSC OTR portals may also require live webcam capture in addition to uploaded files.',
    sourceUrl: 'https://ssc.gov.in/',
    lastVerified: '2026-03-01',
    status: 'active',
  },
  {
    id: 'ssc-signature',
    exam: 'SSC (CGL/CHSL/GD)',
    shortLabel: 'SSC Signature',
    type: 'signature',
    widthPx: 472,
    heightPx: 236,
    dpi: 300,
    minKB: 10,
    maxKB: 20,
    format: 'image/jpeg',
    dimensionLabel: '4.0 × 2.0 cm (472×236 px at 300 DPI)',
    notes:
      'Horizontal signature in black or blue ink on plain white unruled paper. Blurred or miniature signatures are frequently rejected by SSC scrutiny.',
    sourceUrl: 'https://ssc.gov.in/',
    lastVerified: '2026-03-01',
    status: 'active',
  },
  {
    id: 'ibps-photo',
    exam: 'IBPS / SBI',
    shortLabel: 'IBPS/SBI Photo',
    type: 'photo',
    widthPx: 200,
    heightPx: 230,
    dpi: 300,
    minKB: 20,
    maxKB: 50,
    format: 'image/jpeg',
    dimensionLabel: '200 × 230 px (4.5 × 3.5 cm)',
    notes:
      'Recent passport-style colour photograph against a light-coloured, preferably white background. Avoid red-eye and glasses glare.',
    sourceUrl: 'https://www.ibps.in/',
    lastVerified: '2026-03-01',
    status: 'active',
  },
  {
    id: 'ibps-signature',
    exam: 'IBPS / SBI',
    shortLabel: 'IBPS/SBI Signature',
    type: 'signature',
    widthPx: 140,
    heightPx: 60,
    dpi: 300,
    minKB: 10,
    maxKB: 20,
    format: 'image/jpeg',
    dimensionLabel: '140 × 60 px',
    notes:
      'Sign on white paper with a black ink pen. Signature in CAPITAL LETTERS is not accepted by IBPS/SBI portals.',
    sourceUrl: 'https://www.ibps.in/',
    lastVerified: '2026-03-01',
    status: 'active',
  },
  {
    id: 'custom',
    exam: 'Custom',
    shortLabel: 'Custom Size',
    type: 'photo',
    widthPx: 413,
    heightPx: 531,
    dpi: 300,
    minKB: 20,
    maxKB: 100,
    format: 'image/jpeg',
    dimensionLabel: 'Custom px / KB range',
    notes:
      'Enter exact pixel width, pixel height, DPI, and minimum/maximum KB limits from any state PSC, university, scholarship, or government portal notification.',
    sourceUrl: '',
    lastVerified: 'User-defined',
    status: 'custom',
  },
];

export interface PlaceholderExamRow {
  id: string;
  exam: string;
  photoSpec: string;
  signatureSpec: string;
  sourceUrl: string;
  lastVerified: string;
}

export const PLACEHOLDER_EXAM_ROWS: PlaceholderExamRow[] = [
  {
    id: 'gate',
    exam: 'GATE',
    photoSpec: '[verify from official notification]',
    signatureSpec: '[verify from official notification]',
    sourceUrl: '[verify from official notification]',
    lastVerified: '[verify from official notification]',
  },
  {
    id: 'neet',
    exam: 'NEET (UG)',
    photoSpec: '[verify from official notification]',
    signatureSpec: '[verify from official notification]',
    sourceUrl: '[verify from official notification]',
    lastVerified: '[verify from official notification]',
  },
  {
    id: 'rrb',
    exam: 'RRB (NTPC / Group D / ALP)',
    photoSpec: '[verify from official notification]',
    signatureSpec: '[verify from official notification]',
    sourceUrl: '[verify from official notification]',
    lastVerified: '[verify from official notification]',
  },
];

export function getPresetById(id: string): ExamPreset {
  return EXAM_PRESETS.find((p) => p.id === id) || EXAM_PRESETS[0];
}
