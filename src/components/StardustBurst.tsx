import { useEffect, useRef } from "react";

/**
 * Full-screen Canvas 2D particle burst. Emanates from `centerX/centerY` and
 * grows/collapses with `progress` (0..1). Reversible — hooking directly to
 * scroll progress from IntroVideo. A soft radial black backdrop underneath
 * gives the Shopify-style "organic void" beneath the sparkles.
 */
export function StardustBurst({
  progress,
  centerX,
  centerY,
  visible,
}: {
  progress: number;
  centerX: number;
  centerY: number;
  visible: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  const centerRef = useRef({ x: centerX, y: centerY });
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { centerRef.current = { x: centerX, y: centerY }; }, [centerX, centerY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Adaptive particle count.
    const area = window.innerWidth * window.innerHeight;
    const baseCount = Math.round(Math.min(360, Math.max(180, area / 6000)));
    const count = prefersReduce ? 0 : baseCount;

    type P = {
      angle: number;
      radiusFactor: number; // 0..1 relative to maxR
      size: number;
      twinklePhase: number;
      twinkleFreq: number;
      hueBias: number; // 0 = white, small purple tint
    };
    const particles: P[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radiusFactor: 0.05 + Math.pow(Math.random(), 0.7) * 0.95,
        size: 0.6 + Math.random() * 1.8,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleFreq: 2 + Math.random() * 4,
        hueBias: Math.random(),
      });
    }

    // Pre-render a soft glow sprite.
    const spriteSize = 24;
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = spriteSize;
    const sctx = sprite.getContext("2d")!;
    const grad = sctx.createRadialGradient(
      spriteSize / 2, spriteSize / 2, 0,
      spriteSize / 2, spriteSize / 2, spriteSize / 2,
    );
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.3, "rgba(240,232,255,0.6)");
    grad.addColorStop(1, "rgba(197,169,255,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, spriteSize, spriteSize);

    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let running = true;
    const startT = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const draw = () => {
      if (!running) return;
      const p = Math.min(1, Math.max(0, progressRef.current));
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      if (p <= 0.001) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const { x: cx, y: cy } = centerRef.current;
      const maxR = Math.hypot(
        Math.max(cx, w - cx),
        Math.max(cy, h - cy),
      ) * 1.05;
      const R = easeOutCubic(p) * maxR;
      const t = (performance.now() - startT) / 1000;

      // Layered draw: sparkles on top.
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        const r = R * pt.radiusFactor;
        if (r < 1) continue;
        const px = cx + Math.cos(pt.angle) * r;
        const py = cy + Math.sin(pt.angle) * r;
        if (px < -20 || py < -20 || px > w + 20 || py > h + 20) continue;
        // Fade in near disc edge, brightest just inside, dim near center as p→1.
        const edgeK = 1 - pt.radiusFactor; // 0 at edge, 1 at center
        const twinkle = 0.55 + 0.45 * Math.sin(t * pt.twinkleFreq + pt.twinklePhase);
        const alpha = Math.min(1, 0.35 + 0.65 * edgeK) * twinkle * Math.min(1, p * 2.5);
        const size = pt.size * (3 + edgeK * 4);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, px - size / 2, py - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // Update backdrop radial mask via style.
      if (bgRef.current) {
        const rPct = Math.min(150, (R / Math.max(w, h)) * 100);
        bgRef.current.style.background = `radial-gradient(circle at ${cx}px ${cy}px, rgba(0,0,0,${0.85 * Math.min(1, p * 1.5)}) 0%, rgba(0,0,0,${0.6 * Math.min(1, p * 1.5)}) ${rPct * 0.5}%, rgba(0,0,0,0) ${rPct}%)`;
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 65,
        opacity: visible ? 1 : 0,
        transition: "opacity 400ms ease-out",
      }}
    >
      <div ref={bgRef} style={{ position: "absolute", inset: 0 }} />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default StardustBurst;