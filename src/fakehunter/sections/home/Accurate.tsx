import { SectionHeader } from "../../components/primitives";
import { accurate } from "../../content.home";
import { useInView } from "../../hooks";

const ACID = "var(--fh-acid)";
const LINE = "rgba(255,255,255,0.14)";

/* -------------------------------------------------------------------------- */
/*  Card glyphs                                                               */
/* -------------------------------------------------------------------------- */

/** Receipts and statements, with the parts the model is pretrained on marked. */
function Corpus({ on }: { on: boolean }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={6 + i * 5}
          y={4 + i * 3}
          width="24"
          height="32"
          stroke={i === 2 ? ACID : LINE}
          strokeWidth="1"
          fill="none"
          style={{
            opacity: on ? 1 : 0.3,
            transform: on ? "none" : `translate(${-i * 3}px, ${i * 2}px)`,
            transition: `all 620ms var(--fh-ease-out) ${i * 90}ms`,
          }}
        />
      ))}
      {/* Layout, font, stamp — the three things the copy names. */}
      <g stroke={ACID} strokeWidth="1.2">
        {[12, 18, 24].map((y, i) => (
          <path
            key={y}
            d={`M20 ${y} H${y === 24 ? 28 : 32}`}
            strokeDasharray="14"
            style={{
              strokeDashoffset: on ? 0 : 14,
              transition: `stroke-dashoffset 520ms var(--fh-ease-out) ${300 + i * 110}ms`,
            }}
          />
        ))}
      </g>
      <circle
        cx="30"
        cy="31"
        r="5"
        stroke={ACID}
        strokeWidth="1"
        fill="none"
        style={{ opacity: on ? 0.8 : 0, transition: "opacity 420ms var(--fh-ease-out) 620ms" }}
      />
    </svg>
  );
}

/** One dataset, four evaluators, one ruler. The benchmark method, not a claim. */
function Benchmark({ on }: { on: boolean }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
      <rect x="4" y="18" width="7" height="8" stroke={ACID} strokeWidth="1" fill="none" />
      {[8, 17, 26, 35].map((y, i) => (
        <g key={y}>
          <path
            d={`M11 22 C20 22, 22 ${y + 3}, 30 ${y + 3}`}
            stroke={i === 0 ? ACID : LINE}
            strokeWidth="1"
            fill="none"
            strokeDasharray="30"
            style={{
              strokeDashoffset: on ? 0 : 30,
              transition: `stroke-dashoffset 620ms var(--fh-ease-out) ${i * 90}ms`,
            }}
          />
          <rect
            x="30"
            y={y}
            width="10"
            height="6"
            stroke={i === 0 ? ACID : LINE}
            strokeWidth="1"
            fill={i === 0 ? ACID : "none"}
            fillOpacity={i === 0 ? 0.18 : 0}
            style={{
              opacity: on ? 1 : 0.25,
              transition: `opacity 420ms var(--fh-ease-out) ${300 + i * 90}ms`,
            }}
          />
        </g>
      ))}
    </svg>
  );
}

/** A genuine document put through the four attacks the copy lists. */
function Adversarial({ on }: { on: boolean }) {
  const marks = [
    "M12 12 l6 6 M18 12 l-6 6",
    "M26 12 h8 v8 h-8 z",
    "M12 26 h8 M12 30 h5 M12 34 h8",
    "M26 26 l4 4 l-4 4 M32 26 l4 4 l-4 4",
  ];
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
      <rect x="4" y="4" width="36" height="36" stroke={LINE} strokeWidth="1" fill="none" />
      <path d="M22 4 V40 M4 22 H40" stroke={LINE} strokeWidth="0.7" />
      {marks.map((d, i) => (
        <path
          key={d}
          d={d}
          stroke={i === 1 ? "var(--fh-forged)" : ACID}
          strokeWidth="1.2"
          fill="none"
          style={{
            opacity: on ? 1 : 0,
            transform: on ? "none" : "scale(0.7)",
            transformOrigin: "22px 22px",
            transition: `all 520ms var(--fh-ease-snap) ${i * 110}ms`,
          }}
        />
      ))}
    </svg>
  );
}

const GLYPHS = { corpus: Corpus, benchmark: Benchmark, adversarial: Adversarial } as const;

/* -------------------------------------------------------------------------- */

function AccurateCard({ card, order }: { card: (typeof accurate.cards)[number]; order: number }) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.3 });
  const Glyph = GLYPHS[card.glyph as keyof typeof GLYPHS];

  return (
    <article
      ref={ref}
      className="fh-card flex flex-col p-7 sm:p-8"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(20px)",
        transition: `opacity 700ms var(--fh-ease-out) ${order * 120}ms, transform 700ms var(--fh-ease-out) ${order * 120}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-14 w-14 items-center justify-center border border-[color:var(--fh-line-strong)] bg-[color:var(--fh-void)]">
          <Glyph on={inView} />
        </span>
        <span className="fh-figure text-[1.25rem] font-medium text-[color:var(--fh-ink-ghost)]">
          {String(order + 1).padStart(2, "0")}
        </span>
      </div>
      <h3 className="fh-h3 mt-7 text-[1.0625rem] sm:text-[1.125rem]">{card.title}</h3>
      <p className="fh-body mt-3.5 text-[0.875rem]">{card.description}</p>
    </article>
  );
}

export function Accurate() {
  return (
    <section
      id="accuracy"
      className="relative scroll-mt-24 overflow-hidden py-[clamp(4rem,8vw,7.5rem)]"
    >
      {/* The site washes this band in violet. Here the same separation comes
          from an acid bloom, so the palette stays at one accent. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(62% 48% at 50% 0%, rgba(225,240,86,0.055) 0%, transparent 72%)",
        }}
      />
      <div className="fh-shell relative">
        <div className="mx-auto max-w-[44rem] text-center">
          <SectionHeader
            index={accurate.index}
            label={accurate.label}
            className="mx-auto max-w-[22rem] text-left"
          />
          <h2 className="fh-h2 mt-8 uppercase">
            <span className="block">{accurate.titleLine1}</span>
            <span className="block">
              {accurate.titleWhite}{" "}
              <span className="text-[color:var(--fh-acid)]">{accurate.titleHighlight}</span>
              {accurate.titleTail}
            </span>
          </h2>
          <p className="fh-body mx-auto mt-6 max-w-[34rem]">{accurate.subtitle}</p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accurate.cards.map((card, i) => (
            <AccurateCard key={card.id} card={card} order={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
