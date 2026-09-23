import { Counter, MoreLink, SectionHeader } from "../../components/primitives";
import { MetricVisual, type VisualKind } from "../../components/MetricVisual";
import { performance as perf } from "../../content.home";
import { useInView } from "../../hooks";

type Card = (typeof perf.cards)[number];

function PerformanceCard({ card, order }: { card: Card; order: number }) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.35 });

  return (
    <article
      ref={ref}
      className="fh-card flex flex-col"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(20px)",
        transition: `opacity 700ms var(--fh-ease-out) ${(order % 2) * 110}ms, transform 700ms var(--fh-ease-out) ${(order % 2) * 110}ms`,
      }}
    >
      {/* Visual and value share the top half: the drawing is the number's
          working, so they have to be read together. */}
      <div className="grid grid-cols-[1.15fr_1fr] items-center gap-4 border-b border-[color:var(--fh-line)] bg-[color:var(--fh-void)] p-5 sm:p-6">
        <div className="h-[8.5rem]">
          <MetricVisual kind={card.visual as VisualKind} on={inView} />
        </div>
        <div>
          <div className="flex items-baseline gap-0.5">
            <Counter
              value={card.value}
              decimals={card.decimals}
              prefix={"prefix" in card ? card.prefix : ""}
              duration={1300 + order * 120}
              className="text-[clamp(2rem,3.4vw,2.875rem)] font-semibold leading-none"
            />
            <span className="fh-figure text-[1.25rem] font-normal text-[color:var(--fh-ink-faint)]">
              {card.unit}
            </span>
          </div>
          {/* The measurement names the number it sits under, rather than being
              repeated as a second heading in the half below. */}
          <h3 className="fh-h3 mt-2.5 text-[0.9375rem] leading-[1.35]">{card.metric}</h3>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <p className="fh-body text-[0.875rem]">{card.description}</p>
      </div>
    </article>
  );
}

export function Performance() {
  return (
    <section
      id="performance"
      className="relative scroll-mt-24 border-y border-[color:var(--fh-line)] py-[clamp(4rem,8vw,7.5rem)]"
    >
      {/* The band is set apart by texture rather than value. Darkening it to
          --fh-void would collide with the wells the charts sit in, and the
          cards would stop reading as cards. */}
      <div className="fh-grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="fh-shell relative">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionHeader index={perf.index} label={perf.label} />
            <h2 className="fh-h2 mt-7">
              <span className="block">{perf.titleTop}</span>
              <span className="block text-[color:var(--fh-acid)]">{perf.titleAccent}</span>
            </h2>
          </div>
          <p className="fh-body lg:col-span-5">{perf.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {perf.cards.map((card, i) => (
            <PerformanceCard key={card.id} card={card} order={i} />
          ))}
        </div>

        <div className="mt-10">
          <MoreLink href={perf.more.href}>{perf.more.label}</MoreLink>
        </div>
      </div>
    </section>
  );
}
