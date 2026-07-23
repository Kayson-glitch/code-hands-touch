import { useEffect, useState } from "react";
import Aurora from "@/components/Aurora/Aurora";

/**
 * Wraps Aurora with a soft entry animation.
 * Listens for the same `app-bg-change: dark` cue that drives the hero entry,
 * then eases opacity, vertical drift and shader amplitude from 0 → target.
 */
export function AuroraIntro() {
  const [entered, setEntered] = useState(false);
  const [amp, setAmp] = useState(0);

  useEffect(() => {
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<{ mode?: string }>).detail;
      if (detail?.mode === "dark") trigger();
    };
    const trigger = () => {
      // next frame so the initial (hidden) styles are committed first
      requestAnimationFrame(() => setEntered(true));
      // ramp shader amplitude 0 → 1 over ~1600ms with ease-out
      const start = performance.now();
      const dur = 1600;
      let raf = 0;
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        setAmp(eased);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    };
    window.addEventListener("app-bg-change", onBg as EventListener);
    return () => window.removeEventListener("app-bg-change", onBg as EventListener);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: "50%",
        zIndex: 2,
        pointerEvents: "none",
        opacity: entered ? 1 : 0,
        transform: entered ? "translate3d(0,0,0) scale(1)" : "translate3d(0,-24px,0) scale(1.04)",
        filter: entered ? "blur(0px)" : "blur(14px)",
        transition:
          "opacity 1600ms cubic-bezier(0.22, 1, 0.36, 1), transform 1800ms cubic-bezier(0.22, 1, 0.36, 1), filter 1400ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "opacity, transform, filter",
      }}
    >
      <Aurora
        colorStops={["#185DFF", "#8B22FF", "#E81A8A"]}
        blend={0.5}
        amplitude={amp}
        speed={0.5}
      />
    </div>
  );
}