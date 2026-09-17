import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Database,
  Globe,
  Mail,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
import { RollingNumber } from "@/components/RollingNumber";
import { GRADIENT, ProductHero, RainbowButton } from "@/components/ProductHero";

export const Route = createFileRoute("/solution/customer-support")({
  head: () => ({
    meta: [
      { title: "Scale & Stabilise Customer Support — Synergy.AI" },
      {
        name: "description",
        content:
          "Customer experience designed to feel effortless: consistent answers across every channel, real-time always-on support, and faster resolution through self-service.",
      },
      { property: "og:title", content: "Scale & Stabilise Customer Support — Synergy.AI" },
      {
        property: "og:description",
        content:
          "Instant answers. Tasks done. Conversations that never start over. Help that's always there — effortlessly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerSupportPage,
});

/* --------------------------------------------------------------- helpers */

const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

/** Page accent — the Solution menu's "Customer service" square. */
const AMBER = "#FFCE91";
const LIME = "#D1E486";
const HAIRLINE = "#E1E0E4";
const INK = "#0E0B22";
const MUTED = "#7A7885";

/* ------------------------------------------------------------------ data */

const HERO = {
  eyebrow: "Frictionless customer AI",
  title: "Customer Experience,\nDesigned to Feel\nEffortless.",
  intro:
    "Instant answers. Tasks done. Conversations that never start over. Help that's always there — effortlessly.",
};

type Feature = {
  title: string;
  body: string;
  values: string[];
  figure: "channels" | "console" | "flow";
};

const FEATURES: Feature[] = [
  {
    title: "Consistent Answers\nAcross Every Channel",
    body: "synergy.ai uses a unified knowledge base and response logic across all support channels. Whether customers reach out via web, mobile apps, social platforms, or email, they receive consistent, accurate, and traceable answers every time.",
    values: [
      "Seamless conversations across channels",
      "Reduced trust loss from inconsistent answers",
      "Stronger brand credibility and service standards",
    ],
    figure: "channels",
  },
  {
    title: "Real-Time,\nAlways-On Support",
    body: "synergy.ai delivers 24/7 real-time responsiveness, understanding customer requests the moment they are made and providing accurate answers instantly. By automating high-frequency inquiries and standard workflows, customers get what they need without waiting.",
    values: [
      "No queues. Questions answered instantly",
      "Fewer drop-offs caused by waiting or frustration",
      "A more professional and reliable service experience",
    ],
    figure: "console",
  },
  {
    title: "Faster Resolution\nThrough Self-Service",
    body: "synergy.ai enables efficient self-service experiences, guiding customers to complete common actions such as inquiries, updates, and status tracking on their own. Many issues are resolved end-to-end without escalation.",
    values: [
      "Greater control through self-resolution",
      "Shorter time to resolution",
      "Fewer experience breaks caused by repeated transfers",
    ],
    figure: "flow",
  },
];

const OUTCOMES = {
  title: "Support that feels\nimmediate\nand dependable.",
  body: "synergy.ai removes friction from every customer interaction — responding faster, staying consistent, and helping customers move forward without delay.",
  stats: [
    { sign: "-", value: "70", unit: "%", label: "First\nResponse Time" },
    { sign: "+", value: "28", unit: "%", label: "First Contact\nResolution" },
    { sign: "+", value: "40", unit: "%", label: "Tickets Resolved\nvia Self-Service" },
    { sign: "-", value: "17", unit: "%", label: "Customer\nSatisfaction (CSAT)" },
  ],
};

/* ------------------------------------------------------------- fragments */

function Bullet({ diamond }: { diamond: boolean }) {
  return (
    <span
      aria-hidden
      className="mt-[8px] inline-block shrink-0"
      style={{
        width: 6,
        height: 6,
        background: diamond ? AMBER : INK,
        transform: diamond ? "rotate(45deg)" : undefined,
      }}
    />
  );
}

/** Square ink tag — the menu's NEW label at flow-node size. */
function Tag({ children, tone = "ink" }: { children: string; tone?: "ink" | "accent" }) {
  return (
    <span
      className="inline-flex items-center uppercase whitespace-nowrap"
      style={{
        height: 24,
        padding: "0 10px",
        fontSize: 11,
        lineHeight: "16px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        background: tone === "ink" ? INK : LIME,
        color: tone === "ink" ? "#FFFFFF" : INK,
      }}
    >
      {children}
    </span>
  );
}

/** Figure panel shell — the RAG demo card's frame: white, hairline, square. */
function Panel({ children, padding = fluid(32, 20) }: { children: React.ReactNode; padding?: string }) {
  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: "#FFFFFF", border: `1px solid ${HAIRLINE}`, padding, minHeight: fluid(480, 360) }}
    >
      {children}
    </div>
  );
}

/* --- figure 1: one knowledge base behind every channel ------------------ */

const CHANNELS: Array<{ icon: LucideIcon; label: string; x: number; y: number }> = [
  { icon: Globe, label: "Web", x: 16, y: 20 },
  { icon: Mail, label: "Email", x: 84, y: 20 },
  { icon: Smartphone, label: "Mobile apps", x: 84, y: 78 },
  { icon: MessageCircle, label: "Social platforms", x: 16, y: 78 },
];

function ChannelHub() {
  return (
    <Panel>
      {/* fixed aspect so the SVG rails and the HTML nodes share one coordinate space */}
      <div className="relative w-full" style={{ aspectRatio: "100 / 82" }}>
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 82"
          preserveAspectRatio="none"
        >
          {CHANNELS.map((c) => (
            <line
              key={c.label}
              x1="50"
              y1="41"
              x2={c.x}
              y2={(c.y / 100) * 82}
              stroke="#C6C5CB"
              strokeWidth="1"
              strokeDasharray="1 3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* hub */}
        <div
          className="absolute flex flex-col items-center justify-center text-center"
          style={{
            left: "50%",
            top: "50%",
            width: fluid(112, 88),
            height: fluid(112, 88),
            transform: "translate(-50%, -50%)",
            background: INK,
            color: "#FFFFFF",
            gap: 8,
          }}
        >
          <Database size={20} strokeWidth={1.5} />
          <span className="uppercase" style={{ fontSize: 10, lineHeight: "14px", letterSpacing: "0.08em" }}>
            Knowledge
            <br />
            base
          </span>
        </div>

        {/* channels */}
        {CHANNELS.map((c, i) => (
          <div
            key={c.label}
            className="absolute flex flex-col items-center"
            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)", gap: 8 }}
          >
            <span
              className="grid place-items-center"
              style={{ width: 44, height: 44, background: "#FFFFFF", border: `1px solid ${HAIRLINE}` }}
            >
              <c.icon size={18} strokeWidth={1.5} color={INK} />
            </span>
            <span className="whitespace-nowrap" style={{ fontSize: 12, lineHeight: "16px", color: i % 2 ? MUTED : INK }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* --- figure 2: the always-on console ------------------------------------ */

const CONVERSATIONS = [
  { name: "Marvin McKinney", ask: "How do I stake my tokens?" },
  { name: "Jane Cooper", ask: "Transaction stuck, help?" },
  { name: "Cody Fisher", ask: "NFT not showing in wallet" },
];

function SupportConsole() {
  return (
    <Panel padding="0">
      <div className="flex items-center justify-between" style={{ padding: "20px 24px", borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <span className="grid place-items-center" style={{ width: 36, height: 36, border: `1px solid ${HAIRLINE}` }}>
            <ShieldCheck size={18} strokeWidth={1.5} color={INK} />
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: "22px", fontWeight: 500, color: INK }}>24/7 Support Active</p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: MUTED }}>
              All time zones · Zero downtime · Instant
            </p>
          </div>
        </div>
        <span className="inline-flex items-center" style={{ gap: 6, fontSize: 12, lineHeight: "18px", color: MUTED }}>
          <span aria-hidden style={{ width: 6, height: 6, background: LIME }} />
          Live
        </span>
      </div>

      <div className="flex items-baseline justify-between" style={{ padding: "20px 24px 12px" }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", fontWeight: 500, color: INK }}>Active conversations</p>
        <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: MUTED }}>
          <RollingNumber value="1429" /> handled today
        </p>
      </div>

      <ul className="m-0 flex flex-1 list-none flex-col p-0" style={{ padding: "0 24px 24px", gap: 8 }}>
        {CONVERSATIONS.map((c) => (
          <li
            key={c.name}
            className="flex items-center justify-between"
            style={{ padding: "14px 16px", background: "#F8F9FA", border: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex items-center" style={{ gap: 12 }}>
              <span
                className="grid place-items-center uppercase"
                style={{ width: 32, height: 32, background: INK, color: "#FFFFFF", fontSize: 11, letterSpacing: "0.04em" }}
              >
                {c.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", fontWeight: 500, color: INK }}>{c.name}</p>
                <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: MUTED }}>{c.ask}</p>
              </div>
            </div>
            <span className="grid place-items-center" style={{ width: 24, height: 24, background: LIME }}>
              <Check size={14} strokeWidth={2} color={INK} />
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* --- figure 3: self-service, end to end in one session ------------------ */

const FLOW: Array<{ tag: string; note: string; tone?: "ink" | "accent" }> = [
  { tag: "User inbound", note: "No escalation needed · end-to-end in one session" },
  { tag: "Intent detection", note: "Real-time visibility · shorter time to resolution" },
  { tag: "Automated solution", note: "Routed with full context · fewer repeated transfers" },
  { tag: "Instant resolution", note: "Hi! 👋 How can I help you? — answered, closed, no hand-off", tone: "accent" },
];

function SelfServiceFlow() {
  return (
    <Panel>
      <ol className="m-0 flex flex-1 list-none flex-col justify-between p-0" style={{ gap: 8 }}>
        {FLOW.map((step, i) => {
          const last = i === FLOW.length - 1;
          return (
            <li key={step.tag} className="flex" style={{ gap: 16 }}>
              {/* rail: square marker, dotted line down to the next step */}
              <div className="flex flex-col items-center" style={{ width: 10 }}>
                <span
                  aria-hidden
                  className="block shrink-0"
                  style={{
                    width: 10,
                    height: 10,
                    marginTop: 7,
                    background: last ? LIME : "transparent",
                    border: last ? "none" : `1px solid ${INK}`,
                  }}
                />
                {!last ? (
                  <span
                    aria-hidden
                    className="block w-[3px] flex-1"
                    style={{
                      marginTop: 6,
                      backgroundImage: "radial-gradient(circle, #C6C5CB 1px, transparent 1.6px)",
                      backgroundSize: "3px 8px",
                      backgroundRepeat: "repeat-y",
                      backgroundPosition: "center",
                    }}
                  />
                ) : null}
              </div>
              <div className={last ? "pb-0" : "pb-7"} style={{ minWidth: 0 }}>
                <Tag tone={step.tone}>{step.tag}</Tag>
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: "20px", color: MUTED }}>{step.note}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/* --- feature section ---------------------------------------------------- */

function FeatureSection({ feature, flip }: { feature: Feature; flip: boolean }) {
  const figure =
    feature.figure === "channels" ? <ChannelHub /> : feature.figure === "console" ? <SupportConsole /> : <SelfServiceFlow />;
  return (
    <section style={{ borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ padding: `${fluid(100, 56)} ${fluid(120, 24)}` }}>
        <div
          className="mx-auto flex w-full max-w-[1200px] flex-col md:flex-row md:items-center"
          style={{ gap: fluid(40, 32) }}
        >
          <div className={`flex flex-1 flex-col ${flip ? "md:order-2" : ""}`} style={{ minWidth: 0 }}>
            <Reveal y={24} duration={1600}>
              <GradientHoverHeading
                as="h2"
                className="font-display text-ink"
                text={feature.title}
                breakFrom="md"
                style={{ margin: 0, maxWidth: 580, fontSize: fluid(44, 30), lineHeight: 1.2273, fontWeight: 400 }}
              />
            </Reveal>
            <Reveal y={24} duration={1600} delay={120}>
              <p style={{ margin: "20px 0 0", maxWidth: 580, fontSize: 14, lineHeight: "24px", color: MUTED }}>
                {feature.body}
              </p>
            </Reveal>
            <Reveal y={24} duration={1600} delay={240} style={{ marginTop: fluid(40, 28), maxWidth: 580 }}>
              <div aria-hidden style={{ height: 1, background: HAIRLINE }} />
              <p
                className="uppercase"
                style={{ margin: "20px 0 0", fontSize: 12, lineHeight: "18px", letterSpacing: "0.06em", color: MUTED }}
              >
                Customer experience value
              </p>
              <ul className="m-0 flex list-none flex-col p-0" style={{ marginTop: 14, gap: 10 }}>
                {feature.values.map((v, i) => (
                  <li key={v} className="flex items-start" style={{ gap: 10 }}>
                    <Bullet diamond={i % 2 === 0} />
                    <span style={{ fontSize: 14, lineHeight: "22px", color: INK }}>{v}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal y={32} duration={1600} delay={160} className={`flex-1 ${flip ? "md:order-1" : ""}`} style={{ minWidth: 0 }}>
            {figure}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* --- outcomes ----------------------------------------------------------- */

function OutcomeCard({
  sign,
  value,
  unit,
  label,
  index,
}: {
  sign: string;
  value: string;
  unit: string;
  label: string;
  index: number;
}) {
  return (
    <Reveal y={24} duration={1600} delay={index * 120} className="min-w-0 flex-1">
      <div
        className="flex h-full flex-col justify-between"
        style={{ background: "#F8F9FA", border: `1px solid ${HAIRLINE}`, minHeight: fluid(220, 160) }}
      >
        {/* each card shows a different slice of the brand gradient */}
        <div
          aria-hidden
          style={{ height: 2, backgroundImage: GRADIENT, backgroundSize: "400% 100%", backgroundPosition: `${index * 33.333}% 0` }}
        />
        <div style={{ padding: `${fluid(28, 20)} ${fluid(24, 18)} ${fluid(24, 18)}` }}>
          <p
            className="font-display whitespace-nowrap"
            style={{ margin: 0, fontSize: fluid(56, 40), lineHeight: 1.1, fontWeight: 400, color: INK }}
          >
            <span style={{ color: "#A1A0A9" }}>{sign}</span>
            <RollingNumber value={value} />
            <span style={{ color: "#A1A0A9" }}>{unit}</span>
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: "20px", color: MUTED, whiteSpace: "pre-line" }}>
            {label}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function Outcomes() {
  return (
    <section style={{ borderTop: `1px solid ${HAIRLINE}`, background: "#FAFAFA" }}>
      <div style={{ padding: `${fluid(100, 56)} ${fluid(120, 24)} ${fluid(120, 64)}` }}>
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between" style={{ gap: fluid(24, 24) }}>
            <Reveal y={24} duration={1600} className="md:w-1/2">
              <GradientHoverHeading
                as="h2"
                className="font-display text-ink"
                text={OUTCOMES.title}
                breakFrom="md"
                style={{ margin: 0, fontSize: fluid(44, 30), lineHeight: 1.2273, fontWeight: 400 }}
              />
            </Reveal>
            <Reveal y={24} duration={1600} delay={120} className="md:w-1/2">
              <p style={{ margin: 0, maxWidth: 532, fontSize: 16, lineHeight: "27px", color: INK }}>{OUTCOMES.body}</p>
              <div style={{ marginTop: fluid(32, 24) }}>
                <RainbowButton label="Book a Demo" />
              </div>
            </Reveal>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4" style={{ marginTop: fluid(56, 36), gap: 16 }}>
            {OUTCOMES.stats.map((s, i) => (
              <OutcomeCard key={s.label} {...s} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */

function CustomerSupportPage() {
  return (
    <div className="relative min-h-screen bg-paper">
      <SiteNav revealDelay={0} solid />

      <ProductHero eyebrow={HERO.eyebrow} accent={AMBER} title={HERO.title} intro={HERO.intro} />

      {FEATURES.map((f, i) => (
        <FeatureSection key={f.title} feature={f} flip={i % 2 === 1} />
      ))}

      <Outcomes />

      {/* brand footer only — the page ends on its outcomes, not the CTA screen */}
      <SiteFooter cta={false} />

      <FinChatDock alwaysVisible />
    </div>
  );
}

export default CustomerSupportPage;
