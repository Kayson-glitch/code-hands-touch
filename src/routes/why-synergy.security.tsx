import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Server,
  ShieldCheck,
  Handshake,
  LifeBuoy,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import { logoAsset as logo } from "@/lib/media";
import { SiteNav } from "@/components/SiteNav";
import { HalftoneHandStill } from "@/components/HalftoneHandStill";
import { Reveal } from "@/components/Reveal";
import { FinChatDock } from "@/components/FinChatDock";
import { DotArrow } from "@/components/DotArrow";

export const Route = createFileRoute("/why-synergy/security")({
  head: () => ({
    meta: [
      { title: "Security & Partnership — Synergy.AI" },
      {
        name: "description",
        content:
          "Private by design, supported for the long term: private deployment, customer-controlled data, and expert support after launch.",
      },
      { property: "og:title", content: "Security & Partnership — Synergy.AI" },
      {
        property: "og:description",
        content:
          "Private by design, supported for the long term: private deployment, customer-controlled data, and expert support after launch.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SecurityPage,
});

/* --------------------------------------------------------------- helpers */

/** 1440px design width → fluid value. */
const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

const GRADIENT =
  "linear-gradient(90deg, #137DFF 0%, #FF18AA 33.333%, #FFCD17 66.666%, #137DFF 100%)";
/** Page accent (Figma 1564:85144). */
const AMBER = "#EBA753";

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

/** Small dark CTA inside the article header (Figma 1569:103980). */
function InlineDemoButton() {
  return (
    <button
      className="shrink-0 cursor-pointer transition-opacity hover:opacity-90"
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
      }}
    >
      Book a Demo
    </button>
  );
}

function Hairline({ dark = false }: { dark?: boolean }) {
  return (
    <div aria-hidden style={{ height: 1, background: dark ? "rgba(255,255,255,0.18)" : "#E1E0E4" }} />
  );
}

/* ------------------------------------------------------------------ data */

type Block = { icon: typeof Server; title: string; body: string; divider: boolean };

const TESTIMONIAL = {
  lead: "We run Synergy inside our own cloud, ",
  rest:
    "so customer data never leaves our perimeter. The team stayed on after launch, tuning workflows with us week by week instead of handing over a manual and disappearing.",
  name: "Natalie Hurst",
  role: "Sr. Director of Customer Success",
};

const HEADER = {
  eyebrow: "private deployment",
  titleAccent: "Private Deployment ",
  titleRest: "and Long-Term Partnership Models",
  intro:
    "For data-sensitive businesses, selecting an AI customer service vendor ultimately comes down to data security guarantees and long-term service capabilities. This article details our private deployment options and the partnership model that keeps the system improving after launch.",
};

const DARK_BLOCKS: Block[] = [
  {
    icon: Server,
    title: "Deployment Inside Your Perimeter",
    body: "Synergy runs in the customer's own VPC or on-premise environment. Models, retrieval indexes, and conversation logs live on infrastructure the customer controls; nothing is trained on customer data and nothing is shared across tenants. Network egress is limited to the endpoints the customer approves, and every external call is logged. The system is designed so that a security team can audit exactly where data lives and who can reach it.",
    divider: true,
  },
  {
    icon: ShieldCheck,
    title: "Data Control and Governance",
    body: "Knowledge sources, retention windows, and access roles are configured by the customer, not by us. Personally identifiable information is masked before it reaches the model layer, retention is enforced automatically at the configured horizon, and full audit trails are preserved for compliance reviews. Deletion requests propagate to indexes and logs, so a record that is removed is removed everywhere.",
    divider: false,
  },
];

const LIGHT_BLOCKS: Block[] = [
  {
    icon: Handshake,
    title: "A Partnership, Not a Handover",
    body: "Launch is the start of the engagement, not the end. A dedicated engineer stays embedded with the customer's team through the first observation cycles, reviewing resolved and escalated conversations together, adjusting routing rules, and tightening the knowledge base where gaps appear. Model and policy changes are proposed with evidence from production data and shipped only after the customer signs off.",
    divider: true,
  },
  {
    icon: LifeBuoy,
    title: "Support After Launch",
    body: "Ongoing support covers monitoring, incident response, and a fixed cadence of capability reviews. When a new product line, market, or language is added, the same team scopes the rollout, validates accuracy on a representative corpus, and stages the release. The commitment is measured in outcomes the customer already tracks — resolution rate, handoff quality, and time to update — rather than in tickets closed.",
    divider: false,
  },
];

const FOOTER_COLUMNS = [
  { title: "why  synergy", links: ["Features", "Pricing", "Book a demo"] },
  { title: "platform", links: ["Features", "Pricing", "Book a demo"] },
  { title: "solution", links: ["Events", "Blog"] },
  { title: "Company", links: ["About us", "Contact us"] },
];

/* ------------------------------------------------------------- fragments */

function ArticleBlock({
  icon: Icon,
  title,
  body,
  divider,
  dark,
  delay = 0,
}: Block & { dark?: boolean; delay?: number }) {
  return (
    <Reveal delay={delay} y={20} duration={1600}>
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
          fontSize: 14,
          lineHeight: "22px",
          color: dark ? "rgba(255,255,255,0.5)" : "var(--ink-muted, #7A7885)",
        }}
      >
        {body}
      </p>
      {divider ? (
        <div style={{ marginTop: fluid(60, 36) }}>
          <Hairline dark={dark} />
        </div>
      ) : null}
    </Reveal>
  );
}

/** Customer testimonial card (Figma 1569:103835): portrait, logo, quote, attribution. */
function TestimonialCard() {
  return (
    <Reveal y={32} duration={1600} style={{ background: "#FAFAFA" }}>
      <div
        className="flex flex-col md:flex-row"
        style={{ padding: `${fluid(24, 16)} ${fluid(40, 20)} ${fluid(24, 16)} ${fluid(24, 16)}`, gap: fluid(40, 24) }}
      >
        {/* portrait placeholder — Figma 280×392 */}
        <div
          aria-hidden
          className="shrink-0"
          style={{ width: fluid(280, 200), aspectRatio: "280 / 392", background: "#D9D9D9" }}
        />

        <div className="flex min-w-0 flex-1 flex-col justify-between" style={{ gap: 24 }}>
          {/* customer logo placeholder — Figma 140×24 */}
          <div aria-hidden style={{ width: 140, height: 24, background: "#ACACAC" }} />

          <blockquote
            className="font-display"
            style={{ margin: 0, fontSize: fluid(36, 24), lineHeight: 1.2222, fontWeight: 500 }}
          >
            <span className="text-ink-ghost">“ {TESTIMONIAL.lead}</span>
            <span className="text-ink">{TESTIMONIAL.rest} ”</span>
          </blockquote>

          <div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: "22px", color: "#000000" }}>{TESTIMONIAL.name}</p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: "20px", color: "#A1A0A9" }}>{TESTIMONIAL.role}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ page */

function SecurityPage() {
  const pad = `0 ${fluid(120, 24)}`;

  return (
    <div className="relative min-h-screen bg-paper">
      <SiteNav revealDelay={0} />

      {/* ------------------------------------------------------------ hero */}
      <header className="relative overflow-hidden">
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
              style={{ maxWidth: 680, paddingTop: fluid(163, 104), paddingBottom: fluid(172, 100) }}
            >
              <Reveal immediate className="flex items-center gap-2">
                <span aria-hidden style={{ width: 8, height: 8, background: AMBER }} />
                <span className="uppercase" style={{ fontSize: 14, lineHeight: "22px", color: "#7A7885" }}>
                  commitment
                </span>
              </Reveal>

              <Reveal immediate delay={120}>
                <h1
                  className="font-display text-ink capitalize"
                  style={{
                    margin: "10px 0 0",
                    maxWidth: 680,
                    fontSize: fluid(48, 30),
                    lineHeight: 1.1667,
                    fontWeight: 500,
                  }}
                >
                  Private by Design, Supported for the Long Term
                </h1>
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
                  Private infrastructure keeps data under customer control, backed by on-site expertise
                  after launch.
                </p>
              </Reveal>

              <Reveal immediate delay={360} style={{ marginTop: fluid(40, 28) }}>
                <RainbowButton label="Book a Demo" />
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- article */}
      <section style={{ padding: pad }}>
        <article className="mx-auto w-full max-w-[1200px] overflow-hidden bg-white">
          <Hairline />

          {/* testimonial */}
          <div style={{ padding: `${fluid(40, 24)} ${fluid(60, 24)} 0` }}>
            <TestimonialCard />
          </div>

          {/* header — eyebrow, rule, 48px title, intro, CTA */}
          <div style={{ padding: `${fluid(100, 56)} ${fluid(60, 24)} 0` }}>
            <Reveal y={32} duration={1600}>
              <p
                className="capitalize"
                style={{ margin: 0, fontSize: 12, lineHeight: "20px", fontWeight: 500, color: "var(--ink, #0E0B22)" }}
              >
                {HEADER.eyebrow}
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
                    className="font-display capitalize"
                    style={{ margin: 0, fontSize: fluid(48, 30), lineHeight: "1.1667", fontWeight: 400 }}
                  >
                    <span style={{ color: AMBER }}>{HEADER.titleAccent}</span>
                    <span className="text-ink">{HEADER.titleRest}</span>
                  </h2>
                  <p
                    style={{
                      margin: "20px 0 0",
                      fontSize: 13,
                      lineHeight: "20px",
                      color: "var(--ink-muted, #7A7885)",
                    }}
                  >
                    {HEADER.intro}
                  </p>
                </div>
                <InlineDemoButton />
              </div>
            </Reveal>
          </div>

          {/* dark block — full-bleed inside the column */}
          <div
            data-dark-section
            style={{
              marginTop: fluid(60, 36),
              background: "#000000",
              padding: `${fluid(80, 44)} ${fluid(60, 24)}`,
              display: "flex",
              flexDirection: "column",
              gap: fluid(60, 36),
            }}
          >
            {DARK_BLOCKS.map((b, i) => (
              <ArticleBlock key={b.title} {...b} dark delay={i * 260} />
            ))}
          </div>

          {/* light blocks */}
          <div
            style={{
              padding: `${fluid(80, 44)} ${fluid(60, 24)} ${fluid(80, 44)}`,
              display: "flex",
              flexDirection: "column",
              gap: fluid(60, 36),
            }}
          >
            {LIGHT_BLOCKS.map((b, i) => (
              <ArticleBlock key={b.title} {...b} delay={i * 260} />
            ))}
          </div>

          <Hairline />
        </article>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden" style={{ padding: `${fluid(160, 80)} 0` }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(14,11,34,0.16) 1px, transparent 1px)",
            backgroundSize: "20px 21px",
            maskImage: "radial-gradient(120% 80% at 50% 50%, #000 25%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 80% at 50% 50%, #000 25%, transparent 78%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-[800px] flex-col items-center px-6 text-center">
          <Reveal>
            <h2
              className="font-display"
              style={{ margin: 0, fontSize: fluid(48, 28), lineHeight: 1.1667, fontWeight: 500 }}
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
      <footer
        data-dark-section
        data-progressive-blur-hide
        className="relative overflow-hidden"
        style={{ background: "#0A0A0A" }}
      >
        <div aria-hidden style={{ height: 2, backgroundImage: GRADIENT, backgroundSize: "200%" }} />

        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", height: 80, boxSizing: "border-box" }}>
          <div className="h-full" style={{ padding: pad }}>
            <div className="mx-auto grid h-full w-full max-w-[1200px] grid-cols-2 items-center gap-9 md:grid-cols-4">
              <div className="flex items-center justify-start gap-2">
                <img
                  src={logo.url}
                  alt="Synergy.AI"
                  style={{ width: 28, height: 28, display: "block", borderRadius: 999, objectFit: "cover" }}
                />
                <span style={{ color: "#FFFFFF", fontSize: 18, lineHeight: "24px", fontWeight: 500 }}>
                  Synergy.AI
                </span>
              </div>
              <div className="hidden md:block md:col-span-3 md:text-right">
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: "20px" }}>
                  Revenue-Driven AI Support. Engineered on Synergy. Scale Securely.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* footer body — fixed 400px, wordmark anchored to the bottom edge */}
        <div className="relative overflow-hidden" style={{ height: 400 }}>
          <div className="flex h-full items-center" style={{ padding: pad }}>
            <div className="mx-auto w-full max-w-[1200px]">
              <div className="grid grid-cols-2 gap-9 md:grid-cols-4">
                {FOOTER_COLUMNS.map((col, i) => (
                  <Reveal key={col.title} delay={i * 90} y={18} className="flex flex-col items-start text-left">
                    <p
                      className="capitalize"
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 12,
                        lineHeight: "20px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {col.title}
                    </p>
                    <ul className="mt-6 flex flex-col items-start gap-[18px]">
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

          <div className="absolute bottom-0 left-0 w-full">
            <FitWordmark text="Synergy.AI" />
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", boxSizing: "border-box" }} className="md:h-[68px]">
          <div className="h-full" style={{ padding: pad }}>
            <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 items-center gap-9 py-7 md:h-full md:grid-cols-4 md:py-0">
              <span className="flex justify-start" style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: "20px" }}>
                © {new Date().getFullYear()} Synergy.AI. All rights reserved.
              </span>
              <div className="hidden md:col-span-3 md:flex md:items-center md:justify-end md:gap-4">
                {[Youtube, Twitter, Linkedin].map((Icon, i) => (
                  <span
                    key={i}
                    className="cursor-pointer transition-opacity hover:opacity-70"
                    style={{ color: "#FFFFFF", display: "inline-flex" }}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      <FinChatDock alwaysVisible />
    </div>
  );
}

export default SecurityPage;

/** Wordmark that fills its container width by uniform font scaling (no glyph stretching). */
function FitWordmark({ text }: { text: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(200);

  const fit = () => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;
    const probe = 200;
    el.style.fontSize = `${probe}px`;
    const w = el.scrollWidth;
    const next = w > 0 ? (probe * box.clientWidth) / w : probe;
    el.style.fontSize = `${next}px`;
    setSize(next);
  };

  useLayoutEffect(fit);
  useEffect(() => {
    window.addEventListener("resize", fit);
    if (document.fonts?.ready) document.fonts.ready.then(fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="pointer-events-none w-full select-none overflow-hidden"
      style={{ lineHeight: 0 }}
    >
      <span
        ref={textRef}
        className="font-sans block whitespace-nowrap"
        style={{
          fontSize: size,
          lineHeight: 0.8,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "rgba(255,255,255,0.08)",
          display: "inline-block",
          transform: "translateY(12%)",
        }}
      >
        {text}
      </span>
    </div>
  );
}
