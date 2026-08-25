import { useEffect, useRef, useState } from "react";

type Props = {
  /** e.g. "$12M" or "75" */
  value: string;
  /** ms per digit stagger */
  stagger?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Odometer-style digit roll. Non-digit characters render statically.
 * Animation starts when the element scrolls into view.
 */
export function RollingNumber({
  value,
  stagger = 90,
  duration = 1100,
  className,
  style,
}: Props) {
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const chars = value.split("");
  let digitIndex = 0;

  return (
    <span
      ref={hostRef}
      className={className}
      style={{ display: "inline-flex", alignItems: "baseline", ...style }}
    >
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={`${ch}-${i}`} style={{ display: "inline-block" }}>
              {ch}
            </span>
          );
        }
        const target = Number(ch);
        const delay = digitIndex * stagger;
        digitIndex += 1;
        // roll through one full loop then land on target
        const offset = active ? 10 + target : 0;
        return (
          <span
            key={`${ch}-${i}`}
            aria-hidden
            style={{
              display: "inline-block",
              height: "1em",
              overflow: "hidden",
              verticalAlign: "bottom",
              lineHeight: "1em",
            }}
          >
            <span
              style={{
                display: "block",
                transform: `translateY(-${offset}em)`,
                transition: `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
                willChange: "transform",
              }}
            >
              {Array.from({ length: 21 }, (_, n) => (
                <span
                  key={n}
                  style={{ display: "block", height: "1em", lineHeight: "1em" }}
                >
                  {n % 10}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      <span className="sr-only">{value}</span>
    </span>
  );
}

export default RollingNumber;
