import { useState, type CSSProperties } from "react";

/**
 * Speakeasy-style hero headline hover: letters colourise one after another
 * along the brand gradient, then fade back to ink on mouse-out.
 * Purely presentational — no layout change (chars stay inline).
 */

const STOPS = ["#137DFF", "#FF18AA", "#FFCD17"] as const;

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}

function sample(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  const seg = clamped * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(seg));
  const f = seg - i;
  const a = hexToRgb(STOPS[i]);
  const b = hexToRgb(STOPS[i + 1]);
  const mix = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

type Props = {
  text: string; // use "\n" for explicit line breaks
  className?: string;
  style?: CSSProperties;
  as?: "h1" | "h2";
  /** ms between neighbouring letters */
  stagger?: number;
};

export function GradientHoverHeading({
  text,
  className,
  style,
  as: Tag = "h1",
  stagger = 18,
}: Props) {
  const [hover, setHover] = useState(false);

  const lines = text.split("\n");
  const total = Math.max(1, text.replace(/\n/g, "").length - 1);
  let cursor = 0;

  return (
    <Tag
      className={className}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {lines.map((line, li) => (
        <span key={li} style={{ display: "block" }}>
          {Array.from(line).map((ch, ci) => {
            const idx = cursor++;
            const t = idx / total;
            return (
              <span
                key={ci}
                aria-hidden={false}
                style={{
                  color: hover ? sample(t) : "inherit",
                  transition: "color 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                  transitionDelay: `${(hover ? idx : total - idx) * stagger}ms`,
                  whiteSpace: ch === " " ? "pre" : undefined,
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

export default GradientHoverHeading;
