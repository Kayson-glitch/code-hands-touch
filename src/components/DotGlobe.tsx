import { useEffect, useRef } from "react";
import { worldLandMaskAsset } from "@/lib/media";

/**
 * Dot-matrix globe, turning on its own.
 *
 * The same drawing language as the hero hands and the footer wordmark: one dot
 * per cell of a grid, tone carried by dot area. Here the grid is a sphere —
 * rings of latitude with the dot count per ring scaled by cos(lat) so spacing
 * stays even — and each dot asks an equirectangular land mask whether it sits
 * on land. Ocean dots stay faint, land dots take the ink, and both fade toward
 * the limb so the sphere reads as a sphere.
 */

/** Degrees between rings of latitude. */
const LAT_STEP = 2.1;
/** Arc between dots along the equator, in degrees. */
const LON_STEP = 2.1;
/** Turn rate, degrees a second. */
const SPIN = 5.2;

export function DotGlobe({
  className,
  style,
  /** Ink for the land dots. */
  ink = "#0E0B22",
  /** Peak alpha of a land dot at the centre of the disc. */
  landAlpha = 0.5,
  /** Peak alpha of an ocean dot — the graticule the continents sit in. */
  oceanAlpha = 0.095,
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
      // Dot pitch at the equator, so the disc's density is size-independent.
      const pitch = (r * 2 * Math.PI * (LON_STEP / 360)) / 2;

      for (const d of dots) {
        // spin about the polar axis, then tilt the axis toward the viewer
        const x = d.x * cosS + d.z * sinS;
        const zs = -d.x * sinS + d.z * cosS;
        const y = d.y * cosT - zs * sinT;
        const z = d.y * sinT + zs * cosT;
        if (z <= 0.02) continue; // back of the sphere

        // depth: dots shrink and fade toward the limb
        const depth = z;
        const rr = pitch * (0.26 + 0.42 * depth) * (d.land ? 1 : 0.7);
        if (rr < 0.12) continue;
        const a = (d.land ? landAlpha : oceanAlpha) * (0.25 + 0.75 * depth);

        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(r + x * r * 0.94, r - y * r * 0.94, rr, 0, Math.PI * 2);
        ctx.fill();
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
