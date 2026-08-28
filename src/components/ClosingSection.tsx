import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/smoothScroll";
import { FeaturePanels, PANELS } from "@/components/FeatureGallerySection";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/** Phase boundaries of the pinned closing screen. */
const WIPE_END = 0.3; // light → dark reveal
const SHRINK_END = 0.45; // headline scales down to 60%
const TITLE_SCALE = 0.6;
// Panels finish sliding before the very end; the remaining scroll is a
// "hold" where the final panel stays pinned so the next module can flip
// up over it (mirroring the hero's fixed-cover transition).
const SLIDE_END = 0.9;
const HOLD_VH = 100;

/** Fraction of each panel's scroll segment spent moving (rest is a hold). */
const SNAP_MOVE = 0.42;

/**
 * Quantises the free 0→1 track progress into per-panel steps: each panel rests
 * in place, then the track glides to the next panel at the end of its segment.
 */
const snapSlide = (s: number) => {
  const steps = PANELS.length;
  const i = Math.min(steps - 1, Math.floor(s * steps));
  const f = clamp(s * steps - i);
  const t = clamp((f - (1 - SNAP_MOVE)) / SNAP_MOVE);
  return clamp((i + t * t * (3 - 2 * t)) / steps);
};

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
  const dotsRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [desktop, setDesktop] = useState(true);
  const [inView, setInView] = useState(false);
  const [viewportH, setViewportH] = useState(900);
  const [travel, setTravel] = useState(0);
  const [titleW, setTitleW] = useState(0);
  const [titleLeft, setTitleLeft] = useState(0);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [viewportW, setViewportW] = useState(1440);

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
      if (titleRef.current) {
        setTitleW(titleRef.current.offsetWidth);
        setTitleLeft(titleRef.current.offsetLeft);
      }
      setViewportW(window.innerWidth);
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

  /* Centre the 40px lattice. Keep both terminal crosshairs on actual lattice
     intersections rather than deriving the lower point from a separate inset. */
  useEffect(() => {
    const el = dotsRef.current;
    if (!el) return;
    const STEP = 40;
    const NAV = 60;
    const apply = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const xMin = window.innerWidth <= 990 ? 16 : 120;
      const yMin = 80;
      const xInset = xMin + (((w - 2 * xMin) % STEP) + STEP) % STEP / 2;
      const yInset = yMin + (((h - NAV - 2 * yMin) % STEP) + STEP) % STEP / 2;
      const yStart = NAV + yInset;
      const yEnd = yStart + Math.floor((h - yInset - yStart) / STEP) * STEP;
      el.style.setProperty("--grid-x-inset", `${xInset}px`);
      el.style.setProperty("--grid-y-inset", `${yInset}px`);
      el.style.setProperty("--grid-y-end", `${yEnd}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
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
  // Once the headline has reached its smallest size, the track stops scrolling
  // freely: each panel holds ("snaps") on screen for most of its scroll segment
  // and then transitions quickly to the next one.
  const SLIDE_START = SHRINK_END;
  const raw = pinned ? clamp((p - SLIDE_START) / (SLIDE_END - SLIDE_START)) : 1;
  const slide = pinned ? snapSlide(raw) : 1;


  const scale = pinned ? 1 - (1 - TITLE_SCALE) * shrink : TITLE_SCALE;
  const x = pinned ? travel * slide : 0;
  // Static: measured against the final headline scale so the offset never
  // shifts mid-slide.
  const lead = pinned
    ? Math.max(0, viewportW - (titleLeft + titleW * TITLE_SCALE) - 2 * 128 - 200)
    : 0;
  // The 16% boundary rule arrives with the first panel.
  const firstLeft = offsets[0] !== undefined ? offsets[0] - x : viewportW;
  const edgeOn = pinned ? clamp((viewportW - firstLeft) / (viewportW * 0.5)) : 1;


  // Panel offsets shift while the headline shrinks (its layout width is
  // compensated with a negative margin), so re-measure whenever scale changes.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    setOffsets(
      Array.from(track.querySelectorAll<HTMLElement>(".artemis-gallery__panel")).map(
        (el) => el.offsetLeft,
      ),
    );
  }, [scale, travel, titleW, lead, desktop]);



  return (
    <section className="artemis-closing" aria-label="Artemis delivers certainty">
      {/* Surface probes: the dark wipe travels bottom-up, so the dock flips to
          its dark variant well before the nav does. */}
      {inView && wipe * viewportH > viewportH - 80 && (
        <div
          aria-hidden
          data-dark-section=""
          style={{ position: "fixed", top: 0, left: 0, right: 0, height: 80, pointerEvents: "none", zIndex: -1 }}
        />
      )}
      {inView && wipe * viewportH > 80 && (
        <div
          aria-hidden
          data-dark-section=""
          style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 80, pointerEvents: "none", zIndex: -1 }}
        />
      )}
      <div
        ref={wrapperRef}
        className="artemis-closing__wrapper"
        style={pinned ? { height: `${300 + 80 + PANELS.length * 115 + HOLD_VH}vh` } : undefined}
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
            <div ref={dotsRef} className="artemis-closing__dots" />
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
              {/* Pushes the panel group past the right viewport edge, so the
                  first card is dragged in from off-screen instead of sitting
                  next to the shrunken headline. */}
              <div className="artemis-closing__lead" style={{ flex: `0 0 ${lead}px` }} aria-hidden />
              <FeaturePanels lefts={offsets.map((o) => o - x)} viewportW={viewportW} viewportH={viewportH} pinned={pinned} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClosingSection;
