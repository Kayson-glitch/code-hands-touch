import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks";

const CELL = 15;
const GLYPHS = "01234567890ABCDEF<>/\\|+-=*#%$@?";
const LENS_RADIUS = 190;

/** Canvas parses `font` as a CSS shorthand but cannot resolve `var()`, so the
 *  stack has to be written out literally or the assignment silently no-ops. */
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace';
const glyphFont = `500 ${CELL - 4}px ${MONO}`;

/**
 * Tamper blobs in normalised coords. They sit in the right two thirds, which
 * is the part of the hero the copy does not cover, so the lens has something
 * to find wherever the pointer actually goes.
 */
const TAMPER = [
  { x: 0.62, y: 0.28, rx: 0.07, ry: 0.09 },
  { x: 0.84, y: 0.52, rx: 0.055, ry: 0.07 },
  { x: 0.68, y: 0.74, rx: 0.09, ry: 0.05 },
  { x: 0.45, y: 0.5, rx: 0.05, ry: 0.07 },
  { x: 0.93, y: 0.22, rx: 0.05, ry: 0.06 },
];

type Cell = { ch: string; tamper: number; jitter: number };

/**
 * The hero's interactive field.
 *
 * The whole page argues that forgery is invisible to the eye and obvious to an
 * engine, so the hero lets you hold the engine yourself: a lens follows the
 * pointer, and inside it the flat noise resolves into structure — with the
 * tampered regions burning red. Everything outside the lens stays unreadable,
 * which is the point.
 *
 * Cost is bounded by only ever redrawing the lens box and a thin sweep band
 * over a pre-rendered static layer, so the frame cost does not scale with the
 * size of the hero.
 */
export function ScannerField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let cols = 0;
    let rows = 0;
    let cells: Cell[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;

    const still = document.createElement("canvas");
    const stillCtx = still.getContext("2d");

    /**
     * Static equivalent of the lens: the noise floor with the tampered
     * regions already resolved and boxed. Nothing moves, but the reader still
     * gets the finding the animated version exists to deliver.
     */
    const paintStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(still, 0, 0, width, height);
      ctx.font = glyphFont;
      ctx.textBaseline = "top";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cells[r * cols + c];
          if (cell.tamper <= 0.02) continue;
          ctx.fillStyle = `rgba(255,90,77,${Math.min(0.9, 0.2 + cell.tamper)})`;
          ctx.fillText(cell.ch, c * CELL, r * CELL);
        }
      }

      for (const blob of TAMPER) {
        const bx = blob.x * width;
        const by = blob.y * height;
        const bw = blob.rx * width;
        const bh = blob.ry * height;
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "rgba(255,90,77,0.7)";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx - bw, by - bh, bw * 2, bh * 2);
        ctx.restore();
        ctx.fillStyle = "rgba(255,90,77,0.9)";
        ctx.font = `600 9px ${MONO}`;
        ctx.fillText("TAMPERED", bx - bw, by - bh - 13);
      }
    };

    const build = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      still.width = canvas.width;
      still.height = canvas.height;

      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      cells = new Array(cols * rows);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const nx = c / cols;
          const ny = r / rows;
          let tamper = 0;
          for (const t of TAMPER) {
            const dx = (nx - t.x) / t.rx;
            const dy = (ny - t.y) / t.ry;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 1) tamper = Math.max(tamper, 1 - d);
          }
          cells[r * cols + c] = {
            ch: GLYPHS[(Math.random() * GLYPHS.length) | 0],
            tamper,
            jitter: Math.random(),
          };
        }
      }

      // Static layer: the unreadable noise floor, drawn once per resize.
      if (stillCtx) {
        stillCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        stillCtx.clearRect(0, 0, width, height);
        stillCtx.font = glyphFont;
        stillCtx.textBaseline = "top";
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cell = cells[r * cols + c];
            stillCtx.fillStyle = `rgba(244,244,242,${0.045 + cell.jitter * 0.06})`;
            stillCtx.fillText(cell.ch, c * CELL, r * CELL);
          }
        }
      }

      // Resizing reallocates the backing store, which wipes the canvas. The
      // animation loop repaints on the next frame, but the static path has no
      // next frame, so it has to repaint here or the field goes blank.
      if (reduced) paintStatic();
    };

    build();

    // Pointer is lerped so the lens has weight — it trails the cursor slightly
    // instead of snapping, which reads as an instrument rather than a cursor.
    let targetX = width * 0.5;
    let targetY = height * 0.5;
    let lensX = targetX;
    let lensY = targetY;
    let hasPointer = false;

    const onMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      hasPointer = true;
    };
    const onLeave = () => {
      hasPointer = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    parent.addEventListener("pointerleave", onLeave);

    const ro = new ResizeObserver(() => build());
    ro.observe(parent);

    let frame = 0;
    let t0 = 0;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;

      // Idle: the lens wanders a Lissajous path so the field is alive before
      // the pointer arrives, and on touch where there is no pointer at all.
      if (!hasPointer) {
        targetX = width * (0.5 + 0.28 * Math.sin(t * 0.34));
        targetY = height * (0.5 + 0.22 * Math.sin(t * 0.47 + 1.1));
      }
      lensX += (targetX - lensX) * 0.085;
      lensY += (targetY - lensY) * 0.085;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(still, 0, 0, width, height);

      ctx.font = glyphFont;
      ctx.textBaseline = "top";

      // Sweep band: a slow horizontal rule that travels top to bottom and
      // lifts whatever it crosses, like a flatbed scanner passing under glass.
      const sweepY = ((t * 0.12) % 1.35) * height - height * 0.175;
      const sweepRow0 = Math.max(0, Math.floor((sweepY - 22) / CELL));
      const sweepRow1 = Math.min(rows - 1, Math.ceil((sweepY + 22) / CELL));

      for (let r = sweepRow0; r <= sweepRow1; r++) {
        const fall = 1 - Math.min(1, Math.abs(r * CELL - sweepY) / 26);
        if (fall <= 0) continue;
        for (let c = 0; c < cols; c++) {
          const cell = cells[r * cols + c];
          ctx.fillStyle = `rgba(225,240,86,${fall * 0.22 * (0.4 + cell.jitter * 0.6)})`;
          ctx.fillText(cell.ch, c * CELL, r * CELL);
        }
      }

      if (sweepY > -20 && sweepY < height + 20) {
        const g = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY + 30);
        g.addColorStop(0, "rgba(225,240,86,0)");
        g.addColorStop(0.5, "rgba(225,240,86,0.14)");
        g.addColorStop(1, "rgba(225,240,86,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, sweepY - 30, width, 60);
      }

      // Lens: only the cells inside the disc are re-rendered.
      const c0 = Math.max(0, Math.floor((lensX - LENS_RADIUS) / CELL));
      const c1 = Math.min(cols - 1, Math.ceil((lensX + LENS_RADIUS) / CELL));
      const r0 = Math.max(0, Math.floor((lensY - LENS_RADIUS) / CELL));
      const r1 = Math.min(rows - 1, Math.ceil((lensY + LENS_RADIUS) / CELL));

      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const px = c * CELL;
          const py = r * CELL;
          const dx = px - lensX;
          const dy = py - lensY;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > LENS_RADIUS) continue;

          const cell = cells[r * cols + c];
          // Smoothstep falloff: hard enough to read as an edge, soft enough
          // that the lens does not look like a clipped circle.
          const k = 1 - d / LENS_RADIUS;
          const fall = k * k * (3 - 2 * k);
          // Cells flicker on their own phase so the field looks like live data.
          const flick = 0.72 + 0.28 * Math.sin(t * 3.1 + cell.jitter * 12.9);

          if (cell.tamper > 0.02) {
            ctx.fillStyle = `rgba(255,90,77,${Math.min(1, fall * (0.5 + cell.tamper * 1.4) * flick)})`;
          } else {
            ctx.fillStyle = `rgba(225,240,86,${fall * 0.82 * flick})`;
          }
          ctx.fillText(cell.ch, px, py);
        }
      }

      // The payoff: once the lens overlaps a tamper blob, the engine commits.
      // A dashed box snaps around the region and labels it, which is the whole
      // product in one gesture — the reader finds nothing, the engine finds it.
      for (const blob of TAMPER) {
        const bx = blob.x * width;
        const by = blob.y * height;
        const bw = blob.rx * width;
        const bh = blob.ry * height;
        const reach = Math.hypot(bx - lensX, by - lensY) - Math.max(bw, bh);
        if (reach > LENS_RADIUS) continue;

        const lock = Math.min(1, Math.max(0, 1 - reach / LENS_RADIUS));
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.lineDashOffset = -t * 22;
        ctx.strokeStyle = `rgba(255,90,77,${lock * 0.85})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx - bw, by - bh, bw * 2, bh * 2);
        ctx.restore();

        ctx.fillStyle = `rgba(255,90,77,${lock})`;
        ctx.font = `600 9px ${MONO}`;
        ctx.fillText("TAMPERED", bx - bw, by - bh - 13);
        ctx.font = glyphFont;
      }

      // Instrument chrome: ring + crosshair, thin and unfilled.
      ctx.strokeStyle = "rgba(225,240,86,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(lensX, lensY, LENS_RADIUS * 0.94, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(225,240,86,0.5)";
      ctx.beginPath();
      ctx.moveTo(lensX - 9, lensY);
      ctx.lineTo(lensX + 9, lensY);
      ctx.moveTo(lensX, lensY - 9);
      ctx.lineTo(lensX, lensY + 9);
      ctx.stroke();
    };

    if (reduced) {
      paintStatic();
    } else {
      frame = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
