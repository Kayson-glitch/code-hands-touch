import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Linkedin, Twitter, Youtube } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { FOOTER_COLUMNS } from "@/lib/siteMenu";
import { DotArrow } from "@/components/DotArrow";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { SonarGrid } from "@/components/ui/sonar-grid";

import { logoAsset as logo } from "@/lib/media";
import { dashboardAsset } from "@/lib/media";

/**
 * Footer rises to cover the dashboard image so that it enters the viewport
 * exactly when the image is ~half revealed. The footer overlaps the lower
 * half of the image (negative margin = half the image's rendered height) and
 * sits on a higher stacking layer, so scrolling pushes it up over the image.
 */


import { fluid } from "@/lib/fluid";
import { GRADIENT, GRADIENT_STOPS, RainbowButton } from "@/components/RainbowButton";

/** Watermark ink on the fine screen. */
const WORDMARK_ALPHA = 0.11;
const WORDMARK_DOT_FILL = 0.8;
/** Fraction of the glyph box kept below the divider by default, so the crop
 *  scales with the type: the word reads, descenders cut by the line. */
const WORDMARK_REST_CLIP = 0.37;

/** Fraction of the dashboard image's lower half left visible above the footer. */
const IMAGE_REVEAL = 0.75;
/** Extra pixels of the image hidden under the footer on top of the fractional reveal. */
const IMAGE_TUCK = 20;
/** ContainerScroll's md:p-10 frame around the image. */
const FRAME_PAD = 40;
/** Card tilt at the start of the approach; flattens fully by the rest position. */
const CARD_TILT_FROM = 24;

/** Dimmed until hover, as in the nav's centre menu. */
const FOOTER_LINK =
  "cursor-pointer text-[rgba(255,255,255,0.72)] transition-colors duration-200 hover:text-white";


/**
 * Footer wordmark: real Montserrat fitted to the container, filled with a
 * fine round-dot screen. The wrapper is offset so the divider crops it; the
 * footer decides how deep, and reports the descender depth back so the
 * reveal can stop with the baseline on the line.
 */
function DotWordmark({
  text,
  onMetrics,
}: {
  text: string;
  /**
   * `height` is the glyph box, `descentRatio` the descender depth within it
   * (baseline → box bottom). The footer needs both: one to keep the copy clear
   * of the mark, the other to stop the reveal on the baseline.
   */
  onMetrics?: (m: { height: number; descentRatio: number }) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(200);
  const [glyphH, setGlyphH] = useState(184);
  const onMetricsRef = useRef(onMetrics);
  onMetricsRef.current = onMetrics;

  const fit = () => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;
    const probe = 200;
    el.style.fontSize = `${probe}px`;
    const w = el.scrollWidth;
    const next = w > 0 ? (probe * box.clientWidth) / w : probe;
    el.style.fontSize = `${next}px`;
    setSize(next);

    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return;
    ctx.font = `600 ${next}px Montserrat, ui-sans-serif, system-ui, sans-serif`;
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${-0.02 * next}px`;
    const m = ctx.measureText(text);
    const ascent = Math.ceil(m.actualBoundingBoxAscent || next * 0.74);
    const descent = Math.ceil(m.actualBoundingBoxDescent || next * 0.2);
    const h = Math.max(1, ascent + descent);
    setGlyphH(h);
    onMetricsRef.current?.({ height: h, descentRatio: descent / h });
  };

  useLayoutEffect(fit);
  useEffect(() => {
    window.addEventListener("resize", fit);
    if (document.fonts?.ready) document.fonts.ready.then(fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas || size < 8) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (w < 10 || h < 4) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const src = document.createElement("canvas");
      src.width = Math.max(1, Math.round(w * dpr));
      src.height = Math.max(1, Math.round(h * dpr));
      const sctx = src.getContext("2d", { willReadFrequently: true });
      if (!sctx) return;
      sctx.scale(dpr, dpr);
      sctx.font = `600 ${size}px Montserrat, ui-sans-serif, system-ui, sans-serif`;
      (sctx as unknown as { letterSpacing: string }).letterSpacing = `${-0.02 * size}px`;
      sctx.fillStyle = "#fff";
      sctx.textBaseline = "alphabetic";
      const m = sctx.measureText(text);
      const ascent = m.actualBoundingBoxAscent || size * 0.74;
      sctx.fillText(text, 0, ascent);

      const pitch = Math.max(2.25, size / 80);
      const cols = Math.ceil(w / pitch);
      const rows = Math.ceil(h / pitch);
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.imageSmoothingEnabled = true;
      octx.drawImage(src, 0, 0, cols, rows);
      const data = octx.getImageData(0, 0, cols, rows).data;

      const maxR = pitch * 0.5 * WORDMARK_DOT_FILL;
      ctx.fillStyle = `rgba(255,255,255,${WORDMARK_ALPHA})`;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const a = data[(j * cols + i) * 4 + 3] / 255;
          if (a < 0.05) continue;
          const r = maxR * Math.sqrt(a);
          if (r < 0.18) continue;
          ctx.beginPath();
          ctx.arc((i + 0.5) * pitch, (j + 0.5) * pitch, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    draw();
    if (document.fonts?.ready) document.fonts.ready.then(draw);
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    return () => ro.disconnect();
  }, [text, size, glyphH]);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="pointer-events-none relative w-full select-none"
      style={{ height: glyphH, lineHeight: 0 }}
    >
      <span
        ref={textRef}
        className="font-sans absolute left-0 top-0 whitespace-nowrap"
        style={{
          fontSize: size,
          lineHeight: 1,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          visibility: "hidden",
        }}
      >
        {text}
      </span>
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}

/** Closing CTA block + brand footer, shared across pages. `cta={false}` renders the brand footer alone. */
export function SiteFooter({ cta = true }: { cta?: boolean } = {}) {
  const pad = `0 ${fluid(120, 24)}`;
  const imgRef = useRef<HTMLImageElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  // Descender depth of the wordmark, reported by DotWordmark; the reveal stops
  // there so the baseline — the bottom of the A — lands on the divider.
  const descentRatioRef = useRef(0.2);
  const remeasureRef = useRef<(() => void) | null>(null);
  // How much of the wordmark shows at rest, so the columns can sit clear of it.
  const [markRestH, setMarkRestH] = useState(0);
  const [halfH, setHalfH] = useState(0);
  // How far the footer climbs over the image (negative margin). Nothing to
  // climb over without the CTA screen.
  const footerOverlap = cta ? halfH * (1 - IMAGE_REVEAL) + 96 + IMAGE_TUCK : 0;
  // The ContainerScroll frame's travel is its own height; at rest its bottom
  // still sits (overlap + frame padding) below the viewport, so the flip must
  // finish at this fraction of the travel to be complete when the page stops.
  const frameH = halfH * 2 + FRAME_PAD * 2;
  const settleAt = frameH > 0 ? Math.max(0.2, 1 - (footerOverlap + FRAME_PAD) / frameH) : 1;

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const measure = () => setHalfH(el.offsetHeight / 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The page parks at its end with the wordmark in its default crop. From
  // there any further downward scroll immediately triggers the reveal: the
  // whole word rises clear of the divider. Scrolling up puts it back. The
  // page is never blocked — at the end there is nothing left to scroll.
  useEffect(() => {
    const mark = markRef.current;
    if (!mark) return;
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const restTuck = { px: 24 };
    const revealTuck = { px: 0 };
    /** Spring on 0 = default crop … 1 = fully revealed. Just past critical
     *  damping: it leaves quickly, eases to a stop in about half a second and
     *  never bounces back over the line. */
    const reveal = { target: 0, v: 0, vel: 0 };
    const STIFFNESS = 200;
    const DAMPING = 29;
    let raf = 0;
    let last = performance.now();

    const measure = () => {
      const h = mark.offsetHeight;
      restTuck.px = Math.round(Math.max(4, h * WORDMARK_REST_CLIP));
      revealTuck.px = prefersReduce
        ? restTuck.px
        : Math.min(restTuck.px, Math.round(h * descentRatioRef.current));
    };
    measure();
    remeasureRef.current = measure;
    const ro = new ResizeObserver(measure);
    ro.observe(mark);

    const tick = (now: number) => {
      // Fixed sub-steps keep the spring stable when a frame is dropped.
      let rest = Math.min(0.1, (now - last) / 1000);
      last = now;
      while (rest > 0) {
        const dt = Math.min(1 / 120, rest);
        rest -= dt;
        reveal.vel +=
          (-STIFFNESS * (reveal.v - reveal.target) - DAMPING * reveal.vel) * dt;
        reveal.v += reveal.vel * dt;
        if (reveal.v > 1) {
          reveal.v = 1;
          if (reveal.vel > 0) reveal.vel = 0;
        } else if (reveal.v < 0) {
          reveal.v = 0;
          if (reveal.vel < 0) reveal.vel = 0;
        }
      }
      if (Math.abs(reveal.target - reveal.v) < 0.0008 && Math.abs(reveal.vel) < 0.01) {
        reveal.v = reveal.target;
        reveal.vel = 0;
      }
      mark.style.transform =
        `translate3d(0, ${restTuck.px + (revealTuck.px - restTuck.px) * reveal.v}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    mark.style.transform = `translate3d(0, ${restTuck.px}px, 0)`;
    raf = requestAnimationFrame(tick);

    if (prefersReduce) {
      return () => {
        cancelAnimationFrame(raf);
        remeasureRef.current = null;
        ro.disconnect();
      };
    }

    // Lenis drives the window, so the document position is true for both the
    // smoothed wheel and native touch.
    const atBottom = () =>
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

    // The gesture only picks the end state; the spring owns the travel, so
    // the reveal always carries the same weight however hard it was thrown.
    const push = (dy: number) => {
      if (dy > 0) {
        if (atBottom()) reveal.target = 1;
      } else {
        reveal.target = 0;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) push(e.deltaY);
    };
    window.addEventListener("wheel", onWheel, { passive: true });

    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      const y = e.touches[0]?.clientY ?? touchY;
      const dy = touchY - y;
      if (Math.abs(dy) < 1) return;
      touchY = y;
      push(dy);
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    // Scrollbar drags and anchor jumps bypass wheel/touch entirely.
    const onScroll = () => {
      if (reveal.target === 1 && !atBottom()) reveal.target = 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      remeasureRef.current = null;
      ro.disconnect();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="relative" style={{ zIndex: 20, background: "#FAFAFA" }}>
      {/* ------------------------------------------------------------- CTA */}
      {cta ? (
      <section className="relative overflow-hidden" style={{ padding: `${fluid(240, 120)} 0 0` }}>
        {/* Dot field (1px dots, 16% ink, 20px pitch) drawn on a canvas so ambient
            sonar rings can ripple through it. Toward the footer the same grid
            swells into a grey halftone "shoreline" that echoes the hero hands.
            The layer ends at the footer's top edge so the swell peaks where
            it is actually visible. */}
        <SonarGrid
          aria-hidden
          spacing={20}
          dotRadius={1}
          baseOpacity={0.16}
          peakOpacity={0.7}
          color="#0E0B22"
          waveGradient={GRADIENT_STOPS}
          waveGradientMode="angular"
          pingEvery={5.5}
          speed={200}
          ringWidth={120}
          amplitude={0.6}
          interactive={false}
          seedPing
          pingArea={[0.2, 0.15, 0.8, 0.85]}
          shore={{
            start: 0.55,
            maxRadius: 3,
            ink: ["#E6E6E6", "#C8C8C8"],
            strength: 0.6,
            noiseScale: 220,
            noiseMix: 0.35,
            drift: 0,
            jitter: 0,
            breathe: [1, 1],
          }}
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            bottom: footerOverlap,
            maskImage: "linear-gradient(to bottom, transparent 0, #000 22%, #000 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 22%, #000 100%)",
          }}
        />

        <div className="relative mx-auto flex w-full max-w-[800px] flex-col items-center px-6 text-center">
          <Reveal variant="hero">
            <h2
              className="font-display"
              style={{ margin: 0, fontSize: fluid(48, 30), lineHeight: 1.1667, fontWeight: 400 }}
            >
              <span className="text-ink-ghost">Get started with the</span>
              <br />
              <span className="text-ink">Synergy.AI today</span>
            </h2>
          </Reveal>
          <Reveal variant="hero" delay={150} style={{ marginTop: fluid(40, 28) }}>
            <RainbowButton label="Book a Demo" />
          </Reveal>
        </div>

        {/* The footer overlaps the lower portion of the dashboard image via a
            negative margin. Because both move with the scroll, the footer
            enters the viewport around the moment the image is half revealed,
            and at rest the image's top half (incl. its browser chrome) sits
            above the footer while the footer fills the bottom of the viewport.
            An extra offset lifts the image so its top rests just below the
            fixed site nav, keeping the dashboard chrome visible. */}
        <div className="relative" style={{ marginTop: fluid(72, 40), zIndex: 1 }}>
          <ContainerScroll
            rotateFrom={CARD_TILT_FROM}
            settleAt={settleAt}
            perspective={800}
            spring={{ stiffness: 120, damping: 28 }}
          >
            <img
              ref={imgRef}
              src={dashboardAsset.url}
              alt="Ask Synergy — AI performance dashboard"
              className="block h-auto w-full"
              draggable={false}
            />
          </ContainerScroll>
        </div>
      </section>
      ) : null}

      {/* ---------------------------------------------------------- footer */}
      <footer
        data-dark-section
        data-progressive-blur-hide
        className="relative overflow-hidden"
        style={{ background: "#000000", marginTop: -footerOverlap, zIndex: 30 }}
      >
        <div aria-hidden style={{ height: 2, backgroundImage: GRADIENT, backgroundSize: "200%" }} />

        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", height: 80, boxSizing: "border-box" }}>
          <div className="h-full" style={{ padding: pad }}>
            <div className="mx-auto grid h-full w-full max-w-[1200px] grid-cols-2 items-center gap-9 md:grid-cols-4">
              <div className="flex items-center justify-start gap-2">
                <img
                  src={logo.url}
                  alt="Synergy.AI"
                  style={{
                    width: 28,
                    height: 28,
                    display: "block",
                    borderRadius: 999,
                    objectFit: "cover",
                  }}
                />
                <span style={{ color: "#FFFFFF", fontSize: 18, lineHeight: "24px", fontWeight: 500 }}>
                  Synergy.AI
                </span>
              </div>
              <div className="hidden md:block md:col-span-3 md:text-right">
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: "20px" }}>
                  Revenue-Driven AI Support. Engineered on Synergy. Scale Securely.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 400px tall with the columns centred, but free to grow when the
            sitemap is taller than that — two columns on a phone, for one. */}
        <div className="relative overflow-hidden" style={{ minHeight: 400 }}>
          <div
            ref={markRef}
            className="pointer-events-none absolute bottom-0 left-0 z-0 w-full will-change-transform"
          >
            <DotWordmark
              text="Synergy.AI"
              onMetrics={({ height, descentRatio }) => {
                descentRatioRef.current = descentRatio;
                remeasureRef.current?.();
                setMarkRestH(Math.round(height * (1 - WORDMARK_REST_CLIP)));
              }}
            />
          </div>
          {/* The columns clear the wordmark's resting height, so at rest the
              copy never sits on the letters — only the reveal brings them
              together. */}
          <div
            className="relative z-10 flex items-center"
            style={{
              minHeight: 400,
              padding: `${fluid(56, 44)} ${fluid(120, 24)}`,
              paddingBottom: `calc(${fluid(56, 44)} + ${markRestH}px)`,
            }}
          >
            <div className="mx-auto w-full max-w-[1200px]">
              <div className="grid grid-cols-2 gap-9 md:grid-cols-4">
                {FOOTER_COLUMNS.map((col, i) => (
                  <Reveal
                    key={col.title}
                    delay={i * 90}
                    y={18}
                    className="flex flex-col items-start text-left"
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 12,
                        lineHeight: "20px",
                        fontWeight: 400,
                      }}
                    >
                      {col.title}
                    </p>
                    <ul className="mt-6 flex flex-col items-start gap-[18px]">
                      {col.items.map((item) => (
                        <li key={item.title} style={{ fontSize: 14, lineHeight: "22px" }}>
                          {item.to ? (
                            <Link to={item.to} preload="intent" className={FOOTER_LINK}>
                              {item.short ?? item.title}
                            </Link>
                          ) : (
                            <span className={FOOTER_LINK}>{item.short ?? item.title}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)", boxSizing: "border-box" }}
          className="md:h-[68px]"
        >
          <div className="h-full" style={{ padding: pad }}>
            <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 items-center gap-9 py-7 md:h-full md:grid-cols-4 md:py-0">
              <span
                className="flex justify-start"
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 12,
                  lineHeight: "20px",
                  fontWeight: 500,
                }}
              >
                © {new Date().getFullYear()} Synergy.AI. All rights reserved.
              </span>
              <div className="hidden md:col-span-3 md:flex md:items-center md:justify-end md:gap-4">
                {[Youtube, Twitter, Linkedin].map((Icon, i) => (
                  <span
                    key={i}
                    className="cursor-pointer transition-opacity hover:opacity-70"
                    style={{ color: "#FFFFFF", display: "inline-flex" }}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SiteFooter;
