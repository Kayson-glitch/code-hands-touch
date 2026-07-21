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
  titlePaddingTop: "20vh",
  titleFontSize: 48,
  titleLineHeight: "56px",
  subtitleFontSize: 16,
  subtitleLineHeight: "24px",
  handsTop: "calc(48vh - 8px)",
  handsHeight: "51vh",
};

const SHORT: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "16vh",
  titleFontSize: 44,
  titleLineHeight: "52px",
  handsTop: "44vh",
  handsHeight: "54vh",
};

const TABLET: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "18vh",
  titleFontSize: 40,
  titleLineHeight: "48px",
  handsTop: "46vh",
  handsHeight: "52vh",
};

const MOBILE: HeroLayout = {
  ...DESKTOP,
  titlePaddingTop: "12vh",
  titleFontSize: 32,
  titleLineHeight: "40px",
  subtitleFontSize: 14,
  subtitleLineHeight: "22px",
  handsTop: "42vh",
  handsHeight: "56vh",
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