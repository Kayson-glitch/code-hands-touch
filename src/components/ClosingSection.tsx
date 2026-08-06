import { useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/smoothScroll";

const clamp = (v: number) => Math.max(0, Math.min(1, v));

const Words = () => (
  <p className="artemis-closing__text">
    {"{"}Artemis{"}"}
    <br />
    delivers
    <br />
    <em>certainty</em>
  </p>
);

export function ClosingSection() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const [viewportH, setViewportH] = useState(900);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const wh = window.innerHeight;
      // Invert starts once the pinned text is centred and completes before the
      // section releases, mirroring the reference site's wipe.
      const travel = Math.max(1, rect.height - wh);
      setProgress(clamp((-rect.top - wh * 0.15) / (travel * 0.55)));
      setInView(rect.top < wh && rect.bottom > 0);
      setViewportH(wh);
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    const lenis = getLenis();
    lenis?.on("scroll", update);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      lenis?.off("scroll", update);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  const p = clamp(progress);

  return (
    <section className="artemis-closing" aria-label="Artemis delivers certainty">
      {/* Surface probes: the dark wipe travels bottom-up, so the dock flips to
          its dark variant well before the nav does. */}
      {inView && p * viewportH > 80 && (
        <div
          aria-hidden
          data-dark-section=""
          style={{ position: "fixed", top: 0, left: 0, right: 0, height: 80, pointerEvents: "none", zIndex: -1 }}
        />
      )}
      {inView && p * viewportH > viewportH - 80 && (
        <div
          aria-hidden
          data-dark-section=""
          style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 80, pointerEvents: "none", zIndex: -1 }}
        />
      )}
      <div ref={wrapperRef} className="artemis-closing__wrapper">
        <div className="artemis-closing__sticky">
          <div className="artemis-closing__stage">
            <Words />
          </div>
          <div
            className="artemis-closing__invert"
            aria-hidden="true"
            style={{ clipPath: `inset(${((1 - p) * 100).toFixed(3)}% 0 0 0)` }}
          >
            <div className="artemis-closing__dots" />
            <div className="artemis-closing__stage">
              <Words />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default ClosingSection;
