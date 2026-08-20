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
    const visible = new Set<Element>();
    const observed = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        setHidden(visible.size > 0);
      },
      { threshold: 0.01 },
    );

    const scan = () => {
      const targets: HTMLElement[] = [];
      if (hiddenWhen?.current) targets.push(hiddenWhen.current);
      if (hiddenWhenSelector) {
        targets.push(...Array.from(document.querySelectorAll<HTMLElement>(hiddenWhenSelector)));
      }
      // observe newly mounted targets
      for (const el of targets) {
        if (!observed.has(el)) {
          observed.add(el);
          io.observe(el);
        }
      }
      // forget targets that were unmounted (e.g. route change)
      for (const el of Array.from(observed)) {
        if (!el.isConnected) {
          observed.delete(el);
          visible.delete(el);
          io.unobserve(el);
        }
      }
      setHidden(visible.size > 0);
    };

    scan();
    // child routes mount/unmount their footers after this layout renders,
    // so keep watching the DOM instead of scanning only once.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
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
