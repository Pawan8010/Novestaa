import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  GripVertical,
  Loader2,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  formatFileSize,
  triggerBlobDownload,
  validateImageFile,
  validatePdfFile,
} from '../engines/fileValidation';
import { mergeItemsToPdf, type MergeItem, type MergeResult } from '../engines/pdfMerge';
import { FileDropzone, PrivacyBanner } from './shared/PrivacyBanner';

export const PdfMerger: React.FC = () => {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [capUnder2MB, setCapUnder2MB] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetail, setProgressDetail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const totalInputBytes = items.reduce((acc, item) => acc + item.sizeBytes, 0);

  const handleClearAll = () => {
    abortRef.current?.abort();
    setItems([]);
    setResult(null);
    setErrorMsg(null);
    setIsMerging(false);
    setProgress(0);
    setProgressDetail('');
  };

  const handleFilesSelected = async (fileList: FileList) => {
    setErrorMsg(null);
    setResult(null);
    const added: MergeItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        const check = await validatePdfFile(file);
        if (!check.ok) {
          errors.push(`${file.name}: ${check.error}`);
          continue;
        }
        added.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          kind: 'pdf',
          rotation: 0,
          sizeBytes: file.size,
        });
      } else {
        const check = await validateImageFile(file);
        if (!check.ok) {
          errors.push(`${file.name}: ${check.error}`);
          continue;
        }
        added.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          kind: 'image',
          rotation: 0,
          sizeBytes: file.size,
        });
      }
    }

    if (errors.length > 0) {
      setErrorMsg(errors.join(' '));
    }
    if (added.length > 0) {
      setItems((prev) => [...prev, ...added]);
    }
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
    setResult(null);
  };

  const rotateItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, rotation: (((item.rotation + 90) % 360) as 0 | 90 | 180 | 270) }
          : item
      )
    );
    setResult(null);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setResult(null);
  };

  const handleMerge = async () => {
    if (items.length === 0) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsMerging(true);
    setErrorMsg(null);
    setProgress(5);
    setProgressDetail('Loading PDF merger…');

    try {
      const res = await mergeItemsToPdf(items, {
        maxSizeBytes: capUnder2MB ? 2 * 1024 * 1024 : undefined,
        signal: controller.signal,
        onProgress: (pct, detail) => {
          setProgress(pct);
          setProgressDetail(detail);
        },
      });
      setResult(res);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setProgressDetail('Merge cancelled');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to merge files.');
      }
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyBanner hasFiles={items.length > 0 || Boolean(result)} onClearAll={handleClearAll} />

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

      <FileDropzone
        id="pdf-merger-upload"
        accept="application/pdf,.pdf,image/jpeg,image/png,image/webp"
        multiple
        label={items.length > 0 ? 'Add more PDFs or images' : 'Drop PDFs, JPGs, or PNGs to merge'}
        helperText="Combine marksheets, Aadhaar, and certificates into one PDF. Images are automatically fitted onto A4 pages (210×297 mm) with clean margins."
        onFilesSelected={handleFilesSelected}
      />

      {items.length > 0 && (
        <div className="pdf-card space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                Merge Order ({items.length} file{items.length === 1 ? '' : 's'})
              </h3>
              <p className="tabular-nums text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Combined input size: {formatFileSize(totalInputBytes)} · Drag rows or use Up/Down buttons to reorder
              </p>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-navy)' }}>
              <input
                type="checkbox"
                checked={capUnder2MB}
                onChange={(e) => setCapUnder2MB(e.target.checked)}
                className="h-4 w-4 accent-[#0F172A]"
              />
              Keep final PDF under 2 MB (portal cap)
            </label>
          </div>

          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li
                key={item.id}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== idx) {
                    moveItem(dragIndex, idx);
                  }
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border px-3.5 py-2.5"
                style={{
                  borderColor: dragIndex === idx ? 'var(--color-saffron)' : 'var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <GripVertical
                    className="h-4 w-4 shrink-0 cursor-grab"
                    style={{ color: 'var(--color-text-muted)' }}
                    aria-hidden="true"
                  />
                  <span
                    className="tabular-nums flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-navy)', border: '1px solid var(--color-border)' }}
                  >
                    {idx + 1}
                  </span>
                  {item.kind === 'pdf' ? (
                    <FileText className="h-4 w-4 shrink-0" style={{ color: 'var(--color-saffron)' }} aria-hidden="true" />
                  ) : (
                    <FileImage className="h-4 w-4 shrink-0" style={{ color: 'var(--color-navy)' }} aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--color-navy)' }}>
                      {item.file.name}
                    </p>
                    <p className="tabular-nums text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {item.kind === 'pdf' ? 'PDF' : 'Image → A4'} · {formatFileSize(item.sizeBytes)}
                      {item.rotation > 0 ? ` · Rotated ${item.rotation}°` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    aria-label={`Move ${item.file.name} up`}
                    onClick={() => moveItem(idx, idx - 1)}
                    className="pdf-btn-secondary flex h-9 w-9 items-center justify-center"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    aria-label={`Move ${item.file.name} down`}
                    onClick={() => moveItem(idx, idx + 1)}
                    className="pdf-btn-secondary flex h-9 w-9 items-center justify-center"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Rotate ${item.file.name} 90 degrees`}
                    onClick={() => rotateItem(item.id)}
                    className="pdf-btn-secondary flex h-9 w-9 items-center justify-center"
                  >
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${item.file.name}`}
                    onClick={() => removeItem(item.id)}
                    className="pdf-btn-secondary flex h-9 w-9 items-center justify-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--color-error)' }} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isMerging}
              onClick={handleMerge}
              className="pdf-btn-primary inline-flex min-h-[46px] items-center gap-2 px-5 py-2.5 text-sm font-semibold"
            >
              {isMerging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Merging ({progress}%)…
                </>
              ) : (
                <>Merge {items.length} File{items.length === 1 ? '' : 's'} into PDF</>
              )}
            </button>

            {isMerging && (
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

          {isMerging && (
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

          {result && (
            <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-[12px] border px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: result.warningMessage ? 'var(--color-saffron-soft)' : 'var(--color-success-bg)',
                  borderColor: result.warningMessage ? 'var(--color-saffron-border)' : 'var(--color-success-border)',
                  color: result.warningMessage ? 'var(--color-saffron-text)' : 'var(--color-success)',
                }}
              >
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                <div className="tabular-nums">
                  <p>
                    Merged {result.totalPages} page{result.totalPages === 1 ? '' : 's'} · Final size: {formatFileSize(result.outputBytes)} · Standard A4 normalized (210×297 mm)
                    {result.compressed ? ' · Auto-compressed for 2 MB cap' : ''}
                  </p>
                  {result.warningMessage && <p className="mt-1 text-xs">{result.warningMessage}</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => triggerBlobDownload(result.blob, 'pdfindia-merged-documents.pdf')}
                className="pdf-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold sm:w-auto"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download Merged PDF ({formatFileSize(result.outputBytes)})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
