import { useEffect, useRef, useState } from "react";
import Aurora from "@/components/Aurora/Aurora";

/**
 * Wraps Aurora with a soft entry animation.
 * Listens for the same `app-bg-change: light` cue that drives the hero entry,
 * then eases opacity from 0 → 1.
 */
export function AuroraIntro() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Enter together with the nav + chat dock, which react to `app-bg-change: light`.
    // Double rAF guarantees the browser paints at opacity 0 before we flip to 1,
    // so the CSS transition actually runs instead of being coalesced away.
    let raf1 = 0;
    let raf2 = 0;
    const reveal = () => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setEntered(true));
      });
    };
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<string | { mode?: string }>).detail;
      const mode = typeof detail === "string" ? detail : detail?.mode;
      if (mode === "light") reveal();
    };
    window.addEventListener("app-bg-change", onBg as EventListener);

    raf1 = requestAnimationFrame(() => {
      const sectionBg = wrapperRef.current?.closest("section")
        ? getComputedStyle(wrapperRef.current.closest("section") as HTMLElement).backgroundColor
        : "";
      if (sectionBg === "rgb(255, 255, 255)" || sectionBg === "#fff" || sectionBg === "#ffffff") {
        raf2 = requestAnimationFrame(() => setEntered(true));
      }
    });

    return () => {
      window.removeEventListener("app-bg-change", onBg as EventListener);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      data-aurora-intro="true"
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