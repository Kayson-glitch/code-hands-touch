import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/smoothScroll";
import { FeaturePanels, PANELS } from "@/components/FeatureGallerySection";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/** Phase boundaries of the pinned closing screen. */
const WIPE_END = 0.3; // light → dark reveal
const SHRINK_END = 0.45; // headline scales down to 60%
const TITLE_SCALE = 0.6;

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
  const trackRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [desktop, setDesktop] = useState(true);
  const [inView, setInView] = useState(false);
  const [viewportH, setViewportH] = useState(900);
  const [travel, setTravel] = useState(0);
  const [titleW, setTitleW] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const isDesktop = window.innerWidth >= 991;
      setDesktop(isDesktop);
      const track = trackRef.current;
      if (!isDesktop || !track) return;
      if (titleRef.current) setTitleW(titleRef.current.offsetWidth);
      setTravel(Math.max(0, track.scrollWidth - window.innerWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const pinned = desktop && !reduced;

  useEffect(() => {
    if (!pinned) {
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
      const distance = Math.max(1, rect.height - wh);
      setProgress(clamp(-rect.top / distance));
      setInView(rect.top < wh && rect.bottom > 0);
      setViewportH(wh);
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    // Same driver as the third screen: read on Lenis' tick so the reveal never
    // trails the smoothed scroll position by a frame.
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
  }, [pinned]);

  const p = clamp(progress);
  const wipe = pinned ? clamp(p / WIPE_END) : 1;
  const shrink = pinned ? easeOutCubic(clamp((p - WIPE_END) / (SHRINK_END - WIPE_END))) : 1;
  const slide = pinned ? clamp((p - SHRINK_END) / (1 - SHRINK_END)) : 1;

  const scale = pinned ? 1 - (1 - TITLE_SCALE) * shrink : TITLE_SCALE;
  const x = pinned ? travel * easeOutCubic(slide) : 0;

  return (
    <section className="artemis-closing" aria-label="Artemis delivers certainty">
      {/* Surface probes: the dark wipe travels bottom-up, so the dock flips to
          its dark variant well before the nav does. */}
      {inView && wipe * viewportH > 80 && (
        <div
          aria-hidden
          data-dark-section=""
          style={{ position: "fixed", top: 0, left: 0, right: 0, height: 80, pointerEvents: "none", zIndex: -1 }}
        />
      )}
      {inView && wipe * viewportH > viewportH - 80 && (
        <div
          aria-hidden
          data-dark-section=""
          style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 80, pointerEvents: "none", zIndex: -1 }}
        />
      )}
      <div
        ref={wrapperRef}
        className="artemis-closing__wrapper"
        style={pinned ? { height: `${260 + 60 + PANELS.length * 100}vh` } : undefined}
      >
        <div className="artemis-closing__sticky">
          {/* Light state: only visible while the dark layer wipes up. */}
          <div className="artemis-closing__stage">
            <Words />
          </div>

          <div
            className="artemis-closing__invert"
            aria-hidden={pinned && wipe < 0.02 ? "true" : undefined}
            style={pinned ? { clipPath: `inset(${((1 - wipe) * 100).toFixed(3)}% 0 0 0)` } : undefined}
          >
            {/* Dots are inside the pinned stage, so they stay locked while the
                headline shrinks and the panels slide through. */}
            <div className="artemis-closing__dots" />
            <div
              ref={trackRef}
              className="artemis-closing__track"
              style={pinned ? { transform: `translate3d(${-x}px, 0, 0)` } : undefined}
            >
              <div
                ref={titleRef}
                className="artemis-closing__title-slot"
                style={
                  pinned
                    ? {
                        transform: `scale(${scale})`,
                        marginRight: `${((scale - 1) * titleW).toFixed(2)}px`,
                      }
                    : undefined
                }
              >
                <Words />
              </div>
              <FeaturePanels progress={slide} pinned={pinned} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClosingSection;
