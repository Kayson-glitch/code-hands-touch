import { nextStep } from "../content";
import { Button, Counter, ScanHeading, Section, SectionHeader } from "../components/primitives";
import { useInView } from "../hooks";

export function NextStep() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <Section
      id="next-step"
      className="relative overflow-hidden border-t border-[color:var(--fh-line)]"
    >
      {/* The olive bloom from the hero, reprised — the page closes in the same
          light it opened in. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 70% at 78% 40%, rgba(225,240,86,0.1) 0%, transparent 70%)",
        }}
      />
      <div className="fh-grid-bg pointer-events-none absolute inset-0 opacity-50" />

      <div className="fh-shell relative">
        <SectionHeader index={nextStep.index} label={nextStep.label} />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ScanHeading className="fh-h2 max-w-[18ch]">{nextStep.title}</ScanHeading>
          </div>
          <div className="lg:col-span-5 lg:pt-2">
            <p className="fh-body">{nextStep.description}</p>
          </div>
        </div>

        <div
          ref={ref}
          className="mt-16 grid gap-px border border-[color:var(--fh-line)] bg-[color:var(--fh-line)] md:grid-cols-3"
        >
          {nextStep.metrics.map((m, i) => (
            <div
              key={m.label}
              className="bg-[color:var(--fh-bg)] p-7"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "none" : "translateY(22px)",
                transition: `opacity 700ms var(--fh-ease-out) ${i * 120}ms, transform 700ms var(--fh-ease-out) ${i * 120}ms`,
              }}
            >
              <div className="fh-figure flex items-baseline gap-1">
                <Counter
                  value={m.value}
                  decimals={m.unit === "%" ? 2 : 0}
                  duration={1500 + i * 150}
                  className="text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-none tracking-[-0.028em]"
                />
                <span className="text-[1.125rem] font-medium text-[color:var(--fh-acid)]">
                  {m.unit}
                </span>
              </div>
              <p className="mt-4 max-w-[34ch] text-[0.8125rem] leading-[1.6] text-[color:var(--fh-ink-dim)]">
                {m.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Button href="#hero">{nextStep.cta}</Button>
          <span className="fh-label text-[color:var(--fh-ink-ghost)]">
            Free two-week POC · your samples · your domain
          </span>
        </div>
      </div>
    </Section>
  );
}
