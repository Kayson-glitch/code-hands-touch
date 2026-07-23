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
        window.setTimeout(() => setVisible(true), 40);
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
              "linear-gradient(115deg, #185DFF 0%, #4B3AFF 18%, #8B22FF 34%, #D018FF 50%, #E81A8A 66%, #FF1245 82%, #D018FF 100%)",
            backgroundSize: "220% 220%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            animation: "synergy-gradient-flow 11s ease-in-out infinite",
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
        className="pointer-events-auto group relative mt-8 inline-flex items-center justify-center overflow-visible font-medium text-black transition-transform hover:scale-[1.03]"
        style={{
          height: 40,
          fontSize: 14,
          lineHeight: "22px",
          padding: "0 24px",
          borderRadius: 10,
          border: "1px solid transparent",
          backgroundImage:
            "linear-gradient(#ffffff,#ffffff)," +
            "linear-gradient(#ffffff 50%, rgba(255,255,255,0.65) 80%, rgba(255,255,255,0)),"+
            "linear-gradient(90deg, #ff1245, #d018ff, #185dff, #4b3aff, #e81a8a, #ff1245)",
          backgroundSize: "200%",
          backgroundClip: "padding-box, border-box, border-box",
          backgroundOrigin: "border-box",
          animation: "rainbow-btn-flow 2s linear infinite",
        }}
      >
        {/* Rainbow glow underneath */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2"
          style={{
            bottom: "-20%",
            height: "20%",
            width: "60%",
            filter: "blur(0.75rem)",
            background:
              "linear-gradient(90deg, #ff1245, #d018ff, #185dff, #4b3aff, #e81a8a, #ff1245)",
            backgroundSize: "200% 100%",
            animation: "rainbow-btn-flow 2s linear infinite",
          }}
        />
        <span className="relative z-10">Book a Demo</span>
      </button>
    </div>
  );
}

export default HeroCopy;