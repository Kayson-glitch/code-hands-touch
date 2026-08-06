import { useEffect, useState } from "react";

export type HeroLayout = {
  titlePaddingTop: string;
  titleFontSize: string;
  titleLineHeight: string;
  subtitleFontSize: string;
  subtitleLineHeight: string;
  bodyFontSize: string;
  bodyLineHeight: string;
  handsTop: string;
  handsHeight: string;
  handsMaxWidth: number;
  cellSize: number;
};

// Fluid type: 1440 is the design baseline (48/56, 16/24, 14/22),
// every size tracks the viewport width from there.
const FLUID = {
  titleFontSize: "clamp(28px, 3.3333vw, 64px)",
  titleLineHeight: "clamp(34px, 3.8889vw, 74px)",
  subtitleFontSize: "clamp(13px, 1.1111vw, 21px)",
  subtitleLineHeight: "clamp(20px, 1.6667vw, 32px)",
  bodyFontSize: "clamp(12px, 0.9722vw, 18px)",
  bodyLineHeight: "clamp(20px, 1.5278vw, 29px)",
};

const DESKTOP: HeroLayout = {
  ...FLUID,
  titlePaddingTop: "calc(18vh + 20px)",
  handsTop: "calc(46vh - 28px)",
  handsHeight: "51vh",
  handsMaxWidth: Infinity,
  cellSize: 10,
};

const SHORT: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "calc(14vh + 20px)",
  handsTop: "calc(42vh - 20px)",
  handsHeight: "54vh",
};

const TABLET: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "calc(16vh + 20px)",
  handsTop: "calc(44vh - 20px)",
  handsHeight: "52vh",
};

const MOBILE: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "calc(10vh + 20px)",
  handsTop: "calc(40vh - 20px)",
  handsHeight: "56vh",
};

const WIDE: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "calc(20vh + 20px)",
  handsTop: "calc(44vh - 28px)",
  handsHeight: "55vh",
  handsMaxWidth: Infinity,
  cellSize: 12,
};

const ULTRA: HeroLayout = {
  ...WIDE,
  handsTop: "calc(42vh - 28px)",
  handsHeight: "58vh",
  handsMaxWidth: Infinity,
  cellSize: 14,
};

function pick(): HeroLayout {
  if (typeof window === "undefined") return DESKTOP;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 767) return MOBILE;
  if (w <= 1199) return TABLET;
  if (w >= 2000) return ULTRA;
  if (w >= 1600 && h > 760) return WIDE;
  if (h <= 819) return SHORT;
  return DESKTOP;
}

export function useHeroLayout(): HeroLayout {
  const [layout, setLayout] = useState<HeroLayout>(() => pick());
  useEffect(() => {
    const update = () => setLayout(pick());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return layout;
}