import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";
import { DotArrow } from "@/components/DotArrow";
import { BreakLines, HeroDots, RainbowButton } from "@/components/ProductHero";
import { CropFrame } from "@/components/CropFrame";
import { fluid } from "@/lib/fluid";

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


const INK = "#0E0B22";
const MUTED = "#7A7885";
const FAINT = "#A1A0A9";
const LIME = "#D1E486";
/** The page's own accent — the amber the site leads with. */
const ACCENT = "#EBA753";

/**
 * Surfaces and rules. Contrast is carried by layered paper and rules at low
 * alpha rather than black-on-white blocks: three paper values, two rule
 * weights, and a warm graphite for the inverted panels instead of #000.
 */
const SURFACE = "#FFFFFF";
const SURFACE_SOFT = "#F6F6F8";
const RULE = "rgba(14, 11, 34, 0.10)";
const RULE_SOFT = "rgba(14, 11, 34, 0.06)";
/** The estimate panel: one step darker than the section, still paper. */
const PANEL = "#ECECEF";

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

/**
 * The volume a plan covers and its rate now sit in the card's metric strip, so
 * the feature list carries only what separates one plan from the one below it.
 */
const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    dot: "#C6C5CB",
    monthly: 0,
    messages: 10_000,
    features: ["Web chat channel", "Community support", "AI message volume add-on"],
    cta: "Book a Demo",
  },
  {
    id: "basic",
    name: "Basic",
    dot: "#8CE0FF",
    monthly: 1500,
    messages: 100_000,
    features: ["Chat, email and in-app", "Standard support SLA", "AI message volume add-on"],
    cta: "Book a Demo",
  },
  {
    id: "growth",
    name: "Growth",
    dot: LIME,
    monthly: 15000,
    messages: 1_000_000,
    features: ["Analytics and quality scoring", "Priority support SLA", "AI message volume add-on"],
    cta: "Book a Demo",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    dot: ACCENT,
    monthly: null,
    messages: null,
    features: ["Private deployment · on-site FDE", "SSO, audit log, data residency", "Named support engineer"],
    cta: "Contact us",
  },
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

function Bullet({ diamond, accent }: { diamond: boolean; accent: string }) {
  return (
    <span
      aria-hidden
      className="mt-[8px] inline-block shrink-0"
      style={{
        width: 5,
        height: 5,
        background: diamond ? accent : "rgba(14, 11, 34, 0.35)",
        transform: diamond ? "rotate(45deg)" : undefined,
      }}
    />
  );
}

/**
 * Numbered section label — "01 / PRICING". The number carries the sequence so
 * the eye can place a section without reading the heading.
 */
function SectionLabel({ index, label, accent }: { index: string; label: string; accent?: string }) {
  return (
    <p className="flex items-center" style={{ margin: 0, gap: 10 }}>
      {accent ? <span aria-hidden style={{ width: 6, height: 6, background: accent }} /> : null}
      <span
        className="uppercase"
        style={{ fontSize: 11, lineHeight: "18px", letterSpacing: "0.14em", color: FAINT }}
      >
        {index}
      </span>
      <span aria-hidden style={{ width: 1, height: 10, background: RULE }} />
      <span
        className="uppercase"
        style={{ fontSize: 11, lineHeight: "18px", letterSpacing: "0.14em", color: MUTED }}
      >
        {label}
      </span>
    </p>
  );
}

/** Square outline button — the Book a Demo of the plans that aren't the pick. */
function OutlineButton({ label }: { label: string }) {
  return (
    <button
      className="inline-flex w-full cursor-pointer items-center justify-center transition-colors"
      style={{
        height: 36,
        gap: 6,
        fontSize: 14,
        lineHeight: "20px",
        color: INK,
        background: "transparent",
        border: `1px solid rgba(14, 11, 34, 0.22)`,
        borderRadius: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(14, 11, 34, 0.04)";
        e.currentTarget.style.borderColor = "rgba(14, 11, 34, 0.45)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "rgba(14, 11, 34, 0.22)";
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
        height: 34,
        gap: 10,
        padding: "0 18px",
        fontSize: 14,
        lineHeight: "20px",
        fontWeight: 500,
        color: on ? INK : MUTED,
        // the selected side lifts to paper instead of inverting to a black chip
        background: on ? SURFACE : "transparent",
        border: `1px solid ${on ? RULE : "transparent"}`,
        borderRadius: 0,
        transition: "background 220ms ease, color 220ms ease, border-color 220ms ease",
      }}
    >
      {label}
      {tag ? (
        // the saving belongs to this option, so it rides inside the segment
        <span
          className="uppercase"
          style={{
            padding: "0 7px",
            fontSize: 10,
            lineHeight: "17px",
            letterSpacing: "0.1em",
            fontWeight: 500,
            background: "rgba(235, 167, 83, 0.14)",
            color: "#9A6516",
          }}
        >
          {tag}
        </span>
      ) : null}
    </button>
  );
  return (
    <div
      className="inline-flex items-center"
      style={{ border: `1px solid ${RULE}`, background: SURFACE_SOFT, padding: 3, gap: 3 }}
    >
      {seg(!annual, "Monthly")}
      {seg(annual, "Annual", "Save 10%")}
    </div>
  );
}

/** Registration mark, as on the page frames: a square straddling a corner. */
function CornerMark({ x, y, shown }: { x: "left" | "right"; y: "top" | "bottom"; shown: boolean }) {
  return (
    <span
      aria-hidden
      className="absolute"
      style={{
        [x]: -3.5,
        [y]: -3.5,
        width: 6,
        height: 6,
        background: SURFACE_SOFT,
        border: `1px solid rgba(14, 11, 34, 0.22)`,
        opacity: shown ? 1 : 0,
        transition: "opacity 220ms ease",
      }}
    />
  );
}

function PlanCard({ plan, annual, index }: { plan: Plan; annual: boolean; index: number }) {
  const pick = plan.id === "growth";
  const [hover, setHover] = useState(false);
  const price =
    plan.monthly === null ? null : annual ? Math.round(plan.monthly * (1 - ANNUAL_DISCOUNT)) : plan.monthly;
  // The rate behind the price, so every card carries a second, comparable figure.
  const perThousand =
    price && plan.messages ? (price / (plan.messages / 1000)).toFixed(2) : null;
  return (
    <Reveal y={24} duration={1400} delay={160 + index * 100} className="min-w-0">
      <div
        className="relative flex h-full flex-col"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          padding: fluid(28, 20),
          // Every card rests on paper; hovering lifts it onto the softer
          // surface and puts the registration marks on its corners.
          background: hover ? SURFACE_SOFT : SURFACE,
          border: `1px solid ${hover ? "rgba(14, 11, 34, 0.18)" : RULE}`,
          minHeight: 372,
          transition: "background 220ms ease, border-color 220ms ease",
        }}
      >
        <CornerMark x="left" y="top" shown={hover} />
        <CornerMark x="right" y="top" shown={hover} />
        <CornerMark x="left" y="bottom" shown={hover} />
        <CornerMark x="right" y="bottom" shown={hover} />

        <p className="flex items-center" style={{ margin: 0, gap: 8 }}>
          <span aria-hidden style={{ width: 8, height: 8, background: plan.dot }} />
          <span className="uppercase" style={{ fontSize: 11, lineHeight: "18px", letterSpacing: "0.14em", color: MUTED }}>
            {plan.name}
          </span>
          {pick ? (
            <span
              className="ml-auto uppercase"
              style={{
                padding: "0 7px",
                fontSize: 10,
                lineHeight: "17px",
                letterSpacing: "0.1em",
                fontWeight: 500,
                background: "rgba(235, 167, 83, 0.14)",
                color: "#9A6516",
              }}
            >
              Most teams
            </span>
          ) : null}
        </p>

        <div style={{ marginTop: 22, minHeight: 74 }}>
          {price === null ? (
            <>
              <p className="font-display" style={{ margin: 0, fontSize: fluid(40, 32), lineHeight: 1.1, fontWeight: 400, color: INK }}>
                Custom
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: "18px", color: MUTED }}>
                Quoted on your volume
              </p>
            </>
          ) : (
            <>
              <p className="font-display whitespace-nowrap" style={{ margin: 0, fontSize: fluid(40, 32), lineHeight: 1.1, fontWeight: 400, color: INK }}>
                {money(price)}
                <span style={{ marginLeft: 6, fontSize: 14, color: FAINT }}>/ mo</span>
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: "18px", color: MUTED }}>
                {price === 0 ? "No card needed" : annual ? `Billed annually · ${money(price * 12)} / yr` : "Billed monthly"}
              </p>
            </>
          )}
        </div>

        {/* Metric strip: the volume the plan covers and the rate behind it. */}
        <div
          className="flex items-center justify-between uppercase"
          style={{
            margin: "0 0 16px",
            padding: "12px 0",
            borderTop: `1px solid ${RULE_SOFT}`,
            borderBottom: `1px solid ${RULE_SOFT}`,
            gap: 10,
            fontSize: 10,
            lineHeight: "16px",
            letterSpacing: "0.12em",
          }}
        >
          <span style={{ color: MUTED }}>
            {plan.messages ? `${count(plan.messages)} messages / mo` : "Unlimited messages"}
          </span>
          <span style={{ color: FAINT }}>
            {perThousand ? `$${perThousand} / 1k` : price === 0 ? "Free" : "On request"}
          </span>
        </div>

        <ul className="m-0 flex flex-1 list-none flex-col p-0" style={{ gap: 12 }}>
          {plan.features.map((f, i) => (
            <li key={f} className="flex items-start" style={{ gap: 10 }}>
              <Bullet diamond={i % 2 === 0} accent={plan.dot} />
              <span style={{ fontSize: 14, lineHeight: "22px", color: i === 0 ? INK : MUTED }}>{f}</span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 28 }}>
          {pick ? (
            <div className="flex [&>button]:w-full">
              <RainbowButton label={plan.cta} />
            </div>
          ) : (
            <OutlineButton label={plan.cta} />
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
                style={{
                  height: `${(y.without / max) * 100}%`,
                  // the baseline is a hairline-framed ghost, not a solid block
                  background: "rgba(14, 11, 34, 0.05)",
                  borderTop: `1px solid rgba(14, 11, 34, 0.22)`,
                  transition: "height 520ms cubic-bezier(0.22,1,0.36,1)",
                }}
              />
              <span
                className="block flex-1"
                style={{
                  height: `${Math.max(2, (y.withAi / max) * 100)}%`,
                  background: `linear-gradient(180deg, ${ACCENT} 0%, rgba(235,167,83,0.45) 100%)`,
                  transition: "height 520ms cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <span className="text-center uppercase" style={{ fontSize: 10, lineHeight: "16px", letterSpacing: "0.12em", color: FAINT }}>
              Y{y.year}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center" style={{ gap: 16, marginTop: 12, fontSize: 11, lineHeight: "16px", color: FAINT }}>
        <span className="inline-flex items-center" style={{ gap: 6 }}>
          <span aria-hidden style={{ width: 6, height: 6, background: "rgba(14, 11, 34, 0.22)" }} /> Support labour today
        </span>
        <span className="inline-flex items-center" style={{ gap: 6 }}>
          <span aria-hidden style={{ width: 6, height: 6, background: ACCENT }} /> With Synergy, plan included
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
    <div className="grid lg:grid-cols-[1fr_440px]" style={{ background: SURFACE, border: `1px solid ${RULE}` }}>
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

      {/* estimate — a darker sheet of the same paper, with a rule dividing it
          off the inputs, instead of an inverted panel */}
      <div
        className="flex flex-col"
        style={{
          padding: fluid(40, 24),
          background: PANEL,
          color: INK,
          gap: 26,
          borderLeft: `1px solid ${RULE}`,
        }}
      >
        <p className="flex items-center" style={{ margin: 0, gap: 10 }}>
          <span aria-hidden style={{ width: 6, height: 6, background: ACCENT }} />
          <span className="uppercase" style={{ fontSize: 11, lineHeight: "18px", letterSpacing: "0.14em", color: MUTED }}>
            Your estimate
          </span>
        </p>

        <div>
          <p className="uppercase" style={{ margin: 0, fontSize: 10, lineHeight: "16px", letterSpacing: "0.12em", color: FAINT }}>
            Saved in year one
          </p>
          <p className="font-display whitespace-nowrap" style={{ margin: "10px 0 0", fontSize: fluid(56, 40), lineHeight: 1.05, fontWeight: 400 }}>
            {money(annual)}
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: "20px", color: MUTED }}>
            {compact(total)} over {inputs.years} {inputs.years === 1 ? "year" : "years"}, after the {result.plan.name} plan
          </p>
        </div>

        <div aria-hidden style={{ height: 1, background: RULE }} />

        <ul className="m-0 flex list-none flex-col p-0" style={{ gap: 0 }}>
          {[
            [`${result.freed} of ${inputs.agents} agents`, "freed for monitoring, VIP and fallback"],
            [`${count(result.aiPerYear)} conversations / yr`, "closed by AI end to end"],
            [result.plan.monthly === null ? "Enterprise" : `${result.plan.name} · ${money(result.plan.monthly)} / mo`, result.plan.monthly === null ? "quoted for your volume" : "plan that covers your AI volume"],
          ].map(([v, l], i) => (
            // rows divided by hairlines, so the panel reads as a statement of record
            <li
              key={l}
              style={{
                fontSize: 13,
                lineHeight: "20px",
                padding: i === 0 ? "0 0 12px" : "12px 0",
                borderTop: i === 0 ? "none" : `1px solid ${RULE_SOFT}`,
              }}
            >
              <span className="block" style={{ color: INK, fontWeight: 500 }}>{v}</span>
              <span className="block" style={{ color: MUTED, fontSize: 12, lineHeight: "18px" }}>{l}</span>
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
          <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center text-center" style={{ paddingTop: fluid(160, 104) }}>
            <Reveal immediate>
              <SectionLabel index="01" label="Pricing" accent={ACCENT} />
            </Reveal>
            <Reveal immediate delay={120}>
              <GradientHoverHeading
                as="h1"
                className="font-display text-ink"
                text={"Choose the plan that's\nright for you"}
                breakFrom="md"
                style={{ margin: "16px 0 0", fontSize: fluid(60, 36), lineHeight: 1.1, fontWeight: 400 }}
              />
            </Reveal>
            <Reveal immediate delay={240}>
              <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: "24px", color: MUTED }}>
                Transparent pricing that scales with your business.
              </p>
            </Reveal>
            <Reveal immediate delay={360} style={{ marginTop: fluid(40, 28) }}>
              <BillingToggle annual={annual} onChange={setAnnual} />
            </Reveal>
          </div>

          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16, marginTop: fluid(56, 36), paddingBottom: fluid(96, 56) }}>
            {PLANS.map((p, i) => (
              <PlanCard key={p.id} plan={p} annual={annual} index={i} />
            ))}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------ calculator */}
      <section className="relative" style={{ borderTop: `1px solid ${RULE_SOFT}`, background: SURFACE_SOFT }}>
        {/* the Platform module's crop frame: rules inset from the section
            edges, corner squares, ticks fading out to the viewport */}
        {/* the frame stands further off top and bottom, so a band of the
            section's own ground reads as the gap around it */}
        <CropFrame
          inset={fluid(60, 16)}
          insetTop={fluid(96, 40)}
          insetBottom={fluid(96, 40)}
          rule={RULE}
          mark={SURFACE_SOFT}
        />
        <div className="relative" style={{ padding: `${fluid(184, 96)} ${fluid(120, 24)} ${fluid(192, 112)}` }}>
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between" style={{ gap: 24 }}>
              <Reveal y={24} duration={1600}>
                <SectionLabel index="02" label="Savings" accent={ACCENT} />
                <h2
                  className="font-display text-ink"
                  style={{ margin: "18px 0 0", fontSize: fluid(48, 30), lineHeight: 1.1667, fontWeight: 400 }}
                >
                  <BreakLines text={"See how much\nyou could save"} />
                </h2>
              </Reveal>
              <Reveal y={24} duration={1600} delay={120}>
                <p style={{ margin: 0, maxWidth: 480, fontSize: 14, lineHeight: "22px", color: MUTED }}>
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
