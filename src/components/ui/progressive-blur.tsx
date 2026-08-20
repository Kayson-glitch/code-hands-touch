import React, { useEffect, useState } from "react";

type ProgressiveBlurProps = {
  className?: string;
  backgroundColor?: string;
  position?: "top" | "bottom";
  height?: string;
  blurAmount?: string;
  /**
   * When provided, the blur is hidden while the referenced element
   * (e.g. a footer) is visible in the viewport.
   */
  hiddenWhen?: React.RefObject<HTMLElement | null>;
  /**
   * CSS selector for element(s) that should hide the blur while visible
   * (e.g. a footer). Useful from a shared layout where the target lives
   * in a child route. All matching elements are observed.
   */
  hiddenWhenSelector?: string;
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
  hiddenWhen,
  hiddenWhenSelector,
}: ProgressiveBlurProps) => {
  const isTop = position === "top";
  const layers = [0, 1, 2, 3, 4, 5];
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const targets: HTMLElement[] = [];
    if (hiddenWhen?.current) targets.push(hiddenWhen.current);
    if (hiddenWhenSelector) {
      targets.push(...Array.from(document.querySelectorAll<HTMLElement>(hiddenWhenSelector)));
    }
    if (targets.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Hide if any observed target is currently intersecting.
        const anyVisible = entries.some((e) => e.isIntersecting);
        setHidden(anyVisible);
      },
      { threshold: 0.01 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [hiddenWhen, hiddenWhenSelector]);

  if (hidden) return null;

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
