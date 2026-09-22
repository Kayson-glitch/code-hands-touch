import { useState } from "react";
import { toolGap } from "../content";
import { Frame, ScanHeading, Section, SectionHeader } from "../components/primitives";
import { useInView } from "../hooks";

function FailCard({
  card,
  n,
  delay,
}: {
  card: (typeof toolGap.cards)[number];
  n: number;
  delay: number;
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.25 });
  const [hover, setHover] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(28px)",
        transition: `opacity 800ms var(--fh-ease-out) ${delay}ms, transform 800ms var(--fh-ease-out) ${delay}ms`,
      }}
    >
      <Frame lit={hover} className="fh-card h-full p-6 lg:p-7">
        <div className="flex items-baseline justify-between gap-4">
          <span className="fh-mono text-[color:var(--fh-ink-ghost)]">
            {String(n).padStart(2, "0")}
          </span>
          {/* Coverage meter — every one of these reads zero on payment proof,
              which is the section's whole argument stated as a gauge. */}
          <span className="flex items-center gap-2">
            <span className="fh-mono text-[9px] text-[color:var(--fh-ink-ghost)]">
              PAYMENT PROOF
            </span>
            <span className="relative block h-1 w-14 bg-[color:var(--fh-line)]">
              <span
                className="absolute inset-y-0 left-0 bg-[color:var(--fh-forged)]"
                style={{
                  width: inView ? "6%" : "0%",
                  transition: `width 900ms var(--fh-ease-out) ${delay + 400}ms`,
                }}
              />
            </span>
          </span>
        </div>

        <h3 className="fh-h3 mt-5">{card.title}</h3>
        <p className="fh-mono mt-2 text-[color:var(--fh-ink-faint)]">{card.subtitle}</p>

        <ul className="mt-6 space-y-0">
          {card.items.map((item, i) => (
            <li
              key={item}
              className="flex gap-3 border-t border-[color:var(--fh-line)] py-3 text-[0.875rem] leading-[1.5] text-[color:var(--fh-ink-dim)]"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "none" : "translateX(-8px)",
                transition: `opacity 600ms var(--fh-ease-out) ${delay + 260 + i * 90}ms, transform 600ms var(--fh-ease-out) ${delay + 260 + i * 90}ms`,
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
                aria-hidden
                className="mt-[5px] shrink-0"
              >
                <path
                  d="M1 1l9 9M10 1l-9 9"
                  stroke="var(--fh-forged)"
                  strokeWidth="1.3"
                  opacity="0.85"
                />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </Frame>
    </div>
  );
}

export function ToolGap() {
  const [quoteRef, quoteInView] = useInView<HTMLDivElement>({ threshold: 0.4 });

  return (
    <Section id="tool-gap" className="border-t border-[color:var(--fh-line)]">
      <div className="fh-shell">
        <SectionHeader index={toolGap.index} label={toolGap.label} />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ScanHeading className="fh-h2 max-w-[20ch]">{toolGap.title}</ScanHeading>
          </div>
          <div className="lg:col-span-5 lg:pt-2">
            <p className="fh-body">{toolGap.description}</p>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {toolGap.cards.map((card, i) => (
            <FailCard key={card.id} card={card} n={i + 1} delay={i * 120} />
          ))}
        </div>

        {/* The pivot. Two questions set against each other: the one the market
            answers, struck through, and the one that actually matters. */}
        <div ref={quoteRef} className="mt-20 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="space-y-5">
              <p className="fh-h3 font-normal text-[color:var(--fh-ink-faint)]">
                {toolGap.quote.beforeIdentity}{" "}
                <span className="relative inline-block">
                  <span className="italic">{toolGap.quote.identity}</span>
                  <span
                    className="absolute left-0 top-1/2 h-px w-full origin-left bg-[color:var(--fh-forged)]"
                    style={{
                      transform: `scaleX(${quoteInView ? 1 : 0})`,
                      transition: "transform 760ms var(--fh-ease-out) 320ms",
                    }}
                  />
                </span>
              </p>
              <p className="fh-h3 font-normal">
                {toolGap.quote.between}{" "}
                <span className="relative inline-block italic text-[color:var(--fh-acid)]">
                  {toolGap.quote.transaction}
                  <span
                    className="absolute -bottom-1 left-0 h-px w-full origin-left bg-[color:var(--fh-acid)]"
                    style={{
                      transform: `scaleX(${quoteInView ? 1 : 0})`,
                      transition: "transform 760ms var(--fh-ease-out) 700ms",
                    }}
                  />
                </span>
              </p>
            </div>
          </div>
          <div className="lg:col-span-5">
            <p className="fh-body">{toolGap.quote.after}</p>
            <p className="fh-mono mt-6 text-[color:var(--fh-ink-ghost)]">— {toolGap.footnote}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
