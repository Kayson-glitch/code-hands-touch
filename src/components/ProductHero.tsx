import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { DotArrow } from "@/components/DotArrow";
import { SonarGrid } from "@/components/ui/sonar-grid";

/**
 * First screen shared by the Platform and Solution product pages: the CTA
 * screen's dot field with ambient gradient rings, a square eyebrow, a 72px
 * three-line display title with the intro hanging off its last line, and the
 * rainbow Book a Demo. Fades the dots in under the nav and out into the next
 * section.
 */

const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

export const GRADIENT_STOPS = ["#137DFF", "#FF18AA", "#FFCD17", "#137DFF"];
export const GRADIENT = `linear-gradient(90deg, ${GRADIENT_STOPS[0]} 0%, ${GRADIENT_STOPS[1]} 33.333%, ${GRADIENT_STOPS[2]} 66.666%, ${GRADIENT_STOPS[3]} 100%)`;

export function RainbowButton({ label }: { label: string }) {
  const face = "#0E0B22";
  const faceRgb = "14,11,34";
  return (
    <button
      className="group relative inline-flex shrink-0 cursor-pointer items-center justify-center font-normal transition-all"
      style={{
        height: 36,
        fontSize: 14,
        lineHeight: "20px",
        fontWeight: 400,
        padding: "0 20px",
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

/** Text with "\n" breaks honoured from md up — for module titles that don't take the hero's hover. */
export function BreakLines({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 ? (
            <>
              {" "}
              <br className="hidden md:inline" />
            </>
          ) : null}
          {line}
        </span>
      ))}
    </>
  );
}

/** The first-screen dot field on its own, for heroes with a different layout. */
export function HeroDots() {
  return (
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
      className="pointer-events-none absolute inset-0"
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0, #000 18%, #000 62%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0, #000 18%, #000 62%, transparent 100%)",
      }}
    />
  );
}

export function ProductHero({
  eyebrow,
  accent,
  title,
  intro,
  cta = "Book a Demo",
  children,
}: {
  eyebrow: string;
  /** Eyebrow square colour — the page's accent. */
  accent: string;
  /** Use "\n" for the hand-set desktop line breaks. */
  title: string;
  intro: string;
  cta?: string;
  children?: ReactNode;
}) {
  const pad = `0 ${fluid(120, 24)}`;
  return (
    <header className="relative overflow-hidden">
      <HeroDots />

      <div className="relative" style={{ padding: pad }}>
        <div className="mx-auto w-full max-w-[1200px]">
          <div style={{ paddingTop: fluid(160, 104), paddingBottom: fluid(100, 64) }}>
            <Reveal immediate className="flex items-center gap-2">
              <span aria-hidden style={{ width: 8, height: 8, background: accent }} />
              <span className="uppercase" style={{ fontSize: 14, lineHeight: "22px", color: "#7A7885" }}>
                {eyebrow}
              </span>
            </Reveal>

            <Reveal immediate delay={120}>
              <GradientHoverHeading
                as="h1"
                className="font-display text-ink"
                text={title}
                breakFrom="md"
                style={{
                  margin: "20px 0 0",
                  maxWidth: 1040,
                  fontSize: fluid(72, 40),
                  lineHeight: 1.1111,
                  fontWeight: 400,
                }}
                trailing={
                  <span
                    className="font-sans"
                    style={{
                      display: "block",
                      maxWidth: 512,
                      fontSize: fluid(18, 15),
                      lineHeight: 1.3,
                      fontWeight: 400,
                      color: "var(--ink-muted, #7A7885)",
                      textWrap: "balance",
                    }}
                  >
                    {intro}
                  </span>
                }
              />
            </Reveal>

            <Reveal immediate delay={360} style={{ marginTop: fluid(40, 28) }}>
              <RainbowButton label={cta} />
            </Reveal>
            {children}
          </div>
        </div>
      </div>
    </header>
  );
}

export default ProductHero;
