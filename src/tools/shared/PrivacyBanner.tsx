import React, { useRef, useState } from 'react';
import { ShieldCheck, Trash2, Upload } from 'lucide-react';

interface PrivacyBannerProps {
  hasFiles: boolean;
  onClearAll: () => void;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ hasFiles, onClearAll }) => {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border px-4 py-3"
      style={{
        backgroundColor: 'var(--color-surface-subtle)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2.5 text-sm font-medium" style={{ color: 'var(--color-navy)' }}>
        <ShieldCheck
          className="h-4.5 w-4.5 shrink-0"
          style={{ color: 'var(--color-success)' }}
          aria-hidden="true"
        />
        <span>Files never leave your device. Processed 100% locally in your browser.</span>
      </div>

      {hasFiles && (
        <button
          type="button"
          onClick={onClearAll}
          className="pdf-btn-secondary inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Clear all files
        </button>
      )}
    </div>
  );
};

interface FileDropzoneProps {
  id: string;
  accept: string;
  multiple?: boolean;
  label: string;
  helperText: string;
  disabled?: boolean;
  onFilesSelected: (files: FileList) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  id,
  accept,
  multiple = false,
  label,
  helperText,
  disabled = false,
  onFilesSelected,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleOpen = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={label}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className="group flex cursor-pointer flex-col items-center justify-center rounded-[16px] border-2 border-dashed px-6 py-8 text-center transition-colors"
      style={{
        borderColor: isDragging ? 'var(--color-saffron)' : 'var(--color-border-strong)',
        backgroundColor: isDragging ? 'var(--color-saffron-soft)' : 'var(--color-bg)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
            e.target.value = '';
          }
        }}
      />
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-[12px] border"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-navy)',
        }}
      >
        <Upload className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold sm:text-base" style={{ color: 'var(--color-navy)' }}>
        {label}
      </p>
      <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {helperText}
      </p>
      <span className="pdf-btn-primary mt-4 inline-flex min-h-[44px] items-center px-4 py-2 text-sm font-semibold">
        Choose file{multiple ? 's' : ''}
      </span>
    </div>
  );
};
