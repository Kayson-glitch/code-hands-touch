import { useEffect, useRef } from "react";

/**
 * The ground the Solution figures stand on: a fine grid of dots whose weight
 * drifts in soft clusters, so the field reads as an uneven wash rather than a
 * lattice.
 *
 * It replaces a 1232x1160 raster that three of those figures shared. Generated
 * instead of shipped, it costs no bytes, resolves at whatever size the slot
 * gives it, and a different `seed` keeps the three from looking like the same
 * picture repeated.
 *
 * Measured off that raster: a ~2.3px dot on #F1EEE9 drawn at 53% in the frame,
 * with clusters correlating over roughly 220 rendered px. Pitch and tone are
 * looser and lighter than the measurement — see PITCH and INK.
 */

/**
 * The frames sit on #F1EEE9, a warm cream — the one warm value in a palette
 * that runs neutral to violet everywhere else. `--surface-soft` drops the warm
 * cast and sits a step lighter than the frame's own value, which keeps the
 * block from reading as a panel against the white section.
 */
const GROUND = "#F7F7F8";
/** Dot ink: `--ink-faint`. */
const INK = "161, 160, 169";
/**
 * Distance between dots, in CSS px, close to the raster's own 9px. What made
 * the reference read as a mesh rather than a field was not the spacing but how
 * much of each cell the dot filled: at this radius the dots cover 3.5% of the
 * ground against the raster's 8%, so the grain stays fine.
 */
const PITCH = 10;
/** Dot radius at full weight. */
const DOT_R = 1.05;
/** Cluster size, in CSS px: the wavelength of the coarse noise. */
const CLUSTER = 220;
/** Floor and ceiling of a dot's weight, so nothing is fully absent or solid. */
const WEIGHT_MIN = 0.03;
const WEIGHT_MAX = 1;

/** Deterministic hash so a seed always draws the same field. */
function hash(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

const fade = (t: number) => t * t * (3 - 2 * t);

/** Value noise on a lattice of `scale`, bilinear with a smoothstep ease. */
function valueNoise(x: number, y: number, scale: number, seed: number) {
  const gx = x / scale;
  const gy = y / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = fade(gx - x0);
  const fy = fade(gy - y0);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

/**
 * Fraction of the half-width inside which the dots are cleared, and the
 * fraction by which they are back to full. The ecosystem figure sits on a
 * large opaque shape whose edge, in Figma, is softened by a 150px background
 * blur frosting the ground around it. Exporting the subject on its own loses
 * that blur, leaving the dots running sharp into a hard edge; clearing them
 * over the same radius puts the softness back. Measured off the Figma frame,
 * where dot energy is near zero inside 0.35 and level again past 0.45.
 */
const CLEAR_INNER = 0.36;
const CLEAR_OUTER = 0.52;

export function DotCloud({
  className,
  style,
  seed = 1,
  clearCenter = false,
}: {
  className?: string;
  style?: React.CSSProperties;
  /** Redraws the same field for a given number; vary it per figure. */
  seed?: number;
  /** Fades the dots out behind a subject that covers the middle of the frame. */
  clearCenter?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const draw = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 8 || h < 8) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, w, h);

      // The frost does two things in Figma: it clears the dots and it lifts the
      // ground towards white, and it is the lift that keeps the subject's edge
      // from stepping against the ground. Clearing alone leaves the step.
      if (clearCenter) {
        const rOuter = (Math.min(w, h) / 2) * CLEAR_OUTER;
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, rOuter);
        g.addColorStop(0, "rgba(255, 255, 255, 1)");
        g.addColorStop(CLEAR_INNER / CLEAR_OUTER, "rgba(255, 255, 255, 0.85)");
        g.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // Two octaves: the coarse one makes the clusters, the finer one keeps
      // neighbouring dots from stepping in lockstep.
      for (let y = PITCH / 2; y < h; y += PITCH) {
        for (let x = PITCH / 2; x < w; x += PITCH) {
          const coarse = valueNoise(x, y, CLUSTER, seed);
          const fine = valueNoise(x, y, CLUSTER / 3.5, seed + 19);
          let weight = coarse * 0.72 + fine * 0.28;
          // Push the mid-tones apart so the clusters have edges.
          weight = fade(Math.min(1, Math.max(0, (weight - 0.2) / 0.6)));
          weight = WEIGHT_MIN + (WEIGHT_MAX - WEIGHT_MIN) * weight;
          if (clearCenter) {
            const dx = (x - w / 2) / (w / 2);
            const dy = (y - h / 2) / (h / 2);
            const d = Math.sqrt(dx * dx + dy * dy);
            weight *= fade(
              Math.min(1, Math.max(0, (d - CLEAR_INNER) / (CLEAR_OUTER - CLEAR_INNER))),
            );
          }
          if (weight <= 0.002) continue;
          const r = DOT_R * (0.25 + 0.75 * weight);
          ctx.globalAlpha = weight;
          ctx.fillStyle = `rgb(${INK})`;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(host);
    return () => ro.disconnect();
  }, [seed, clearCenter]);

  return (
    <div ref={hostRef} className={className} style={style} aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

export default DotCloud;
