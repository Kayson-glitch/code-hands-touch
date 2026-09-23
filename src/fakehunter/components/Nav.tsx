import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useActiveSection, useDocumentProgress } from "../hooks";
import { Mark, Wordmark } from "./Mark";
import { Button } from "./primitives";

export type NavLink = { label: string; href: string; short?: string };
export type NavSection = { id: string; index: string; label: string };

/**
 * Fixed header, shared by both pages.
 *
 * Three things happen on scroll, all driven by the same 0→1 document progress:
 * a hairline acid bar fills across the very top, the bar itself condenses onto
 * a blurred plate, and the link matching the section under the reading line
 * lights up. Nothing here animates on a timer — it is all positional, so the
 * header always tells the truth about where you are.
 */
export function Nav({
  links,
  sections,
  cta,
  ctaHref,
  aside,
}: {
  links: readonly NavLink[];
  /** Full section list, used for the mobile sheet. */
  sections: readonly NavSection[];
  cta: string;
  ctaHref: string;
  /** A link off this page, set apart from the in-page anchors. */
  aside?: NavLink;
}) {
  const progress = useDocumentProgress();
  const anchorIds = links.filter((l) => l.href.startsWith("#")).map((l) => l.href.slice(1));
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
              {links.map((link) => {
                const id = link.href.slice(1);
                const on = active === id;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className="fh-label relative px-2.5 py-2 transition-colors duration-300 xl:px-3"
                    style={{ color: on ? "var(--fh-ink)" : "var(--fh-ink-faint)" }}
                  >
                    {link.label}
                    <span
                      className="absolute inset-x-2.5 bottom-1 h-px origin-left bg-[color:var(--fh-acid)] xl:inset-x-3"
                      style={{
                        transform: `scaleX(${on ? 1 : 0})`,
                        transition: "transform 420ms var(--fh-ease-out)",
                      }}
                    />
                  </a>
                );
              })}
              {aside && (
                <a
                  href={aside.href}
                  className="fh-label group ml-2 flex items-center gap-2 whitespace-nowrap border-l border-[color:var(--fh-line)] pl-3.5 text-[color:var(--fh-ink-faint)] transition-colors duration-300 hover:text-[color:var(--fh-acid)]"
                >
                  {/* Abbreviated until there is room for the full label: at
                      laptop widths the nav has no slack left. */}
                  <span className="xl:hidden">{aside.short ?? aside.label}</span>
                  <span className="hidden xl:inline">{aside.label}</span>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                    <path
                      d="M1 8L8 1M8 1H3M8 1v5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      className="transition-transform duration-300 group-hover:translate-x-[1px]"
                    />
                  </svg>
                </a>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {/* `!` on display too: .fh-btn sets inline-flex and is loaded
                  after the utilities, so a plain `hidden` loses the tie. */}
              <Button href={ctaHref} className="!hidden !px-4 !py-2.5 sm:!inline-flex">
                {cta}
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
              <span className="fh-figure text-[1.125rem] font-semibold text-[color:var(--fh-acid)]">
                {s.index}
              </span>
              <span className="text-xl font-medium">{s.label}</span>
            </a>
          ))}
          {aside && (
            <a
              href={aside.href}
              onClick={() => setMenuOpen(false)}
              className="mt-6 flex items-center gap-3 text-[color:var(--fh-acid)]"
              style={{
                opacity: menuOpen ? 1 : 0,
                transition: `opacity 420ms var(--fh-ease-out) ${sections.length * 40}ms`,
              }}
            >
              <span className="fh-label">{aside.label}</span>
              <svg width="11" height="11" viewBox="0 0 9 9" fill="none" aria-hidden>
                <path d="M1 8L8 1M8 1H3M8 1v5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </>
  );
}
