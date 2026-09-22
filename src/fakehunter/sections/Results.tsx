import { results } from "../content";
import { Counter, Frame, ScanHeading, Section, SectionHeader } from "../components/primitives";
import { useInView } from "../hooks";

function MetricRow({ metric, delay }: { metric: (typeof results.metrics)[number]; delay: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 });

  return (
    <div
      ref={ref}
      className="grid gap-6 border-t border-[color:var(--fh-line)] py-8 lg:grid-cols-12 lg:items-center lg:gap-10"
    >
      <div className="lg:col-span-4">
        <div className="flex items-baseline gap-2">
          <Counter
            value={metric.after}
            decimals={2}
            suffix="%"
            duration={1500}
            className="text-[clamp(2.25rem,4.4vw,3.5rem)] font-semibold leading-none tracking-[-0.04em]"
          />
          <span
            className="fh-mono inline-flex items-center gap-1 text-[color:var(--fh-acid)]"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "none" : "translateY(6px)",
              transition: `opacity 500ms var(--fh-ease-snap) ${delay + 900}ms, transform 500ms var(--fh-ease-snap) ${delay + 900}ms`,
            }}
          >
            <svg width="8" height="9" viewBox="0 0 8 9" fill="none" aria-hidden>
              <path d="M4 9V1M1 4l3-3 3 3" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            {metric.delta}
          </span>
        </div>
        <p className="fh-mono mt-3 text-[color:var(--fh-ink-faint)]">{metric.label}</p>
      </div>

      {/* The gain, drawn. The bar fills to the old score in grey, then the
          acid segment extends past it — the release, made visible. */}
      <div className="lg:col-span-5">
        <div className="relative h-8">
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[color:var(--fh-line)]" />
          <span
            className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-[color:var(--fh-ink-ghost)]"
            style={{
              left: 0,
              width: inView ? `${metric.before}%` : "0%",
              transition: `width 760ms var(--fh-ease-out) ${delay}ms`,
            }}
          />
          <span
            className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-[color:var(--fh-acid)]"
            style={{
              left: `${metric.before}%`,
              width: inView ? `${metric.after - metric.before}%` : "0%",
              transition: `width 700ms var(--fh-ease-out) ${delay + 780}ms`,
            }}
          />
          <span
            className="absolute top-1/2 block h-3 w-px -translate-y-1/2 bg-[color:var(--fh-acid)]"
            style={{
              left: `${metric.after}%`,
              opacity: inView ? 1 : 0,
              transition: `opacity 300ms linear ${delay + 1400}ms`,
            }}
          />
          <span
            className="fh-mono absolute bottom-0 text-[9px] text-[color:var(--fh-ink-ghost)]"
            style={{ left: 0 }}
          >
            {metric.before.toFixed(1)}%
          </span>
          <span
            className="fh-mono absolute bottom-0 text-[9px] text-[color:var(--fh-acid)]"
            style={{
              left: `${metric.after}%`,
              transform: "translateX(-100%)",
              opacity: inView ? 1 : 0,
              transition: `opacity 400ms linear ${delay + 1400}ms`,
            }}
          >
            {metric.after}%
          </span>
        </div>
      </div>

      <div className="lg:col-span-3">
        <p className="text-[0.8125rem] leading-[1.6] text-[color:var(--fh-ink-faint)]">
          {metric.detail}
        </p>
      </div>
    </div>
  );
}

function ThroughputTable() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div ref={ref}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.8fr)] gap-4 border-b border-[color:var(--fh-line)] pb-3">
        {results.throughput.headers.map((h) => (
          <span key={h} className="fh-mono text-[color:var(--fh-ink-ghost)]">
            {h}
          </span>
        ))}
      </div>
      {results.throughput.rows.map((row, i) => (
        <div
          key={row.type}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.8fr)] gap-4 border-b border-[color:var(--fh-line)] py-4 text-[0.8125rem] transition-colors duration-300 hover:bg-[color:var(--fh-surface)]"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(10px)",
            transition: `opacity 520ms var(--fh-ease-out) ${i * 110}ms, transform 520ms var(--fh-ease-out) ${i * 110}ms`,
          }}
        >
          <span className="font-medium">{row.type}</span>
          <span className="text-[color:var(--fh-ink-dim)]">{row.perItem}</span>
          <span className="text-[color:var(--fh-ink-dim)]">{row.rate}</span>
        </div>
      ))}
    </div>
  );
}

export function Results() {
  return (
    <Section id="results" className="border-t border-[color:var(--fh-line)]">
      <div className="fh-shell">
        <SectionHeader index={results.index} label={results.label} />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ScanHeading className="fh-h2 max-w-[18ch]">{results.title}</ScanHeading>
          </div>
          <div className="lg:col-span-5 lg:pt-2">
            <p className="fh-body">{results.description}</p>
          </div>
        </div>

        <div className="mt-14">
          {results.metrics.map((m, i) => (
            <MetricRow key={m.id} metric={m} delay={i * 140} />
          ))}
          <div className="border-t border-[color:var(--fh-line)]" />
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Frame className="border border-[color:var(--fh-line)] bg-[color:var(--fh-surface)] p-7">
              <span
                className="block text-[2.5rem] leading-none text-[color:var(--fh-acid)]"
                aria-hidden
              >
                “
              </span>
              <p className="fh-body mt-2 italic">{results.quote}</p>
              <p className="fh-mono mt-6 text-[color:var(--fh-ink-ghost)]">{results.sampleNote}</p>
            </Frame>
          </div>

          <div className="lg:col-span-6">
            <h3 className="fh-h3">{results.throughput.title}</h3>
            <p className="fh-body mt-3 text-[0.875rem]">{results.throughput.description}</p>
            <div className="mt-7">
              <ThroughputTable />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
