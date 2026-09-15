import type * as React from "react";

/**
 * Dot-matrix (halftone) arrow used inside buttons.
 * Drawn on a 7x7 dot grid so it reads as a pixel/dot arrow rather than a stroke icon.
 *
 * Default state shows only the ">" chevron head (resident).
 * On hover (group-hover), the shaft dots fade in from the chevron outward,
 * "connecting" into a full arrow — see https://www.decimal.app hero button.
 *
 * Set `connectOnHover={false}` to always render the full arrow (e.g. the send button).
 */
type Dot = [number, number];

const CHEVRON_DOTS: Dot[] = [
  [3, 1],
  [4, 2],
  [5, 3],
  [4, 4],
  [3, 5],
];

// Shaft extends leftward from the chevron base.
const SHAFT_DOTS: Dot[] = [
  [0, 3],
  [1, 3],
  [2, 3],
  [3, 3],
  [4, 3],
];

export function DotArrow({
  size = 16,
  className,
  direction = "right",
  connectOnHover = true,
  dotRadius = 0.65,
}: {
  size?: number;
  className?: string;
  direction?: "right" | "up";
  connectOnHover?: boolean;
  /** Dot radius in viewBox units (14-unit grid). */
  dotRadius?: number;
}) {
  // The full arrow spans columns 0–5 (x 1–11), so its bounding box is
  // off-centre by one unit in the 14-unit viewBox. Centre it when the
  // whole arrow is always shown; the hover variant keeps its chevron anchor.
  const arrowOffset = connectOnHover ? 0 : 1;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={className}
      style={{
        display: "block",
        flexShrink: 0,
        transform: direction === "up" ? "rotate(-90deg)" : undefined,
      }}
    >
      <g transform={arrowOffset ? `translate(${arrowOffset} 0)` : undefined}>
        {/* Chevron head — always resident; nudges outward as the shaft connects. */}
        <g
          className={
            connectOnHover
              ? "transition-transform duration-300 ease-out group-hover:translate-x-[1.5px]"
              : undefined
          }
        >
          {CHEVRON_DOTS.map(([c, r]) => (
            <circle key={`c-${c}-${r}`} cx={c * 2 + 1} cy={r * 2 + 1} r={dotRadius} fill="currentColor" />
          ))}
        </g>

        {/* Shaft — connects into an arrow on hover. */}
        {SHAFT_DOTS.map(([c, r]) => {
          if (!connectOnHover) {
            return (
              <circle key={`s-${c}-${r}`} cx={c * 2 + 1} cy={r * 2 + 1} r={dotRadius} fill="currentColor" />
            );
          }
          // Rightmost shaft dot (closest to chevron) appears first,
          // leftmost last — so the line draws out from the chevron.
          const delay = (4 - c) * 45;
          return (
            <circle
              key={`s-${c}-${r}`}
              cx={c * 2 + 1}
              cy={r * 2 + 1}
              r={dotRadius}
              fill="currentColor"
              className="opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
              style={{ transitionDelay: `${delay}ms` }}
            />
          );
        })}
      </g>
    </svg>
  );
}

export default DotArrow;
