import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Loader2, X } from 'lucide-react';
import {
  formatFileSize,
  triggerBlobDownload,
  validatePdfFile,
} from '../engines/fileValidation';
import {
  extractPdfPages,
  formatPagesToRangeString,
  parsePageRanges,
  renderPdfThumbnails,
  type PdfThumbnailItem,
} from '../engines/pdfSplit';
import { FileDropzone, PrivacyBanner } from './shared/PrivacyBanner';

interface ExtractedOutput {
  blob: Blob;
  bytes: Uint8Array;
  pageCount: number;
  widthMm: number;
  heightMm: number;
  rangeLabel: string;
}

export const PdfSplitter: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceBytes, setSourceBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<PdfThumbnailItem[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rangeText, setRangeText] = useState('');
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [isLoadingThumbs, setIsLoadingThumbs] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetail, setProgressDetail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [output, setOutput] = useState<ExtractedOutput | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      for (const t of thumbnails) URL.revokeObjectURL(t.url);
    };
  }, [thumbnails]);

  const handleClearAll = () => {
    abortRef.current?.abort();
    for (const t of thumbnails) URL.revokeObjectURL(t.url);
    setSourceFile(null);
    setSourceBytes(null);
    setPageCount(0);
    setThumbnails([]);
    setSelectedPages([]);
    setRangeText('');
    setRangeError(null);
    setErrorMsg(null);
    setOutput(null);
    setIsLoadingThumbs(false);
    setProgress(0);
  };

  const handleFilesSelected = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    handleClearAll();

    const check = await validatePdfFile(file);
    if (!check.ok) {
      setErrorMsg(check.error || 'Invalid PDF file.');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoadingThumbs(true);
    setProgress(5);
    setProgressDetail('Reading PDF pages locally…');

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const loaded = await renderPdfThumbnails(bytes, controller.signal, (pct, detail) => {
        setProgress(pct);
        setProgressDetail(detail);
      });
      setSourceFile(file);
      setSourceBytes(bytes);
      setPageCount(loaded.pageCount);
      setThumbnails(loaded.thumbnails);
      const initial = loaded.pageCount > 0 ? [1] : [];
      setSelectedPages(initial);
      setRangeText(formatPagesToRangeString(initial));
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setErrorMsg(err instanceof Error ? err.message : 'Could not open PDF.');
      }
    } finally {
      setIsLoadingThumbs(false);
    }
  };

  const togglePage = (pageNum: number) => {
    setOutput(null);
    setRangeError(null);
    setSelectedPages((prev) => {
      const exists = prev.includes(pageNum);
      const next = exists ? prev.filter((p) => p !== pageNum) : [...prev, pageNum].sort((a, b) => a - b);
      setRangeText(formatPagesToRangeString(next));
      return next;
    });
  };

  const handleRangeChange = (value: string) => {
    setRangeText(value);
    setOutput(null);
    if (!pageCount) return;
    const parsed = parsePageRanges(value, pageCount);
    if (!parsed.valid) {
      setRangeError(parsed.error || 'Invalid page range.');
      setSelectedPages([]);
    } else {
      setRangeError(null);
      setSelectedPages(parsed.pages);
    }
  };

  const handleExtract = async () => {
    if (!sourceBytes || pageCount === 0) return;
    const parsed = parsePageRanges(rangeText, pageCount);
    if (!parsed.valid) {
      setRangeError(parsed.error || 'Enter valid page numbers.');
      return;
    }

    setIsExtracting(true);
    setErrorMsg(null);
    try {
      const res = await extractPdfPages(sourceBytes, parsed.pages);
      setOutput({
        ...res,
        rangeLabel: formatPagesToRangeString(parsed.pages),
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not extract selected pages.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyBanner hasFiles={Boolean(sourceFile || output)} onClearAll={handleClearAll} />

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

      {!sourceFile && !isLoadingThumbs && (
        <FileDropzone
          id="pdf-splitter-upload"
          accept="application/pdf,.pdf"
          label="Drop a PDF to split or extract pages"
          helperText="Extract a single admit card page or marksheet range (e.g. 1, 3-5) cleanly without re-compressing text."
          onFilesSelected={handleFilesSelected}
        />
      )}

      {isLoadingThumbs && (
        <div className="pdf-card space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {progressDetail || 'Rendering page thumbnails…'}
            </div>
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="pdf-btn-secondary inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancel
            </button>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: 'var(--color-saffron)' }}
            />
          </div>
        </div>
      )}

      {sourceFile && pageCount > 0 && (
        <div className="pdf-card space-y-5 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="min-w-[240px] flex-1 space-y-1.5">
              <label htmlFor="page-range-input" className="block text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
                Pages to extract from {sourceFile.name} ({pageCount} page{pageCount === 1 ? '' : 's'} · {formatFileSize(sourceFile.size)})
              </label>
              <input
                id="page-range-input"
                type="text"
                value={rangeText}
                onChange={(e) => handleRangeChange(e.target.value)}
                placeholder={`e.g. 1, 2-${Math.min(4, pageCount)}`}
                aria-invalid={Boolean(rangeError)}
                className="pdf-input tabular-nums min-h-[44px] w-full px-3.5 text-sm"
              />
              {rangeError && (
                <p role="alert" className="text-xs font-medium" style={{ color: 'var(--color-error)' }}>
                  {rangeError}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const all = Array.from({ length: pageCount }, (_, i) => i + 1);
                  setSelectedPages(all);
                  setRangeText(formatPagesToRangeString(all));
                  setRangeError(null);
                  setOutput(null);
                }}
                className="pdf-btn-secondary min-h-[44px] px-3.5 text-xs font-semibold"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPages([]);
                  setRangeText('');
                  setRangeError(null);
                  setOutput(null);
                }}
                className="pdf-btn-secondary min-h-[44px] px-3.5 text-xs font-semibold"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={isExtracting || selectedPages.length === 0 || Boolean(rangeError)}
                onClick={handleExtract}
                className="pdf-btn-primary inline-flex min-h-[44px] items-center gap-2 px-5 text-sm font-semibold"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Extracting…
                  </>
                ) : (
                  <>Extract {selectedPages.length} Page{selectedPages.length === 1 ? '' : 's'}</>
                )}
              </button>
            </div>
          </div>

          {output && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border px-4 py-3"
              style={{
                backgroundColor: 'var(--color-success-bg)',
                borderColor: 'var(--color-success-border)',
                color: 'var(--color-success)',
              }}
            >
              <div className="flex items-start gap-2 text-sm font-medium">
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                <span className="tabular-nums">
                  Extracted pages {output.rangeLabel} ({output.pageCount} page{output.pageCount === 1 ? '' : 's'}) · Output: {formatFileSize(output.bytes.length)} · {output.widthMm}×{output.heightMm} mm
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  triggerBlobDownload(
                    output.blob,
                    sourceFile.name.replace(/\.pdf$/i, '') + `-pages-${output.rangeLabel.replace(/[^0-9-]/g, '_')}.pdf`
                  )
                }
                className="pdf-btn-primary inline-flex min-h-[42px] items-center gap-2 px-4 text-xs font-semibold"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download Extracted PDF
              </button>
            </div>
          )}

          {/* Page Thumbnail Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {thumbnails.map((thumb) => {
              const checked = selectedPages.includes(thumb.pageNumber);
              return (
                <button
                  key={thumb.pageNumber}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => togglePage(thumb.pageNumber)}
                  className="group flex flex-col overflow-hidden rounded-[12px] border p-2 text-left transition-colors"
                  style={{
                    borderColor: checked ? 'var(--color-saffron)' : 'var(--color-border)',
                    backgroundColor: checked ? 'var(--color-saffron-soft)' : 'var(--color-bg)',
                  }}
                >
                  <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-[8px] bg-white">
                    <img
                      src={thumb.url}
                      alt={`Page ${thumb.pageNumber} thumbnail`}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
                    <span className="tabular-nums">Page {thumb.pageNumber}</span>
                    <span
                      className="h-4 w-4 rounded border text-center text-[10px] leading-4"
                      style={{
                        backgroundColor: checked ? 'var(--color-navy)' : '#FFFFFF',
                        borderColor: checked ? 'var(--color-navy)' : 'var(--color-border-strong)',
                        color: checked ? '#FFFFFF' : 'transparent',
                      }}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
