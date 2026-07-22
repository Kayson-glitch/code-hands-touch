import { useEffect, useMemo, useRef, useState } from "react";

type Intensity = "off" | "low" | "medium";

function makeNoiseDataUrl(size = 128) {
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

export function GlitchGrainOverlay({
  visible = true,
  intensity = "low",
}: {
  visible?: boolean;
  intensity?: Intensity;
}) {
  const [noiseUrl, setNoiseUrl] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNoiseUrl(makeNoiseDataUrl(128));
  }, []);

  // Cheap animated jitter — shift background-position on a slow RAF tick.
  useEffect(() => {
    if (!visible || intensity === "off") return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 110) return; // ~9fps jitter
      last = t;
      const el = ref.current;
      if (!el) return;
      const x = (Math.random() * 128) | 0;
      const y = (Math.random() * 128) | 0;
      el.style.backgroundPosition = `${x}px ${y}px`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, intensity]);

  const { grainOpacity, scanAlpha } = useMemo(() => {
    switch (intensity) {
      case "medium":
        return { grainOpacity: 0.1, scanAlpha: 0.03 };
      case "off":
        return { grainOpacity: 0, scanAlpha: 0 };
      case "low":
      default:
        return { grainOpacity: 0.06, scanAlpha: 0.018 };
    }
  }, [intensity]);

  const active = visible && intensity !== "off";

  return (
    <>
      {/* Scanlines */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          opacity: active ? 1 : 0,
          transition: "opacity 300ms ease-out",
          backgroundImage: `repeating-linear-gradient(to bottom, rgba(255,255,255,${scanAlpha}) 0 1px, transparent 1px 3px)`,
          mixBlendMode: "overlay",
        }}
      />
      {/* Grain */}
      <div
        ref={ref}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          opacity: active && noiseUrl ? grainOpacity : 0,
          transition: "opacity 300ms ease-out",
          backgroundImage: noiseUrl ? `url(${noiseUrl})` : undefined,
          backgroundRepeat: "repeat",
          mixBlendMode: "screen",
          willChange: "background-position",
        }}
      />
    </>
  );
}

export default GlitchGrainOverlay;