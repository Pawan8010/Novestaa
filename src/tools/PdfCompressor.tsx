import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import {
  formatFileSize,
  formatKB,
  triggerBlobDownload,
  validatePdfFile,
} from '../engines/fileValidation';
import { compressPdfToTarget, type PdfCompressResult } from '../engines/pdfCompress';
import { FileDropzone, PrivacyBanner } from './shared/PrivacyBanner';

interface TargetPreset {
  id: string;
  label: string;
  sublabel: string;
  bytes: number;
}

const PDF_TARGETS: TargetPreset[] = [
  { id: '2mb', label: 'Under 2 MB', sublabel: 'UPSC / Passport Seva', bytes: 2 * 1024 * 1024 },
  { id: '1mb', label: 'Under 1 MB', sublabel: 'State PSC / DigiLocker', bytes: 1024 * 1024 },
  { id: '500kb', label: 'Under 500 KB', sublabel: 'SSC / IBPS Certificates', bytes: 500 * 1024 },
  { id: '200kb', label: 'Under 200 KB', sublabel: 'Single Marksheet / ID', bytes: 200 * 1024 },
];

export const PdfCompressor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetId, setTargetId] = useState<string>('500kb');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetail, setProgressDetail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [result, setResult] = useState<PdfCompressResult | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const activeTarget = PDF_TARGETS.find((t) => t.id === targetId) || PDF_TARGETS[2];

  useEffect(() => {
    return () => {
      if (result?.firstPagePreviewUrl) {
        URL.revokeObjectURL(result.firstPagePreviewUrl);
      }
    };
  }, [result]);

  const handleClearAll = () => {
    abortRef.current?.abort();
    if (result?.firstPagePreviewUrl) {
      URL.revokeObjectURL(result.firstPagePreviewUrl);
    }
    setSelectedFile(null);
    setResult(null);
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
    if (result?.firstPagePreviewUrl) URL.revokeObjectURL(result.firstPagePreviewUrl);
    setResult(null);

    const check = await validatePdfFile(file);
    if (!check.ok) {
      setErrorMsg(check.error || 'Please select a valid PDF file.');
      return;
    }
    if (check.warning) setWarningMsg(check.warning);
    setSelectedFile(file);
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsProcessing(true);
    setErrorMsg(null);
    setProgress(5);
    setProgressDetail('Loading PDF engine locally…');

    try {
      const inputBytes = new Uint8Array(await selectedFile.arrayBuffer());
      const res = await compressPdfToTarget(inputBytes, {
        targetMaxBytes: activeTarget.bytes,
        signal: controller.signal,
        onProgress: (pct, detail) => {
          setProgress(pct);
          setProgressDetail(detail);
        },
      });
      if (result?.firstPagePreviewUrl) URL.revokeObjectURL(result.firstPagePreviewUrl);
      setResult(res);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setProgressDetail('Compression cancelled');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'PDF compression failed.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyBanner hasFiles={Boolean(selectedFile || result)} onClearAll={handleClearAll} />

      {/* Explicit Rasterization Disclosure */}
      <div
        className="flex items-start gap-2.5 rounded-[12px] border px-4 py-3 text-sm"
        style={{
          backgroundColor: 'var(--color-saffron-soft)',
          borderColor: 'var(--color-saffron-border)',
          color: 'var(--color-saffron-text)',
        }}
      >
        <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
        <span>
          Compression turns pages into images, so text will not be selectable. Keep your original file.
        </span>
      </div>

      {/* Target Size Selector */}
      <div className="space-y-2.5">
        <span className="block text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
          1. Choose Target Portal Limit
        </span>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {PDF_TARGETS.map((preset) => {
            const active = preset.id === targetId;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTargetId(preset.id)}
                className="min-h-[54px] rounded-[12px] border px-3.5 py-2.5 text-left transition-colors"
                style={{
                  backgroundColor: active ? 'var(--color-navy)' : 'var(--color-surface)',
                  borderColor: active ? 'var(--color-navy)' : 'var(--color-border)',
                  color: active ? '#FFFFFF' : 'var(--color-navy)',
                }}
              >
                <div className="text-sm font-semibold">{preset.label}</div>
                <div
                  className="text-xs"
                  style={{ color: active ? '#CBD5E1' : 'var(--color-text-secondary)' }}
                >
                  {preset.sublabel}
                </div>
              </button>
            );
          })}
        </div>
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

      {warningMsg && (
        <div
          className="rounded-[12px] border px-4 py-3 text-xs"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {warningMsg}
        </div>
      )}

      {!selectedFile ? (
        <FileDropzone
          id="pdf-compressor-upload"
          accept="application/pdf,.pdf"
          label="Drop your PDF document here or browse"
          helperText="Supports multi-page certificates, marksheets, and forms up to 50 MB. Password-protected PDFs must be unlocked first."
          onFilesSelected={handleFilesSelected}
        />
      ) : (
        <div className="pdf-card space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[10px] border"
                style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
              >
                <FileText className="h-5 w-5" style={{ color: 'var(--color-saffron)' }} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                  {selectedFile.name}
                </p>
                <p className="tabular-nums text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Original: {formatFileSize(selectedFile.size)} · Target: {activeTarget.label}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCompress}
                className="pdf-btn-primary inline-flex min-h-[44px] items-center gap-2 px-5 py-2.5 text-sm font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Compressing ({progress}%)…
                  </>
                ) : (
                  <>Compress to {activeTarget.label}</>
                )}
              </button>

              {isProcessing && (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  className="pdf-btn-secondary inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2.5 text-sm font-semibold"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </button>
              )}
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-1.5">
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

          {result && (
            <div className="grid gap-5 md:grid-cols-12">
              <div className="space-y-4 md:col-span-8">
                {result.reachedTarget ? (
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
                    <span className="tabular-nums">
                      Compressed to {formatFileSize(result.outputBytes)} ({formatKB(result.outputBytes)}) — fits {activeTarget.label} at {result.usedDpi} DPI.
                    </span>
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
                    <span>{result.warningMessage}</span>
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div className="rounded-[10px] border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                    <dt style={{ color: 'var(--color-text-secondary)' }}>Before</dt>
                    <dd className="tabular-nums mt-1 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                      {formatFileSize(result.originalBytes)}
                    </dd>
                  </div>
                  <div className="rounded-[10px] border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                    <dt style={{ color: 'var(--color-text-secondary)' }}>After</dt>
                    <dd className="tabular-nums mt-1 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                      {formatFileSize(result.outputBytes)}
                    </dd>
                  </div>
                  <div className="rounded-[10px] border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                    <dt style={{ color: 'var(--color-text-secondary)' }}>Saved</dt>
                    <dd className="tabular-nums mt-1 text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                      {result.savedPercent > 0 ? `${result.savedPercent}%` : '0%'}
                    </dd>
                  </div>
                  <div className="rounded-[10px] border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                    <dt style={{ color: 'var(--color-text-secondary)' }}>Page Size</dt>
                    <dd className="tabular-nums mt-1 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                      {result.pageWidthMm}×{result.pageHeightMm} mm
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() =>
                    triggerBlobDownload(
                      result.blob,
                      selectedFile.name.replace(/\.pdf$/i, '') + `-compressed-${targetId}.pdf`
                    )
                  }
                  className="pdf-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download Compressed PDF ({formatFileSize(result.outputBytes)})
                </button>
              </div>

              {/* First-page legibility preview */}
              <div className="space-y-1.5 md:col-span-4">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Page 1 Legibility Preview ({result.usedDpi} DPI)
                </span>
                <div
                  className="flex h-52 items-center justify-center overflow-hidden rounded-[12px] border p-2"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
                >
                  {result.firstPagePreviewUrl ? (
                    <img
                      src={result.firstPagePreviewUrl}
                      alt="First page of compressed PDF preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Preview ready
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
