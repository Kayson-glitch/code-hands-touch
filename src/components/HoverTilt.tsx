import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Interaction for the product illustrations: the card wipes open from the
 * side its copy sits on when it scrolls into view, then drifts a few pixels
 * toward the pointer on hover — the same shallow parallax the homepage hands
 * have (6 / 4 px), damped the same way the title spotlight follows the
 * cursor. No rotation and no shadow: the illustrations fade to white at
 * their edges, so anything that outlines their rectangle fights the art.
 * Reduced motion: no wipe, no drift.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Per-frame easing toward the pointer (lower = heavier). */
const FOLLOW = 0.12;

export function HoverTilt({
  children,
  from = "left",
  driftX = 10,
  driftY = 6,
  className,
  style,
}: {
  children: ReactNode;
  /** Edge the reveal wipe starts from — the side the copy is on. */
  from?: "left" | "right";
  /** Max drift toward the pointer, px. */
  driftX?: number;
  driftY?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
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
    c.x += (t.x - c.x) * FOLLOW;
    c.y += (t.y - c.y) * FOLLOW;
    const card = cardRef.current;
    if (card) card.style.transform = `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, 0)`;
    if (Math.abs(t.x - c.x) > 0.05 || Math.abs(t.y - c.y) > 0.05) {
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
        target.current = { x: px * 2 * driftX, y: py * 2 * driftY };
        wake();
      }}
      onPointerLeave={() => {
        target.current = { x: 0, y: 0 };
        wake();
      }}
    >
      <div
        ref={cardRef}
        style={{
          willChange: "transform, clip-path",
          clipPath: reduced || shown ? "inset(0 0 0 0)" : closed,
          transition: `clip-path 900ms ${EASE}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default HoverTilt;
