import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useHeroLayout } from "@/hooks/useHeroLayout";


export function HeroCopy() {
  const [visible, setVisible] = useState(false);
  const layout = useHeroLayout();



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
      <div className="flex w-full max-w-[800px] flex-col items-center gap-10">
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
              maxWidth: 380,
              margin: 0,
            }}
          >
            Intelligent Knowledge Engine for accurate, context-aware responses.
          </p>
        </div>

        <button
          className="pointer-events-auto group relative inline-flex items-center justify-center overflow-hidden bg-ink font-medium text-white transition-transform hover:scale-[1.02]"
          style={{
            height: 40,
            fontSize: 16,
            lineHeight: "24px",
            padding: "0 32px",
            borderRadius: 12,
          }}
        >
          <span className="relative z-10 inline-flex items-center gap-1.5">
            Book a Demo
            <span
              className="inline-flex max-w-0 -translate-x-1.5 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:max-w-[20px] group-hover:translate-x-0 group-hover:opacity-100"
            >
              <ArrowRight size={16} strokeWidth={2} className="relative -top-px flex-shrink-0" />
            </span>
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 z-0"
            style={{
              left: 0,
              right: 0,
              height: 2,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              backgroundImage:
                "linear-gradient(90deg, #137DFF 0%, #FF18AA 33.333%, #FFCD17 66.666%, #137DFF 100%)",
              backgroundSize: "150% 100%",
              animation: "btn-border-flow 9s linear infinite",
            }}
          />
        </button>
      </div>
    </div>

  );
}

export default HeroCopy;