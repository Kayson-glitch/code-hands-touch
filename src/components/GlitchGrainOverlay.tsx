type Intensity = "off" | "low" | "medium";

export function GlitchGrainOverlay({
  visible = true,
  intensity = "low",
}: {
  visible?: boolean;
  intensity?: Intensity;
}) {
  const dotAlpha = intensity === "medium" ? 0.14 : intensity === "off" ? 0 : 0.09;
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
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,${dotAlpha}) 0.6px, transparent 1px)`,
        backgroundSize: "4px 4px",
        backgroundPosition: "0 0",
      }}
    />
  );
}

export default GlitchGrainOverlay;