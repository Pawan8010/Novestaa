import { useEffect, useRef } from 'react';

interface Particle {
  nx: number;
  ny: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  baseLen: number;
  thickness: number;
  phase: number;
  orbitRadius: number;
  orbitSpeed: number;
  colorIdx: number;
  alphaBase: number;
}

function readParticlePalette(): string[] {
  const styles = getComputedStyle(document.documentElement);
  const tokens = [
    styles.getPropertyValue('--color-particle-blue').trim(),
    styles.getPropertyValue('--color-particle-indigo').trim(),
    styles.getPropertyValue('--color-particle-red').trim(),
    styles.getPropertyValue('--color-particle-amber').trim(),
    styles.getPropertyValue('--color-particle-teal').trim(),
    styles.getPropertyValue('--color-particle-slate').trim(),
  ];
  const fallbacks = [
    'rgb(66, 133, 244)',
    'rgb(94, 53, 177)',
    'rgb(234, 67, 53)',
    'rgb(251, 188, 4)',
    'rgb(15, 157, 88)',
    'rgb(95, 99, 104)',
  ];
  return tokens.map((val, i) => val || fallbacks[i]);
}

function createParticles(width: number, height: number): Particle[] {
  const isMobile = width < 768;
  const count = isMobile ? 72 : 180;
  const cols = isMobile ? 9 : 16;
  const rows = Math.ceil(count / cols);
  const particles: Particle[] = [];

  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (Math.random() - 0.5) * 0.88;
    const jitterY = (Math.random() - 0.5) * 0.88;
    const nx = Math.min(0.985, Math.max(0.015, (col + 0.5 + jitterX) / cols));
    const ny = Math.min(0.97, Math.max(0.03, (row + 0.5 + jitterY) / rows));

    // Favor cobalt/indigo tones with coral, amber, teal, and slate highlights like Antigravity
    const weightRoll = Math.random();
    let colorIdx = 0;
    if (weightRoll < 0.34) colorIdx = 0;
    else if (weightRoll < 0.52) colorIdx = 1;
    else if (weightRoll < 0.68) colorIdx = 2;
    else if (weightRoll < 0.82) colorIdx = 3;
    else if (weightRoll < 0.90) colorIdx = 4;
    else colorIdx = 5;

    particles.push({
      nx,
      ny,
      x: nx * width,
      y: ny * height,
      vx: 0,
      vy: 0,
      angle: Math.random() * Math.PI * 2,
      baseLen: 3.4 + Math.random() * 4.4,
      thickness: 1.55 + Math.random() * 0.65,
      phase: Math.random() * Math.PI * 2,
      orbitRadius: 8 + Math.random() * 14,
      orbitSpeed: 0.35 + Math.random() * 0.5,
      colorIdx,
      alphaBase: 0.34 + Math.random() * 0.32,
    });
  }

  return particles;
}

export function HeroParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = readParticlePalette();
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = canvas.parentElement?.clientWidth || window.innerWidth;
    let height = canvas.parentElement?.clientHeight || 540;
    let particles = createParticles(width, height);

    const pointer = {
      active: false,
      targetX: width * 0.5,
      targetY: height * 0.45,
      x: width * 0.5,
      y: height * 0.45,
      vx: 0,
      vy: 0,
      strength: 0,
    };

    const syncCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const nextWidth = Math.max(280, parent.clientWidth);
      const nextHeight = Math.max(320, parent.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, nextWidth < 768 ? 1.5 : 2);

      const resized =
        Math.abs(nextWidth - width) > 4 || Math.abs(nextHeight - height) > 4;
      width = nextWidth;
      height = nextHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (resized) {
        particles = createParticles(width, height);
      }
    };

    syncCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasSize();
      if (reducedMotion) {
        drawFrame(0);
      }
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left - 80 &&
        e.clientX <= rect.right + 80 &&
        e.clientY >= rect.top - 80 &&
        e.clientY <= rect.bottom + 80;

      if (!inside) {
        pointer.active = false;
        return;
      }

      const nextX = e.clientX - rect.left;
      const nextY = e.clientY - rect.top;
      pointer.vx = (nextX - pointer.targetX) * 0.45;
      pointer.vy = (nextY - pointer.targetY) * 0.45;
      pointer.targetX = nextX;
      pointer.targetY = nextY;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);

    let rafId = 0;
    let isVisible = true;
    const startTime = performance.now();

    function drawFrame(nowMs: number) {
      if (!ctx) return;
      const t = (nowMs - startTime) * 0.001;

      ctx.clearRect(0, 0, width, height);

      // Smooth pointer tracking + exponential decay of cursor impulse
      pointer.x += (pointer.targetX - pointer.x) * 0.18;
      pointer.y += (pointer.targetY - pointer.y) * 0.18;
      pointer.vx *= 0.88;
      pointer.vy *= 0.88;
      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.08;

      const influenceRadius = width < 768 ? 160 : 250;
      const ringRadius = width < 768 ? 78 : 118;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];

        const homeX =
          p.nx * width + Math.cos(t * p.orbitSpeed + p.phase) * p.orbitRadius;
        const homeY =
          p.ny * height + Math.sin(t * p.orbitSpeed * 0.85 + p.phase) * p.orbitRadius;

        if (!reducedMotion) {
          // Spring gently back to ambient drifting home point
          p.vx += (homeX - p.x) * 0.028;
          p.vy += (homeY - p.y) * 0.028;

          let proximityBoost = 0;
          if (pointer.strength > 0.01) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const dist = Math.hypot(dx, dy) || 0.001;

            if (dist < influenceRadius) {
              const norm = 1 - dist / influenceRadius;
              proximityBoost = norm * pointer.strength;

              // Repel particles right under the cursor to create a subtle open ring around arrow
              if (dist < ringRadius) {
                const push = ((ringRadius - dist) / ringRadius) * 2.4 * pointer.strength;
                p.vx += (dx / dist) * push;
                p.vy += (dy / dist) * push;
              } else {
                // Softly pull outer ring edges subtly inward for an orbital halo
                const haloPull = Math.sin(norm * Math.PI) * 0.42 * pointer.strength;
                p.vx -= (dx / dist) * haloPull;
                p.vy -= (dy / dist) * haloPull;
              }

              // Tangential swirl + wake impulse from moving arrow cursor
              const swirlSign = i % 2 === 0 ? 1 : -0.65;
              const swirl = norm * norm * 0.72 * swirlSign * pointer.strength;
              p.vx += (-dy / dist) * swirl + pointer.vx * norm * 0.22;
              p.vy += (dx / dist) * swirl + pointer.vy * norm * 0.22;
            }
          }

          p.vx *= 0.86;
          p.vy *= 0.86;
          p.x += p.vx;
          p.y += p.vy;

          const speed = Math.hypot(p.vx, p.vy);
          if (speed > 0.14) {
            const targetAngle = Math.atan2(p.vy, p.vx);
            const angleDiff =
              Math.atan2(
                Math.sin(targetAngle - p.angle),
                Math.cos(targetAngle - p.angle)
              );
            p.angle += angleDiff * 0.25;
          } else {
            p.angle += 0.004 * (i % 2 === 0 ? 1 : -1);
          }

          // Subtle center readability fade so headline & CTAs stay crisp
          const cx = (p.x - width * 0.5) / (width * 0.34);
          const cy = (p.y - height * 0.47) / (height * 0.34);
          const centerDistSq = cx * cx + cy * cy;
          const centerMask = centerDistSq < 1 ? 0.38 + 0.62 * centerDistSq : 1;

          const dashLen = p.baseLen + Math.min(11, speed * 2.1);
          const alpha = Math.min(0.92, (p.alphaBase + proximityBoost * 0.46) * centerMask);

          const halfLen = dashLen * 0.5;
          const cosA = Math.cos(p.angle);
          const sinA = Math.sin(p.angle);

          ctx.beginPath();
          ctx.moveTo(p.x - cosA * halfLen, p.y - sinA * halfLen);
          ctx.lineTo(p.x + cosA * halfLen, p.y + sinA * halfLen);
          ctx.strokeStyle = palette[p.colorIdx];
          ctx.lineWidth = p.thickness;
          ctx.lineCap = 'round';
          ctx.globalAlpha = alpha;
          ctx.stroke();
        } else {
          // Static constellation when prefers-reduced-motion is enabled
          const cx = (homeX - width * 0.5) / (width * 0.34);
          const cy = (homeY - height * 0.47) / (height * 0.34);
          const centerDistSq = cx * cx + cy * cy;
          const centerMask = centerDistSq < 1 ? 0.35 + 0.65 * centerDistSq : 1;

          const halfLen = p.baseLen * 0.5;
          const cosA = Math.cos(p.angle);
          const sinA = Math.sin(p.angle);

          ctx.beginPath();
          ctx.moveTo(homeX - cosA * halfLen, homeY - sinA * halfLen);
          ctx.lineTo(homeX + cosA * halfLen, homeY + sinA * halfLen);
          ctx.strokeStyle = palette[p.colorIdx];
          ctx.lineWidth = p.thickness;
          ctx.lineCap = 'round';
          ctx.globalAlpha = p.alphaBase * centerMask;
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;

      if (!reducedMotion && isVisible && !document.hidden) {
        rafId = window.requestAnimationFrame(drawFrame);
      } else {
        rafId = 0;
      }
    }

    const startLoop = () => {
      if (!rafId && !reducedMotion && isVisible && !document.hidden) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              isVisible = entry ? entry.isIntersecting : true;
              if (isVisible) {
                startLoop();
              } else if (rafId) {
                window.cancelAnimationFrame(rafId);
                rafId = 0;
              }
            },
            { threshold: 0.01 }
          )
        : null;

    intersectionObserver?.observe(canvas);

    const handleVisibilityChange = () => {
      if (document.hidden && rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!document.hidden) {
        startLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    drawFrame(performance.now());

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
