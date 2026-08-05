import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useHeroLayout } from "@/hooks/useHeroLayout";


export function HeroCopy() {
  const [visible, setVisible] = useState(false);
  const layout = useHeroLayout();
  const gradientRef = useRef<HTMLSpanElement | null>(null);

  // Drive the Synergy.AI gradient in lockstep with the Aurora shader.
  // Aurora uses speed=0.5; its noise field advances as uTime * speed * 0.1.
  // We map that same phase onto background-position + a subtle hue sweep so
  // the text appears to "breathe" with the aurora ribbons above it.
  useEffect(() => {
    let raf = 0;
    const AURORA_SPEED = 0.5;
    const tick = () => {
      const el = gradientRef.current;
      if (el) {
        const t = performance.now() / 1000;
        const phase = t * AURORA_SPEED; // shared with Aurora uTime*speed
        // Slow horizontal sweep, matched to aurora ribbon drift
        const x = 50 + Math.sin(phase * 0.35) * 50; // 0..100
        const y = 50 + Math.cos(phase * 0.22) * 40; // 10..90
        const angle = 115 + Math.sin(phase * 0.18) * 8; // gentle tilt wobble
        el.style.backgroundPosition = `${x}% ${y}%`;
        el.style.backgroundImage = `linear-gradient(${angle}deg, #185DFF 0%, #4B3AFF 22%, #8B22FF 44%, #D018FF 62%, #E81A8A 82%, #185DFF 100%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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
          className="pointer-events-auto group relative inline-flex items-center justify-center bg-ink font-medium text-white transition-transform hover:scale-[1.02]"
          style={{
            height: 40,
            fontSize: 16,
            lineHeight: "24px",
            padding: "0 24px",
            borderRadius: 12,
            borderBottom: "1px solid var(--accent-blue)",
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
        </button>
      </div>
    </div>

  );
}

export default HeroCopy;