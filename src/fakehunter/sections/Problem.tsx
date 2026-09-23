import { useState } from "react";
import { problem } from "../content";
import { Counter, Frame, ScanHeading, Section, SectionHeader } from "../components/primitives";
import { Marquee } from "../components/Marquee";
import { useInView } from "../hooks";

export function Problem() {
  const [open, setOpen] = useState<string | null>(problem.scenarios[0].id);
  const [lossRef, lossInView] = useInView<HTMLDivElement>({ threshold: 0.45 });

  return (
    <Section id="problem" className="border-t border-[color:var(--fh-line)]">
      <div className="fh-shell">
        <SectionHeader index={problem.index} label={problem.label} />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ScanHeading className="fh-h2 max-w-[18ch]">{problem.title}</ScanHeading>
          </div>
          <div className="lg:col-span-5 lg:pt-2">
            <p className="fh-body">
              {problem.description}{" "}
              <em className="not-italic text-[color:var(--fh-ink)]">{problem.descriptionAccent}</em>
            </p>
          </div>
        </div>
      </div>

      {/* Full-bleed band of techniques. It breaks the container on purpose:
          the list has no end, and neither does the band. */}
      <div className="relative my-16 border-y border-[color:var(--fh-line)] py-4">
        <Marquee items={problem.techniques} />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[18vw]"
          style={{ background: "linear-gradient(90deg, var(--fh-bg) 20%, transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[18vw]"
          style={{ background: "linear-gradient(270deg, var(--fh-bg) 20%, transparent)" }}
        />
      </div>

      <div className="fh-shell">
        {/* The number. Counting both ends of the range at once makes the
            uncertainty itself visible — nobody knows the real figure. */}
        <Frame className="border border-[color:var(--fh-line)] bg-[color:var(--fh-surface)] p-[clamp(1.5rem,3.5vw,3rem)]">
          <div ref={lossRef} className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="lg:col-span-6">
              <div className="fh-figure flex items-baseline text-[clamp(3rem,9vw,7rem)] font-semibold leading-none tracking-[-0.022em]">
                <span className="text-[0.42em] font-normal text-[color:var(--fh-ink-faint)]">
                  {problem.lossRange.currency}
                </span>
                <Counter value={problem.lossRange.from} duration={1500} />
                <span className="text-[0.42em] font-normal">{problem.lossRange.unit}</span>
                <span
                  className="mx-[0.12em] text-[0.4em] font-normal text-[color:var(--fh-acid)]"
                  style={{
                    opacity: lossInView ? 1 : 0,
                    transition: "opacity 600ms var(--fh-ease-out) 700ms",
                  }}
                >
                  –
                </span>
                <span className="text-[0.42em] font-normal text-[color:var(--fh-ink-faint)]">
                  {problem.lossRange.currency}
                </span>
                <Counter value={problem.lossRange.to} duration={1900} />
                <span className="text-[0.42em] font-normal">{problem.lossRange.unit}</span>
              </div>
              <p className="fh-label mt-4 text-[color:var(--fh-ink-faint)]">{problem.lossLabel}</p>
            </div>

            <div className="lg:col-span-6">
              <p className="fh-body border-l border-[color:var(--fh-acid)] pl-5 italic">
                {problem.lossQuote}
              </p>
            </div>
          </div>
        </Frame>

        {/* Scenarios as an accordion: one open at a time, so the reader is
            always looking at exactly one way the money leaves. */}
        <div className="mt-6 border-t border-[color:var(--fh-line)]">
          {problem.scenarios.map((s, i) => {
            const isOpen = open === s.id;
            return (
              <div key={s.id} className="border-b border-[color:var(--fh-line)]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center gap-5 py-6 text-left"
                >
                  <span
                    className="fh-figure text-[0.875rem] font-semibold transition-colors duration-300"
                    style={{ color: isOpen ? "var(--fh-acid)" : "var(--fh-ink-ghost)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="fh-h3 flex-1 transition-colors duration-300"
                    style={{ color: isOpen ? "var(--fh-ink)" : "var(--fh-ink-dim)" }}
                  >
                    {s.title}
                  </span>
                  <span
                    className="relative block h-3 w-3 shrink-0"
                    style={{
                      transform: isOpen ? "rotate(45deg)" : "none",
                      transition: "transform 420ms var(--fh-ease-snap)",
                    }}
                  >
                    <span
                      className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2"
                      style={{ background: isOpen ? "var(--fh-acid)" : "var(--fh-ink-faint)" }}
                    />
                    <span
                      className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2"
                      style={{ background: isOpen ? "var(--fh-acid)" : "var(--fh-ink-faint)" }}
                    />
                  </span>
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-500 ease-[var(--fh-ease-out)]"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p
                      className="fh-body max-w-[62ch] pb-7 pl-[3.4rem]"
                      style={{
                        opacity: isOpen ? 1 : 0,
                        transition: "opacity 420ms var(--fh-ease-out) 80ms",
                      }}
                    >
                      {s.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
