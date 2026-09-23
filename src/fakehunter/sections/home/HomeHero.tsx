import { Fragment } from "react";
import { Button } from "../../components/primitives";
import { ThresholdField } from "../../components/ThresholdField";
import { siteNav } from "../../content";
import { homeHero } from "../../content.home";
import { useInView } from "../../hooks";

/**
 * The headline, raised word by word.
 *
 * Per-letter was right when this was one word of brand; on a sentence it turns
 * into a ticker. Words rise in reading order instead, 54ms apart, so the line
 * arrives at about the speed you would read it.
 *
 * Each word is clipped by its own box. The box is padded past the baseline so
 * descenders survive the clip, and the resting transform clears that padding
 * as well as the line box — otherwise the tops of the glyphs peek out.
 */
function Headline({ shown, delay: start = 150 }: { shown: boolean; delay?: number }) {
  const lines = [
    { text: homeHero.titleLead, accent: false },
    { text: homeHero.titleAccent, accent: true },
  ];
  let n = 0;

  return (
    <h1
      className="mt-5 text-[clamp(2.05rem,4.8vw,4.5rem)] font-medium leading-[1.04] tracking-[-0.026em] sm:mt-6"
      aria-label={`${homeHero.titleLead} ${homeHero.titleAccent}`}
    >
      {lines.map((line) => (
        /* Balanced rather than flexed: on a phone each line has to wrap again,
           and `balance` splits it evenly instead of stranding the last word on
           a line of its own. That needs real inline layout, so the words are
           inline-blocks separated by actual spaces. */
        <span key={line.text} className="block text-balance" aria-hidden>
          {line.text.split(" ").map((word, i) => {
            const delay = start + n++ * 54;
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
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.02 });
  const rise = (delay: number) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "none" : "translateY(12px)",
    transition: `opacity 800ms var(--fh-ease-out) ${delay}ms, transform 800ms var(--fh-ease-out) ${delay}ms`,
  });

  /* The field first, directly under the header, taking whatever height the
     copy leaves it; the claim underneath reads as the caption to what you
     have just watched happen. The entrance follows the same order. */
  return (
    <section
      id="hero"
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-hidden pt-16"
    >
      <ThresholdField
        className="mt-3 flex-1"
        style={{
          opacity: inView ? 1 : 0,
          transition: "opacity 1000ms var(--fh-ease-out) 120ms",
        }}
      />

      <div className="fh-shell relative pb-[clamp(1.25rem,4vh,3.5rem)] pt-[clamp(1.5rem,4vh,2.75rem)]">
        <div className="flex items-center justify-between gap-6" style={rise(380)}>
          <span className="fh-label inline-flex items-center gap-2 border border-[color:var(--fh-line-strong)] px-4 py-1.5 text-[color:var(--fh-ink-dim)]">
            <span className="fh-blink block h-1 w-1 bg-[color:var(--fh-acid)]" />
            {homeHero.badge}
          </span>
          <span className="fh-label hidden text-[10px] text-[color:var(--fh-ink-ghost)] lg:block">
            {homeHero.credential}
          </span>
        </div>

        <Headline shown={inView} delay={460} />

        <div className="mt-5 grid gap-6 lg:mt-7 lg:grid-cols-12 lg:items-end">
          <p className="fh-body max-w-[36rem] text-pretty lg:col-span-6" style={rise(920)}>
            {homeHero.subtitle}
          </p>
          <div
            className="flex flex-wrap items-center gap-2.5 sm:gap-3 lg:col-span-6 lg:justify-end"
            style={rise(1020)}
          >
            {/* Side by side even on a phone, so the pair stays one row and the
                screen does not end on a stack of buttons. */}
            <Button href="#start" className="max-sm:!px-4">
              {homeHero.primaryCta}
            </Button>
            <Button href={siteNav.links[1].href} variant="ghost" className="max-sm:!px-4">
              {homeHero.secondaryCta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
