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

// Pointer parallax (CSS px at full deflection) + tonal breathing amplitude.
const PARALLAX_X = 4;
const PARALLAX_Y = 2.5;
const BREATH_AMP = 0.035;
const BREATH_PERIOD = 5200;






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

type HoverMode = "magnetic" | "deepen" | "breathe";

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
  // Cursor position in CSS px within the canvas, for hover effects.
  const cursorRef = useRef({ tx: -9999, ty: -9999, x: -9999, y: -9999, active: false });
  // Active ripples for the breathe mode: each expands from a cursor position.
  const ripplesRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  // Scroll-driven playhead: target frame from scroll, eased current frame.
  const playheadRef = useRef({ target: 0, current: 0 });

  const [hoverMode, setHoverMode] = useState<HoverMode>("magnetic");
  const [showSwitcher, setShowSwitcher] = useState(true);

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

    const lockSpan = () => Math.max(420, window.innerHeight * 1.15);
    // Seconds to close ~63% of the remaining distance.
    const SMOOTH_TAU = 0.16;
    // Per-event clamp: one huge trackpad delta can't slam the sequence forward.
    const MAX_STEP = 0.06;

    /** Advance/rewind the playhead. Returns true when the wheel was consumed. */
    const consume = (rawDy: number, deltaMode = 0) => {
      if (prefersReduce) return false;
      const dy = rawDy * (deltaMode === 1 ? 16 : deltaMode === 2 ? 100 : 1);
      if (dy === 0) return false;
      const t = progressRef.target;
      const goingDown = dy > 0;
      const atTop = window.scrollY <= 0;
      const canForward = goingDown && t < 1;
      const canRewind = !goingDown && t > 0 && atTop;
      if (!canForward && !canRewind) return false;
      const raw = dy / lockSpan();
      const step = Math.max(-MAX_STEP, Math.min(MAX_STEP, raw));
      progressRef.target = Math.min(1, Math.max(0, t + step));
      // Blend into the glide velocity (progress units per second).
      progressRef.vel = progressRef.vel * 0.7 + step * 7;
      return true;
    };


    const onWheel = (e: WheelEvent) => {
      if (stageRef.current !== "hands") return;
      if (consume(e.deltaY, e.deltaMode)) e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (stageRef.current !== "hands" || touchY === null) return;
      const y = e.touches[0]?.clientY ?? touchY;
      const dy = touchY - y;
      touchY = y;
      if (consume(dy * 1.6)) e.preventDefault();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });





    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      cursorRef.current.tx = cx;
      cursorRef.current.ty = cy;
      cursorRef.current.active = true;

      // Breathe mode: spawn a ripple when the cursor has travelled far enough.
      const ripples = ripplesRef.current;
      const last = ripples[ripples.length - 1];
      if (
        hoverMode === "breathe" &&
        (!last || Math.hypot(cx - last.x, cy - last.y) > 36)
      ) {
        ripples.push({ x: cx, y: cy, t: performance.now() });
        if (ripples.length > 5) ripples.shift();
      }
    };
    const onLeave = () => {
      pointerRef.current.tx = 0;
      pointerRef.current.ty = 0;
      cursorRef.current.active = false;
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
        if (Math.abs(progressRef.vel) > 1e-4) {
          progressRef.target = Math.min(
            1,
            Math.max(0, progressRef.target + progressRef.vel * dt * 0.25),
          );
          progressRef.vel *= Math.exp(-dt / 0.12);
        } else {
          progressRef.vel = 0;
        }

        // Exponential ease toward the target with a fixed time constant.
        const k = 1 - Math.exp(-dt / SMOOTH_TAU);
        progressRef.v += (progressRef.target - progressRef.v) * k;
        if (Math.abs(progressRef.target - progressRef.v) < 0.0005) {
          progressRef.v = progressRef.target;
        }

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
      for (let k = 0; k < dots.length; k++) {
        const dot = dots[k];
        // Centre dots drift more than edge dots → a shallow depth read.
        const weight = 0.35 + dot.cx * 0.65;
        const x = dot.x + p.x * PARALLAX_X * weight;
        const y = dot.y + p.y * PARALLAX_Y * weight;

        const raw = Math.min(1, dot.d * breath);
        // Soft ceiling: large shadow regions no longer all clamp to 1.0, which
        // is what made them fuse into one flat slab.
        const d = raw < 0.8 ? raw : 0.8 + (raw - 0.8) * 0.7;
        // Area ∝ coverage — the physically correct halftone response.
        const r = maxR * Math.sqrt(d);
        if (r < 0.16) continue;

        // Value carries volume alongside area: light grey on the paper-facing
        // planes, near-charcoal (slightly cool) in the deepest shadows.
        const [ir, ig, ib] = inkAt(d);
        ctx.fillStyle = `rgb(${ir},${ig},${ib})`;

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
