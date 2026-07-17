import { useEffect, useRef } from "react";
import handsPairAsset from "@/assets/hands-pair.png.asset.json";

// Density ramp — dark → bright. Each bucket is a set of glyphs of roughly
// the same visual weight. Cells pick their bucket from silhouette luminance.
const RAMP: string[] = [
  ".,'`\"    ", //  bucket 0 — deepest shadow
  ":;-~_    ", //  1
  "+=<>|/\\ ", //  2
  "cvxzjrft ", //  3
  "uonymPCV ", //  4  midtone
  "YZXUJK0 ", //   5
  "abdegh# ", //   6
  "%$8&B@# ", //   7  highlight
];

type Cell = {
  x: number;
  y: number;
  b: number; // 0..1 luminance from source
  bucket: number; // ramp index derived from b
  ch: string;
};

const CELL_W = 7;
const CELL_H = 10;
const INFLUENCE_RADIUS = 130;

function pickFrom(set: string) {
  // Ramp buckets are padded with spaces so brighter buckets pick fewer spaces
  // by chance — gives a natural falloff without special-casing.
  const trimmed = set.trimEnd() || " ";
  return trimmed.charAt(Math.floor(Math.random() * trimmed.length));
}

function bucketFor(b: number) {
  const idx = Math.floor(b * RAMP.length);
  return Math.min(RAMP.length - 1, Math.max(0, idx));
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
  const cells: Cell[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = (j * cols + i) * 4;
      // grayscale source — average RGB and normalize
      const b = (data[idx] + data[idx + 1] + data[idx + 2]) / (3 * 255);
      if (b > 0.08) {
        const bucket = bucketFor(b);
        cells.push({
          x: targetRect.x + i * CELL_W,
          y: targetRect.y + j * CELL_H,
          b,
          bucket,
          ch: pickFrom(RAMP[bucket]),
        });
      }
    }
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

        // ambient shimmer: reroll glyph within its own bucket so shadows
        // stay shadow-glyphs and highlights stay highlight-glyphs.
        if (!prefersReduce && Math.random() < 0.006) {
          c.ch = pickFrom(RAMP[c.bucket]);
        }

        let dx = 0;
        let dy = 0;
        let ch = c.ch;
        // Base color: coral, shadowed cells desaturate toward deep red-brown.
        // b=0 -> ~#4a1410  ,  b=1 -> ~#ff8a70
        const bb = c.b;
        let r = Math.floor(70 + bb * 195); // 70..255
        let g = Math.floor(20 + bb * 118); // 20..138
        let bl = Math.floor(16 + bb * 96); // 16..112
        let alpha = 0.25 + bb * 0.7; // 0.25..0.95

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
            alpha = Math.min(1, alpha + t * 0.35);
            // bump one ramp bucket up near the core of the cursor
            if (t > 0.5) {
              const upBucket = Math.min(RAMP.length - 1, c.bucket + 1);
              ch = pickFrom(RAMP[upBucket]);
            }
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