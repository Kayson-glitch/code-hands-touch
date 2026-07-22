import { useEffect, useState } from "react";
import { useHeroLayout } from "@/hooks/useHeroLayout";

export function HeroCopy() {
  const [visible, setVisible] = useState(false);
  const layout = useHeroLayout();

  useEffect(() => {
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      if (detail === "dark") {
        // Let the hands intro animation start, then fade in together.
        window.setTimeout(() => setVisible(true), 150);
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
        filter: visible ? "blur(0px)" : "blur(12px)",
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition:
          "opacity 900ms ease-out, filter 900ms ease-out, transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "opacity, filter, transform",
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
          margin: 0,
        }}
      >
        Support that drives revenue,
        <br />
        powered by{" "}
        <span
          style={{
            background:
              "linear-gradient(90deg, #185DFF 0%, #D018FF 50%, #FF1245 100%, #D018FF 150%, #185DFF 200%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            animation: "synergy-gradient-flow 8s ease-in-out infinite",
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