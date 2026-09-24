import { DotArrow } from "@/components/DotArrow";

/** The brand gradient, shared by the nav bar, the button's flowing border and the footer rule. */
export const GRADIENT_STOPS = ["#137DFF", "#FF18AA", "#FFCD17", "#137DFF"];
export const GRADIENT = `linear-gradient(90deg, ${GRADIENT_STOPS[0]} 0%, ${GRADIENT_STOPS[1]} 33.333%, ${GRADIENT_STOPS[2]} 66.666%, ${GRADIENT_STOPS[3]} 100%)`;

/**
 * The one CTA button: 36px, 14px label, square, ink face with the brand
 * gradient flowing along its bottom edge. `tone="paper"` flips to a white face
 * for black surfaces.
 */
export function RainbowButton({
  label,
  tone = "ink",
  className,
}: {
  label: string;
  tone?: "ink" | "paper";
  className?: string;
}) {
  const face = tone === "ink" ? "#0E0B22" : "#FFFFFF";
  const faceRgb = tone === "ink" ? "14,11,34" : "255,255,255";
  return (
    <button
      className={`group relative inline-flex shrink-0 cursor-pointer items-center justify-center font-normal transition-all ${className ?? ""}`}
      style={{
        height: 36,
        fontSize: 14,
        lineHeight: "20px",
        fontWeight: 400,
        padding: "0 20px",
        borderRadius: 0,
        borderBottom: "1.5px solid transparent",
        color: tone === "ink" ? "#FFFFFF" : "#0E0B22",
        backgroundImage: [
          `linear-gradient(${face},${face})`,
          `linear-gradient(${face} 50%, rgba(${faceRgb},0.6) 80%, rgba(${faceRgb},0))`,
          GRADIENT,
        ].join(","),
        backgroundClip: "padding-box, border-box, border-box",
        backgroundColor: face,
        backgroundOrigin: "border-box",
        backgroundSize: "200%",
        animation: "rainbow-btn-flow var(--rainbow-speed, 9s) infinite linear",
      }}
    >
      <span className="relative z-10 inline-flex items-center gap-0">
        {label}
        <span className="inline-flex items-center ml-1.5">
          <DotArrow size={16} className="flex-shrink-0" />
        </span>
      </span>
    </button>
  );
}

export default RainbowButton;
