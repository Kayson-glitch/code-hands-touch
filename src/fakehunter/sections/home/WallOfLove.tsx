import { useState } from "react";
import { SectionHeader } from "../../components/primitives";
import { wallOfLove } from "../../content.home";
import { useReducedMotion } from "../../hooks";

type Quote = (typeof wallOfLove.quotes)[number];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

/**
 * One testimonial.
 *
 * The live site puts a stock headshot next to each name. A monogram tile keeps
 * the page honest about what these are — attributed roles, not people you can
 * look up — and matches the bracket motif used everywhere else.
 */
function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <figure className="flex h-full w-[22rem] shrink-0 flex-col justify-between border-l border-[color:var(--fh-line)] px-7 py-8 sm:w-[26rem] sm:px-9">
      <blockquote className="text-[0.9375rem] leading-[1.7] text-[color:var(--fh-ink-dim)] sm:text-[1rem]">
        <span aria-hidden className="mr-1 text-[color:var(--fh-acid)]">
          “
        </span>
        {quote.before}{" "}
        <em className="font-medium text-[color:var(--fh-acid)]">{quote.highlight}</em> {quote.after}
      </blockquote>

      <figcaption className="mt-8 flex items-center gap-4">
        <span className="fh-figure flex h-12 w-12 items-center justify-center border border-[color:var(--fh-line-strong)] text-[1.25rem] font-medium text-[color:var(--fh-acid)]">
          {initials(quote.name)}
        </span>
        <span className="flex flex-col gap-1">
          <span className="fh-label text-[color:var(--fh-ink)]">{quote.name}</span>
          <span className="text-[0.8125rem] text-[color:var(--fh-ink-faint)]">{quote.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function WallOfLove() {
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const run = [...wallOfLove.quotes, ...wallOfLove.quotes];

  return (
    <section
      id="voices"
      className="relative scroll-mt-24 overflow-hidden border-y border-[color:var(--fh-line)] py-[clamp(4rem,8vw,7rem)]"
    >
      <div className="fh-shell">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <SectionHeader index={wallOfLove.index} label={wallOfLove.label} />
            <h2 className="fh-h2 mt-7">
              <span className="block">{wallOfLove.titleTop}</span>
              <span className="block text-[color:var(--fh-acid)]">{wallOfLove.titleAccent}</span>
            </h2>
          </div>
          <p className="fh-body lg:col-span-5 lg:col-start-8">{wallOfLove.description}</p>
        </div>
      </div>

      {/* The band. Hovering holds it still so a quote can actually be read —
          the only reason to move it in the first place is to show there are
          more of them than fit. */}
      <div
        className="relative mt-12"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        {reduced ? (
          <div className="fh-shell grid gap-px sm:grid-cols-2 lg:grid-cols-3">
            {wallOfLove.quotes.map((q) => (
              <QuoteCard key={q.id} quote={q} />
            ))}
          </div>
        ) : (
          <div
            className="fh-marquee__track"
            style={{
              ["--fh-marquee-duration" as string]: "72s",
              ["--fh-marquee-state" as string]: paused ? "paused" : "running",
            }}
          >
            {run.map((q, i) => (
              <QuoteCard key={`${q.id}-${i}`} quote={q} />
            ))}
          </div>
        )}

        {/* Edge fades, wide enough that a card leaves rather than vanishes. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[12vw]"
          style={{ background: "linear-gradient(90deg, var(--fh-bg), transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[12vw]"
          style={{ background: "linear-gradient(270deg, var(--fh-bg), transparent)" }}
        />
      </div>
    </section>
  );
}
