import { useEffect, useState } from "react";

export type HeroLayout = {
  titlePaddingTop: string;
  titleFontSize: number;
  titleLineHeight: string;
  subtitleFontSize: number;
  subtitleLineHeight: string;
  handsTop: string;
  handsHeight: string;
  handsMaxWidth: number;
  cellSize: number;
};

const DESKTOP: HeroLayout = {
  titlePaddingTop: "calc(18vh + 20px)",
  titleFontSize: 48,
  titleLineHeight: "56px",
  subtitleFontSize: 16,
  subtitleLineHeight: "24px",
  handsTop: "calc(46vh - 28px)",
  handsHeight: "51vh",
  handsMaxWidth: Infinity,
  cellSize: 10,
};

const SHORT: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "calc(14vh + 20px)",
  titleFontSize: 44,
  titleLineHeight: "52px",
  handsTop: "calc(42vh - 20px)",
  handsHeight: "54vh",
};

const TABLET: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "calc(16vh + 20px)",
  titleFontSize: 40,
  titleLineHeight: "48px",
  handsTop: "calc(44vh - 20px)",
  handsHeight: "52vh",
};

const MOBILE: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "calc(10vh + 20px)",
  titleFontSize: 32,
  titleLineHeight: "40px",
  subtitleFontSize: 14,
  subtitleLineHeight: "22px",
  handsTop: "calc(40vh - 20px)",
  handsHeight: "56vh",
};

const WIDE: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "calc(20vh + 20px)",
  titleFontSize: 56,
  titleLineHeight: "64px",
  handsTop: "calc(44vh - 28px)",
  handsHeight: "55vh",
  handsMaxWidth: Infinity,
  cellSize: 12,
};

const ULTRA: HeroLayout = {
  ...WIDE,
  titleFontSize: 64,
  titleLineHeight: "72px",
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