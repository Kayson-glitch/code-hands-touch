import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquareCode, Map as MapIcon } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { HalftoneHandStill } from "@/components/HalftoneHandStill";

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
      className="mt-[6px] inline-block shrink-0"
      style={{
        width: 5,
        height: 5,
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

const ARTICLE_LIGHT = [
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
];

const ARTICLE_DARK = [
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
];

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
}: {
  data: typeof KPI_LEFT;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <p
        className="uppercase"
        style={{
          fontSize: 12,
          lineHeight: "18px",
          letterSpacing: "0.08em",
          margin: 0,
          color: "var(--ink-faint, #A1A0A9)",
        }}
      >
        {data.kicker}
      </p>
      <p
        className="font-display text-ink"
        style={{
          margin: `${fluid(40, 24)} 0 0`,
          fontSize: fluid(100, 48),
          lineHeight: 1,
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
          margin: `${fluid(30, 18)} 0 0`,
          fontSize: 14,
          lineHeight: "22px",
          color: "var(--ink-muted, #7A7885)",
        }}
      >
        {data.caption}
      </p>

      <div style={{ margin: `${fluid(40, 28)} 0 ${fluid(44, 30)}` }}>
        <Hairline dashed />
      </div>

      <ul className="flex flex-col gap-6">
        {data.bullets.map((b, i) => (
          <li key={b} className="flex items-start gap-[10px]">
            <Bullet diamond={i % 2 === 0} />
            <span className="text-ink" style={{ fontSize: 13, lineHeight: "22px" }}>
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
}: {
  icon: typeof MapIcon;
  title: string;
  body: string;
  divider: boolean;
  dark?: boolean;
}) {
  return (
    <div>
      <Icon size={24} strokeWidth={1.5} color={dark ? "#FFFFFF" : "#0E0B22"} />
      <h3
        className="font-display"
        style={{
          margin: "34px 0 0",
          fontSize: 20,
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
          color: dark ? "rgba(255,255,255,0.62)" : "var(--ink-muted, #7A7885)",
        }}
      >
        {body}
      </p>
      {divider ? (
        <div style={{ marginTop: fluid(60, 36) }}>
          <Hairline dark={dark} />
        </div>
      ) : null}
    </div>
  );
}

function BusinessImpactPage() {
  const pad = `0 ${fluid(120, 24)}`;

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
          className="pointer-events-none absolute right-0 select-none"
          style={{
            top: fluid(112, 64),
            width: fluid(640, 320),
            height: fluid(356, 178),
          }}
        />

        <div style={{ padding: pad }}>
          <div className="relative mx-auto w-full max-w-[1200px]">
            <div
              className="relative z-10"
              style={{ maxWidth: 620, paddingTop: fluid(162, 104), paddingBottom: fluid(112, 64) }}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden style={{ width: 5, height: 5, background: ACCENT }} />
                <span
                  className="uppercase"
                  style={{
                    fontSize: 12,
                    lineHeight: "18px",
                    letterSpacing: "0.08em",
                    color: "var(--ink-faint, #A1A0A9)",
                  }}
                >
                  Impact
                </span>
              </div>

              <h1
                className="font-display text-ink"
                style={{
                  margin: `${fluid(34, 22)} 0 0`,
                  fontSize: fluid(48, 30),
                  lineHeight: 1.17,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                }}
              >
                Resolving 55% of conversations
              </h1>

              <p
                style={{
                  margin: `${fluid(20, 14)} 0 0`,
                  maxWidth: 470,
                  fontSize: 14,
                  lineHeight: "22px",
                  color: "var(--ink-muted, #7A7885)",
                }}
              >
                Resolving 55% of conversations across 200K monthly inquiries, with a clear path to
                lower operating costs.
              </p>

              <div style={{ marginTop: fluid(26, 20) }}>
                <RainbowButton label="Book a Demo" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ KPIs */}
      <section style={{ padding: pad }}>
        <div className="mx-auto w-full max-w-[1200px]">
          {/* section rule: brand gradient across the first half, hairline after */}
          <div aria-hidden className="flex" style={{ height: 2 }}>
            <div style={{ width: "49%", backgroundImage: GRADIENT, opacity: 0.55 }} />
            <div style={{ flex: 1, background: "#ECEBEF" }} />
          </div>

          <div
            className="grid gap-y-[clamp(48px,5vw,72px)] md:grid-cols-2"
            style={{ paddingTop: fluid(70, 40) }}
          >
            <KpiColumn data={KPI_LEFT} style={{ paddingRight: fluid(60, 0) }} />
            <KpiColumn
              data={KPI_RIGHT}
              style={{
                paddingLeft: fluid(52, 0),
                borderLeft: "1px solid var(--hairline, #E1E0E4)",
              }}
              className="md:border-l"
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- article */}
      <section style={{ padding: pad, marginTop: fluid(120, 64) }}>
        <div
          className="mx-auto w-full max-w-[1200px] bg-white"
          style={{
            border: "1px solid var(--hairline, #E1E0E4)",
            borderRadius: 8,
            padding: fluid(60, 24),
          }}
        >
          {/* card header */}
          <p
            className="uppercase text-ink-faint"
            style={{ fontSize: 13, lineHeight: "20px", letterSpacing: "0.06em", margin: 0 }}
          >
            Business Value · ROI
          </p>
          <div style={{ marginTop: 10 }}>
            <Hairline />
          </div>

          <div
            className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between"
            style={{ marginTop: fluid(54, 28) }}
          >
            <div style={{ maxWidth: 800 }}>
              <h2
                className="font-display"
                style={{ margin: 0, fontSize: fluid(40, 26), lineHeight: 1.4, fontWeight: 500 }}
              >
                <span
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #137DFF 0%, #7B3BFF 45%, #B37BFF 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Scaling Support Smarter:
                </span>{" "}
                <span className="text-ink">Cost Analysis From 150 To 50 Agents</span>
              </h2>
              <p
                className="text-ink-muted"
                style={{ margin: "32px 0 0", fontSize: 14, lineHeight: "22px" }}
              >
                This is a projection based on the actual absorption capacity of the AI system in the
                current observation cycle, using RMB 1.5M/month as the human cost baseline for 150
                agents and 200K conversations/month as the volume baseline.
              </p>
            </div>

            <div className="shrink-0">
              <RainbowButton label="Book a Demo" size="sm" />
            </div>
          </div>

          {/* light blocks */}
          <div className="flex flex-col" style={{ gap: fluid(60, 36), marginTop: fluid(102, 56) }}>
            {ARTICLE_LIGHT.map((b) => (
              <ArticleBlock key={b.title} {...b} />
            ))}
          </div>

          {/* dark inner block */}
          <div
            data-dark-section
            style={{
              marginTop: fluid(80, 48),
              background: "#0A0A0A",
              borderRadius: 8,
              padding: fluid(60, 24),
              display: "flex",
              flexDirection: "column",
              gap: fluid(60, 36),
            }}
          >
            {ARTICLE_DARK.map((b) => (
              <ArticleBlock key={b.title} {...b} dark />
            ))}
          </div>
        </div>
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
          <h2
            className="font-display"
            style={{ margin: 0, fontSize: fluid(40, 26), lineHeight: 1.4, fontWeight: 500 }}
          >
            <span className="text-ink-ghost">Get started with the</span>
            <br />
            <span className="text-ink">Synergy.AI today</span>
          </h2>
          <div style={{ marginTop: fluid(40, 28) }}>
            <RainbowButton label="Book a Demo" />
          </div>
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
              {FOOTER_COLUMNS.map((col) => (
                <div key={col.title} className="flex flex-col">
                  <p
                    style={{
                      margin: 0,
                      color: "#FFFFFF",
                      fontSize: 13,
                      lineHeight: "20px",
                      fontWeight: 500,
                    }}
                  >
                    {col.title}
                  </p>
                  <ul className="mt-6 flex flex-col gap-[18px]">
                    {col.links.map((l) => (
                      <li key={l}>
                        <span
                          className="cursor-pointer transition-colors hover:text-white"
                          style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: "22px" }}
                        >
                          {l}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
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
    </div>
  );
}

export default BusinessImpactPage;
