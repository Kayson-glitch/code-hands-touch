import { useEffect, useRef } from "react";
import handsPairAsset from "@/assets/hands-pair.png.asset.json";

// Ordered density ramp, dark → bright. Leading spaces give real negative
// space in the deepest shadows; each following glyph is one visual weight
// step. Cell's index into this string comes from its normalized luminance.
const RAMP =
  "   ..,':;!li|/\\+=tcvnxzuoaswmkhbdpg#%8&@MWNQ$B";
const RAMP_LEN = RAMP.length;

// Per-direction edge glyph subsets, each ordered dark→bright within its
// orientation. Cells pick from the subset deterministically by seed+brightness,
// so linework varies in weight across an edge run without flickering.
// 0: horizontal, 1: anti-diagonal (\), 2: vertical, 3: diagonal (/)
const EDGE_SETS = ["-_=~", "\\`,%", "|!Il1", "/;j7"];

type Cell = {
  x: number;
  y: number;
  b: number; // 0..1 normalized luminance (post stretch + gamma)
  idx: number; // ramp index derived from b
  ch: string;
  edge: number; // 0..1 gradient magnitude
  dir: 0 | 1 | 2 | 3; // quantized gradient direction
  seed: number; // stable per-cell integer for deterministic glyph picks
};

const CELL_W = 7;
const CELL_H = 9;
const INFLUENCE_RADIUS = 130;

function glyphAt(idx: number) {
  const clamped = Math.min(RAMP_LEN - 1, Math.max(0, idx));
  return RAMP.charAt(clamped);
}

function indexFor(b: number) {
  const idx = Math.floor(b * (RAMP_LEN - 1));
  return Math.min(RAMP_LEN - 1, Math.max(0, idx));
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
): Cell[] {
  const off = document.createElement("canvas");
  const cols = Math.floor(targetRect.w / CELL_W);
  const rows = Math.floor(targetRect.h / CELL_H);
  off.width = cols;
  off.height = rows;
  const octx = off.getContext("2d", { willReadFrequently: true })!;
  octx.imageSmoothingEnabled = true;
  if (mirror) {
    octx.translate(cols, 0);
    octx.scale(-1, 1);
  }
  octx.drawImage(img, 0, 0, cols, rows);
  const data = octx.getImageData(0, 0, cols, rows).data;

  // Pass 1: perceptual luma (Rec.709) for the entire grid — keep the full
  // buffer so Sobel can sample neighbors, including cells below threshold.
  const luma = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = (j * cols + i) * 4;
      luma[j * cols + i] =
        (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
    }
  }

  type Raw = { i: number; j: number; y: number; gx: number; gy: number; mag: number };
  const raws: Raw[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const y = luma[j * cols + i];
      if (y <= 0.07) continue;
      // 3×3 Sobel — clamp at borders.
      const jm = j > 0 ? j - 1 : j;
      const jp = j < rows - 1 ? j + 1 : j;
      const im = i > 0 ? i - 1 : i;
      const ip = i < cols - 1 ? i + 1 : i;
      const tl = luma[jm * cols + im], tc = luma[jm * cols + i], tr = luma[jm * cols + ip];
      const ml = luma[j * cols + im],                          mr = luma[j * cols + ip];
      const bl = luma[jp * cols + im], bc = luma[jp * cols + i], br = luma[jp * cols + ip];
      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      const mag = Math.hypot(gx, gy);
      raws.push({ i, j, y, gx, gy, mag });
    }
  }
  if (raws.length === 0) return [];

  // Percentile stretch: 8th..92nd → 0..1 for dramatic dynamic range, then
  // an S-curve (smoothstep) to crush shadows and punch highlights.
  const sorted = raws.map((r) => r.y).sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.08)];
  const hi = sorted[Math.floor(sorted.length * 0.92)];
  const span = Math.max(1e-4, hi - lo);

  // Normalize gradient magnitude by the 95th percentile so edge intensity
  // is stable across images and resolutions.
  const mags = raws.map((r) => r.mag).sort((a, b) => a - b);
  const magNorm = Math.max(1e-4, mags[Math.floor(mags.length * 0.95)]);

  const cells: Cell[] = [];
  for (const r of raws) {
    const stretched = Math.min(1, Math.max(0, (r.y - lo) / span));
    // smoothstep: 3x² − 2x³
    const b = stretched * stretched * (3 - 2 * stretched);
    const idx = indexFor(b);
    const edge = Math.min(1, r.mag / magNorm);
    // Quantize angle into 4 bins matching EDGE_GLYPHS.
    // atan2 domain (−π, π]; shift by π/8 so bin centers land on cardinals.
    let a = Math.atan2(r.gy, r.gx);
    if (a < 0) a += Math.PI; // gradient direction is orientation, not signed
    // a ∈ [0, π); map to 4 bins.
    const dir = (Math.floor(((a + Math.PI / 8) / Math.PI) * 4) % 4) as 0 | 1 | 2 | 3;
    cells.push({
      x: targetRect.x + r.i * CELL_W,
      y: targetRect.y + r.j * CELL_H,
      b,
      idx,
      ch: glyphAt(idx),
      edge,
      dir,
      seed: (r.i * 131 + r.j * 17) & 0xff,
    });
  }
  return cells;
}

export function AsciiHandsFooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<Cell[]>([]);
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
      cellsRef.current = sampleImage(
        img,
        { x: 0, y: bandY, w: bandW, h: bandH },
        false,
      );
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
    const draw = () => {
      if (!running) return;
      frame++;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${CELL_H}px "JetBrains Mono", "Menlo", "Courier New", monospace`;
      ctx.textBaseline = "top";

      const cells = cellsRef.current;
      const m = mouseRef.current;
      const r2 = INFLUENCE_RADIUS * INFLUENCE_RADIUS;

      for (let k = 0; k < cells.length; k++) {
        const c = cells[k];

        // ambient shimmer: nudge one step along the ramp so shading stays
        // coherent — shadows stay shadows, highlights stay highlights.
        if (!prefersReduce && c.edge < 0.55 && Math.random() < 0.006) {
          const jitter = Math.random() < 0.5 ? -1 : 1;
          c.ch = glyphAt(c.idx + jitter);
        }

        let dx = 0;
        let dy = 0;
        let ch = c.ch;
        // Glyph already encodes brightness. Color ramps from deep coral
        // shadow to warm near-white highlight; alpha widens the range so
        // shadow glyphs recede and highlights pop.
        const bb = c.b;
        let r = Math.floor(50 + bb * 205); //  50 → 255
        let g = Math.floor(14 + bb * 196); //  14 → 210
        let bl = Math.floor(10 + bb * 180); //  10 → 190
        let alpha = 0.45 + bb * 0.55; // 0.45 → 1.0

        // Edge layer: strong edges become directional line glyphs; medium
        // edges bump a few rungs up the density ramp so contours read
        // brighter than surrounding shade.
        if (c.edge > 0.55) {
          const set = EDGE_SETS[c.dir];
          const weight = Math.floor(c.b * (set.length - 1));
          ch = set.charAt((c.seed + weight) % set.length);
        } else if (c.edge > 0.35) {
          ch = glyphAt(c.idx + 3);
        }

        // Specular rim: strong edge on the bright side of the tonemap →
        // mix toward warm white and force full alpha.
        if (c.edge > 0.5 && bb > 0.55) {
          const t = 0.4;
          r = Math.floor(r * (1 - t) + 255 * t);
          g = Math.floor(g * (1 - t) + 228 * t);
          bl = Math.floor(bl * (1 - t) + 212 * t);
          alpha = 1;
        }

        if (m.active && !prefersReduce) {
          const ddx = c.x - m.x;
          const ddy = c.y - m.y;
          const dist2 = ddx * ddx + ddy * ddy;
          if (dist2 < r2) {
            const dist = Math.sqrt(dist2);
            const t = 1 - dist / INFLUENCE_RADIUS; // 0..1
            // subtle radial push — don't shred shading
            const push = t * 7;
            dx = (ddx / (dist || 1)) * push;
            dy = (ddy / (dist || 1)) * push;
            // add cursor "light" on top of base luminance (clamped)
            const lift = t * 0.85;
            r = Math.min(255, r + Math.floor(lift * 200));
            g = Math.min(255, g + Math.floor(lift * 170));
            bl = Math.min(255, bl + Math.floor(lift * 150));
            alpha = Math.min(1, alpha + t * 0.1);
            // step several rungs up the ramp near cursor core
            const bump = Math.floor(t * 5); // 0..5
            if (bump > 0) ch = glyphAt(c.idx + bump);
          }
        }

        ctx.fillStyle = `rgba(${r},${g},${bl},${alpha})`;
        ctx.fillText(ch, c.x + dx, c.y + dy);
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
            fontFamily: '"Inter", "Helvetica Neue", sans-serif',
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

      {/* Center copy */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="text-center"
          style={{
            color: "rgba(230,230,230,0.85)",
            fontFamily: '"Inter", "Helvetica Neue", sans-serif',
            fontSize: "0.95rem",
            lineHeight: 1.8,
            letterSpacing: "0.01em",
          }}
        >
          <p>© 2026</p>
          <p>Good Fella Studio GmbH.</p>
          <p>Let the Fellas handle it.</p>
        </div>
      </div>
    </section>
  );
}

export default AsciiHandsFooter;