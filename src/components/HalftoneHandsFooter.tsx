import { useEffect, useRef, useState } from "react";
import handsPairAsset from "@/assets/hands-pair.png.asset.json";
import { IntroVideo, type IntroProgressInfo } from "./IntroVideo";
import { useHeroLayout, type HeroLayout } from "@/hooks/useHeroLayout";
import { GlitchGrainOverlay } from "@/components/GlitchGrainOverlay";
import { AuroraIntro } from "@/components/AuroraIntro";

/**
 * Halftone dot-matrix hands.
 *
 * The hands are rendered as a regular grid of neutral-grey circles whose radius
 * and darkness track the source image's luminance: bright planes become small
 * pale dots, shadow ridges become large near-carbon dots. Toward the outer
 * frame edges the dots shrink and drop out probabilistically so the arms
 * dissolve into the paper instead of ending on a hard rectangle.
 *
 * No characters, no tiles, no fluid field — tone is carried purely by dot area.
 */

// ---------------------------------------------------------------- tuning
// Grid pitch in CSS px (per layout tier below). Radius peaks slightly under
// half the pitch so the darkest dots almost touch but never merge into blobs.
const DOT_FILL = 0.46;
// Luminance below this (i.e. lighter than) is left as bare paper.
const MIN_DENSITY = 0.055;
// Density → radius curve. <1 grows mid dots faster, keeping midtones readable.
const RADIUS_EXP = 0.78;
// Neutral ink ramp: lightest dot → darkest dot.
const LIGHT_GREY = 0xc9;
const DARK_GREY = 0x11;
// Edge dissolve: fraction of the band width/height used for the falloff.
const FADE_X = 0.3;
const FADE_Y = 0.26;
// Pointer parallax (CSS px at full deflection) + tonal breathing amplitude.
const PARALLAX_X = 7;
const PARALLAX_Y = 4;
const BREATH_AMP = 0.05;
const BREATH_PERIOD = 5200;

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

/** Downsample the source image onto the dot grid. */
function sampleDots(
  img: HTMLImageElement,
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
  // A touch of blur before the downsample keeps the coarse grid from aliasing
  // the finger edges into stair-steps.
  (octx as unknown as { filter: string }).filter = "blur(0.5px)";
  octx.drawImage(img, 0, 0, cols, rows);
  (octx as unknown as { filter: string }).filter = "none";
  const data = octx.getImageData(0, 0, cols, rows).data;

  const dots: Dot[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = (j * cols + i) * 4;
      const a = data[p + 3] / 255;
      if (a < 0.12) continue;
      // Rec.709 luma, premultiplied so soft PNG edges don't read as shadow.
      const luma =
        (a * (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2])) / 255;

      // The source is a lit subject on black, so luma itself *is* the form:
      // bright = lit plane, dark = falling into shadow / background.
      let density = Math.min(1, Math.max(0, luma * 1.12));

      // Edge dissolve — horizontal (outer frame) and vertical (wrists).
      const u = (i + 0.5) / cols;
      const v = (j + 0.5) / rows;
      const fx = Math.min(smoothstep(u / FADE_X), smoothstep((1 - u) / FADE_X));
      const fy = Math.min(smoothstep(v / FADE_Y), smoothstep((1 - v) / FADE_Y));
      const fade = Math.min(1, fx * 0.75 + 0.25) * Math.min(1, fy * 0.8 + 0.2);
      density *= fade;

      // Stable stochastic drop-out: near the edges the surviving dots scatter.
      const r = hash2(i, j);
      if (r > 0.12 + fade * 0.92) continue;
      if (density < MIN_DENSITY) continue;

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

  const dotsRef = useRef<Dot[]>([]);
  const pitchRef = useRef(layout.cellSize);
  const imageRef = useRef<HTMLImageElement | null>(null);
  // Pointer offset in -1..1, smoothed toward the raw target each frame.
  const pointerRef = useRef({ tx: 0, ty: 0, x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pitch = Math.max(5, Math.round(layout.cellSize * 0.62));
    pitchRef.current = pitch;

    const resample = () => {
      const img = imageRef.current;
      if (!img) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;
      const imgAR = img.naturalWidth / img.naturalHeight;
      const visualRect = getHandsVisualRect(layout, w, h);
      const bandW = visualRect.w;
      const bandH = bandW / imgAR;
      const bandY = visualRect.y + visualRect.h * 0.5 - bandH * 0.5;
      dotsRef.current = sampleDots(
        img,
        { x: visualRect.x, y: bandY, w: bandW, h: bandH },
        pitch,
      );
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    let resizeTimer = 0;
    const scheduleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 80);
    };
    const ro = new ResizeObserver(scheduleResize);
    ro.observe(canvas);

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

    const maxR = pitch * DOT_FILL;

    const draw = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

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

      const dots = dotsRef.current;
      for (let k = 0; k < dots.length; k++) {
        const dot = dots[k];
        // Centre dots drift more than edge dots → a shallow depth read.
        const weight = 0.35 + dot.cx * 0.65;
        const x = dot.x + p.x * PARALLAX_X * weight;
        const y = dot.y + p.y * PARALLAX_Y * weight;

        const d = Math.min(1, dot.d * breath);
        const r = maxR * Math.pow(d, RADIUS_EXP);
        if (r < 0.18) continue;
        const grey = Math.round(LIGHT_GREY + (DARK_GREY - LIGHT_GREY) * d);
        ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
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
