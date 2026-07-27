import { useEffect, useRef, useState } from "react";

/**
 * hugo.ai-style breathing gradient background.
 * Blue → purple → pink → red blurred color blobs that slowly pulse in
 * brightness/scale. Wrapped with an opacity fade-in synced to the
 * `app-bg-change: dark` cue so it enters with nav + chat dock.
 */
export function AuroraIntro() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Enter together with the nav + chat dock, which react to `app-bg-change: dark`.
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
      if (mode === "dark") reveal();
    };
    window.addEventListener("app-bg-change", onBg as EventListener);

    raf1 = requestAnimationFrame(() => {
      const sectionBg = wrapperRef.current?.closest("section")
        ? getComputedStyle(wrapperRef.current.closest("section") as HTMLElement).backgroundColor
        : "";
      if (sectionBg === "rgb(0, 0, 0)" || sectionBg === "#000") {
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
        overflow: "hidden",
      }}
    >
      <div className="hugo-breath-stage">
        <span className="hugo-blob hugo-blob-blue" />
        <span className="hugo-blob hugo-blob-purple" />
        <span className="hugo-blob hugo-blob-pink" />
        <span className="hugo-blob hugo-blob-red" />
        <span className="hugo-breath-veil" />
      </div>
      <style>{`
        .hugo-breath-stage {
          position: absolute;
          inset: -20% -10% -40% -10%;
          filter: blur(70px) saturate(125%);
          animation: hugo-breath 9s ease-in-out infinite;
          will-change: opacity, transform;
        }
        .hugo-blob {
          position: absolute;
          display: block;
          border-radius: 50%;
          mix-blend-mode: screen;
          opacity: 0.95;
          will-change: transform, opacity;
        }
        .hugo-blob-blue {
          width: 55vw; height: 55vw;
          left: -8vw; top: -18vw;
          background: radial-gradient(circle at 50% 50%, #1E63FF 0%, rgba(30,99,255,0.55) 40%, rgba(30,99,255,0) 70%);
          animation: hugo-drift-a 14s ease-in-out infinite;
        }
        .hugo-blob-purple {
          width: 60vw; height: 60vw;
          left: 18vw; top: -22vw;
          background: radial-gradient(circle at 50% 50%, #8A3BFF 0%, rgba(138,59,255,0.55) 40%, rgba(138,59,255,0) 70%);
          animation: hugo-drift-b 17s ease-in-out infinite;
        }
        .hugo-blob-pink {
          width: 55vw; height: 55vw;
          left: 42vw; top: -14vw;
          background: radial-gradient(circle at 50% 50%, #FF3EA5 0%, rgba(255,62,165,0.55) 40%, rgba(255,62,165,0) 70%);
          animation: hugo-drift-c 16s ease-in-out infinite;
        }
        .hugo-blob-red {
          width: 50vw; height: 50vw;
          left: 62vw; top: -20vw;
          background: radial-gradient(circle at 50% 50%, #FF3B3B 0%, rgba(255,59,59,0.5) 40%, rgba(255,59,59,0) 70%);
          animation: hugo-drift-d 19s ease-in-out infinite;
        }
        .hugo-breath-veil {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 90%, #000 100%);
          pointer-events: none;
        }
        @keyframes hugo-breath {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.06); }
        }
        @keyframes hugo-drift-a {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%      { transform: translate3d(4vw, 2vh, 0) scale(1.08); }
        }
        @keyframes hugo-drift-b {
          0%, 100% { transform: translate3d(0,0,0) scale(1.02); }
          50%      { transform: translate3d(-3vw, 3vh, 0) scale(0.96); }
        }
        @keyframes hugo-drift-c {
          0%, 100% { transform: translate3d(0,0,0) scale(0.98); }
          50%      { transform: translate3d(-4vw, -2vh, 0) scale(1.07); }
        }
        @keyframes hugo-drift-d {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%      { transform: translate3d(3vw, 2vh, 0) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hugo-breath-stage,
          .hugo-blob { animation: none !important; }
        }
      `}</style>
    </div>
  );
}