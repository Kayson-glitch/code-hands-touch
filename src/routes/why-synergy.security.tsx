import { createFileRoute } from "@tanstack/react-router";
import {
  Server,
  ShieldCheck,
  Handshake,
  LifeBuoy,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { whySecurityAsset } from "@/lib/media";
import { HalftoneHandStill } from "@/components/HalftoneHandStill";
import { Reveal } from "@/components/Reveal";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
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
  lead: "Synergy runs inside our own AWS account, ",
  rest:
    "so customer and transaction data never leave our boundary. When we needed changes, their FDE team flew in and sat with us until it shipped — and the model kept getting better every week after that.",
  name: "Natalie Hurst",
  role: "Sr. Director of Customer Success",
};

const HEADER = {
  eyebrow: "private deployment",
  titleAccent: "Private Deployment ",
  titleRest: "and Long-Term Partnership",
  intro:
    "For data-security and procurement leads. Two things decide the vendor question for sensitive businesses — data security and long-term service. Here is our private deployment option and the model that keeps the system improving after launch.",
};

const DARK_BLOCKS: Block[] = [
  {
    icon: Server,
    title: "Deployed in Your Own AWS",
    body: "The product supports private deployment directly inside the customer's own AWS environment. User data, transaction data and payment proofs stay within the customer's infrastructure boundary and are not transmitted outside it. For iGaming, payments, finance and other data-sensitive businesses this is not an add-on; it is the baseline requirement for compliance and security — and it is how BCGame runs today.",
    divider: true,
  },
  {
    icon: ShieldCheck,
    title: "Data Stays Inside Your Boundary",
    body: "Because models, knowledge base and conversation logs live in the customer's account, the customer — not the vendor — controls where data sits and who can reach it. Custom models such as the Indian payment-forgery detector are trained on the customer's own labelled production data and serve the customer alone. Nothing is pooled across tenants, and a security team can audit the whole path end to end.",
    divider: false,
  },
];

const LIGHT_BLOCKS: Block[] = [
  {
    icon: Handshake,
    title: "FDE On Site, Not a Handover",
    body: "Service does not stop at go-live. When the customer has an iteration need, the FDE team provides support on site: mapping the knowledge base, connecting ticket flows across CRM and ERM, tuning models, and working through the change with the customer's own team until it is in production. This is the team that connected BCGame's 56 fiat ticket scenarios — and the team that stayed. We do not do one-off deals; we take long-term responsibility for the customer.",
    divider: true,
  },
  {
    icon: LifeBuoy,
    title: "Weekly Iteration as a Service Commitment",
    body: "Private deployment, on-site FDE support and weekly model iteration together form our long-term service model. The weekly loop — production labels in, a new version out every Friday — gives 'continuous improvement' a deployment method and a service promise behind it, not just a phrase. What the customer receives is not a system frozen at delivery, but the engineering support for its long-term evolution. Every figure on these pages is a snapshot of the current cycle and will keep moving.",
    divider: false,
  },
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
          src={whySecurityAsset.url}
          contrast={1.7}
          cropX={0.352}
          cropW={0.648}
          cropY={0.145}
          cropH={0.66}
          pitch={6}
          className="pointer-events-none absolute select-none"
          style={{
            // Soften the box edges the subject bleeds through (left arm, lower arm).
            maskImage: "linear-gradient(to right, transparent 0, #000 14%), linear-gradient(to top, transparent 0, #000 14%), linear-gradient(to bottom, transparent 0, #000 12%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 14%), linear-gradient(to top, transparent 0, #000 14%), linear-gradient(to bottom, transparent 0, #000 12%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
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
                style={{ marginTop: fluid(24, 18), columnGap: fluid(72, 40) }}
              >
                <div style={{ maxWidth: 760, minWidth: 0 }}>
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

      {/* CTA + brand footer, shared with the homepage */}
      <SiteFooter />

      <FinChatDock alwaysVisible />
    </div>
  );
}

export default SecurityPage;
