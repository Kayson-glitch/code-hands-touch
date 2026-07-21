import { useEffect, useRef, useState } from "react";
import handsPairAsset from "@/assets/hands-pair.png.asset.json";
import { IntroVideo, type IntroProgressInfo } from "./IntroVideo";
import { useHeroLayout } from "@/hooks/useHeroLayout";

// Ordered density ramp, dark → bright. Mirrors the exact 70-glyph set used by
// good-fella.com's ASCII footer (recovered by hooking their canvas atlas).
// Ordering follows the Paul Bourke density ramp, with the digits 0/1/8 slotted
// in at their approximate visual weight.
const RAMP =
  " .`'^\",:;Il!i1><~+_-?][}{)(|\\/tfjrxnuvczXYUJCLQOZ0mwqpdbkhao*#MW8&%B@$";
const RAMP_LEN = RAMP.length;

type Cell = {
  x: number;
  y: number;
  b: number; // 0..1 normalized luminance (post stretch + gamma)
  idx: number; // ramp index derived from b
  ch: string;
  armT: number; // 0..1 along-arm progress, 0 = edge/root, 1 = fingertip/center
  isEdge?: boolean; // true if cell touches a background cell (silhouette outline)
};

type Grid = {
  cols: number;
  rows: number;
  originX: number;
  originY: number;
  // -1 for background cell, else index into cells[]
  silIdx: Int32Array;
  // per-cell stable random 0..1, used for probabilistic spawn & glyph pick
  seed: Float32Array;
  // per-cell RGB of the source image at grid resolution (cols*rows*3).
  // Used by the hover mosaic-shatter reveal to paint the raw image pixels
  // behind broken tile positions.
  color: Uint8ClampedArray;
};

// good-fella.com's ASCII footer renders Cascadia Mono glyphs (from a 54-px
// offscreen atlas scaled down) into a 10×10 CSS-px cell. Pixel measurements
// off their live canvas: cell pitch 10×10 CSS px, average glyph footprint
// 3.5×5.5 CSS px — i.e. glyphs sit roughly at 8-9-px optical size with plenty
// of horizontal & vertical air around them. FONT_PX 9 with weight 500 lands
// on the same on-screen glyph size (~4×5.5 CSS px) inside the 10-px cell.
const FONT_PX = 8;
const CELL_W = 10;
const CELL_H = 10;
// Source (good-fella.com ASCIIEffect) uniforms — expressed in UV space,
// aspect-corrected. See docs/plan.md notes.
const GOOEY_RADIUS_UV = 0.048;
const GOOEY_SOFTNESS_UV = 0.028;
const GOOEY_NOISE = 0.011;
// Hover reveal disc is pinned to a fixed on-screen size (80px diameter) so
// it no longer breathes when the canvas short-edge changes across viewports.
const GOOEY_RADIUS_PX = 40;
const GOOEY_SOFTNESS_PX = 24;
// Max whole-scene parallax drift on hover, in CSS pixels. Small — mirrors the
// source's "the picture leans toward the finger" feel.
const PARALLAX_MAX = 13;
const PARALLAX_LERP = 0.08;
// Per-character hover response — mimics the source site where each glyph
// tilts slightly and shifts by its own depth instead of the whole scene
// translating as one block.
const TILT_MAX_DEG = 8;
const TILT_FALLOFF = 320;
// Per-glyph random tilt that only activates inside the hover reveal disc —
// characters are "woken up" into a hand-set angle where the cursor reveals
// them, and stay upright everywhere else.
const REVEAL_TILT_MAX_DEG = 12;
// Hover mosaic-shatter reveal — inside the disc, cells are replaced by
// broken tiles of the raw source image so the underlying photo peeks
// through a shattered ASCII surface. Numbers below tuned against the
// existing 10×10 cell pitch.
const MOSAIC_MASK_THRESHOLD = 0.04;
const MOSAIC_SHATTER_PX = 1.8; // max positional break at the disc edge
const MOSAIC_SCALE_MIN = 0.88; // min tile occupancy at the disc edge
const MOSAIC_SCALE_MAX = 1.12; // max tile occupancy (center)
const MOSAIC_SPLATTER_PROB = 0.06; // % of tiles that fling further out
const MOSAIC_SPLATTER_PX = 5;
// Click-to-lock reveal — per hand toggle that expands a mosaic disc from
// the click point until it fully covers that hand, then collapses on the
// next click. Timings kept snappy but eased so the transition reads as
// fluid rather than instant.
const LOCK_EXPAND_MS = 900;
const LOCK_COLLAPSE_MS = 520;
const LOCK_SOFTNESS_UV = 0.045;
const LOCK_RADIUS_MARGIN_UV = 0.025;
// Continuous character flow along arm skeleton — a low-frequency, time-driven
// phase rides along `armT` so glyphs shimmer/drift between neighbouring ramp
// densities. Independent of hover; gives the piece a subtle "always alive" feel.
const FLOW_DENSITY = 14;          // phase cycles across arm length
const FLOW_SPEED = 0.35;          // phase cycles per second
const FLOW_JITTER = 0.6;          // per-cell phase offset (fraction of 2π)
const FLOW_IDX_AMP = 2;           // ± ramp steps swapped by the wave
const FLOW_BRIGHTNESS_AMP = 0.06; // ± tonal multiplier from the wave
// Reveal disc smoothly chases the cursor (source-site behaviour). Smaller =
// stickier follow, which naturally reads as a gentle hover-in latency without
// a hard delay gate.
// Reveal easing adapts to pointer speed: slow moves keep the soft ink-diffusion
// trail (MIN values), fast flicks tighten follow so the disc doesn't lag behind.
const DISC_LERP_MIN = 0.08;
const DISC_LERP_MAX = 0.22;
const INTENSITY_LERP_MIN = 0.05;
const INTENSITY_LERP_MAX = 0.12;
// Pointer speed (CSS px/ms) at which the lerp reaches its MAX value.
const SPEED_REF = 2.0;
// Arm line orientation (from horizontal). Left half of the canvas uses +angle
// (arm rises toward upper-right), right half uses the mirror. Tunable 35–65°.
const ARM_ANGLE_DEG = 60;
// 0 = isotropic noise, 1 = fully directional. Controls how much the broken
// edge splashes along the arm vs across it.
const ARM_ALIGN_STRENGTH = 0.45;
// Intro reveal timing — arms grow from screen edge inward along the arm axis.
// A hermite curve gives fast forearm coverage, then a distinct deceleration as
// the reveal reaches the wrist / palm / fingers.
const INTRO_DURATION_MS = 2400;
const INTRO_FRONT_WIDTH_BASE = 0.18;
// After the reveal passes the "wrist" anchor we widen the front band so the
// palm + fingers unfurl feels softer / more diffused, reinforcing the slowdown.
const INTRO_FRONT_WIDTH_WRIST = 0.22;
const INTRO_WRIST_ANCHOR = 0.78; // eased-progress value at which we consider
                                 // the reveal to have reached the wrist.
// Right (robot) arm lags slightly behind the left so the two hands don't march
// in lockstep — subtle narrative offset.
const INTRO_SIDE_STAGGER_MS = 120;
// Post-front "settle" band: cells behind the front fade the last stretch of
// alpha from 0.6 → 1 across this fraction of armT.
const INTRO_SETTLE_WIDTH = 0.12;
// Cubic hermite with tangents (fast in, slow out) chosen so that
// introEase(0.62) ≈ 0.78 — i.e. ~78% of the arm is revealed by the time 62%
// of the duration has elapsed, and the remaining 22% of distance takes 38% of
// the time. Derivative is continuous and positive across the whole range, so
// there is no perceptible pause at the wrist — just a smooth deceleration.
const introEase = (t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const s0 = 1.6; // starting slope — quick initial reveal
  const s1 = 0.15; // ending slope — gentle arrival at fingertips
  const h00 = 2 * t * t * t - 3 * t * t + 1;
  const h10 = t * t * t - 2 * t * t + t;
  const h01 = -2 * t * t * t + 3 * t * t;
  const h11 = t * t * t - t * t;
  return h00 * 0 + h10 * s0 + h01 * 1 + h11 * s1;
};

// Arm skeleton polylines in normalized targetRect coords (u=0 left..1 right,
// v=0 top..1 bottom). Calibrated against hands-pair.png: human arm enters
// bottom-left horizontally, robot arm enters top-right diagonally.
const ARM_SKELETON_L: [number, number][] = [
  [0.00, 0.66], // shoulder/root at left edge
  [0.12, 0.62], // upper forearm
  [0.28, 0.52], // elbow area
  [0.40, 0.44], // wrist
  [0.48, 0.48], // fingertip
];
const ARM_SKELETON_R: [number, number][] = [
  [1.00, 0.15], // shoulder/root at top-right
  [0.90, 0.28], // upper arm
  [0.78, 0.38], // elbow
  [0.62, 0.44], // wrist
  [0.52, 0.48], // fingertip
];
// Cells further from the skeleton curve show up slightly later, so ink appears
// to flow along the bone before spreading outward to the silhouette edge.
const SKELETON_PERP_WEIGHT = 0.18;

function buildPolyline(pts: [number, number][]) {
  const segLen: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    const L = Math.hypot(dx, dy);
    segLen.push(L);
    total += L;
  }
  return { pts, segLen, total };
}

function nearestOnPolyline(
  pu: number,
  pv: number,
  poly: { pts: [number, number][]; segLen: number[]; total: number },
) {
  let bestPerp = Infinity;
  let bestS = 0;
  let acc = 0;
  for (let i = 0; i < poly.pts.length - 1; i++) {
    const [ax, ay] = poly.pts[i];
    const [bx, by] = poly.pts[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const L2 = Math.max(1e-6, dx * dx + dy * dy);
    let t = ((pu - ax) * dx + (pv - ay) * dy) / L2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const perp = Math.hypot(pu - cx, pv - cy);
    if (perp < bestPerp) {
      bestPerp = perp;
      bestS = (acc + t * poly.segLen[i]) / Math.max(1e-6, poly.total);
    }
    acc += poly.segLen[i];
  }
  return { s: bestS, perp: bestPerp };
}

function glyphAt(idx: number) {
  const clamped = Math.min(RAMP_LEN - 1, Math.max(0, idx));
  return RAMP.charAt(clamped);
}

function indexFor(b: number) {
  const idx = Math.floor(b * (RAMP_LEN - 1));
  return Math.min(RAMP_LEN - 1, Math.max(0, idx));
}

// GLSL fract() — the fractional part of x. Used for hash-based scramble.
function fract(x: number) {
  return x - Math.floor(x);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Sample a silhouette image into a grid of glyph cells.
 * targetRect: where on the visible canvas this image maps to (in CSS px).
 * mirror: flip horizontally when sampling.
 */
function sampleImage(
  img: HTMLImageElement,
  targetRect: { x: number; y: number; w: number; h: number },
  mirror: boolean,
): { cells: Cell[]; grid: Grid } {
  const off = document.createElement("canvas");
  const cols = Math.max(1, Math.floor(targetRect.w / CELL_W));
  const rows = Math.max(1, Math.floor(targetRect.h / CELL_H));
  off.width = cols;
  off.height = rows;
  const octx = off.getContext("2d", { willReadFrequently: true })!;
  octx.imageSmoothingEnabled = true;
  // Sub-pixel blur before downsample softens the alpha edge so it doesn't
  // land on the coarse 10-px grid as a hard step.
  (octx as unknown as { filter: string }).filter = "blur(0.6px)";
  if (mirror) {
    octx.translate(cols, 0);
    octx.scale(-1, 1);
  }
  octx.drawImage(img, 0, 0, cols, rows);
  (octx as unknown as { filter: string }).filter = "none";
  const data = octx.getImageData(0, 0, cols, rows).data;

  // Grid-resolution color buffer (RGB, no alpha) — feeds the hover mosaic
  // shatter reveal. Built once per resample from the same downsampled image
  // so tiles land exactly on ASCII cell boundaries.
  const color = new Uint8ClampedArray(cols * rows * 3);
  for (let p = 0, q = 0; q < cols * rows; p += 4, q += 1) {
    color[q * 3 + 0] = data[p + 0];
    color[q * 3 + 1] = data[p + 1];
    color[q * 3 + 2] = data[p + 2];
  }

  // Pass 1: perceptual luma (Rec.709) for every non-background cell.
  type Raw = { i: number; j: number; y: number; a: number };
  const raws: Raw[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = (j * cols + i) * 4;
      const a = data[p + 3] / 255;
      // Alpha gate — fully-transparent background never gets a glyph.
      if (a < 0.18) continue;
      // Premultiply luma by alpha so non-premultiplied PNG edges (where RGB
      // is dark but alpha low) don't read as "deep shadow" jaggies.
      const y =
        (a * (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2])) /
        255;
      if (y > 0.04) raws.push({ i, j, y, a });
    }
  }
  const emptyGrid: Grid = {
    cols,
    rows,
    originX: targetRect.x,
    originY: targetRect.y,
    silIdx: new Int32Array(cols * rows).fill(-1),
    seed: new Float32Array(cols * rows),
    color,
  };
  if (raws.length === 0) return { cells: [], grid: emptyGrid };

  // Percentile stretch: 2nd..98th → 0..1, then mild gamma to lift midtones.
  const sorted = raws.map((r) => r.y).sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.05)];
  const hi = sorted[Math.floor(sorted.length * 0.99)];
  const span = Math.max(1e-4, hi - lo);
  // gamma < 1 lifts midtones toward highlight → brighter overall while keeping contrast.
  const gamma = 0.92;

  const silIdx = new Int32Array(cols * rows).fill(-1);
  const seed = new Float32Array(cols * rows);
  for (let s = 0; s < seed.length; s++) seed[s] = Math.random();

  const cells: Cell[] = [];
  for (const r of raws) {
    const stretched = Math.min(1, Math.max(0, (r.y - lo) / span));
    // Feather partial-alpha cells toward the low end of the ramp so the
    // silhouette edge dissolves into sparser glyphs instead of stepping.
    const feather = Math.pow(r.a, 0.65);
    const b = Math.pow(stretched, gamma) * feather;
    const idx = indexFor(b);
    silIdx[r.j * cols + r.i] = cells.length;
    cells.push({
      x: targetRect.x + r.i * CELL_W,
      y: targetRect.y + r.j * CELL_H,
      b,
      idx,
      ch: glyphAt(idx),
      armT: 0,
    });
  }
  // Compute per-cell armT by projecting onto the nearest arm-skeleton
  // polyline. Left-half cells snap to the human arm skeleton, right-half to
  // the robot arm skeleton. The along-curve arclength gives armT ∈ [0,1];
  // perpendicular distance adds a small delay so ink flows along the bone
  // before spreading to the silhouette edge.
  {
    const cx = targetRect.x + targetRect.w * 0.5;
    const polyL = buildPolyline(ARM_SKELETON_L);
    const polyR = buildPolyline(ARM_SKELETON_R);
    for (let k = 0; k < cells.length; k++) {
      const c = cells[k];
      const u = (c.x - targetRect.x) / Math.max(1, targetRect.w);
      const v = (c.y - targetRect.y) / Math.max(1, targetRect.h);
      const poly = c.x < cx ? polyL : polyR;
      const { s, perp } = nearestOnPolyline(u, v, poly);
      const t = s + SKELETON_PERP_WEIGHT * perp;
      c.armT = Math.min(1, Math.max(0, t));
    }
  }

  // Edge detection: a cell is an outline edge if any of its 8 neighbors is
  // background (silIdx === -1). This marks the outer silhouette of fingers and
  // palms so we can draw a subtle lift stroke behind the glyph.
  for (let k = 0; k < cells.length; k++) {
    const c = cells[k];
    const ci = Math.round((c.x - targetRect.x) / CELL_W);
    const cj = Math.round((c.y - targetRect.y) / CELL_H);
    let isEdge = false;
    for (let dj = -1; dj <= 1 && !isEdge; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (di === 0 && dj === 0) continue;
        const ni = ci + di;
        const nj = cj + dj;
        if (ni < 0 || ni >= cols || nj < 0 || nj >= rows) {
          isEdge = true;
          break;
        }
        if (silIdx[nj * cols + ni] === -1) {
          isEdge = true;
          break;
        }
      }
    }
    c.isEdge = isEdge;
  }

  return {
    cells,
    grid: {
      cols,
      rows,
      originX: targetRect.x,
      originY: targetRect.y,
      silIdx,
      seed,
      color,
    },
  };
}

export function AsciiHandsFooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // Interaction flow: intro video → hands.
  const [stage, setStage] = useState<"orb" | "hands">("orb");
  const stageRef = useRef(stage);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  const startIntroRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (stage === "hands") startIntroRef.current?.();
  }, [stage]);
  const cellsRef = useRef<Cell[]>([]);
  const gridRef = useRef<Grid | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const mouseSpeedRef = useRef(0);
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const introStartRef = useRef<number | null>(null);
  const introDoneRef = useRef(false);
  const introVisibleRef = useRef(false);
  // Per-hand click lock state. `progress` tweens toward `target` each frame
  // (0 = collapsed, 1 = fully expanded). `radiusUv` is snapshotted on click
  // so the disc always reaches every cell of the hand from that click point.
  const lockRef = useRef({
    left:  { x: 0, y: 0, radiusUv: 0, progress: 0, target: 0 },
    right: { x: 0, y: 0, radiusUv: 0, progress: 0, target: 0 },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let running = true;

    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduce) {
      introDoneRef.current = true;
      introVisibleRef.current = true;
    }

    const resample = () => {
      const img = imageRef.current;
      if (!img) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;

      // Source image is 1920x1080 with both hands baked into the composition,
      // meeting near the center. Fit it to the full canvas width, centered.
      const imgAR = img.naturalWidth / img.naturalHeight;
      const bandW = w;
      const bandH = bandW / imgAR;
      const bandY = h * 0.5 - bandH * 0.5;
      const sampled = sampleImage(
        img,
        { x: 0, y: bandY, w: bandW, h: bandH },
        false,
      );
      cellsRef.current = sampled.cells;
      gridRef.current = sampled.grid;
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resample();
    };

    loadImage(handsPairAsset.url).then((img) => {
      imageRef.current = img;
      resize();
    });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Trigger intro on first visibility.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (
            e.isIntersecting &&
            !introVisibleRef.current &&
            stageRef.current === "hands"
          ) {
            introVisibleRef.current = true;
            introStartRef.current = performance.now();
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(canvas);

    // When the orb finishes exiting we flip stage to "hands"; the outer
    // effect calls startIntro via this ref to kick off arm growth.
    startIntroRef.current = () => {
      if (introVisibleRef.current) return;
      introVisibleRef.current = true;
      introStartRef.current = performance.now();
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();
      const last = lastMoveRef.current;
      if (last) {
        const dtEv = Math.max(1, now - last.t);
        const dist = Math.hypot(x - last.x, y - last.y);
        const inst = dist / dtEv;
        mouseSpeedRef.current += (inst - mouseSpeedRef.current) * 0.35;
      }
      lastMoveRef.current = { x, y, t: now };
      mouseRef.current = {
        x,
        y,
        active: true,
      };
    };
    const onLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
      lastMoveRef.current = null;
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      const now = performance.now();
      const last = lastMoveRef.current;
      if (last) {
        const dtEv = Math.max(1, now - last.t);
        const dist = Math.hypot(x - last.x, y - last.y);
        const inst = dist / dtEv;
        mouseSpeedRef.current += (inst - mouseSpeedRef.current) * 0.35;
      }
      lastMoveRef.current = { x, y, t: now };
      mouseRef.current = {
        x,
        y,
        active: true,
      };
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onLeave);

    // Click / tap to toggle a hand lock. Clicks on the left half target the
    // human hand, right half targets the robot hand. Second click on the
    // same hand collapses it back. Ignored while the intro is still
    // playing so users don't fight the growth animation.
    const onDown = (e: PointerEvent) => {
      if (!introDoneRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (x < 0 || y < 0 || x > w || y > h) return;
      const side: "left" | "right" = x < w / 2 ? "left" : "right";
      const st = lockRef.current[side];
      if (st.target > 0.5) {
        // Collapse — retract from current click origin.
        st.target = 0;
        return;
      }
      // Snapshot click origin and compute a radius (in UV space) that
      // reaches the furthest cell on this hand so the disc always covers
      // the whole silhouette regardless of where the user clicked.
      const minWH = Math.min(w, h);
      const aspectX = w / h;
      const oxUv = (x / minWH) * aspectX;
      const oyUv = y / minWH;
      let rMax = 0;
      const cells = cellsRef.current;
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const cellSideLeft = c.x < w / 2;
        if ((side === "left") !== cellSideLeft) continue;
        const cUvX = (c.x / minWH) * aspectX;
        const cUvY = c.y / minWH;
        const dd = Math.hypot(cUvX - oxUv, cUvY - oyUv);
        if (dd > rMax) rMax = dd;
      }
      st.x = x;
      st.y = y;
      st.radiusUv = rMax + LOCK_RADIUS_MARGIN_UV;
      st.target = 1;
    };
    canvas.addEventListener("pointerdown", onDown);

    let frame = 0;
    let lastT = performance.now();
    let intensity = 0;
    let scrambleSeed = 0;
    let scrambleTick = 0;
    let parallaxX = 0;
    let parallaxY = 0;
    let discX = -9999;
    let discY = -9999;
    let smoothSpeedK = 0;
    const draw = () => {
      if (!running) return;
      frame++;
      const now = performance.now();
      const dt = Math.min(64, now - lastT);
      lastT = now;
      const timeSec = now / 1000;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `500 ${FONT_PX}px "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      // Cast: letterSpacing is a modern Canvas 2D API not in all TS libs yet.
      (ctx as unknown as { letterSpacing?: string }).letterSpacing = "0px";

      const cells = cellsRef.current;
      const grid = gridRef.current;
      const m = mouseRef.current;

      // Intro reveal progress (0..1). Two-sided: left arm starts at t=0,
      // right arm starts INTRO_SIDE_STAGGER_MS later. Per-cell selection
      // happens in the render loop via `introProgressFor(side)`.
      let introRawL = 1;
      let introRawR = 1;
      if (!introDoneRef.current) {
        if (introVisibleRef.current && introStartRef.current != null) {
          const elapsed = now - introStartRef.current;
          introRawL = Math.min(1, Math.max(0, elapsed / INTRO_DURATION_MS));
          introRawR = Math.min(
            1,
            Math.max(0, (elapsed - INTRO_SIDE_STAGGER_MS) / INTRO_DURATION_MS),
          );
          if (introRawL >= 1 && introRawR >= 1) introDoneRef.current = true;
        } else {
          introRawL = 0;
          introRawR = 0;
        }
      }
      const introProgressL = introEase(introRawL);
      const introProgressR = introEase(introRawR);
      // A representative progress used only for gating global effects (flow
      // amplitude, hover suppression). Use the slower of the two arms so
      // hover doesn't re-enable while the robot arm is still growing.
      const introProgress = Math.min(introProgressL, introProgressR);
      const intro = introProgress < 1;

      // Lerp intensity toward its target — no hard delay gate. The visual
      // hover-in latency comes from the disc position also lerping toward
      // the cursor (below), mirroring the source site's follow behaviour.
      // Decay pointer speed when no move events arrive (~120ms half-life-ish).
      mouseSpeedRef.current *= Math.exp(-dt / 120);
      const speedK = Math.min(1, mouseSpeedRef.current / SPEED_REF);
      smoothSpeedK += (speedK - smoothSpeedK) * 0.15;
      const discLerp = DISC_LERP_MIN + (DISC_LERP_MAX - DISC_LERP_MIN) * speedK;
      const intensityLerp =
        INTENSITY_LERP_MIN + (INTENSITY_LERP_MAX - INTENSITY_LERP_MIN) * speedK;
      // Speed-adaptive mosaic diffusion / dissipation.
      const shatterK = 1 + smoothSpeedK * 0.9;
        const scaleMinDyn = MOSAIC_SCALE_MIN + smoothSpeedK * 0.10;
      const alphaGamma = 0.85 - smoothSpeedK * 0.25;
      const fadeLo = 0.35 - smoothSpeedK * 0.15;
      const fadeHi = 0.85 - smoothSpeedK * 0.20;
      const fadeSpan = Math.max(0.05, fadeHi - fadeLo);

      // Disable hover reveal disc while the arms are still growing in.
      const targetIntensity = m.active && !prefersReduce && !intro ? 1 : 0;
      intensity += (targetIntensity - intensity) * intensityLerp;

      // Smooth-follow disc center. Initialise to the current cursor on the
      // first active frame so it doesn't fly in from (-9999, -9999).
      if (m.active) {
        if (discX === -9999) {
          discX = m.x;
          discY = m.y;
        } else {
          discX += (m.x - discX) * discLerp;
          discY += (m.y - discY) * discLerp;
        }
      }

      // Bump scramble seed a few times per second so glyphs inside the disc
      // visibly re-shuffle, matching the source's continuous scramble.
      scrambleTick += dt;
      if (scrambleTick > 90) {
        scrambleTick = 0;
        scrambleSeed = (scrambleSeed + 0.6180339887) % 1;
      }

      // Precompute cursor UV + aspect terms (only when disc has any effect).
      const showGooey = intensity > 0.001 && grid;
      const minWH = Math.min(w, h);
      const aspectX = w / h;

      // ---- Click-lock: advance each side's progress toward its target ----
      const lockL = lockRef.current.left;
      const lockR = lockRef.current.right;
      const stepLock = (st: { progress: number; target: number }) => {
        if (st.progress === st.target) return;
        const dir = st.target > st.progress ? 1 : -1;
        const dur = dir > 0 ? LOCK_EXPAND_MS : LOCK_COLLAPSE_MS;
        let p = st.progress + (dt / dur) * dir;
        if (p > 1) p = 1;
        if (p < 0) p = 0;
        st.progress = p;
      };
      stepLock(lockL);
      stepLock(lockR);
      // Elastic-ish easings: expand overshoots then settles, collapse loads
      // slightly backward before snapping in.
      const easeOutBack = (t: number, s = 1.4) => {
        const c1 = s;
        const c3 = c1 + 1;
        const u = t - 1;
        return 1 + c3 * u * u * u + c1 * u * u;
      };
      const easeInBack = (t: number, s = 1.2) => {
        const c1 = s;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
      };
      const lockEase = (st: { progress: number; target: number }) =>
        st.target >= 0.5 ? easeOutBack(st.progress) : 1 - easeInBack(1 - st.progress);
      const lockLE = lockEase(lockL);
      const lockRE = lockEase(lockR);
      const lockLActive = lockLE > 0.001 && grid;
      const lockRActive = lockRE > 0.001 && grid;
      const lockLUvX = lockLActive ? (lockL.x / minWH) * aspectX : 0;
      const lockLUvY = lockLActive ? lockL.y / minWH : 0;
      const lockRUvX = lockRActive ? (lockR.x / minWH) * aspectX : 0;
      const lockRUvY = lockRActive ? lockR.y / minWH : 0;
      // Tiny sinusoidal overshoot in the last 15% of the expand phase to
      // reinforce the elastic feel; disabled while collapsing.
      const lockRadiusPulse = (st: { progress: number; target: number }) => {
        if (st.target < 0.5) return 1;
        const p = st.progress;
        if (p <= 0.85) return 1;
        const k = (p - 0.85) / 0.15;
        return 1 + 0.03 * Math.sin(k * Math.PI) * (1 - p);
      };
      const lockLR = lockLActive ? lockL.radiusUv * lockLE * lockRadiusPulse(lockL) : 0;
      const lockRR = lockRActive ? lockR.radiusUv * lockRE * lockRadiusPulse(lockR) : 0;
      // Arm direction is mirrored per side (left = +, right = -).
      const armDxL = Math.cos((ARM_ANGLE_DEG * Math.PI) / 180);
      const armDxR = -armDxL;
      const armDyLR = -Math.sin((ARM_ANGLE_DEG * Math.PI) / 180);

      const mUvX = showGooey ? (discX / minWH) * aspectX : 0;
      const mUvY = showGooey ? discY / minWH : 0;
      const R = (GOOEY_RADIUS_PX / minWH) * intensity;
      const S = ((GOOEY_SOFTNESS_PX * 0.5) / minWH) * intensity;
      const rLo = R - S;
      const rHi = R + S;

      // Arm-aligned direction vector. Left half of the canvas → arm rises
      // toward upper-right; right half → mirrored. y is negated because
      // canvas y grows downward but arms visually rise upward.
      const sideSign = discX < w / 2 ? 1 : -1;
      const armRad = (ARM_ANGLE_DEG * Math.PI) / 180;
      const armDx = Math.cos(armRad) * sideSign;
      const armDy = -Math.sin(armRad);

      // Smooth-follow cursor for parallax. When inactive, ease back to canvas
      // center so the scene returns to rest.
      const targetPX = m.active ? m.x : w * 0.5;
      const targetPY = m.active ? m.y : h * 0.5;
      if (parallaxX === 0 && parallaxY === 0) {
        parallaxX = w * 0.5;
        parallaxY = h * 0.5;
      }
      parallaxX += (targetPX - parallaxX) * PARALLAX_LERP;
      parallaxY += (targetPY - parallaxY) * PARALLAX_LERP;
      const parallaxAmt = prefersReduce ? 0 : intensity;
      const offX = -((parallaxX - w * 0.5) / w) * PARALLAX_MAX * parallaxAmt;
      const offY = -((parallaxY - h * 0.5) / h) * PARALLAX_MAX * parallaxAmt;
      const hoverActive = intensity > 0.01 && !prefersReduce;
      const tiltScale = TILT_MAX_DEG * (Math.PI / 180) * intensity * intensity;

      // Highlight tint the revealed cells migrate toward. A soft near-white
      // with a lavender purple bias to match the #C5A9FF base color scheme.
      const HR = 250, HG = 245, HB = 255;

      for (let k = 0; k < cells.length; k++) {
        const c = cells[k];
        // Per-cell intro progress based on which arm the cell belongs to.
        const cellProgress = c.x < w / 2 ? introProgressL : introProgressR;
        if (intro && c.armT > cellProgress) continue;
        const bb = c.b;

        // Cell seed (used by flow, intro-front and gooey blocks).
        const cellI = grid ? Math.floor((c.x - grid.originX) / CELL_W) : 0;
        const cellJ = grid ? Math.floor((c.y - grid.originY) / CELL_H) : 0;
        const cellSeed = grid ? grid.seed[cellJ * grid.cols + cellI] ?? 0.5 : 0.5;

        // Continuous flow along the arm skeleton. Amplitude ramps up with the
        // intro so it never fights the growth animation, and is unaffected by
        // hover (gooey block below overrides ch anyway inside the reveal disc).
        const flowAmp = prefersReduce ? 0 : introProgress;
        const flowPhase =
          c.armT * FLOW_DENSITY -
          timeSec * FLOW_SPEED +
          cellSeed * FLOW_JITTER;
        const flowWave = Math.sin(flowPhase * Math.PI * 2);
        const flowIdxOffset = Math.round(flowWave * FLOW_IDX_AMP * flowAmp);
        const flowBrightness = 1 + flowWave * FLOW_BRIGHTNESS_AMP * flowAmp;

        // Base lavender purple color from the ramp:
        //   shadow rgb(45, 35, 70) → highlight rgb(197, 169, 255)
        let r = (45 + bb * 152) * flowBrightness;
        let g = (35 + bb * 134) * flowBrightness;
        let bl = (70 + bb * 185) * flowBrightness;
        const baseIdx =
          ((c.idx + flowIdxOffset) % RAMP_LEN + RAMP_LEN) % RAMP_LEN;
        let ch = glyphAt(baseIdx);
        let jitterX = 0;
        let jitterY = 0;
        let revealTilt = 0;
        // Set true when this cell is covered by a mosaic-shatter tile — we
        // then skip the ASCII glyph pass so the raw image reads cleanly.
        let mosaicAlpha = 0;
        // Post-front settle alpha — cells that just crossed the front fade
        // the last bit of opacity in over INTRO_SETTLE_WIDTH of armT.
        let cellAlpha = 1;
        if (intro) {
          const settleK = Math.min(
            1,
            Math.max(0, (cellProgress - c.armT) / INTRO_SETTLE_WIDTH),
          );
          cellAlpha = 0.6 + 0.4 * settleK;
        }

        if (intro) {
          const frontDist = cellProgress - c.armT;
          // Widen the front band once the reveal has crossed the wrist so the
          // palm/fingers unfurl feels softer and reinforces the slowdown.
          const wristBlend = Math.min(
            1,
            Math.max(0, (cellProgress - INTRO_WRIST_ANCHOR) / 0.12),
          );
          const frontWidth =
            INTRO_FRONT_WIDTH_BASE +
            (INTRO_FRONT_WIDTH_WRIST - INTRO_FRONT_WIDTH_BASE) * wristBlend;
          if (frontDist < frontWidth) {
            // Front-edge accent: scramble glyph, brighten toward highlight,
            // add small ±1px jitter for a spatter feel.
            const frontK = 1 - frontDist / frontWidth; // 1 at front, 0 behind
            const seed = grid
              ? grid.seed[
                  Math.floor((c.y - grid.originY) / CELL_H) * grid.cols +
                    Math.floor((c.x - grid.originX) / CELL_W)
                ] ?? 0.5
              : 0.5;
            const scramble = fract(
              Math.sin((seed + cellProgress * 1.6) * 12.9898) * 43758.5453,
            );
            const scrambleOffset = Math.floor(
              (scramble - 0.5) * RAMP_LEN * 0.4 * frontK,
            );
            const finalIdx =
              ((c.idx + scrambleOffset) % RAMP_LEN + RAMP_LEN) % RAMP_LEN;
            ch = glyphAt(finalIdx);
            const blend = frontK * 0.42;
            r += (HR - r) * blend;
            g += (HG - g) * blend;
            bl += (HB - bl) * blend;
            const jK = frontK * 0.8;
            jitterX = (fract(Math.sin(seed * 91.3) * 217.7) - 0.5) * 2 * jK;
            jitterY = (fract(Math.sin(seed * 53.1) * 411.3) - 0.5) * 2 * jK;
          }
        }

        if (showGooey && grid) {
          const cellUvX = (c.x / minWH) * aspectX;
          const cellUvY = c.y / minWH;
          const ddx = cellUvX - mUvX;
          const ddy = cellUvY - mUvY;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          // Directional weight: 1+STR along the arm axis, 1-STR across it.
          const nx = d > 1e-5 ? ddx / d : 0;
          const ny = d > 1e-5 ? ddy / d : 0;
          const along = nx * armDx + ny * armDy;
          const dirW = 1 + ARM_ALIGN_STRENGTH * (along * along * 2 - 1);

          // Per-cell hash + slow time wobble → ragged, gooey edge.
          const i = Math.floor((c.x - grid.originX) / CELL_W);
          const j = Math.floor((c.y - grid.originY) / CELL_H);
          const idx = j * grid.cols + i;
          const seed = grid.seed[idx] ?? 0.5;
          // Large, slow blob — pushes whole patches of the edge in/out.
          const lowFreq = (seed * 2 - 1) * GOOEY_NOISE * 1.5;
          // Mid-frequency wave uses arm-rotated cell coords so the chipped
          // lobes elongate along the arm axis (low freq along arm, high across).
          const localI = i * armDx + j * armDy;
          const localJ = -i * armDy + j * armDx;
          const midFreq =
            Math.sin(localI * 0.3 + localJ * 0.9 + seed * 1.5) * GOOEY_NOISE * 2.6;
          const lowFreq2 =
            Math.sin(localI * 0.15 + localJ * 0.42 + seed * 3.1) * GOOEY_NOISE * 3.0;
          // Slow time wobble so the edge "breathes" rather than flickers.
          const wobble = prefersReduce
            ? 0
            : Math.sin(timeSec * 0.5 + seed * 6.28318) * GOOEY_NOISE * 0.6;
          // High-frequency spatial hash — creates the fine chipped/broken texture.
          const highFreq =
            (fract(Math.sin(seed * 45.7) * 123.45) - 0.5) * GOOEY_NOISE * 0.35;
          const microFract =
            (fract(Math.sin(seed * 137.9) * 437.58) - 0.5) * GOOEY_NOISE * 0.2;
          const distorted =
            d +
            lowFreq +
            midFreq * dirW +
            lowFreq2 * dirW +
            wobble +
            highFreq * dirW +
            microFract * dirW;

          if (distorted < rHi) {
            // gooeyBlend = 1 - smoothstep(rLo, rHi, distorted)
            const tt = Math.min(
              1,
              Math.max(0, (distorted - rLo) / Math.max(1e-4, rHi - rLo)),
            );
            const gooey = 1 - tt * tt * (3 - 2 * tt);
            // sharpBlend = smoothstep(0, 0.15, gooey) — drives color and glyph swap.
            const sh = Math.min(1, Math.max(0, gooey / 0.15));
            const sharp = sh * sh * (3 - 2 * sh);

            if (sharp > 0.01) {
              // Modulate reveal by underlying cell luminance so dark
              // silhouette areas stay dark and only lit areas get tinted /
              // scrambled — preserves the light/dark structure.
              const lumaWeight = Math.pow(bb, 0.6);
              const sharpL = sharp * lumaWeight;
              // Per-cell random tilt "woken up" by the reveal disc: stable
              // phase from the cell seed, gated by sharp so outside the disc
              // the glyph stays perfectly upright.
              const raw = (seed - 0.5) * 2;
              const shapedPhase = Math.sign(raw) * Math.pow(Math.abs(raw), 1.4);
              revealTilt =
                shapedPhase *
                ((REVEAL_TILT_MAX_DEG * Math.PI) / 180) *
                sharp;
              // Scramble character index by hash(cell + scrambleSeed). Unlike
              // the base render, we do NOT gate by luminance — every cell
              // inside the disc participates so dark silhouette cells surface
              // as visible glyphs (matches source's ASCIIEffect scramble).
              const scramble = fract(
                Math.sin((seed + scrambleSeed) * 12.9898) * 43758.5453,
              );
              const scrambleOffset = Math.floor(
                (scramble - 0.5) * RAMP_LEN * 0.25 * sharpL,
              );
              const finalIdx =
                ((c.idx + scrambleOffset) % RAMP_LEN + RAMP_LEN) % RAMP_LEN;
              ch = glyphAt(finalIdx);

              // Blend base purple → cool highlight, weighted by luminance so
              // dark regions barely brighten.
              r += (HR - r) * sharpL;
              g += (HG - g) * sharpL;
              bl += (HB - bl) * sharpL;

              // Mosaic-shatter reveal: draw the raw source pixel as a broken
              // tile behind (in place of) the glyph. Uses the same `gooey`
              // mask so the shatter edge matches the ASCII reveal edge.
              if (gooey > MOSAIC_MASK_THRESHOLD) {
                const shatter = 1 - gooey; // 0 at center, ~1 at disc edge
                const jx =
                  (fract(Math.sin(seed * 12.7) * 91.3) - 0.5) *
                  2 *
                  MOSAIC_SHATTER_PX * shatterK *
                  shatter;
                const jy =
                  (fract(Math.sin(seed * 41.9) * 57.1) - 0.5) *
                  2 *
                  MOSAIC_SHATTER_PX * shatterK *
                  shatter;
                // Occasional splatter tiles fling further along arm normal
                // — small clumps of image break loose from the crowd.
                const splat = fract(Math.sin(seed * 73.1) * 811.7);
                const splatterActive = splat < MOSAIC_SPLATTER_PROB ? 1 : 0;
                const splatMag = splatterActive * MOSAIC_SPLATTER_PX * shatterK * shatter;
                // Perpendicular to arm axis (rotate arm dir 90°).
                const normX = -armDy;
                const normY = armDx;
                const splatSign =
                  fract(Math.sin(seed * 19.3) * 313.7) > 0.5 ? 1 : -1;
                const sx = jx + normX * splatMag * splatSign;
                const sy = jy + normY * splatMag * splatSign;
                const scale =
                  scaleMinDyn +
                  (MOSAIC_SCALE_MAX - scaleMinDyn) * (1 - shatter);
                const tw = CELL_W * scale;
                const th = CELL_H * scale;
                const tx =
                  c.x + offX * (0.30 + bb * 0.55 + c.armT * 0.45) +
                  sx + (CELL_W - tw) * 0.5;
                const ty =
                  c.y + offY * (0.30 + bb * 0.55 + c.armT * 0.45) +
                  sy + (CELL_H - th) * 0.5;
                // Lookup source color for this cell from grid.color.
                const colBase =
                  (Math.floor((c.y - grid.originY) / CELL_H) * grid.cols +
                    Math.floor((c.x - grid.originX) / CELL_W)) *
                  3;
                const cr = grid.color[colBase + 0] ?? 0;
                const cg = grid.color[colBase + 1] ?? 0;
                const cb = grid.color[colBase + 2] ?? 0;
                // Smoothstep-shaped alpha: saturated at the disc core,
                // gracefully fading through the shattered edge so tiles
                // dissolve into the surrounding ASCII rather than snapping off.
                const gg = Math.min(1, Math.max(0, gooey));
                const ss = gg * gg * (3 - 2 * gg);
                mosaicAlpha = Math.pow(ss, alphaGamma);
                ctx.fillStyle = `rgba(${cr},${cg},${cb},${mosaicAlpha})`;
                ctx.fillRect(tx, ty, tw, th);
              }
            }
          }
        }

        // ---- Click-lock reveal (per hand) ----
        // Runs independently of hover: if this cell belongs to a side whose
        // lock disc is currently expanded, paint the mosaic tile + scrambled
        // glyph the same way the hover disc does, but centered on the
        // click origin and sized to cover the whole hand.
        {
          const cellIsLeft = c.x < w / 2;
          const lockActive = cellIsLeft ? lockLActive : lockRActive;
          if (lockActive && grid) {
            const oxUv = cellIsLeft ? lockLUvX : lockRUvX;
            const oyUv = cellIsLeft ? lockLUvY : lockRUvY;
            const R2 = cellIsLeft ? lockLR : lockRR;
            const S2 = LOCK_SOFTNESS_UV;
            const cellUvX = (c.x / minWH) * aspectX;
            const cellUvY = c.y / minWH;
            const ddx = cellUvX - oxUv;
            const ddy = cellUvY - oyUv;
            const d2 = Math.sqrt(ddx * ddx + ddy * ddy);
            const armDx = cellIsLeft ? armDxL : armDxR;
            const armDy = armDyLR;
            const nx = d2 > 1e-5 ? ddx / d2 : 0;
            const ny = d2 > 1e-5 ? ddy / d2 : 0;
            const along = nx * armDx + ny * armDy;
            const dirW = 1 + ARM_ALIGN_STRENGTH * (along * along * 2 - 1);
            // Larger disc → scale up noise magnitude so the broken edge
            // reads at the same visual weight as the small hover disc.
            const NS = 2.4;
            const lowFreq = (cellSeed * 2 - 1) * GOOEY_NOISE * 1.5 * NS;
            const localI = cellI * armDx + cellJ * armDy;
            const localJ = -cellI * armDy + cellJ * armDx;
            const midFreq =
              Math.sin(localI * 0.3 + localJ * 0.9 + cellSeed * 1.5) *
              GOOEY_NOISE * 2.6 * NS;
            const lowFreq2 =
              Math.sin(localI * 0.15 + localJ * 0.42 + cellSeed * 3.1) *
              GOOEY_NOISE * 3.0 * NS;
            const wobble = prefersReduce
              ? 0
              : Math.sin(timeSec * 0.5 + cellSeed * 6.28318) *
                GOOEY_NOISE * 0.6 * NS;
            const highFreq =
              (fract(Math.sin(cellSeed * 45.7) * 123.45) - 0.5) *
              GOOEY_NOISE * 0.35 * NS;
            const microFract =
              (fract(Math.sin(cellSeed * 137.9) * 437.58) - 0.5) *
              GOOEY_NOISE * 0.2 * NS;
            const distorted2 =
              d2 + lowFreq + midFreq * dirW + lowFreq2 * dirW +
              wobble + highFreq * dirW + microFract * dirW;
            const rLo2 = R2 - S2;
            const rHi2 = R2 + S2;
            if (distorted2 < rHi2) {
              const tt2 = Math.min(
                1,
                Math.max(0, (distorted2 - rLo2) / Math.max(1e-4, rHi2 - rLo2)),
              );
              const gooey2 = 1 - tt2 * tt2 * (3 - 2 * tt2);
              const sh2 = Math.min(1, Math.max(0, gooey2 / 0.15));
              const sharp2 = sh2 * sh2 * (3 - 2 * sh2);
              if (sharp2 > 0.01) {
                const lumaWeight = Math.pow(bb, 0.6);
                const sharpL = sharp2 * lumaWeight;
                const scramble = fract(
                  Math.sin((cellSeed + scrambleSeed) * 12.9898) * 43758.5453,
                );
                const scrambleOffset = Math.floor(
                  (scramble - 0.5) * RAMP_LEN * 0.25 * sharpL,
                );
                const finalIdx =
                  ((c.idx + scrambleOffset) % RAMP_LEN + RAMP_LEN) % RAMP_LEN;
                ch = glyphAt(finalIdx);
                r += (HR - r) * sharpL;
                g += (HG - g) * sharpL;
                bl += (HB - bl) * sharpL;
                const rawT = (cellSeed - 0.5) * 2;
                const shapedPhase =
                  Math.sign(rawT) * Math.pow(Math.abs(rawT), 1.4);
                const lockTilt =
                  shapedPhase *
                  ((REVEAL_TILT_MAX_DEG * Math.PI) / 180) *
                  sharp2;
                if (Math.abs(lockTilt) > Math.abs(revealTilt)) {
                  revealTilt = lockTilt;
                }
                if (gooey2 > MOSAIC_MASK_THRESHOLD) {
                  const shatter = 1 - gooey2;
                  const jx =
                    (fract(Math.sin(cellSeed * 12.7) * 91.3) - 0.5) *
                    2 * MOSAIC_SHATTER_PX * shatterK * shatter;
                  const jy =
                    (fract(Math.sin(cellSeed * 41.9) * 57.1) - 0.5) *
                    2 * MOSAIC_SHATTER_PX * shatterK * shatter;
                  const splat = fract(Math.sin(cellSeed * 73.1) * 811.7);
                  const splatterActive =
                    splat < MOSAIC_SPLATTER_PROB ? 1 : 0;
                  const splatMag =
                    splatterActive * MOSAIC_SPLATTER_PX * shatterK * shatter;
                  const normX = -armDy;
                  const normY = armDx;
                  const splatSign =
                    fract(Math.sin(cellSeed * 19.3) * 313.7) > 0.5 ? 1 : -1;
                  const sx = jx + normX * splatMag * splatSign;
                  const sy = jy + normY * splatMag * splatSign;
                  const scale =
                    scaleMinDyn +
                    (MOSAIC_SCALE_MAX - scaleMinDyn) * (1 - shatter);
                  const tw = CELL_W * scale;
                  const th = CELL_H * scale;
                  const tx =
                    c.x + offX * (0.30 + bb * 0.55 + c.armT * 0.45) +
                    sx + (CELL_W - tw) * 0.5;
                  const ty =
                    c.y + offY * (0.30 + bb * 0.55 + c.armT * 0.45) +
                    sy + (CELL_H - th) * 0.5;
                  const colBase = (cellJ * grid.cols + cellI) * 3;
                  const cr = grid.color[colBase + 0] ?? 0;
                  const cg = grid.color[colBase + 1] ?? 0;
                  const cb = grid.color[colBase + 2] ?? 0;
                  const gg = Math.min(1, Math.max(0, gooey2));
                  const ss = gg * gg * (3 - 2 * gg);
                  const lockAlpha = Math.pow(ss, alphaGamma);
                  if (lockAlpha > mosaicAlpha) mosaicAlpha = lockAlpha;
                  ctx.fillStyle = `rgba(${cr},${cg},${cb},${lockAlpha})`;
                  ctx.fillRect(tx, ty, tw, th);
                }
              }
            }
          }
        }

        // Per-cell depth parallax: brighter (foreground) cells drift more,
        // dark cells hold back — reads as pseudo-3D layering.
        const depth = hoverActive ? 0.30 + bb * 0.55 + c.armT * 0.45 : 1;
        const cellOffX = offX * depth;
        const cellOffY = offY * depth;

        // Per-cell tilt: nearby glyphs rotate slightly, tangential to cursor.
        let angle = 0;
        if (hoverActive) {
          const dxc = c.x + CELL_W / 2 - discX;
          const dyc = c.y + CELL_H / 2 - discY;
          const dist = Math.hypot(dxc, dyc);
          const tRaw = Math.min(1, dist / TILT_FALLOFF);
          const falloff = 1 - tRaw * tRaw * (3 - 2 * tRaw);
          if (falloff > 0) {
            angle = ((dxc + dyc * 0.35) / TILT_FALLOFF) * tiltScale * falloff;
          }
        }

        // Continuous mosaic→glyph fade: as the mosaic tile grows more
        // opaque, the underlying ASCII glyph smoothly recedes. No hard
        // switch, so edges dissolve rather than pop.
        let residueAlpha = 1;
        if (mosaicAlpha > 0) {
          const t = Math.min(1, Math.max(0, (mosaicAlpha - fadeLo) / fadeSpan));
          const fade = t * t * (3 - 2 * t);
          residueAlpha = 1 - fade;
          if (residueAlpha < 0.02) continue;
        }
        const drawX = c.x + cellOffX + jitterX;
        const drawY = c.y + FONT_PX + cellOffY + jitterY;
        const finalAngle = angle + revealTilt;
        const useTransform = Math.abs(finalAngle) > 0.003;

        if (useTransform) {
          const cx = c.x + cellOffX + jitterX + CELL_W / 2;
          const cy = c.y + cellOffY + jitterY + CELL_H / 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(finalAngle);
          if (c.isEdge) {
            ctx.fillStyle = `rgba(15,12,25,${0.75 * cellAlpha * residueAlpha})`;
            const lx = -CELL_W / 2;
            const ly = FONT_PX - CELL_H / 2;
            ctx.fillText(ch, lx - 1, ly - 1);
            ctx.fillText(ch, lx + 1, ly - 1);
            ctx.fillText(ch, lx - 1, ly + 1);
            ctx.fillText(ch, lx + 1, ly + 1);
          }
          ctx.fillStyle = `rgba(${r | 0},${g | 0},${bl | 0},${cellAlpha * residueAlpha})`;
          ctx.fillText(ch, -CELL_W / 2, FONT_PX - CELL_H / 2);
          ctx.restore();
        } else {
          if (c.isEdge) {
            ctx.fillStyle = `rgba(15,12,25,${0.75 * cellAlpha * residueAlpha})`;
            ctx.fillText(ch, drawX - 1, drawY - 1);
            ctx.fillText(ch, drawX + 1, drawY - 1);
            ctx.fillText(ch, drawX - 1, drawY + 1);
            ctx.fillText(ch, drawX + 1, drawY + 1);
          }
          ctx.fillStyle = `rgba(${r | 0},${g | 0},${bl | 0},${cellAlpha * residueAlpha})`;
          ctx.fillText(ch, drawX, drawY);
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const handsVisible = stage === "hands";
  const [orbMounted, setOrbMounted] = useState(true);
  const handleIntroProgress = (_info: IntroProgressInfo) => {
    /* shader draws burst internally; no external state needed */
  };
  const handleIntroEnded = () => {
    if (stageRef.current !== "orb") return;
    setBgDark(true);
    setStage("hands");
    // Keep the intro layer mounted briefly so the burst overlay can fade out
    // on top of it, then unmount.
    window.setTimeout(() => setOrbMounted(false), 500);
  };
  const [bgDark, setBgDark] = useState(false);
  const layout = useHeroLayout();
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("app-bg-change", { detail: bgDark ? "dark" : "light" })
    );
  }, [bgDark]);
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: bgDark ? "#0a0a0a" : "#EFE7DA",
        height: "100vh",
        minHeight: 600,
      }}
    >
      <h1 className="sr-only" suppressHydrationWarning>
        Good Fella Studio — ASCII Creation of Adam
      </h1>

      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute"
        style={{
          zIndex: 10,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(100vw, 1440px)",
          top: layout.handsTop,
          height: layout.handsHeight,
          opacity: handsVisible ? 1 : 0,
          pointerEvents: handsVisible ? "auto" : "none",
          transition: "opacity 300ms ease-out",
        }}
      />

      {orbMounted && (
        <div
          className="absolute inset-0"
          style={{
            zIndex: 60,
            isolation: "isolate",
            pointerEvents: stage === "orb" ? "auto" : "none",
          }}
        >
          <IntroVideo onEnded={handleIntroEnded} onProgress={handleIntroProgress} />
        </div>
      )}

    </section>
  );
}

export default AsciiHandsFooter;