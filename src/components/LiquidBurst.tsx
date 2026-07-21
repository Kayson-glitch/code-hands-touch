import { useEffect, useRef, useState } from "react";

/**
 * Full-screen ink burst.
 *
 * Pure SVG — no WebGL — so it never fights the orb Canvas for a GPU context.
 * Three overlapping, fully opaque polygons (red / black / cyan) form a
 * chromatic-aberration edge. The irregular outline is generated directly as
 * a continuous polygon, avoiding displacement/clip-path transparency leaks.
 */
export function LiquidBurst({
  origin,
  onCovered,
  onFaded,
  onProgress,
  spreadMs = 1600,
  fadeMs = 280,
}: {
  /** Normalized viewport origin, x∈[0,1] left→right, y∈[0,1] bottom→top (WebGL-style). */
  origin: [number, number];
  onCovered: () => void;
  onFaded: () => void;
  onProgress?: (p: number) => void;
  spreadMs?: number;
  fadeMs?: number;
}) {
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const coveredAtRef = useRef<number | null>(null);
  const coveredRef = useRef(false);
  const fadedRef = useRef(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const rPolyRef = useRef<SVGPolygonElement>(null);
  const kPolyRef = useRef<SVGPolygonElement>(null);
  const cPolyRef = useRef<SVGPolygonElement>(null);

  const [ox, oy] = origin;
  // Convert WebGL-style y (bottom-origin) to SVG px (top-origin) in the rAF loop.

  // Callbacks in refs so the rAF loop always sees the latest.
  const cbRef = useRef({ onCovered, onFaded, onProgress });
  cbRef.current = { onCovered, onFaded, onProgress };

  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;
    let seedT = 0;

    const POINTS = 96;

    const hashNoise = (index: number, seed: number) => {
      const s = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453123;
      return s - Math.floor(s);
    };

    const smoothNoise = (index: number, seed: number) => {
      const whole = Math.floor(index);
      const frac = index - whole;
      const eased = frac * frac * (3 - 2 * frac);
      const a = hashNoise(whole, seed);
      const b = hashNoise(whole + 1, seed);
      return a + (b - a) * eased;
    };

    const makePoints = (
      centerX: number,
      centerY: number,
      radius: number,
      roughness: number,
      drift: number,
      phase: number,
    ) => {
      const points: string[] = [];

      for (let i = 0; i < POINTS; i += 1) {
        const angle = (i / POINTS) * Math.PI * 2;
        const longWave = smoothNoise(i * 0.1 + phase * 0.35, 4.7) - 0.5;
        const midWave = smoothNoise(i * 0.36 - phase * 0.7, 12.3) - 0.5;
        const tooth = smoothNoise(i * 1.18 + phase * 1.2, 29.1) - 0.5;
        const wobble = longWave * 0.44 + midWave * 0.36 + tooth * 0.2;
        const r = Math.max(0, radius * (1 + wobble * roughness));
        const tangent = Math.sin(angle * 3 + phase) * drift;
        const x = centerX + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * tangent;
        const y = centerY + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * tangent;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }

      return points.join(" ");
    };

    const setPoints = (el: SVGPolygonElement | null, points: string) => {
      if (!el) return;
      el.setAttribute("points", points);
    };

    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = now - startRef.current;
      const rawP = Math.min(1, t / spreadMs);
      // Keep the 2.6s as the actual spread duration: a smooth radial grow with
      // only a subtle elastic settle near the end, instead of an early overshoot.
      const smoothP = rawP * rawP * (3 - 2 * rawP);
      const endElastic = rawP > 0.82 ? Math.sin((rawP - 0.82) / 0.18 * Math.PI) * 0.035 : 0;
      const p = smoothP + endElastic;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const centerX = ox * width;
      const centerY = (1 - oy) * height;
      const maxRadius = Math.hypot(
        Math.max(centerX, width - centerX),
        Math.max(centerY, height - centerY),
      );
      const settledP = Math.min(1.035, Math.max(0, p));
      const radius = settledP * (maxRadius + 120);
      const roughness = 0.09 + (1 - Math.min(1, rawP)) * 0.13;
      const drift = 5 + Math.min(1, rawP) * 10;
      seedT += 0.018;

      const redPoints = makePoints(centerX - 7, centerY - 3, radius + 18, roughness * 1.08, drift, seedT + 0.5);
      const cyanPoints = makePoints(centerX + 7, centerY + 3, radius + 16, roughness, drift, seedT + 1.8);
      const blackPoints = makePoints(centerX, centerY, radius, roughness * 0.92, drift * 0.72, seedT);

      setPoints(rPolyRef.current, redPoints);
      setPoints(cPolyRef.current, cyanPoints);
      setPoints(kPolyRef.current, blackPoints);

      cbRef.current.onProgress?.(p);

      if (rawP >= 1 && !coveredRef.current) {
        coveredRef.current = true;
        coveredAtRef.current = now;
        cbRef.current.onCovered();
      }

      if (coveredAtRef.current != null && wrapRef.current) {
        const ft = now - coveredAtRef.current;
        const fp = Math.min(1, ft / fadeMs);
        const fe = fp < 0.5 ? 2 * fp * fp : 1 - Math.pow(-2 * fp + 2, 2) / 2;
        wrapRef.current.style.opacity = String(1 - fe);
        if (fp >= 1 && !fadedRef.current) {
          fadedRef.current = true;
          cbRef.current.onFaded();
          return; // stop the loop
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, spreadMs, fadeMs, ox, oy]);

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 55 }}
      aria-hidden
    >
      <div
        ref={wrapRef}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1,
          willChange: "opacity",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${typeof window === "undefined" ? 1 : window.innerWidth} ${typeof window === "undefined" ? 1 : window.innerHeight}`}
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
          }}
        >
          <polygon
            ref={rPolyRef}
            points="0,0 0,0 0,0"
            fill="#ff2244"
            style={{ mixBlendMode: "multiply" }}
          />
          <polygon
            ref={cPolyRef}
            points="0,0 0,0 0,0"
            fill="#00e5ff"
            style={{ mixBlendMode: "multiply" }}
          />
          <polygon ref={kPolyRef} points="0,0 0,0 0,0" fill="#000000" />
        </svg>
      </div>
    </div>
  );
}

export default LiquidBurst;