import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Interaction for the product illustrations: the card wipes open from the
 * side its copy sits on when it scrolls into view, then tilts a few degrees
 * toward the pointer on hover — damped the same way the title spotlight
 * follows the cursor, so it feels like the same hand is moving both. A soft
 * drop shadow deepens as the card lifts. Reduced motion: no wipe, no tilt.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Drop shadow that deepens with the lift (z in px). */
const shadow = (z: number) =>
  `drop-shadow(0 ${(18 + z * 2).toFixed(1)}px ${(36 + z * 3).toFixed(1)}px rgba(14, 11, 34, ${(0.12 + z * 0.006).toFixed(3)}))`;
/** Per-frame easing toward the pointer (lower = heavier). */
const FOLLOW = 0.12;

export function HoverTilt({
  children,
  from = "left",
  maxTilt = 4,
  lift = 6,
  className,
  style,
}: {
  children: ReactNode;
  /** Edge the reveal wipe starts from — the side the copy is on. */
  from?: "left" | "right";
  /** Max rotation in degrees at the card's edge. */
  maxTilt?: number;
  /** Hover lift in px. */
  lift?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const target = useRef({ rx: 0, ry: 0, z: 0 });
  const current = useRef({ rx: 0, ry: 0, z: 0 });
  const raf = useRef<number | null>(null);
  const [shown, setShown] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tick = () => {
    raf.current = null;
    const t = target.current;
    const c = current.current;
    c.rx += (t.rx - c.rx) * FOLLOW;
    c.ry += (t.ry - c.ry) * FOLLOW;
    c.z += (t.z - c.z) * FOLLOW;
    const card = cardRef.current;
    if (card) {
      card.style.transform = `perspective(900px) rotateX(${c.rx.toFixed(3)}deg) rotateY(${c.ry.toFixed(3)}deg) translateY(${(-c.z).toFixed(2)}px)`;
      card.style.filter = shadow(c.z);
    }
    if (
      Math.abs(t.rx - c.rx) > 0.01 ||
      Math.abs(t.ry - c.ry) > 0.01 ||
      Math.abs(t.z - c.z) > 0.05
    ) {
      raf.current = requestAnimationFrame(tick);
    }
  };
  const wake = () => {
    if (raf.current === null) raf.current = requestAnimationFrame(tick);
  };

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    [],
  );

  const closed = from === "left" ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";

  return (
    <div
      ref={hostRef}
      className={className}
      style={style}
      onPointerMove={(e) => {
        if (reduced) return;
        const r = hostRef.current?.getBoundingClientRect();
        if (!r) return;
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        // Top edge tilts away, right edge tilts toward — the card faces the pointer.
        target.current = { rx: -py * 2 * maxTilt, ry: px * 2 * maxTilt, z: lift };
        wake();
      }}
      onPointerLeave={() => {
        target.current = { rx: 0, ry: 0, z: 0 };
        wake();
      }}
    >
      <div
        ref={cardRef}
        style={{
          willChange: "transform, clip-path, filter",
          clipPath: reduced || shown ? "inset(0 0 0 0)" : closed,
          transition: `clip-path 900ms ${EASE}`,
          filter: shadow(0),
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default HoverTilt;
