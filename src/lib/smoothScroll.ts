import Lenis from "lenis";

/**
 * Single page-wide Lenis instance (kore.ai-style inertial smooth scroll).
 * Mounted once from the root route; other components read it with getLenis()
 * so they can pause it (wheel hijack) or drive it (snap scroll).
 */
let instance: Lenis | null = null;
let rafId = 0;

export function getLenis(): Lenis | null {
  return instance;
}

export function initSmoothScroll(): Lenis | null {
  if (typeof window === "undefined") return instance;
  if (instance) return instance;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  instance = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 1,
    smoothWheel: true,
    // Native touch scrolling on mobile — matches the reference site.
    syncTouch: false,
  });

  const loop = (time: number) => {
    instance?.raf(time);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return instance;
}

export function destroySmoothScroll() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  instance?.destroy();
  instance = null;
}
