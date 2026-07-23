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
    // Enter together with the nav + chat dock, which react to `app-bg-change: dark`.
    const reveal = () => requestAnimationFrame(() => setEntered(true));
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<{ mode?: string }>).detail;
      if (detail?.mode === "dark") reveal();
    };
    window.addEventListener("app-bg-change", onBg as EventListener);
    // Fallback: if the event already fired before mount, the document background
    // will already be black — reveal immediately in that case.
    if (typeof document !== "undefined") {
      const bg = getComputedStyle(document.documentElement).backgroundColor;
      if (bg && /rgba?\(\s*0\s*,\s*0\s*,\s*0/.test(bg)) reveal();
    }
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
        transition: "opacity 1600ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "opacity",
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