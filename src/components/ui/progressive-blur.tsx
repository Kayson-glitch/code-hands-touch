import React from "react";

type ProgressiveBlurProps = {
  className?: string;
  backgroundColor?: string;
  position?: "top" | "bottom";
  height?: string;
  blurAmount?: string;
};

/**
 * Layered progressive blur overlay. Each layer masks a slice of the strip and
 * doubles the blur radius, producing a smooth focus falloff toward the edge.
 */
const ProgressiveBlur = ({
  className = "",
  backgroundColor = "transparent",
  position = "bottom",
  height = "150px",
  blurAmount = "4px",
}: ProgressiveBlurProps) => {
  const isTop = position === "top";
  const layers = [0, 1, 2, 3, 4, 5];

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 z-40 ${isTop ? "top-0" : "bottom-0"} ${className}`}
      style={{ height }}
    >
      {layers.map((i) => {
        const start = (i / layers.length) * 100;
        const end = ((i + 1) / layers.length) * 100;
        const stops = isTop
          ? `rgba(0,0,0,0) ${100 - end}%, rgba(0,0,0,1) ${100 - start}%`
          : `rgba(0,0,0,0) ${start}%, rgba(0,0,0,1) ${end}%`;
        const mask = `linear-gradient(to bottom, ${stops})`;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${parseFloat(blurAmount) * Math.pow(2, i)}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
      {backgroundColor !== "transparent" && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to ${isTop ? "top" : "bottom"}, transparent, ${backgroundColor})`,
          }}
        />
      )}
    </div>
  );
};

export { ProgressiveBlur };
