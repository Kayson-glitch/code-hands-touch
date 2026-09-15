import { useEffect, useLayoutEffect, useRef, useState } from "react";
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


/** 1440px design width → fluid value. */
const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

const GRADIENT_STOPS = ["#137DFF", "#FF18AA", "#FFCD17", "#137DFF"];
const GRADIENT = `linear-gradient(90deg, ${GRADIENT_STOPS[0]} 0%, ${GRADIENT_STOPS[1]} 33.333%, ${GRADIENT_STOPS[2]} 66.666%, ${GRADIENT_STOPS[3]} 100%)`;

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

function RainbowButton({ label, size = "lg" }: { label: string; size?: "lg" | "sm" }) {
  const face = "#0E0B22";
  const faceRgb = "14,11,34";
  const lg = size === "lg";
  return (
    <button
      className="group relative inline-flex shrink-0 cursor-pointer items-center justify-center font-normal transition-all"
      style={{
        height: 36,
        fontSize: lg ? 14 : 13,
        lineHeight: "20px",
        fontWeight: 500,
        padding: lg ? "0 24px" : "0 22px",
        borderRadius: 0,
        borderBottom: "1.5px solid transparent",
        color: "#FFFFFF",
        backgroundImage: [
          `linear-gradient(${face},${face})`,
          `linear-gradient(${face} 50%, rgba(${faceRgb},0.6) 80%, rgba(${faceRgb},0))`,
          GRADIENT,
        ].join(","),
        backgroundClip: "padding-box, border-box, border-box",
        backgroundColor: face,
        backgroundOrigin: "border-box",
        backgroundSize: "200%",
        animation: "rainbow-btn-flow var(--rainbow-speed, 9s) infinite linear",
      }}
    >
      <span className="relative z-10 inline-flex items-center gap-0">
        {label}
        <span className="inline-flex items-center ml-1.5">
          <DotArrow size={16} className="flex-shrink-0" />
        </span>
      </span>
    </button>
  );
}

/** Wordmark that fills its container width by uniform font scaling (no glyph stretching). */
function FitWordmark({ text }: { text: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(200);

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
  };

  useLayoutEffect(fit);
  useEffect(() => {
    window.addEventListener("resize", fit);
    if (document.fonts?.ready) document.fonts.ready.then(fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="pointer-events-none w-full select-none overflow-hidden"
      style={{ lineHeight: 0 }}
    >
      <span
        ref={textRef}
        className="font-sans block whitespace-nowrap"
        style={{
          fontSize: size,
          lineHeight: 0.8,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "rgba(255,255,255,0.08)",
          display: "inline-block",
          transform: "translateY(12%)",
        }}
      >
        {text}
      </span>
    </div>
  );
}

/** Closing CTA block + brand footer, shared across pages. */
export function SiteFooter() {
  const pad = `0 ${fluid(120, 24)}`;
  const imgRef = useRef<HTMLImageElement>(null);
  const [halfH, setHalfH] = useState(0);
  // How far the footer climbs over the image (negative margin).
  const footerOverlap = halfH * (1 - IMAGE_REVEAL) + 96 + IMAGE_TUCK;
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
              style={{ margin: 0, fontSize: fluid(48, 28), lineHeight: 1.1667, fontWeight: 500 }}
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

      {/* ---------------------------------------------------------- footer */}
      <footer
        data-dark-section
        data-progressive-blur-hide
        className="relative overflow-hidden"
        style={{ background: "#0A0A0A", marginTop: -footerOverlap, zIndex: 30 }}
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

          <div className="absolute left-0 w-full" style={{ top: 198 }}>
            <FitWordmark text="Synergy.AI" />
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
