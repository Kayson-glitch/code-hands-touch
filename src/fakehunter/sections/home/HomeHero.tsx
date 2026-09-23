import { Button, Counter } from "../../components/primitives";
import { Sonar } from "../../components/Sonar";
import { siteNav } from "../../content";
import { homeHero } from "../../content.home";
import { useInView } from "../../hooks";

/** Per-letter mask rise. The name assembles itself out of the field. */
function Wordmark({ shown }: { shown: boolean }) {
  const parts = [
    { text: homeHero.title, accent: false },
    { text: homeHero.titleSuffix, accent: true },
  ];
  let n = 0;

  return (
    <h1
      className="mt-6 flex flex-wrap items-baseline gap-x-[0.28em] text-[clamp(2.7rem,8.4vw,8.5rem)] font-extrabold leading-[0.92] tracking-[-0.025em]"
      aria-label={`${homeHero.title} ${homeHero.titleSuffix}`}
    >
      {parts.map((part) => (
        <span key={part.text} className="flex" aria-hidden>
          {part.text.split("").map((ch, i) => {
            const delay = 180 + n++ * 34;
            return (
              <span key={`${ch}-${i}`} className="block overflow-hidden">
                <span
                  className="block"
                  style={{
                    color: part.accent ? "var(--fh-acid)" : undefined,
                    transform: shown ? "translateY(0)" : "translateY(104%)",
                    transition: `transform 880ms var(--fh-ease-out) ${delay}ms`,
                  }}
                >
                  {ch}
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

export function HomeHero() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.02 });

  return (
    <section id="hero" className="relative min-h-[100svh] overflow-hidden pt-16">
      {/* The sweep sits behind everything and is never interactive itself —
          it reads the pointer off the window. */}
      <div className="pointer-events-none absolute inset-0">
        <Sonar className="absolute inset-0" />
      </div>

      {/* A single tight bloom at the dial's centre, and a scrim behind the type
          only — the rings have to stay readable everywhere else, so there is
          no full-frame wash over the field. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(28% 26% at 50% 44%, rgba(225,240,86,0.075) 0%, transparent 72%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 22% at 50% 28%, rgba(10,10,11,0.8) 0%, rgba(10,10,11,0) 100%), linear-gradient(to top, var(--fh-bg) 0.5%, transparent 22%)",
        }}
      />

      <div
        ref={ref}
        className="fh-shell relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center pb-10 pt-12 text-center sm:pt-10"
      >
        <span
          className="fh-label inline-flex items-center gap-2 border border-[color:var(--fh-line-strong)] px-4 py-1.5 text-[color:var(--fh-ink-dim)]"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(10px)",
            transition:
              "opacity 700ms var(--fh-ease-out) 80ms, transform 700ms var(--fh-ease-out) 80ms",
          }}
        >
          <span className="fh-blink block h-1 w-1 bg-[color:var(--fh-acid)]" />
          {homeHero.badge}
        </span>

        <Wordmark shown={inView} />

        <p
          className="fh-body mt-7 max-w-[40rem] text-balance"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(12px)",
            transition:
              "opacity 800ms var(--fh-ease-out) 720ms, transform 800ms var(--fh-ease-out) 720ms",
          }}
        >
          {homeHero.subtitle}
        </p>

        <div
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(12px)",
            transition:
              "opacity 800ms var(--fh-ease-out) 860ms, transform 800ms var(--fh-ease-out) 860ms",
          }}
        >
          <Button href="#start">{homeHero.primaryCta}</Button>
          <Button href={siteNav.links[1].href} variant="ghost">
            {homeHero.secondaryCta}
          </Button>
        </div>

        {/* Telemetry. The three facts the subtitle implies, stated as values.
            Pinned to the fold on a wide screen; on a phone it follows the
            buttons directly, because a full-height gap above it reads as a
            layout fault rather than as breathing room. */}
        <div
          className="mt-14 w-full border-t border-[color:var(--fh-line)] pt-5 sm:mt-auto"
          style={{
            opacity: inView ? 1 : 0,
            transition: "opacity 900ms var(--fh-ease-out) 1020ms",
          }}
        >
          <div className="grid grid-cols-3 gap-x-6">
            {homeHero.telemetry.map((cell, i) => (
              <div
                key={cell.label}
                className="flex flex-col items-center gap-1 border-l border-[color:var(--fh-line)] first:border-l-0 sm:items-start sm:pl-6 sm:first:pl-0"
              >
                <span className="fh-label text-[10px] text-[color:var(--fh-ink-ghost)]">
                  {cell.label}
                </span>
                <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                  <Counter
                    value={cell.value}
                    decimals={cell.decimals}
                    prefix={cell.prefix}
                    suffix={cell.suffix}
                    duration={1400 + i * 140}
                    active={inView}
                    className="text-[clamp(1.375rem,2.2vw,1.875rem)] font-semibold leading-none"
                  />
                  <span className="text-center text-[0.75rem] leading-tight text-[color:var(--fh-ink-faint)]">
                    {cell.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
