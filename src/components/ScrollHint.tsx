import { useEffect, useState } from "react";

/**
 * Figma-spec scroll hint (node 1415:20938):
 * row, gap 8px — "scroll" (Montserrat 14/20, capitalize, #000) +
 * 20x20 box, 2px padding, 1px #E1E0E4 border, radius 12px, arrow-down icon.
 * Position: horizontally centered, top 624px in the 1440x900 frame
 * (element center at 634/900 = 70.4% of the viewport height).
 */
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

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: "50%",
        top: "70.4%",
        transform: "translate(-50%, -50%)",
        opacity: on ? 1 : 0,
        transition: "opacity 1200ms cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "opacity",
        pointerEvents: "none",
        zIndex: 90,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: "'Montserrat', system-ui, sans-serif",
          fontSize: 14,
          lineHeight: "20px",
          fontWeight: 400,
          textTransform: "capitalize",
          color: "#000000",
          whiteSpace: "nowrap",
        }}
      >
        scroll
      </span>
      <span
        style={{
          width: 20,
          height: 20,
          padding: 2,
          border: "1px solid #E1E0E4",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Figma vuesax/linear/arrow-down (node 1415:20941) */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          style={{ animation: "scroll-hint-arrow 1.8s ease-in-out infinite" }}
        >
          <path
            d="M15.0581 10.3581L9.99974 15.4164L4.94141 10.3581"
            stroke="#5E5C6A"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 4.58333V15.275"
            stroke="#5E5C6A"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

      </span>
      <style>{`
        @keyframes scroll-hint-arrow {
          0%, 100% { transform: translateY(-1px); opacity: 0.75; }
          50% { transform: translateY(1.5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ScrollHint;
