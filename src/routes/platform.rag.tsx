import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp, ChevronDown, Crosshair, Plus, Search, Zap, type LucideIcon } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
import { DotArrow } from "@/components/DotArrow";
import { RollingNumber } from "@/components/RollingNumber";
import { logoAsset } from "@/lib/media";
import { SonarGrid } from "@/components/ui/sonar-grid";

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

const GRADIENT_STOPS = ["#137DFF", "#FF18AA", "#FFCD17", "#137DFF"];
const GRADIENT = `linear-gradient(90deg, ${GRADIENT_STOPS[0]} 0%, ${GRADIENT_STOPS[1]} 33.333%, ${GRADIENT_STOPS[2]} 66.666%, ${GRADIENT_STOPS[3]} 100%)`;
/** Page accent — the Platform menu's "Engine" square. */
const SKY = "#8CE0FF";
/** Product UI accent inside the demo card (Figma #4F39F6, brand indigo). */
const INDIGO = "#5749FF";
const HAIRLINE = "#E1E0E4";

function RainbowButton({ label }: { label: string }) {
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

/** The worked example inside the demo card (Figma 855:52075). */
const DEMO = {
  prompt:
    "A customer's asking if order #8841 still qualifies for the 7-day no-questions return — check the status and reply per policy.",
  steps: [
    { icon: Crosshair, tool: "intent_detection", result: "return inquiry" },
    { icon: Search, tool: "knowledge_retrieval", result: "return policy · 7-day window" },
    { icon: Zap, tool: "function_calling", result: "order system · #8841" },
  ] as Array<{ icon: LucideIcon; tool: string; result: string }>,
  answer:
    "Found it. Order #8841 shipped June 23, delivered 4 days ago — still within the 7-day window, 3 days left to file. Drafted a reply matching brand tone. Send it to the customer?",
  model: "Synergy RAG 2.0",
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

/** One tool call in the demo transcript: icon, tool name, what it resolved. */
function ToolChip({ icon: Icon, tool, result }: { icon: LucideIcon; tool: string; result: string }) {
  return (
    <div
      className="inline-flex max-w-full items-center self-start"
      style={{
        gap: 12,
        padding: "8px 14px",
        background: "#FFFFFF",
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 999,
      }}
    >
      <Icon size={16} strokeWidth={1.5} color="#0E0B22" />
      <span className="flex min-w-0 flex-wrap items-baseline" style={{ gap: 8, fontSize: 13, lineHeight: "22px" }}>
        <span className="font-mono" style={{ color: "#7A7885", fontSize: 12 }}>
          {tool}
        </span>
        <span aria-hidden style={{ color: "#0E0B22" }}>
          ·
        </span>
        <span style={{ color: "#0E0B22" }}>{result}</span>
      </span>
    </div>
  );
}

/** The product depiction: a transcript where the engine shows its work. */
function DemoCard() {
  return (
    <Reveal y={32} duration={1600} delay={160} className="flex-1" style={{ minWidth: 0 }}>
      <div
        className="flex h-full flex-col"
        style={{ background: "#FFFFFF", border: `1px solid ${HAIRLINE}` }}
      >
        {/* title bar */}
        <div
          className="flex items-center justify-center"
          style={{ height: 56, gap: 8, borderBottom: `1px solid ${HAIRLINE}` }}
        >
          <img
            src={logoAsset.url}
            alt=""
            style={{ width: 20, height: 20, borderRadius: 999, objectFit: "cover" }}
          />
          <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "#0E0B22" }}>
            Synergy.AI
          </span>
        </div>

        <div className="flex flex-1 flex-col" style={{ padding: 16, gap: 24 }}>
          <div className="flex flex-1 flex-col" style={{ padding: "0 8px", gap: 24 }}>
            {/* operator prompt */}
            <div className="flex justify-end">
              <p
                style={{
                  margin: 0,
                  maxWidth: 440,
                  padding: "12px 20px",
                  background: "#EBE8FF",
                  borderRadius: 16,
                  fontSize: 14,
                  lineHeight: "24px",
                  color: "#0E0B22",
                }}
              >
                {DEMO.prompt}
              </p>
            </div>

            {/* tool calls */}
            <div className="flex flex-col" style={{ gap: 12 }}>
              {DEMO.steps.map((s) => (
                <ToolChip key={s.tool} {...s} />
              ))}
            </div>

            <p style={{ margin: 0, fontSize: 14, lineHeight: "24px", color: "#0E0B22" }}>
              {DEMO.answer}
            </p>
          </div>

          {/* composer */}
          <div
            className="flex flex-col"
            style={{ gap: 8, padding: "16px 20px", border: `1px solid ${HAIRLINE}`, borderRadius: 16 }}
          >
            <span style={{ fontSize: 14, lineHeight: "24px", color: "#A1A0A9" }}>Reply…</span>
            <div className="flex items-center justify-between">
              <Plus size={20} strokeWidth={1.5} color="#0E0B22" />
              <div className="flex items-center" style={{ gap: 12 }}>
                <span
                  className="inline-flex items-center"
                  style={{ gap: 4, fontSize: 14, lineHeight: "24px", fontWeight: 500, color: "#7A7885" }}
                >
                  {DEMO.model}
                  <ChevronDown size={16} strokeWidth={1.5} />
                </span>
                <span
                  className="grid place-items-center"
                  style={{ width: 32, height: 32, background: INDIGO, borderRadius: 10 }}
                >
                  <ArrowUp size={16} strokeWidth={2} color="#FFFFFF" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/**
 * Hairline frame with crop-mark corners (Figma 底框): rules inset from the
 * section edges, a 6px square where they meet, and short ticks running out
 * to the viewport edge at each corner.
 */
function CropFrame({ inset }: { inset: string }) {
  const rule = "#DCDCDC";
  const corner = (x: "left" | "right", y: "top" | "bottom") => (
    <span
      key={`${x}-${y}`}
      aria-hidden
      className="absolute"
      style={{
        [x]: inset,
        [y]: inset,
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
      <div className="absolute" style={{ inset, border: `1px solid ${rule}` }} />
      {/* ticks continuing the rules to the edges */}
      {(["top", "bottom"] as const).map((y) => (
        <span key={`h-${y}`} className="absolute inset-x-0" style={{ [y]: inset, height: 1, background: rule, opacity: 0.6 }} />
      ))}
      {(["left", "right"] as const).map((x) => (
        <span key={`v-${x}`} className="absolute inset-y-0" style={{ [x]: inset, width: 1, background: rule, opacity: 0.6 }} />
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

      {/* ------------------------------------------------------------ hero */}
      <header className="relative overflow-hidden">
        {/* The homepage CTA's dot field — 20px pitch, ambient gradient rings,
            a grey halftone shoreline swelling toward the next section — now
            opens the page (Figma 点纹). Fades in under the nav. */}
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
          className="pointer-events-none absolute inset-0"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0, #000 18%, #000 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 18%, #000 100%)",
          }}
        />

        <div className="relative" style={{ padding: pad }}>
          <div className="mx-auto w-full max-w-[1200px]">
            <div style={{ paddingTop: fluid(160, 104), paddingBottom: fluid(100, 64) }}>
              <Reveal immediate className="flex items-center gap-2">
                <span aria-hidden style={{ width: 8, height: 8, background: SKY }} />
                <span className="uppercase" style={{ fontSize: 14, lineHeight: "22px", color: "#7A7885" }}>
                  {HERO.eyebrow}
                </span>
              </Reveal>

              <Reveal immediate delay={120}>
                <GradientHoverHeading
                  as="h1"
                  className="font-display text-ink"
                  text={HERO.title}
                  breakFrom="md"
                  style={{
                    margin: "20px 0 0",
                    maxWidth: 980,
                    fontSize: fluid(72, 40),
                    lineHeight: 1.1111,
                    fontWeight: 400,
                  }}
                  trailing={
                    <span
                      className="font-sans"
                      style={{
                        display: "block",
                        maxWidth: 390,
                        fontSize: fluid(18, 15),
                        lineHeight: 1.3,
                        fontWeight: 400,
                        color: "var(--ink-muted, #7A7885)",
                        textWrap: "balance",
                      }}
                    >
                      {HERO.intro}
                    </span>
                  }
                />
              </Reveal>

              <Reveal immediate delay={360} style={{ marginTop: fluid(40, 28) }}>
                <RainbowButton label="Book a Demo" />
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- engine module */}
      <section className="relative" style={{ background: "#FAFAFA" }}>
        <CropFrame inset={fluid(86, 16)} />

        <div className="relative" style={{ padding: `${fluid(120, 64)} ${fluid(120, 24)}` }}>
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
