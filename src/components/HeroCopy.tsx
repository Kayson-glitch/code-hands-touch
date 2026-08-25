import { useEffect, useState } from "react";
import { useHeroLayout } from "@/hooks/useHeroLayout";
import { DotArrow } from "@/components/DotArrow";


export function HeroCopy() {
  const [visible, setVisible] = useState(false);
  const layout = useHeroLayout();
  const btnFace = "#0E0B22";
  const btnFaceRgb = "14,11,34";



  useEffect(() => {
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      if (detail === "dark") {
        // Stage B: hero title reveals ~640ms after the background flips,
        // so nav + chat dock (Stage A) can finish their fade first.
        window.setTimeout(() => setVisible(true), 640);
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
      <div className="flex w-full max-w-[min(800px,55.5556vw)] flex-col items-center gap-10">
        <div className="flex w-full flex-col items-center gap-2.5">
          <h1
            className="font-display capitalize text-ink-ghost"
            style={{
              fontSize: layout.titleFontSize,
              lineHeight: layout.titleLineHeight,
              fontWeight: 500,
              margin: 0,
            }}
          >
            Support that drives revenue,
            <br />
            <span className="text-ink">powered by Synergy.AI.</span>
          </h1>

          <p
            className="text-ink"
            style={{
              fontSize: layout.subtitleFontSize,
              lineHeight: layout.subtitleLineHeight,
              fontWeight: 400,
              maxWidth: "clamp(280px, 26.3889vw, 500px)",
              margin: 0,
            }}
          >
            Intelligent Knowledge Engine for accurate, context-aware responses.
          </p>
        </div>

        <button
          className="pointer-events-auto group relative inline-flex shrink-0 cursor-pointer items-center justify-center font-medium transition-all"
          style={{
            height: 36,
            fontSize: 14,
            lineHeight: "20px",
            fontWeight: 500,
            padding: "0 20px",

            borderRadius: 2,
            borderBottom: "1.5px solid transparent",
            color: "#FFFFFF",
            backgroundImage: [
              `linear-gradient(${btnFace},${btnFace})`,
              `linear-gradient(${btnFace} 50%, rgba(${btnFaceRgb},0.6) 80%, rgba(${btnFaceRgb},0))`,
              "linear-gradient(90deg, #137DFF 0%, #FF18AA 33.333%, #FFCD17 66.666%, #137DFF 100%)",
            ].join(","),
            backgroundClip: "padding-box, border-box, border-box",
            backgroundOrigin: "border-box",
            backgroundSize: "200%",
            animation: "rainbow-btn-flow var(--rainbow-speed, 9s) infinite linear",
          }}
        >
          <span className="relative z-10 inline-flex items-center gap-0">
            Book a Demo
            <span
              className="inline-flex max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:ml-1.5 group-hover:max-w-[20px] group-hover:opacity-100"
            >
              <DotArrow size={16} className="relative -top-px flex-shrink-0" />
            </span>
          </span>

        </button>


      </div>
    </div>

  );
}

export default HeroCopy;