import { useEffect, useState } from "react";
import { useHeroLayout } from "@/hooks/useHeroLayout";
import { RainbowButton } from "@/components/RainbowButton";

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
      <div className="flex w-full max-w-[min(900px,62.5vw)] flex-col items-center gap-10">
        <div className="flex w-full flex-col items-center gap-2.5">
          <h1
            className="font-display text-ink-ghost"
            style={{
              fontSize: layout.titleFontSize,
              lineHeight: layout.titleLineHeight,
              fontWeight: 400,
              margin: 0,
            }}
          >
            Support That Drives Revenue,
            <br />
            <span className="text-ink">Powered by Synergy.AI.</span>
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

        <RainbowButton label="Book a Demo" className="pointer-events-auto" />
      </div>
    </div>
  );
}

export default HeroCopy;
