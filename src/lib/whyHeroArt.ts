import type { CSSProperties } from "react";
import { fluid } from "@/lib/fluid";

const ART_W = fluid(741, 400);

/**
 * Where the four Why heroes hang their subject — one box, so the pages can't
 * drift apart. It hangs off the right edge of the window rather than off the
 * copy column: the column stops growing at 1200 and the window doesn't, so a
 * column-anchored box stops running off the page somewhere past 1600 and the
 * print ends up a small rectangle marooned in the right margin.
 */
export const WHY_HERO_ART: CSSProperties = {
  top: fluid(115, 66),
  width: ART_W,
  height: fluid(425, 230),
  /** Holds the same tenth of the print off the page at every width. */
  right: `calc(${ART_W} * -0.11)`,
};

/** Softens the box edges the subject bleeds through. */
export function whyHeroArtMask(...extra: string[]): CSSProperties {
  const layers = [
    "linear-gradient(to right, transparent 0, #000 14%)",
    "linear-gradient(to top, transparent 0, #000 14%)",
    ...extra,
  ].join(", ");
  return {
    maskImage: layers,
    WebkitMaskImage: layers,
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  };
}
