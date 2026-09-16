import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Coins, ChartPie, ClipboardCheck, Gauge, Headset, TrendingDown, Users } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { HalftoneHandStill } from "@/components/HalftoneHandStill";
import { Reveal } from "@/components/Reveal";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { DotArrow } from "@/components/DotArrow";
import { RollingNumber } from "@/components/RollingNumber";



export const Route = createFileRoute("/why-synergy/business-impact")({
  head: () => ({
    meta: [
      { title: "Business Impact — Synergy.AI" },
      {
        name: "description",
        content:
          "From AI support to measurable business value: resolution rate, cost impact projection and the assumptions behind every number.",
      },
      { property: "og:title", content: "Business Impact — Synergy.AI" },
      {
        property: "og:description",
        content:
          "From AI support to measurable business value: resolution rate, cost impact projection and the assumptions behind every number.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BusinessImpactPage,
});

/* --------------------------------------------------------------- helpers */

/** 1440px design width → fluid value. */
const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

const GRADIENT = "linear-gradient(90deg, #137DFF 0%, #FF18AA 33.333%, #FFCD17 66.666%, #137DFF 100%)";

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
        fontWeight: 400,
        padding: lg ? "0 20px" : "0 20px",
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

const ACCENT = "#5749FF";

/** Alternating violet diamond / ink square bullet, as in the design. */
function Bullet({ diamond }: { diamond: boolean }) {
  return (
    <span
      aria-hidden
      className="mt-[8px] inline-block shrink-0"
      style={{
        width: 6,
        height: 6,
        background: diamond ? ACCENT : "#0E0B22",
        transform: diamond ? "rotate(45deg)" : undefined,
      }}
    />
  );
}

function Hairline({ dark = false, dashed = false }: { dark?: boolean; dashed?: boolean }) {
  const color = dark ? "rgba(255,255,255,0.18)" : "#F1F1F3";
  if (dashed) {
    return (
      <div
        aria-hidden
        style={{
          height: 1,
          backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)`,
        }}
      />
    );
  }
  return <div aria-hidden style={{ height: 1, background: color }} />;
}

/* ------------------------------------------------------------------ data */

const KPI_LEFT = {
  kicker: "Business Value · ROI",
  value: "$12M",
  unit: "/ yr",
  caption: "Projected annual labour-cost saving · not yet executed",
  bullets: [
    "150 agents today · ≈$1.5M a month",
    "≈50 is enough: 20 VIP + 30 monitoring",
    "Replies → VIP service and monitoring",
    "Capability met; rollout is a pacing decision",
  ],
};

const KPI_RIGHT = {
  kicker: "Overall Impact",
  value: "55",
  unit: "%",
  caption: "AI auto-handling rate · 200K conversations a month",
  bullets: [
    "55% of conversations closed by AI end-to-end",
    "70% of messages by AI · ≈110K a month",
    "Both were zero before the June 2026 launch",
    "VIP threads always keep a human in the loop",
  ],
};

type BodySegment = { text: string; highlight?: boolean };
type ArticleBlockData = {
  icon: LucideIcon;
  title: string;
  body: string | BodySegment[];
  divider: boolean;
};
type ArticleSet = {
  eyebrow: string;
  titleAccent: string;
  titleRest: string;
  intro: string;
  light: ArticleBlockData[];
  dark: ArticleBlockData[];
};

const ARTICLES: Record<"roi" | "impact", ArticleSet> = {
  roi: {
    eyebrow: "Business Value · ROI",
    titleAccent: "Scaling Support Smarter:",
    titleRest: "Cost Analysis from 150 to 50 Agents",
    intro:
      "For the people who sign the budget. BCGame's 150-agent support team costs about $1.5M a month; this article quantifies how the AI system changes that structure and what the data already supports.",
    light: [
      {
        icon: Coins,
        title: "Analysis of Current Cost Structure",
        body: [
          { text: "Within the existing agent structure, the vast majority of labour hours are consumed by high-repetition, low-judgement inquiries: order tracking, payment progress, promotion rules, withdrawal status checks. These dominate inbound volume but need almost no human judgement. " },
          { text: "During promotional cycles", highlight: true },
          { text: ", inbound volume multiplies and the team typically copes with temporary hires. Marginal labour cost rises, training cycles stretch, and service quality becomes uneven. The marginal efficiency between labour input and service output keeps falling." },
        ],
        divider: true,
      },
      {
        icon: Users,
        title: "Target Structure: Reallocating Agent Functions",
        body: [
          { text: "After integration, based on business data from the current observation cycle, the CS team can be optimised to about 50 agents: 20 VIP agents (supervisor-level, dedicated to high-value customers) and 30 general agents. Crucially, the 30 general agents move from front-line Q&A to online data monitoring, anomaly handling and human fallback. " },
          { text: "This 30-agent headcount is a conservative configuration,", highlight: true },
          { text: " keeping redundancy for sudden load surges. Under this structure the AI system absorbs standardised work, while people concentrate on high-judgement, high-value workflows." },
        ],
        divider: false,
      },
    ],
    dark: [
      {
        icon: TrendingDown,
        title: "Cost Impact Projection",
        body: "Under the target structure the team shrinks by roughly 50%, which translates to about $1M a month and roughly $12M a year in labour cost. This is not cost reduction at the expense of service quality: VIP customers are served by dedicated agents, strengthening continuity and response quality, while general agents move into monitoring roles and the whole team shifts from a scale-driven to an efficiency-driven model.",
        divider: true,
      },
      {
        icon: ClipboardCheck,
        title: "Conclusion and Clarifications",
        body: "This projection is based on the AI system's actual absorption capacity during the current observation cycle — it describes the optimisation space the data supports; the organisational adjustment itself has not been executed. The system's capacity already meets the level required for this structure; when and how headcount changes is the client's operating decision. Capability is met; implementation is a matter of pacing. Figures describe BCGame's results since the June 2026 launch and will move as the system iterates week by week.",
        divider: false,
      },
    ],
  },
  impact: {
    eyebrow: "Overall Impact · Resolution",
    titleAccent: "Resolution At Scale:",
    titleRest: "How AI Absorbs 200K Conversations",
    intro:
      "For support and business leads. How the 55% auto-handling rate and 70% reply rate are defined, where they come from, and why they are a boundary the team chose rather than a technical ceiling.",
    light: [
      {
        icon: Gauge,
        title: "How Resolution Is Measured",
        body: "Two independent metrics are tracked. The AI auto-handling rate — 55% — is the share of conversations completed entirely by AI with no human agent in the thread. The AI reply rate — 70% — is the share of customer messages answered by AI, including turns inside conversations that later escalate. At the current monthly volume that is about 110K conversations handled independently every month. Both figures were zero before launch; nothing here is smoothed, weighted, or inherited from earlier automation.",
        divider: true,
      },
      {
        icon: ChartPie,
        title: "Traffic Composition Across 200K Conversations",
        body: "Monthly inbound sits at roughly 200K conversations with concurrency holding at QPS 20–50 — a genuinely high-volume production load that tests stability, precision and absorption capacity. The mix is dominated by order tracking, payment and withdrawal status, promotion rules and account verification: repetitive intents with stable resolution paths, which is why they are absorbed first. Disputes, risk review, VIP negotiation and anything needing a policy exception are routed to people by design and excluded from the AI target rather than counted as failures.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: Headset,
        title: "Escalation And Fallback Behaviour",
        body: "The handover policy is explicit. Anything beyond the current knowledge boundary, or involving a high-risk judgement, goes to a human — every time. VIP conversations keep a human in the loop by default. Handover carries the full context so the agent never restarts the exchange. Human-likeness is engineered rather than prompted: the target market's slang, abbreviations and scenario-specific phrasing are configured into the response layer, so most customers cannot tell they are talking to a system.",
        divider: true,
      },
      {
        icon: ClipboardCheck,
        title: "Baseline And Clarifications",
        body: "Both metrics were zero before launch, so today's figures are net new absorption, not a migration of existing automation. 55% and 70% describe stable capacity within the range the system is confident about — not a technical maximum. Holding this level at 200K conversations a month is what makes the workforce restructuring in the previous article possible: it changes the staffing logic of the whole team, not the fate of individual agents. Why the rate is 55% rather than a forced 95% is covered under Technology → Zero Hallucinations. All numbers are a snapshot of the current observation cycle and will change as the system iterates weekly.",
        divider: false,
      },
    ],
  },
};

/* ------------------------------------------------------------------ page */

function KpiColumn({
  data,
  className,
  style,
  selected,
  onSelect,
}: {
  data: typeof KPI_LEFT;
  className?: string;
  style?: React.CSSProperties;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      role="tab"
      tabIndex={0}
      aria-selected={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`cursor-pointer transition-colors duration-300 ${className ?? ""}`}
      style={{
        background: selected ? "#FFFFFF" : "transparent",
        opacity: selected ? 1 : 0.62,
        ...style,
      }}
    >
      <p
        className="text-ink"
        style={{
          fontSize: 14,
          lineHeight: "22px",
          letterSpacing: "0.01em",
          fontWeight: 400,
          margin: 0,
        }}
      >
        {data.kicker}
      </p>


      <p
        className="font-display text-ink"
        style={{
          margin: "20px 0 0",
          fontSize: fluid(100, 48),
          lineHeight: 1.2,
          fontWeight: 400,
          letterSpacing: "-0.01em",
        }}
      >
        <RollingNumber key={data.value} value={data.value} />
        <span
          style={{ fontSize: fluid(40, 22), color: "var(--ink-ghost, #C7C6CD)", marginLeft: 6 }}
        >
          {data.unit}
        </span>
      </p>
      <p
        style={{
          margin: "8px 0 0",
          fontSize: 14,
          lineHeight: "24px",
          color: "var(--ink-faint, #A1A0A9)",
        }}

      >
        {data.caption}
      </p>

      <div style={{ margin: `${fluid(40, 28)} 0 ${fluid(40, 28)}` }}>
        <Hairline dashed />
      </div>

      <ul className="flex flex-col gap-6">
        {data.bullets.map((b, i) => (
          <li key={b} className="flex items-start gap-2">
            <Bullet diamond={i % 2 === 0} />
            <span className="text-ink" style={{ fontSize: 14, lineHeight: "22px" }}>
              {b}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArticleBlock({
  icon: Icon,
  title,
  body,
  divider,
  dark,
  delay = 0,
  duration,
}: {
  icon: LucideIcon;
  title: string;
  body: string | BodySegment[];
  divider: boolean;
  dark?: boolean;
  delay?: number;
  duration?: number;
}) {
  const bodyEl = Array.isArray(body) ? (
    body.map((seg, i) => (
      <span
        key={i}
        style={seg.highlight ? { color: "var(--ink, #0E0B22)" } : undefined}
      >
        {seg.text}
      </span>
    ))
  ) : (
    body
  );
  return (
    <Reveal delay={delay} y={20} duration={duration}>
      <Icon size={24} strokeWidth={1.5} color={dark ? "#FFFFFF" : "#0E0B22"} />
      <h3
        style={{
          margin: "10px 0 0",
          fontSize: 18,
          lineHeight: "26px",
          fontWeight: 500,
          color: dark ? "#FFFFFF" : "var(--ink, #0E0B22)",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: "20px 0 0",
          maxWidth: 1000,
          fontSize: 14,
          lineHeight: "22px",
          color: dark ? "rgba(255,255,255,0.5)" : "var(--ink-muted, #7A7885)",
        }}
      >
        {bodyEl}
      </p>
      {divider ? (
        <div style={{ marginTop: fluid(60, 36) }}>
          <Hairline dark={dark} dashed />
        </div>
      ) : null}
    </Reveal>
  );
}

function BusinessImpactPage() {
  const pad = `0 ${fluid(120, 24)}`;
  const [tab, setTab] = useState<"roi" | "impact">("roi");
  const article = ARTICLES[tab];

  return (
    <div className="relative min-h-screen bg-paper">
      <SiteNav revealDelay={0} />

      {/* ------------------------------------------------------------ hero */}
      <header className="relative overflow-hidden">
        {/* single halftone hand — bleeds off the right viewport edge */}
        <HalftoneHandStill
          cropX={0.5}
          cropW={0.5}
          cropY={0.32}
          cropH={0.52}
          pitch={6}
          className="pointer-events-none absolute select-none"
          style={{
            top: fluid(115, 66),
            left: fluid(780, 420),
            width: fluid(741, 400),
            height: fluid(425, 230),
          }}
        />

        <div style={{ padding: pad }}>
          <div className="relative mx-auto w-full max-w-[1200px]">
            <div
              className="relative z-10"
              style={{ maxWidth: 680, paddingTop: fluid(162, 104), paddingBottom: fluid(172, 100) }}
            >
              <Reveal immediate className="flex items-center gap-2">
                <span aria-hidden style={{ width: 8, height: 8, background: ACCENT }} />
                <span
                  style={{
                    fontSize: 14,
                    lineHeight: "22px",
                    letterSpacing: "0.01em",
                    color: "#7A7885",
                  }}
                >
                  Impact
                </span>
              </Reveal>

              <Reveal immediate delay={120}>
                <GradientHoverHeading
                  as="h1"
                  className="font-display text-ink"
                  text={"From AI Support To\nMeasurable Business Value"}
                  style={{
                    margin: "10px 0 0",
                    fontSize: fluid(48, 30),
                    lineHeight: 1.1667,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    cursor: "default",
                  }}
                />
              </Reveal>


              <Reveal immediate delay={240}>
                <p
                  style={{
                    margin: "10px 0 0",
                    maxWidth: 563,
                    fontSize: 16,
                    lineHeight: "24px",
                    color: "var(--ink-muted, #7A7885)",
                  }}
                >
                  BCGame, an iGaming platform serving 22 languages: 55% of 200K monthly conversations
                  closed by AI at QPS 20–50, with a clear path to lower operating costs.
                </p>
              </Reveal>

              <Reveal immediate delay={360} style={{ marginTop: fluid(40, 28) }}>
                <RainbowButton label="Book a Demo" />
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ KPIs */}
      <section style={{ padding: pad }} role="tablist" aria-label="Business impact metrics">
        <Reveal className="mx-auto w-full max-w-[1200px]">
          {/* section rule: brand gradient over the selected half, hairline after */}
          <div aria-hidden className="flex" style={{ height: 1.5 }}>
            <div className="relative" style={{ width: "50%", background: "#ECEBEF" }}>
              {tab === "roi" && (
                <span
                  key="rule-roi"
                  className="kpi-rule-active absolute left-0 top-0"
                  style={{ height: 1.5, maxWidth: "100%", width: 120 }}
                />
              )}
            </div>
            <div className="relative flex-1" style={{ background: "#ECEBEF" }}>
              {tab === "impact" && (
                <span
                  key="rule-impact"
                  className="kpi-rule-active absolute left-0 top-0"
                  style={{ height: 1.5, maxWidth: "100%", width: 120 }}
                />
              )}
            </div>
          </div>



          <div className="grid md:grid-cols-2">
            <KpiColumn
              data={KPI_LEFT}
              selected={tab === "roi"}
              onSelect={() => setTab("roi")}
              style={{
                paddingRight: fluid(60, 0),
                paddingLeft: fluid(60, 0),
                paddingTop: fluid(48, 32),
                paddingBottom: fluid(60, 36),
              }}
            />
            <KpiColumn
              data={KPI_RIGHT}
              selected={tab === "impact"}
              onSelect={() => setTab("impact")}
              style={{
                paddingLeft: fluid(52, 0),
                paddingRight: fluid(52, 0),
                paddingTop: fluid(48, 32),
                paddingBottom: fluid(60, 36),
                borderLeft: "1px solid var(--hairline, #E1E0E4)",
              }}
              className="md:border-l"
            />
          </div>

          {/* closing hairline under the KPI block */}
          <div aria-hidden style={{ height: 1, background: "var(--hairline, #E1E0E4)" }} />

        </Reveal>
      </section>


      {/* -------------------------------------------------------- article */}
      <section style={{ padding: pad, marginTop: 0 }}>
        <Reveal key={tab} y={32} duration={1600} className="mx-auto w-full max-w-[1200px] overflow-hidden bg-white">
          {/* card header */}
          <div style={{ padding: `${fluid(60, 32)} ${fluid(60, 24)} 0` }}>
            <p
              style={{
                fontSize: 12,
                lineHeight: "20px",
                margin: 0,
                color: "var(--ink, #0E0B22)",
              }}
            >
              {article.eyebrow}
            </p>
            <div style={{ marginTop: 10 }}>
              <Hairline />
            </div>

            <div
              className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between"
              style={{ marginTop: fluid(24, 18), columnGap: fluid(72, 40) }}
            >
              <div style={{ maxWidth: 760, minWidth: 0 }}>
                <h2
                  className="font-display"
                  style={{
                    margin: 0,
                    fontSize: fluid(48, 30),
                    lineHeight: "56px",
                    fontWeight: 400,

                    letterSpacing: "-0.01em",
                  }}
                >
                  <span style={{ color: "#9E8CFF" }}>{article.titleAccent}</span>{" "}
                  <span className="text-ink">{article.titleRest}</span>
                </h2>
                <p
                  style={{
                    margin: "20px 0 0",
                    maxWidth: 800,
                    fontSize: 13,
                    lineHeight: "20px",
                    color: "var(--ink-muted, #7A7885)",
                  }}
                >
                  {article.intro}
                </p>
              </div>

              <div className="shrink-0">
                <button
                  style={{
                    background: "#0E0B22",
                    borderBottom: "1.5px solid #137DFF",
                    borderRadius: 0,
                    height: 36,
                    padding: "0 24px",
                    fontSize: 12,
                    lineHeight: "20px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                >
                  Book a Demo
                </button>
              </div>
            </div>
          </div>

          {/* dark block — full-bleed inside the card */}
          <div
            data-dark-section
            style={{
              background: "#000000",
              padding: `${fluid(80, 44)} ${fluid(60, 24)}`,
              display: "flex",
              flexDirection: "column",
              gap: fluid(60, 36),
              marginTop: fluid(80, 44),
            }}
          >
            {article.dark.map((b, i) => (
              <ArticleBlock key={b.title} {...b} dark delay={i * 260} duration={1600} />
            ))}
          </div>

          {/* light blocks */}
          <div
            style={{
              padding: `${fluid(80, 44)} ${fluid(60, 24)} ${fluid(80, 44)}`,
            }}
          >
            <div className="flex flex-col" style={{ gap: fluid(60, 36) }}>
              {article.light.map((b, i) => (
                <ArticleBlock key={b.title} {...b} delay={i * 260} duration={1600} />
              ))}
            </div>
          </div>

        </Reveal>
      </section>

      {/* CTA + brand footer, shared with the homepage */}
      <SiteFooter />

      <FinChatDock alwaysVisible />
    </div>
  );
}

export default BusinessImpactPage;
