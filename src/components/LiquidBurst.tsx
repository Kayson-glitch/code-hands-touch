import { useEffect, useRef, useState } from "react";

/**
 * Full-screen ink burst.
 *
 * Pure CSS — no WebGL — so it never fights the orb Canvas for a GPU context.
 * Three overlapping, fully opaque clipped layers (red / black / cyan) form a
 * chromatic-aberration edge. The irregular outline is generated as a continuous
 * polygon, which avoids displacing transparent pixels into the ink body and
 * prevents the light background from flashing through edge burrs.
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

  const rRef = useRef<HTMLDivElement>(null);
  const kRef = useRef<HTMLDivElement>(null);
  const cRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [ox, oy] = origin;
  // Convert WebGL-style y (bottom-origin) to CSS px (top-origin) in the rAF loop.

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

    const makeClipPath = (
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
        points.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
      }

      return `polygon(${points.join(",")})`;
    };

    const setClip = (el: HTMLDivElement | null, clipPath: string) => {
      if (!el) return;
      el.style.clipPath = clipPath;
      el.style.webkitClipPath = clipPath;
    };

    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = now - startRef.current;
      const rawP = Math.min(1, t / spreadMs);
      // easeOutBack — overshoots slightly for an elastic settle.
      const c1 = 1.70158;
      const p =
        1 + (c1 + 1) * Math.pow(rawP - 1, 3) + c1 * Math.pow(rawP - 1, 2);

      const width = window.innerWidth;
      const height = window.innerHeight;
      const centerX = ox * width;
      const centerY = (1 - oy) * height;
      const maxRadius = Math.hypot(
        Math.max(centerX, width - centerX),
        Math.max(centerY, height - centerY),
      );
      const settledP = Math.min(1.08, Math.max(0, p));
      const radius = settledP * (maxRadius + 120);
      const roughness = 0.09 + (1 - Math.min(1, rawP)) * 0.13;
      const drift = 5 + Math.min(1, rawP) * 10;
      seedT += 0.018;

      const redClip = makeClipPath(centerX - 7, centerY - 3, radius + 18, roughness * 1.08, drift, seedT + 0.5);
      const cyanClip = makeClipPath(centerX + 7, centerY + 3, radius + 16, roughness, drift, seedT + 1.8);
      const blackClip = makeClipPath(centerX, centerY, radius, roughness * 0.92, drift * 0.72, seedT);

      setClip(rRef.current, redClip);
      setClip(cRef.current, cyanClip);
      setClip(kRef.current, blackClip);

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
        <div
          ref={rRef}
          style={{
            position: "absolute",
            inset: 0,
            background: "#ff2244",
            mixBlendMode: "multiply",
            willChange: "clip-path",
          }}
        />
        <div
          ref={cRef}
          style={{
            position: "absolute",
            inset: 0,
            background: "#00e5ff",
            mixBlendMode: "multiply",
            willChange: "clip-path",
          }}
        />
        <div
          ref={kRef}
          style={{
            position: "absolute",
            inset: 0,
            background: "#000000",
            willChange: "clip-path",
          }}
        />
      </div>
    </div>
  );
}

export default LiquidBurst;