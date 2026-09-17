import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
import { RollingNumber } from "@/components/RollingNumber";
import { ProductHero } from "@/components/ProductHero";
import { platformRagDemoAsset } from "@/lib/media";
import { HoverTilt } from "@/components/HoverTilt";

export const Route = createFileRoute("/platform/rag")({
  head: () => ({
    meta: [
      { title: "Self-Developed RAG 2.0 — Synergy.AI" },
      {
        name: "description",
        content:
          "Empower conversations with contextual intelligence: a proprietary retrieval and orchestration pipeline that understands intent deeply, so every response stays accurate and on-brand.",
      },
      { property: "og:title", content: "Self-Developed RAG 2.0 — Synergy.AI" },
      {
        property: "og:description",
        content:
          "A proprietary retrieval and orchestration pipeline that understands intent deeply, so every response stays accurate and on-brand.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RagPage,
});

/* --------------------------------------------------------------- helpers */

/** 1440px design width → fluid value. */
const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

/** Page accent — the Platform menu's "Engine" square. */
const SKY = "#8CE0FF";
const HAIRLINE = "#E1E0E4";

/* ------------------------------------------------------------------ data */

const HERO = {
  eyebrow: "RAG 2.0",
  title: "Empower conversations\nwith contextual\nintelligence.",
  intro: "Intelligent Knowledge Engine for accurate, context-aware responses.",
};

const ENGINE = {
  title: "Intelligent knowledge\nengine",
  body: "A proprietary retrieval and orchestration pipeline that understands intent deeply, so every response stays accurate and on-brand.",
  stats: [
    { label: "Knowledge retrieval accuracy", value: "100", unit: "%" },
    { label: "First contact resolution", value: "70", unit: "%", prefix: "+" },
  ],
};

/* ------------------------------------------------------------- fragments */

/** Stat tile — the Why Synergy KPI card's typography at tile size. */
function StatTile({
  label,
  value,
  unit,
  prefix,
  delay = 0,
}: {
  label: string;
  value: string;
  unit?: string;
  prefix?: string;
  delay?: number;
}) {
  return (
    <Reveal y={20} duration={1600} delay={delay} className="flex-1" style={{ minWidth: 0 }}>
      <div
        className="flex h-full flex-col justify-between"
        style={{
          gap: 12,
          padding: "20px 20px 16px",
          background: "#F8F9FA",
          border: `1px solid ${HAIRLINE}`,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: "var(--ink, #0E0B22)" }}>
          {label}
        </p>
        <p
          className="font-display whitespace-nowrap"
          style={{ margin: 0, fontSize: fluid(40, 32), lineHeight: 1.1, fontWeight: 400, color: "var(--ink, #0E0B22)" }}
        >
          {prefix ? <span style={{ color: "#A1A0A9" }}>{prefix}</span> : null}
          <RollingNumber value={value} />
          {unit ? <span style={{ color: "#A1A0A9" }}>{unit}</span> : null}
        </p>
      </div>
    </Reveal>
  );
}

/** The product depiction — the transcript card designed in Figma, exported at 2×. */
function DemoCard() {
  return (
    <Reveal y={32} duration={1600} delay={160} className="flex flex-1 md:justify-end" style={{ minWidth: 0 }}>
      <HoverTilt from="left" className="w-full" style={{ maxWidth: 588 }}>
        <img
          src={platformRagDemoAsset.url}
          alt="Synergy RAG 2.0 working a return request: intent detection, knowledge retrieval, function calling, drafted reply"
          draggable={false}
          className="block h-auto w-full select-none"
          style={{ aspectRatio: "588 / 568" }}
        />
      </HoverTilt>
    </Reveal>
  );
}

/**
 * Hairline frame with crop-mark corners (Figma 底框): rules inset from the
 * section edges, a 6px square where they meet, and short ticks running out
 * to the viewport edge at each corner.
 */
function CropFrame({ inset, insetBottom = inset }: { inset: string; insetBottom?: string }) {
  const rule = "#DCDCDC";
  const edge = (y: "top" | "bottom") => (y === "bottom" ? insetBottom : inset);
  const corner = (x: "left" | "right", y: "top" | "bottom") => (
    <span
      key={`${x}-${y}`}
      aria-hidden
      className="absolute"
      style={{
        [x]: inset,
        [y]: edge(y),
        width: 6,
        height: 6,
        background: "#FFFFFF",
        border: `1px solid ${rule}`,
        transform: `translate(${x === "left" ? "-50%" : "50%"}, ${y === "top" ? "-50%" : "50%"})`,
      }}
    />
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      {/* the frame */}
      <div
        className="absolute"
        style={{ top: inset, left: inset, right: inset, bottom: insetBottom, border: `1px solid ${rule}` }}
      />
      {/* ticks continuing the rules past the frame, fading out toward the edges */}
      {(["top", "bottom"] as const).map((y) => (
        <span
          key={`h-${y}`}
          className="absolute inset-x-0"
          style={{
            [y]: edge(y),
            height: 1,
            background: `linear-gradient(to right, transparent 0, ${rule} ${inset}, ${rule} calc(100% - ${inset}), transparent 100%)`,
          }}
        />
      ))}
      {(["left", "right"] as const).map((x) => (
        <span
          key={`v-${x}`}
          className="absolute inset-y-0"
          style={{
            [x]: inset,
            width: 1,
            background: `linear-gradient(to bottom, transparent 0, ${rule} ${inset}, ${rule} calc(100% - ${insetBottom}), transparent 100%)`,
          }}
        />
      ))}
      {corner("left", "top")}
      {corner("right", "top")}
      {corner("left", "bottom")}
      {corner("right", "bottom")}
    </div>
  );
}

/* ------------------------------------------------------------------ page */

function RagPage() {
  const pad = `0 ${fluid(120, 24)}`;

  return (
    <div className="relative min-h-screen bg-paper">
      <SiteNav revealDelay={0} solid />

      <ProductHero eyebrow={HERO.eyebrow} accent={SKY} title={HERO.title} intro={HERO.intro} />

      {/* ---------------------------------------------------- engine module */}
      <section className="relative" style={{ background: "#FAFAFA" }}>
        {/* 80px of air inside the frame, then 200px of plain background before the footer */}
        <CropFrame inset={fluid(86, 16)} insetBottom={fluid(200, 72)} />

        <div
          className="relative"
          style={{ padding: `${fluid(166, 80)} ${fluid(120, 24)} ${fluid(280, 136)}` }}
        >
          <div
            className="mx-auto flex w-full max-w-[1200px] flex-col md:flex-row md:items-center"
            style={{ gap: fluid(24, 32) }}
          >
            {/* copy + stats */}
            <div className="flex flex-1 flex-col" style={{ gap: fluid(56, 36), paddingRight: fluid(56, 0) }}>
              <div>
                <Reveal y={24} duration={1600}>
                  <GradientHoverHeading
                    as="h2"
                    className="font-display text-ink"
                    text={ENGINE.title}
                    breakFrom="md"
                    style={{ margin: 0, fontSize: fluid(44, 30), lineHeight: 1.2273, fontWeight: 400 }}
                  />
                </Reveal>
                <Reveal y={24} duration={1600} delay={120}>
                  <p
                    style={{
                      margin: "20px 0 0",
                      maxWidth: 532,
                      fontSize: fluid(18, 15),
                      lineHeight: 1.7,
                      color: "var(--ink-muted, #7A7885)",
                    }}
                  >
                    {ENGINE.body}
                  </p>
                </Reveal>
              </div>

              <div className="flex" style={{ gap: 16 }}>
                {ENGINE.stats.map((s, i) => (
                  <StatTile key={s.label} {...s} delay={200 + i * 120} />
                ))}
              </div>
            </div>

            <DemoCard />
          </div>
        </div>
      </section>

      {/* brand footer only — this page ends on its module, not the CTA screen */}
      <SiteFooter cta={false} />

      <FinChatDock alwaysVisible />
    </div>
  );
}

export default RagPage;
