import { Fragment } from "react";
import { Button, Counter } from "../../components/primitives";
import { Sonar } from "../../components/Sonar";
import { siteNav } from "../../content";
import { homeHero } from "../../content.home";
import { useInView } from "../../hooks";

/**
 * The headline, raised word by word out of the field below it.
 *
 * Per-letter was right when this was one word of brand; on a sentence it turns
 * into a ticker. Words rise in reading order instead, 54ms apart, so the line
 * arrives at about the speed you would read it.
 *
 * Each word is clipped by its own box. The box is padded past the baseline so
 * descenders survive the clip, and the resting transform clears that padding
 * as well as the line box — otherwise the tops of the glyphs peek out.
 */
function Headline({ shown }: { shown: boolean }) {
  const lines = [
    { text: homeHero.titleLead, accent: false },
    { text: homeHero.titleAccent, accent: true },
  ];
  let n = 0;

  return (
    <h1
      className="mt-7 text-balance text-[clamp(2.05rem,5.6vw,5.25rem)] font-extrabold leading-[1.02] tracking-[-0.032em]"
      aria-label={`${homeHero.titleLead} ${homeHero.titleAccent}`}
    >
      {lines.map((line) => (
        /* Balanced rather than flexed: on a phone each line has to wrap again,
           and `balance` splits it evenly instead of stranding the last word on
           a line of its own. That needs real inline layout, so the words are
           inline-blocks separated by actual spaces. */
        <span key={line.text} className="block text-balance" aria-hidden>
          {line.text.split(" ").map((word, i) => {
            const delay = 150 + n++ * 54;
            return (
              <Fragment key={`${word}-${i}`}>
                {i > 0 && " "}
                {/* `align-top` matters: an inline-block with overflow hidden
                    takes its bottom margin edge as its baseline, which adds a
                    strut's worth of descender to every line box. */}
                <span className="-mb-[0.18em] inline-block overflow-hidden pb-[0.18em] align-top">
                  <span
                    className="block"
                    style={{
                      color: line.accent ? "var(--fh-acid)" : undefined,
                      transform: shown ? "translateY(0)" : "translateY(calc(100% + 0.2em))",
                      transition: `transform 900ms var(--fh-ease-out) ${delay}ms`,
                    }}
                  >
                    {word}
                  </span>
                </span>
              </Fragment>
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
        className="fh-shell relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center pb-9 pt-10 text-center sm:pb-10 sm:pt-10"
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

        <Headline shown={inView} />

        <p
          className="fh-body mt-6 max-w-[44rem] text-balance sm:mt-7"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(12px)",
            transition:
              "opacity 800ms var(--fh-ease-out) 780ms, transform 800ms var(--fh-ease-out) 780ms",
          }}
        >
          {homeHero.subtitle}
        </p>

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-9"
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

        {/* The provenance claim, at credential size and set between two short
            rules so it reads as a stamp on the work rather than a sales line.
            The rules are fixed-length rather than flexed: over the dial, a rule
            that runs to the edge of the column disappears into the graticule. */}
        <p
          className="fh-label mt-7 flex items-center justify-center gap-4 text-[10px] text-[color:var(--fh-ink-ghost)] sm:mt-8"
          style={{
            opacity: inView ? 1 : 0,
            transition: "opacity 900ms var(--fh-ease-out) 1000ms",
          }}
        >
          <span
            className="hidden h-px w-10 bg-[color:var(--fh-line-strong)] sm:block"
            aria-hidden
          />
          {homeHero.credential}
          <span
            className="hidden h-px w-10 bg-[color:var(--fh-line-strong)] sm:block"
            aria-hidden
          />
        </p>

        {/* Telemetry. The three facts the subtitle implies, stated as values.
            Pinned to the fold on a wide screen; on a phone it follows the
            buttons directly, because a full-height gap above it reads as a
            layout fault rather than as breathing room. */}
        <div
          className="mt-10 w-full border-t border-[color:var(--fh-line)] pt-5 sm:mt-auto"
          style={{
            opacity: inView ? 1 : 0,
            transition: "opacity 900ms var(--fh-ease-out) 1120ms",
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
