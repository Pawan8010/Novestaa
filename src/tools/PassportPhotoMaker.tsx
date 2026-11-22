import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Info, Loader2 } from 'lucide-react';
import {
  formatFileSize,
  formatKB,
  triggerBlobDownload,
  validateImageFile,
} from '../engines/fileValidation';
import type { CropRegion } from '../engines/imageCompress';
import {
  calculateSheetLayout,
  PASSPORT_DPI,
  PASSPORT_PHOTO_MM,
  PASSPORT_PHOTO_PX,
  renderPassportOutputs,
  type PassportOutput,
  type PassportRenderOptions,
  type PassportSheetLayoutId,
} from '../engines/passport';
import { FileDropzone, PrivacyBanner } from './shared/PrivacyBanner';
import { ImageCropper } from './shared/ImageCropper';

const BG_OPTIONS: Array<{ value: PassportRenderOptions['backgroundFill']; label: string }> = [
  { value: '#FFFFFF', label: 'Pure White (#FFFFFF)' },
  { value: '#E0F2FE', label: 'Light Blue (#E0F2FE)' },
  { value: '#F1F5F9', label: 'Light Grey (#F1F5F9)' },
];

export const PassportPhotoMaker: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);

  const [backgroundFill, setBackgroundFill] = useState<PassportRenderOptions['backgroundFill']>('#FFFFFF');
  const [addBorder, setAddBorder] = useState(true);
  const [includeNameDateStrip, setIncludeNameDateStrip] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [photoDate, setPhotoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sheetLayout, setSheetLayout] = useState<PassportSheetLayoutId>('6x4-landscape');

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [output, setOutput] = useState<PassportOutput | null>(null);
  const [singleUrl, setSingleUrl] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  const layoutPreview = calculateSheetLayout(sheetLayout);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (singleUrl) URL.revokeObjectURL(singleUrl);
      if (sheetUrl) URL.revokeObjectURL(sheetUrl);
    };
  }, [sourceUrl, singleUrl, sheetUrl]);

  const handleClearAll = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (singleUrl) URL.revokeObjectURL(singleUrl);
    if (sheetUrl) URL.revokeObjectURL(sheetUrl);
    setSourceFile(null);
    setSourceUrl(null);
    setLoadedImage(null);
    setCropRegion(null);
    setOutput(null);
    setSingleUrl(null);
    setSheetUrl(null);
    setErrorMsg(null);
  };

  const handleFilesSelected = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    setErrorMsg(null);
    const check = await validateImageFile(file);
    if (!check.ok) {
      setErrorMsg(check.error || 'Please choose a valid JPG, PNG, or WebP image.');
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      setSourceFile(file);
      setSourceUrl(nextUrl);
      setLoadedImage(img);
      setOutput(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(nextUrl);
      setErrorMsg('Could not decode this image file.');
    };
    img.src = nextUrl;
  };

  const handleGenerate = async () => {
    if (!loadedImage || !cropRegion) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await renderPassportOutputs(
        loadedImage,
        cropRegion,
        {
          backgroundFill,
          addBorder,
          includeNameDateStrip,
          candidateName,
          photoDate,
        },
        sheetLayout
      );
      if (singleUrl) URL.revokeObjectURL(singleUrl);
      if (sheetUrl) URL.revokeObjectURL(sheetUrl);
      setSingleUrl(URL.createObjectURL(res.singleBlob));
      setSheetUrl(URL.createObjectURL(res.sheetBlob));
      setOutput(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to generate passport photos.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyBanner hasFiles={Boolean(sourceFile || output)} onClearAll={handleClearAll} />

      <div
        className="flex items-start gap-2.5 rounded-[12px] border px-4 py-3 text-xs leading-relaxed"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-saffron)' }} aria-hidden="true" />
        <span>
          <strong style={{ color: 'var(--color-navy)' }}>Indian Standard 35×45 mm (413×531 px at 300 DPI):</strong>{' '}
          Solid background fill replaces transparency and canvas edges locally. Automatic AI background removal is intentionally deferred until a fully offline in-browser model is bundled—we never send your photo to external background-removal APIs.
        </span>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[12px] border px-4 py-3 text-sm"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            borderColor: 'var(--color-error-border)',
            color: 'var(--color-error)',
          }}
        >
          <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!loadedImage ? (
        <FileDropzone
          id="passport-photo-upload"
          accept="image/jpeg,image/png,image/webp"
          label="Drop your portrait photo here or browse"
          helperText="Stand against a plain light wall for best results. JPG, PNG, or WebP up to 25 MB."
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Crop & Options */}
          <div className="pdf-card space-y-5 p-5 lg:col-span-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                1. Crop to 35×45 mm Frame
              </h3>
              <label className="cursor-pointer text-xs font-semibold underline underline-offset-2" style={{ color: 'var(--color-saffron-text)' }}>
                Change photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            <ImageCropper
              image={loadedImage}
              aspectRatio={includeNameDateStrip ? 413 / (531 - 74) : 35 / 45}
              guideMode="face"
              backgroundFill={backgroundFill}
              onCropChange={setCropRegion}
            />

            {/* Background fill swatches */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
                Background Fill (for transparent cutouts / margins)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BG_OPTIONS.map((opt) => {
                  const selected = backgroundFill === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setBackgroundFill(opt.value)}
                      className="flex min-h-[42px] items-center gap-2 rounded-[10px] border px-2.5 py-2 text-xs font-medium"
                      style={{
                        borderColor: selected ? 'var(--color-navy)' : 'var(--color-border)',
                        backgroundColor: selected ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
                        color: 'var(--color-navy)',
                      }}
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded border"
                        style={{ backgroundColor: opt.value, borderColor: 'var(--color-border-strong)' }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{opt.label.split(' (')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Border & Name/Date strip options */}
            <div className="space-y-3 rounded-[12px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
              <label className="flex items-center gap-2.5 text-sm font-medium" style={{ color: 'var(--color-navy)' }}>
                <input
                  type="checkbox"
                  checked={addBorder}
                  onChange={(e) => setAddBorder(e.target.checked)}
                  className="h-4 w-4 accent-[#0F172A]"
                />
                Add thin dark border around each photo
              </label>

              <label className="flex items-center gap-2.5 text-sm font-medium" style={{ color: 'var(--color-navy)' }}>
                <input
                  type="checkbox"
                  checked={includeNameDateStrip}
                  onChange={(e) => setIncludeNameDateStrip(e.target.checked)}
                  className="h-4 w-4 accent-[#0F172A]"
                />
                Add Name &amp; Date of Photo strip at bottom (for UPSC / SSC / NEET rules)
              </label>

              {includeNameDateStrip && (
                <div className="grid gap-3 pt-1 sm:grid-cols-2">
                  <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Candidate Name
                    <input
                      type="text"
                      maxLength={42}
                      placeholder="e.g. AARAV SHARMA"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="pdf-input mt-1 min-h-[42px] w-full px-3 text-sm"
                    />
                  </label>
                  <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Date of Photo (DOP)
                    <input
                      type="date"
                      value={photoDate}
                      onChange={(e) => setPhotoDate(e.target.value)}
                      className="pdf-input mt-1 min-h-[42px] w-full px-3 text-sm"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Sheet layout choice */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
                Printable 8-Copy Sheet Paper Size (300 DPI)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(['6x4-landscape', 'a4-portrait'] as PassportSheetLayoutId[]).map((id) => {
                  const spec = calculateSheetLayout(id);
                  const active = sheetLayout === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSheetLayout(id)}
                      className="min-h-[46px] rounded-[12px] border px-3 py-2 text-left transition-colors"
                      style={{
                        backgroundColor: active ? 'var(--color-navy)' : 'var(--color-surface)',
                        borderColor: active ? 'var(--color-navy)' : 'var(--color-border)',
                        color: active ? '#FFFFFF' : 'var(--color-navy)',
                      }}
                    >
                      <div className="text-xs font-semibold">{spec.label}</div>
                      <div
                        className="tabular-nums text-[11px]"
                        style={{ color: active ? '#CBD5E1' : 'var(--color-text-secondary)' }}
                      >
                        {spec.sheetWidthPx}×{spec.sheetHeightPx} px · {spec.gapMm} mm cut gaps
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="pdf-btn-primary inline-flex min-h-[46px] w-full items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Generating 300 DPI Passport &amp; 8-Copy Sheet…
                </>
              ) : (
                <>Generate Passport Photo &amp; 8-Copy Sheet</>
              )}
            </button>
          </div>

          {/* Right: Live Output Previews & Downloads */}
          <div className="pdf-card flex flex-col justify-between space-y-5 p-5 lg:col-span-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                2. Single Photo &amp; Printable Sheet Output
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-[12px] border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Original Image</p>
                  <p className="tabular-nums mt-1 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                    {sourceFile ? formatFileSize(sourceFile.size) : '—'}
                  </p>
                  <p className="tabular-nums mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {loadedImage.naturalWidth}×{loadedImage.naturalHeight} px
                  </p>
                </div>
                <div className="rounded-[12px] border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Target Requirement</p>
                  <p className="tabular-nums mt-1 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                    {PASSPORT_PHOTO_MM.width}×{PASSPORT_PHOTO_MM.height} mm · {PASSPORT_DPI} DPI
                  </p>
                  <p className="tabular-nums mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {PASSPORT_PHOTO_PX.width}×{PASSPORT_PHOTO_PX.height} px · {layoutPreview.copies} copies/sheet
                  </p>
                </div>
              </div>

              {output && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-[12px] border px-3.5 py-2.5 text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--color-success-bg)',
                    borderColor: 'var(--color-success-border)',
                    color: 'var(--color-success)',
                  }}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums">
                    Ready for online upload and studio printing: Single JPG ({formatKB(output.singleBytes.length)}, 413×531 px) + 8-copy {output.sheetSpec.label} ({formatFileSize(output.sheetBytes.length)}, {output.sheetSpec.sheetWidthPx}×{output.sheetSpec.sheetHeightPx} px).
                  </span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Single Photo (35×45 mm)
                  </span>
                  <div
                    className="flex h-48 items-center justify-center overflow-hidden rounded-[12px] border p-2"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                  >
                    {singleUrl ? (
                      <img src={singleUrl} alt="Generated 35x45mm passport photo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="px-2 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Generate to preview 413×531 px photo
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    8-Copy Printable Sheet
                  </span>
                  <div
                    className="flex h-48 items-center justify-center overflow-hidden rounded-[12px] border p-2"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                  >
                    {sheetUrl ? (
                      <img src={sheetUrl} alt="8-copy printable passport sheet with cut lines" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="px-2 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Generate to preview 8-copy sheet with cut lines
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={!output}
                onClick={() =>
                  output && triggerBlobDownload(output.singleBlob, 'pdfindia-passport-35x45mm-300dpi.jpg')
                }
                className="pdf-btn-primary inline-flex min-h-[46px] items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Single Photo JPG
              </button>

              <button
                type="button"
                disabled={!output}
                onClick={() =>
                  output &&
                  triggerBlobDownload(
                    output.sheetBlob,
                    `pdfindia-passport-8copies-${output.sheetSpec.id}-300dpi.jpg`
                  )
                }
                className="pdf-btn-secondary inline-flex min-h-[46px] items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                8-Copy Print Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
