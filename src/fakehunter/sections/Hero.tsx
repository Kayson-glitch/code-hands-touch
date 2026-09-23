import { hero } from "../content";
import { Button, Counter } from "../components/primitives";
import { ScannerField } from "../components/ScannerField";
import { useInView } from "../hooks";

export function Hero() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section id="hero" className="relative min-h-[100svh] overflow-hidden pt-16">
      {/* Layer 1 — the interactive glyph field. */}
      <div className="absolute inset-0">
        <ScannerField className="absolute inset-0 h-full w-full" />
      </div>

      {/* Layer 2 — olive bloom, carried over from the H5 hero, kept off-centre
          so it reads as light leaking in rather than a centred vignette. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 22% 38%, rgba(225,240,86,0.14) 0%, transparent 72%), radial-gradient(48% 48% at 78% 68%, rgba(64,140,96,0.16) 0%, transparent 70%)",
        }}
      />
      {/* Layer 3 — keeps the copy legible wherever the lens happens to be.
          Narrow viewports get a vertical scrim instead: there is no empty
          right-hand column to push the field into. */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,10,11,0.9) 0%, rgba(10,10,11,0.62) 38%, rgba(10,10,11,0) 66%), linear-gradient(to top, var(--fh-bg) 1%, transparent 26%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,10,11,0.62) 0%, rgba(10,10,11,0.86) 46%, var(--fh-bg) 88%)",
        }}
      />

      <div
        ref={ref}
        className="fh-shell relative flex min-h-[calc(100svh-4rem)] flex-col justify-start pb-8 pt-12"
      >
        <div className="max-w-[46rem]">
          <div
            className="flex items-center gap-2.5"
            style={{
              opacity: inView ? 1 : 0,
              transition: "opacity 700ms var(--fh-ease-out) 120ms",
            }}
          >
            <span className="block h-1.5 w-1.5 bg-[color:var(--fh-acid)]" />
            <span className="fh-label text-[color:var(--fh-acid)]">{hero.eyebrow}</span>
          </div>

          <h1 className="fh-h1 mt-5">
            {hero.title.split(" ").map((word, i) => (
              <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
                <span
                  className="inline-block"
                  style={{
                    transform: inView ? "translateY(0)" : "translateY(105%)",
                    transition: `transform 900ms var(--fh-ease-out) ${220 + i * 55}ms`,
                  }}
                >
                  {word}&nbsp;
                </span>
              </span>
            ))}
            <span
              className="block text-[color:var(--fh-ink-dim)]"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "none" : "translateY(14px)",
                transition:
                  "opacity 900ms var(--fh-ease-out) 620ms, transform 900ms var(--fh-ease-out) 620ms",
              }}
            >
              {hero.titleAccent}
            </span>
          </h1>

          <p
            className="fh-body mt-6 max-w-[34rem]"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "none" : "translateY(12px)",
              transition:
                "opacity 800ms var(--fh-ease-out) 780ms, transform 800ms var(--fh-ease-out) 780ms",
            }}
          >
            {hero.description}
          </p>

          <div
            className="mt-8 flex flex-wrap items-center gap-3"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "none" : "translateY(12px)",
              transition:
                "opacity 800ms var(--fh-ease-out) 900ms, transform 800ms var(--fh-ease-out) 900ms",
            }}
          >
            <Button href="#next-step">{hero.primaryCta}</Button>
            <Button href="#evidence" variant="ghost">
              {hero.secondaryCta}
            </Button>
          </div>
        </div>

        {/* Live accuracy strip. The numbers count up once, then hold — the
            page opens on the claim it spends the rest of its length proving. */}
        <div
          className="mt-auto border-t border-[color:var(--fh-line)] pt-5"
          style={{
            opacity: inView ? 1 : 0,
            transition: "opacity 900ms var(--fh-ease-out) 1050ms",
          }}
        >
          <div className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-3">
            {hero.stats.map((stat, i) => (
              <div key={stat.label} className="flex items-baseline gap-3">
                <Counter
                  value={stat.value}
                  decimals={2}
                  suffix={stat.unit}
                  duration={1600 + i * 120}
                  className="text-[clamp(1.5rem,2.4vw,2.125rem)] font-medium tracking-[-0.022em]"
                />
                <span className="fh-figure text-[0.8125rem] font-medium text-[color:var(--fh-acid)]">
                  {stat.delta}
                </span>
                <span className="fh-label text-[10px] text-[color:var(--fh-ink-faint)]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span className="fh-label text-[10px] text-[color:var(--fh-ink-ghost)]">
            Move to scan
          </span>
          <span className="h-px flex-1 bg-[color:var(--fh-line)]" />
          <span className="fh-label text-[10px] text-[color:var(--fh-ink-ghost)]">Scroll</span>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden>
            <path
              d="M5 0v14M1 10l4 4 4-4"
              stroke="var(--fh-acid)"
              strokeWidth="1.2"
              opacity="0.7"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
