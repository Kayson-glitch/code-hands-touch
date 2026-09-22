import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { nav, sections } from "../content";
import { useActiveSection, useDocumentProgress } from "../hooks";
import { Mark, Wordmark } from "./Mark";
import { Button } from "./primitives";

const anchorIds = nav.links.map((l) => l.href.slice(1));

/**
 * Fixed header.
 *
 * Three things happen on scroll, all driven by the same 0→1 document progress:
 * a hairline acid bar fills across the very top, the bar itself condenses onto
 * a blurred plate, and the link matching the section under the reading line
 * lights up. Nothing here animates on a timer — it is all positional, so the
 * header always tells the truth about where you are.
 */
export function Nav() {
  const progress = useDocumentProgress();
  const active = useActiveSection(anchorIds);
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          className="h-px origin-left bg-[color:var(--fh-acid)]"
          style={{ transform: `scaleX(${progress})` }}
          aria-hidden
        />
        <div
          className={cn(
            "border-b transition-[background-color,border-color,backdrop-filter] duration-500",
            condensed
              ? "border-[color:var(--fh-line)] bg-[rgba(10,10,11,0.72)] backdrop-blur-xl"
              : "border-transparent bg-transparent",
          )}
        >
          <div className="fh-shell flex h-16 items-center justify-between gap-6">
            <a href="#hero" className="flex items-center gap-2.5 text-[15px]">
              <Mark size={24} />
              <Wordmark />
            </a>

            <nav className="hidden items-center gap-1 lg:flex">
              {nav.links.map((link) => {
                const id = link.href.slice(1);
                const on = active === id;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className="fh-mono relative px-3 py-2 transition-colors duration-300"
                    style={{ color: on ? "var(--fh-ink)" : "var(--fh-ink-faint)" }}
                  >
                    {link.label}
                    <span
                      className="absolute inset-x-3 bottom-1 h-px origin-left bg-[color:var(--fh-acid)]"
                      style={{
                        transform: `scaleX(${on ? 1 : 0})`,
                        transition: "transform 420ms var(--fh-ease-out)",
                      }}
                    />
                  </a>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <Button href="#next-step" className="hidden !px-4 !py-2.5 sm:inline-flex">
                {nav.cta}
              </Button>
              <button
                type="button"
                aria-label="Menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] border border-[color:var(--fh-line-strong)] lg:hidden"
              >
                <span
                  className="block h-px w-4 bg-current transition-transform duration-300"
                  style={{ transform: menuOpen ? "translateY(3px) rotate(45deg)" : undefined }}
                />
                <span
                  className="block h-px w-4 bg-current transition-transform duration-300"
                  style={{ transform: menuOpen ? "translateY(-3px) rotate(-45deg)" : undefined }}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sheet: the section list, numbered like the rail. */}
      <div
        className="fixed inset-0 z-40 bg-[color:var(--fh-bg)] lg:hidden"
        style={{
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 320ms var(--fh-ease-out)",
        }}
      >
        <div className="fh-shell flex h-full flex-col justify-center gap-1 pt-16">
          {sections.slice(1).map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-baseline gap-4 border-b border-[color:var(--fh-line)] py-4"
              style={{
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "none" : "translateY(12px)",
                transition: `opacity 420ms var(--fh-ease-out) ${i * 40}ms, transform 420ms var(--fh-ease-out) ${i * 40}ms`,
              }}
            >
              <span className="fh-mono text-[color:var(--fh-acid)]">{s.index}</span>
              <span className="text-xl font-medium">{s.label}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
