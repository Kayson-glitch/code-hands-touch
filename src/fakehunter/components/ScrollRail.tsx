import { sections } from "../content";
import { useActiveSection, useDocumentProgress } from "../hooks";

const ids = sections.map((s) => s.id);

/**
 * Fixed vertical index down the right edge (desktop only).
 *
 * It carries the H5's dashed rail forward: one tick per section, a filled
 * acid segment tracking document progress, and the active section's label
 * sliding out on hover. It doubles as navigation, so the page never needs a
 * "back to top" button.
 */
export function ScrollRail() {
  const progress = useDocumentProgress();
  const active = useActiveSection(ids);

  return (
    <nav
      aria-label="Section index"
      className="pointer-events-none fixed right-[max(1rem,calc((100vw-var(--fh-max))/2-2.5rem))] top-1/2 z-40 hidden -translate-y-1/2 xl:block"
    >
      <div className="relative flex flex-col items-end gap-0">
        {/* Dashed spine + filled progress, drawn behind the ticks. */}
        <span
          className="absolute right-[3.5px] top-0 bottom-0 w-px"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, var(--fh-line-strong) 0 3px, transparent 3px 8px)",
            backgroundSize: "1px 8px",
          }}
          aria-hidden
        />
        <span
          className="absolute right-[3.5px] top-0 w-px origin-top bg-[color:var(--fh-acid)]"
          style={{ height: `${progress * 100}%`, transition: "height 120ms linear" }}
          aria-hidden
        />

        {sections.map((s) => {
          const on = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="pointer-events-auto group flex items-center justify-end gap-3 py-2.5"
            >
              <span
                className="fh-label whitespace-nowrap text-[10px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{
                  color: on ? "var(--fh-acid)" : "var(--fh-ink-faint)",
                  transform: "translateX(6px)",
                }}
              >
                {s.index} {s.label}
              </span>
              <span
                className="block transition-all duration-300"
                style={{
                  width: on ? 14 : 8,
                  height: on ? 2 : 1,
                  background: on ? "var(--fh-acid)" : "var(--fh-ink-ghost)",
                }}
              />
            </a>
          );
        })}
      </div>
    </nav>
  );
}
