import React, { useEffect, useRef, useState } from 'react';
import { Move, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { CropRegion } from '../../engines/imageCompress';

interface ImageCropperProps {
  image: HTMLImageElement;
  aspectRatio: number; // width / height
  guideMode: 'face' | 'signature' | 'none';
  backgroundFill?: string;
  onCropChange: (crop: CropRegion) => void;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  image,
  aspectRatio,
  guideMode,
  backgroundFill = '#FFFFFF',
  onCropChange,
}) => {
  const [zoom, setZoom] = useState(1);
  // Normalized pan offset in [-1, 1] relative to available slack
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset crop when image or aspect ratio changes
  useEffect(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, [image, aspectRatio]);

  // Compute source crop rectangle in natural image pixels
  const computeCrop = (z: number, px: number, py: number): CropRegion => {
    const natW = image.naturalWidth || 1;
    const natH = image.naturalHeight || 1;
    const imgAspect = natW / natH;

    // Base crop covering maximum area of the image at zoom=1 with locked aspectRatio
    let baseW: number;
    let baseH: number;
    if (imgAspect > aspectRatio) {
      baseH = natH;
      baseW = baseH * aspectRatio;
    } else {
      baseW = natW;
      baseH = baseW / aspectRatio;
    }

    const sw = clamp(baseW / z, 16, natW);
    const sh = clamp(baseH / z, 16, natH);

    const maxSlackX = Math.max(0, (natW - sw) / 2);
    const maxSlackY = Math.max(0, (natH - sh) / 2);

    const centerX = natW / 2 - px * maxSlackX;
    const centerY = natH / 2 - py * maxSlackY;

    const sx = clamp(centerX - sw / 2, 0, Math.max(0, natW - sw));
    const sy = clamp(centerY - sh / 2, 0, Math.max(0, natH - sh));

    return { sx, sy, sw, sh };
  };

  // Emit crop and paint live preview canvas
  useEffect(() => {
    const crop = computeCrop(zoom, panX, panY);
    onCropChange(crop);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const previewW = 360;
    const previewH = Math.max(120, Math.round(previewW / aspectRatio));
    if (canvas.width !== previewW || canvas.height !== previewH) {
      canvas.width = previewW;
      canvas.height = previewH;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = backgroundFill;
    ctx.fillRect(0, 0, previewW, previewH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, previewW, previewH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, aspectRatio, zoom, panX, panY, backgroundFill]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX,
      panY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStartRef.current.x) / Math.max(rect.width * 0.45, 40);
    const dy = (e.clientY - dragStartRef.current.y) / Math.max(rect.height * 0.45, 40);
    setPanX(clamp(dragStartRef.current.panX + dx, -1, 1));
    setPanY(clamp(dragStartRef.current.panY + dy, -1, 1));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 0.08;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPanX((v) => clamp(v - step, -1, 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPanX((v) => clamp(v + step, -1, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPanY((v) => clamp(v - step, -1, 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPanY((v) => clamp(v + step, -1, 1));
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setZoom((z) => clamp(Number((z + 0.1).toFixed(2)), 1, 3));
    } else if (e.key === '-') {
      e.preventDefault();
      setZoom((z) => clamp(Number((z - 0.1).toFixed(2)), 1, 3));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
          <Move className="h-3.5 w-3.5" aria-hidden="true" />
          Drag to position · Locked aspect ratio
        </span>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPanX(0);
            setPanY(0);
          }}
          className="pdf-btn-secondary inline-flex min-h-[34px] items-center gap-1 px-2.5 py-1 text-xs font-medium"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset crop
        </button>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        role="application"
        aria-label="Interactive image crop frame. Drag or use arrow keys to adjust position, plus or minus to zoom."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative mx-auto w-full max-w-[340px] select-none overflow-hidden rounded-[12px] border"
        style={{
          aspectRatio: `${aspectRatio}`,
          borderColor: 'var(--color-navy)',
          backgroundColor: backgroundFill,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />

        {/* Centered face guide overlay */}
        {guideMode === 'face' && (
          <svg
            viewBox="0 0 100 120"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <ellipse
              cx="50"
              cy="47"
              rx="28"
              ry="34"
              fill="none"
              stroke="#EA580C"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.9"
            />
            <line
              x1="50"
              y1="8"
              x2="50"
              y2="112"
              stroke="#0F172A"
              strokeWidth="0.6"
              strokeDasharray="2 3"
              opacity="0.35"
            />
            <line
              x1="12"
              y1="45"
              x2="88"
              y2="45"
              stroke="#0F172A"
              strokeWidth="0.6"
              strokeDasharray="2 3"
              opacity="0.35"
            />
          </svg>
        )}

        {/* Signature horizontal baseline guide */}
        {guideMode === 'signature' && (
          <svg
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <rect
              x="6"
              y="8"
              width="88"
              height="34"
              fill="none"
              stroke="#EA580C"
              strokeWidth="0.9"
              strokeDasharray="3 2"
              opacity="0.85"
            />
          </svg>
        )}
      </div>

      {/* Zoom control */}
      <div className="mx-auto flex max-w-[340px] items-center gap-2.5">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => clamp(Number((z - 0.15).toFixed(2)), 1, 3))}
          className="pdf-btn-secondary flex h-9 w-9 shrink-0 items-center justify-center"
        >
          <ZoomOut className="h-4 w-4" aria-hidden="true" />
        </button>
        <label className="flex flex-1 items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="sr-only">Zoom level</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#0F172A]"
          />
          <span className="tabular-nums w-10 text-right font-semibold" style={{ color: 'var(--color-navy)' }}>
            {zoom.toFixed(2)}×
          </span>
        </label>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => clamp(Number((z + 0.15).toFixed(2)), 1, 3))}
          className="pdf-btn-secondary flex h-9 w-9 shrink-0 items-center justify-center"
        >
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
