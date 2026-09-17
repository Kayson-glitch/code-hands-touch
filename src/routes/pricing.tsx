import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
import { DotArrow } from "@/components/DotArrow";
import { BreakLines, HeroDots, RainbowButton } from "@/components/ProductHero";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Synergy.AI" },
      {
        name: "description",
        content:
          "Transparent pricing that scales with your business. Free, Basic, Growth and Enterprise plans, and a calculator for what AI-handled support saves your team.",
      },
      { property: "og:title", content: "Pricing — Synergy.AI" },
      { property: "og:description", content: "Transparent pricing that scales with your business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

/* --------------------------------------------------------------- helpers */

const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

const INK = "#0E0B22";
const MUTED = "#7A7885";
const FAINT = "#A1A0A9";
const HAIRLINE = "#E1E0E4";
const LIME = "#D1E486";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
/** $2.8M / $480K style for secondary figures. */
const compact = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M` : n >= 1000 ? `$${Math.round(n / 1000)}K` : money(n);
const count = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`;

/* ------------------------------------------------------------------ data */

type Plan = {
  id: "free" | "basic" | "growth" | "enterprise";
  name: string;
  dot: string;
  monthly: number | null;
  /** AI messages a month the plan covers (null = custom). */
  messages: number | null;
  features: string[];
  cta: string;
};

const PLANS: Plan[] = [
  { id: "free", name: "Free", dot: "#C6C5CB", monthly: 0, messages: 10_000, features: ["10k AI messages / mo", "AI message volume add-on"], cta: "Book a Demo" },
  { id: "basic", name: "Basic", dot: "#8CE0FF", monthly: 1500, messages: 100_000, features: ["100k AI messages / mo", "AI message volume add-on"], cta: "Book a Demo" },
  { id: "growth", name: "Growth", dot: LIME, monthly: 15000, messages: 1_000_000, features: ["1M AI messages / mo", "AI message volume add-on"], cta: "Book a Demo" },
  { id: "enterprise", name: "Enterprise", dot: "#FFCE91", monthly: null, messages: null, features: ["Unlimited AI messages", "Private deployment · on-site FDE"], cta: "Contact us" },
];

const ANNUAL_DISCOUNT = 0.1;

/** Calculator inputs — every knob the estimate depends on, nothing hidden. */
type Inputs = {
  agents: number;
  costPerAgent: number;
  conversations: number; // per month
  growth: number; // % YoY
  years: number;
  rate: number; // % of conversations AI closes end-to-end
};

const DEFAULTS: Inputs = { agents: 150, costPerAgent: 36_000, conversations: 200_000, growth: 15, years: 3, rate: 55 };

type Knob = {
  key: keyof Inputs;
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
};

const KNOBS: Knob[] = [
  { key: "agents", label: "Support agents today", min: 5, max: 1000, step: 5, format: (v) => `${v}` },
  { key: "costPerAgent", label: "Fully loaded cost per agent / year", min: 10_000, max: 150_000, step: 1000, format: (v) => money(v) },
  { key: "conversations", label: "Conversations a month", min: 1000, max: 1_000_000, step: 1000, format: (v) => count(v) },
  { key: "growth", label: "Expected volume growth / year", min: 0, max: 50, step: 1, format: (v) => `${v}%` },
  { key: "years", label: "Projection horizon", min: 1, max: 5, step: 1, format: (v) => `${v} ${v === 1 ? "year" : "years"}` },
  { key: "rate", label: "AI auto-handling rate", hint: "BCGame's current cycle runs at 55%", min: 30, max: 70, step: 1, format: (v) => `${v}%` },
];

/** Smallest plan whose monthly allowance covers the AI-handled volume; Enterprise above Growth. */
function planFor(aiMessagesPerMonth: number) {
  return PLANS.find((p) => p.messages !== null && aiMessagesPerMonth <= p.messages) ?? PLANS[3];
}

/**
 * The model, in the open: the team grows with volume; AI closes `rate` of
 * conversations, so that share of the team is freed each year. Plan cost is
 * deducted. Nothing is discounted or compounded beyond the growth input.
 */
function estimate(i: Inputs) {
  const r = i.rate / 100;
  const g = i.growth / 100;
  const years = Array.from({ length: i.years }, (_, k) => {
    const f = Math.pow(1 + g, k);
    const without = i.agents * i.costPerAgent * f;
    const aiVolume = i.conversations * r * f;
    const plan = planFor(aiVolume);
    // Enterprise is quoted, not listed: hold the Growth rate as a conservative stand-in.
    const planCost = (plan.monthly ?? PLANS[2].monthly!) * 12;
    const withAi = without * (1 - r) + planCost;
    return { year: k + 1, without, withAi, saving: without - withAi, plan, aiVolume };
  });
  const first = years[0];
  return {
    years,
    annual: first.saving,
    total: years.reduce((s, y) => s + y.saving, 0),
    freed: Math.round(i.agents * r),
    aiPerYear: first.aiVolume * 12,
    plan: first.plan,
  };
}

/** Eases a number toward its target over ~500ms so live edits count, not jump. */
function useTweened(value: number) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const start = useRef(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    from.current = shown;
    start.current = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start.current) / 520);
      const e = 1 - Math.pow(1 - t, 3);
      setShown(from.current + (value - from.current) * e);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return shown;
}

/* ------------------------------------------------------------- fragments */

function Bullet({ diamond, light = false }: { diamond: boolean; light?: boolean }) {
  return (
    <span
      aria-hidden
      className="mt-[8px] inline-block shrink-0"
      style={{
        width: 6,
        height: 6,
        background: light ? "#FFFFFF" : diamond ? LIME : INK,
        transform: diamond ? "rotate(45deg)" : undefined,
      }}
    />
  );
}

/** Square outline button — the Book a Demo of the plans that aren't the pick. */
function OutlineButton({ label, light = false }: { label: string; light?: boolean }) {
  const color = light ? "#FFFFFF" : INK;
  return (
    <button
      className="inline-flex w-full cursor-pointer items-center justify-center transition-colors"
      style={{
        height: 36,
        gap: 6,
        fontSize: 14,
        lineHeight: "20px",
        color,
        background: "transparent",
        border: `1px solid ${light ? "rgba(255,255,255,0.4)" : INK}`,
        borderRadius: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = light ? "rgba(255,255,255,0.08)" : "#F1F1F3";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {label}
      <DotArrow size={16} className="flex-shrink-0" />
    </button>
  );
}

function BillingToggle({ annual, onChange }: { annual: boolean; onChange: (annual: boolean) => void }) {
  const seg = (on: boolean, label: string, tag?: string) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(label === "Annual")}
      className="relative inline-flex cursor-pointer items-center justify-center transition-colors"
      style={{
        height: 36,
        gap: 10,
        padding: "0 18px",
        fontSize: 14,
        lineHeight: "20px",
        fontWeight: 500,
        color: on ? "#FFFFFF" : MUTED,
        background: on ? INK : "transparent",
        border: "none",
        borderRadius: 0,
        transition: "background 220ms ease, color 220ms ease",
      }}
    >
      {label}
      {tag ? (
        // the saving belongs to this option, so it rides inside the segment
        <span
          className="uppercase"
          style={{
            padding: "0 8px",
            fontSize: 10,
            lineHeight: "18px",
            letterSpacing: "0.06em",
            fontWeight: 500,
            background: LIME,
            color: INK,
          }}
        >
          {tag}
        </span>
      ) : null}
    </button>
  );
  return (
    <div className="inline-flex items-center" style={{ border: `1px solid ${INK}`, padding: 2, gap: 2 }}>
      {seg(!annual, "Monthly")}
      {seg(annual, "Annual", "Save 10%")}
    </div>
  );
}

function PlanCard({ plan, annual, index }: { plan: Plan; annual: boolean; index: number }) {
  const dark = plan.id === "enterprise";
  const pick = plan.id === "growth";
  const ink = dark ? "#FFFFFF" : INK;
  const muted = dark ? "rgba(255,255,255,0.6)" : MUTED;
  const price =
    plan.monthly === null ? null : annual ? Math.round(plan.monthly * (1 - ANNUAL_DISCOUNT)) : plan.monthly;
  return (
    <Reveal y={24} duration={1400} delay={160 + index * 100} className="min-w-0">
      <div
        className="flex h-full flex-col"
        style={{
          padding: fluid(28, 20),
          background: dark ? INK : "#FFFFFF",
          border: `1px solid ${dark ? INK : HAIRLINE}`,
          minHeight: 372,
        }}
      >
        <p className="flex items-center" style={{ margin: 0, gap: 8 }}>
          <span aria-hidden style={{ width: 8, height: 8, background: plan.dot }} />
          <span className="uppercase" style={{ fontSize: 12, lineHeight: "18px", letterSpacing: "0.06em", color: muted }}>
            {plan.name}
          </span>
          {pick ? (
            <span
              className="ml-auto uppercase"
              style={{ padding: "0 8px", fontSize: 10, lineHeight: "18px", letterSpacing: "0.06em", fontWeight: 500, background: LIME, color: INK }}
            >
              Most teams
            </span>
          ) : null}
        </p>

        <div style={{ marginTop: 24, minHeight: 68 }}>
          {price === null ? (
            <p className="font-display" style={{ margin: 0, fontSize: fluid(40, 32), lineHeight: 1.1, fontWeight: 400, color: ink }}>
              Let's talk
            </p>
          ) : (
            <>
              <p className="font-display whitespace-nowrap" style={{ margin: 0, fontSize: fluid(40, 32), lineHeight: 1.1, fontWeight: 400, color: ink }}>
                {money(price)}
                <span style={{ marginLeft: 6, fontSize: 14, color: muted }}>/ mo</span>
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: "18px", color: muted, minHeight: 18 }}>
                {price === 0 ? "No card needed" : annual ? `Billed annually · ${money(price * 12)} / yr` : "Billed monthly"}
              </p>
            </>
          )}
        </div>

        <div aria-hidden style={{ margin: "24px 0", height: 1, background: dark ? "rgba(255,255,255,0.18)" : HAIRLINE }} />

        <ul className="m-0 flex flex-1 list-none flex-col p-0" style={{ gap: 12 }}>
          {plan.features.map((f, i) => (
            <li key={f} className="flex items-start" style={{ gap: 10 }}>
              <Bullet diamond={i % 2 === 0} light={dark} />
              <span style={{ fontSize: 14, lineHeight: "22px", color: ink }}>{f}</span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 28 }}>
          {pick ? (
            <div className="flex [&>button]:w-full">
              <RainbowButton label={plan.cta} />
            </div>
          ) : (
            <OutlineButton label={plan.cta} light={dark} />
          )}
        </div>
      </div>
    </Reveal>
  );
}

/* --------------------------------------------------------- calculator */

function KnobRow({ knob, value, onChange }: { knob: Knob; value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const pct = ((value - knob.min) / (knob.max - knob.min)) * 100;
  const commit = () => {
    if (editing === null) return;
    const n = Number(editing.replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(n)) onChange(Math.min(knob.max, Math.max(knob.min, Math.round(n / knob.step) * knob.step)));
    setEditing(null);
  };
  return (
    <div>
      <div className="flex items-baseline justify-between" style={{ gap: 16 }}>
        <label htmlFor={`knob-${knob.key}`} style={{ fontSize: 14, lineHeight: "22px", color: INK }}>
          {knob.label}
        </label>
        {/* the value is typed as readily as it is dragged */}
        <input
          aria-label={`${knob.label} value`}
          className="font-display text-right"
          value={editing ?? knob.format(value)}
          onFocus={() => setEditing(String(value))}
          onChange={(e) => setEditing(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          style={{
            width: 132,
            height: 28,
            padding: "0 8px",
            fontSize: 18,
            lineHeight: "28px",
            color: INK,
            background: "transparent",
            border: `1px solid ${editing !== null ? INK : "transparent"}`,
            borderRadius: 0,
            outline: "none",
            transition: "border-color 160ms ease",
          }}
        />
      </div>
      <input
        id={`knob-${knob.key}`}
        type="range"
        className="calc-range"
        min={knob.min}
        max={knob.max}
        step={knob.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--p": `${pct}%`, marginTop: 4 } as React.CSSProperties}
      />
      {knob.hint ? (
        <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "18px", color: FAINT }}>{knob.hint}</p>
      ) : null}
    </div>
  );
}

/** Year-by-year bars: support labour without Synergy vs with it (plan cost included). */
function YearBars({ years }: { years: ReturnType<typeof estimate>["years"] }) {
  const max = Math.max(...years.map((y) => y.without));
  return (
    <div>
      <div className="flex items-end" style={{ gap: fluid(20, 12), height: 120 }}>
        {years.map((y) => (
          <div key={y.year} className="flex flex-1 flex-col items-stretch justify-end" style={{ gap: 6, height: "100%" }}>
            <div className="flex flex-1 items-end" style={{ gap: 4 }}>
              <span
                className="block flex-1"
                style={{ height: `${(y.without / max) * 100}%`, background: "rgba(255,255,255,0.22)", transition: "height 520ms cubic-bezier(0.22,1,0.36,1)" }}
              />
              <span
                className="block flex-1"
                style={{ height: `${Math.max(2, (y.withAi / max) * 100)}%`, background: LIME, transition: "height 520ms cubic-bezier(0.22,1,0.36,1)" }}
              />
            </div>
            <span className="text-center" style={{ fontSize: 11, lineHeight: "16px", color: "rgba(255,255,255,0.55)" }}>
              Y{y.year}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center" style={{ gap: 16, marginTop: 10, fontSize: 11, lineHeight: "16px", color: "rgba(255,255,255,0.55)" }}>
        <span className="inline-flex items-center" style={{ gap: 6 }}>
          <span aria-hidden style={{ width: 8, height: 8, background: "rgba(255,255,255,0.22)" }} /> Support labour today
        </span>
        <span className="inline-flex items-center" style={{ gap: 6 }}>
          <span aria-hidden style={{ width: 8, height: 8, background: LIME }} /> With Synergy, plan included
        </span>
      </div>
    </div>
  );
}

function Calculator() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const result = useMemo(() => estimate(inputs), [inputs]);
  const annual = useTweened(result.annual);
  const total = useTweened(result.total);
  const set = (key: keyof Inputs) => (v: number) => setInputs((s) => ({ ...s, [key]: v }));

  return (
    <div className="grid md:grid-cols-[1fr_440px]" style={{ background: "#FFFFFF", border: `1px solid ${HAIRLINE}` }}>
      {/* inputs */}
      <div className="flex flex-col" style={{ padding: fluid(40, 24), gap: fluid(28, 20) }}>
        {KNOBS.map((k) => (
          <KnobRow key={k.key} knob={k} value={inputs[k.key]} onChange={set(k.key)} />
        ))}
        <button
          type="button"
          className="self-start cursor-pointer"
          onClick={() => setInputs(DEFAULTS)}
          style={{ padding: 0, background: "none", border: "none", fontSize: 12, lineHeight: "18px", color: FAINT, textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          Reset to the BCGame example
        </button>
      </div>

      {/* estimate */}
      <div className="flex flex-col" style={{ padding: fluid(40, 24), background: INK, color: "#FFFFFF", gap: 28 }}>
        <p className="flex items-center" style={{ margin: 0, gap: 8 }}>
          <span aria-hidden style={{ width: 8, height: 8, background: LIME }} />
          <span className="uppercase" style={{ fontSize: 12, lineHeight: "18px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.6)" }}>
            Your estimate
          </span>
        </p>

        <div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: "22px", color: "rgba(255,255,255,0.6)" }}>Saved in year one</p>
          <p className="font-display whitespace-nowrap" style={{ margin: "6px 0 0", fontSize: fluid(56, 40), lineHeight: 1.05, fontWeight: 400 }}>
            {money(annual)}
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: "22px", color: "rgba(255,255,255,0.6)" }}>
            {compact(total)} over {inputs.years} {inputs.years === 1 ? "year" : "years"}, after the {result.plan.name} plan
          </p>
        </div>

        <div aria-hidden style={{ height: 1, background: "rgba(255,255,255,0.18)" }} />

        <ul className="m-0 flex list-none flex-col p-0" style={{ gap: 14 }}>
          {[
            [`${result.freed} of ${inputs.agents} agents`, "freed for monitoring, VIP and fallback"],
            [`${count(result.aiPerYear)} conversations / yr`, "closed by AI end to end"],
            [result.plan.monthly === null ? "Enterprise" : `${result.plan.name} · ${money(result.plan.monthly)} / mo`, result.plan.monthly === null ? "quoted for your volume" : "plan that covers your AI volume"],
          ].map(([v, l]) => (
            <li key={l} style={{ fontSize: 13, lineHeight: "20px" }}>
              <span className="block" style={{ color: "#FFFFFF", fontWeight: 500 }}>{v}</span>
              <span className="block" style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: "18px" }}>{l}</span>
            </li>
          ))}
        </ul>

        <YearBars years={result.years} />

        <div className="mt-auto flex [&>button]:w-full">
          <RainbowButton label="Book a Demo" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const pad = `0 ${fluid(120, 24)}`;

  return (
    <div className="why-synergy relative min-h-screen bg-paper">
      <SiteNav revealDelay={0} solid />

      {/* ------------------------------------------------------------ hero */}
      <header className="relative overflow-hidden">
        <HeroDots />
        <div className="relative" style={{ padding: pad }}>
          <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center text-center" style={{ paddingTop: fluid(140, 96) }}>
            <Reveal immediate className="flex items-center gap-2">
              <span aria-hidden style={{ width: 8, height: 8, background: LIME }} />
              <span className="uppercase" style={{ fontSize: 14, lineHeight: "22px", color: MUTED }}>
                Pricing
              </span>
            </Reveal>
            <Reveal immediate delay={120}>
              <GradientHoverHeading
                as="h1"
                className="font-display text-ink"
                text={"Choose the plan that's\nright for you"}
                breakFrom="md"
                style={{ margin: "16px 0 0", fontSize: fluid(54, 34), lineHeight: 1.15, fontWeight: 500 }}
              />
            </Reveal>
            <Reveal immediate delay={240}>
              <p style={{ margin: "16px 0 0", fontSize: fluid(18, 15), lineHeight: 1.5, color: MUTED }}>
                Transparent pricing that scales with your business.
              </p>
            </Reveal>
            <Reveal immediate delay={360} style={{ marginTop: fluid(40, 28) }}>
              <BillingToggle annual={annual} onChange={setAnnual} />
            </Reveal>
          </div>

          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16, marginTop: fluid(56, 36), paddingBottom: fluid(120, 64) }}>
            {PLANS.map((p, i) => (
              <PlanCard key={p.id} plan={p} annual={annual} index={i} />
            ))}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------ calculator */}
      <section style={{ borderTop: `1px solid ${HAIRLINE}`, background: "#FAFAFA" }}>
        <div style={{ padding: `${fluid(100, 56)} ${fluid(120, 24)} ${fluid(120, 64)}` }}>
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between" style={{ gap: 24 }}>
              <Reveal y={24} duration={1600}>
                <h2 className="font-display text-ink" style={{ margin: 0, fontSize: fluid(44, 30), lineHeight: 1.2273, fontWeight: 400 }}>
                  <BreakLines text={"See how much\nyou could save"} />
                </h2>
              </Reveal>
              <Reveal y={24} duration={1600} delay={120}>
                <p style={{ margin: 0, maxWidth: 480, fontSize: 14, lineHeight: "24px", color: MUTED }}>
                  Drag or type. The model is in the open: your team grows with volume, AI closes its share of conversations end to end, and the plan that covers that volume is already deducted.
                </p>
              </Reveal>
            </div>
            <Reveal y={32} duration={1600} delay={200} style={{ marginTop: fluid(48, 32) }}>
              <Calculator />
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter cta={false} />
      <FinChatDock alwaysVisible />
    </div>
  );
}

export default PricingPage;
