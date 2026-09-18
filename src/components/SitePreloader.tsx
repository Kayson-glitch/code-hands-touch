import { useEffect, useRef, useState } from "react";
import { HeroDots } from "@/components/ProductHero";
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
const MIN_MS = 560;
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
const CELL_W = "min(61vw, 640px)";
const CELL_H = 42;
const CELL_INSET = 5;
const RULE = "rgba(14, 11, 34, 0.09)";
const TRACK = "#F1F1F3";

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
    if (fonts) fonts.then(() => { signals.fonts = 1; }).catch(() => { signals.fonts = 1; });
    else signals.fonts = 1;

    // the hero's frame atlas
    const img = new Image();
    const artDone = () => { signals.art = 1; };
    img.onload = artDone;
    img.onerror = artDone;
    img.src = handsFramesAsset.url;

    // everything else
    if (document.readyState === "complete") signals.load = 1;
    const onLoad = () => { signals.load = 1; };
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
        gap: 92,
        // the site's paper, so the hero fades in out of the same ground
        background: "#FAFAFA",
        opacity: leaving ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      {/* The product pages' dot field, rings and all. It is a canvas, so the
          plain grid stands in until the script arrives and they trade places
          on the same 20px pitch. */}
      {live ? (
        <HeroDots />
      ) : (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(14,11,34,0.16) 0 1px, transparent 1.6px)",
            backgroundSize: "20px 20px",
            maskImage: "radial-gradient(circle at 50% 50%, #000 0%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 0%, transparent 78%)",
          }}
        />
      )}

      {/* The rules that draw the cell: two across the page, two down it. */}
      <span aria-hidden className="absolute" style={{ left: 0, right: 0, top: "50%", height: CELL_H, transform: "translateY(-50%)" }}>
        <span className="absolute" style={{ left: 0, right: 0, top: 0, height: 1, background: RULE }} />
        <span className="absolute" style={{ left: 0, right: 0, bottom: 0, height: 1, background: RULE }} />
      </span>
      <span
        aria-hidden
        className="absolute"
        style={{ top: 0, bottom: 0, width: CELL_W, left: "50%", transform: "translateX(-50%)" }}
      >
        <span className="absolute" style={{ top: 0, bottom: 0, left: 0, width: 1, background: RULE }} />
        <span className="absolute" style={{ top: 0, bottom: 0, right: 0, width: 1, background: RULE }} />
      </span>

      {/* the cell itself, with the fill inset off its rules */}
      <span
        ref={trackRef}
        className="relative block"
        style={{ width: CELL_W, height: CELL_H, background: TRACK, padding: CELL_INSET }}
      >
        <span
          ref={fillRef}
          className={`site-preloader-fill${live ? " is-live" : ""}`}
          style={{
            position: "absolute",
            left: CELL_INSET,
            top: CELL_INSET,
            bottom: CELL_INSET,
            width: live ? `calc((100% - ${CELL_INSET * 2}px) * ${shown})` : undefined,
            background: "#0E0B22",
          }}
        />
      </span>

      {/* The figure, in the face every number on the site is set in. It counts
          from nought in CSS before the script lands, then the component takes
          the count over. */}
      <span
        className="font-display relative flex items-baseline tabular-nums"
        style={{ fontSize: fluid(48, 32), lineHeight: 1, fontWeight: 400, color: "#0E0B22" }}
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
