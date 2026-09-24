import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { siteNav } from "../content";
import { useDocumentProgress } from "../hooks";
import { Mark, Wordmark } from "./Mark";
import { Button } from "./primitives";

export type NavSection = { id: string; index: string; label: string };

/**
 * Fixed header, shared by all three pages.
 *
 * Two things happen on scroll, both driven by the same 0→1 document progress:
 * a hairline acid bar fills across the very top, and the bar itself condenses
 * onto a blurred plate. Nothing animates on a timer — it is positional, so the
 * header always tells the truth about how far down the page you are.
 *
 * The links are destinations rather than anchors, so the lit one is whichever
 * page you are on. Section-level navigation is the rail's job.
 */
export function Nav({
  sections,
  ctaHref,
}: {
  /** Numbered index for the current page, used by the mobile sheet. */
  sections?: readonly NavSection[];
  ctaHref: string;
}) {
  const progress = useDocumentProgress();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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

  const onHome = pathname === siteNav.home || pathname === `${siteNav.home}/`;

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
            <a
              href={onHome ? "#hero" : siteNav.home}
              className="flex items-center gap-2.5 text-[15px]"
            >
              <Mark size={24} />
              <Wordmark />
            </a>

            <nav className="hidden items-center gap-1 sm:flex">
              {siteNav.links.map((link) => {
                const on = pathname.startsWith(link.href);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-current={on ? "page" : undefined}
                    className="fh-label relative whitespace-nowrap px-3 py-2 transition-colors duration-300"
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
              {/* `!` on display too: .fh-btn sets inline-flex and is loaded
                  after the utilities, so a plain `hidden` loses the tie. */}
              <Button href={ctaHref} className="!hidden !px-4 !py-2.5 sm:!inline-flex">
                {siteNav.cta}
              </Button>
              <button
                type="button"
                aria-label="Menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] border border-[color:var(--fh-line-strong)] sm:hidden"
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

      {/* Mobile sheet: the two destinations, then the numbered index of the
          page you are already on. */}
      <div
        className="fixed inset-0 z-40 bg-[color:var(--fh-bg)] sm:hidden"
        style={{
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 320ms var(--fh-ease-out)",
        }}
      >
        <div className="fh-shell flex h-full flex-col justify-center gap-1 pt-16">
          {siteNav.links.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between gap-4 border-b border-[color:var(--fh-line)] py-5"
              style={{
                color: pathname.startsWith(link.href) ? "var(--fh-acid)" : undefined,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "none" : "translateY(12px)",
                transition: `opacity 420ms var(--fh-ease-out) ${i * 60}ms, transform 420ms var(--fh-ease-out) ${i * 60}ms`,
              }}
            >
              <span className="text-2xl font-medium tracking-[-0.02em]">{link.label}</span>
              <svg width="12" height="12" viewBox="0 0 9 9" fill="none" aria-hidden>
                <path d="M1 8L8 1M8 1H3M8 1v5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </a>
          ))}

          {sections && sections.length > 1 && (
            <div className="mt-8 flex flex-col gap-1">
              {sections.slice(1).map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-baseline gap-3.5 py-2"
                  style={{
                    opacity: menuOpen ? 1 : 0,
                    transition: `opacity 420ms var(--fh-ease-out) ${180 + i * 40}ms`,
                  }}
                >
                  <span className="fh-figure text-[1rem] font-medium text-[color:var(--fh-acid)]">
                    {s.index}
                  </span>
                  <span className="text-[0.9375rem] text-[color:var(--fh-ink-dim)]">{s.label}</span>
                </a>
              ))}
            </div>
          )}

          {/* The header button is desktop-only, so the sheet has to carry it. */}
          <Button
            href={ctaHref}
            onClick={() => setMenuOpen(false)}
            className="mt-10 justify-center"
          >
            {siteNav.cta}
          </Button>
        </div>
      </div>
    </>
  );
}
