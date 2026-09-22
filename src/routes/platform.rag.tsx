import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
import { RollingNumber } from "@/components/RollingNumber";
import { BreakLines, ProductHero } from "@/components/ProductHero";
import { platformRagDemoAsset } from "@/lib/media";
import { fluid } from "@/lib/fluid";
import { HoverTilt } from "@/components/HoverTilt";
import { CropFrame } from "@/components/CropFrame";

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


/** Page accent — the Platform menu's "Engine" square. */
const SKY = "#8CE0FF";
const HAIRLINE = "#E1E0E4";
/** Engine module tile ground, from Figma 3050:29390. */
const TILE_FILL = "var(--surface-soft, #F7F7F8)";
/** Crop marks on the stat tiles: 8px arms, near-black, 1px. */
const MARK = 8;
const MARK_INK = "#000000";

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
        className="relative flex h-full flex-col justify-between"
        style={{
          gap: 9,
          padding: "20px 20px 16px",
          background: TILE_FILL,
          border: `1px solid ${HAIRLINE}`,
        }}
      >
        {/* Crop marks on the four corners, 8px arms straddling the hairline. */}
        {(
          [
            ["top", "left"],
            ["top", "right"],
            ["bottom", "left"],
            ["bottom", "right"],
          ] as const
        ).map(([y, x]) => (
          <span
            key={`${y}-${x}`}
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              [y]: -1,
              [x]: -1,
              width: MARK,
              height: MARK,
              [`border${y === "top" ? "Top" : "Bottom"}`]: `1px solid ${MARK_INK}`,
              [`border${x === "left" ? "Left" : "Right"}`]: `1px solid ${MARK_INK}`,
            }}
          />
        ))}
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
      <HoverTilt from="left" className="w-full" style={{ maxWidth: 560 }}>
        <img
          src={platformRagDemoAsset.url}
          alt="Synergy RAG 2.0 working a return request: the orchestration steps it runs, and the reply they produce"
          draggable={false}
          className="block h-auto w-full select-none"
          style={{ aspectRatio: "1 / 1" }}
        />
      </HoverTilt>
    </Reveal>
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
        {/* symmetric: 86px from the section edge to the frame, 80px from the frame to the content */}
        <CropFrame inset={fluid(86, 16)} />

        <div
          className="relative"
          style={{ padding: `${fluid(166, 80)} ${fluid(120, 24)}` }}
        >
          <div
            className="mx-auto flex w-full max-w-[1200px] flex-col md:flex-row md:items-center"
            style={{ gap: fluid(24, 32) }}
          >
            {/* copy + stats */}
            <div className="flex flex-1 flex-col" style={{ gap: fluid(56, 36), paddingRight: fluid(56, 0) }}>
              <div>
                <Reveal y={24} duration={1600}>
                  <h2
                    className="font-display text-ink"
                    style={{ margin: 0, fontSize: fluid(48, 30), lineHeight: 1.1667, fontWeight: 400 }}
                  >
                    <BreakLines text={ENGINE.title} />
                  </h2>
                </Reveal>
                <Reveal y={24} duration={1600} delay={120}>
                  <p
                    style={{
                      margin: "20px 0 0",
                      maxWidth: 532,
                      fontSize: 14,
                      lineHeight: "22px",
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

      {/* a plain band of background between the module and the footer */}
      <div aria-hidden style={{ height: fluid(160, 96), background: "#FAFAFA" }} />

      {/* brand footer only — this page ends on its module, not the CTA screen */}
      <SiteFooter cta={false} />

      <FinChatDock alwaysVisible />
    </div>
  );
}
