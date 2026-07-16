import { useEffect, useRef } from "react";
import handGodAsset from "@/assets/hand-god.png.asset.json";
import handAdamAsset from "@/assets/hand-adam.png.asset.json";

const GLYPHS = "{}[]()/\\|<>?+-~;:,._YZXCVUJKLMNOP0123456789abcdefmnrst*^!";
const DENSE_GLYPHS = "#@%▓█&$";

type Cell = {
  x: number; // pixel position within canvas
  y: number;
  ch: string;
  b: number; // brightness 0..1 from source silhouette
};

const CELL_W = 8;
const CELL_H = 11;
const INFLUENCE_RADIUS = 140;

function randGlyph(set: string) {
  return set.charAt(Math.floor(Math.random() * set.length));
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
      // silhouette is white on black -> use red channel as brightness
      const b = data[idx] / 255;
      if (b > 0.35) {
        cells.push({
          x: targetRect.x + i * CELL_W,
          y: targetRect.y + j * CELL_H,
          ch: randGlyph(GLYPHS),
          b,
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
  const imagesRef = useRef<{ god?: HTMLImageElement; adam?: HTMLImageElement }>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let running = true;

    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resample = () => {
      const { god, adam } = imagesRef.current;
      if (!god || !adam) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Each hand takes ~48% of width; vertical band centered.
      const handW = Math.min(w * 0.48, 900);
      const handH = handW * (640 / 1024);
      const bandY = h * 0.5 - handH * 0.5;

      const godRect = { x: 0, y: bandY, w: handW, h: handH };
      const adamRect = { x: w - handW, y: bandY, w: handW, h: handH };

      cellsRef.current = [
        ...sampleImage(god, godRect, false),
        ...sampleImage(adam, adamRect, false),
      ];
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

    Promise.all([loadImage(handGodAsset.url), loadImage(handAdamAsset.url)]).then(
      ([god, adam]) => {
        imagesRef.current = { god, adam };
        resize();
      },
    );

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
      ctx.font = `${CELL_H - 1}px "JetBrains Mono", "Menlo", "Courier New", monospace`;
      ctx.textBaseline = "top";

      const cells = cellsRef.current;
      const m = mouseRef.current;
      const r2 = INFLUENCE_RADIUS * INFLUENCE_RADIUS;

      for (let k = 0; k < cells.length; k++) {
        const c = cells[k];

        // ambient shimmer: ~1/220 chance to reroll glyph per frame
        if (!prefersReduce && Math.random() < 0.0045) {
          c.ch = randGlyph(GLYPHS);
        }

        let dx = 0;
        let dy = 0;
        let ch = c.ch;
        // base color: warm coral, brightness tied to silhouette
        let r = 255;
        let g = 90;
        let bl = 74;
        let alpha = 0.35 + c.b * 0.55;

        if (m.active && !prefersReduce) {
          const ddx = c.x - m.x;
          const ddy = c.y - m.y;
          const dist2 = ddx * ddx + ddy * ddy;
          if (dist2 < r2) {
            const dist = Math.sqrt(dist2);
            const t = 1 - dist / INFLUENCE_RADIUS; // 0..1, 1 near cursor
            // radial push outward
            const push = t * 14;
            dx = (ddx / (dist || 1)) * push;
            dy = (ddy / (dist || 1)) * push;
            // brighten toward white
            r = 255;
            g = Math.floor(90 + (255 - 90) * t);
            bl = Math.floor(74 + (255 - 74) * t);
            alpha = Math.min(1, alpha + t * 0.6);
            // densify near center
            if (t > 0.55) ch = randGlyph(DENSE_GLYPHS);
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