import { useState } from "react";
import { pricing } from "../content";
import {
  Button,
  Counter,
  Frame,
  ScanHeading,
  Section,
  SectionHeader,
} from "../components/primitives";
import { useInView } from "../hooks";

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.12 });

  const factor = annual ? 1 - pricing.annualDiscount : 1;

  return (
    <Section id="pricing" className="border-t border-[color:var(--fh-line)]">
      <div className="fh-shell">
        <SectionHeader index={pricing.index} label={pricing.label} />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ScanHeading className="fh-h2 max-w-[20ch]">{pricing.title}</ScanHeading>
          </div>
          <div className="lg:col-span-5 lg:pt-2">
            <p className="fh-body">{pricing.description}</p>

            {/* Term switch. Flipping it re-counts every price rather than
                swapping the strings, so the discount is something you watch
                happen. */}
            <div className="mt-7 inline-flex border border-[color:var(--fh-line)]">
              {(["Monthly", "Annual −10%"] as const).map((label, i) => {
                const on = (i === 1) === annual;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setAnnual(i === 1)}
                    aria-pressed={on}
                    className="fh-label px-4 py-2.5 transition-colors duration-300"
                    style={{
                      background: on ? "var(--fh-acid)" : "transparent",
                      color: on ? "#0a0a0b" : "var(--fh-ink-faint)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div ref={ref} className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pricing.plans.map((plan, i) => {
            const lit = hovered === plan.id || (hovered === null && plan.featured);
            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHovered(plan.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "none" : "translateY(26px)",
                  transition: `opacity 700ms var(--fh-ease-out) ${i * 90}ms, transform 700ms var(--fh-ease-out) ${i * 90}ms`,
                }}
              >
                <Frame
                  lit={lit}
                  className="flex h-full flex-col bg-[color:var(--fh-surface)] p-6 transition-colors duration-500"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-px origin-left bg-[color:var(--fh-acid)]"
                    style={{
                      transform: `scaleX(${lit ? 1 : 0})`,
                      transition: "transform 560ms var(--fh-ease-out)",
                    }}
                  />
                  <span
                    className="fh-label self-start border px-2 py-1"
                    style={{
                      borderColor: lit ? "var(--fh-acid)" : "var(--fh-line)",
                      color: lit ? "var(--fh-acid)" : "var(--fh-ink-faint)",
                      transition: "color 400ms, border-color 400ms",
                    }}
                  >
                    {plan.name}
                  </span>

                  <div className="fh-figure mt-7 flex items-baseline gap-1">
                    {plan.monthly === null ? (
                      <span className="text-[1.75rem] font-semibold tracking-[-0.022em]">
                        {pricing.letsTalk}
                      </span>
                    ) : (
                      <>
                        <span className="text-[1.5rem] font-normal text-[color:var(--fh-ink-faint)]">
                          $
                        </span>
                        {/* Keyed on the term so the digits re-run on switch. */}
                        <Counter
                          key={annual ? "a" : "m"}
                          value={Math.round(plan.monthly * factor)}
                          duration={700}
                          className="text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-none tracking-[-0.028em]"
                        />
                        <span className="text-[1.0625rem] font-medium text-[color:var(--fh-ink-faint)]">
                          {pricing.perMonth}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-6 space-y-2 border-t border-[color:var(--fh-line)] pt-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="fh-label text-[color:var(--fh-ink-ghost)]">Credits</span>
                      <span className="fh-figure text-[0.8125rem]">{plan.credits}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="fh-label text-[color:var(--fh-ink-ghost)]">Per credit</span>
                      <span
                        className="fh-figure text-[0.8125rem]"
                        style={{ color: lit ? "var(--fh-acid)" : undefined }}
                      >
                        ${(plan.perCredit * factor).toFixed(4).replace(/0+$/, "")}
                        {plan.monthly === null ? "+" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-7">
                    <Button
                      href="#next-step"
                      variant={plan.featured ? "primary" : "ghost"}
                      className="w-full !justify-center"
                      arrow={false}
                    >
                      {plan.monthly === null ? "Contact sales" : "Start POC"}
                    </Button>
                  </div>
                </Frame>
              </div>
            );
          })}
        </div>

        {/* Unit-price table. Hovering a plan above lights its row here, so the
            headline price and what it actually buys stay tied together. */}
        <div className="mt-14">
          <h3 className="fh-h3">{pricing.tableTitle}</h3>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr>
                  {pricing.tableHeaders.map((h) => (
                    <th
                      key={h}
                      className="fh-label border-b border-[color:var(--fh-line)] px-3 py-3 text-left text-[color:var(--fh-ink-ghost)] first:pl-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricing.plans.map((plan) => {
                  const lit = hovered === plan.id;
                  return (
                    <tr
                      key={plan.id}
                      onMouseEnter={() => setHovered(plan.id)}
                      onMouseLeave={() => setHovered(null)}
                      className="transition-colors duration-300"
                      style={{ background: lit ? "var(--fh-surface)" : undefined }}
                    >
                      <td
                        className="fh-label border-b border-[color:var(--fh-line)] px-3 py-3.5 first:pl-0"
                        style={{ color: lit ? "var(--fh-acid)" : "var(--fh-ink)" }}
                      >
                        {plan.name}
                      </td>
                      {(["image", "pdf", "video7d", "video30d"] as const).map((k) => (
                        <td
                          key={k}
                          className="fh-figure border-b border-[color:var(--fh-line)] px-3 py-3.5 text-[0.8125rem] text-[color:var(--fh-ink-dim)]"
                        >
                          {plan.perCheck[k]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="fh-body mt-8 max-w-[80ch] text-[0.8125rem] text-[color:var(--fh-ink-faint)]">
            {pricing.footnote}
          </p>
        </div>
      </div>
    </Section>
  );
}
