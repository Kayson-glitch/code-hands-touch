/** 1440px design value → fluid CSS length, clamped between `min` and `px`. */
export const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;
