import { useEffect, useState } from "react";

export type HeroLayout = {
  titlePaddingTop: string;
  titleFontSize: number;
  titleLineHeight: string;
  subtitleFontSize: number;
  subtitleLineHeight: string;
  handsTop: string;
  handsHeight: string;
};

const DESKTOP: HeroLayout = {
  titlePaddingTop: "clamp(20vh, 24vh, 26vh)",
  titleFontSize: 48,
  titleLineHeight: "56px",
  subtitleFontSize: 16,
  subtitleLineHeight: "24px",
  handsTop: "calc(55vh - 20px)",
  handsHeight: "45vh",
};

const SHORT: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "18vh",
  titleFontSize: 44,
  titleLineHeight: "52px",
  handsTop: "calc(52vh - 16px)",
  handsHeight: "48vh",
};

const TABLET: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "20vh",
  titleFontSize: 40,
  titleLineHeight: "48px",
  handsTop: "50vh",
  handsHeight: "50vh",
};

const MOBILE: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "14vh",
  titleFontSize: 32,
  titleLineHeight: "40px",
  subtitleFontSize: 14,
  subtitleLineHeight: "22px",
  handsTop: "46vh",
  handsHeight: "54vh",
};

function pick(): HeroLayout {
  if (typeof window === "undefined") return DESKTOP;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 767) return MOBILE;
  if (w <= 1199) return TABLET;
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