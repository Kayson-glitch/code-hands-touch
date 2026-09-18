import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
import { BreakLines, HeroDots, RainbowButton } from "@/components/ProductHero";
import { RollingNumber } from "@/components/RollingNumber";
import { DotGlobe } from "@/components/DotGlobe";
import { companySanFranciscoAsset } from "@/lib/media";
import { fluid } from "@/lib/fluid";

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "Company Hub — Synergy.AI" },
      {
        name: "description",
        content:
          "Synergy.AI is the intelligence layer for customer success. Our mission, how we work, and the roles we are hiring for.",
      },
      { property: "og:title", content: "Company Hub — Synergy.AI" },
      {
        property: "og:description",
        content: "The intelligence layer for customer success — our mission and how we work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyPage,
});

/* --------------------------------------------------------------- helpers */

const INK = "#0E0B22";
const MUTED = "#7A7885";
const FAINT = "#A1A0A9";
const HAIRLINE = "#E1E0E4";
/** Page accent — the Knowledge square from the Platform menu. */
const VIOLET = "#9E8CFF";
/**
 * The headline's middle line, blue → violet → pink: the brand gradient's own
 * ends with the page accent between them. The full four-stop brand gradient
 * runs to yellow, which slices into a rainbow across a single short line.
 */
const HEADLINE_GRADIENT = `linear-gradient(90deg, #137DFF 0%, ${VIOLET} 50%, #FF18AA 100%)`;

/* ------------------------------------------------------------------ data */

const HERO = {
  /** The middle line takes the brand gradient, as in the design. */
  before: "We're building the",
  gradient: "intelligence layer",
  after: "for customer success.",
  intro:
    "Synergy.AI is the intelligence layer for customer success. We automate mundane work so agents focus on what matters.",
};

const MISSION = {
  title: "Our Mission",
  body: "To bridge the gap between businesses and customers through empathetic, efficient, and intelligent AI solutions. We believe technology should serve humanity, making interactions smoother and more meaningful.",
};

/** Facts pinned around the globe. `value` is set in the display face. */
const FACTS: Array<{ value: string; label: string; at: string }> = [
  { value: "2.5M+", label: "Tickets Solved", at: "top-[10%] right-0" },
  { value: "90%", label: "CSAT Score", at: "top-[42%] -right-2" },
  { value: "2023", label: "Founded", at: "bottom-[12%] right-[18%]" },
];

const PRINCIPLES = [
  {
    dot: "#8CE0FF",
    title: "Move with Urgency",
    body: "We ship fast. We believe the best way to learn is to put product in the hands of customers.",
  },
  {
    dot: VIOLET,
    title: "Obsess over Customers",
    body: "We don't just build software; we build relationships. Every feature starts with a customer problem.",
  },
  {
    dot: "#D1E486",
    title: "Think Global",
    body: "AI augmentation without losing human accountability.",
  },
];

/* ------------------------------------------------------------- fragments */

function Hairline() {
  return <div aria-hidden style={{ height: 1, background: HAIRLINE }} />;
}

/**
 * Square hairline card — the surface every module on the site is built from.
 * The figure rolls its digits in on entry, as the Platform KPIs do, and the
 * card drifts a little off the globe under the cursor.
 */
function FactCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="company-float"
      style={{
        padding: "12px 16px",
        background: "#FFFFFF",
        border: `1px solid ${HAIRLINE}`,
      }}
    >
      <p className="font-display whitespace-nowrap" style={{ margin: 0, fontSize: 22, lineHeight: "28px", fontWeight: 400, color: INK }}>
        <RollingNumber value={value} />
      </p>
      <p className="uppercase whitespace-nowrap" style={{ margin: "2px 0 0", fontSize: 10, lineHeight: "16px", letterSpacing: "0.12em", color: FAINT }}>
        {label}
      </p>
    </div>
  );
}

/**
 * The globe with the facts pinned around it. The globe is drawn as a dot
 * matrix and turns on its own, so it reads as the same drawing as the hero
 * hands rather than as a picture dropped into the page.
 */
function MissionFigure() {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 520 }}>
      <DotGlobe className="w-full" />

      {/* San Francisco — the one photographic card, framed like every figure */}
      <Reveal
        y={16}
        duration={1200}
        delay={260}
        className="company-float absolute left-0 top-[24%] hidden sm:block"
        style={{ width: 168, padding: 8, background: "#FFFFFF", border: `1px solid ${HAIRLINE}` }}
      >
        <p className="uppercase" style={{ margin: "0 0 8px", fontSize: 10, lineHeight: "16px", letterSpacing: "0.12em", color: MUTED }}>
          San Francisco
        </p>
        <img
          src={companySanFranciscoAsset.url}
          alt="The Golden Gate Bridge, San Francisco"
          className="block h-auto w-full select-none"
          draggable={false}
          style={{ aspectRatio: "1 / 1", objectFit: "cover" }}
        />
      </Reveal>

      {/* the facts land one after another, the way the Why figures build */}
      {FACTS.map((f, i) => (
        <Reveal
          key={f.label}
          y={16}
          duration={1200}
          delay={380 + i * 140}
          className={`absolute hidden sm:block ${f.at}`}
        >
          <FactCard value={f.value} label={f.label} />
        </Reveal>
      ))}

      {/* phones: the facts read as a plain row under the globe */}
      <div className="mt-6 grid grid-cols-3 sm:hidden" style={{ gap: 8 }}>
        {FACTS.map((f, i) => (
          <Reveal key={f.label} y={16} duration={1200} delay={200 + i * 120}>
            <FactCard value={f.value} label={f.label} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

function CompanyPage() {
  const pad = `0 ${fluid(120, 24)}`;

  return (
    <div className="why-synergy relative min-h-screen bg-paper">
      <SiteNav revealDelay={0} solid />

      {/* ------------------------------------------------------------ hero */}
      <header className="relative overflow-hidden">
        <HeroDots />
        <div className="relative" style={{ padding: pad }}>
          <div
            className="mx-auto flex w-full max-w-[1200px] flex-col items-center text-center"
            style={{ paddingTop: fluid(160, 104), paddingBottom: fluid(120, 72) }}
          >
            <Reveal immediate className="flex items-center gap-2">
              <span aria-hidden style={{ width: 8, height: 8, background: VIOLET }} />
              <span className="uppercase" style={{ fontSize: 11, lineHeight: "18px", letterSpacing: "0.14em", color: MUTED }}>
                Company
              </span>
            </Reveal>

            <Reveal immediate delay={120}>
              <h1
                className="font-display text-ink"
                style={{ margin: "18px 0 0", fontSize: fluid(60, 36), lineHeight: 1.1, fontWeight: 400 }}
              >
                {HERO.before}
                <br />
                <span
                  style={{
                    backgroundImage: HEADLINE_GRADIENT,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {HERO.gradient}
                </span>
                <br />
                {HERO.after}
              </h1>
            </Reveal>

            <Reveal immediate delay={240}>
              <p style={{ margin: "20px 0 0", maxWidth: 620, fontSize: 16, lineHeight: "24px", color: MUTED }}>
                {HERO.intro}
              </p>
            </Reveal>

            <Reveal immediate delay={360} style={{ marginTop: fluid(40, 28) }}>
              <RainbowButton label="Book a Demo" />
            </Reveal>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- mission */}
      <section style={{ padding: pad }}>
        <div className="mx-auto w-full max-w-[1200px]">
          <Hairline />
          <div
            className="grid items-center lg:grid-cols-2"
            style={{ paddingTop: fluid(100, 56), paddingBottom: fluid(100, 56), columnGap: fluid(96, 40), rowGap: fluid(56, 36) }}
          >
            <Reveal y={24} duration={1600}>
              <h2
                className="font-display text-ink"
                style={{ margin: 0, fontSize: fluid(48, 30), lineHeight: 1.1667, fontWeight: 400 }}
              >
                {MISSION.title}
              </h2>
              <p style={{ margin: "20px 0 0", maxWidth: 480, fontSize: 16, lineHeight: "24px", color: MUTED }}>
                {MISSION.body}
              </p>
            </Reveal>

            <Reveal y={32} duration={1600} delay={140}>
              <MissionFigure />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ principles */}
      <section style={{ padding: pad, background: "#FAFAFA" }}>
        <div className="mx-auto w-full max-w-[1200px]">
          <Hairline />
          <div style={{ paddingTop: fluid(100, 56), paddingBottom: fluid(100, 56) }}>
            <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
              <Reveal y={24} duration={1600}>
                <h2
                  className="font-display text-ink"
                  style={{ margin: 0, fontSize: fluid(48, 30), lineHeight: 1.1667, fontWeight: 400 }}
                >
                  How We Work
                </h2>
              </Reveal>
              <Reveal y={24} duration={1600} delay={120}>
                <p style={{ margin: "18px 0 0", fontSize: 16, lineHeight: "24px", color: MUTED }}>
                  Synergy.AI isn't just a chatbot. It's a comprehensive automation layer that sits on
                  top of your existing operational stack.
                </p>
              </Reveal>
            </div>

            <div
              className="grid md:grid-cols-3"
              style={{ marginTop: fluid(64, 40), gap: 16 }}
            >
              {PRINCIPLES.map((p, i) => (
                <Reveal key={p.title} y={24} duration={1400} delay={180 + i * 100} className="min-w-0">
                  <div
                    className="flex h-full flex-col"
                    style={{
                      padding: fluid(32, 24),
                      background: "#FFFFFF",
                      border: `1px solid ${HAIRLINE}`,
                    }}
                  >
                    <span aria-hidden style={{ width: 8, height: 8, background: p.dot }} />
                    <h3
                      className="font-display"
                      style={{ margin: `${fluid(28, 20)} 0 0`, fontSize: 24, lineHeight: "32px", fontWeight: 400, color: INK }}
                    >
                      {p.title}
                    </h3>
                    <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: "22px", color: MUTED }}>
                      {p.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section style={{ padding: pad }}>
        <div className="mx-auto w-full max-w-[1200px]" style={{ paddingTop: fluid(100, 56), paddingBottom: fluid(120, 72) }}>
          <Reveal y={24} duration={1600}>
            <div
              className="flex flex-col md:flex-row md:items-end md:justify-between"
              style={{
                padding: fluid(56, 32),
                gap: fluid(40, 28),
                background: "#F6F6F8",
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              <div style={{ maxWidth: 640 }}>
                <h2
                  className="font-display text-ink"
                  style={{ margin: 0, fontSize: fluid(48, 30), lineHeight: 1.1667, fontWeight: 400 }}
                >
                  <BreakLines text={"Ready to join\nthe mission?"} />
                </h2>
                <p style={{ margin: "18px 0 0", fontSize: 14, lineHeight: "22px", color: MUTED }}>
                  We're hiring across Engineering, Product, and Sales. Come build the future with us.
                </p>
              </div>
              <div className="shrink-0">
                <RainbowButton label="Contact us" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter cta={false} />
      <FinChatDock alwaysVisible />
    </div>
  );
}

export default CompanyPage;
