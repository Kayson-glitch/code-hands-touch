import { Fragment } from "react";
import { slogan } from "../../content.home";
import { useReducedMotion, useScrollProgress } from "../../hooks";

const ramp = (p: number, from: number, to: number) =>
  Math.min(1, Math.max(0, (p - from) / (to - from)));

/** Ghost ink to acid, as one colour, so a word never shows two layers. */
function lit(t: number) {
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgba(${mix(244, 225)},${mix(244, 240)},${mix(242, 86)},${0.16 + t * 0.84})`;
}

/**
 * Half a screen between the hero and the technology section, carrying one
 * sentence in two halves.
 *
 * The sentence is driven by scroll position rather than a timer, so it reads
 * at the reader's pace: the first half stands alone, then — as the block
 * reaches the middle of the screen — it steps back while the second half lights
 * word by word, and the four reads it refers to surface underneath. By the time
 * the block is centred the change is complete, so stopping there leaves it
 * settled rather than half-way.
 */
export function Slogan() {
  const [ref, progress] = useScrollProgress<HTMLElement>();
  const reduced = useReducedMotion();
  /* 0.5 is the block centred in the viewport; everything has landed by then. */
  const p = reduced ? 1 : progress;
  const recede = ramp(p, 0.33, 0.47);
  const words = slogan.accent.split(" ");

  return (
    <section
      ref={ref}
      className="relative flex min-h-[50svh] items-center py-[clamp(4rem,10vh,7rem)]"
    >
      <div className="fh-shell text-center">
        <h2 className="text-balance text-[clamp(1.9rem,6vw,5.75rem)] font-medium leading-[1.04] tracking-[-0.03em]">
          <span className="block" style={{ opacity: 1 - recede * 0.6 }}>
            {slogan.lead}
          </span>
          <span className="block">
            {words.map((word, i) => (
              <Fragment key={`${word}-${i}`}>
                {i > 0 && " "}
                <span style={{ color: lit(ramp(p, 0.28 + i * 0.04, 0.38 + i * 0.04)) }}>
                  {word}
                </span>
              </Fragment>
            ))}
          </span>
        </h2>

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:mt-10 sm:gap-x-3"
          style={{
            opacity: ramp(p, 0.4, 0.49),
            transform: `translateY(${(1 - ramp(p, 0.4, 0.49)) * 8}px)`,
          }}
        >
          {slogan.reads.map((read, i) => (
            <Fragment key={read}>
              {i > 0 && (
                <span className="h-px w-3 bg-[color:var(--fh-line-strong)] sm:w-6" aria-hidden />
              )}
              <span className="fh-label text-[color:var(--fh-ink-faint)]">{read}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
