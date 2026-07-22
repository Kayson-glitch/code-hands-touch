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
    const dismiss = () => setDismissed(true);
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "Space", " ", "ArrowUp", "PageUp"].includes(e.key)) dismiss();
    };
    window.addEventListener("wheel", dismiss, { passive: true });
    window.addEventListener("touchmove", dismiss, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("touchmove", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [dismissed]);

  const on = visible && entered && !dismissed;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: "50%",
        bottom: 40,
        transform: `translate(-50%, ${on ? 0 : dismissed ? 6 : -6}px)`,
        opacity: on ? 1 : 0,
        transition: "opacity 600ms ease-out, transform 600ms ease-out",
        pointerEvents: "none",
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        color: "rgba(255,255,255,0.82)",
        animation: on ? "sh-breathe 3.2s ease-in-out infinite" : "none",
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
          color: "rgba(255,255,255,0.72)",
        }}
      >
        Scroll to explore
      </div>
      <div
        style={{
          width: 1,
          height: 18,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.45), rgba(255,255,255,0))",
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