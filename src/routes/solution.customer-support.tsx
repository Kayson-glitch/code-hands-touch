import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
import { RollingNumber } from "@/components/RollingNumber";
import { GRADIENT, ProductHero, RainbowButton } from "@/components/ProductHero";
import { solutionChannelsAsset, solutionConsoleAsset, solutionFlowAsset } from "@/lib/media";
import { HoverTilt } from "@/components/HoverTilt";

export const Route = createFileRoute("/solution/customer-support")({
  head: () => ({
    meta: [
      { title: "Scale & Stabilise Customer Support — Synergy.AI" },
      {
        name: "description",
        content:
          "Customer experience designed to feel effortless: consistent answers across every channel, real-time always-on support, and faster resolution through self-service.",
      },
      { property: "og:title", content: "Scale & Stabilise Customer Support — Synergy.AI" },
      {
        property: "og:description",
        content:
          "Instant answers. Tasks done. Conversations that never start over. Help that's always there — effortlessly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerSupportPage,
});

/* --------------------------------------------------------------- helpers */

const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

/** Page accent — the Solution menu's "Customer service" square. */
const AMBER = "#FFCE91";
const HAIRLINE = "#E1E0E4";
const INK = "#0E0B22";
const MUTED = "#7A7885";

/* ------------------------------------------------------------------ data */

const HERO = {
  eyebrow: "Frictionless customer AI",
  title: "Customer Experience,\nDesigned to Feel\nEffortless.",
  intro:
    "Instant answers. Tasks done. Conversations that never start over. Help that's always there — effortlessly.",
};

type Feature = {
  title: string;
  body: string;
  values: string[];
  figure: "channels" | "console" | "flow";
};

const FEATURES: Feature[] = [
  {
    title: "Consistent Answers\nAcross Every Channel",
    body: "synergy.ai uses a unified knowledge base and response logic across all support channels. Whether customers reach out via web, mobile apps, social platforms, or email, they receive consistent, accurate, and traceable answers every time.",
    values: [
      "Seamless conversations across channels",
      "Reduced trust loss from inconsistent answers",
      "Stronger brand credibility and service standards",
    ],
    figure: "channels",
  },
  {
    title: "Real-Time,\nAlways-On Support",
    body: "synergy.ai delivers 24/7 real-time responsiveness, understanding customer requests the moment they are made and providing accurate answers instantly. By automating high-frequency inquiries and standard workflows, customers get what they need without waiting.",
    values: [
      "No queues. Questions answered instantly",
      "Fewer drop-offs caused by waiting or frustration",
      "A more professional and reliable service experience",
    ],
    figure: "console",
  },
  {
    title: "Faster Resolution\nThrough Self-Service",
    body: "synergy.ai enables efficient self-service experiences, guiding customers to complete common actions such as inquiries, updates, and status tracking on their own. Many issues are resolved end-to-end without escalation.",
    values: [
      "Greater control through self-resolution",
      "Shorter time to resolution",
      "Fewer experience breaks caused by repeated transfers",
    ],
    figure: "flow",
  },
];

const OUTCOMES = {
  title: "Support that feels\nimmediate\nand dependable.",
  body: "synergy.ai removes friction from every customer interaction — responding faster, staying consistent, and helping customers move forward without delay.",
  stats: [
    { sign: "-", value: "70", unit: "%", label: "First\nResponse Time" },
    { sign: "+", value: "28", unit: "%", label: "First Contact\nResolution" },
    { sign: "+", value: "40", unit: "%", label: "Tickets Resolved\nvia Self-Service" },
    { sign: "-", value: "17", unit: "%", label: "Customer\nSatisfaction (CSAT)" },
  ],
};

/* ------------------------------------------------------------- fragments */

function Bullet({ diamond }: { diamond: boolean }) {
  return (
    <span
      aria-hidden
      className="mt-[8px] inline-block shrink-0"
      style={{
        width: 6,
        height: 6,
        background: diamond ? AMBER : INK,
        transform: diamond ? "rotate(45deg)" : undefined,
      }}
    />
  );
}

/** Feature illustration — the card designed in Figma, exported at 2×. */
const FIGURES = {
  channels: { src: solutionChannelsAsset.url, alt: "One knowledge base answering web, email, mobile apps and social platforms" },
  console: { src: solutionConsoleAsset.url, alt: "24/7 support console with live conversations being resolved" },
  flow: { src: solutionFlowAsset.url, alt: "Self-service flow: inbound request, intent detection, automated solution, instant resolution" },
} as const;

function Figure({ kind, from }: { kind: Feature["figure"]; from: "left" | "right" }) {
  const f = FIGURES[kind];
  return (
    <HoverTilt from={from} className="w-full" style={{ maxWidth: 540 }}>
      <img
        src={f.src}
        alt={f.alt}
        draggable={false}
        className="block h-auto w-full select-none"
        style={{ aspectRatio: "1 / 1" }}
      />
    </HoverTilt>
  );
}

/* --- feature section ---------------------------------------------------- */

function FeatureSection({ feature, flip }: { feature: Feature; flip: boolean }) {
  return (
    // White, not paper: the illustrations fade to pure white at their edges,
    // so on #FAFAFA their bounding box would read as a faint lighter block.
    <section style={{ borderTop: `1px solid ${HAIRLINE}`, background: "#FFFFFF" }}>
      <div style={{ padding: `${fluid(100, 56)} ${fluid(120, 24)}` }}>
        <div
          className="mx-auto flex w-full max-w-[1200px] flex-col md:flex-row md:items-center"
          style={{ gap: fluid(40, 32) }}
        >
          <div className={`flex flex-1 flex-col ${flip ? "md:order-2" : ""}`} style={{ minWidth: 0 }}>
            <Reveal y={24} duration={1600}>
              <GradientHoverHeading
                as="h2"
                className="font-display text-ink"
                text={feature.title}
                breakFrom="md"
                style={{ margin: 0, maxWidth: 580, fontSize: fluid(44, 30), lineHeight: 1.2273, fontWeight: 400 }}
              />
            </Reveal>
            <Reveal y={24} duration={1600} delay={120}>
              <p style={{ margin: "20px 0 0", maxWidth: 580, fontSize: 14, lineHeight: "24px", color: MUTED }}>
                {feature.body}
              </p>
            </Reveal>
            <Reveal y={24} duration={1600} delay={240} style={{ marginTop: fluid(40, 28), maxWidth: 580 }}>
              <div aria-hidden style={{ height: 1, background: HAIRLINE }} />
              <p
                className="uppercase"
                style={{ margin: "20px 0 0", fontSize: 12, lineHeight: "18px", letterSpacing: "0.06em", color: MUTED }}
              >
                Customer experience value
              </p>
              <ul className="m-0 flex list-none flex-col p-0" style={{ marginTop: 14, gap: 10 }}>
                {feature.values.map((v, i) => (
                  <li key={v} className="flex items-start" style={{ gap: 10 }}>
                    <Bullet diamond={i % 2 === 0} />
                    <span style={{ fontSize: 14, lineHeight: "22px", color: INK }}>{v}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal
            y={32}
            duration={1600}
            delay={160}
            className={`flex flex-1 ${flip ? "md:order-1 md:justify-start" : "md:justify-end"}`}
            style={{ minWidth: 0 }}
          >
            <Figure kind={feature.figure} from={flip ? "right" : "left"} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* --- outcomes ----------------------------------------------------------- */

function OutcomeCard({
  sign,
  value,
  unit,
  label,
  index,
}: {
  sign: string;
  value: string;
  unit: string;
  label: string;
  index: number;
}) {
  return (
    <Reveal y={24} duration={1600} delay={index * 120} className="min-w-0 flex-1">
      <div
        className="flex h-full flex-col justify-between"
        style={{ background: "#F8F9FA", border: `1px solid ${HAIRLINE}`, minHeight: fluid(220, 160) }}
      >
        {/* each card shows a different slice of the brand gradient */}
        <div
          aria-hidden
          style={{ height: 2, backgroundImage: GRADIENT, backgroundSize: "400% 100%", backgroundPosition: `${index * 33.333}% 0` }}
        />
        <div style={{ padding: `${fluid(28, 20)} ${fluid(24, 18)} ${fluid(24, 18)}` }}>
          <p
            className="font-display whitespace-nowrap"
            style={{ margin: 0, fontSize: fluid(56, 40), lineHeight: 1.1, fontWeight: 400, color: INK }}
          >
            <span style={{ color: "#A1A0A9" }}>{sign}</span>
            <RollingNumber value={value} />
            <span style={{ color: "#A1A0A9" }}>{unit}</span>
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: "20px", color: MUTED, whiteSpace: "pre-line" }}>
            {label}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function Outcomes() {
  return (
    <section style={{ borderTop: `1px solid ${HAIRLINE}`, background: "#FAFAFA" }}>
      <div style={{ padding: `${fluid(100, 56)} ${fluid(120, 24)} ${fluid(120, 64)}` }}>
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between" style={{ gap: fluid(24, 24) }}>
            <Reveal y={24} duration={1600} className="md:w-1/2">
              <GradientHoverHeading
                as="h2"
                className="font-display text-ink"
                text={OUTCOMES.title}
                breakFrom="md"
                style={{ margin: 0, fontSize: fluid(44, 30), lineHeight: 1.2273, fontWeight: 400 }}
              />
            </Reveal>
            <Reveal y={24} duration={1600} delay={120} className="md:w-1/2">
              <p style={{ margin: 0, maxWidth: 532, fontSize: 16, lineHeight: "27px", color: INK }}>{OUTCOMES.body}</p>
              <div style={{ marginTop: fluid(32, 24) }}>
                <RainbowButton label="Book a Demo" />
              </div>
            </Reveal>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4" style={{ marginTop: fluid(56, 36), gap: 16 }}>
            {OUTCOMES.stats.map((s, i) => (
              <OutcomeCard key={s.label} {...s} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */

function CustomerSupportPage() {
  return (
    <div className="relative min-h-screen bg-paper">
      <SiteNav revealDelay={0} solid />

      <ProductHero eyebrow={HERO.eyebrow} accent={AMBER} title={HERO.title} intro={HERO.intro} />

      {FEATURES.map((f, i) => (
        <FeatureSection key={f.title} feature={f} flip={i % 2 === 1} />
      ))}

      <Outcomes />

      {/* brand footer only — the page ends on its outcomes, not the CTA screen */}
      <SiteFooter cta={false} />

      <FinChatDock alwaysVisible />
    </div>
  );
}

export default CustomerSupportPage;
