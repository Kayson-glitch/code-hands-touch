import { useEffect, useState } from "react";

/**
 * Figma-spec scroll hint (node 1415:20938):
 * row, gap 8px — "scroll" (Montserrat 14/20, capitalize, #000) +
 * 24x24 box, 2px padding, 1px #E1E0E4 border, radius 12px, 20x20 arrow-down icon.
 * Position: horizontally centered, top 624px in the 1440x900 frame
 * (element center at 634/900 = 70.4% of the viewport height).
 */
export function ScrollHint({ visible = true }: { visible?: boolean }) {
  const [atEntry, setAtEntry] = useState(true);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    // The hands sequence owns the entry state and broadcasts it, so the hint
    // fades out when the scrub starts and fades back in when it is rewound.
    const onState = (e: Event) => {
      const detail = (e as CustomEvent<{ atEntry: boolean }>).detail;
      setAtEntry(Boolean(detail?.atEntry));
    };
    window.addEventListener("hands-entry-state", onState as EventListener);
    return () =>
      window.removeEventListener("hands-entry-state", onState as EventListener);
  }, []);

  // It sits above the nav, so it would otherwise read through the menu panel.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onMenu = (e: Event) => setMenuOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener("app-menu-open", onMenu);
    return () => window.removeEventListener("app-menu-open", onMenu);
  }, []);

  const on = visible && entered && atEntry && !menuOpen;


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
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "clamp(6px, 0.5556vw, 10px)",
          animation: "scroll-hint-breathe 2.8s ease-in-out infinite",
          willChange: "opacity",
        }}
      >
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "clamp(12px, 0.9722vw, 18px)",
          lineHeight: "clamp(18px, 1.3889vw, 26px)",
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
          width: "clamp(20px, 1.6667vw, 30px)",
          height: "clamp(20px, 1.6667vw, 30px)",
          padding: 2,
          border: "1px solid #E1E0E4",
          borderRadius: 999,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Figma vuesax/linear/arrow-down (node 1415:20941) — icon 20x20 */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 20 20"
          fill="none"
          style={{ animation: "scroll-hint-arrow 2.8s ease-in-out infinite" }}
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
      </div>
      <style>{`
        @keyframes scroll-hint-arrow {
          0%, 100% { transform: translateY(-1px); }
          50% { transform: translateY(1.5px); }
        }
        @keyframes scroll-hint-breathe {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ScrollHint;
