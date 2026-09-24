import { useEffect, useRef } from "react";
import { handsFramesAsset } from "@/lib/media";
import {
  DYE_STRENGTH,
  FluidField,
  INK_STOPS,
  breathWave,
  dyeAt,
} from "@/components/HalftoneHandsFooter";
import { useHeroLayout } from "@/hooks/useHeroLayout";

/**
 * Halftone rendering of ONE hand, taken from the same sprite atlas the homepage
 * uses. The frame is frozen (no scroll scrub), but the interaction language is
 * identical to the first screen: pointer parallax, slow tonal breathing,
 * per-dot alpha breathing and the ink-fluid dye trail under the cursor.
 */

const ATLAS_COLS = 7;
const FRAME_COUNT = 49;
const FRAME_W = 320;
const FRAME_H = 178;

const DOT_FILL = 0.9;
const MIN_DENSITY = 0.05;
const SQUARE_AT = 0.88;
/** Light ink stops — the homepage hands' ramp, so tone matches the first screen. */
const INK_STOPS_LIGHT: Array<[number, number, number]> = INK_STOPS;
/** Homepage fluid grid: 110 cells across the viewport → dye radius in CSS px. */
const FLUID_TARGET_COLS = 110;
/** Dark ink stops — mirror of the light set, for light/white backgrounds. */
const INK_STOPS_DARK: Array<[number, number, number]> = [
  [0x7d, 0x7d, 0x7d],
  [0x4b, 0x4b, 0x4b],
  [0x23, 0x23, 0x23],
];

// Matches the homepage hands.
const PARALLAX_X = 6;
const PARALLAX_Y = 4;
const BREATH_AMP = 0.035;
const BREATH_PERIOD = 5200;
const DOT_ALPHA_AMP = 0.2;
const DOT_ALPHA_PERIOD = 5000;
// Entrance: the print "develops" — dots grow in from nothing on a scattered
// stagger with a gentle left → right drift, in step with the hero copy reveal.
const ENTER_MS = 1400;
const ENTER_WINDOW = 0.35;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

function inkAt(d: number, stops: Array<[number, number, number]>) {
  const t = Math.min(1, Math.max(0, d));
  const seg = t < 0.5 ? 0 : 1;
  const f = seg === 0 ? t / 0.5 : (t - 0.5) / 0.5;
  const a = stops[seg];
  const b = stops[seg + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

function hash2(i: number, j: number) {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

type Dot = {
  x: number;
  y: number;
  d: number;
  /** 0 = edge, 1 = centre of the composition — parallax weight. */
  cx: number;
  alphaPhase: number;
  alphaSpeed: number;
  /** Entrance stagger, 0..1 − ENTER_WINDOW (fraction of the entrance). */
  enterDelay: number;
};

type Props = {
  /**
   * Any grayscale image on a white background to halftone instead of the hands
   * atlas. Dark = ink. When set, `frame` is ignored and the crop fractions
   * apply to this image.
   */
  src?: string;
  /**
   * Tone multiplier applied to darkness before dot sizing (1 = as drawn).
   * Marble renders are very light; ~1.7 brings them to the hands' weight.
   */
  contrast?: number;
  /** Atlas frame to freeze on (defaults to the last frame). */
  frame?: number;
  /** Horizontal crop of the source frame, 0..1. Defaults to the right hand. */
  cropX?: number;
  cropW?: number;
  /** Vertical crop of the source frame, 0..1. */
  cropY?: number;
  cropH?: number;
  /** Dot pitch in CSS px. Defaults to the homepage hands' pitch for the current viewport. */
  pitch?: number;
  /** Ink tone: "light" (default, for dark backgrounds) or "dark" (for light backgrounds). */
  ink?: "light" | "dark";
  className?: string;
  style?: React.CSSProperties;
};

export function HalftoneHandStill({
  src,
  contrast = 1,
  frame = FRAME_COUNT - 1,
  cropX = 0.44,
  cropW = 0.56,
  cropY = 0,
  cropH = 1,
  pitch: pitchProp,
  ink = "light",
  className,
  style,
}: Props) {
  const layout = useHeroLayout();
  // Same rule as HalftoneHandsFooter, so dots are the same size on every page.
  const pitch = pitchProp ?? Math.max(5, Math.round(layout.cellSize * 0.62));
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ tx: 0, ty: 0, x: 0, y: 0 });
  const fluidRef = useRef<FluidField | null>(null);

  useEffect(() => {
    let alive = true;
    let raf = 0;
    let atlas: HTMLImageElement | null = null;
    let dots: Dot[] = [];
    // Set on the first successful build; resizes later on rebuild the field
    // without replaying the entrance.
    let enterStart = 0;
    const stops = ink === "dark" ? INK_STOPS_DARK : INK_STOPS_LIGHT;
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const maxR = pitch * 0.5 * DOT_FILL;

    /** Rebuild the dot field for the current host size. */
    const build = () => {
      const host = hostRef.current;
      const canvas = canvasRef.current;
      if (!host || !canvas || !atlas) return;
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 4 || h < 4) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Match the homepage's fluid cell size in CSS px (its grid spans the
      // viewport), so the cursor's dye trail covers the same area here.
      const fluidCols = Math.round((FLUID_TARGET_COLS * w) / Math.max(w, window.innerWidth));
      fluidRef.current = new FluidField(w, h, Math.max(16, fluidCols));

      // Source rectangle: a frame of the hands atlas, or the whole custom image.
      const baseW = src ? atlas.naturalWidth : FRAME_W;
      const baseH = src ? atlas.naturalHeight : FRAME_H;
      // Contain-fit the cropped source so the subject keeps its aspect ratio.
      const srcAr = (cropW * baseW) / (cropH * baseH);
      let drawW = w;
      let drawH = drawW / srcAr;
      if (drawH > h) {
        drawH = h;
        drawW = drawH * srcAr;
      }
      const offX = (w - drawW) * 0.5;
      const offY = (h - drawH) * 0.5;

      const cols = Math.max(1, Math.floor(drawW / pitch));
      const rows = Math.max(1, Math.floor(drawH / pitch));

      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.fillStyle = "#ffffff";
      octx.fillRect(0, 0, cols, rows);
      octx.imageSmoothingEnabled = true;
      const idx = Math.min(FRAME_COUNT - 1, Math.max(0, frame));
      const sx = src ? cropX * baseW : (idx % ATLAS_COLS) * FRAME_W + cropX * FRAME_W;
      const sy = src ? cropY * baseH : Math.floor(idx / ATLAS_COLS) * FRAME_H + cropY * FRAME_H;
      (octx as unknown as { filter: string }).filter = "blur(0.5px)";
      octx.drawImage(atlas, sx, sy, cropW * baseW, cropH * baseH, 0, 0, cols, rows);
      (octx as unknown as { filter: string }).filter = "none";
      const data = octx.getImageData(0, 0, cols, rows).data;

      const next: Dot[] = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const p = (j * cols + i) * 4;
          const rawLuma = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
          const luma = 1 - Math.min(1, (1 - rawLuma) * contrast);
          const t = Math.min(1, Math.max(0, (1 - luma - 0.02) / 0.88));
          let density = Math.pow(t, 0.8);
          const dither = (BAYER[(j & 3) * 4 + (i & 3)] - 0.5) * 0.07;
          density = Math.min(1, Math.max(0, density + dither));
          if (density < MIN_DENSITY) continue;
          const keep = smoothstep((density - MIN_DENSITY) / 0.22);
          if (hash2(i, j) > 0.16 + keep * 0.84) continue;

          const nx = cols > 1 ? i / (cols - 1) : 0.5;
          next.push({
            x: offX + (i + 0.5) * pitch,
            y: offY + (j + 0.5) * pitch,
            d: density,
            cx: 1 - Math.abs(nx * 2 - 1),
            alphaPhase: hash2(i * 3.7, j * 1.9) * Math.PI * 2,
            alphaSpeed: 0.7 + hash2(j * 5.1, i * 2.3) * 0.6,
            enterDelay: (1 - ENTER_WINDOW) * (0.7 * hash2(i * 1.3 + 7, j * 2.1 + 3) + 0.3 * nx),
          });
        }
      }
      dots = next;
      if (!enterStart && next.length) enterStart = performance.now();
    };

    const draw = (now: number, last: { t: number }) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const dt = last.t ? Math.min(0.05, (now - last.t) / 1000) : 0.016;
      last.t = now;

      const p = pointerRef.current;
      if (prefersReduce) {
        p.x = 0;
        p.y = 0;
      } else {
        p.x += (p.tx - p.x) * 0.06;
        p.y += (p.ty - p.y) * 0.06;
      }

      const breath = prefersReduce
        ? 1
        : 1 + Math.sin((now / BREATH_PERIOD) * Math.PI * 2) * BREATH_AMP;

      const fluid = fluidRef.current;
      if (fluid && !prefersReduce) fluid.step(dt);

      const enter = prefersReduce || !enterStart ? 1 : Math.min(1, (now - enterStart) / ENTER_MS);

      for (let k = 0; k < dots.length; k++) {
        const dot = dots[k];

        // Entrance: each dot grows and fades in over its own slice of the run.
        let grow = 1;
        let fade = 1;
        if (enter < 1) {
          const local = (enter - dot.enterDelay) / ENTER_WINDOW;
          if (local <= 0) continue;
          fade = local >= 1 ? 1 : local;
          grow = 1 - Math.pow(1 - fade, 3);
        }

        const weight = 0.35 + dot.cx * 0.65;
        const x = dot.x + p.x * PARALLAX_X * weight;
        const y = dot.y + p.y * PARALLAX_Y * weight;

        const dye = fluid ? Math.min(1, fluid.sample(x, y)) : 0;
        const radiusScale = 1 + dye * 0.06;

        const raw = Math.min(1, dot.d * breath);
        const d = raw < 0.8 ? raw : 0.8 + (raw - 0.8) * 0.7;
        const r = Math.max(0.35, maxR * Math.sqrt(d) * radiusScale * grow);

        ctx.globalAlpha =
          (prefersReduce
            ? 1
            : 1 -
              breathWave(
                (now / DOT_ALPHA_PERIOD) * dot.alphaSpeed + dot.alphaPhase / (Math.PI * 2),
              ) *
                DOT_ALPHA_AMP) * fade;

        const [ir, ig, ib] = inkAt(d, stops);
        if (dye > 0.004) {
          const mix = smoothstep(dye) * (0.45 + d * 0.55) * DYE_STRENGTH;
          const [dr, dg, db] = dyeAt(Math.min(1, dye * 0.9 + d * 0.02));
          ctx.fillStyle = `rgb(${Math.round(ir + (dr - ir) * mix)},${Math.round(
            ig + (dg - ig) * mix,
          )},${Math.round(ib + (db - ib) * mix)})`;
        } else {
          ctx.fillStyle = `rgb(${ir},${ig},${ib})`;
        }

        ctx.beginPath();
        if (d > SQUARE_AT) {
          const sq = (d - SQUARE_AT) / (1 - SQUARE_AT);
          const s = r * (1 - 0.04 * sq);
          const corner = r * (1 - 0.6 * sq);
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(x - s, y - s, s * 2, s * 2, corner);
          } else {
            ctx.rect(x - s, y - s, s * 2, s * 2);
          }
        } else {
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const last = { t: 0 };
    const loop = (now: number) => {
      if (!alive) return;
      draw(now, last);
      raf = requestAnimationFrame(loop);
    };

    loadImage(src ?? handsFramesAsset.url)
      .then((img) => {
        if (!alive) return;
        atlas = img;
        build();
        raf = requestAnimationFrame(loop);
      })
      .catch(() => undefined);

    // ------------------------------------------------------- pointer / fluid
    let lastMove: { x: number; y: number; t: number } | null = null;
    const onMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const fluid = fluidRef.current;
      if (!fluid) return;
      const now = performance.now();
      const prev = lastMove;
      if (prev) {
        const step = Math.max(0.008, Math.min(0.1, (now - prev.t) / 1000));
        const vx = (cx - prev.x) / step;
        const vy = (cy - prev.y) / step;
        const dist = Math.hypot(cx - prev.x, cy - prev.y);
        const steps = Math.min(12, Math.max(1, Math.round(dist / 14)));
        for (let s = 1; s <= steps; s++) {
          const f = s / steps;
          fluid.splat(prev.x + (cx - prev.x) * f, prev.y + (cy - prev.y) * f, vx, vy, 1 / steps);
        }
      } else {
        fluid.splat(cx, cy, 0, 0, 1);
      }
      lastMove = { x: cx, y: cy, t: now };
    };
    const onLeave = () => {
      pointerRef.current.tx = 0;
      pointerRef.current.ty = 0;
      lastMove = null;
    };
    if (!prefersReduce) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseleave", onLeave);
    }

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 80);
    };
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [src, contrast, frame, cropX, cropW, cropY, cropH, pitch, ink]);

  return (
    <div ref={hostRef} className={className} style={style} aria-hidden>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

export default HalftoneHandStill;
