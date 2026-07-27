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
        <span className="hugo-base" />
        <span className="hugo-blob hugo-blob-bluewhite" />
        <span className="hugo-blob hugo-blob-purple" />
        <span className="hugo-blob hugo-blob-magenta" />
        <span className="hugo-blob hugo-blob-dark" />
        <span className="hugo-blob hugo-blob-warmpink" />
        <span className="hugo-breath-veil" />
      </div>
      <style>{`
        .hugo-breath-stage {
          position: absolute;
          inset: -30% -10% -30% -10%;
          filter: blur(80px) saturate(160%);
          animation: hugo-breath 9s ease-in-out infinite;
          will-change: opacity, transform;
        }
        .hugo-base {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg,
            #6FA8FF 0%,
            #8E5BFF 22%,
            #C13BEA 42%,
            #6A1E7A 60%,
            #B0304F 78%,
            #FF6A88 100%);
          opacity: 0.9;
        }
        .hugo-blob {
          position: absolute;
          display: block;
          border-radius: 50%;
          mix-blend-mode: screen;
          opacity: 1;
          will-change: transform, opacity;
        }
        /* Left: cool blue-white bloom */
        .hugo-blob-bluewhite {
          width: 42vw; height: 42vw;
          left: -8vw; top: -14vw;
          background: radial-gradient(circle at 50% 50%,
            #EAF2FF 0%, #9CC2FF 30%, rgba(120,170,255,0.5) 55%, rgba(120,170,255,0) 75%);
          animation: hugo-drift-a 14s ease-in-out infinite;
        }
        /* Center-left: saturated purple */
        .hugo-blob-purple {
          width: 48vw; height: 48vw;
          left: 14vw; top: -18vw;
          background: radial-gradient(circle at 50% 50%,
            #A54BFF 0%, #7A1FE0 40%, rgba(122,31,224,0) 72%);
          animation: hugo-drift-b 17s ease-in-out infinite;
        }
        /* Center: hot magenta/pink core */
        .hugo-blob-magenta {
          width: 46vw; height: 46vw;
          left: 34vw; top: -16vw;
          background: radial-gradient(circle at 50% 50%,
            #FF3EC8 0%, #D021A6 40%, rgba(208,33,166,0) 72%);
          animation: hugo-drift-c 16s ease-in-out infinite;
        }
        /* Mid-right: dark trough */
        .hugo-blob-dark {
          width: 34vw; height: 34vw;
          left: 54vw; top: -8vw;
          mix-blend-mode: multiply;
          opacity: 0.85;
          background: radial-gradient(circle at 50% 50%,
            #2A0733 0%, rgba(42,7,51,0.7) 45%, rgba(42,7,51,0) 75%);
          animation: hugo-drift-d 18s ease-in-out infinite;
        }
        /* Right edge: warm pink-red */
        .hugo-blob-warmpink {
          width: 44vw; height: 44vw;
          left: 72vw; top: -14vw;
          background: radial-gradient(circle at 50% 50%,
            #FF7A9A 0%, #FF3D6E 40%, rgba(255,61,110,0) 74%);
          animation: hugo-drift-e 19s ease-in-out infinite;
        }
        .hugo-breath-veil {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 82%, #000 100%);
          pointer-events: none;
        }
        @keyframes hugo-breath {
          0%, 100% { opacity: 0.92; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.05); }
        }
        @keyframes hugo-drift-a {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%      { transform: translate3d(3vw, 2vh, 0) scale(1.08); }
        }
        @keyframes hugo-drift-b {
          0%, 100% { transform: translate3d(0,0,0) scale(1.02); }
          50%      { transform: translate3d(-2vw, 2vh, 0) scale(0.98); }
        }
        @keyframes hugo-drift-c {
          0%, 100% { transform: translate3d(0,0,0) scale(0.98); }
          50%      { transform: translate3d(2vw, -1vh, 0) scale(1.07); }
        }
        @keyframes hugo-drift-d {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%      { transform: translate3d(1vw, 2vh, 0) scale(1.04); }
        }
        @keyframes hugo-drift-e {
          0%, 100% { transform: translate3d(0,0,0) scale(1.01); }
          50%      { transform: translate3d(-2vw, 1vh, 0) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hugo-breath-stage,
          .hugo-blob { animation: none !important; }
        }
      `}</style>
    </div>
  );
}