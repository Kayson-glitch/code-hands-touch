import { useEffect, useState } from "react";
import Aurora from "@/components/Aurora/Aurora";

/**
 * Wraps Aurora with a soft entry animation.
 * Listens for the same `app-bg-change: dark` cue that drives the hero entry,
 * then eases opacity, vertical drift and shader amplitude from 0 → target.
 */
export function AuroraIntro() {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Kick off the ease-in on mount (double rAF so initial hidden styles commit first)
    const r1 = requestAnimationFrame(() =>
      requestAnimationFrame(() => setEntered(true))
    );
    return () => cancelAnimationFrame(r1);
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
        amplitude={1.0}
        speed={0.5}
      />
    </div>
  );
}