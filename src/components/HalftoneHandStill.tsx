import { useEffect, useRef } from "react";
import handsFramesAsset from "@/assets/hands-frames.webp.asset.json";

/**
 * Static halftone rendering of ONE hand, taken from the same sprite atlas the
 * homepage uses. The final frame is cropped to a single hand and downsampled
 * onto a dot grid where the dot AREA carries the tone — matching the first
 * screen's ink language, but frozen (no scroll scrub, no video).
 */

const ATLAS_COLS = 7;
const FRAME_COUNT = 49;
const FRAME_W = 320;
const FRAME_H = 178;

const DOT_FILL = 0.9;
const MIN_DENSITY = 0.05;
const SQUARE_AT = 0.88;
const INK_STOPS: Array<[number, number, number]> = [
  [0xdc, 0xdc, 0xdc],
  [0xb4, 0xb4, 0xb4],
  [0x82, 0x82, 0x82],
];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (v) => (v + 0.5) / 16,
);

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

type Props = {
  /** Atlas frame to freeze on (defaults to the last frame). */
  frame?: number;
  /** Horizontal crop of the source frame, 0..1. Defaults to the right hand. */
  cropX?: number;
  cropW?: number;
  /** Vertical crop of the source frame, 0..1. */
  cropY?: number;
  cropH?: number;
  /** Dot pitch in CSS px. */
  pitch?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function HalftoneHandStill({
  frame = FRAME_COUNT - 1,
  cropX = 0.44,
  cropW = 0.56,
  cropY = 0,
  cropH = 1,
  pitch = 5,
  className,
  style,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let alive = true;
    let atlas: HTMLImageElement | null = null;

    const draw = () => {
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
      ctx.clearRect(0, 0, w, h);

      // Contain-fit the cropped source so the hand keeps its aspect ratio.
      const srcAr = (cropW * FRAME_W) / (cropH * FRAME_H);
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
      const sx = (idx % ATLAS_COLS) * FRAME_W + cropX * FRAME_W;
      const sy = Math.floor(idx / ATLAS_COLS) * FRAME_H + cropY * FRAME_H;
      (octx as unknown as { filter: string }).filter = "blur(0.5px)";
      octx.drawImage(
        atlas,
        sx,
        sy,
        cropW * FRAME_W,
        cropH * FRAME_H,
        0,
        0,
        cols,
        rows,
      );
      (octx as unknown as { filter: string }).filter = "none";
      const data = octx.getImageData(0, 0, cols, rows).data;

      const half = pitch * 0.5;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const p = (j * cols + i) * 4;
          const luma =
            (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
          const t = Math.min(1, Math.max(0, (1 - luma - 0.02) / 0.88));
          let density = Math.pow(t, 0.8);
          const dither = (BAYER[(j & 3) * 4 + (i & 3)] - 0.5) * 0.07;
          density = Math.min(1, Math.max(0, density + dither));
          if (density < MIN_DENSITY) continue;
          const keep = smoothstep((density - MIN_DENSITY) / 0.22);
          if (hash2(i, j) > 0.16 + keep * 0.84) continue;

          const cxp = offX + (i + 0.5) * pitch;
          const cyp = offY + (j + 0.5) * pitch;
          const r = Math.max(0.35, Math.sqrt(density) * half * DOT_FILL);
          const [ri, gi, bi] = inkAt(density);
          ctx.fillStyle = `rgb(${ri},${gi},${bi})`;
          ctx.beginPath();
          if (density >= SQUARE_AT) {
            const rr = r * 0.45;
            const x0 = cxp - r;
            const y0 = cyp - r;
            const s = r * 2;
            if (typeof ctx.roundRect === "function") {
              ctx.roundRect(x0, y0, s, s, rr);
            } else {
              ctx.rect(x0, y0, s, s);
            }
          } else {
            ctx.arc(cxp, cyp, r, 0, Math.PI * 2);
          }
          ctx.fill();
        }
      }
    };

    loadImage(handsFramesAsset.url)
      .then((img) => {
        if (!alive) return;
        atlas = img;
        draw();
      })
      .catch(() => undefined);

    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
    };
  }, [frame, cropX, cropW, pitch]);

  return (
    <div ref={hostRef} className={className} style={style} aria-hidden>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

export default HalftoneHandStill;
