import type * as React from "react";
import { cn } from "@/lib/utils";

export interface GradientBackgroundProps extends React.ComponentProps<"div"> {
  /** Colour at the outer edge of the radial wash. Defaults to the brand purple. */
  color?: string;
  /** Colour at the centre. Transparent by default so the page shows through. */
  from?: string;
  /** Where the centre colour stops (percent of the radius) before blending toward `color`. */
  stop?: number;
  /** Radial centre as a CSS position, e.g. "50% 10%". */
  at?: string;
  /** Radial size as CSS lengths/percentages, e.g. "125% 125%". */
  size?: string;
}

/**
 * GradientBackground — a soft radial wash that stays clear in the middle and
 * picks up the brand colour toward the edges, so whatever sits beneath stays
 * visible. Purely decorative; position it with `className`/`style`.
 */
export function GradientBackground({
  color = "#5749FF",
  from = "transparent",
  stop = 40,
  at = "50% 10%",
  size = "125% 125%",
  className,
  style,
  ...rest
}: GradientBackgroundProps) {
  return (
    <div
      aria-hidden
      data-slot="gradient-background"
      className={cn("pointer-events-none", className)}
      style={{
        background: `radial-gradient(${size} at ${at}, ${from} ${stop}%, ${color} 100%)`,
        ...style,
      }}
      {...rest}
    />
  );
}

/** Demo-compatible full-screen wrapper. */
export const Component = () => (
  <div className="relative min-h-screen w-full">
    <GradientBackground className="absolute inset-0 z-0" />
  </div>
);

export default GradientBackground;
