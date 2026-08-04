type Intensity = "off" | "low" | "medium";

export function GlitchGrainOverlay({
  visible = true,
  intensity = "low",
  inverted = false,
}: {
  visible?: boolean;
  intensity?: Intensity;
  inverted?: boolean;
}) {
  const scanAlpha = intensity === "medium" ? 0.09 : intensity === "off" ? 0 : 0.055;
  const active = visible && intensity !== "off";
  const scanColor = inverted ? `rgba(0,0,0,${scanAlpha})` : `rgba(255,255,255,${scanAlpha})`;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
        opacity: active ? 1 : 0,
        transition: "opacity 300ms ease-out",
        backgroundImage: `repeating-linear-gradient(to bottom, ${scanColor} 0 1px, transparent 1px 3px)`,
      }}
    />
  );
}

export default GlitchGrainOverlay;