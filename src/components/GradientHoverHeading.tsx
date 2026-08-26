import { useRef, useState, type CSSProperties } from "react";

/**
 * Speakeasy-style hero headline hover: a circular spotlight follows the cursor
 * and only the glyph area inside that circle picks up the brand gradient.
 * Implemented as an ink base layer plus a gradient-clipped copy masked by a
 * radial circle at the pointer — no layout change, no per-letter animation.
 */
const RADIUS = 105; // px — spotlight size (slightly smaller)
const GRADIENT = "linear-gradient(90deg, #137DFF 0%, #FF18AA 52%, #FFCD17 100%)";
const ENTER_DELAY = 260; // ms — wait before the spotlight fades in
const ENTER_DURATION = 340; // ms — fade-in duration after the delay

type Props = {
  text: string; // use "\n" for explicit line breaks
  className?: string;
  style?: CSSProperties;
  as?: "h1" | "h2";
};

export function GradientHoverHeading({ text, className, style, as: Tag = "h1" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);

  const lines = text.split("\n");
  const content = lines.map((line, i) => (
    <span key={i} style={{ display: "block" }}>
      {line}
    </span>
  ));

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
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
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
        setVisible(false);
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
        {content}
      </span>
    </Tag>
  );
}

export default GradientHoverHeading;
