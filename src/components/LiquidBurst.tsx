import { useEffect, useId, useRef, useState } from "react";

/**
 * Full-screen ink burst.
 *
 * Pure CSS + SVG — no WebGL — so it never fights the orb Canvas for a GPU
 * context. Three overlapping radial gradients (red / black / cyan) form a
 * chromatic-aberration edge, and an `feTurbulence` + `feDisplacementMap`
 * filter wobbles the whole thing into an irregular ink shape.
 */
export function LiquidBurst({
  origin,
  onCovered,
  onFaded,
  onProgress,
  spreadMs = 1000,
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
  const filterId = useId().replace(/:/g, "");
  const filterUrl = `url(#ink-${filterId})`;

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const coveredAtRef = useRef<number | null>(null);
  const coveredRef = useRef(false);
  const fadedRef = useRef(false);

  const rRef = useRef<HTMLDivElement>(null);
  const kRef = useRef<HTMLDivElement>(null);
  const cRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);

  const [ox, oy] = origin;
  // Convert WebGL-style y (bottom-origin) to CSS % (top-origin).
  const cssX = ox * 100;
  const cssY = (1 - oy) * 100;

  // Callbacks in refs so the rAF loop always sees the latest.
  const cbRef = useRef({ onCovered, onFaded, onProgress });
  cbRef.current = { onCovered, onFaded, onProgress };

  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;
    let seedT = 0;
    let lastSeedTick = 0;

    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = now - startRef.current;
      const rawP = Math.min(1, t / spreadMs);
      const p = 1 - Math.pow(1 - rawP, 3); // easeOutCubic

      // Radius as % of the viewport's diagonal, from origin. 0 → ~130%
      // ensures coverage regardless of click position.
      const fill = p * 130;
      // Feathered outer band size (chromatic edge width in %).
      const feather = 6 + (1 - p) * 6;

      const setGrad = (
        el: HTMLDivElement | null,
        color: string,
        dx: number,
        dy: number,
      ) => {
        if (!el) return;
        const cx = cssX + dx;
        const cy = cssY + dy;
        el.style.background = `radial-gradient(circle at ${cx}% ${cy}%, ${color} 0%, ${color} ${fill}%, transparent ${fill + feather}%)`;
      };

      // Chromatic aberration: red pushed one way, cyan the other, black core
      // centered. Blend-mode multiply so all three darken toward black in the
      // overlap but leave color fringes on the leading edge.
      setGrad(rRef.current, "#ff2244", -0.9, -0.3);
      setGrad(kRef.current, "#000000", 0, 0);
      setGrad(cRef.current, "#00e5ff", 0.9, 0.3);

      // Turbulence displacement ramps up so the front looks increasingly
      // torn as it spreads.
      const displace = 10 + p * 60;
      dispRef.current?.setAttribute("scale", displace.toFixed(1));

      // Advance seed every ~90ms so the wobble flows without flickering.
      seedT += 16;
      if (now - lastSeedTick > 90) {
        lastSeedTick = now;
        const seed = Math.floor(seedT / 90) % 128;
        turbRef.current?.setAttribute("seed", String(seed));
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
  }, [ready, spreadMs, fadeMs, cssX, cssY]);

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 55 }}
      aria-hidden
    >
      {/* Hidden SVG hosting the displacement filter. */}
      <svg
        width="0"
        height="0"
        style={{ position: "absolute", pointerEvents: "none" }}
        aria-hidden
      >
        <defs>
          <filter
            id={`ink-${filterId}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.012 0.018"
              numOctaves={2}
              seed={0}
              result="noise"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noise"
              scale={10}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        ref={wrapRef}
        style={{
          position: "absolute",
          inset: 0,
          filter: filterUrl,
          WebkitFilter: filterUrl,
          opacity: 1,
          willChange: "opacity, filter",
        }}
      >
        <div
          ref={rRef}
          style={{
            position: "absolute",
            inset: 0,
            mixBlendMode: "multiply",
          }}
        />
        <div
          ref={cRef}
          style={{
            position: "absolute",
            inset: 0,
            mixBlendMode: "multiply",
          }}
        />
        <div
          ref={kRef}
          style={{
            position: "absolute",
            inset: 0,
          }}
        />
      </div>
    </div>
  );
}

export default LiquidBurst;