import { useEffect, useRef } from "react";
import { worldLandMaskAsset } from "@/lib/media";

/**
 * Dot-matrix globe, turning on its own.
 *
 * Built to the reference art: small squares on a fine sphere grid — rings of
 * latitude with the count per ring scaled by cos(lat) so spacing stays even —
 * each asking an equirectangular land mask whether it sits on land. The open
 * ocean is barely inked; it only becomes visible at the limb, where the grid
 * is seen edge-on and piles up into a rim. That rim, not a drawn outline, is
 * what makes the disc read as a sphere.
 */

/** Degrees between rings of latitude. */
const LAT_STEP = 1.15;
/** Arc between dots along the equator, in degrees. */
const LON_STEP = 1.15;
/** Square side as a fraction of the grid spacing, at the centre and the limb. */
const DOT_FILL = 0.57;
const DOT_FILL_LIMB = 0.36;
/** Turn rate, degrees a second. */
const SPIN = 5.2;

export function DotGlobe({
  className,
  style,
  /** Ink for the land dots — neutral, as in the reference art. */
  ink = "#3A3A44",
  /** Peak alpha of a land dot at the centre of the disc. */
  landAlpha = 0.54,
  /** Open ocean is almost bare; the limb does the rest by accumulation. */
  oceanAlpha = 0.012,
}: {
  className?: string;
  style?: React.CSSProperties;
  ink?: string;
  landAlpha?: number;
  oceanAlpha?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- the sphere's dots, in fixed lat/long; only the rotation changes
    type Dot = { x: number; y: number; z: number; land: boolean };
    const dots: Dot[] = [];
    const buildDots = (maskData: ImageData | null, mw: number, mh: number) => {
      dots.length = 0;
      for (let lat = -90 + LAT_STEP / 2; lat < 90; lat += LAT_STEP) {
        const rad = (lat * Math.PI) / 180;
        const ring = Math.max(1, Math.round((360 / LON_STEP) * Math.cos(rad)));
        for (let k = 0; k < ring; k++) {
          const lon = (k / ring) * 360 - 180;
          let land = false;
          if (maskData) {
            const mx = Math.min(mw - 1, Math.max(0, Math.round(((lon + 180) / 360) * mw)));
            const my = Math.min(mh - 1, Math.max(0, Math.round(((90 - lat) / 180) * mh)));
            land = maskData.data[(my * mw + mx) * 4] > 127;
          }
          const lonRad = (lon * Math.PI) / 180;
          dots.push({
            x: Math.cos(rad) * Math.sin(lonRad),
            y: Math.sin(rad),
            z: Math.cos(rad) * Math.cos(lonRad),
            land,
          });
        }
      }
    };

    let raf = 0;
    let spin = 0;
    let last = performance.now();
    let running = true;
    let size = 0;
    let dpr = 1;

    const resize = () => {
      size = host.clientWidth;
      if (size < 2) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    };

    const draw = () => {
      if (size < 2) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const r = size * 0.5;
      // A little off-axis tilt, so the poles aren't dead centre.
      const tilt = (-16 * Math.PI) / 180;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const s = (spin * Math.PI) / 180;
      const cosS = Math.cos(s);
      const sinS = Math.sin(s);
      // Grid spacing at the equator, so density is size-independent.
      const spacing = r * 2 * Math.PI * (LON_STEP / 360);
      const rr = r * 0.94;

      for (const d of dots) {
        // spin about the polar axis, then tilt the axis toward the viewer
        const x = d.x * cosS + d.z * sinS;
        const zs = -d.x * sinS + d.z * cosS;
        const y = d.y * cosT - zs * sinT;
        const z = d.y * sinT + zs * cosT;
        if (z <= 0.01) continue; // back of the sphere

        // The square barely tapers with depth — the rim is built by the grid
        // crowding together, not by fatter dots.
        const side = spacing * (DOT_FILL_LIMB + (DOT_FILL - DOT_FILL_LIMB) * z) * (d.land ? 1 : 0.92);
        if (side < 0.24) continue;
        // A fixed light across the disc, as in the reference: the ink builds
        // toward the right, so continents pass through it as the globe turns.
        const lit = 0.34 + 0.66 * (0.5 + 0.5 * x);
        ctx.globalAlpha = (d.land ? landAlpha : oceanAlpha) * lit * (0.5 + 0.5 * z);

        const px = r + x * rr - side / 2;
        const py = r - y * rr - side / 2;
        ctx.fillRect(px, py, side, side);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!prefersReduce) spin = (spin + SPIN * dt) % 360;
      draw();
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    ctx.fillStyle = ink;
    resize();

    // Load the mask, build the sphere, then start turning.
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = img.naturalWidth;
      off.height = img.naturalHeight;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (octx) {
        octx.drawImage(img, 0, 0);
        buildDots(octx.getImageData(0, 0, off.width, off.height), off.width, off.height);
      } else {
        buildDots(null, 0, 0);
      }
      ctx.fillStyle = ink;
      draw();
      if (!prefersReduce) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    img.src = worldLandMaskAsset.url;

    const ro = new ResizeObserver(() => {
      resize();
      ctx.fillStyle = ink;
      draw();
    });
    ro.observe(host);

    // Don't spend frames on a globe nobody can see.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const visible = e.isIntersecting;
          if (visible && !raf && !prefersReduce && dots.length) {
            running = true;
            last = performance.now();
            raf = requestAnimationFrame(tick);
          } else if (!visible && raf) {
            running = false;
            cancelAnimationFrame(raf);
            raf = 0;
          }
        }
      },
      { threshold: 0.05 },
    );
    io.observe(host);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      img.onload = null;
    };
  }, [ink, landAlpha, oceanAlpha]);

  return (
    <div ref={hostRef} className={className} style={{ aspectRatio: "1 / 1", ...style }}>
      <canvas ref={canvasRef} aria-hidden data-dot-globe style={{ display: "block" }} />
    </div>
  );
}

export default DotGlobe;
