import { useEffect, useState } from "react";
import { useHeroLayout } from "@/hooks/useHeroLayout";

export function HeroCopy() {
  const [visible, setVisible] = useState(false);
  const layout = useHeroLayout();

  useEffect(() => {
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      if (detail === "dark") {
        // Fade in shortly after the hands stage begins
        window.setTimeout(() => setVisible(true), 350);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener("app-bg-change", onBg);
    return () => window.removeEventListener("app-bg-change", onBg);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center px-6 text-center"
      style={{
        paddingTop: layout.titlePaddingTop,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 700ms ease-out, transform 700ms ease-out",
      }}
    >
      <h1
        className="font-display text-white"
        style={{
          fontSize: layout.titleFontSize,
          lineHeight: layout.titleLineHeight,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          maxWidth: 900,
        }}
      >
        Support that drives revenue,
        <br />
        powered by{" "}
        <span
          style={{
            background:
              "linear-gradient(90deg, #6B4CFF 0%, #B478FF 55%, #E36BFF 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          Synergy.AI.
        </span>
      </h1>

      <p
        className="mt-5 text-white/60"
        style={{ fontSize: layout.subtitleFontSize, lineHeight: layout.subtitleLineHeight, fontWeight: 400 }}
      >
        Intelligent Knowledge Engine for accurate, context-aware responses.
      </p>

      <button
        className="pointer-events-auto mt-8 rounded-full bg-white px-6 font-medium text-black transition-transform hover:scale-[1.03]"
        style={{ height: 40, fontSize: 14, lineHeight: "22px" }}
      >
        Book a Demo
      </button>
    </div>
  );
}

export default HeroCopy;