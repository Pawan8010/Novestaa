import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  geoContains,
  geoDistance,
  geoGraticule10,
  geoInterpolate,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import worldAtlas from 'world-atlas/land-110m.json';
import type { ReachCity } from '../config/site';

interface GlobeProps {
  cities: ReachCity[];
  homeCityId: string;
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
}

interface LandDot {
  lng: number;
  lat: number;
}

interface GlobePalette {
  surfaceInverse: string;
  accentSignal: string;
  globeDot: string;
  globeHairline: string;
  inverseInk: string;
  inverseMuted: string;
}

function clampLatitude(lat: number): number {
  return Math.max(-60, Math.min(60, lat));
}

function buildLandDots(landGeo: GeoPermissibleObjects, targetMax: number): LandDot[] {
  const dots: LandDot[] = [];
  const baseStep = 2.2;

  for (let lat = -82; lat <= 82; lat += baseStep) {
    const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    const lngStep = baseStep / cosLat;

    for (let lng = -180; lng < 180; lng += lngStep) {
      if (geoContains(landGeo, [lng, lat])) {
        dots.push({ lng, lat });
      }
    }
  }

  if (dots.length <= targetMax) return dots;

  const stride = dots.length / targetMax;
  const sampled: LandDot[] = [];
  for (let i = 0; i < targetMax; i += 1) {
    sampled.push(dots[Math.floor(i * stride)]);
  }
  return sampled;
}

function readPalette(): GlobePalette {
  const styles = getComputedStyle(document.documentElement);
  return {
    surfaceInverse: styles.getPropertyValue('--color-surface-inverse').trim() || '#000000',
    accentSignal: styles.getPropertyValue('--color-accent-signal').trim() || '#00a3ff',
    globeDot:
      styles.getPropertyValue('--color-globe-dot').trim() || 'rgba(211, 237, 248, 0.36)',
    globeHairline:
      styles.getPropertyValue('--color-globe-hairline').trim() || 'rgba(214, 235, 253, 0.14)',
    inverseInk: styles.getPropertyValue('--color-inverse-ink').trim() || '#f0f0f0',
    inverseMuted:
      styles.getPropertyValue('--color-ink-secondary').trim() || '#a1a4a5',
  };
}

export default function Globe({
  cities,
  homeCityId,
  selectedCityId,
  onSelectCity,
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [size, setSize] = useState(480);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const homeCity = useMemo(
    () => cities.find((c) => c.id === homeCityId) || cities[0],
    [cities, homeCityId]
  );
  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) || homeCity,
    [cities, selectedCityId, homeCity]
  );

  const landGeo = useMemo(() => {
    const topology = worldAtlas as unknown as Topology;
    const landObj = topology.objects.land;
    return feature(topology, landObj);
  }, []);

  const landDots = useMemo(
    () => buildLandDots(landGeo, isMobileViewport ? 1200 : 2400),
    [landGeo, isMobileViewport]
  );

  const graticule = useMemo(() => geoGraticule10(), []);

  const rotationRef = useRef<[number, number, number]>([
    -selectedCity.lng,
    clampLatitude(-selectedCity.lat),
    0,
  ]);

  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
  });

  const hoveredIdRef = useRef<string | null>(null);
  const paletteRef = useRef<GlobePalette | null>(null);

  useEffect(() => {
    hoveredIdRef.current = hoveredCityId;
  }, [hoveredCityId]);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const next = Math.max(260, Math.round(el.clientWidth));
      setSize(next);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!paletteRef.current) {
      paletteRef.current = readPalette();
    }
    const palette = paletteRef.current;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelSize = Math.round(size * dpr);
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const radius = size * 0.43;
    const center = size / 2;

    const projection = geoOrthographic()
      .scale(radius)
      .translate([center, center])
      .clipAngle(90)
      .rotate(rotationRef.current);

    const path = geoPath(projection, ctx);

    // 1. Subtle sphere rim + faint graticule
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = palette.surfaceInverse;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = palette.globeHairline;
    ctx.stroke();

    ctx.beginPath();
    path(graticule);
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = palette.globeHairline;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.globalAlpha = 1;

    const viewCenter: [number, number] = [-rotationRef.current[0], -rotationRef.current[1]];

    // 2. Dotted land matrix (front hemisphere dots)
    ctx.fillStyle = palette.globeDot;
    for (let i = 0; i < landDots.length; i += 1) {
      const dot = landDots[i];
      const dist = geoDistance(viewCenter, [dot.lng, dot.lat]);
      if (dist > Math.PI / 2 - 0.02) continue;

      const pt = projection([dot.lng, dot.lat]);
      if (!pt) continue;

      const horizonFade = Math.max(0.25, Math.cos(dist));
      ctx.globalAlpha = horizonFade;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], isMobileViewport ? 1.15 : 1.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 3. Static lifted great-circle arcs from homeCity to target cities
    const arcCities = cities.filter((c) => c.id !== homeCity.id);
    for (let i = 0; i < arcCities.length; i += 1) {
      const target = arcCities[i];
      const isSelectedArc = target.id === selectedCity.id;
      const isHoveredArc = target.id === hoveredIdRef.current;

      const interp = geoInterpolate(
        [homeCity.lng, homeCity.lat],
        [target.lng, target.lat]
      );
      const geoDist = geoDistance(
        [homeCity.lng, homeCity.lat],
        [target.lng, target.lat]
      );
      const segments = 32;
      const liftFactor = Math.min(0.28, 0.08 + geoDist * 0.075);

      const screenPts: Array<[number, number] | null> = [];
      for (let s = 0; s <= segments; s += 1) {
        const t = s / segments;
        const coord = interp(t);
        const distFromCenter = geoDistance(viewCenter, coord);
        if (distFromCenter > Math.PI / 2 + 0.08) {
          screenPts.push(null);
          continue;
        }

        const flatProjection = projection(coord);
        if (!flatProjection) {
          screenPts.push(null);
          continue;
        }

        const arcLift = Math.sin(t * Math.PI) * radius * liftFactor;
        const dx = flatProjection[0] - center;
        const dy = flatProjection[1] - center;
        const len = Math.hypot(dx, dy) || 1;
        const liftedX = flatProjection[0] + (dx / len) * arcLift;
        const liftedY = flatProjection[1] + (dy / len) * arcLift;
        screenPts.push([liftedX, liftedY]);
      }

      ctx.save();
      ctx.beginPath();
      let penDown = false;
      for (let s = 0; s < screenPts.length; s += 1) {
        const pt = screenPts[s];
        if (!pt) {
          penDown = false;
          continue;
        }
        if (!penDown) {
          ctx.moveTo(pt[0], pt[1]);
          penDown = true;
        } else {
          ctx.lineTo(pt[0], pt[1]);
        }
      }

      if (isSelectedArc || isHoveredArc) {
        ctx.strokeStyle = palette.accentSignal;
        ctx.lineWidth = isSelectedArc ? 1.8 : 1.3;
        ctx.globalAlpha = isSelectedArc ? 0.95 : 0.72;
        ctx.setLineDash([5, 5]);
      } else {
        ctx.strokeStyle = palette.accentSignal;
        ctx.lineWidth = 0.9;
        ctx.globalAlpha = 0.24;
        ctx.setLineDash([3, 6]);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. City pins + static selection ring + decluttered labels
    const placedLabelBoxes: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

    const orderedCities = [...cities].sort((a, b) => {
      const rank = (c: ReachCity) =>
        c.id === selectedCity.id ? 2 : c.id === homeCity.id ? 1 : 0;
      return rank(a) - rank(b);
    });

    const labelPriorityCities = [...cities].sort((a, b) => {
      const rank = (c: ReachCity) =>
        c.id === selectedCity.id ? 0 : c.id === homeCity.id ? 1 : 2;
      return rank(a) - rank(b);
    });

    const visibleCityPositions = new Map<string, [number, number]>();

    for (let i = 0; i < orderedCities.length; i += 1) {
      const city = orderedCities[i];
      const dist = geoDistance(viewCenter, [city.lng, city.lat]);
      if (dist > Math.PI / 2 - 0.02) continue;

      const pt = projection([city.lng, city.lat]);
      if (!pt) continue;
      visibleCityPositions.set(city.id, pt);

      const isSelected = city.id === selectedCity.id;
      const isHome = city.id === homeCity.id;
      const isHovered = city.id === hoveredIdRef.current;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 9, 0, Math.PI * 2);
        ctx.strokeStyle = palette.accentSignal;
        ctx.lineWidth = 1.25;
        ctx.globalAlpha = 0.65;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(
        pt[0],
        pt[1],
        isSelected ? 4.6 : isHome || isHovered ? 3.8 : 2.8,
        0,
        Math.PI * 2
      );
      ctx.fillStyle =
        isSelected || isHome || isHovered ? palette.accentSignal : palette.inverseInk;
      ctx.fill();
    }

    ctx.font = '500 11px ui-monospace, "Geist Mono", "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < labelPriorityCities.length; i += 1) {
      const city = labelPriorityCities[i];
      const pt = visibleCityPositions.get(city.id);
      if (!pt) continue;

      const isSelected = city.id === selectedCity.id;
      const isHome = city.id === homeCity.id;
      const isHovered = city.id === hoveredIdRef.current;

      const labelText = city.city.toUpperCase();
      const metrics = ctx.measureText(labelText);
      const textWidth = metrics.width;
      const labelX = pt[0] + 9;
      const labelY = pt[1];

      const box = {
        x1: labelX - 4,
        y1: labelY - 9,
        x2: labelX + textWidth + 6,
        y2: labelY + 9,
      };

      if (box.x2 > size - 6 || box.y1 < 6 || box.y2 > size - 6) continue;

      const collides = placedLabelBoxes.some(
        (existing) =>
          !(
            box.x2 < existing.x1 ||
            box.x1 > existing.x2 ||
            box.y2 < existing.y1 ||
            box.y1 > existing.y2
          )
      );
      if (collides && !isSelected) continue;

      placedLabelBoxes.push(box);

      ctx.fillStyle =
        isSelected || isHovered
          ? palette.accentSignal
          : isHome
            ? palette.inverseInk
            : palette.inverseMuted;
      ctx.globalAlpha = isSelected || isHome || isHovered ? 1 : 0.78;
      ctx.fillText(labelText, labelX, labelY);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }, [cities, graticule, homeCity, isMobileViewport, landDots, selectedCity.id, size]);

  // Center immediately when selectedCity changes and draw deterministically (no background animation loop)
  useEffect(() => {
    rotationRef.current = [-selectedCity.lng, clampLatitude(-selectedCity.lat), 0];
    drawScene();
  }, [selectedCity.id, selectedCity.lng, selectedCity.lat, drawScene]);

  // Redraw when hover highlights or canvas size updates
  useEffect(() => {
    drawScene();
  }, [hoveredCityId, drawScene]);

  const hitTestCity = (
    clientX: number,
    clientY: number
  ): { city: ReachCity; x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const radius = size * 0.43;
    const center = size / 2;
    const projection = geoOrthographic()
      .scale(radius)
      .translate([center, center])
      .clipAngle(90)
      .rotate(rotationRef.current);

    const viewCenter: [number, number] = [-rotationRef.current[0], -rotationRef.current[1]];

    let best: { city: ReachCity; x: number; y: number; dist: number } | null = null;
    for (let i = 0; i < cities.length; i += 1) {
      const city = cities[i];
      if (geoDistance(viewCenter, [city.lng, city.lat]) > Math.PI / 2 - 0.02) continue;
      const pt = projection([city.lng, city.lat]);
      if (!pt) continue;
      const dist = Math.hypot(x - pt[0], y - pt[1]);
      if (dist <= 18 && (!best || dist < best.dist)) {
        best = { city, x: pt[0], y: pt[1], dist };
      }
    }

    return best ? { city: best.city, x: best.x, y: best.y } : null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current.active && dragRef.current.pointerId === e.pointerId) {
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      const totalMoved = Math.hypot(
        e.clientX - dragRef.current.startX,
        e.clientY - dragRef.current.startY
      );
      if (totalMoved > 4) {
        dragRef.current.moved = true;
      }

      const degPerPx = 0.28;
      rotationRef.current = [
        rotationRef.current[0] + dx * degPerPx,
        clampLatitude(rotationRef.current[1] - dy * degPerPx),
        0,
      ];
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      setHoveredCityId(null);
      setTooltipPos(null);
      drawScene();
      return;
    }

    const hit = hitTestCity(e.clientX, e.clientY);
    if (hit) {
      setHoveredCityId(hit.city.id);
      setTooltipPos({ x: hit.x, y: hit.y });
    } else {
      setHoveredCityId(null);
      setTooltipPos(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const wasClick = !dragRef.current.moved;
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    setIsDragging(false);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (wasClick) {
      const hit = hitTestCity(e.clientX, e.clientY);
      if (hit) {
        onSelectCity(hit.city.id);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const step = 10;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      rotationRef.current = [rotationRef.current[0] - step, rotationRef.current[1], 0];
      drawScene();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      rotationRef.current = [rotationRef.current[0] + step, rotationRef.current[1], 0];
      drawScene();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      rotationRef.current = [
        rotationRef.current[0],
        clampLatitude(rotationRef.current[1] + step),
        0,
      ];
      drawScene();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      rotationRef.current = [
        rotationRef.current[0],
        clampLatitude(rotationRef.current[1] - step),
        0,
      ];
      drawScene();
    }
  };

  const hoveredCity = hoveredCityId ? cities.find((c) => c.id === hoveredCityId) : null;

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full select-none overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)]"
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label={`Interactive global reach globe centered on ${selectedCity.city}, ${selectedCity.country}. Drag or use arrow keys to rotate, or click a city pin.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          setHoveredCityId(null);
          setTooltipPos(null);
        }}
        onKeyDown={handleKeyDown}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`block touch-none rounded-[var(--radius-lg)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-signal)] ${
          isDragging
            ? 'cursor-grabbing'
            : hoveredCity
              ? 'cursor-pointer'
              : 'cursor-grab'
        }`}
      />

      {hoveredCity && tooltipPos && !isDragging && (
        <div
          role="tooltip"
          style={{
            left: `${Math.min(Math.max(tooltipPos.x, 70), size - 70)}px`,
            top: `${Math.max(tooltipPos.y - 18, 22)}px`,
          }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-[var(--color-globe-hairline)] bg-[var(--color-surface-inverse)] px-3 py-1 text-[12px] text-[var(--color-inverse-ink)] shadow-lg"
        >
          <span className="font-medium text-[var(--color-accent-signal)]">
            {hoveredCity.city}
          </span>{' '}
          <span className="text-[var(--color-surface-strong)]">· {hoveredCity.country}</span>
        </div>
      )}
    </div>
  );
}
