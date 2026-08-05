import { useEffect, useRef, useState } from "react";
import handsFramesAsset from "@/assets/hands-frames.webp.asset.json";
import { IntroVideo, type IntroProgressInfo } from "./IntroVideo";
import { useHeroLayout, type HeroLayout } from "@/hooks/useHeroLayout";
import { GlitchGrainOverlay } from "@/components/GlitchGrainOverlay";

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
const DOT_FILL = 0.9;
// Coverage below this is left as bare paper.
const MIN_DENSITY = 0.05;
// Only the very deepest dots square off, so shadows stay legible as a screen.
const SQUARE_AT = 0.88;
// Ink ramp: the previous single mid-grey is now the deepest tone; from there
// the value decreases evenly toward near-paper light grey. Tone is carried
// almost entirely by dot AREA, keeping the halftone read clean and neutral.
const INK_STOPS: Array<[number, number, number]> = [
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
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
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










/** 4x4 ordered dither matrix, normalised to 0..1 — breaks up flat banding. */
const BAYER = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
].map((v) => (v + 0.5) / 16);

type Dot = {
  x: number;
  y: number;
  d: number; // 0..1 density (1 = darkest)
  /** 0 = frame edge, 1 = centre of the composition — drives parallax weight. */
  cx: number;
  /** Independent transparency breathing phase (radians). */
  alphaPhase: number;
  /** Independent transparency breathing speed multiplier (kept slow). */
  alphaSpeed: number;
};

// ------------------------------------------------------------- ink fluid
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
function dyeAt(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, Math.pow(t, 1.6)));
  const seg = x < 0.5 ? 0 : 1;
  const f = seg === 0 ? x / 0.5 : (x - 0.5) / 0.5;
  const a = DYE_STOPS[seg];
  const b = DYE_STOPS[seg + 1];
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ];
}

/**
 * Tiny semi-Lagrangian dye/velocity field (no pressure projection).
 * The pointer injects dye plus a directional impulse; each step advects both
 * along the velocity, blurs a little and decays, giving the wispy trailing
 * smear of ink pushed across paper instead of a hard cursor halo.
 */
class FluidField {
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
    return (
      a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + e * fx * fy
    );
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
function hash2(i: number, j: number) {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Smooth ease-in-out breathing wave: 0→1→0 over one period.
 *  Replaces a raw sine wave so the fade feels like a gentle swell,
 *  not a sharp flash.
 */
function breathWave(phase: number) {
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

/** Downsample one atlas frame onto the dot grid. */
function sampleDots(
  atlas: HTMLImageElement,
  frame: number,
  rect: { x: number; y: number; w: number; h: number },
  pitch: number,
): Dot[] {
  const cols = Math.max(1, Math.floor(rect.w / pitch));
  const rows = Math.max(1, Math.floor(rect.h / pitch));
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return [];
  octx.imageSmoothingEnabled = true;
  const idx = Math.min(FRAME_COUNT - 1, Math.max(0, frame));
  const sx = (idx % ATLAS_COLS) * FRAME_W;
  const sy = Math.floor(idx / ATLAS_COLS) * FRAME_H;
  // Slight blur before the downsample keeps the coarse grid from aliasing the
  // finger edges into stair-steps.
  (octx as unknown as { filter: string }).filter = "blur(0.5px)";
  octx.drawImage(atlas, sx, sy, FRAME_W, FRAME_H, 0, 0, cols, rows);
  (octx as unknown as { filter: string }).filter = "none";
  const data = octx.getImageData(0, 0, cols, rows).data;

  const dots: Dot[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = (j * cols + i) * 4;
      const u = (i + 0.5) / cols;
      const luma = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
      // Source is dark subject on white paper → ink is the INVERSE of luma.
      const t = Math.min(1, Math.max(0, (1 - luma - 0.02) / 0.88));
      let density = Math.pow(t, 0.8);

      // Ordered dither on the threshold only — keeps continuous tone in the
      // midtones instead of stepping into visible bands of equal dots.
      const dither = (BAYER[(j & 3) * 4 + (i & 3)] - 0.5) * 0.07;
      density = Math.min(1, Math.max(0, density + dither));

      if (density < MIN_DENSITY) continue;

      // Scattered dissolve: faint cells survive only sometimes, so the mass
      // frays into isolated single dots instead of fading out as a block.
      const keep = smoothstep((density - MIN_DENSITY) / 0.22);
      if (hash2(i, j) > 0.16 + keep * 0.84) continue;

      dots.push({
        x: rect.x + (i + 0.5) * pitch,
        y: rect.y + (j + 0.5) * pitch,
        d: density,
        cx: Math.min(1, Math.min(u, 1 - u) * 2.2),
        alphaPhase: Math.random() * Math.PI * 2,
        alphaSpeed: 0.08 + Math.random() * 0.17,
      });
    }
  }
  return dots;
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

    // Per-frame dot cache — scrubbing back and forth never recomputes a frame.
    let cache = new Map<number, Dot[]>();
    let bandRect = { x: 0, y: 0, w: 0, h: 0 };

    const dotsForFrame = (frame: number): Dot[] => {
      const img = imageRef.current;
      if (!img || bandRect.w <= 0) return [];
      const hit = cache.get(frame);
      if (hit) return hit;
      const built = sampleDots(img, frame, bandRect, pitch);
      cache.set(frame, built);
      return built;
    };

    const recomputeBand = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;
      const visualRect = getHandsVisualRect(layout, w, h);
      const bandW = visualRect.w;
      const bandH = bandW / FRAME_AR;
      bandRect = {
        x: visualRect.x,
        y: visualRect.y + visualRect.h * 0.5 - bandH * 0.5,
        w: bandW,
        h: bandH,
      };
      cache = new Map();
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

    /** Advance/rewind the playhead. Returns true when the wheel was consumed. */
    const consume = (rawDy: number, deltaMode = 0) => {
      if (prefersReduce) return false;
      const dy = rawDy * (deltaMode === 1 ? 16 : deltaMode === 2 ? 100 : 1);
      if (dy === 0) return false;
      const goingDown = dy > 0;
      const atTop = window.scrollY <= 0;

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
        // Phase C: release the wheel to the page.
        return false;
      }


      // Going up: reverse the hold first, then rewind the video frames.
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


    // ---------------------------------------------------------- ghost preview
    // On entry the last frame is shown at 10% as a hint of what's coming, with
    // the scroll hint on top. It fades out as soon as the sequence advances and
    // fades back in when the user rewinds all the way to the entry state.
    const ghost = { in: 0, out: 1, atEntry: true };
    const markScrollIntent = () => {};


    const onWheel = (e: WheelEvent) => {
      if (stageRef.current !== "hands") return;
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
            fluid.splat(
              prev.x + (cx - prev.x) * f,
              prev.y + (cy - prev.y) * f,
              vx,
              vy,
              1 / steps,
            );
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
        const applyGlide = (
          ref: typeof progressRef,
          span: () => number,
        ) => {
          if (Math.abs(ref.vel) > 1e-4) {
            ref.target = Math.min(
              1,
              Math.max(0, ref.target + ref.vel * dt * 0.25),
            );
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
        if (Math.abs(ph.target - ph.current) < 0.01) ph.current = ph.target;
      }




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

      const dots = dotsForFrame(Math.round(ph.current));

      // Step the ink-fluid field: dye advects along the velocity it was pushed
      // with, diffuses slightly and fades back to nothing.
      const fluid = fluidRef.current;
      if (fluid && !prefersReduce) fluid.step(dt);

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
          window.dispatchEvent(
            new CustomEvent("hands-entry-state", { detail: { atEntry } }),
          );
        }
        ghost.in = Math.min(1, ghost.in + dt / 0.8);
        ghost.out = atEntry
          ? Math.min(1, ghost.out + dt / 1.2)
          : Math.max(0, ghost.out - dt / 1.2);
        // Opacity breathes 10% -> 20% in sync with the scroll-hint arrow
        // bounce (1.8s, min at cycle ends, max at mid-cycle).
        const gPhase = (now / 1800) % 1;
        const gPulse = 0.5 - 0.5 * Math.cos(gPhase * Math.PI * 2);
        const gAlphaBase = GHOST_ALPHA + (GHOST_ALPHA_MAX - GHOST_ALPHA) * gPulse;
        const gA = gAlphaBase * ghost.in * ghost.out;

        if (gA > 0.001) {
          const gDots = dotsForFrame(FRAME_COUNT - 1);
          ctx.globalAlpha = gA;
          for (let k = 0; k < gDots.length; k++) {
            const dot = gDots[k];
            const weight = 0.35 + dot.cx * 0.65;
            const gx = dot.x + p.x * PARALLAX_X * weight;
            const gy = dot.y + p.y * PARALLAX_Y * weight;
            const raw = Math.min(1, dot.d * breath);
            const gd = raw < 0.8 ? raw : 0.8 + (raw - 0.8) * 0.7;
            const gr = maxR * Math.sqrt(gd);
            if (gr < 0.16) continue;
            const [gr0, gg0, gb0] = inkAt(gd);
            ctx.fillStyle = `rgb(${gr0},${gg0},${gb0})`;
            ctx.beginPath();
            ctx.arc(gx, gy, gr, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      }



      for (let k = 0; k < dots.length; k++) {
        const dot = dots[k];
        // Centre dots drift more than edge dots → a shallow depth read.
        const weight = 0.35 + dot.cx * 0.65;
        const x = dot.x + p.x * PARALLAX_X * weight;
        const y = dot.y + p.y * PARALLAX_Y * weight;

        const density = dot.d * breath;

        // Dye coverage under this dot (0 when the pointer never passed here).
        const dye = fluid ? Math.min(1, fluid.sample(x, y) * 1.0) : 0;
        const radiusScale = 1 + dye * 0.06;

        const raw = Math.min(1, density);
        // Soft ceiling: large shadow regions no longer all clamp to 1.0, which
        // is what made them fuse into one flat slab.
        const d = raw < 0.8 ? raw : 0.8 + (raw - 0.8) * 0.7;
        // Area ∝ coverage — the physically correct halftone response.
        const r = maxR * Math.sqrt(d) * radiusScale;
        if (r < 0.16) continue;

        // Each dot breathes opacity on its own random phase/speed.
        // Use a smooth ease-in-out wave so the fade feels like a gentle swell.
        const dotAlpha = prefersReduce
          ? 1
          : 1 -
            breathWave(
              (now / DOT_ALPHA_PERIOD) * dot.alphaSpeed +
                dot.alphaPhase / (Math.PI * 2),
            ) *
              DOT_ALPHA_AMP;
        ctx.globalAlpha = dotAlpha;

        // Value carries volume alongside area: light grey on the paper-facing
        // planes, deeper grey in the shadows. Where the ink-fluid has been
        // pushed, that grey blends toward the warm dye gradient.
        const [ir, ig, ib] = inkAt(d);
        if (dye > 0.004) {
          // Deeper dots take more colour, so volume survives the tint.
          const mix = smoothstep(dye) * (0.45 + d * 0.55);
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
          // High coverage: the dot squares off with a shrinking corner radius,
          // but never grows — the paper gap between cells is preserved.
          const sq = (d - SQUARE_AT) / (1 - SQUARE_AT);
          const s = r * (1 - 0.04 * sq);
          const corner = r * (1 - 0.6 * sq);
          ctx.beginPath();
          ctx.roundRect(x - s, y - s, s * 2, s * 2, corner);
          ctx.fill();
        }

      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      window.removeEventListener("wheel", onWheel);
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
    window.dispatchEvent(
      new CustomEvent("app-bg-change", { detail: bgDark ? "dark" : "light" }),
    );
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
      window.dispatchEvent(
        new CustomEvent("app-nav-visibility", { detail: "visible" }),
      );
    });
    return () => cancelAnimationFrame(raf);
  }, []);



  const handleIntroProgress = (info: IntroProgressInfo) => {
    setBurstProgress(info.burstProgress);
    if (!navHiddenRef.current && info.burstProgress > 0) {
      navHiddenRef.current = true;
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("app-nav-visibility", { detail: "hidden" }),
        );
      }
    }
  };

  const handleIntroEnded = () => {
    if (stageRef.current !== "orb") return;
    setBgDark(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app-nav-visibility", { detail: "visible" }),
      );
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
      style={{ backgroundColor: "#FAFAFA", height: "100vh", minHeight: 600 }}
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
        Good Fella Studio — Halftone Creation of Adam
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

      {(burstProgress > 0 || handsVisible) && (
        <div className="absolute inset-0" style={{ zIndex: 7, pointerEvents: "none" }}>
          <GlitchGrainOverlay visible intensity="low" />
        </div>
      )}


    </section>
  );
}

export default HalftoneHandsFooter;
