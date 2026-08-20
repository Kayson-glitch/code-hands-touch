import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquareCode, Map as MapIcon } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { HalftoneHandStill } from "@/components/HalftoneHandStill";
import { Reveal } from "@/components/Reveal";
import { FinChatDock } from "@/components/FinChatDock";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

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
      className="group relative inline-flex shrink-0 cursor-pointer items-center justify-center font-medium transition-all"
      style={{
        height: lg ? 40 : 36,
        fontSize: lg ? 14 : 13,
        lineHeight: "20px",
        fontWeight: 500,
        padding: lg ? "0 24px" : "0 22px",
        borderRadius: 8,
        border: "0.125rem solid transparent",
        color: "#FFFFFF",
        backgroundImage: [
          `linear-gradient(${face},${face})`,
          `linear-gradient(${face} 50%, rgba(${faceRgb},0.6) 80%, rgba(${faceRgb},0))`,
          GRADIENT,
        ].join(","),
        backgroundClip: "padding-box, border-box, border-box",
        backgroundOrigin: "border-box",
        backgroundSize: "200%",
        animation: "rainbow-btn-flow var(--rainbow-speed, 9s) infinite linear",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "-20%",
          zIndex: 0,
          height: "20%",
          width: "60%",
          backgroundImage: GRADIENT,
          backgroundSize: "200%",
          filter: "blur(0.75rem)",
          animation: "rainbow-btn-flow var(--rainbow-speed, 9s) infinite linear",
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-0">
        {label}
        <span className="inline-flex max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:ml-1.5 group-hover:max-w-[20px] group-hover:opacity-100">
          <ArrowRight size={16} strokeWidth={2} className="relative -top-px flex-shrink-0" />
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
  const color = dark ? "rgba(255,255,255,0.18)" : "#DEDDE2";
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
  caption: "Estimated cost optimization potential",
  bullets: [
    "Current setup: 150 agents, costing RMB 1.5M/month",
    "50 is sufficient: 20 VIP leads + 30 support staff",
    "From repetitive replies to high value service",
    "Capability precedes organizational rollout",
  ],
};

const KPI_RIGHT = {
  kicker: "Overall Impact",
  value: "75",
  unit: "%",
  caption: "AI resolution rate across 200K conversations/month",
  bullets: [
    "AI resolves 55% of conversations end-to-end",
    "AI handles 70% of messages, around 110K/month",
    "Both metrics were zero before launch",
    "No inflated metrics: human agent intervenes when necessary",
  ],
};

type ArticleSet = {
  eyebrow: string;
  titleAccent: string;
  titleRest: string;
  intro: string;
  light: Array<{ icon: typeof MapIcon; title: string; body: string; divider: boolean }>;
  dark: Array<{ icon: typeof MapIcon; title: string; body: string; divider: boolean }>;
};

const ARTICLES: Record<"roi" | "impact", ArticleSet> = {
  roi: {
    eyebrow: "Business Value · ROI",
    titleAccent: "Scaling Support Smarter:",
    titleRest: "Cost Analysis From 150 To 50 Agents",
    intro:
      "This article quantifies the impact of integrating an AI Customer Service system on operational costs, using the current CS workforce structure as the subject. The current global CS team consists of 150 agents, with a comprehensive per-capita cost.",
    light: [
      {
        icon: MessageSquareCode,
        title: "Analysis of Current Cost Structure",
        body: "Within the existing agent structure, the vast majority of labor hours are consumed by high-repetition, low-decision-density inquiries, such as order tracking, payment status checks, promotional rule explanations, and withdrawal verifications. These tasks dominate the inbound volume but require minimal human judgment. During promotional cycles, inbound volume spikes exponentially, and the team typically relies on temporary hiring to cope. This leads to rising marginal labor costs, extended training cycles, and widening variances in service quality. The marginal efficiency between labor input and service output continues to diminish.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Target Structure: Reallocating Agent Functions",
        body: "Post-integration, based on business data from the current observation cycle, the CS team is well-positioned to be optimized down to approximately 50 agents. The target structure consists of 20 VIP agents (supervisor-level, dedicated to high-value client services) and 30 general agents. Crucially, the function of the 30 general agents will shift from frontline Q&A to online data monitoring, anomaly handling, and human fallback support. This 30-agent headcount is a conservative configuration, retaining redundancy to handle sudden load surges. Under this structure, the AI system absorbs standardized tasks, while human resources are concentrated on high-decision-density and high-value workflows.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: MessageSquareCode,
        title: "Cost Impact Projection",
        body: "Under the target structure, the team size is optimized by roughly 50%, translating to a monthly labor cost savings of about 1 million RMB, and an annual savings of roughly 12 million RMB. It is important to emphasize that this structure does not achieve cost reduction at the expense of service quality: VIP clients are served by dedicated agents, reinforcing service continuity and response quality; meanwhile, as general agents pivot to monitoring roles, the entire team shifts from a scale-driven model to an efficiency-driven one.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Conclusion and Clarifications",
        body: "This projection is based on the actual absorption capacity of the AI system during the current observation cycle, reflecting the achievable optimization space supported by data; the organizational labor adjustments have not yet been executed. The system's capacity has already reached the level required to support the aforementioned structure. The actual implementation of workforce adjustments falls under the client's operational decision-making, and the timing is at their discretion. Capabilities are met; implementation is merely a matter of pacing.",
        divider: false,
      },
    ],
  },
  impact: {
    eyebrow: "Overall Impact · Resolution",
    titleAccent: "Resolution At Scale:",
    titleRest: "How AI Absorbs 200K Conversations A Month",
    intro:
      "This article breaks down where the 75% figure comes from, separating conversation-level resolution from message-level handling, and explains how the system decides when a human agent should take over.",
    light: [
      {
        icon: MessageSquareCode,
        title: "How Resolution Is Measured",
        body: "Resolution is counted at two independent levels. At the conversation level, a session is marked resolved only when the AI closes the request end-to-end with no human agent message in the thread and no reopen within the following 48 hours; this currently covers 55% of all sessions. At the message level, the system handles roughly 70% of inbound messages, about 110K per month, including the turns inside conversations that later escalate. Neither number is smoothed or weighted: sessions that end in silence are treated as unresolved rather than assumed successful.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Traffic Composition Across 200K Conversations",
        body: "Monthly inbound volume sits at approximately 200K conversations, dominated by order tracking, payment and withdrawal status, promotional rule questions, and account verification. These intents are highly repetitive and have stable resolution paths, which is why they absorb first. The remaining volume — disputes, risk review, VIP negotiation, and anything requiring a policy exception — is intentionally routed to humans, and is excluded from the AI resolution target rather than counted as a failure.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: MessageSquareCode,
        title: "Escalation And Fallback Behaviour",
        body: "The system escalates on low confidence, repeated user rephrasing, detected frustration, or any request that would change a balance or account state without an existing rule. Handover carries the full conversation context, so the human agent does not restart the exchange. Median first response stays under a few seconds for AI-handled turns, and escalated sessions inherit the queue priority of the original intent, which keeps the perceived service level intact even when the AI steps back.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Baseline And Clarifications",
        body: "Both metrics were zero before launch: there was no automated coverage of any kind, so the current figures represent net new absorption rather than a migration of existing automation. The numbers reflect the current observation cycle and will shift as intent coverage expands. No metric here is inflated by counting deflected or abandoned sessions as resolved; a human agent intervenes whenever the request exceeds the system's authority.",
        divider: false,
      },
    ],
  },
};

const FOOTER_COLUMNS = [
  { title: "Why Synergy", links: ["Platform", "Pricing", "Book a Demo"] },
  { title: "Platform", links: ["Features", "Pricing", "Integrations"] },
  { title: "Section", links: ["Events", "Blog"] },
  { title: "Company", links: ["About us", "Contact us"] },
];

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
        style={{
          fontSize: 14,
          lineHeight: "22px",
          letterSpacing: "0.01em",
          margin: 0,
          color: "var(--ink-faint, #A1A0A9)",
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
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        {data.value}
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
          color: "var(--ink-muted, #7A7885)",
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
  icon: typeof MapIcon;
  title: string;
  body: string;
  divider: boolean;
  dark?: boolean;
  delay?: number;
  duration?: number;
}) {
  return (
    <Reveal delay={delay} y={20} duration={duration}>
      <Icon size={24} strokeWidth={1.5} color={dark ? "#FFFFFF" : "#0E0B22"} />
      <h3
        className="font-display"
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
          fontSize: 13,
          lineHeight: "22px",
          color: dark ? "rgba(255,255,255,0.58)" : "var(--ink-muted, #7A7885)",
        }}
      >
        {body}
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
              style={{ maxWidth: 680, paddingTop: fluid(162, 104), paddingBottom: fluid(102, 60) }}
            >
              <Reveal immediate className="flex items-center gap-2">
                <span aria-hidden style={{ width: 8, height: 8, background: ACCENT }} />
                <span
                  style={{
                    fontSize: 14,
                    lineHeight: "22px",
                    letterSpacing: "0.01em",
                    color: "var(--ink-faint, #A1A0A9)",
                  }}
                >
                  Impact
                </span>
              </Reveal>

              <Reveal immediate delay={120}>
                <h1
                  className="font-display text-ink"
                  style={{
                    margin: "10px 0 0",
                    fontSize: fluid(48, 30),
                    lineHeight: 1.1667,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                  }}
                >
                  From AI Support To
                  <br />
                  Measurable Business Value
                </h1>
              </Reveal>

              <Reveal immediate delay={240}>
                <p
                  style={{
                    margin: "10px 0 0",
                    maxWidth: 563,
                    fontSize: 14,
                    lineHeight: "24px",
                    color: "var(--ink-muted, #7A7885)",
                  }}
                >
                  Resolving 55% of conversations across 200K monthly inquiries, with a clear path to
                  lower operating costs.
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
          <div aria-hidden className="flex" style={{ height: 1 }}>
            <div className="relative" style={{ width: "50%", background: "#ECEBEF" }}>
              {tab === "roi" && (
                <span
                  key="rule-roi"
                  className="kpi-rule-active absolute left-0 top-0"
                  style={{ height: 1, maxWidth: "100%", width: 120 }}
                />
              )}
            </div>
            <div className="relative flex-1" style={{ background: "#ECEBEF" }}>
              {tab === "impact" && (
                <span
                  key="rule-impact"
                  className="kpi-rule-active absolute left-0 top-0"
                  style={{ height: 1, maxWidth: "100%", width: 120 }}
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
        </Reveal>
      </section>


      {/* -------------------------------------------------------- article */}
      <section style={{ padding: pad, marginTop: 0 }}>
        <Reveal key={tab} y={32} duration={1600} className="mx-auto w-full max-w-[1200px] overflow-hidden bg-white">
          <div style={{ padding: `${fluid(60, 32)} ${fluid(60, 24)} 0` }}>
            {/* card header */}
            <p
              style={{
                fontSize: 14,
                lineHeight: "20px",
                margin: 0,
                color: "var(--ink-muted, #7A7885)",
              }}
            >
              {article.eyebrow}
            </p>
            <div style={{ marginTop: 10 }}>
              <Hairline />
            </div>

            <div
              className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between"
              style={{ marginTop: fluid(24, 18) }}
            >
              <div style={{ maxWidth: 800 }}>
                <h2
                  className="font-display"
                  style={{
                    margin: 0,
                    fontSize: fluid(40, 26),
                    lineHeight: 1.4,
                    fontWeight: 500,
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
                <RainbowButton label="Book a Demo" size="sm" />
              </div>
            </div>

            {/* light blocks */}
            <div
              className="flex flex-col"
              style={{ gap: fluid(60, 36), marginTop: fluid(80, 44), paddingBottom: fluid(80, 44) }}
            >
              {article.light.map((b, i) => (
                <ArticleBlock key={b.title} {...b} delay={i * 260} duration={1600} />
              ))}
            </div>
          </div>

          {/* dark inner block — full-bleed inside the card */}
          <div
            data-dark-section
            style={{
              background: "#050505",
              padding: `${fluid(60, 32)} ${fluid(60, 24)}`,
              display: "flex",
              flexDirection: "column",
              gap: fluid(60, 36),
            }}
          >
            {article.dark.map((b, i) => (
              <ArticleBlock key={b.title} {...b} dark delay={i * 260} duration={1600} />
            ))}
          </div>

        </Reveal>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden" style={{ padding: `${fluid(160, 80)} 0` }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(14,11,34,0.16) 1px, transparent 1px)",
            backgroundSize: "20px 21px",
            maskImage:
              "radial-gradient(120% 80% at 50% 50%, #000 25%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(120% 80% at 50% 50%, #000 25%, transparent 78%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-[800px] flex-col items-center px-6 text-center">
          <Reveal>
            <h2
              className="font-display"
              style={{ margin: 0, fontSize: fluid(40, 26), lineHeight: 1.4, fontWeight: 500 }}
            >
              <span className="text-ink-ghost">Get started with the</span>
              <br />
              <span className="text-ink">Synergy.AI today</span>
            </h2>
          </Reveal>
          <Reveal delay={150} style={{ marginTop: fluid(40, 28) }}>
            <RainbowButton label="Book a Demo" />
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- footer */}
      <footer data-dark-section className="relative overflow-hidden" style={{ background: "#0A0A0A" }}>
        <div aria-hidden style={{ height: 3, backgroundImage: GRADIENT, backgroundSize: "200%" }} />

        {/* header row */}
        <div style={{ padding: pad }}>
          <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundImage: GRADIENT,
                  backgroundSize: "200%",
                }}
              />
              <span
                className="font-display"
                style={{ color: "#FFFFFF", fontSize: 16, lineHeight: "24px", fontWeight: 500 }}
              >
                Synergy.AI
              </span>
            </div>
            <span
              className="hidden md:block"
              style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: "20px" }}
            >
              Empowering financial institutions with intelligent, secure AI support.
            </span>
          </div>
        </div>

        {/* link columns */}
        <div style={{ padding: pad }}>
          <div className="mx-auto w-full max-w-[1200px]">
            <div
              className="grid grid-cols-2 gap-10 md:grid-cols-4"
              style={{ paddingTop: fluid(44, 24), paddingBottom: fluid(60, 32) }}
            >
              {FOOTER_COLUMNS.map((col, i) => (
                <Reveal key={col.title} delay={i * 90} y={18} className="flex flex-col">
                  <p
                    className="capitalize"
                    style={{
                      margin: 0,
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 12,
                      lineHeight: "20px",
                      fontWeight: 400,
                    }}
                  >
                    {col.title}
                  </p>
                  <ul className="mt-6 flex flex-col gap-[18px]">
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

        {/* oversized wordmark watermark */}
        <div
          aria-hidden
          className="pointer-events-none select-none overflow-hidden"
          style={{ lineHeight: 0 }}
        >
          <span
            className="font-display block whitespace-nowrap"
            style={{
              fontSize: "13.4vw",
              lineHeight: 0.82,
              fontWeight: 500,
              color: "rgba(255,255,255,0.08)",
              letterSpacing: "-0.02em",
              transform: "translateY(18%)",
            }}
          >
            Synergy.AI
          </span>
        </div>

        {/* bottom bar */}
        <div style={{ padding: pad }}>
          <div
            className="mx-auto flex w-full max-w-[1200px] flex-col items-start justify-between gap-4 py-6 md:flex-row md:items-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
          >
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: "20px" }}>
              © {new Date().getFullYear()} Synergy.AI. All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              <Link to="/" style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <FinChatDock alwaysVisible />

      <ProgressiveBlur
        className="fixed !z-20"
        position="bottom"
        height="140px"
        blurAmount="1.5px"
      />
    </div>
  );
}

export default BusinessImpactPage;
