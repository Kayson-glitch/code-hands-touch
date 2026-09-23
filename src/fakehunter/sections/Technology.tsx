import { useState } from "react";
import { technology } from "../content";
import { Frame, ScanHeading, Section, SectionHeader } from "../components/primitives";
import { Specimen } from "../components/Specimen";
import { useInView } from "../hooks";

export function Technology() {
  const [active, setActive] = useState(0);
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 });
  const line = technology.lines[active];

  return (
    <Section id="technology" className="border-t border-[color:var(--fh-line)]">
      <div className="fh-shell">
        <SectionHeader index={technology.index} label={technology.label} />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ScanHeading className="fh-h2 max-w-[20ch]">{technology.title}</ScanHeading>
          </div>
          <div className="lg:col-span-5 lg:pt-2">
            <p className="fh-body">{technology.description}</p>
          </div>
        </div>

        {/* Selector. The three lines run in parallel in production, so they
            are presented as three ports on one strip rather than a stack of
            cards — you switch instrument, not page. */}
        <div ref={ref} className="mt-14">
          <div
            className="relative grid grid-cols-3 border border-[color:var(--fh-line)]"
            role="tablist"
            aria-label="Detection lines"
          >
            <span
              className="absolute inset-y-0 z-0 bg-[color:var(--fh-surface)]"
              style={{
                width: `${100 / technology.lines.length}%`,
                left: `${(active * 100) / technology.lines.length}%`,
                transition: "left 520ms var(--fh-ease-snap)",
              }}
            />
            <span
              className="absolute top-0 z-10 h-px bg-[color:var(--fh-acid)]"
              style={{
                width: `${100 / technology.lines.length}%`,
                left: `${(active * 100) / technology.lines.length}%`,
                transition: "left 520ms var(--fh-ease-snap)",
              }}
            />
            {technology.lines.map((l, i) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className="relative z-10 flex items-center justify-center gap-2.5 px-3 py-4 transition-colors duration-300 sm:px-6"
                style={{ color: active === i ? "var(--fh-ink)" : "var(--fh-ink-faint)" }}
              >
                <span
                  className="block h-1.5 w-1.5 transition-colors duration-300"
                  style={{
                    background: active === i ? "var(--fh-acid)" : "var(--fh-ink-ghost)",
                  }}
                />
                <span className="fh-label">{l.short}</span>
                <span className="fh-label hidden text-[color:var(--fh-ink-ghost)] lg:inline">
                  line
                </span>
              </button>
            ))}
          </div>

          <Frame
            lit
            className="grid border-x border-b border-[color:var(--fh-line)] lg:grid-cols-12"
          >
            <div className="border-b border-[color:var(--fh-line)] lg:col-span-5 lg:border-b-0 lg:border-r">
              <Specimen id={line.id} active={inView} key={line.id} />
              <div className="flex items-center justify-between border-t border-[color:var(--fh-line)] px-5 py-3">
                <span className="fh-label text-[color:var(--fh-acid)]">{line.tag}</span>
                <span className="fh-figure text-[0.8125rem] font-semibold text-[color:var(--fh-ink-ghost)]">
                  {String(active + 1).padStart(2, "0")} / 03
                </span>
              </div>
            </div>

            {/* Keyed on the line id: switching tabs remounts this column so
                the stagger replays and the swap reads as new evidence
                arriving rather than a text substitution. */}
            <div key={line.id} className="p-6 lg:col-span-7 lg:p-9">
              <h3 className="fh-h3" style={{ animation: "fh-rise 520ms var(--fh-ease-out) both" }}>
                {line.title}
              </h3>
              <div className="mt-7">
                {line.points.map((p, i) => (
                  <div
                    key={p.title}
                    className="border-t border-[color:var(--fh-line)] py-5 first:border-t-0 first:pt-0"
                    style={{
                      animation: inView
                        ? `fh-rise 520ms var(--fh-ease-out) ${120 + i * 110}ms both`
                        : undefined,
                      opacity: inView ? undefined : 0,
                    }}
                  >
                    <div className="flex items-baseline gap-3">
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden>
                        <path d="M1 4.6L4 7.5 10 1" stroke="var(--fh-acid)" strokeWidth="1.5" />
                      </svg>
                      <h4 className="text-[0.9375rem] font-semibold">{p.title}</h4>
                    </div>
                    <p className="mt-2 max-w-[60ch] pl-[1.375rem] text-[0.875rem] leading-[1.6] text-[color:var(--fh-ink-dim)]">
                      {p.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Frame>
        </div>
      </div>
    </Section>
  );
}
