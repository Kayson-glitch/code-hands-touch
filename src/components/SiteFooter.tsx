import { useEffect, useRef, useState } from "react";
import { Linkedin, Twitter, Youtube } from "lucide-react";
import { Reveal } from "@/components/Reveal";
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
import { useHeroLayout } from "@/hooks/useHeroLayout";
import { BAYER, DOT_FILL, MIN_DENSITY, SQUARE_AT, hash2, smoothstep } from "@/components/HalftoneHandsFooter";

/** Peak white of the footer wordmark dots. */
const WORDMARK_ALPHA = 0.11;

/** Fraction of the dashboard image's lower half left visible above the footer. */
const IMAGE_REVEAL = 0.75;
/** Extra pixels of the image hidden under the footer on top of the fractional reveal. */
const IMAGE_TUCK = 20;
/** ContainerScroll's md:p-10 frame around the image. */
const FRAME_PAD = 40;
/** Card tilt at the start of the approach; flattens fully by the rest position. */
const CARD_TILT_FROM = 24;

const FOOTER_COLUMNS = [
  { title: "why  synergy", links: ["Features", "Pricing", "Book a demo"] },
  { title: "platform", links: ["Features", "Pricing", "Book a demo"] },
  { title: "solution", links: ["Events", "Blog"] },
  { title: "Company", links: ["About us", "Contact us"] },
];


/**
 * Wordmark as a dot matrix, drawn with the hero hands' halftone rules: the
 * same dot pitch (from the hero layout), dot AREA carries coverage with the
 * same soft ceiling, ordered dither on the threshold, faint cells fray into
 * isolated dots, and the deepest cells square off. Only the ink is inverted
 * for the black footer — white, with the same low-to-high value ramp.
 */
function DotWordmark({ text }: { text: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = useHeroLayout();
  const pitch = Math.max(5, Math.round(layout.cellSize * 0.62));

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = box.clientWidth;
      if (w < 10) return;
      const off = document.createElement("canvas");
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      const font = (px: number) => `600 ${px}px Montserrat, ui-sans-serif, system-ui, sans-serif`;

      // Fit: the size at which the word spans the container, as FitWordmark did.
      const probe = 200;
      octx.font = font(probe);
      (octx as unknown as { letterSpacing: string }).letterSpacing = `${-0.02 * probe}px`;
      const tw = octx.measureText(text).width || probe;
      const size = (probe * w) / tw;
      const h = Math.round(size * 0.8);

      const cols = Math.ceil(w / pitch);
      const rows = Math.ceil(h / pitch);
      off.width = cols;
      off.height = rows;
      octx.setTransform(1 / pitch, 0, 0, 1 / pitch, 0, 0);
      // Slight blur before the downsample, as the hands do, so glyph edges don't stair-step.
      (octx as unknown as { filter: string }).filter = `blur(${pitch * 0.5}px)`;
      octx.font = font(size);
      (octx as unknown as { letterSpacing: string }).letterSpacing = `${-0.02 * size}px`;
      octx.fillStyle = "#fff";
      octx.textBaseline = "alphabetic";
      // line-height 0.8 put the baseline ~0.75em down the box; translateY(22%) added 0.176em.
      octx.fillText(text, 0, size * 0.93);
      (octx as unknown as { filter: string }).filter = "none";
      const data = octx.getImageData(0, 0, cols, rows).data;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const maxR = pitch * 0.5 * DOT_FILL;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const coverage = data[(j * cols + i) * 4 + 3] / 255;
          // Same tone curve, dither and dissolve as sampleField / paintField.
          const t = Math.min(1, Math.max(0, (coverage - 0.02) / 0.88));
          let density = Math.pow(t, 0.8);
          density = Math.min(1, Math.max(0, density + (BAYER[(j & 3) * 4 + (i & 3)] - 0.5) * 0.07));
          if (density < MIN_DENSITY) continue;
          const keep = smoothstep((density - MIN_DENSITY) / 0.22);
          if (hash2(i, j) > 0.16 + keep * 0.84) continue;
          const d = density < 0.8 ? density : 0.8 + (density - 0.8) * 0.7;
          const r = maxR * Math.sqrt(d);
          if (r < 0.16) continue;

          const x = (i + 0.5) * pitch;
          const y = (j + 0.5) * pitch;
          // Inverted ink ramp for the black footer: faint cells lighter, deep cells fuller.
          ctx.fillStyle = `rgba(255,255,255,${(WORDMARK_ALPHA * (0.55 + 0.45 * d)).toFixed(4)})`;
          ctx.beginPath();
          if (d <= SQUARE_AT) {
            ctx.arc(x, y, r, 0, Math.PI * 2);
          } else {
            const sq = (d - SQUARE_AT) / (1 - SQUARE_AT);
            const side = r * (1 - 0.04 * sq);
            ctx.roundRect(x - side, y - side, side * 2, side * 2, r * (1 - 0.6 * sq));
          }
          ctx.fill();
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    if (document.fonts?.ready) document.fonts.ready.then(draw);
    return () => ro.disconnect();
  }, [text, pitch]);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="pointer-events-none w-full select-none overflow-hidden"
      style={{ lineHeight: 0 }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

/** Closing CTA block + brand footer, shared across pages. `cta={false}` renders the brand footer alone. */
export function SiteFooter({ cta = true }: { cta?: boolean } = {}) {
  const pad = `0 ${fluid(120, 24)}`;
  const imgRef = useRef<HTMLImageElement>(null);
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

        <div className="relative overflow-hidden" style={{ height: 400 }}>
          <div className="flex h-full items-center" style={{ padding: pad }}>
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
                      className="capitalize"
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 12,
                        lineHeight: "20px",
                        fontWeight: 400,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {col.title}
                    </p>
                    <ul className="mt-6 flex flex-col items-start gap-[18px]">
                      {col.links.map((l) => (
                        <li key={l}>
                          <span
                            className="cursor-pointer transition-opacity hover:opacity-70"
                            style={{ color: "#FFFFFF", fontSize: 14, lineHeight: "22px" }}
                          >
                            {l}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full">
            <DotWordmark text="Synergy.AI" />
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
