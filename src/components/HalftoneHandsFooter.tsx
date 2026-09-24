import { useEffect, useRef, useState } from "react";
import { handsFramesAsset } from "@/lib/media";
import { IntroVideo, type IntroProgressInfo } from "./IntroVideo";
import { useHeroLayout, type HeroLayout } from "@/hooks/useHeroLayout";
import { getLenis } from "@/lib/smoothScroll";

import { INTRO_ENABLED } from "@/components/intro/introConfig";

/**
 * Halftone dot-matrix hands, scrubbed by scroll.
 *
 * The source is a sprite atlas of 49 greyscale frames (two hands entering from
 * both sides on white paper). Scroll position — not a clock — picks the frame,
 * so the motion is entirely under the reader's wheel and never loops on its own.
 * Each frame is downsampled onto a fixed dot grid where the dot AREA carries the
 * tone: small dots for near-paper planes, near-touching rounded squares in the
 * deepest shadows, isolated single dots fraying out at the silhouette edge.
 */

// ------------------------------------------------------------- atlas layout
const ATLAS_COLS = 7;
const ATLAS_ROWS = 7;
const FRAME_COUNT = 49;
const FRAME_W = 320;
const FRAME_H = 178;
const FRAME_AR = FRAME_W / FRAME_H;

// ---------------------------------------------------------------- tuning
// Radius is a fraction of the half-pitch. Kept below 1 so even the darkest
// cells keep a sliver of paper between them and never weld into a solid mass.
export const DOT_FILL = 0.9;
// Coverage below this is left as bare paper.
export const MIN_DENSITY = 0.05;
// Only the very deepest dots square off, so shadows stay legible as a screen.
export const SQUARE_AT = 0.88;
// Ink ramp: the previous single mid-grey is now the deepest tone; from there
// the value decreases evenly toward near-paper light grey. Tone is carried
// almost entirely by dot AREA, keeping the halftone read clean and neutral.
export const INK_STOPS: Array<[number, number, number]> = [
  [0xe8, 0xe8, 0xe8],
  [0xc8, 0xc8, 0xc8],
  [0xa8, 0xa8, 0xa8],
];

/** Interpolate the three-stop ink ramp at coverage d (0..1). */
function inkAt(d: number) {
  const t = Math.min(1, Math.max(0, d));
  const seg = t < 0.5 ? 0 : 1;
  const f = seg === 0 ? t / 0.5 : (t - 0.5) / 0.5;
  const a = INK_STOPS[seg];
  const b = INK_STOPS[seg + 1];
  const out = [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
  return out;
}

// Pointer parallax (CSS px at full deflection) + breathing.
const PARALLAX_X = 6;
const PARALLAX_Y = 4;
const BREATH_AMP = 0.035;
const BREATH_PERIOD = 5200;
// Per-dot transparency breathing: each dot pulses independently.
const DOT_ALPHA_AMP = 0.2; // range 0.8 .. 1.0
const DOT_ALPHA_PERIOD = 5000;
// After the last video frame is reached, keep the hands frozen for this many
// extra video frames of scroll distance before releasing the page wheel.
const HOLD_FRAMES = 4;
// Entry-state ghost preview of the final frame.
const GHOST_ALPHA = 0.1;
const GHOST_ALPHA_MAX = 0.2;

/** 4x4 ordered dither matrix, normalised to 0..1 — breaks up flat banding. */
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (v) => (v + 0.5) / 16,
);

/**
 * Static per-cell attributes of the dot grid. Every video frame is sampled
 * onto this same grid, so a cell keeps its position, breathing phase and
 * dissolve threshold while only its coverage changes between frames — that is
 * what lets two neighbouring frames be blended into a continuous scrub.
 */
type Grid = {
  cols: number;
  rows: number;
  x: Float32Array;
  y: Float32Array;
  /** 0 = frame edge, 1 = centre of the composition — drives parallax weight. */
  cx: Float32Array;
  /** Transparency breathing phase (0..1 turn) and speed multiplier. */
  phase: Float32Array;
  speed: Float32Array;
  /** Ordered-dither offset on the coverage threshold. */
  dither: Float32Array;
  /** Deterministic 0..1 per-cell value for the scattered dissolve. */
  hash: Float32Array;
};

// ------------------------------------------------------------- ink fluid
/**
 * How far a fully dyed dot moves from its grey toward the dye colour. Below 1
 * the trail reads as a tint over the halftone rather than a saturated smear.
 * Shared with the Why Synergy stills so every hand tints the same way.
 */
export const DYE_STRENGTH = 0.6;
// Vivid fluid dye gradient: yellow (outer/diffuse) → magenta → blue (core).
const DYE_STOPS: Array<[number, number, number]> = [
  [0xff, 0xcd, 0x17],
  [0xff, 0x18, 0xaa],
  [0x13, 0x7d, 0xff],
];

/** Interpolate the dye gradient at t (0..1).
 *  Bias the curve so yellow occupies most of the visible trail, magenta is a
 *  transition band, and blue only appears at the very highest concentration.
 */
export function dyeAt(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, Math.pow(t, 1.6)));
  const seg = x < 0.5 ? 0 : 1;
  const f = seg === 0 ? x / 0.5 : (x - 0.5) / 0.5;
  const a = DYE_STOPS[seg];
  const b = DYE_STOPS[seg + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/**
 * Tiny semi-Lagrangian dye/velocity field (no pressure projection).
 * The pointer injects dye plus a directional impulse; each step advects both
 * along the velocity, blurs a little and decays, giving the wispy trailing
 * smear of ink pushed across paper instead of a hard cursor halo.
 */
export class FluidField {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  u: Float32Array;
  v: Float32Array;
  d: Float32Array;
  private tu: Float32Array;
  private tv: Float32Array;
  private td: Float32Array;

  constructor(width: number, height: number, targetCols = 110) {
    this.cols = Math.max(16, Math.min(targetCols, Math.round(targetCols)));
    this.rows = Math.max(12, Math.round((this.cols * height) / Math.max(1, width)));
    this.cellW = width / this.cols;
    this.cellH = height / this.rows;
    const n = this.cols * this.rows;
    this.u = new Float32Array(n);
    this.v = new Float32Array(n);
    this.d = new Float32Array(n);
    this.tu = new Float32Array(n);
    this.tv = new Float32Array(n);
    this.td = new Float32Array(n);
  }

  /** Inject dye + impulse at a canvas-space point. vx/vy are px per second. */
  splat(px: number, py: number, vx: number, vy: number, strength = 1) {
    const gi = px / this.cellW;
    const gj = py / this.cellH;
    const rad = 2.6;
    const i0 = Math.max(0, Math.floor(gi - rad));
    const i1 = Math.min(this.cols - 1, Math.ceil(gi + rad));
    const j0 = Math.max(0, Math.floor(gj - rad));
    const j1 = Math.min(this.rows - 1, Math.ceil(gj + rad));
    const iu = (vx / this.cellW) * 0.55;
    const iv = (vy / this.cellH) * 0.55;
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const dx = i + 0.5 - gi;
        const dy = j + 0.5 - gj;
        const g = Math.exp(-(dx * dx + dy * dy) / (rad * 0.75));
        if (g < 0.01) continue;
        const k = j * this.cols + i;
        this.d[k] = Math.min(1.6, this.d[k] + g * 0.85 * strength);
        this.u[k] += iu * g * strength;
        this.v[k] += iv * g * strength;
      }
    }
  }

  step(dt: number) {
    const { cols, rows, u, v, d, tu, tv, td } = this;
    const h = Math.min(0.033, dt);
    // --- advect dye and velocity backwards along the flow
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const x = i + 0.5 - u[k] * h;
        const y = j + 0.5 - v[k] * h;
        td[k] = this.bilinear(d, x, y);
        tu[k] = this.bilinear(u, x, y) * 0.985;
        tv[k] = this.bilinear(v, x, y) * 0.985;
      }
    }
    // --- diffuse (single blur pass) + decay
    // Slow the dye fade so the blue core and mid-tone trail linger longer.
    const dyeDecay = Math.exp(-h / 3.8);
    const velDecay = Math.exp(-h / 0.65);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const l = i > 0 ? td[k - 1] : td[k];
        const r = i < cols - 1 ? td[k + 1] : td[k];
        const up = j > 0 ? td[k - cols] : td[k];
        const dn = j < rows - 1 ? td[k + cols] : td[k];
        d[k] = (td[k] * 0.62 + (l + r + up + dn) * 0.095) * dyeDecay;
        if (d[k] < 0.002) d[k] = 0;
        u[k] = tu[k] * velDecay;
        v[k] = tv[k] * velDecay;
      }
    }
  }

  private bilinear(f: Float32Array, x: number, y: number) {
    const { cols, rows } = this;
    const px = Math.min(cols - 1.001, Math.max(0, x - 0.5));
    const py = Math.min(rows - 1.001, Math.max(0, y - 0.5));
    const i = Math.floor(px);
    const j = Math.floor(py);
    const fx = px - i;
    const fy = py - j;
    const k = j * cols + i;
    const a = f[k];
    const b = f[k + 1];
    const c = f[k + cols];
    const e = f[k + cols + 1];
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + e * fx * fy;
  }

  /** Dye coverage at a canvas-space point. */
  sample(px: number, py: number) {
    return this.bilinear(this.d, px / this.cellW, py / this.cellH);
  }
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

/** Deterministic per-cell hash in 0..1 — keeps the dissolve stable on resize. */
export function hash2(i: number, j: number) {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Smooth ease-in-out breathing wave: 0→1→0 over one period.
 *  Replaces a raw sine wave so the fade feels like a gentle swell,
 *  not a sharp flash.
 */
export function breathWave(phase: number) {
  const t = phase % 1;
  const tri = t < 0.5 ? t * 2 : 2 - t * 2; // triangle 0..1..0
  return smoothstep(tri); // ease-in-out at both ends
}

function resolveViewportLength(value: string, viewportW: number, viewportH: number) {
  const raw = value.trim();
  const calc = raw.match(/^calc\(([-\d.]+)vh\s*([+-])\s*([-\d.]+)px\)$/);
  if (calc) {
    const vh = (Number(calc[1]) / 100) * viewportH;
    const px = Number(calc[3]);
    return calc[2] === "-" ? vh - px : vh + px;
  }
  if (raw.endsWith("vh")) return (Number.parseFloat(raw) / 100) * viewportH;
  if (raw.endsWith("vw")) return (Number.parseFloat(raw) / 100) * viewportW;
  if (raw.endsWith("px")) return Number.parseFloat(raw);
  return Number.parseFloat(raw) || 0;
}

function getHandsVisualRect(layout: HeroLayout, viewportW: number, viewportH: number) {
  const cap = layout.handsMaxWidth ?? 1440;
  const visualW = Math.min(viewportW, cap);
  return {
    x: (viewportW - visualW) * 0.5,
    y: resolveViewportLength(layout.handsTop, viewportW, viewportH),
    w: visualW,
    h: resolveViewportLength(layout.handsHeight, viewportW, viewportH),
  };
}

/** Lay the dot grid over the hands band. Independent of any video frame. */
function buildGrid(rect: { x: number; y: number; w: number; h: number }, pitch: number): Grid {
  const cols = Math.max(1, Math.floor(rect.w / pitch));
  const rows = Math.max(1, Math.floor(rect.h / pitch));
  const n = cols * rows;
  const grid: Grid = {
    cols,
    rows,
    x: new Float32Array(n),
    y: new Float32Array(n),
    cx: new Float32Array(n),
    phase: new Float32Array(n),
    speed: new Float32Array(n),
    dither: new Float32Array(n),
    hash: new Float32Array(n),
  };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const u = (i + 0.5) / cols;
      grid.x[k] = rect.x + (i + 0.5) * pitch;
      grid.y[k] = rect.y + (j + 0.5) * pitch;
      grid.cx[k] = Math.min(1, Math.min(u, 1 - u) * 2.2);
      // Deterministic per-cell randomness: a cell breathes on the same phase
      // whichever frame is showing, so frame changes never re-roll the field.
      grid.phase[k] = hash2(i * 3 + 1, j * 7 + 2);
      grid.speed[k] = 0.08 + hash2(i + 11, j + 5) * 0.17;
      // Ordered dither on the threshold only — keeps continuous tone in the
      // midtones instead of stepping into visible bands of equal dots.
      grid.dither[k] = (BAYER[(j & 3) * 4 + (i & 3)] - 0.5) * 0.07;
      grid.hash[k] = hash2(i, j);
    }
  }
  return grid;
}

/** Downsample one atlas frame onto the grid → per-cell ink coverage (0..1). */
function sampleField(
  atlas: HTMLImageElement,
  frame: number,
  grid: Grid,
  scratch: HTMLCanvasElement,
): Float32Array {
  const { cols, rows } = grid;
  const field = new Float32Array(cols * rows);
  if (scratch.width !== cols || scratch.height !== rows) {
    scratch.width = cols;
    scratch.height = rows;
  }
  const octx = scratch.getContext("2d", { willReadFrequently: true });
  if (!octx) return field;
  octx.imageSmoothingEnabled = true;
  const idx = Math.min(FRAME_COUNT - 1, Math.max(0, frame));
  const sx = (idx % ATLAS_COLS) * FRAME_W;
  const sy = Math.floor(idx / ATLAS_COLS) * FRAME_H;
  octx.clearRect(0, 0, cols, rows);
  // Slight blur before the downsample keeps the coarse grid from aliasing the
  // finger edges into stair-steps.
  (octx as unknown as { filter: string }).filter = "blur(0.5px)";
  octx.drawImage(atlas, sx, sy, FRAME_W, FRAME_H, 0, 0, cols, rows);
  (octx as unknown as { filter: string }).filter = "none";
  const data = octx.getImageData(0, 0, cols, rows).data;

  for (let k = 0; k < cols * rows; k++) {
    const p = k * 4;
    const luma = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
    // Source is dark subject on white paper → ink is the INVERSE of luma.
    const t = Math.min(1, Math.max(0, (1 - luma - 0.02) / 0.88));
    field[k] = Math.pow(t, 0.8);
  }
  return field;
}

export function HalftoneHandsFooter({
  videoSrc,
  debug,
  handoffVideo,
}: { videoSrc?: string; debug?: boolean; handoffVideo?: HTMLVideoElement | null } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = useHeroLayout();
  const [stage, setStage] = useState<"orb" | "hands">(INTRO_ENABLED ? "orb" : "hands");
  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const imageRef = useRef<HTMLImageElement | null>(null);
  // Pointer offset in -1..1, smoothed toward the raw target each frame.
  const pointerRef = useRef({ tx: 0, ty: 0, x: 0, y: 0 });
  // Low-res ink-fluid field driven by the pointer; colours the dots on hover.
  const fluidRef = useRef<FluidField | null>(null);
  // Scroll-driven playhead: target frame from scroll, eased current frame.
  const playheadRef = useRef({ target: 0, current: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pitch = Math.max(5, Math.round(layout.cellSize * 0.62));

    // One shared grid plus a per-frame coverage field. Fields are cached and
    // warmed in the background right after the atlas loads, so scrubbing never
    // pays for a downsample mid-gesture.
    let grid: Grid | null = null;
    let fields: Array<Float32Array | null> = new Array(FRAME_COUNT).fill(null);
    const scratch = document.createElement("canvas");
    let warmTimer = 0;

    const fieldFor = (frame: number): Float32Array | null => {
      const img = imageRef.current;
      if (!img || !grid) return null;
      const idx = Math.min(FRAME_COUNT - 1, Math.max(0, frame));
      let f = fields[idx];
      if (!f) {
        f = sampleField(img, idx, grid, scratch);
        fields[idx] = f;
      }
      return f;
    };

    const warmFields = () => {
      window.clearTimeout(warmTimer);
      const step = () => {
        if (!imageRef.current || !grid) return;
        let built = 0;
        for (let i = 0; i < FRAME_COUNT && built < 4; i++) {
          if (!fields[i]) {
            fieldFor(i);
            built++;
          }
        }
        if (built === 4) warmTimer = window.setTimeout(step, 0);
      };
      warmTimer = window.setTimeout(step, 0);
    };

    const recomputeBand = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;
      const visualRect = getHandsVisualRect(layout, w, h);
      const bandW = visualRect.w;
      const bandH = bandW / FRAME_AR;
      grid = buildGrid(
        {
          x: visualRect.x,
          y: visualRect.y + visualRect.h * 0.5 - bandH * 0.5,
          w: bandW,
          h: bandH,
        },
        pitch,
      );
      fields = new Array(FRAME_COUNT).fill(null);
      warmFields();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (w > 0 && h > 0) fluidRef.current = new FluidField(w, h);
      recomputeBand();
    };

    loadImage(handsFramesAsset.url).then((img) => {
      imageRef.current = img;
      resize();
    });

    let resizeTimer = 0;
    const scheduleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 80);
    };
    const ro = new ResizeObserver(scheduleResize);
    ro.observe(canvas);

    // -------------------------------------------------- wheel-driven playhead
    // The hands rest on frame 1 and are scrubbed by the wheel. Until the last
    // frame is reached the wheel is swallowed, so the page stays put; once the
    // sequence is complete the wheel is handed back to the page. Scrolling back
    // to the very top and continuing upward rewinds the hands.
    //
    // Feel: the wheel feeds a TARGET progress; the rendered progress chases it
    // with a time-constant (frame-rate independent) exponential ease, plus a
    // little residual glide so a flick keeps sliding instead of stopping dead.
    const progressRef = {
      target: prefersReduce ? 1 : 0,
      v: prefersReduce ? 1 : 0,
      vel: 0,
    };
    const holdRef = {
      target: 0,
      v: 0,
      vel: 0,
    };

    const frameSpan = () => Math.max(420, window.innerHeight * 1.15);

    // Distance over which the post-roll hold consumes HOLD_FRAMES video frames.
    const holdSpan = () => frameSpan() * (HOLD_FRAMES / FRAME_COUNT);

    // Seconds to close ~63% of the remaining distance.
    const SMOOTH_TAU = 0.16;
    // Per-event clamp: one huge trackpad delta can't slam the sequence forward.
    const MAX_STEP = 0.06;

    // While the hands own the wheel, Lenis must not also move the page —
    // otherwise both drivers fight and the gesture feels notchy.
    let hijacking = false;
    const setHijack = (on: boolean) => {
      if (hijacking === on) return;
      hijacking = on;
      const lenis = getLenis();
      if (!lenis) return;
      if (on) lenis.stop();
      else lenis.start();
    };

    /** Advance/rewind the playhead. Returns true when the wheel was consumed. */
    const consume = (rawDy: number, deltaMode = 0) => {
      if (prefersReduce) return false;
      if (snapState.active) return true;
      const dy = rawDy * (deltaMode === 1 ? 16 : deltaMode === 2 ? 100 : 1);
      if (dy === 0) return false;

      const goingDown = dy > 0;
      const atTop = window.scrollY <= 1;
      const sequenceDone = progressRef.target >= 1 && holdRef.target >= 1;
      setHijack(atTop && !sequenceDone);

      // Use the same physical clamp for both phases so the feel stays consistent.
      const maxPx = frameSpan() * MAX_STEP;
      const clampedDy = Math.max(-maxPx, Math.min(maxPx, dy));

      if (goingDown) {
        // Phase A: scrub through the 49 video frames.
        if (progressRef.target < 1) {
          const step = clampedDy / frameSpan();
          progressRef.target = Math.min(1, Math.max(0, progressRef.target + step));
          progressRef.vel = progressRef.vel * 0.7 + step * 7;
          return true;
        }
        // Phase B: hold on the last frame for a few extra frames of scroll.
        if (holdRef.target < 1) {
          const step = clampedDy / holdSpan();
          holdRef.target = Math.min(1, Math.max(0, holdRef.target + step));
          holdRef.vel = holdRef.vel * 0.7 + step * 7;
          return true;
        }
        // Phase C: one wheel notch snaps the page into the second screen.
        if (window.scrollY < snapTarget() - 2) {
          snapTo(snapTarget());
          return true;
        }
        return false;
      }

      // Going up: snap back out of the second screen first.
      if (window.scrollY > 0 && window.scrollY <= snapTarget() + 2) {
        snapTo(0);
        return true;
      }
      // Then reverse the hold, then rewind the video frames.
      if (atTop && holdRef.target > 0) {
        const step = clampedDy / holdSpan();
        holdRef.target = Math.min(1, Math.max(0, holdRef.target + step));
        holdRef.vel = holdRef.vel * 0.7 + step * 7;
        return true;
      }
      if (atTop && progressRef.target > 0) {
        const step = clampedDy / frameSpan();
        progressRef.target = Math.min(1, Math.max(0, progressRef.target + step));
        progressRef.vel = progressRef.vel * 0.7 + step * 7;
        return true;
      }
      return false;
    };

    // ------------------------------------------------------------- snap scroll
    // A single wheel gesture slides the page a whole screen instead of the
    // reader having to keep scrolling. While a snap runs every wheel event is
    // swallowed so the gesture can't be fought mid-flight.
    const snapTarget = () => window.innerHeight;
    const snapState = { active: false, from: 0, to: 0, t0: 0, raf: 0 };
    const SNAP_MS = 900;
    const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

    const snapTo = (to: number) => {
      if (snapState.active) return;
      const lenis = getLenis();
      if (lenis) {
        // Hand the snap to Lenis so the page keeps one single scroll driver.
        snapState.active = true;
        setHijack(false);
        lenis.scrollTo(to, {
          duration: SNAP_MS / 1000,
          easing: easeInOut,
          force: true,
          lock: true,
          onComplete: () => {
            snapState.active = false;
          },
        });
        return;
      }
      snapState.active = true;
      snapState.from = window.scrollY;
      snapState.to = to;
      snapState.t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - snapState.t0) / SNAP_MS);
        window.scrollTo(0, snapState.from + (snapState.to - snapState.from) * easeInOut(p));
        if (p < 1) {
          snapState.raf = requestAnimationFrame(tick);
        } else {
          snapState.active = false;
          snapState.raf = 0;
        }
      };
      snapState.raf = requestAnimationFrame(tick);
    };

    // ---------------------------------------------------------- ghost preview
    // On entry the last frame is shown at 10% as a hint of what's coming, with
    // the scroll hint on top. It fades out as soon as the sequence advances and
    // fades back in when the user rewinds all the way to the entry state.
    const ghost = { in: 0, out: 1, atEntry: true };
    const markScrollIntent = () => {};

    const onWheel = (e: WheelEvent) => {
      if (stageRef.current !== "hands") {
        setHijack(false);
        return;
      }
      markScrollIntent();
      if (consume(e.deltaY, e.deltaMode)) e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (stageRef.current !== "hands" || touchY === null) return;
      markScrollIntent();
      const y = e.touches[0]?.clientY ?? touchY;
      const dy = touchY - y;
      touchY = y;
      if (consume(dy * 1.6)) e.preventDefault();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    const onKeyIntent = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "ArrowUp", "PageUp", " ", "Space"].includes(e.key)) {
        markScrollIntent();
      }
    };
    window.addEventListener("keydown", onKeyIntent, { passive: true });

    let lastMove: { x: number; y: number; t: number } | null = null;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const fluid = fluidRef.current;
      if (fluid) {
        const prev = lastMove;
        const now = performance.now();
        let vx = 0;
        let vy = 0;
        if (prev) {
          const dt = Math.max(0.008, Math.min(0.1, (now - prev.t) / 1000));
          vx = (cx - prev.x) / dt;
          vy = (cy - prev.y) / dt;
          // Interpolate along the travelled segment so a fast flick still
          // leaves a continuous trail instead of dashed blobs.
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
      }
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

    // Half-pitch is the theoretical maximum where neighbouring dots touch.
    const maxR = pitch * 0.5 * DOT_FILL;

    let lastTs = 0;

    const draw = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Frame-rate independent step, clamped so a tab switch can't jump.
      const dt = lastTs ? Math.min(0.05, (now - lastTs) / 1000) : 0.016;
      lastTs = now;

      const ph = playheadRef.current;
      if (prefersReduce) {
        ph.target = FRAME_COUNT - 1;
        ph.current = ph.target;
      } else {
        // Residual glide: the flick keeps feeding the target briefly, then decays.
        const applyGlide = (ref: typeof progressRef, span: () => number) => {
          if (Math.abs(ref.vel) > 1e-4) {
            ref.target = Math.min(1, Math.max(0, ref.target + ref.vel * dt * 0.25));
            ref.vel *= Math.exp(-dt / 0.12);
          } else {
            ref.vel = 0;
          }
        };
        applyGlide(progressRef, frameSpan);
        applyGlide(holdRef, holdSpan);

        // Exponential ease toward the target with a fixed time constant.
        const k = 1 - Math.exp(-dt / SMOOTH_TAU);
        progressRef.v += (progressRef.target - progressRef.v) * k;
        holdRef.v += (holdRef.target - holdRef.v) * k;
        if (Math.abs(progressRef.target - progressRef.v) < 0.0005) {
          progressRef.v = progressRef.target;
        }
        if (Math.abs(holdRef.target - holdRef.v) < 0.0005) {
          holdRef.v = holdRef.target;
        }

        // The playhead is driven solely by the frame progress; during the hold
        // phase progressRef.v stays at 1, so the last frame remains frozen.
        ph.target = progressRef.v * (FRAME_COUNT - 1);
        ph.current += (ph.target - ph.current) * (1 - Math.exp(-dt / 0.05));
        if (Math.abs(ph.target - ph.current) < 0.001) ph.current = ph.target;
      }

      // Fractional playhead → blend the two neighbouring frames' coverage
      // fields. The 49 stills become a continuous morph instead of 49 pops.
      const phClamped = Math.min(FRAME_COUNT - 1, Math.max(0, ph.current));
      const f0 = Math.floor(phClamped);
      const f1 = Math.min(FRAME_COUNT - 1, f0 + 1);
      const ft = phClamped - f0;

      const p = pointerRef.current;
      if (prefersReduce) {
        p.x = 0;
        p.y = 0;
      } else {
        p.x += (p.tx - p.x) * 0.06;
        p.y += (p.ty - p.y) * 0.06;
      }
      // Slow tonal breathing so the field never looks like a frozen bitmap.
      const breath = prefersReduce
        ? 1
        : 1 + Math.sin((now / BREATH_PERIOD) * Math.PI * 2) * BREATH_AMP;

      // Step the ink-fluid field: dye advects along the velocity it was pushed
      // with, diffuses slightly and fades back to nothing.
      const fluid = fluidRef.current;
      if (fluid && !prefersReduce) fluid.step(dt);

      let ghostAlpha = 0;
      /**
       * Paint the grid at coverage lerp(a, b, t). `ghost` skips the dye,
       * square-off and per-dot breathing (the entry preview is a flat tint).
       */
      const paintField = (a: Float32Array, b: Float32Array, t: number, ghost: boolean) => {
        const g = grid;
        if (!g) return;
        const n = g.cols * g.rows;
        for (let k = 0; k < n; k++) {
          const base = t > 0 ? a[k] + (b[k] - a[k]) * t : a[k];
          if (base <= 0) continue;
          const density = Math.min(1, Math.max(0, base * breath + g.dither[k]));
          if (density < MIN_DENSITY) continue;

          // Scattered dissolve: faint cells survive only sometimes, so the mass
          // frays into isolated single dots instead of fading out as a block.
          // The survival edge is a short ramp (0.1 wide in hash space, centred
          // on the old hard cut) so a dot at the fray fades in over a few
          // frames instead of popping. The ramp tops out above 1 so cells in
          // solid areas are always fully opaque, as before.
          const keep = smoothstep((density - MIN_DENSITY) / 0.22);
          const survive = (0.21 + keep * 0.89 - g.hash[k]) / 0.1;
          if (survive <= 0) continue;
          const vis = survive >= 1 ? 1 : survive;

          // Centre dots drift more than edge dots → a shallow depth read.
          const weight = 0.35 + g.cx[k] * 0.65;
          const x = g.x[k] + p.x * PARALLAX_X * weight;
          const y = g.y[k] + p.y * PARALLAX_Y * weight;

          // Soft ceiling: large shadow regions no longer all clamp to 1.0,
          // which is what made them fuse into one flat slab.
          const d = density < 0.8 ? density : 0.8 + (density - 0.8) * 0.7;

          if (ghost) {
            const gr = maxR * Math.sqrt(d);
            if (gr < 0.16) continue;
            const [gr0, gg0, gb0] = inkAt(d);
            ctx.globalAlpha = ghostAlpha * vis;
            ctx.fillStyle = `rgb(${gr0},${gg0},${gb0})`;
            ctx.beginPath();
            ctx.arc(x, y, gr, 0, Math.PI * 2);
            ctx.fill();
            continue;
          }

          // Dye coverage under this dot (0 when the pointer never passed here).
          const dye = fluid ? Math.min(1, fluid.sample(x, y)) : 0;
          // Area ∝ coverage — the physically correct halftone response.
          const r = maxR * Math.sqrt(d) * (1 + dye * 0.06);
          if (r < 0.16) continue;

          // Each dot breathes opacity on its own phase/speed, as a smooth
          // ease-in-out swell rather than a sharp flash.
          const dotAlpha = prefersReduce
            ? 1
            : 1 - breathWave((now / DOT_ALPHA_PERIOD) * g.speed[k] + g.phase[k]) * DOT_ALPHA_AMP;
          ctx.globalAlpha = dotAlpha * vis;

          // Value carries volume alongside area: light grey on the paper-facing
          // planes, deeper grey in the shadows. Where the ink-fluid has been
          // pushed, that grey blends toward the warm dye gradient.
          const [ir, ig, ib] = inkAt(d);
          if (dye > 0.004) {
            // Deeper dots take more colour, so volume survives the tint.
            const mix = smoothstep(dye) * (0.45 + d * 0.55) * DYE_STRENGTH;
            const [dr, dg, db] = dyeAt(Math.min(1, dye * 0.9 + d * 0.02));
            ctx.fillStyle = `rgb(${Math.round(ir + (dr - ir) * mix)},${Math.round(
              ig + (dg - ig) * mix,
            )},${Math.round(ib + (db - ib) * mix)})`;
          } else {
            ctx.fillStyle = `rgb(${ir},${ig},${ib})`;
          }

          if (d <= SQUARE_AT) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // High coverage: the dot squares off with a shrinking corner
            // radius, but never grows — the paper gap between cells is kept.
            const sq = (d - SQUARE_AT) / (1 - SQUARE_AT);
            const s = r * (1 - 0.04 * sq);
            const corner = r * (1 - 0.6 * sq);
            ctx.beginPath();
            ctx.roundRect(x - s, y - s, s * 2, s * 2, corner);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      };

      // ---- ghost preview of the last frame (10% ink) --------------------
      if (!prefersReduce) {
        // Entry state = page at top with the sequence fully rewound. It is
        // reachable again by scrolling back up, so the ghost + scroll hint
        // return instead of being gone for good.
        const atEntry =
          window.scrollY <= 0 &&
          progressRef.target <= 0.002 &&
          progressRef.v <= 0.01 &&
          holdRef.target <= 0.002;
        if (atEntry !== ghost.atEntry) {
          ghost.atEntry = atEntry;
          window.dispatchEvent(new CustomEvent("hands-entry-state", { detail: { atEntry } }));
        }
        ghost.in = Math.min(1, ghost.in + dt / 0.8);
        ghost.out = atEntry ? Math.min(1, ghost.out + dt / 1.2) : Math.max(0, ghost.out - dt / 1.2);
        // Opacity breathes 10% -> 20% in sync with the scroll-hint arrow
        // bounce (2.8s, min at cycle ends, max at mid-cycle).
        const gPhase = (now / 2800) % 1;
        const gPulse = 0.5 - 0.5 * Math.cos(gPhase * Math.PI * 2);
        const gAlphaBase = GHOST_ALPHA + (GHOST_ALPHA_MAX - GHOST_ALPHA) * gPulse;
        const gA = gAlphaBase * ghost.in * ghost.out;

        if (gA > 0.001) {
          const last = fieldFor(FRAME_COUNT - 1);
          if (last) {
            ghostAlpha = gA;
            paintField(last, last, 0, true);
          }
        }
      }

      const fieldA = fieldFor(f0);
      const fieldB = ft > 0 ? fieldFor(f1) : fieldA;
      if (fieldA && fieldB) paintField(fieldA, fieldB, ft, false);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(warmTimer);
      ro.disconnect();
      window.removeEventListener("wheel", onWheel);
      setHijack(false);
      if (snapState.raf) cancelAnimationFrame(snapState.raf);

      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyIntent);

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [layout]);

  const handsVisible = stage === "hands";
  const [orbMounted, setOrbMounted] = useState(INTRO_ENABLED);
  const [burstProgress, setBurstProgress] = useState(0);
  const [bgDark, setBgDark] = useState(!INTRO_ENABLED);
  const navHiddenRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("app-bg-change", { detail: bgDark ? "dark" : "light" }));
  }, [bgDark]);

  // Intro sealed: reveal the nav immediately and set the page background,
  // matching the state the intro handoff would normally leave behind.
  // Deferred one frame so sibling listeners (nav, hero copy, chat dock) are
  // already subscribed when the cues fire.
  useEffect(() => {
    if (INTRO_ENABLED || typeof window === "undefined") return;
    document.documentElement.style.backgroundColor = "#FAFAFA";
    document.body.style.backgroundColor = "#FAFAFA";
    const raf = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("app-bg-change", { detail: "dark" }));
      window.dispatchEvent(new CustomEvent("app-nav-visibility", { detail: "visible" }));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleIntroProgress = (info: IntroProgressInfo) => {
    setBurstProgress(info.burstProgress);
    if (!navHiddenRef.current && info.burstProgress > 0) {
      navHiddenRef.current = true;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app-nav-visibility", { detail: "hidden" }));
      }
    }
  };

  const handleIntroEnded = () => {
    if (stageRef.current !== "orb") return;
    setBgDark(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app-nav-visibility", { detail: "visible" }));
    }
    if (typeof document !== "undefined") {
      document.documentElement.style.backgroundColor = "#FAFAFA";
      document.body.style.backgroundColor = "#FAFAFA";
    }
    setStage("hands");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOrbMounted(false));
    });
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: "#FAFAFA",
        height: "100vh",
        minHeight: 600,
      }}
    >
      {bgDark && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            background: "#FAFAFA",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      )}
      <h1 className="sr-only" suppressHydrationWarning>
        Synergy.AI — Revenue-Driven AI Support
      </h1>

      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          zIndex: 10,
          opacity: handsVisible ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 420ms ease-out",
        }}
      />

      {INTRO_ENABLED && orbMounted && (
        <div
          className="absolute inset-0"
          style={{
            zIndex: 5,
            isolation: "isolate",
            pointerEvents: stage === "orb" ? "auto" : "none",
          }}
        >
          <IntroVideo
            onEnded={handleIntroEnded}
            onProgress={handleIntroProgress}
            src={videoSrc}
            debug={debug}
            handoffVideo={handoffVideo}
          />
        </div>
      )}
    </section>
  );
}

export default HalftoneHandsFooter;
