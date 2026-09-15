import * as React from "react";
import { cn } from "@/lib/utils";

export interface SonarGridProps extends React.ComponentProps<"div"> {
  /** Distance between dots in CSS pixels. */
  spacing?: number;
  /** Dot radius at rest, in CSS pixels. */
  dotRadius?: number;
  /** Resting dot opacity (0–1). Dots on a wavefront rise toward `peakOpacity`. */
  baseOpacity?: number;
  /** Opacity a dot reaches at the wave peak (0–1). Lower it to keep the field quiet. */
  peakOpacity?: number;
  /** Any CSS color. Defaults to the theme's primary color, so it adapts to light/dark and brand themes. */
  color?: string;
  /** Seconds between ambient pings. Set 0 to disable them. */
  pingEvery?: number;
  /** Wavefront speed in CSS pixels per second. */
  speed?: number;
  /** Thickness of the wavefront in CSS pixels. */
  ringWidth?: number;
  /** How much a dot grows at the wave peak (0 = no growth, 2 = triple size). */
  amplitude?: number;
  /** Emit a ping where the user taps or clicks. */
  interactive?: boolean;
  /** Maximum simultaneous rings. Older rings are dropped first. */
  maxRings?: number;
  /** Start with one ring already mid-expansion so the very first frame shows the idea. */
  seedPing?: boolean;
  /** Where ambient pings (and the seed ping) may spawn, as fractions of width/height: [x0, y0, x1, y1]. */
  pingArea?: [number, number, number, number];
  /**
   * Optional halftone "shoreline": dots swell toward the bottom of the field,
   * with a slowly drifting noise edge and per-dot breathing, echoing a
   * halftone illustration. Omit to keep the plain grid.
   */
  shore?: ShoreOptions;
  /**
   * Optional colour stops (CSS hex) for dots on a wavefront. The gradient is
   * sampled left→right across the field and blended in with the wave energy,
   * so rings sweep through as translucent colour instead of darker ink.
   */
  waveGradient?: string[];
}

export interface ShoreOptions {
  /** Fraction of the height where the swell begins (0 = top, 1 = bottom). */
  start?: number;
  /** Largest dot radius at full coverage, in CSS pixels. Keep below spacing/2 so paper shows between dots. */
  maxRadius?: number;
  /** Ink ramp from the lightest to the darkest dot, as CSS hex colours. */
  ink?: [string, string];
  /** Coverage reached at the very bottom (0–1). */
  strength?: number;
  /** Noise feature size in CSS pixels; larger = broader, calmer edge. */
  noiseScale?: number;
  /** Noise drift speed in feature-lengths per second. */
  drift?: number;
  /** How much the noise disturbs the vertical ramp (0 = smooth gradient, 1 = full blotchy edge). */
  noiseMix?: number;
  /** Per-dot radius wobble as a fraction (0.08 = ±8%). */
  jitter?: number;
  /** Per-dot alpha breathing range. */
  breathe?: [number, number];
}

interface Ring {
  x: number;
  y: number;
  born: number;
}

const MAX_DPR = 2;
const TAU = Math.PI * 2;

const SHORE_DEFAULTS: Required<ShoreOptions> = {
  start: 0.55,
  maxRadius: 9,
  ink: ["#E8E8E8", "#B8B8B8"],
  strength: 0.55,
  noiseScale: 180,
  drift: 0.035,
  noiseMix: 1,
  jitter: 0.08,
  breathe: [0.8, 1],
};

/** Deterministic per-cell hash in 0..1 (same family as the hero halftone). */
const hash2 = (i: number, j: number) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const smooth = (t: number) => t * t * (3 - 2 * t);

/** 2-D value noise in 0..1 with a slow time offset folded into the lattice. */
const valueNoise = (x: number, y: number, t: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const ti = Math.floor(t);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const ft = smooth(t - ti);
  const layer = (k: number) => {
    const a = hash2(xi + k * 57, yi);
    const b = hash2(xi + 1 + k * 57, yi);
    const c = hash2(xi + k * 57, yi + 1);
    const d = hash2(xi + 1 + k * 57, yi + 1);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  };
  const n0 = layer(ti);
  const n1 = layer(ti + 1);
  return n0 + (n1 - n0) * ft;
};

type Rgb = [number, number, number];

/** Sample a list of colour stops at t in 0..1 (linear, evenly spaced). */
const sampleStops = (stops: Rgb[], t: number): Rgb => {
  if (stops.length === 1) return stops[0]!;
  const u = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(u));
  const f = u - i;
  const a = stops[i]!;
  const b = stops[i + 1]!;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
};

const parseRgb = (css: string): Rgb | null => {
  const m = css.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

const hexToRgb = (hex: string): Rgb => {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * SonarGrid — a decorative dot field that answers taps with expanding rings.
 * Canvas-based and theme-aware (it reads the resolved `text-primary` color), it idles
 * when no ring is alive, pauses off-screen and in hidden tabs, and renders a still grid
 * under `prefers-reduced-motion`. Children render on top of the field.
 */
export function SonarGrid({
  spacing = 26,
  dotRadius = 1.4,
  baseOpacity = 0.28,
  peakOpacity = 1,
  color,
  pingEvery = 2.4,
  speed = 260,
  ringWidth = 90,
  amplitude = 2.2,
  interactive = true,
  maxRings = 6,
  seedPing = true,
  pingArea = [0.15, 0.2, 0.85, 0.8],
  shore,
  waveGradient,
  className,
  children,
  ref,
  ...rest
}: SonarGridProps) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ringsRef = React.useRef<Ring[]>([]);
  const refreshRef = React.useRef<() => void>(() => {});

  // The render loop reads props through this ref so knob changes apply live without restarting it.
  const opts = React.useRef({
    spacing,
    dotRadius,
    baseOpacity,
    peakOpacity,
    pingEvery,
    speed,
    ringWidth,
    amplitude,
    interactive,
    maxRings,
    seedPing,
    pingArea,
    shore,
    waveGradient,
  });
  opts.current = {
    spacing,
    dotRadius,
    baseOpacity,
    peakOpacity,
    pingEvery,
    speed,
    ringWidth,
    amplitude,
    interactive,
    maxRings,
    seedPing,
    pingArea,
    shore,
    waveGradient,
  };

  const setHost = React.useCallback(
    (node: HTMLDivElement | null) => {
      hostRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  React.useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let raf = 0;
    let timer = 0;
    let visible = true;
    let seeded = false;
    let stroke = "";
    let nextPing = performance.now() + opts.current.pingEvery * 1000;

    const readColor = () => {
      stroke = getComputedStyle(canvas).color;
    };

    const addRing = (x: number, y: number, born: number) => {
      readColor();
      const rings = ringsRef.current;
      rings.push({ x, y, born });
      while (rings.length > opts.current.maxRings) rings.shift();
    };

    const draw = (now: number) => {
      const o = opts.current;
      const lifetime = (Math.hypot(width, height) + o.ringWidth) / o.speed; // seconds until a ring leaves the canvas
      ringsRef.current = ringsRef.current.filter((r) => (now - r.born) / 1000 < lifetime);
      const live = ringsRef.current.map((r) => {
        const age = (now - r.born) / 1000;
        const radius = age * o.speed;
        return { x: r.x, y: r.y, radius, reach: radius + o.ringWidth, fade: 1 - age / lifetime };
      });

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = stroke;

      const cols = Math.ceil(width / o.spacing) + 1;
      const rows = Math.ceil(height / o.spacing) + 1;
      const offsetX = (width - (cols - 1) * o.spacing) / 2;
      const offsetY = (height - (rows - 1) * o.spacing) / 2;

      const sh = o.shore ? { ...SHORE_DEFAULTS, ...o.shore } : null;
      const still = reduceMotion.matches;
      const tSec = now / 1000;
      const inkA = sh ? hexToRgb(sh.ink[0]) : null;
      const inkB = sh ? hexToRgb(sh.ink[1]) : null;

      // Pass 1: every resting dot in a single path and a single fill.
      // Dots on a wavefront or inside the shoreline are deferred to pass 2.
      const hot: number[] = [];
      const shoreDots: number[] = [];
      ctx.globalAlpha = o.baseOpacity;
      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        const cx = offsetX + i * o.spacing;
        for (let j = 0; j < rows; j++) {
          const cy = offsetY + j * o.spacing;
          let energy = 0;
          for (const r of live) {
            if (Math.abs(cx - r.x) > r.reach || Math.abs(cy - r.y) > r.reach) continue;
            const dist = Math.abs(Math.hypot(cx - r.x, cy - r.y) - r.radius);
            if (dist >= o.ringWidth) continue;
            const t = 1 - dist / o.ringWidth;
            const k = t * t * (3 - 2 * t) * r.fade; // smoothstep, fading with age
            if (k > energy) energy = k;
          }

          let coverage = 0;
          if (sh) {
            const v = (cy / height - sh.start) / (1 - sh.start);
            if (v > 0) {
              // Vertical swell shaped by drifting noise, so the edge frays
              // unevenly instead of reading as a straight tide line.
              const n = valueNoise(cx / sh.noiseScale, cy / sh.noiseScale, still ? 0 : tSec * sh.drift);
              const ramp = smooth(Math.min(1, v));
              coverage = Math.min(1, ramp * sh.strength * (1 + sh.noiseMix * (1.1 * n - 0.55)));
              // Scattered dissolve: the faintest cells survive only sometimes.
              if (coverage < 0.16 && hash2(i, j) > coverage / 0.16) coverage = 0;
            }
          }

          if (coverage >= 0.02) {
            shoreDots.push(i, j, cx, cy, coverage, energy);
          } else if (energy < 0.01) {
            ctx.moveTo(cx + o.dotRadius, cy);
            ctx.arc(cx, cy, o.dotRadius, 0, TAU);
          } else {
            hot.push(cx, cy, energy);
          }
        }
      }
      ctx.fill();

      // Pass 2a: only the dots on a wavefront get their own alpha and radius.
      // With a wave gradient, the ink blends toward the sampled colour as the
      // energy rises, so the ring reads as translucent colour passing through.
      const waveStops = o.waveGradient && o.waveGradient.length > 0 ? o.waveGradient.map(hexToRgb) : null;
      const inkRgb = waveStops ? parseRgb(stroke) : null;
      for (let k = 0; k < hot.length; k += 3) {
        const cx = hot[k] ?? 0;
        const cy = hot[k + 1] ?? 0;
        const energy = hot[k + 2] ?? 0;
        if (waveStops && inkRgb) {
          const c = sampleStops(waveStops, cx / Math.max(1, width));
          const r = Math.round(inkRgb[0] + (c[0] - inkRgb[0]) * energy);
          const g = Math.round(inkRgb[1] + (c[1] - inkRgb[1]) * energy);
          const b = Math.round(inkRgb[2] + (c[2] - inkRgb[2]) * energy);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        }
        ctx.globalAlpha = o.baseOpacity + (o.peakOpacity - o.baseOpacity) * energy;
        ctx.beginPath();
        ctx.arc(cx, cy, o.dotRadius * (1 + o.amplitude * energy), 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = stroke;

      // Pass 2b: shoreline dots — area carries tone, ink deepens with coverage,
      // each dot breathes and wobbles on its own slow phase.
      if (sh && inkA && inkB) {
        for (let k = 0; k < shoreDots.length; k += 6) {
          const i = shoreDots[k] ?? 0;
          const j = shoreDots[k + 1] ?? 0;
          const cx = shoreDots[k + 2] ?? 0;
          const cy = shoreDots[k + 3] ?? 0;
          const coverage = shoreDots[k + 4] ?? 0;
          const energy = shoreDots[k + 5] ?? 0;
          const phase = hash2(i * 3 + 11, j * 7 + 5) * TAU;
          const period = 4 + hash2(i + 101, j + 37) * 3; // 4–7s per dot
          const osc = still ? 0 : Math.sin((tSec / period) * TAU + phase);
          const wobble = 1 + sh.jitter * osc;
          const breathe = sh.breathe[0] + (sh.breathe[1] - sh.breathe[0]) * (0.5 + 0.5 * osc);
          const radius = Math.max(o.dotRadius, sh.maxRadius * Math.sqrt(coverage)) * wobble * (1 + o.amplitude * energy * 0.5);
          const mix = Math.min(1, coverage);
          const r = Math.round(inkA[0] + (inkB[0] - inkA[0]) * mix);
          const g = Math.round(inkA[1] + (inkB[1] - inkA[1]) * mix);
          const b = Math.round(inkA[2] + (inkB[2] - inkA[2]) * mix);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.globalAlpha = Math.min(1, breathe + energy * 0.2);
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = stroke;
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!seeded) {
        // One ring already mid-expansion inside the ping area, so the first paint shows the idea.
        seeded = true;
        const [x0, y0, x1, y1] = opts.current.pingArea;
        if (opts.current.seedPing && !reduceMotion.matches)
          addRing(width * (x0 + (x1 - x0) * 0.68), height * (y0 + (y1 - y0) * 0.34), performance.now() - 500);
      }
      draw(performance.now());
    };

    const scheduleIdle = (delay: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => tick(performance.now()), Math.max(16, delay));
    };

    const tick = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (reduceMotion.matches) {
        ringsRef.current = [];
        draw(now);
        return;
      }
      const o = opts.current;
      if (o.pingEvery > 0 && now >= nextPing) {
        const [x0, y0, x1, y1] = o.pingArea;
        addRing(width * (x0 + Math.random() * (x1 - x0)), height * (y0 + Math.random() * (y1 - y0)), now);
        nextPing = now + o.pingEvery * 1000;
      }
      draw(now);
      // The shoreline breathes continuously, so it never idles.
      if (ringsRef.current.length > 0 || o.shore) raf = requestAnimationFrame(tick);
      else if (o.pingEvery > 0) scheduleIdle(nextPing - now);
    };

    const wake = () => {
      if (!raf) {
        window.clearTimeout(timer);
        raf = requestAnimationFrame(tick);
      }
    };

    refreshRef.current = () => {
      readColor();
      nextPing = Math.min(nextPing, performance.now() + opts.current.pingEvery * 1000);
      wake();
    };

    const onDown = (e: PointerEvent) => {
      if (!opts.current.interactive || reduceMotion.matches) return;
      const rect = host.getBoundingClientRect();
      addRing(e.clientX - rect.left, e.clientY - rect.top, performance.now());
      wake();
    };
    const onVisibility = () => {
      if (!document.hidden) wake();
    };

    const ro = new ResizeObserver(resize);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible) wake();
      },
      { threshold: 0 },
    );
    const mo = new MutationObserver(() => refreshRef.current());

    readColor();
    resize();
    ro.observe(host);
    io.observe(host);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    host.addEventListener("pointerdown", onDown);
    document.addEventListener("visibilitychange", onVisibility);
    reduceMotion.addEventListener("change", wake);
    wake();

    return () => {
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      host.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMotion.removeEventListener("change", wake);
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      refreshRef.current = () => {};
    };
  }, []);

  // Prop changes while the loop is asleep still repaint immediately.
  React.useEffect(() => {
    refreshRef.current();
  }, [spacing, dotRadius, baseOpacity, peakOpacity, color, pingEvery, speed, ringWidth, amplitude, interactive, maxRings, pingArea, shore, waveGradient]);

  return (
    <div
      ref={setHost}
      data-slot="sonar-grid"
      className={cn("relative isolate overflow-hidden", interactive && "cursor-crosshair", className)}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="text-primary pointer-events-none absolute inset-0 -z-10 size-full"
        style={color ? { color } : undefined}
      />
      {children}
    </div>
  );
}

export default SonarGrid;
