import { Button, Counter, SectionHeader } from "../../components/primitives";
import { homeNav, secure, wallOfLove } from "../../content.home";
import { useInView } from "../../hooks";

/** Return on investment, as the shape of a return. */
function RoiChart({ on }: { on: boolean }) {
  const bars = [22, 31, 27, 44, 52, 48, 68, 79, 74, 96];
  return (
    <svg viewBox="0 0 120 56" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      {bars.map((v, i) => (
        <rect
          key={i}
          x={3 + i * 11.7}
          y={56 - (v / 100) * 52}
          width="8"
          height={(v / 100) * 52}
          fill="var(--fh-acid)"
          fillOpacity={0.22 + (i / bars.length) * 0.66}
          style={{
            transform: on ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: "0 56px",
            transition: `transform 680ms var(--fh-ease-out) ${i * 60}ms`,
          }}
        />
      ))}
    </svg>
  );
}

export function Secure() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 });
  const [accuracy, roi, loss] = secure.cards;

  return (
    <section
      id="start"
      className="relative scroll-mt-24 overflow-hidden py-[clamp(4.5rem,9vw,8rem)]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 50% at 50% 106%, rgba(225,240,86,0.1) 0%, transparent 70%)",
        }}
      />

      <div ref={ref} className="fh-shell relative">
        <div className="flex flex-col items-center text-center">
          <SectionHeader
            index={secure.index}
            label={secure.label}
            className="w-full max-w-[20rem] text-left"
          />
          <h2 className="fh-h2 mt-9 max-w-[54rem] uppercase">
            {secure.titlePrefix}{" "}
            <span className="text-[color:var(--fh-acid)]">{secure.titleHighlight}</span>{" "}
            {secure.titleSuffix}
          </h2>
        </div>

        {/* Three cards. The middle one sits proud and taller, the way the site
            stages it — the ROI figure is the one a buyer repeats internally. */}
        <div className="mt-14 grid items-end gap-4 lg:grid-cols-3">
          <article className="fh-card flex h-full flex-col justify-between p-7 lg:mb-8">
            <div>
              <div className="flex items-baseline gap-0.5">
                <Counter
                  value={accuracy.value}
                  decimals={accuracy.decimals}
                  duration={1400}
                  className="text-[clamp(2.5rem,4vw,3.25rem)] font-semibold leading-none"
                />
                <span className="fh-figure text-[1.5rem] font-normal text-[color:var(--fh-ink-faint)]">
                  {accuracy.unit}
                </span>
              </div>
              <h3 className="fh-h3 mt-4 text-[1.0625rem]">{accuracy.title}</h3>
              <p className="fh-body mt-2.5 text-[0.875rem]">{accuracy.description}</p>
            </div>
            <a
              href="#performance"
              className="fh-label mt-8 flex items-center justify-center border border-[color:var(--fh-line-strong)] py-3 text-[color:var(--fh-ink-dim)] transition-colors duration-300 hover:border-[color:var(--fh-acid)] hover:text-[color:var(--fh-ink)]"
            >
              {accuracy.button}
            </a>
          </article>

          <article className="fh-card flex h-full flex-col justify-between border-[color:var(--fh-acid)] p-7 lg:-mt-10">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-0.5">
                <Counter
                  value={roi.value}
                  decimals={roi.decimals}
                  duration={1100}
                  className="text-[clamp(3.25rem,5.4vw,4.5rem)] font-semibold leading-none text-[color:var(--fh-acid)]"
                />
                <span className="fh-figure text-[2rem] font-normal text-[color:var(--fh-acid)] opacity-70">
                  {roi.unit}
                </span>
              </div>
              <h3 className="fh-h3 mt-4 text-[1.0625rem]">
                {roi.title}
                <span className="ml-1.5 text-[color:var(--fh-ink-faint)]">
                  {"titleNote" in roi ? roi.titleNote : null}
                </span>
              </h3>
            </div>
            <div className="mt-10 h-[7rem] border border-[color:var(--fh-line)] bg-[color:var(--fh-void)] p-2">
              <RoiChart on={inView} />
            </div>
          </article>

          <article className="fh-card flex h-full flex-col justify-between p-7 lg:mb-8">
            <div>
              <div className="flex items-baseline gap-0.5">
                <Counter
                  value={loss.value}
                  decimals={loss.decimals}
                  duration={1400}
                  className="text-[clamp(2.5rem,4vw,3.25rem)] font-semibold leading-none"
                />
                <span className="fh-figure text-[1.5rem] font-normal text-[color:var(--fh-ink-faint)]">
                  {loss.unit}
                </span>
              </div>
              <h3 className="fh-h3 mt-4 text-[1.0625rem]">{loss.title}</h3>
              <p className="fh-body mt-2.5 text-[0.875rem]">{loss.description}</p>
            </div>

            {/* Back to the testimonials, since the claim above is theirs. */}
            <a
              href="#voices"
              className="group mt-8 flex items-center justify-between gap-4 border-t border-[color:var(--fh-line)] pt-6"
            >
              <span className="flex">
                {wallOfLove.quotes.map((q, i) => (
                  <span
                    key={q.id}
                    className="fh-figure relative flex h-10 w-10 items-center justify-center border border-[color:var(--fh-line-strong)] bg-[color:var(--fh-surface)] text-[1.125rem] font-semibold text-[color:var(--fh-ink-faint)] transition-colors duration-300 group-hover:text-[color:var(--fh-acid)]"
                    style={{ marginLeft: i === 0 ? 0 : -9, zIndex: 10 - i }}
                  >
                    {q.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                ))}
              </span>
              <span className="fh-label text-[color:var(--fh-ink-faint)] transition-colors duration-300 group-hover:text-[color:var(--fh-ink)]">
                {"note" in loss ? loss.note : null}
              </span>
            </a>
          </article>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <Button href="#demo">{secure.cta}</Button>
          <Button href={homeNav.solution.href} variant="ghost">
            {secure.secondaryCta}
          </Button>
        </div>
      </div>
    </section>
  );
}
