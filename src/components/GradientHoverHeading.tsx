import { useState, type CSSProperties } from "react";

/**
 * Speakeasy-style hero headline hover: a soft band of brand colour washes
 * across part of the headline, the rest staying ink. Subtle by design —
 * letters only tint partway toward the gradient, never fully saturate.
 * Purely presentational (chars stay inline, no layout change).
 */

const STOPS = ["#137DFF", "#FF18AA", "#FFCD17"] as const;
const INK = [17, 17, 20] as const;

/** where the coloured wash sits along the headline, and how wide it is */
const BAND_CENTER = 0.34;
const BAND_HALF = 0.3;
const BAND_FEATHER = 0.22;
/** max blend toward the gradient (0 = ink, 1 = full brand colour) */
const MAX_TINT = 0.62;

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}

function gradientAt(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  const seg = clamped * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(seg));
  const f = seg - i;
  const a = hexToRgb(STOPS[i]);
  const b = hexToRgb(STOPS[i + 1]);
  return a.map((v, k) => v + (b[k] - v) * f);
}

function smoothstep(x: number) {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

function tintAt(t: number) {
  const d = Math.abs(t - BAND_CENTER);
  const w = smoothstep((BAND_HALF + BAND_FEATHER - d) / BAND_FEATHER);
  const amount = MAX_TINT * w;
  if (amount <= 0.001) return "inherit";
  const g = gradientAt(t);
  const mix = INK.map((v, k) => Math.round(v + (g[k] - v) * amount));
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
  stagger = 9,
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
                style={{
                  color: hover ? tintAt(t) : "inherit",
                  transition: "color 560ms cubic-bezier(0.22, 1, 0.36, 1)",
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
