import { useEffect, useRef, useState } from "react";
import { GRADIENT } from "@/components/RainbowButton";
import { handsFramesAsset, logoAsset } from "@/lib/media";

/**
 * First-load screen.
 *
 * The first screen is a canvas that can draw nothing until its frame atlas has
 * decoded, and the display face arrives from a third party with `display=swap`,
 * so an unguarded entry shows an empty hero and then swaps the headline's type
 * underneath the reader. This holds that moment behind the site's own chrome —
 * the nav lockup on the paper dot field, and one hairline bar carrying the
 * brand gradient — while the things it actually needs land.
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

export function SitePreloader() {
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const shownRef = useRef(0);

  useEffect(() => {
    // Weighted readiness: the hero's art and the fonts are what the first
    // screen actually waits on; `load` closes out the long tail.
    const signals = { fonts: 0, art: 0, load: 0 };
    const weights = { fonts: 0.4, art: 0.4, load: 0.2 };
    const target = () =>
      signals.fonts * weights.fonts + signals.art * weights.art + signals.load * weights.load;

    let raf = 0;
    let last = performance.now();
    const started = last;
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
      const elapsed = now - started;

      const cap = elapsed >= MAX_MS ? 1 : target();
      const next = Math.min(cap, shownRef.current + CLIMB_PER_MS * dt);
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        // the site's paper, so the hero fades in out of the same ground
        background: "#FAFAFA",
        opacity: leaving ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      {/* the hero's own dot field: 1px dots on a 20px grid */}
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

      {/* the nav's own lockup, so the wait reads as part of the site */}
      <span className="relative flex items-center" style={{ gap: 8 }}>
        <img
          src={logoAsset.url}
          alt=""
          style={{ width: 28, height: 28, display: "block", borderRadius: 999, objectFit: "cover" }}
        />
        <span
          className="font-medium"
          style={{ fontSize: 18, lineHeight: "24px", color: "#0E0B22", letterSpacing: "-0.01em" }}
        >
          Synergy.AI
        </span>
      </span>

      {/* one hairline bar, the brand gradient travelling along it */}
      <span
        className="relative block overflow-hidden"
        style={{ width: "min(60vw, 128px)", height: 2, background: "rgba(14,11,34,0.12)" }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "left center",
            transform: `scaleX(${shown})`,
            backgroundImage: GRADIENT,
            backgroundSize: "128px 100%",
          }}
        />
      </span>
    </div>
  );
}

export default SitePreloader;
