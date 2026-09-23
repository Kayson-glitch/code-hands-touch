import { useState } from "react";
import { caseFiles } from "../content";
import { Frame, ScanHeading, Section, SectionHeader } from "../components/primitives";
import { Compare } from "../components/Compare";
import { VideoScrub } from "../components/VideoScrub";

type Case = (typeof caseFiles.cases)[number];

const hasDocs = (c: Case): c is Extract<Case, { forged: unknown }> => "forged" in c;

export function CaseFiles() {
  const [active, setActive] = useState(0);
  const current = caseFiles.cases[active];

  return (
    <Section id="evidence" className="border-t border-[color:var(--fh-line)]">
      <div className="fh-shell">
        <SectionHeader index={caseFiles.index} label={caseFiles.label} />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ScanHeading className="fh-h2 max-w-[22ch]">{caseFiles.title}</ScanHeading>
          </div>
          <div className="lg:col-span-5 lg:pt-2">
            <p className="fh-body">{caseFiles.description}</p>
          </div>
        </div>

        {/* Case selector, styled as evidence tabs on a folder. */}
        <div className="mt-14 flex flex-wrap items-end gap-1">
          {caseFiles.cases.map((c, i) => {
            const on = active === i;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={on}
                className="group relative flex items-center gap-2.5 border border-b-0 px-4 py-3 transition-colors duration-300"
                style={{
                  borderColor: on ? "var(--fh-line)" : "transparent",
                  background: on ? "var(--fh-surface)" : "transparent",
                  color: on ? "var(--fh-ink)" : "var(--fh-ink-faint)",
                }}
              >
                <span
                  className="block h-1.5 w-1.5 transition-colors duration-300"
                  style={{ background: on ? "var(--fh-acid)" : "var(--fh-ink-ghost)" }}
                />
                <span className="fh-label">{c.kind}</span>
                <span className="fh-label hidden text-[color:var(--fh-ink-ghost)] sm:inline">
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>

        <Frame
          lit
          key={current.id}
          className="grid border border-[color:var(--fh-line)] bg-[color:var(--fh-surface)] lg:grid-cols-12"
          // Keyed remount so each case arrives with its own entrance.
        >
          <div
            className="border-b border-[color:var(--fh-line)] p-5 lg:col-span-6 lg:border-b-0 lg:border-r lg:p-7"
            style={{ animation: "fh-rise 620ms var(--fh-ease-out) both" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="fh-label text-[color:var(--fh-acid)]">
                {current.kind} · {current.label}
              </span>
              <span className="fh-label text-[color:var(--fh-ink-ghost)]">
                {caseFiles.redactedNote}
              </span>
            </div>

            {hasDocs(current) ? (
              <Compare
                forged={current.forged}
                genuine={current.genuine}
                headline={current.headline}
                label={`${current.kind} — ${current.label}`}
              />
            ) : (
              <div className="border border-[color:var(--fh-line)]">
                <VideoScrub
                  duration={current.duration}
                  spliceAt={current.spliceAt}
                  caption={current.timeline}
                />
              </div>
            )}
          </div>

          <div className="p-5 lg:col-span-6 lg:p-9">
            <span className="fh-label text-[color:var(--fh-ink-ghost)]">What the engine saw</span>
            <ul className="mt-5">
              {current.findings.map((f, i) => (
                <li
                  key={f}
                  className="flex gap-4 border-t border-[color:var(--fh-line)] py-5 first:border-t-0 first:pt-0"
                  style={{
                    animation: `fh-rise 560ms var(--fh-ease-out) ${180 + i * 130}ms both`,
                  }}
                >
                  <span className="fh-label mt-[3px] shrink-0 text-[color:var(--fh-acid)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[0.875rem] leading-[1.65] text-[color:var(--fh-ink-dim)]">
                    {f}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Frame>
      </div>
    </Section>
  );
}
