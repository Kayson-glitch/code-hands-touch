type Intensity = "off" | "low" | "medium";

export function GlitchGrainOverlay({
  visible = true,
  intensity = "low",
}: {
  visible?: boolean;
  intensity?: Intensity;
}) {
  const scanAlpha = intensity === "medium" ? 0.09 : intensity === "off" ? 0 : 0.055;
  const active = visible && intensity !== "off";

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
        backgroundImage: `repeating-linear-gradient(to bottom, rgba(255,255,255,${scanAlpha}) 0 1px, transparent 1px 3px)`,
      }}
    />
  );
}

export default GlitchGrainOverlay;