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
/** Fixed navbar height; the background grid starts below it. */
const NAV_HEIGHT = 60;

/**
 * Discrete states of the slide phase: 0 = headline only, 1..n = panel n pinned
 * at the left grid boundary. Each state occupies one equal slice of the slide
 * scroll range and the track jumps between them with no intermediate position.
 */
const slideState = (s: number) => {
  const states = PANELS.length + 1;
  return Math.min(states - 1, Math.floor(clamp(s) * states));
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
  // The footer rises over the stage during the hold; once it has covered the
  // nav strip / dock strip, the dark-surface probes must switch off so the
  // chrome flips back to its light variant on the CTA screen.
  const [navCovered, setNavCovered] = useState(false);
  const [dockCovered, setDockCovered] = useState(false);
  const [viewportH, setViewportH] = useState(900);
  const [travel, setTravel] = useState(0);
  const [titleW, setTitleW] = useState(0);
  const [titleLeft, setTitleLeft] = useState(0);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [viewportW, setViewportW] = useState(1440);
  const [gridX, setGridX] = useState(120);

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

  /* Figma 1696:29556: 40px lattice, 120px horizontal and 80px vertical
     boundary insets at the 1440×920 reference frame. */
  useEffect(() => {
    const el = dotsRef.current;
    if (!el) return;
    const apply = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const xInset = window.innerWidth <= 990 ? 16 : Math.min(120, w / 12);
      /* Grid starts below the 60px navbar and is vertically centered in
         the remaining viewport (80px margins at the 920px reference).
         The horizontal lattice is anchored at the top boundary line, so
         the bottom boundary lands on a 40px row only when
         (h - NAV - 2c) ≡ 0 (mod 40), where c is the equal clearance
         above the top and below the bottom boundary. */
      const regionH = h - NAV_HEIGHT;
      const STEP = 40;
      const c0 = Math.min(80, regionH * (80 / (920 - NAV_HEIGHT)));
      const m = (((h - NAV_HEIGHT) % STEP) + STEP) % STEP;
      const target = (m / 2) % (STEP / 2);
      const d0 = (((target - c0) % (STEP / 2)) + STEP / 2) % (STEP / 2);
      const c = c0 + (d0 <= STEP / 4 ? d0 : d0 - STEP / 2);
      const yInset = NAV_HEIGHT + c;
      const yEnd = h - c;
      setGridX(xInset);
      el.style.setProperty("--grid-x-inset", `${xInset}px`);
      el.style.setProperty("--grid-y-inset", `${yInset}px`);
      el.style.setProperty("--grid-y-start", `${yInset}px`);
      el.style.setProperty("--grid-y-end", `${yEnd}px`);
      /* Symmetric fade: same clearance above the top boundary (measured from the
         navbar) as below the bottom boundary. */
      el.style.setProperty("--grid-y-fade", `${yInset - NAV_HEIGHT}px`);
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
      // Footer top in viewport coords = rect.bottom - wh (it starts 100vh before the wrapper ends).
      const footerTop = rect.bottom - wh;
      setNavCovered(footerTop <= 80);
      setDockCovered(footerTop <= wh - 80);
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

  // Leaving the last panel mirrors the hero → second-screen hand-off: once the
  // panels have finished sliding, a single wheel notch slides the page a whole
  // screen onto the CTA instead of dragging the footer up bit by bit. Scrolling
  // up from the CTA snaps back to the settled last panel.
  useEffect(() => {
    if (!pinned) return;
    const snap = { active: false };
    const SNAP_MS = 900;
    const easeInOut = (x: number) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const bounds = () => {
      const el = wrapperRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const travel = rect.height - window.innerHeight;
      // Scroll position where the last panel is settled and the footer has not
      // yet started to rise, and where the CTA screen fully covers the stage.
      return { settled: top + travel * SLIDE_END, end: top + travel };
    };

    const snapTo = (to: number) => {
      if (snap.active) return;
      snap.active = true;
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(to, {
          duration: SNAP_MS / 1000,
          easing: easeInOut,
          force: true,
          lock: true,
          onComplete: () => {
            snap.active = false;
          },
        });
        return;
      }
      const from = window.scrollY;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / SNAP_MS);
        window.scrollTo(0, from + (to - from) * easeInOut(t));
        if (t < 1) requestAnimationFrame(tick);
        else snap.active = false;
      };
      requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      if (snap.active) {
        e.preventDefault();
        return;
      }
      const b = bounds();
      if (!b) return;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const y = window.scrollY;
      if (dy > 0 && y >= b.settled - 2 && y < b.end - 2) {
        e.preventDefault();
        snapTo(b.end);
      } else if (dy < 0 && y > b.settled + 2 && y <= b.end + 2) {
        e.preventDefault();
        snapTo(b.settled);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [pinned]);

  const p = clamp(progress);
  const wipe = pinned ? clamp(p / WIPE_END) : 1;
  const shrink = pinned ? easeOutCubic(clamp((p - WIPE_END) / (SHRINK_END - WIPE_END))) : 1;
  // Once the headline has reached its smallest size the track stops scrolling
  // freely: it snaps instantly between discrete states, each panel resting at
  // the left grid boundary exactly as in the static Figma frame.
  const SLIDE_START = SHRINK_END;
  const raw = pinned ? clamp((p - SLIDE_START) / (SLIDE_END - SLIDE_START)) : 1;
  const state = pinned ? slideState(raw) : PANELS.length;

  const scale = pinned ? 1 - (1 - TITLE_SCALE) * shrink : TITLE_SCALE;
  const target =
    state > 0 && offsets[state - 1] !== undefined
      ? Math.max(0, offsets[state - 1]! - gridX)
      : 0;
  const x = pinned ? target : 0;

  /* Smooth glide between snapped states: instead of a CSS transition (which
     restarts abruptly when the wheel advances the state mid-flight), the
     position is damped toward the target every frame with exponential
     smoothing, so speed is consistent regardless of scroll rhythm. */
  const [smoothX, setSmoothX] = useState(0);
  const smoothRef = useRef(0);
  useEffect(() => {
    if (!pinned) {
      smoothRef.current = 0;
      setSmoothX(0);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const prev = smoothRef.current;
      // ~0.85s to cover most of the distance, same feel as the old easing.
      const next = prev + (x - prev) * (1 - Math.exp(-dt / 120));
      const settled = Math.abs(x - next) < 0.5;
      const value = settled ? x : next;
      if (value !== prev) {
        smoothRef.current = value;
        setSmoothX(value);
      }
      if (!settled) raf = requestAnimationFrame(tick);
    };
    if (Math.abs(x - smoothRef.current) >= 0.5) {
      raf = requestAnimationFrame(tick);
    } else if (smoothRef.current !== x) {
      smoothRef.current = x;
      setSmoothX(x);
    }
    return () => cancelAnimationFrame(raf);
  }, [x, pinned]);
  /* Fractional module position derived from the damped track offset, so the
     label progress bar slides continuously while the track glides between
     snapped states instead of jumping with it. */
  const tickerPos = (() => {
    if (!pinned) return PANELS.length - 1;
    const stops = PANELS.map((_, i) =>
      offsets[i] !== undefined ? Math.max(0, offsets[i]! - gridX) : 0,
    );
    if (smoothX <= stops[0]!) return 0;
    for (let i = 0; i < stops.length - 1; i += 1) {
      const a = stops[i]!;
      const b = stops[i + 1]!;
      if (smoothX < b) {
        const span = b - a;
        return i + (span > 0 ? (smoothX - a) / span : 0);
      }
    }
    return stops.length - 1;
  })();

  // Static: measured against the final headline scale so the offset never
  // shifts mid-slide.
  const lead = pinned
    ? Math.max(0, viewportW - (titleLeft + titleW * TITLE_SCALE) - 2 * 128 - 200)
    : 0;
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
  }, [scale, travel, titleW, lead, desktop, gridX]);



  return (
    <section className="artemis-closing" aria-label="Artemis delivers certainty">
      {/* Surface probes: the dark wipe travels bottom-up, so the dock flips to
          its dark variant well before the nav does. */}
      {inView && !navCovered && wipe * viewportH > viewportH - 80 && (
        <div
          aria-hidden
          data-dark-section=""
          style={{ position: "fixed", top: 0, left: 0, right: 0, height: 80, pointerEvents: "none", zIndex: -1 }}
        />
      )}
      {inView && !dockCovered && wipe * viewportH > 80 && (
        <div
          aria-hidden
          data-dark-section=""
          style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 80, pointerEvents: "none", zIndex: -1 }}
        />
      )}
      <div
        ref={wrapperRef}
        className="artemis-closing__wrapper"
        style={pinned ? { height: `${300 + 80 + PANELS.length * 90 + HOLD_VH}vh` } : undefined}
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
            <div ref={dotsRef} className="artemis-closing__dots">
              {pinned && state > 0 && (
                <div
                  key={PANELS[state - 1]?.id ?? state}
                  className="artemis-closing__converge"
                  aria-hidden
                >
                  <span className="artemis-closing__converge-horizontal" />
                  <span className="artemis-closing__converge-vertical" />
                  <span className="artemis-closing__converge-cross" />
                </div>
              )}
            </div>

            <div
              ref={trackRef}
              className="artemis-closing__track"
              style={pinned ? { transform: `translate3d(${-smoothX}px, 0, 0)` } : undefined}
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
              <FeaturePanels activeIndex={state - 1} pinned={pinned} tickerPos={tickerPos} />
              {/* Trailing room so the last module can also rest on the left grid line. */}
              <div className="artemis-closing__lead" style={{ flex: `0 0 ${lead}px` }} aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClosingSection;
