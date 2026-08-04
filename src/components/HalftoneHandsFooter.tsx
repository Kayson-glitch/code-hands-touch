import { useEffect, useRef, useState } from "react";
import handsFramesAsset from "@/assets/hands-frames.webp.asset.json";
import { IntroVideo, type IntroProgressInfo } from "./IntroVideo";
import { useHeroLayout, type HeroLayout } from "@/hooks/useHeroLayout";
import { GlitchGrainOverlay } from "@/components/GlitchGrainOverlay";
import { AuroraIntro } from "@/components/AuroraIntro";

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
// Radius is a fraction of the half-pitch; 0.98 lets the darkest dots almost
// touch, matching a real halftone screen at high coverage.
const DOT_FILL = 0.98;
// Coverage below this is left as bare paper.
const MIN_DENSITY = 0.05;
// Above this coverage the dot squares off (superellipse), as on a print screen.
const SQUARE_AT = 0.75;
// Single mid-grey ink. Tone comes from dot AREA, not from colour.
const INK_LIGHT = 0xa8;
const INK_DARK = 0x8c;
// Pointer parallax (CSS px at full deflection) + tonal breathing amplitude.
const PARALLAX_X = 4;
const PARALLAX_Y = 2.5;
const BREATH_AMP = 0.035;
const BREATH_PERIOD = 5200;
// How fast the rendered frame chases the scroll-derived target frame.
const FRAME_EASE = 0.16;

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
};

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
  const [stage, setStage] = useState<"orb" | "hands">("orb");
  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const imageRef = useRef<HTMLImageElement | null>(null);
  // Pointer offset in -1..1, smoothed toward the raw target each frame.
  const pointerRef = useRef({ tx: 0, ty: 0, x: 0, y: 0 });
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

    // ----------------------------------------------------- one-shot playback
    // The hands rest on frame 1 until the reader's first wheel or click, then
    // play straight through once and stay on the last frame forever. Scrolling
    // is never swallowed — the page keeps moving as usual.
    const playback = { startedAt: null as number | null };

    playheadRef.current.target = 0;
    playheadRef.current.current = 0;

    if (prefersReduce) {
      playheadRef.current.target = FRAME_COUNT - 1;
      playheadRef.current.current = FRAME_COUNT - 1;
    }

    const start = () => {
      if (prefersReduce || playback.startedAt !== null) return;
      if (stageRef.current !== "hands") return;
      playback.startedAt = performance.now();
      window.removeEventListener("wheel", onTrigger);
      window.removeEventListener("pointerdown", onTrigger);
    };
    const onTrigger = () => start();
    window.addEventListener("wheel", onTrigger, { passive: true });
    window.addEventListener("pointerdown", onTrigger, { passive: true });




    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };
    const onLeave = () => {
      pointerRef.current.tx = 0;
      pointerRef.current.ty = 0;
    };
    if (!prefersReduce) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseleave", onLeave);
    }

    // Half-pitch is the theoretical maximum where neighbouring dots touch.
    const maxR = pitch * 0.5 * DOT_FILL;

    const draw = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const ph = playheadRef.current;
      if (prefersReduce) {
        ph.current = ph.target;
      } else {
        ph.current += (ph.target - ph.current) * FRAME_EASE;
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
      for (let k = 0; k < dots.length; k++) {
        const dot = dots[k];
        // Centre dots drift more than edge dots → a shallow depth read.
        const weight = 0.35 + dot.cx * 0.65;
        const x = dot.x + p.x * PARALLAX_X * weight;
        const y = dot.y + p.y * PARALLAX_Y * weight;

        const d = Math.min(1, dot.d * breath);
        // Area ∝ coverage — the physically correct halftone response.
        const r = maxR * Math.sqrt(d);
        if (r < 0.16) continue;

        // Ink stays one mid-grey; only a hair of extra weight in the darkest
        // dots, exactly as measured on the reference print.
        const grey = Math.round(INK_LIGHT + (INK_DARK - INK_LIGHT) * d);
        ctx.fillStyle = `rgb(${grey},${grey},${grey})`;

        if (d <= SQUARE_AT) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // High coverage: the dot squares off with a shrinking corner radius.
          const sq = (d - SQUARE_AT) / (1 - SQUARE_AT);
          const s = r * (1 + 0.14 * sq);
          const corner = r * (1 - 0.62 * sq);
          ctx.beginPath();
          ctx.roundRect(x - s, y - s, s * 2, s * 2, corner);
          ctx.fill();
        }
      }

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

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [layout]);

  const handsVisible = stage === "hands";
  const [orbMounted, setOrbMounted] = useState(true);
  const [burstProgress, setBurstProgress] = useState(0);
  const [bgDark, setBgDark] = useState(false);
  const navHiddenRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("app-bg-change", { detail: bgDark ? "dark" : "light" }),
    );
  }, [bgDark]);

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

      {bgDark && <AuroraIntro />}

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

      {orbMounted && (
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
