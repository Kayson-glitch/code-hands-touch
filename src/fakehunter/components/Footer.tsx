import { useRef, useState } from "react";
import { brand, footer } from "../content";
import { Mark } from "./Mark";
import { useInView } from "../hooks";

/**
 * Giant wordmark that responds to the pointer.
 *
 * Letters within reach of the cursor go acid and lift, with the falloff
 * computed from each letter's own centre — the same lens idea as the hero,
 * spent one last time on the name itself.
 */
function LiveWordmark() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [x, setX] = useState<number | null>(null);
  const letters = brand.wordmark.split("");

  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) setX(e.clientX - rect.left);
      }}
      onPointerLeave={() => setX(null)}
      className="flex w-full select-none justify-between"
      aria-label={brand.wordmark}
    >
      {letters.map((ch, i) => {
        const width = (ref.current?.offsetWidth ?? 1) / letters.length;
        const centre = width * (i + 0.5);
        const d = x === null ? Infinity : Math.abs(x - centre);
        const near = Math.max(0, 1 - d / (width * 2.2));
        return (
          <span
            key={`${ch}-${i}`}
            aria-hidden
            className="block font-semibold leading-[0.78]"
            style={{
              fontSize: "clamp(2.75rem,12.2vw,11rem)",
              letterSpacing: "-0.045em",
              color: near > 0.05 ? "var(--fh-acid)" : "var(--fh-ink)",
              opacity: 0.16 + near * 0.84,
              transform: `translateY(${-near * 8}px)`,
              transition:
                "color 260ms linear, opacity 260ms linear, transform 320ms var(--fh-ease-out)",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <footer className="relative border-t border-[color:var(--fh-line)] pt-[clamp(3.5rem,7vw,6rem)]">
      <div className="fh-shell">
        <div ref={ref} className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="fh-h3">{footer.newsletter.title}</h2>
            <p className="fh-body mt-2 text-[0.875rem]">{footer.newsletter.subtitle}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) setSent(true);
              }}
              className="mt-6"
            >
              <div className="flex border border-[color:var(--fh-line-strong)] transition-colors duration-300 focus-within:border-[color:var(--fh-acid)]">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSent(false);
                  }}
                  placeholder={footer.newsletter.placeholder}
                  aria-label={footer.newsletter.placeholder}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[0.875rem] outline-none placeholder:text-[color:var(--fh-ink-ghost)]"
                />
                <button
                  type="submit"
                  className="fh-mono shrink-0 bg-[color:var(--fh-acid)] px-5 text-[#0a0a0b] transition-colors duration-300 hover:bg-white"
                >
                  {sent ? "Done" : footer.newsletter.submit}
                </button>
              </div>
              <p className="mt-3 max-w-[52ch] text-[0.6875rem] leading-[1.7] text-[color:var(--fh-ink-ghost)]">
                {footer.newsletter.privacyNotice}
              </p>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-7">
            {footer.columns.map((col, ci) => (
              <div
                key={col.title}
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "none" : "translateY(14px)",
                  transition: `opacity 600ms var(--fh-ease-out) ${ci * 90}ms, transform 600ms var(--fh-ease-out) ${ci * 90}ms`,
                }}
              >
                <h3 className="fh-mono text-[color:var(--fh-acid)]">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#hero"
                        className="group inline-flex items-center gap-2 text-[0.875rem] text-[color:var(--fh-ink-dim)] transition-colors duration-200 hover:text-[color:var(--fh-ink)]"
                      >
                        <span className="block h-px w-0 bg-[color:var(--fh-acid)] transition-all duration-300 group-hover:w-3" />
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The wordmark runs at line-height 0.78, so the glyphs overflow their
          line box by roughly 0.11em top and bottom. The extra block padding
          keeps that overhang clear of the links above and the legal bar. */}
      <div className="fh-shell mt-[clamp(3rem,7vw,6rem)] py-[0.12em] text-[clamp(2.75rem,12.2vw,11rem)]">
        <LiveWordmark />
      </div>

      <div className="fh-shell mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--fh-line)] py-6">
        <div className="flex items-center gap-2.5">
          <Mark size={18} />
          <span className="fh-mono text-[color:var(--fh-ink-faint)]">{brand.tagline}</span>
        </div>
        <span className="fh-mono text-[color:var(--fh-ink-ghost)]">{footer.copyright}</span>
      </div>
    </footer>
  );
}
