import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks";

/**
 * The hero field: a forensic sonar.
 *
 * The production site puts a static radar illustration behind the wordmark.
 * This is the same idea actually running. A sweep rotates through a field of
 * contacts — each one a file in the queue — and every contact only resolves
 * when the sweep reaches it. Most come back clean and fade to a faint acid
 * dot; a few come back forged, and those get boxed and labelled and hold their
 * mark for a beat longer.
 *
 * The point is the waiting. A verdict is something the engine arrives at, and
 * the sweep is the only thing on the page that decides when.
 *
 * Pointer position parallaxes the whole field by a few pixels and brightens
 * contacts near the cursor, so the field reads as depth rather than wallpaper.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

type Contact = {
  /** Polar position. Radius is a fraction of the field radius. */
  angle: number;
  radius: number;
  forged: boolean;
  kind: string;
  /** 0→1, set to 1 when the sweep crosses and decayed every frame after. */
  lit: number;
  /** Phase offset so idle contacts do not all breathe together. */
  phase: number;
};

/* Fixed layout. A seeded arrangement beats a random one here: the forged
   contacts sit where the composition wants them, clear of the wordmark. */
const CONTACTS: Omit<Contact, "lit">[] = [
  { angle: 0.35, radius: 0.82, forged: false, kind: "IMG", phase: 0.1 },
  { angle: 0.74, radius: 0.46, forged: false, kind: "PDF", phase: 2.2 },
  { angle: 1.12, radius: 0.93, forged: true, kind: "IMG", phase: 0.8 },
  { angle: 1.48, radius: 0.63, forged: false, kind: "MP4", phase: 4.1 },
  { angle: 1.95, radius: 0.34, forged: false, kind: "IMG", phase: 1.5 },
  { angle: 2.31, radius: 0.88, forged: false, kind: "PDF", phase: 3.3 },
  { angle: 2.78, radius: 0.55, forged: true, kind: "MP4", phase: 2.7 },
  { angle: 3.16, radius: 0.76, forged: false, kind: "IMG", phase: 5.0 },
  { angle: 3.62, radius: 0.41, forged: false, kind: "PDF", phase: 0.4 },
  { angle: 3.98, radius: 0.95, forged: false, kind: "IMG", phase: 1.9 },
  { angle: 4.41, radius: 0.69, forged: false, kind: "MP4", phase: 3.8 },
  { angle: 4.83, radius: 0.38, forged: true, kind: "PDF", phase: 0.6 },
  { angle: 5.21, radius: 0.85, forged: false, kind: "IMG", phase: 4.6 },
  { angle: 5.67, radius: 0.58, forged: false, kind: "IMG", phase: 2.0 },
  { angle: 6.02, radius: 0.91, forged: false, kind: "PDF", phase: 5.4 },
];

const SWEEP_SPEED = 0.62; // rad/s — one revolution in ~10s
const WEDGE = 0.58; // trailing wedge, radians
const ACID = "225,240,86";
const FORGED = "255,90,77";
/** Bearings, drawn just outside the outer ring. */
const BEARINGS = ["000", "090", "180", "270"];

export function Sonar({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* With motion off there is no sweep to resolve anything, so the forged
       contacts start already marked — the still frame has to carry the same
       information the animation does. */
    const contacts: Contact[] = CONTACTS.map((c) => ({
      ...c,
      lit: reduced && c.forged ? 0.9 : 0,
    }));
    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let field = 0;
    let narrow = false;
    /** Pointer, in field-space. null until the cursor enters. */
    let px: number | null = null;
    let py = 0;
    /** Eased parallax offset. */
    let ox = 0;
    let oy = 0;
    let sweep = -Math.PI / 2;
    let frame = 0;
    let last = performance.now();
    /** Rebuilt on resize: one gradient serves every slice of the wedge. */
    let wedgeFill: CanvasGradient | null = null;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width / 2;
      narrow = width < 700;
      // A phone has no room beside the dial, so it goes under the copy and
      // takes most of the width; a desktop has columns to spare and the dial
      // is sized off the shorter axis to stay clear of the headline.
      cy = height * (narrow ? 0.5 : 0.44);
      field = narrow ? Math.min(width * 0.46, height * 0.3) : Math.min(width * 0.3, height * 0.42);

      // Brightest just off the centre, gone by the rim — a returning ping
      // loses energy with distance, and without that the wedge reads as a
      // flat triangle laid over the page.
      const g = ctx.createRadialGradient(0, 0, field * 0.04, 0, 0, field);
      g.addColorStop(0, `rgba(${ACID},0.5)`);
      g.addColorStop(0.32, `rgba(${ACID},0.32)`);
      g.addColorStop(1, `rgba(${ACID},0)`);
      wedgeFill = g;

      if (reduced) paint(0);
    };

    /** One frame. `t` is seconds since mount, used only for idle breathing. */
    const paint = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      const originX = cx + ox;
      const originY = cy + oy;

      ctx.save();
      ctx.translate(originX, originY);

      /* Rings. Four, the outermost carrying the graticule. */
      for (let i = 1; i <= 4; i++) {
        const r = (field * i) / 4;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${i === 4 ? 0.17 : 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* Spokes, every 30°. */
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * field * 0.1, Math.sin(a) * field * 0.1);
        ctx.lineTo(Math.cos(a) * field, Math.sin(a) * field);
        ctx.stroke();
      }

      /* Graticule outside the rim, finer than the spokes. */
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      for (let i = 0; i < 72; i++) {
        const a = (i * Math.PI) / 36;
        const len = i % 6 === 0 ? 7 : 3.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * field, Math.sin(a) * field);
        ctx.lineTo(Math.cos(a) * (field + len), Math.sin(a) * (field + len));
        ctx.stroke();
      }

      /* Bearings. Skipped on a phone, where the dial fills the width and they
         would sit off the edge or under the buttons. */
      if (!narrow) {
        ctx.font = `500 9px ${MONO}`;
        ctx.fillStyle = "rgba(255,255,255,0.26)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        BEARINGS.forEach((label, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 2;
          ctx.fillText(label, Math.cos(a) * (field + 20), Math.sin(a) * (field + 20));
        });
        ctx.textAlign = "left";
      }

      /* Cross-hair through the centre. */
      ctx.strokeStyle = `rgba(${ACID},0.32)`;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 10);
      ctx.stroke();

      /* The sweep: a wedge trailing the leading edge, fading to nothing.
         One gradient, reused for every slice, with the angular falloff applied
         through globalAlpha. */
      if (!reduced && wedgeFill) {
        /* Slice count follows the radius: at a fixed count the steps in alpha
           separate into visible stripes once the dial gets large. */
        const steps = Math.min(72, Math.max(26, Math.round(field / 8)));
        ctx.fillStyle = wedgeFill;
        for (let i = 0; i < steps; i++) {
          const a0 = sweep - (WEDGE * (i + 1)) / steps;
          const a1 = sweep - (WEDGE * i) / steps + WEDGE / steps / 2;
          ctx.globalAlpha = Math.pow(1 - i / steps, 1.9);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, field, a0, a1);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        /* Leading edge, fading out toward the rim like the wedge behind it. */
        const edge = ctx.createLinearGradient(
          0,
          0,
          Math.cos(sweep) * field,
          Math.sin(sweep) * field,
        );
        edge.addColorStop(0, `rgba(${ACID},0.75)`);
        edge.addColorStop(0.7, `rgba(${ACID},0.3)`);
        edge.addColorStop(1, `rgba(${ACID},0)`);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sweep) * field, Math.sin(sweep) * field);
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      /* Contacts. */
      ctx.font = `500 9px ${MONO}`;
      ctx.textBaseline = "alphabetic";
      for (const c of contacts) {
        const r = c.radius * field;
        const x = Math.cos(c.angle) * r;
        const y = Math.sin(c.angle) * r;

        /* Cursor proximity, measured in screen space. */
        let near = 0;
        if (px !== null) {
          const d = Math.hypot(px - (originX + x), py - (originY + y));
          near = Math.max(0, 1 - d / 150);
        }

        const breathe = reduced ? 0 : 0.5 + 0.5 * Math.sin(t * 1.5 + c.phase);
        const base = 0.3 + breathe * 0.1;
        const level = Math.min(1, base + c.lit * 0.7 + near * 0.4);
        const tone = c.forged ? FORGED : ACID;

        /* Ping ring, expanding out of the contact as it resolves. */
        if (c.lit > 0.04) {
          const grow = 1 - c.lit;
          ctx.beginPath();
          ctx.arc(x, y, 4 + grow * 30, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${tone},${c.lit * 0.45})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        /* The dot, with a bloom under it while it is still resolving. */
        if (c.lit > 0.02) {
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${tone},${c.lit * 0.18})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, y, c.forged ? 2.8 : 2.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tone},${level})`;
        ctx.fill();

        /* A resolved forgery gets boxed and named. Clean contacts stay dots —
           the field should look calm until something is actually wrong. */
        const show = c.forged ? Math.max(c.lit, near) : near;
        if (show > 0.3) {
          const a = (show - 0.3) / 0.7;
          ctx.strokeStyle = `rgba(${tone},${a * 0.72})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 13, y - 13, 26, 26);
          /* Corner ticks, the same survey bracket used across the site. */
          ctx.beginPath();
          ctx.moveTo(x - 17, y - 13);
          ctx.lineTo(x - 13, y - 13);
          ctx.moveTo(x + 13, y + 13);
          ctx.lineTo(x + 17, y + 13);
          ctx.stroke();
          ctx.fillStyle = `rgba(${tone},${a * 0.9})`;
          ctx.fillText(c.forged ? `${c.kind} · FORGED` : `${c.kind} · CLEAR`, x - 13, y - 19);
        }
      }

      ctx.restore();
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      const prev = sweep;
      sweep += SWEEP_SPEED * dt;

      /* Light every contact the sweep just crossed. Compared in unwrapped
         space so the hand-over at 2π does not skip anyone. */
      for (const c of contacts) {
        const target = c.angle + Math.floor((prev + Math.PI * 2) / (Math.PI * 2)) * Math.PI * 2;
        for (const cand of [target - Math.PI * 2, target, target + Math.PI * 2]) {
          if (cand > prev && cand <= sweep) c.lit = 1;
        }
        // Forged contacts hold their mark roughly twice as long.
        c.lit = Math.max(0, c.lit - dt / (c.forged ? 2.6 : 1.3));
      }

      /* Parallax, eased so the field never snaps to the cursor. */
      const targetX = px === null ? 0 : (px - cx) * 0.028;
      const targetY = px === null ? 0 : (py - cy) * 0.028;
      ox += (targetX - ox) * Math.min(1, dt * 4);
      oy += (targetY - oy) * Math.min(1, dt * 4);

      paint(t);
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      px = e.clientX - rect.left;
      py = e.clientY - rect.top;
    };
    const onLeave = () => {
      px = null;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    if (!reduced) {
      frame = requestAnimationFrame(tick);
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }

    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
