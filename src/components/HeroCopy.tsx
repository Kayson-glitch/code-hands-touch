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
          className="pointer-events-auto group relative inline-flex shrink-0 cursor-pointer items-center justify-center font-medium text-white transition-all"
          style={{
            height: 40,
            fontSize: 16,
            lineHeight: "24px",
            padding: "0 32px",
            borderRadius: 12,
            border: "0.125rem solid transparent",
            backgroundImage: [
              "linear-gradient(#0E0B22,#0E0B22)",
              "linear-gradient(#0E0B22 50%, rgba(14,11,34,0.6) 80%, rgba(14,11,34,0))",
              "linear-gradient(90deg, #137DFF, #FF18AA, #FFCD17, #137DFF)",
            ].join(","),
            backgroundClip: "padding-box, border-box, border-box",
            backgroundOrigin: "border-box",
            backgroundSize: "200%",
            animation: "rainbow-btn-flow var(--rainbow-speed, 2s) infinite linear",
          }}
        >
          {/* Rainbow glow beneath the button (MagicUI ::before) */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: "-20%",
              zIndex: 0,
              height: "20%",
              width: "60%",
              backgroundImage:
                "linear-gradient(90deg, #137DFF, #FF18AA, #FFCD17, #137DFF)",
              backgroundSize: "200%",
              filter: "blur(0.75rem)",
              animation: "rainbow-btn-flow var(--rainbow-speed, 2s) infinite linear",
            }}
          />
          <span className="relative z-10 inline-flex items-center gap-1.5">
            Book a Demo
            <span
              className="inline-flex max-w-0 -translate-x-1.5 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:max-w-[20px] group-hover:translate-x-0 group-hover:opacity-100"
            >
              <ArrowRight size={16} strokeWidth={2} className="relative -top-px flex-shrink-0" />
            </span>
          </span>
        </button>


      </div>
    </div>

  );
}

export default HeroCopy;