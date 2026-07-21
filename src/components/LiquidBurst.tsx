import { useEffect, useRef, useState } from "react";

/**
 * Full-screen ink burst — 1:1 rebuild against the reference clip.
 *
 * Layer stack (bottom→top):
 *   1. white halo polygon  — a slightly larger, softly wobbling shape;
 *      only its rim shows around the black core.
 *   2. red fringe polygon  — offset in one direction, revealed as a red
 *      edge on that side of the core.
 *   3. cyan fringe polygon — offset in the opposite direction, revealed
 *      as a cyan edge on the other side.
 *   4. black core polygon  — the actual ink mass.
 *
 * Optional horizontal glitch bars ride above the halo during mid-spread.
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
  const haloPolyRef = useRef<SVGPolygonElement>(null);
  const rPolyRef = useRef<SVGPolygonElement>(null);
  const kPolyRef = useRef<SVGPolygonElement>(null);
  const cPolyRef = useRef<SVGPolygonElement>(null);
  const glitch1Ref = useRef<SVGRectElement>(null);
  const glitch2Ref = useRef<SVGRectElement>(null);
  const glitch3Ref = useRef<SVGRectElement>(null);

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
    let glitchLastAt = 0;

    const POINTS = 48;

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
      lobes: number,
    ) => {
      const points: string[] = [];

      for (let i = 0; i < POINTS; i += 1) {
        const angle = (i / POINTS) * Math.PI * 2;
        // Big pseudopod lobes — grow the count as the burst matures.
        const lobe = Math.sin(angle * lobes + phase * 0.6) * 0.5;
        const midWave = smoothNoise(i * 0.28 - phase * 0.55, 12.3) - 0.5;
        const tooth = smoothNoise(i * 1.05 + phase * 1.1, 29.1) - 0.5;
        const wobble = lobe * 0.6 + midWave * 0.3 + tooth * 0.1;
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
      // Curve: quick pop off the fingertip, near-linear expansion, tiny elastic settle.
      let curved: number;
      if (rawP < 0.25) {
        const s = rawP / 0.25;
        curved = 0.18 * (1 - (1 - s) * (1 - s)); // easeOutQuad → 0.18
      } else if (rawP < 0.85) {
        const s = (rawP - 0.25) / 0.6;
        curved = 0.18 + s * 0.78; // linear expansion → 0.96
      } else {
        const s = (rawP - 0.85) / 0.15;
        curved = 0.96 + s * 0.04;
      }
      const endElastic = rawP > 0.85 ? Math.sin((rawP - 0.85) / 0.15 * Math.PI) * 0.02 : 0;
      const p = curved + endElastic;

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
      // Wilder early shape that calms down as it fills the screen.
      const roughness = 0.12 + (1 - Math.min(1, rawP)) * 0.18;
      const drift = 6 + Math.min(1, rawP) * 12;
      // Pseudopod count grows 2 → 4.
      const lobes = 2 + Math.floor(rawP * 2.5);
      seedT += 0.018;

      // Chromatic-aberration offset — a rotating vector that widens as the burst grows.
      const aberr = 8 + rawP * 10; // 8 → 18 px
      const aberrAngle = seedT * 0.4;
      const adx = Math.cos(aberrAngle) * aberr;
      const ady = Math.sin(aberrAngle) * aberr;

      // Halo sits just outside the core; shares core geometry so its rim tracks perfectly.
      const haloPoints = makePoints(centerX, centerY, radius + 16 + drift * 0.6, roughness * 0.95, drift, seedT, lobes);
      const redPoints = makePoints(centerX + adx, centerY + ady, radius + 8, roughness, drift, seedT, lobes);
      const cyanPoints = makePoints(centerX - adx, centerY - ady, radius + 8, roughness, drift, seedT, lobes);
      const blackPoints = makePoints(centerX, centerY, radius, roughness, drift * 0.75, seedT, lobes);

      setPoints(haloPolyRef.current, haloPoints);
      setPoints(rPolyRef.current, redPoints);
      setPoints(cPolyRef.current, cyanPoints);
      setPoints(kPolyRef.current, blackPoints);

      // Horizontal glitch bars — refresh every ~150ms during mid-spread.
      if (rawP > 0.15 && rawP < 0.85 && now - glitchLastAt > 150) {
        glitchLastAt = now;
        const bars = [glitch1Ref.current, glitch2Ref.current, glitch3Ref.current];
        const colors = ["#00e5ff", "#ff2fd8", "#a855f7"];
        bars.forEach((bar, i) => {
          if (!bar) return;
          const barY = Math.random() * height;
          const barH = 2 + Math.random() * 5;
          bar.setAttribute("x", "0");
          bar.setAttribute("y", barY.toFixed(1));
          bar.setAttribute("width", String(width));
          bar.setAttribute("height", barH.toFixed(1));
          bar.setAttribute("fill", colors[i]);
          bar.setAttribute("opacity", (0.25 + Math.random() * 0.25).toFixed(2));
        });
      } else if (rawP <= 0.15 || rawP >= 0.85) {
        [glitch1Ref.current, glitch2Ref.current, glitch3Ref.current].forEach((bar) => {
          if (bar) bar.setAttribute("opacity", "0");
        });
      }

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
      style={{ zIndex: 70 }}
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
          <polygon ref={haloPolyRef} points="0,0 0,0 0,0" fill="#f4ecdd" />
          <polygon ref={rPolyRef} points="0,0 0,0 0,0" fill="#ff2244" />
          <polygon ref={cPolyRef} points="0,0 0,0 0,0" fill="#00e5ff" />
          <polygon ref={kPolyRef} points="0,0 0,0 0,0" fill="#000000" />
          <rect ref={glitch1Ref} x="0" y="0" width="0" height="0" fill="#00e5ff" opacity="0" style={{ mixBlendMode: "screen" }} />
          <rect ref={glitch2Ref} x="0" y="0" width="0" height="0" fill="#ff2fd8" opacity="0" style={{ mixBlendMode: "screen" }} />
          <rect ref={glitch3Ref} x="0" y="0" width="0" height="0" fill="#a855f7" opacity="0" style={{ mixBlendMode: "screen" }} />
        </svg>
      </div>
    </div>
  );
}

export default LiquidBurst;