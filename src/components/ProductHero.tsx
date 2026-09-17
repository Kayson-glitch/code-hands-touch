import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { SonarGrid } from "@/components/ui/sonar-grid";
import { fluid } from "@/lib/fluid";
import { GRADIENT_STOPS, RainbowButton } from "@/components/RainbowButton";
export { GRADIENT, GRADIENT_STOPS, RainbowButton } from "@/components/RainbowButton";

/**
 * First screen shared by the Platform and Solution product pages: the CTA
 * screen's dot field with ambient gradient rings, a square eyebrow, a 72px
 * three-line display title with the intro hanging off its last line, and the
 * rainbow Book a Demo. Fades the dots in under the nav and out into the next
 * section.
 */

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
                  fontSize: fluid(60, 36),
                  lineHeight: 1.1,
                  fontWeight: 400,
                }}
                trailing={
                  <span
                    className="font-sans"
                    style={{
                      display: "block",
                      maxWidth: 480,
                      fontSize: 16,
                      lineHeight: "24px",
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
