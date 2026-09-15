import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger in ms. */
  delay?: number;
  /** Travel distance in px. */
  y?: number;
  /** Duration in ms. */
  duration?: number;
  /** Reveal on mount instead of on scroll (used above the fold). */
  immediate?: boolean;
  /**
   * "hero" reproduces the first-screen title entrance exactly: 12px blur,
   * 24px rise, 900ms, ease-out opacity/blur with the hero's spring-like curve
   * on the travel. Default keeps the lighter 6px-blur variant.
   */
  variant?: "default" | "hero";
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "header" | "footer" | "li";
};

/**
 * Scroll-triggered entrance: opacity + upward travel + a touch of blur,
 * matching the first-screen reveal language. Runs once per element.
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  duration = 900,
  immediate = false,
  variant = "default",
  className,
  style,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (immediate) {
      const t = window.setTimeout(() => setShown(true), 40);
      return () => window.clearTimeout(t);
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  const Tag = as as "div";
  const hero = variant === "hero";
  const blur = hero ? 12 : 6;
  const transition = hero
    ? `opacity ${duration}ms ease-out ${delay}ms, filter ${duration}ms ease-out ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`
    : `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`;

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        filter: shown ? "blur(0px)" : `blur(${blur}px)`,
        transform: shown ? "translateY(0)" : `translateY(${y}px)`,
        transition,
        willChange: "opacity, transform, filter",
      }}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
