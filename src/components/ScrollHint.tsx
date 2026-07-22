import { useEffect, useState } from "react";

export function ScrollHint({ visible = true }: { visible?: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    // Any scroll intent (wheel / touch / key) triggers the exit animation
    // once. No follow-scroll — the CSS transition owns the motion so it stays
    // silky regardless of wheel cadence.
    const dismiss = () => setDismissed(true);
    const onWheel = () => dismiss();
    const onTouchMove = () => dismiss();
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "ArrowUp", "PageUp", "Space", " "].includes(e.key)) dismiss();
    };
    window.addEventListener("wheel", onWheel, { passive: true, once: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true, once: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [dismissed]);

  const on = visible && entered && !dismissed;
  // Exit animation: pure fade only. The container stays exactly centered and
  // never moves, so there is zero displacement on dismissal.

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        opacity: on ? 1 : 0,
        transition: "opacity 640ms cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "opacity",
        pointerEvents: "none",
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        color: "rgba(0,0,0,0.82)",
      }}
    >
      <svg width="22" height="34" viewBox="0 0 22 34" fill="none">
        <rect
          x="0.75"
          y="0.75"
          width="20.5"
          height="32.5"
          rx="10.25"
          stroke="currentColor"
          strokeWidth="1.25"
          opacity="0.85"
        />
        <circle cx="11" cy="9" r="1.6" fill="currentColor">
          <animate
            attributeName="cy"
            values="7;15;7"
            dur="1.8s"
            repeatCount="indefinite"
            keyTimes="0;0.55;1"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            calcMode="spline"
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            dur="1.8s"
            repeatCount="indefinite"
            keyTimes="0;0.2;0.75;1"
          />
        </circle>
      </svg>
      <div
        style={{
          fontFamily: "'Montserrat', system-ui, sans-serif",
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 500,
          color: "rgba(0,0,0,0.72)",
        }}
      >
        Scroll to explore
      </div>
      <div
        style={{
          width: 1,
          height: 18,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0))",
        }}
      />
      <style>{`
        @keyframes sh-breathe {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, 2px); }
        }
      `}</style>
    </div>
  );
}

export default ScrollHint;