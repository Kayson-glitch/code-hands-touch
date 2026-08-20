import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
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

function RainbowButton({ label }: { label: string }) {
  const face = "#0E0B22";
  const faceRgb = "14,11,34";
  return (
    <button
      className="group relative inline-flex shrink-0 cursor-pointer items-center justify-center font-medium transition-all"
      style={{
        height: "clamp(34px, 2.7778vw, 52px)",
        fontSize: "clamp(12px, 1.1111vw, 16px)",
        lineHeight: "clamp(18px, 1.6667vw, 24px)",
        fontWeight: 500,
        padding: "0 clamp(20px, 2.2222vw, 42px)",
        borderRadius: 12,
        border: "0.125rem solid transparent",
        color: "#FFFFFF",
        backgroundImage: [
          `linear-gradient(${face},${face})`,
          `linear-gradient(${face} 50%, rgba(${faceRgb},0.6) 80%, rgba(${faceRgb},0))`,
          "linear-gradient(90deg, #137DFF 0%, #FF18AA 33.333%, #FFCD17 66.666%, #137DFF 100%)",
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
          backgroundImage:
            "linear-gradient(90deg, #137DFF 0%, #FF18AA 33.333%, #FFCD17 66.666%, #137DFF 100%)",
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

const KPIS = [
  {
    value: "$12M/yr",
    label: "Estimated cost optimization",
    desc: "Modelled annual saving once deflected conversations are removed from the human queue at current volumes.",
  },
  {
    value: "75%",
    label: "AI resolution rate",
    desc: "Share of inbound conversations closed end-to-end by Synergy.AI, without a human agent taking over.",
  },
];

const PROJECTION_ROWS = [
  ["Annual conversation volume", "4.8M"],
  ["Resolved by Synergy.AI", "75%"],
  ["Fully loaded cost per human contact", "$3.40"],
  ["Projected annual cost avoided", "$12.2M"],
];

const CLARIFICATIONS = [
  "Figures are a projection built from your own volume and cost inputs, not a guarantee of results.",
  "Resolution is counted only when the conversation closes without human takeover or a follow-up reopen within 72 hours.",
  "Cost per contact uses fully loaded agent cost, including tooling, QA and management overhead.",
  "Savings ramp over the first two quarters as knowledge coverage and guardrails are tuned with your team.",
];

const FOOTER_COLUMNS = [
  {
    title: "Why Synergy",
    links: ["Business Impact", "Stories", "Technology & Guardrails", "Security & Partnership"],
  },
  { title: "Platform", links: ["Knowledge Engine", "Agent Desk", "Insights", "Integrations"] },
  { title: "Company", links: ["About", "Careers", "Newsroom", "Contact"] },
  { title: "Resources", links: ["Docs", "Changelog", "Trust Center", "Status"] },
];

function BusinessImpactPage() {
  return (
    <div className="relative min-h-screen bg-paper">
      <SiteNav revealDelay={0} />

      {/* ---------------------------------------------------------- hero */}
      <header className="relative overflow-hidden">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 pb-0 pt-[clamp(120px,10.4167vw,150px)] text-center">
          <span
            className="uppercase text-ink-faint"
            style={{ fontSize: "clamp(10px, 0.8333vw, 12px)", letterSpacing: "0.12em" }}
          >
            / Impact
          </span>
          <h1
            className="font-display mt-4 capitalize text-ink"
            style={{
              fontSize: "clamp(34px, 4.4444vw, 64px)",
              lineHeight: "clamp(40px, 5.0000vw, 72px)",
              fontWeight: 500,
              maxWidth: "min(880px, 61.1111vw)",
              margin: 0,
            }}
          >
            From AI Support to <span className="text-ink-ghost">Measurable Business Value</span>
          </h1>
          <p
            className="mt-5 text-ink-muted"
            style={{
              fontSize: "clamp(13px, 1.1111vw, 16px)",
              lineHeight: "clamp(20px, 1.6667vw, 24px)",
              maxWidth: "min(560px, 38.8889vw)",
            }}
          >
            Every claim on this page is traceable to a number: resolution rate, cost per contact,
            and the assumptions we used to model them.
          </p>
          <div className="mt-8">
            <RainbowButton label="Book a Demo" />
          </div>
        </div>

        {/* Single halftone hand — same atlas as the home page hero */}
        <HalftoneHandStill
          className="pointer-events-none mx-auto w-full max-w-[1440px]"
          style={{ height: "clamp(220px, 26vw, 380px)", marginTop: "clamp(24px, 3vw, 48px)" }}
        />
      </header>

      {/* ----------------------------------------------------------- KPIs */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-[clamp(48px,6vw,96px)]">
        <div className="grid gap-6 md:grid-cols-2">
          {KPIS.map((k) => (
            <article
              key={k.value}
              className="flex flex-col items-start gap-4 bg-white"
              style={{ padding: "clamp(24px,2.5vw,40px)", border: "1px solid var(--hairline, #F1F1F3)" }}
            >
              <p
                className="font-display text-ink"
                style={{
                  fontSize: "clamp(40px, 6.9444vw, 100px)",
                  lineHeight: 1,
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                {k.value}
              </p>
              <p
                className="font-medium text-ink"
                style={{ fontSize: "clamp(14px,1.1111vw,16px)", lineHeight: "24px", margin: 0 }}
              >
                {k.label}
              </p>
              <p
                className="text-ink-muted"
                style={{ fontSize: "clamp(12px,0.9722vw,14px)", lineHeight: "22px", margin: 0 }}
              >
                {k.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* --------------------------------------------- cost projection */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-[clamp(48px,6vw,96px)]">
        <div className="grid gap-[clamp(24px,4vw,72px)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h2
              className="font-display text-ink"
              style={{
                fontSize: "clamp(26px, 3.3333vw, 48px)",
                lineHeight: 1.15,
                fontWeight: 500,
                margin: 0,
              }}
            >
              Cost Impact Projection
            </h2>
            <p
              className="mt-5 text-ink-muted"
              style={{ fontSize: "clamp(13px,1.0417vw,15px)", lineHeight: "24px" }}
            >
              We start from your live volume, subtract what the AI resolves on its own, and price
              the remainder at your fully loaded human cost. No blended industry averages, no
              borrowed benchmarks — the model runs on your data and is re-scored every month after
              go-live.
            </p>
          </div>

          <div style={{ borderTop: "1px solid var(--hairline, #F1F1F3)" }}>
            {PROJECTION_ROWS.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-6 py-5"
                style={{ borderBottom: "1px solid var(--hairline, #F1F1F3)" }}
              >
                <span
                  className="text-ink-muted"
                  style={{ fontSize: "clamp(12px,0.9722vw,14px)", lineHeight: "22px" }}
                >
                  {label}
                </span>
                <span
                  className="font-display text-ink"
                  style={{ fontSize: "clamp(18px,1.5278vw,22px)", fontWeight: 500 }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------- clarifications */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-[clamp(56px,7vw,120px)]">
        <h2
          className="font-display text-ink"
          style={{
            fontSize: "clamp(26px, 3.3333vw, 48px)",
            lineHeight: 1.15,
            fontWeight: 500,
            margin: 0,
          }}
        >
          Conclusion and Clarifications
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-2">
          {CLARIFICATIONS.map((c, i) => (
            <li key={c} className="flex items-start gap-4">
              <span
                className="font-display shrink-0 text-ink-ghost"
                style={{ fontSize: 20, lineHeight: "24px" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p
                className="text-ink-muted"
                style={{ fontSize: "clamp(12px,0.9722vw,14px)", lineHeight: "24px", margin: 0 }}
              >
                {c}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------- CTA */}
      <section data-dark-section className="relative" style={{ background: "#0A0A0A" }}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-8 px-6 py-[clamp(72px,9vw,160px)] text-center">
          <h2
            className="font-display capitalize"
            style={{
              fontSize: "clamp(30px, 4.1667vw, 60px)",
              lineHeight: 1.1,
              fontWeight: 500,
              color: "#FFFFFF",
              margin: 0,
              maxWidth: "min(760px, 52.7778vw)",
            }}
          >
            Get started with the Synergy.AI today
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "clamp(13px,1.0417vw,15px)",
              lineHeight: "24px",
              maxWidth: "min(520px, 36.1111vw)",
              margin: 0,
            }}
          >
            Bring your volume and cost data — we will build the projection with you in a single
            session.
          </p>
          <RainbowButton label="Book a Demo" />
        </div>

        {/* ---------------------------------------------------- footer */}
        <footer
          className="mx-auto w-full max-w-[1200px] px-6 pb-16"
          style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
        >
          <div className="grid gap-10 py-12 md:grid-cols-4">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-4">
                <p
                  className="font-medium"
                  style={{ color: "#FFFFFF", fontSize: 13, lineHeight: "20px", margin: 0 }}
                >
                  {col.title}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <span
                        className="cursor-pointer transition-colors hover:text-white"
                        style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: "20px" }}
                      >
                        {l}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="flex flex-col items-start justify-between gap-3 pt-8 md:flex-row md:items-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
          >
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              © {new Date().getFullYear()} Synergy.AI. All rights reserved.
            </span>
            <Link to="/" style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
              Back to home
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default BusinessImpactPage;
