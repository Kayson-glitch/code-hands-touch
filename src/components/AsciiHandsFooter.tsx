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
const GOOEY_RADIUS_UV = 0.15;
const GOOEY_SOFTNESS_UV = 0.08;
const GOOEY_NOISE = 0.03;
// Intensity ease durations (ms) — cursor enter / leave.
const INTENSITY_IN_MS = 200;
const INTENSITY_OUT_MS = 250;

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
    });
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let running = true;

    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };
    const onLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: t.clientX - rect.left,
        y: t.clientY - rect.top,
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

      // Ease intensity toward 1 when cursor is active, 0 otherwise. Mirrors
      // the source's animated uGooeyIntensity so the disc doesn't pop in/out.
      const target = m.active && !prefersReduce ? 1 : 0;
      const easeMs = target > intensity ? INTENSITY_IN_MS : INTENSITY_OUT_MS;
      const step = dt / easeMs;
      intensity = target > intensity
        ? Math.min(1, intensity + step)
        : Math.max(0, intensity - step);

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
      const mUvX = showGooey ? (m.x / minWH) * aspectX : 0;
      const mUvY = showGooey ? m.y / minWH : 0;
      const R = GOOEY_RADIUS_UV * intensity;
      const S = GOOEY_SOFTNESS_UV * intensity * 0.5;
      const rLo = R - S;
      const rHi = R + S;

      // Highlight tint the source's revealed cells migrate toward. Sampled
      // from good-fella.com's rendered hover — a warm near-white.
      const HR = 240, HG = 200, HB = 175;

      for (let k = 0; k < cells.length; k++) {
        const c = cells[k];
        const bb = c.b;

        // Base coral color from the ramp:
        //   shadow rgb(30, 17, 22) → highlight rgb(223, 93, 68)
        let r = 30 + bb * 193;
        let g = 17 + bb * 76;
        let bl = 22 + bb * 46;
        let ch = c.ch;

        if (showGooey && grid) {
          const cellUvX = (c.x / minWH) * aspectX;
          const cellUvY = c.y / minWH;
          const ddx = cellUvX - mUvX;
          const ddy = cellUvY - mUvY;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);

          // Per-cell hash + slow time wobble → ragged, gooey edge.
          const i = Math.floor((c.x - grid.originX) / CELL_W);
          const j = Math.floor((c.y - grid.originY) / CELL_H);
          const idx = j * grid.cols + i;
          const seed = grid.seed[idx] ?? 0.5;
          const wobble = prefersReduce
            ? 0
            : Math.sin(timeSec * 1.5 + seed * 6.28318) * GOOEY_NOISE * 0.3;
          const distorted = d + seed * GOOEY_NOISE * 2 + wobble;

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
              // Scramble character index by hash(cell + scrambleSeed), scaled by
              // luminance so dark cells scramble less.
              const scramble = fract(
                Math.sin((seed + scrambleSeed) * 12.9898) * 43758.5453,
              );
              const scrambled =
                (c.idx + Math.floor(scramble * RAMP_LEN * bb)) % RAMP_LEN;
              ch = glyphAt(scrambled);

              // Blend base coral → warm highlight by sharp.
              r += (HR - r) * sharp;
              g += (HG - g) * sharp;
              bl += (HB - bl) * sharp;
            }
          }
        }

        ctx.fillStyle = `rgba(${r | 0},${g | 0},${bl | 0},1)`;
        // baseline offset — glyph ascent for Cascadia Mono ≈ FONT_PX,
        // so this seats the glyph inside the CELL_H box with 1-px top air.
        ctx.fillText(ch, c.x, c.y + FONT_PX);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
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