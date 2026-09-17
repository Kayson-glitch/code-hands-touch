import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Speakeasy-style hero headline hover: a circular spotlight follows the cursor
 * and only the glyph area inside that circle picks up the brand gradient.
 * Implemented as an ink base layer plus a gradient-clipped copy masked by a
 * radial circle at the pointer — no layout change, no per-letter animation.
 * The spotlight trails the pointer with a little damping instead of snapping.
 */
const RADIUS = 88; // px — spotlight size
const GRADIENT = "linear-gradient(90deg, #137DFF 0%, #FF18AA 52%, #FFCD17 100%)";
const ENTER_DELAY = 260; // ms — wait before the spotlight fades in
const ENTER_DURATION = 340; // ms — fade-in duration after the delay
/** Per-frame easing toward the pointer (lower = heavier, laggier spotlight). */
const FOLLOW = 0.14;

type Props = {
  text: string; // use "\n" for explicit line breaks
  className?: string;
  style?: CSSProperties;
  as?: "h1" | "h2";
  /**
   * Only honour the "\n" breaks from this breakpoint up; below it the heading
   * wraps naturally, so a break tuned for desktop can't strand a single word
   * on a phone.
   */
  breakFrom?: "md" | "lg";
  /**
   * Content set beside the last line (e.g. a short intro hanging off the
   * headline). Rendered in the ink layer only; the gradient copy keeps the
   * same line box so the glyphs still line up.
   */
  trailing?: React.ReactNode;
  /** Gap between the last line and `trailing`. */
  trailingGap?: number;
};

export function GradientHoverHeading({
  text,
  className,
  style,
  as: Tag = "h1",
  breakFrom,
  trailing,
  trailingGap = 24,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const target = useRef<{ x: number; y: number } | null>(null);
  const current = useRef<{ x: number; y: number } | null>(null);
  const raf = useRef<number | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);

  // Damped follow: the spotlight eases toward the pointer every frame.
  const tick = () => {
    raf.current = null;
    const t = target.current;
    if (!t) return;
    const c = current.current ?? t;
    const next = { x: c.x + (t.x - c.x) * FOLLOW, y: c.y + (t.y - c.y) * FOLLOW };
    current.current = next;
    setPos(next);
    if (Math.abs(t.x - next.x) > 0.3 || Math.abs(t.y - next.y) > 0.3) {
      raf.current = requestAnimationFrame(tick);
    }
  };
  const wake = () => {
    if (raf.current === null) raf.current = requestAnimationFrame(tick);
  };

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const lines = text.split("\n");
  const renderLines = (withTrailing: boolean) =>
    breakFrom
      ? lines.map((line, i) => {
          const last = i === lines.length - 1;
          return (
            <span key={i}>
              {i > 0 ? (
                <>
                  {" "}
                  <br className={breakFrom === "md" ? "hidden md:inline" : "hidden lg:inline"} />
                </>
              ) : null}
              {line}
              {last && withTrailing && trailing ? (
                <span
                  // no indent when the trailing block wraps onto its own line on phones
                  className="inline-flex md:ml-[var(--trailing-gap)]"
                  style={{ "--trailing-gap": `${trailingGap}px`, verticalAlign: "middle" } as CSSProperties}
                >
                  {trailing}
                </span>
              ) : null}
            </span>
          );
        })
      : lines.map((line, i) => {
          const last = i === lines.length - 1;
          const hasTrailing = last && trailing;
          return (
            <span
              key={i}
              className={hasTrailing ? "flex flex-wrap items-end" : undefined}
              style={{ display: hasTrailing ? undefined : "block", gap: hasTrailing ? trailingGap : undefined }}
            >
              {line}
              {hasTrailing && withTrailing ? trailing : null}
            </span>
          );
        });
  const content = renderLines(true);
  const ghost = renderLines(false);

  const mask = pos
    ? `radial-gradient(circle ${RADIUS}px at ${pos.x}px ${pos.y}px, #000 0%, rgba(0,0,0,0.75) 55%, transparent 100%)`
    : "radial-gradient(circle 0px at 50% 50%, transparent, transparent)";

  return (
    <Tag
      className={className}
      style={{ ...style, position: "relative", cursor: "default" }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
        // First contact starts under the pointer rather than sweeping in from afar.
        if (!current.current) current.current = target.current;
        wake();
      }}
      onMouseEnter={() => {
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setVisible(true), ENTER_DELAY);
      }}
      onMouseLeave={() => {
        if (timer.current) {
          window.clearTimeout(timer.current);
          timer.current = null;
        }
        if (raf.current !== null) {
          cancelAnimationFrame(raf.current);
          raf.current = null;
        }
        setVisible(false);
        target.current = null;
        current.current = null;
        setPos(null);
      }}
    >
      <span ref={ref} style={{ display: "block" }}>
        {content}
      </span>

      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: GRADIENT,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitMaskImage: mask,
          maskImage: mask,
          opacity: visible ? 1 : 0,
          transition: visible
            ? `opacity ${ENTER_DURATION}ms ease-out`
            : "opacity 160ms ease-out",
        }}
      >
        {ghost}
      </span>
    </Tag>
  );
}

export default GradientHoverHeading;
