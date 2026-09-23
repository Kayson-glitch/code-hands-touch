import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCountUp, useInView } from "../hooks";

/* -------------------------------------------------------------------------- */
/*  Frame — the survey-bracket motif                                           */
/* -------------------------------------------------------------------------- */

export function Frame({
  children,
  lit = false,
  className,
}: {
  children: ReactNode;
  lit?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("fh-frame", className)} data-lit={lit}>
      <span className="fh-frame-b" aria-hidden />
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section header                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The numbered rule that opens every section. The rule draws itself from left
 * to right on entry, so each section announces itself the same way the scan
 * beam resolves a headline.
 */
export function SectionHeader({
  index,
  label,
  className,
}: {
  index: string;
  label: string;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.6 });

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div className="flex items-baseline gap-3">
        <span className="fh-label text-[color:var(--fh-acid)]">{index}</span>
        <span className="fh-label text-[color:var(--fh-acid)]">{label}</span>
      </div>
      <div className="relative mt-3 h-px w-full overflow-hidden bg-[color:var(--fh-line)]">
        <div
          className="h-full bg-[color:var(--fh-acid)] origin-left"
          style={{
            transform: `scaleX(${inView ? 1 : 0})`,
            transition: "transform 1100ms var(--fh-ease-out)",
          }}
        />
      </div>
      {/* Survey ticks on both ends of the rule. */}
      <span className="absolute -bottom-[3px] left-0 h-[7px] w-px bg-[color:var(--fh-acid)]" />
      <span className="absolute -bottom-[3px] right-0 h-[7px] w-px bg-[color:var(--fh-line-strong)]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Scan heading                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Headline that is unmasked left-to-right behind a travelling acid beam.
 * Used once per section so the effect keeps its weight.
 */
export function ScanHeading({
  children,
  as: Tag = "h2",
  className,
  delay = 0,
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  delay?: number;
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.35 });

  return (
    <div ref={ref} className="fh-scan" data-shown={inView} style={{ animationDelay: `${delay}ms` }}>
      <span className="fh-scan__beam" aria-hidden style={{ animationDelay: `${delay}ms` }} />
      <Tag
        className={cn("fh-scan__text", className)}
        style={{ transitionDelay: `${delay + 90}ms` }}
      >
        {children}
      </Tag>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Counter                                                                    */
/* -------------------------------------------------------------------------- */

export function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  duration,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.5 });
  const live = useCountUp(value, inView, duration);

  return (
    <span ref={ref} className={cn("fh-tnum", className)}>
      {prefix}
      {live.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Buttons                                                                    */
/* -------------------------------------------------------------------------- */

export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  className,
  arrow = true,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost";
  href?: string;
  onClick?: () => void;
  className?: string;
  arrow?: boolean;
}) {
  const classes = cn(
    "fh-btn",
    variant === "primary" ? "fh-btn--primary" : "fh-btn--ghost",
    className,
  );
  const inner = (
    <>
      <span>{children}</span>
      {arrow && (
        <svg
          className="fh-btn__arrow"
          width="14"
          height="10"
          viewBox="0 0 14 10"
          fill="none"
          aria-hidden
        >
          <path d="M9 1l4 4-4 4M13 5H0" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Verdict chip                                                               */
/* -------------------------------------------------------------------------- */

export function Verdict({ tone, children }: { tone: "forged" | "genuine"; children: ReactNode }) {
  const forged = tone === "forged";
  return (
    <span
      className="fh-label inline-flex items-center gap-1.5 px-2 py-1"
      style={{
        color: forged ? "var(--fh-forged)" : "var(--fh-genuine)",
        background: forged ? "var(--fh-forged-ghost)" : "var(--fh-genuine-ghost)",
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "currentColor" }}
      />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section wrapper                                                            */
/* -------------------------------------------------------------------------- */

export function Section({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("relative scroll-mt-24 py-[clamp(4.5rem,9vw,9rem)]", className)}>
      {children}
    </section>
  );
}
