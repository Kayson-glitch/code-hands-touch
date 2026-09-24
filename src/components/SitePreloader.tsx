import { useEffect, useRef, useState } from "react";
import { SonarGrid } from "@/components/ui/sonar-grid";
import { GRADIENT_STOPS } from "@/components/RainbowButton";
import { CropFrame } from "@/components/CropFrame";
import { handsFramesAsset } from "@/lib/media";
import { fluid } from "@/lib/fluid";

/**
 * First-load screen.
 *
 * The first screen is a canvas that can draw nothing until its frame atlas has
 * decoded, and the display face arrives from a third party with `display=swap`,
 * so an unguarded entry shows an empty hero and then swaps the headline's type
 * underneath the reader. This holds that moment behind the site's own chrome —
 * the hero's dot field on paper, the figure in the display face, and one
 * square bar carrying the brand gradient — while what it needs lands.
 *
 * It only ever runs on a real page load: client-side route changes don't
 * remount the root, so navigating inside the site never sees it.
 */

/** Never flash: the bar is on screen at least this long. */
const MIN_MS = 1100;
/** Never trap: whatever is still pending, the page is handed over by now. */
const MAX_MS = 3600;
/** Fade of the overlay once the page is ready. */
const FADE_MS = 600;
/** Ceiling on how fast the bar may climb, so it always reads as travel. */
const CLIMB_PER_MS = 1 / 900;
/**
 * Fonts and a decoded image only report done, not progress, so on a slow line
 * every signal is nought for seconds. A time curve carries the bar in the
 * meantime — it eases toward this ceiling and can never reach the end on its
 * own, so completion still means the page is genuinely ready.
 */
const TRICKLE_CEILING = 0.92;
const TRICKLE_TAU = 1100;

/**
 * Measured off the reference: the bar sits in a cell drawn by two rules across
 * the page and two down it, inset a few pixels inside that cell, with the
 * figure below. Cell is 61% of the viewport and a thirtieth of its own width
 * tall; the fill clears the rules by CELL_INSET.
 */
const CELL_W = "min(44vw, 520px)";
/** A fifteenth of the cell's width, as measured off the mock. */
const CELL_H = "clamp(20px, 2.93vw, 35px)";
const CELL_INSET = "clamp(3px, 0.38vw, 5px)";
/** One grey for the track and the frame's rules, so they read as one drawing. */
const TRACK = "var(--surface-inset, #F1F1F3)";
const RULE = TRACK;
/** How far the frame's rules run past the cell before they fade out. */
const FRAME_REACH_X = 112;
const FRAME_REACH_Y = 108;

export function SitePreloader() {
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  /** False until the bundle has hydrated; the bar creeps in CSS until then. */
  const [live, setLive] = useState(false);
  const shownRef = useRef(0);
  const trackRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  // Pick up where the CSS creep got to, so taking over doesn't rewind the bar.
  useEffect(() => {
    const track = trackRef.current;
    const fill = fillRef.current;
    if (track && fill) {
      const w = track.getBoundingClientRect().width;
      if (w > 0) {
        const at = Math.min(1, fill.getBoundingClientRect().width / w);
        shownRef.current = at;
        setShown(at);
      }
    }
    setLive(true);
  }, []);

  useEffect(() => {
    // Weighted readiness: the hero's art and the fonts are what the first
    // screen actually waits on; `load` closes out the long tail.
    const signals = { fonts: 0, art: 0, load: 0 };
    const weights = { fonts: 0.4, art: 0.4, load: 0.2 };
    const target = () =>
      signals.fonts * weights.fonts + signals.art * weights.art + signals.load * weights.load;

    let raf = 0;
    let last = performance.now();
    let finishing = false;

    const finish = () => {
      if (finishing) return;
      finishing = true;
      // Unlock the page first, then fade off it.
      document.documentElement.style.overflow = "";
      setLeaving(true);
      window.setTimeout(() => setGone(true), FADE_MS);
    };

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      // Measured on the page's own timeline, so it lines up with the CSS creep
      // that ran before the script arrived.
      const elapsed = now;

      const trickle = (1 - Math.exp(-elapsed / TRICKLE_TAU)) * TRICKLE_CEILING;
      const cap = elapsed >= MAX_MS ? 1 : Math.max(target(), trickle);
      // Only ever forward: the bar must not rewind when the script takes over.
      const next = Math.max(shownRef.current, Math.min(cap, shownRef.current + CLIMB_PER_MS * dt));
      shownRef.current = next;
      setShown(next);

      if (next >= 0.999 && elapsed >= MIN_MS) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    document.documentElement.style.overflow = "hidden";
    raf = requestAnimationFrame(tick);

    // fonts
    const fonts = document.fonts?.ready;
    if (fonts)
      fonts
        .then(() => {
          signals.fonts = 1;
        })
        .catch(() => {
          signals.fonts = 1;
        });
    else signals.fonts = 1;

    // the hero's frame atlas
    const img = new Image();
    const artDone = () => {
      signals.art = 1;
    };
    img.onload = artDone;
    img.onerror = artDone;
    img.src = handsFramesAsset.url;

    // everything else
    if (document.readyState === "complete") signals.load = 1;
    const onLoad = () => {
      signals.load = 1;
    };
    window.addEventListener("load", onLoad);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      img.onload = null;
      img.onerror = null;
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden
      data-site-preloader
      data-progress={shown.toFixed(3)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(18px, 1.9vw, 30px)",
        // the site's paper, so the hero fades in out of the same ground
        background: "#FAFAFA",
        opacity: leaving ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      {/* The product pages' dot field, with the brand-gradient rings expanding
          through it. Same grid and colours as the heroes, but a ring goes out
          roughly every second from the middle of the screen: the heroes wait
          5.5s between pings, which inside a loader's life means none at all.
          It is a canvas, so the plain grid stands in until the script lands. */}
      {live ? (
        <SonarGrid
          aria-hidden
          spacing={20}
          dotRadius={1}
          baseOpacity={0.16}
          peakOpacity={0.7}
          color="#0E0B22"
          waveGradient={GRADIENT_STOPS}
          waveGradientMode="angular"
          pingEvery={1.1}
          speed={240}
          ringWidth={120}
          amplitude={0.6}
          interactive={false}
          seedPing
          pingArea={[0.36, 0.34, 0.64, 0.66]}
          className="pointer-events-none absolute inset-0"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0, #000 18%, #000 62%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, #000 18%, #000 62%, transparent 100%)",
          }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(14,11,34,0.16) 0 1px, transparent 1.6px)",
            backgroundSize: "20px 20px",
            maskImage:
              "linear-gradient(to bottom, transparent 0, #000 18%, #000 62%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, #000 18%, #000 62%, transparent 100%)",
          }}
        />
      )}

      {/* The cell. Only this and the figure take part in the layout; the
          Platform module's frame hangs off it as an overlay, so its reach
          never pushes the figure away. */}
      <span className="relative block" style={{ width: CELL_W, height: CELL_H }}>
        <span
          aria-hidden
          className="absolute"
          style={{
            left: -FRAME_REACH_X,
            right: -FRAME_REACH_X,
            top: -FRAME_REACH_Y,
            bottom: -FRAME_REACH_Y,
          }}
        >
          <CropFrame
            inset={`${FRAME_REACH_X}px`}
            insetTop={`${FRAME_REACH_Y}px`}
            insetBottom={`${FRAME_REACH_Y}px`}
            rule={RULE}
            marks={false}
          />
        </span>

        {/* the track sits over the frame, with the fill inset off its rules */}
        <span className="absolute" style={{ inset: 0, background: TRACK, padding: CELL_INSET }}>
          {/* the padded box, so the fill's width is a share of the run it travels */}
          <span ref={trackRef} className="relative block" style={{ width: "100%", height: "100%" }}>
            <span
              ref={fillRef}
              className={`site-preloader-fill${live ? " is-live" : ""}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: live ? `${shown * 100}%` : undefined,
                background: "#0E0B22",
              }}
            />
          </span>
        </span>
      </span>

      {/* The figure, in the face every number on the site is set in. It counts
          from nought in CSS before the script lands, then the component takes
          the count over. */}
      <span
        className="font-display relative flex items-baseline tabular-nums"
        style={{
          fontSize: "clamp(30px, 3.2vw, 52px)",
          lineHeight: 1,
          fontWeight: 400,
          color: "#0E0B22",
        }}
      >
        <span className={`site-preloader-count${live ? " is-live" : ""}`}>
          {live ? Math.round(shown * 100) : null}
        </span>
        <span style={{ marginLeft: 2, fontSize: "0.44em", color: "#7A7885" }}>%</span>
      </span>
    </div>
  );
}

export default SitePreloader;
