import { useState } from "react";
import { cn } from "@/lib/utils";
import { MoreLink, SectionHeader } from "../../components/primitives";
import { TechGlyph, type GlyphKind } from "../../components/TechGlyph";
import { techSolution } from "../../content.home";
import { useInView, useMediaQuery } from "../../hooks";

type Card = (typeof techSolution.cards)[number];

function TechCard({ card, wide = false }: { card: Card; wide?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.3 });
  const canHover = useMediaQuery("(hover: hover)");
  /* The diagram builds itself on arrival, then runs its check when you reach
     for it. Without a pointer there is nothing to reach with, so arriving does
     both. */
  const probe = canHover ? hovered : inView;
  /* The wide card only keeps its wide frame where the grid keeps it wide. */
  const wideLayout = useMediaQuery("(min-width: 1024px)");
  const compact = wide && !wideLayout;

  return (
    <article
      ref={ref}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="fh-card group flex flex-col"
    >
      <div
        className={cn(
          "relative overflow-hidden border-b border-[color:var(--fh-line)] bg-[color:var(--fh-void)]",
          compact ? "aspect-[110/96]" : wide ? "aspect-[200/80]" : "aspect-[4/3]",
        )}
      >
        <TechGlyph kind={card.glyph as GlyphKind} shown={inView} probe={probe} compact={compact} />
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[color:var(--fh-acid)] origin-left"
          style={{
            transform: `scaleX(${probe ? 1 : 0})`,
            transition: "transform 620ms var(--fh-ease-out)",
          }}
        />
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="fh-h3 text-[1.0625rem] sm:text-[1.125rem]">{card.title}</h3>
        <p className="fh-body mt-3 text-[0.875rem]">{card.description}</p>
      </div>
    </article>
  );
}

export function TechSolution() {
  const [top, bottomNarrow] = [techSolution.cards.slice(0, 3), techSolution.cards.slice(3)];

  return (
    <section id="technology" className="relative scroll-mt-24 py-[clamp(4rem,8vw,7.5rem)]">
      <div className="fh-shell">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionHeader index={techSolution.index} label={techSolution.label} />
            <h2 className="fh-h2 mt-7 text-balance">
              <span className="block">{techSolution.titleTop}</span>
              <span className="block text-[color:var(--fh-acid)]">{techSolution.titleAccent}</span>
            </h2>
          </div>
          <p className="fh-body lg:col-span-5">{techSolution.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((card) => (
            <TechCard key={card.id} card={card} />
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.75fr]">
          {bottomNarrow.map((card) => (
            <TechCard key={card.id} card={card} wide={"wide" in card && card.wide} />
          ))}
        </div>

        <div className="mt-10">
          <MoreLink href={techSolution.more.href}>{techSolution.more.label}</MoreLink>
        </div>
      </div>
    </section>
  );
}
