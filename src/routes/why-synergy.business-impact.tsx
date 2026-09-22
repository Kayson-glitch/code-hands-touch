import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Coins, ChartPie, ClipboardCheck, Gauge, Headset, TrendingDown, Users } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { whyImpactAsset } from "@/lib/media";
import { HalftoneHandStill } from "@/components/HalftoneHandStill";
import { WHY_HERO_ART, whyHeroArtMask } from "@/lib/whyHeroArt";
import { Reveal } from "@/components/Reveal";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { fluid } from "@/lib/fluid";
import { RainbowButton } from "@/components/RainbowButton";
import { BeforeAfter, PullQuote, StatFigure } from "@/components/WhyFigures";
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
  const color = dark ? "rgba(255,255,255,0.18)" : "var(--surface-inset, #F1F1F3)";
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
};
/** What fills the figure slot beside a text block (Figma 1551:20323 image slots). */
type Figure =
  | { kind: "stat"; value: string; unit?: string; caption: string }
  | { kind: "compare"; before: string; after: string; beforeLabel: string; afterLabel: string }
  | { kind: "quote"; text: string };
type ArticleRow = { block: ArticleBlockData; figure: Figure };
type ArticleSet = {
  eyebrow: string;
  titleAccent: string;
  titleRest: string;
  intro: string;
  /** Checkerboard rows: text and figure swap sides on every row. */
  rows: ArticleRow[];
};

const ARTICLES: Record<"roi" | "impact", ArticleSet> = {
  roi: {
    eyebrow: "Business Value · ROI",
    titleAccent: "Scaling Support Smarter:",
    titleRest: "Cost Analysis from 150 to 50 Agents",
    intro:
      "For the people who sign the budget. BCGame's 150-agent support team costs about $1.5M a month; this article quantifies how the AI system changes that structure and what the data already supports.",
    rows: [
      {
        block: {
          icon: Coins,
          title: "Analysis of Current Cost Structure",
          body: [
            { text: "Within the existing agent structure, the vast majority of labour hours are consumed by high-repetition, low-judgement inquiries: order tracking, payment progress, promotion rules, withdrawal status checks. These dominate inbound volume but need almost no human judgement. " },
            { text: "During promotional cycles", highlight: true },
            { text: ", inbound volume multiplies and the team typically copes with temporary hires. Marginal labour cost rises, training cycles stretch, and service quality becomes uneven. The marginal efficiency between labour input and service output keeps falling." },
          ],
        },
        figure: {
          kind: "stat",
          value: "150",
          unit: "agents",
          caption: "Today's support team · about $1.5M a month in labour cost, most of it on repetitive inquiries",
        },
      },
      {
        block: {
          icon: Users,
          title: "Target Structure: Reallocating Agent Functions",
          body: [
            { text: "After integration, based on business data from the current observation cycle, the CS team can be optimised to about 50 agents: 20 VIP agents (supervisor-level, dedicated to high-value customers) and 30 general agents. Crucially, the 30 general agents move from front-line Q&A to online data monitoring, anomaly handling and human fallback. " },
            { text: "This 30-agent headcount is a conservative configuration,", highlight: true },
            { text: " keeping redundancy for sudden load surges. Under this structure the AI system absorbs standardised work, while people concentrate on high-judgement, high-value workflows." },
          ],
        },
        figure: {
          kind: "compare",
          before: "150",
          after: "50",
          beforeLabel: "Agents today",
          afterLabel: "Target: 20 VIP + 30 monitoring",
        },
      },
      {
        block: {
          icon: TrendingDown,
          title: "Cost Impact Projection",
          body: "Under the target structure the team shrinks by roughly 50%, which translates to about $1M a month and roughly $12M a year in labour cost. This is not cost reduction at the expense of service quality: VIP customers are served by dedicated agents, strengthening continuity and response quality, while general agents move into monitoring roles and the whole team shifts from a scale-driven to an efficiency-driven model.",
        },
        figure: {
          kind: "stat",
          value: "$12M",
          unit: "/ yr",
          caption: "Projected labour saving at the target structure · about $1M a month",
        },
      },
      {
        block: {
          icon: ClipboardCheck,
          title: "Conclusion and Clarifications",
          body: "This projection is based on the AI system's actual absorption capacity during the current observation cycle — it describes the optimisation space the data supports; the organisational adjustment itself has not been executed. The system's capacity already meets the level required for this structure; when and how headcount changes is the client's operating decision. Capability is met; implementation is a matter of pacing. Figures describe BCGame's results since the June 2026 launch and will move as the system iterates week by week.",
        },
        figure: {
          kind: "quote",
          text: "Capability is met; implementation is a matter of pacing.",
        },
      },
    ],
  },
  impact: {
    eyebrow: "Overall Impact · Resolution",
    titleAccent: "Resolution at Scale:",
    titleRest: "How AI Absorbs 200K Conversations",
    intro:
      "For support and business leads. How the 55% auto-handling rate and 70% reply rate are defined, where they come from, and why they are a boundary the team chose rather than a technical ceiling.",
    rows: [
      {
        block: {
          icon: Gauge,
          title: "How Resolution Is Measured",
          body: "Two independent metrics are tracked. The AI auto-handling rate — 55% — is the share of conversations completed entirely by AI with no human agent in the thread. The AI reply rate — 70% — is the share of customer messages answered by AI, including turns inside conversations that later escalate. At the current monthly volume that is about 110K conversations handled independently every month. Both figures were zero before launch; nothing here is smoothed, weighted, or inherited from earlier automation.",
        },
        figure: {
          kind: "stat",
          value: "55",
          unit: "%",
          caption: "Auto-handling rate — conversations closed entirely by AI · reply rate 70% of all messages",
        },
      },
      {
        block: {
          icon: ChartPie,
          title: "Traffic Composition Across 200K Conversations",
          body: "Monthly inbound sits at roughly 200K conversations with concurrency holding at QPS 20–50 — a genuinely high-volume production load that tests stability, precision and absorption capacity. The mix is dominated by order tracking, payment and withdrawal status, promotion rules and account verification: repetitive intents with stable resolution paths, which is why they are absorbed first. Disputes, risk review, VIP negotiation and anything needing a policy exception are routed to people by design and excluded from the AI target rather than counted as failures.",
        },
        figure: {
          kind: "stat",
          value: "200K",
          unit: "/ mo",
          caption: "Inbound conversations a month at QPS 20–50 · about 110K of them handled by AI alone",
        },
      },
      {
        block: {
          icon: Headset,
          title: "Escalation and Fallback Behaviour",
          body: "The handover policy is explicit. Anything beyond the current knowledge boundary, or involving a high-risk judgement, goes to a human — every time. VIP conversations keep a human in the loop by default. Handover carries the full context so the agent never restarts the exchange. Human-likeness is engineered rather than prompted: the target market's slang, abbreviations and scenario-specific phrasing are configured into the response layer, so most customers cannot tell they are talking to a system.",
        },
        figure: {
          kind: "quote",
          text: "Beyond the knowledge boundary, or any high-risk judgement: a human — every time.",
        },
      },
      {
        block: {
          icon: ClipboardCheck,
          title: "Baseline and Clarifications",
          body: "Both metrics were zero before launch, so today's figures are net new absorption, not a migration of existing automation. 55% and 70% describe stable capacity within the range the system is confident about — not a technical maximum. Holding this level at 200K conversations a month is what makes the workforce restructuring in the previous article possible: it changes the staffing logic of the whole team, not the fate of individual agents. Why the rate is 55% rather than a forced 95% is covered under Technology → Zero Hallucinations. All numbers are a snapshot of the current observation cycle and will change as the system iterates weekly.",
        },
        figure: {
          kind: "compare",
          before: "0%",
          after: "55%",
          beforeLabel: "Before the June 2026 launch",
          afterLabel: "Current cycle · not a ceiling",
        },
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
  divider = false,
  dark,
  delay = 0,
  duration,
}: {
  icon: LucideIcon;
  title: string;
  body: string | BodySegment[];
  divider?: boolean;
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

/** Figure slot beside a text block — the design's 480×260 image box, filled
 *  with a figure drawn from the block's own numbers. */
function FigureSlot({ figure }: { figure: Figure }) {
  return (
    <div
      className="flex h-full w-full flex-col justify-center"
      style={{
        minHeight: fluid(260, 200),
        padding: `${fluid(32, 24)} ${fluid(36, 24)}`,
        background: "var(--surface-soft, #F7F7F8)",
      }}
    >
      {figure.kind === "stat" ? (
        <StatFigure value={figure.value} unit={figure.unit} caption={figure.caption} />
      ) : figure.kind === "compare" ? (
        <BeforeAfter
          before={figure.before}
          after={figure.after}
          beforeLabel={figure.beforeLabel}
          afterLabel={figure.afterLabel}
          accent={ACCENT}
          plain
        />
      ) : (
        <PullQuote text={figure.text} accent={ACCENT} />
      )}
    </div>
  );
}

/**
 * Article body — Figma 1551:20323: rows of text + figure that swap sides on
 * every row, dashed rules between rows, a dashed centre line, and a small
 * square where they cross. Below md the rows stack: text, then figure.
 */
/** Figma's 4/4 dash — browsers' `dashed` keyword picks its own rhythm, so draw it. */
const DASH_X = "repeating-linear-gradient(90deg, #E1E0E4 0 4px, transparent 4px 8px)";
const DASH_Y = "repeating-linear-gradient(180deg, #E1E0E4 0 4px, transparent 4px 8px)";

function ArticleRows({ rows }: { rows: ArticleRow[] }) {
  const cell = `${fluid(60, 32)} ${fluid(60, 24)}`;
  return (
    <div className="relative" style={{ borderTop: "1px solid #F1F1F3", borderBottom: "1px solid #F1F1F3" }}>
      {/* centre line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 hidden md:block"
        style={{ left: "calc(50% - 0.5px)", width: 1, backgroundImage: DASH_Y }}
      />
      {rows.map((row, i) => {
        const flip = i % 2 === 1;
        return (
          <div key={row.block.title} className="relative grid md:grid-cols-2">
            {i > 0 ? (
              <>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0"
                  style={{ height: 1, backgroundImage: DASH_X }}
                />
                {/* crossing marker — same 6px white square as the Platform frame */}
                <span
                  aria-hidden
                  className="absolute left-1/2 hidden md:block"
                  style={{
                    // the 1px rules are centred at 0.5px; sit the square on those centres
                    top: -2.5,
                    width: 6,
                    height: 6,
                    transform: "translateX(-50%)",
                    background: "#FFFFFF",
                    border: "1px solid #E1E0E4",
                  }}
                />
              </>
            ) : null}

            <div className={flip ? "md:order-2" : ""} style={{ padding: cell }}>
              <ArticleBlock {...row.block} duration={1600} />
            </div>
            <div className={flip ? "md:order-1" : ""} style={{ padding: cell }}>
              <Reveal y={20} duration={1600} delay={120} className="h-full">
                <FigureSlot figure={row.figure} />
              </Reveal>
            </div>
          </div>
        );
      })}
    </div>
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
          src={whyImpactAsset.url}
          contrast={1.25}
          cropX={0.166}
          cropW={0.834}
          cropY={0.095}
          cropH={0.85}
          className="pointer-events-none absolute hidden select-none lg:block"
          style={{ ...whyHeroArtMask(), ...WHY_HERO_ART }}
        />

        <div style={{ padding: pad }}>
          <div className="relative mx-auto w-full max-w-[1200px]">
            <div
              className="why-hero-copy relative z-10"
              style={{ paddingTop: fluid(160, 104), paddingBottom: fluid(172, 100) }}
            >
              <Reveal immediate className="flex items-center gap-2">
                <span aria-hidden style={{ width: 8, height: 8, background: ACCENT }} />
                <span
                  className="uppercase"
                  style={{ fontSize: 14, lineHeight: "22px", color: "#7A7885" }}
                >
                  impact
                </span>
              </Reveal>

              <Reveal immediate delay={120}>
                <GradientHoverHeading
                  as="h1"
                  className="font-display text-ink"
                  text={"From AI Support\nto Measurable\nBusiness Value"}
                  breakFrom="md"
                  style={{
                    margin: "10px 0 0",
                    fontSize: fluid(60, 36),
                    lineHeight: 1.1,
                    fontWeight: 400,
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

          {/* The article card's own top border closes this block — a rule here
              too would stack two hairlines into one heavy 2px line, and pull
              apart into two while the reveals are still travelling. */}
        </Reveal>
      </section>


      {/* -------------------------------------------------------- article */}
      <section style={{ padding: pad, marginTop: 0 }}>
        <Reveal
          key={tab}
          y={32}
          duration={1600}
          className="mx-auto w-full max-w-[1200px] overflow-hidden bg-white"
        >
          {/* module top hairline — the rule that opens every article module;
              the other three modules are open on their other three sides too */}
          <Hairline />

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
                    lineHeight: "1.1667",
                    fontWeight: 400,
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
                <RainbowButton label="Book a Demo" />
              </div>
            </div>
          </div>

          {/* body — checkerboard of text + figure rows */}
          <div style={{ padding: `${fluid(80, 44)} ${fluid(60, 24)} ${fluid(60, 32)}` }}>
            <ArticleRows rows={article.rows} />
          </div>

        </Reveal>
      </section>

      {/* CTA + brand footer, shared with the homepage */}
      <SiteFooter />

      <FinChatDock alwaysVisible />
    </div>
  );
}
