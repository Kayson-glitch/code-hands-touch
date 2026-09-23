import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "../hooks";

/**
 * Infinite band whose speed is coupled to scroll velocity.
 *
 * At rest it drifts. Scroll and it accelerates in the direction you are
 * reading; stop and it eases back to the drift. The band is a list of the
 * techniques fraud rings actually sell, so making it respond to the reader's
 * own momentum is the point — the problem moves as fast as you do.
 */
export function Marquee({
  items,
  className,
  baseSpeed = 28,
  separator,
}: {
  items: readonly string[];
  className?: string;
  /** Resting speed in px/s. */
  baseSpeed?: number;
  separator?: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduced) return;

    let offset = 0;
    let velocity = 0;
    let lastScroll = window.scrollY;
    let lastTime = performance.now();
    let frame = 0;

    const onScroll = () => {
      const delta = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      // Clamped so a flick of the wheel cannot fling the band off-screen.
      velocity = Math.max(-620, Math.min(620, velocity + delta * 7));
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      velocity *= 0.9;
      offset -= (baseSpeed + velocity) * dt;

      const half = track.scrollWidth / 2;
      if (half > 0) {
        if (offset <= -half) offset += half;
        if (offset > 0) offset -= half;
      }
      track.style.transform = `translate3d(${offset}px,0,0)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [baseSpeed, reduced]);

  const run = [...items, ...items];

  return (
    <div className={className} style={{ overflow: "hidden" }} aria-hidden>
      <div ref={trackRef} className="flex w-max items-center">
        {run.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center">
            <span className="fh-label whitespace-nowrap text-[color:var(--fh-ink-faint)]">
              {item}
            </span>
            <span className="mx-6 text-[color:var(--fh-acid)] opacity-60">{separator ?? "×"}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
