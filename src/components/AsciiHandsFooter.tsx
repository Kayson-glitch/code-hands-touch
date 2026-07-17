import { useEffect, useRef } from "react";
import handsPairAsset from "@/assets/hands-pair.png.asset.json";

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
const GOOEY_RADIUS_UV = 0.0376;
const GOOEY_SOFTNESS_UV = 0.023;
const GOOEY_NOISE = 0.018;
// Max whole-scene parallax drift on hover, in CSS pixels. Small — mirrors the
// source's "the picture leans toward the finger" feel.
const PARALLAX_MAX = 8;
const PARALLAX_LERP = 0.08;
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
const ARM_ALIGN_STRENGTH = 0.85;
// Intro reveal timing — arms grow from screen edge inward along the arm axis.
const INTRO_DURATION_MS = 1600;
const INTRO_FRONT_WIDTH = 0.08;
const introEase = (t: number) => 1 - Math.pow(1 - t, 3);

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
  const cols = Math.floor(targetRect.w / CELL_W);
  const rows = Math.floor(targetRect.h / CELL_H);
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
  // Compute per-cell armT: project each cell onto its side's arm axis so that
  // 0 = outer edge (arm root) and 1 = center (fingertip). Left-half cells use
  // the +ARM angle, right-half cells use the mirrored angle.
  {
    const armRad = (ARM_ANGLE_DEG * Math.PI) / 180;
    const cx = targetRect.x + targetRect.w * 0.5;
    const cAng = Math.cos(armRad);
    const sAng = Math.sin(armRad);
    let lMin = Infinity, lMax = -Infinity, rMin = Infinity, rMax = -Infinity;
    const projs = new Float32Array(cells.length);
    for (let k = 0; k < cells.length; k++) {
      const c = cells[k];
      const isLeft = c.x < cx;
      const sideSign = isLeft ? 1 : -1;
      const dx = (c.x - (isLeft ? targetRect.x : targetRect.x + targetRect.w));
      const dy = c.y - (targetRect.y + targetRect.h);
      // along-arm axis: (cos*sideSign, -sin). Since roots are at outer edge
      // and bottom, cells closer to root have smaller projection.
      const p = dx * cAng * sideSign + dy * -sAng;
      projs[k] = p;
      if (isLeft) {
        if (p < lMin) lMin = p;
        if (p > lMax) lMax = p;
      } else {
        if (p < rMin) rMin = p;
        if (p > rMax) rMax = p;
      }
    }
    const lSpan = Math.max(1e-4, lMax - lMin);
    const rSpan = Math.max(1e-4, rMax - rMin);
    for (let k = 0; k < cells.length; k++) {
      const c = cells[k];
      const isLeft = c.x < cx;
      const t = isLeft
        ? (projs[k] - lMin) / lSpan
        : (projs[k] - rMin) / rSpan;
      c.armT = Math.min(1, Math.max(0, t));
    }
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
    },
  };
}

export function AsciiHandsFooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
          if (e.isIntersecting && !introVisibleRef.current) {
            introVisibleRef.current = true;
            introStartRef.current = performance.now();
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(canvas);

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

    let frame = 0;
    let lastT = performance.now();
    let intensity = 0;
    let scrambleSeed = 0;
    let scrambleTick = 0;
    let parallaxX = 0;
    let parallaxY = 0;
    let discX = -9999;
    let discY = -9999;
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

      // Intro reveal progress (0..1). Cells with armT > progress are skipped.
      let introProgress = 1;
      if (!introDoneRef.current) {
        if (introVisibleRef.current && introStartRef.current != null) {
          const raw = Math.min(
            1,
            Math.max(0, (now - introStartRef.current) / INTRO_DURATION_MS),
          );
          introProgress = introEase(raw);
          if (raw >= 1) introDoneRef.current = true;
        } else {
          introProgress = 0;
        }
      }
      const intro = introProgress < 1;

      // Lerp intensity toward its target — no hard delay gate. The visual
      // hover-in latency comes from the disc position also lerping toward
      // the cursor (below), mirroring the source site's follow behaviour.
      // Decay pointer speed when no move events arrive (~120ms half-life-ish).
      mouseSpeedRef.current *= Math.exp(-dt / 120);
      const speedK = Math.min(1, mouseSpeedRef.current / SPEED_REF);
      const discLerp = DISC_LERP_MIN + (DISC_LERP_MAX - DISC_LERP_MIN) * speedK;
      const intensityLerp =
        INTENSITY_LERP_MIN + (INTENSITY_LERP_MAX - INTENSITY_LERP_MIN) * speedK;

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
      const mUvX = showGooey ? (discX / minWH) * aspectX : 0;
      const mUvY = showGooey ? discY / minWH : 0;
      const R = GOOEY_RADIUS_UV * intensity;
      const S = GOOEY_SOFTNESS_UV * intensity * 0.5;
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

      // Highlight tint the source's revealed cells migrate toward. Sampled
      // from good-fella.com's rendered hover — a warm near-white.
      const HR = 240, HG = 200, HB = 175;

      for (let k = 0; k < cells.length; k++) {
        const c = cells[k];
        if (intro && c.armT > introProgress) continue;
        const bb = c.b;

        // Base coral color from the ramp:
        //   shadow rgb(30, 17, 22) → highlight rgb(223, 93, 68)
        let r = 30 + bb * 193;
        let g = 17 + bb * 76;
        let bl = 22 + bb * 46;
        let ch = c.ch;
        let jitterX = 0;
        let jitterY = 0;

        if (intro) {
          const frontDist = introProgress - c.armT;
          if (frontDist < INTRO_FRONT_WIDTH) {
            // Front-edge accent: scramble glyph, brighten toward highlight,
            // add small ±1px jitter for a spatter feel.
            const frontK = 1 - frontDist / INTRO_FRONT_WIDTH; // 1 at front, 0 behind
            const seed = grid
              ? grid.seed[
                  Math.floor((c.y - grid.originY) / CELL_H) * grid.cols +
                    Math.floor((c.x - grid.originX) / CELL_W)
                ] ?? 0.5
              : 0.5;
            const scramble = fract(
              Math.sin((seed + introProgress * 3.7) * 12.9898) * 43758.5453,
            );
            const scrambleOffset = Math.floor(
              (scramble - 0.5) * RAMP_LEN * 0.5 * frontK,
            );
            const finalIdx =
              ((c.idx + scrambleOffset) % RAMP_LEN + RAMP_LEN) % RAMP_LEN;
            ch = glyphAt(finalIdx);
            const blend = frontK * 0.6;
            r += (HR - r) * blend;
            g += (HG - g) * blend;
            bl += (HB - bl) * blend;
            const jK = frontK * 1.0;
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
            Math.sin(localI * 0.3 + localJ * 0.9 + seed * 1.5) * GOOEY_NOISE * 5;
          // Slow time wobble so the edge "breathes" rather than flickers.
          const wobble = prefersReduce
            ? 0
            : Math.sin(timeSec * 0.5 + seed * 6.28318) * GOOEY_NOISE * 0.6;
          // High-frequency spatial hash — creates the fine chipped/broken texture.
          const highFreq =
            (fract(Math.sin(seed * 45.7) * 123.45) - 0.5) * GOOEY_NOISE * 1.0;
          const microFract =
            (fract(Math.sin(seed * 137.9) * 437.58) - 0.5) * GOOEY_NOISE * 0.5;
          const distorted =
            d +
            lowFreq +
            midFreq * dirW +
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

              // Blend base coral → warm highlight, weighted by luminance so
              // dark regions barely brighten.
              r += (HR - r) * sharpL;
              g += (HG - g) * sharpL;
              bl += (HB - bl) * sharpL;
            }
          }
        }

        ctx.fillStyle = `rgba(${r | 0},${g | 0},${bl | 0},1)`;
        // baseline offset — glyph ascent for Cascadia Mono ≈ FONT_PX,
        // so this seats the glyph inside the CELL_H box with 1-px top air.
        // offX/offY is a subtle whole-scene parallax that eases in with hover.
        ctx.fillText(ch, c.x + offX + jitterX, c.y + FONT_PX + offY + jitterY);
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
    };
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: "#0a0a0a", height: "100vh", minHeight: 600 }}
    >
      <h1 className="sr-only">Good Fella Studio — ASCII Creation of Adam</h1>

      {/* Giant faded wordmark behind everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden"
        style={{ height: "45%" }}
      >
        <span
          className="select-none whitespace-nowrap font-bold tracking-tight"
          style={{
            fontSize: "clamp(8rem, 22vw, 22rem)",
            lineHeight: 1,
            color: "rgba(255,255,255,0.05)",
            transform: "translateY(30%)",
            fontFamily: '"Geist Mono", ui-monospace, monospace',
          }}
        >
          Good/Fella
        </span>
      </div>

      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
      />

    </section>
  );
}

export default AsciiHandsFooter;