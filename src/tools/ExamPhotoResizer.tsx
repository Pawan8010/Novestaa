import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Info,
  Loader2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  EXAM_PRESETS,
  getPresetById,
  PLACEHOLDER_EXAM_ROWS,
  type ExamPreset,
} from '../config/examPresets';
import {
  formatFileSize,
  formatKB,
  pxToMm,
  triggerBlobDownload,
  validateImageFile,
} from '../engines/fileValidation';
import {
  applySignatureFilterToImageData,
  type CropRegion,
  type ImageCompressResult,
  type SignatureEnhanceOptions,
} from '../engines/imageCompress';
import { FileDropzone, PrivacyBanner } from './shared/PrivacyBanner';
import { ImageCropper } from './shared/ImageCropper';
import { compressImageWithWorker } from './shared/workerClient';

interface ExamPhotoResizerProps {
  initialPresetId?: string;
}

export const ExamPhotoResizer: React.FC<ExamPhotoResizerProps> = ({
  initialPresetId = 'upsc-photo',
}) => {
  const [presetId, setPresetId] = useState<string>(initialPresetId);
  const preset: ExamPreset = getPresetById(presetId);

  // Sync if route changes default preset
  useEffect(() => {
    setPresetId(initialPresetId);
  }, [initialPresetId]);

  // Custom dimensions state
  const [customWidth, setCustomWidth] = useState(413);
  const [customHeight, setCustomHeight] = useState(531);
  const [customDpi, setCustomDpi] = useState(300);
  const [customMinKB, setCustomMinKB] = useState(20);
  const [customMaxKB, setCustomMaxKB] = useState(50);
  const [customMode, setCustomMode] = useState<'photo' | 'signature'>('photo');

  const isCustom = preset.status === 'custom';
  const activeType = isCustom ? customMode : preset.type;
  const targetWidth = isCustom ? Math.max(40, Math.min(4000, customWidth || 413)) : preset.widthPx;
  const targetHeight = isCustom ? Math.max(40, Math.min(4000, customHeight || 531)) : preset.heightPx;
  const targetDpi = isCustom ? Math.max(72, Math.min(600, customDpi || 300)) : preset.dpi;
  const targetMinKB = isCustom ? Math.max(1, customMinKB || 10) : preset.minKB;
  const targetMaxKB = isCustom ? Math.max(targetMinKB + 2, customMaxKB || 50) : preset.maxKB;

  // Loaded file state
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);

  // Signature enhancement state
  const [sigEnhance, setSigEnhance] = useState<SignatureEnhanceOptions>({
    enabled: false,
    grayscale: true,
    contrast: 1.35,
    whitenThreshold: 210,
  });

  // Auto-enable signature enhancement toggle default when switching to signature preset
  useEffect(() => {
    setSigEnhance((prev) => ({
      ...prev,
      enabled: activeType === 'signature',
    }));
  }, [activeType]);

  // Live signature preview canvas
  const sigPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (activeType !== 'signature' || !loadedImage || !cropRegion || !sigPreviewCanvasRef.current) {
      return;
    }
    const canvas = sigPreviewCanvasRef.current;
    const previewW = 320;
    const previewH = Math.max(72, Math.round(previewW / (targetWidth / targetHeight)));
    canvas.width = previewW;
    canvas.height = previewH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, previewW, previewH);
    ctx.drawImage(
      loadedImage,
      cropRegion.sx,
      cropRegion.sy,
      cropRegion.sw,
      cropRegion.sh,
      0,
      0,
      previewW,
      previewH
    );

    if (sigEnhance.enabled) {
      const imgData = ctx.getImageData(0, 0, previewW, previewH);
      applySignatureFilterToImageData(imgData, sigEnhance);
      ctx.putImageData(imgData, 0, 0);
    }
  }, [activeType, loadedImage, cropRegion, sigEnhance, targetWidth, targetHeight]);

  // Output & processing state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetail, setProgressDetail] = useState('');
  const [result, setResult] = useState<ImageCompressResult | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Revoke object URLs cleanly on unmount or clear
  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [sourceUrl, outputUrl]);

  const clearOutput = () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl(null);
    setResult(null);
  };

  const handleClearAll = () => {
    abortRef.current?.abort();
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setSourceFile(null);
    setSourceUrl(null);
    setLoadedImage(null);
    setCropRegion(null);
    setResult(null);
    setOutputUrl(null);
    setErrorMsg(null);
    setWarningMsg(null);
    setIsProcessing(false);
    setProgress(0);
    setProgressDetail('');
  };

  const handleFilesSelected = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    setErrorMsg(null);
    setWarningMsg(null);
    clearOutput();

    const validation = await validateImageFile(file);
    if (!validation.ok) {
      setErrorMsg(validation.error || 'Invalid image file.');
      return;
    }
    if (validation.warning) {
      setWarningMsg(validation.warning);
    }

    const nextUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      setSourceFile(file);
      setSourceUrl(nextUrl);
      setLoadedImage(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(nextUrl);
      setErrorMsg('Could not decode this image. The file may be corrupted.');
    };
    img.src = nextUrl;
  };

  const handleProcess = async () => {
    if (!loadedImage || !cropRegion) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsProcessing(true);
    setErrorMsg(null);
    setProgress(5);
    setProgressDetail('Preparing crop…');

    try {
      const res = await compressImageWithWorker(loadedImage, cropRegion, {
        targetWidth,
        targetHeight,
        minKB: targetMinKB,
        maxKB: targetMaxKB,
        dpi: targetDpi,
        allowedRange: isCustom ? undefined : preset.allowedRange,
        signatureEnhance: activeType === 'signature' ? sigEnhance : undefined,
        signal: controller.signal,
        onProgress: (pct, detail) => {
          setProgress(pct);
          setProgressDetail(detail);
        },
      });

      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const nextOutUrl = URL.createObjectURL(res.blob);
      setResult(res);
      setOutputUrl(nextOutUrl);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setProgressDetail('Cancelled');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to resize image.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const base = preset.id === 'custom' ? `custom-${activeType}` : preset.id;
    triggerBlobDownload(result.blob, `pdfindia-${base}-${result.width}x${result.height}.jpg`);
  };

  return (
    <div className="space-y-6">
      <PrivacyBanner hasFiles={Boolean(sourceFile || result)} onClearAll={handleClearAll} />

      {/* Preset Selector */}
      <section aria-labelledby="preset-heading" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="preset-heading" className="text-base font-semibold" style={{ color: 'var(--color-navy)' }}>
            1. Select Exam Preset
          </h2>
          <span className="text-xs font-medium" style={{ color: 'var(--color-saffron-text)' }}>
            Always check the latest official notification
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {EXAM_PRESETS.map((item) => {
            const active = item.id === preset.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setPresetId(item.id);
                  clearOutput();
                }}
                className="flex min-h-[44px] flex-col items-start justify-center rounded-[12px] border px-3 py-2 text-left transition-colors"
                style={{
                  backgroundColor: active ? 'var(--color-navy)' : 'var(--color-surface)',
                  borderColor: active ? 'var(--color-navy)' : 'var(--color-border)',
                  color: active ? '#FFFFFF' : 'var(--color-navy)',
                }}
              >
                <span className="text-xs font-semibold leading-tight">{item.shortLabel}</span>
                <span
                  className="tabular-nums mt-0.5 text-[11px]"
                  style={{ color: active ? '#CBD5E1' : 'var(--color-text-secondary)' }}
                >
                  {item.status === 'custom' ? 'Any px / KB' : `${item.minKB}–${item.maxKB} KB`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active preset metadata strip */}
        <div
          className="rounded-[12px] border p-4 text-sm"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold" style={{ color: 'var(--color-navy)' }}>
                {preset.exam} — {activeType === 'photo' ? 'Photograph' : 'Signature'}
              </span>
              <span className="mx-2" style={{ color: 'var(--color-border-strong)' }}>
                ·
              </span>
              <span className="tabular-nums font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Target: {targetWidth}×{targetHeight} px ({pxToMm(targetWidth, targetDpi)}×{pxToMm(targetHeight, targetDpi)} mm at {targetDpi} DPI) · {targetMinKB}–{targetMaxKB} KB · JPG
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Verified: <strong style={{ color: 'var(--color-navy)' }}>{preset.lastVerified}</strong>
              </span>
              {preset.sourceUrl && (
                <a
                  href={preset.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                  style={{ color: 'var(--color-saffron-text)' }}
                >
                  Official portal
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {preset.notes} Always check the latest official notification before submitting your form.
          </p>

          {/* Pending exam placeholders note */}
          <div className="mt-2.5 border-t pt-2.5 text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--color-navy)' }}>
              GATE, NEET (UG), RRB:
            </span>{' '}
            {PLACEHOLDER_EXAM_ROWS.map((row) => `${row.exam} ${row.photoSpec}`).join(' · ')}. Use{' '}
            <button
              type="button"
              onClick={() => setPresetId('custom')}
              className="font-semibold underline underline-offset-2"
              style={{ color: 'var(--color-saffron-text)' }}
            >
              Custom Size
            </button>{' '}
            with dimensions from your current notification.
          </div>
        </div>

        {/* Custom dimension controls */}
        {isCustom && (
          <div
            className="grid grid-cols-2 gap-3 rounded-[12px] border p-4 sm:grid-cols-3 lg:grid-cols-6"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Mode
              <select
                value={customMode}
                onChange={(e) => setCustomMode(e.target.value as 'photo' | 'signature')}
                className="pdf-input mt-1 min-h-[42px] w-full px-2.5 text-sm font-medium"
              >
                <option value="photo">Photo</option>
                <option value="signature">Signature</option>
              </select>
            </label>
            <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Width (px)
              <input
                type="number"
                min={40}
                max={4000}
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                className="pdf-input tabular-nums mt-1 min-h-[42px] w-full px-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Height (px)
              <input
                type="number"
                min={40}
                max={4000}
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                className="pdf-input tabular-nums mt-1 min-h-[42px] w-full px-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Min KB
              <input
                type="number"
                min={1}
                max={2000}
                value={customMinKB}
                onChange={(e) => setCustomMinKB(Number(e.target.value))}
                className="pdf-input tabular-nums mt-1 min-h-[42px] w-full px-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Max KB
              <input
                type="number"
                min={2}
                max={5000}
                value={customMaxKB}
                onChange={(e) => setCustomMaxKB(Number(e.target.value))}
                className="pdf-input tabular-nums mt-1 min-h-[42px] w-full px-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              DPI
              <input
                type="number"
                min={72}
                max={600}
                value={customDpi}
                onChange={(e) => setCustomDpi(Number(e.target.value))}
                className="pdf-input tabular-nums mt-1 min-h-[42px] w-full px-2.5 text-sm"
              />
            </label>
          </div>
        )}
      </section>

      {/* Error / Warning alerts */}
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

      {warningMsg && (
        <div
          className="flex items-start gap-2.5 rounded-[12px] border px-4 py-3 text-sm"
          style={{
            backgroundColor: 'var(--color-saffron-soft)',
            borderColor: 'var(--color-saffron-border)',
            color: 'var(--color-saffron-text)',
          }}
        >
          <Info className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          <span>{warningMsg}</span>
        </div>
      )}

      {/* Upload or Interactive Cropper + Export */}
      {!loadedImage ? (
        <FileDropzone
          id="exam-resizer-upload"
          accept="image/jpeg,image/png,image/webp"
          label={`Drop your ${activeType === 'photo' ? 'photograph' : 'signature'} here or browse`}
          helperText="Supports JPG, PNG (transparent backgrounds flatten to pure white), and WebP up to 25 MB."
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left column: Crop & Signature Cleanup */}
          <div className="pdf-card space-y-5 p-5 lg:col-span-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                2. Crop &amp; Frame ({targetWidth}×{targetHeight} px)
              </h3>
              <label className="cursor-pointer text-xs font-semibold underline underline-offset-2" style={{ color: 'var(--color-saffron-text)' }}>
                Replace image
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
              aspectRatio={targetWidth / targetHeight}
              guideMode={activeType === 'photo' ? 'face' : 'signature'}
              onCropChange={setCropRegion}
            />

            {/* Signature Cleanup Controls */}
            {activeType === 'signature' && (
              <div
                className="space-y-3 rounded-[12px] border p-4"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                    Signature Cleanup (Live Preview)
                  </span>
                  <label className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-navy)' }}>
                    <input
                      type="checkbox"
                      checked={sigEnhance.enabled}
                      onChange={(e) => setSigEnhance((s) => ({ ...s, enabled: e.target.checked }))}
                      className="h-4 w-4 accent-[#0F172A]"
                    />
                    Enable cleanup
                  </label>
                </div>

                {sigEnhance.enabled && (
                  <div className="space-y-3">
                    <label className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={sigEnhance.grayscale}
                        onChange={(e) => setSigEnhance((s) => ({ ...s, grayscale: e.target.checked }))}
                        className="h-4 w-4 accent-[#0F172A]"
                      />
                      Convert to crisp grayscale
                    </label>

                    <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      <div className="mb-1 flex justify-between">
                        <span>Ink contrast</span>
                        <span className="tabular-nums font-semibold" style={{ color: 'var(--color-navy)' }}>
                          {sigEnhance.contrast.toFixed(2)}×
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.7}
                        max={2.4}
                        step={0.05}
                        value={sigEnhance.contrast}
                        onChange={(e) => setSigEnhance((s) => ({ ...s, contrast: Number(e.target.value) }))}
                        className="w-full accent-[#0F172A]"
                      />
                    </label>

                    <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      <div className="mb-1 flex justify-between">
                        <span>Whiten paper background</span>
                        <span className="tabular-nums font-semibold" style={{ color: 'var(--color-navy)' }}>
                          {sigEnhance.whitenThreshold === 255 ? 'Off' : `Level ${255 - sigEnhance.whitenThreshold}`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={150}
                        max={255}
                        step={5}
                        value={sigEnhance.whitenThreshold}
                        onChange={(e) =>
                          setSigEnhance((s) => ({ ...s, whitenThreshold: Number(e.target.value) }))
                        }
                        className="w-full accent-[#0F172A]"
                      />
                    </label>

                    <div className="overflow-hidden rounded-[8px] border bg-white p-2" style={{ borderColor: 'var(--color-border)' }}>
                      <canvas ref={sigPreviewCanvasRef} className="mx-auto block max-w-full" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generate / Progress / Cancel */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleProcess}
                className="pdf-btn-primary inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Compressing ({progress}%)…
                  </>
                ) : (
                  <>Resize &amp; Verify for {preset.shortLabel}</>
                )}
              </button>

              {isProcessing && (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  className="pdf-btn-secondary inline-flex min-h-[46px] items-center gap-1.5 px-4 py-2.5 text-sm font-semibold"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </button>
              )}
            </div>

            {isProcessing && (
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: 'var(--color-saffron)' }}
                  />
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {progressDetail}
                </p>
              </div>
            )}
          </div>

          {/* Right column: Before/After Metrics & Download */}
          <div className="pdf-card flex flex-col justify-between space-y-5 p-5 lg:col-span-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                3. Exact Output Verification
              </h3>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-[12px] border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Original File</p>
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
                    {targetMinKB}–{targetMaxKB} KB · JPG
                  </p>
                  <p className="tabular-nums mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {targetWidth}×{targetHeight} px · {targetDpi} DPI
                  </p>
                </div>
              </div>

              {/* Verification Status Banner */}
              {result && (
                result.fitsRange ? (
                  <div
                    role="status"
                    className="flex items-start gap-2.5 rounded-[12px] border px-4 py-3 text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--color-success-bg)',
                      borderColor: 'var(--color-success-border)',
                      color: 'var(--color-success)',
                    }}
                  >
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="tabular-nums font-semibold">
                        Verified: Fits {preset.exam} rules ({formatKB(result.sizeBytes)})
                      </p>
                      <p className="tabular-nums mt-0.5 text-xs">
                        {result.width}×{result.height} px ({pxToMm(result.width, result.dpi)}×{pxToMm(result.height, result.dpi)} mm at {result.dpi} DPI) · Quality {Math.round(result.quality * 100)}%
                        {result.padded ? ' · Standards-safe JFIF COM padding applied to meet minimum KB' : ''}
                      </p>
                    </div>
                  </div>
                ) : (
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
                    <div>
                      <p className="font-semibold">Could not fit inside {targetMinKB}–{targetMaxKB} KB</p>
                      <p className="mt-0.5 text-xs">{result.failureReason}</p>
                    </div>
                  </div>
                )
              )}

              {/* Before / After visual comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Before (Original)
                  </span>
                  <div
                    className="flex h-44 items-center justify-center overflow-hidden rounded-[12px] border p-2"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                  >
                    {sourceUrl && (
                      <img
                        src={sourceUrl}
                        alt="Original uploaded image preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    After (Output JPG)
                  </span>
                  <div
                    className="flex h-44 items-center justify-center overflow-hidden rounded-[12px] border p-2"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                  >
                    {outputUrl ? (
                      <img
                        src={outputUrl}
                        alt="Resized and compressed exam output preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="px-3 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Click “Resize &amp; Verify” to generate exact output
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {result && (
                <dl className="grid grid-cols-3 gap-2 rounded-[12px] border p-3 text-xs" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <dt style={{ color: 'var(--color-text-secondary)' }}>Output Size</dt>
                    <dd className="tabular-nums mt-0.5 font-semibold" style={{ color: 'var(--color-navy)' }}>
                      {formatKB(result.sizeBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--color-text-secondary)' }}>Pixels</dt>
                    <dd className="tabular-nums mt-0.5 font-semibold" style={{ color: 'var(--color-navy)' }}>
                      {result.width}×{result.height} px
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--color-text-secondary)' }}>Print Size</dt>
                    <dd className="tabular-nums mt-0.5 font-semibold" style={{ color: 'var(--color-navy)' }}>
                      {pxToMm(result.width, result.dpi)}×{pxToMm(result.height, result.dpi)} mm
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            <button
              type="button"
              disabled={!result}
              onClick={handleDownload}
              className="pdf-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {result ? `Download JPG (${formatKB(result.sizeBytes)})` : 'Download JPG'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
