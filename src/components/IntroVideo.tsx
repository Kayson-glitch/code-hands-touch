import { useEffect, useRef } from "react";
import videoAsset from "@/assets/intro-hands.mp4.asset.json";

export type IntroVideoEndInfo = {
  videoRect: DOMRect;
  videoW: number;
  videoH: number;
};

/**
 * Full-screen intro video. Calls `onEnded` exactly once when playback
 * reaches the last frame, so the caller can trigger the burst transition.
 */
export function IntroVideo({
  onEnded,
}: {
  onEnded: (info: IntroVideoEndInfo) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const firedRef = useRef(false);

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    const v = videoRef.current;
    if (!v) return;
    try {
      if (v.duration && !Number.isNaN(v.duration)) {
        v.currentTime = Math.max(0, v.duration - 0.01);
      }
      v.pause();
    } catch {
      /* ignore */
    }
    try {
      bgRef.current?.pause();
    } catch {
      /* ignore */
    }
    onEnded({
      videoRect: v.getBoundingClientRect(),
      videoW: v.videoWidth || 0,
      videoH: v.videoHeight || 0,
    });
  };

  useEffect(() => {
    const v = videoRef.current;
    const bg = bgRef.current;
    if (!v) return;

    // Scroll-controlled scrubbing. Wheel deltaY accumulates into a pending
    // time delta that we flush to the video's currentTime on rAF.
    const SECONDS_PER_PIXEL = 0.004;
    let pendingDelta = 0;
    let rafId = 0;
    let errorFallback = 0;

    const ensurePaused = () => {
      try { v.pause(); } catch { /* ignore */ }
      try { bg?.pause(); } catch { /* ignore */ }
    };

    const flush = () => {
      rafId = 0;
      if (!v.duration || Number.isNaN(v.duration)) return;
      const next = Math.min(
        v.duration,
        Math.max(0, v.currentTime + pendingDelta),
      );
      pendingDelta = 0;
      v.currentTime = next;
      if (bg) bg.currentTime = next;
      if (next >= v.duration - 0.05) fire();
    };

    const onWheel = (e: WheelEvent) => {
      if (firedRef.current) return;
      e.preventDefault();
      pendingDelta += e.deltaY * SECONDS_PER_PIXEL;
      if (!rafId) rafId = requestAnimationFrame(flush);
    };

    const onMeta = () => {
      ensurePaused();
    };
    const onError = () => {
      // Preserve fallback ONLY when media fails to load at all.
      window.clearTimeout(errorFallback);
      errorFallback = window.setTimeout(() => fire(), 500);
    };

    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("error", onError);
    window.addEventListener("wheel", onWheel, { passive: false });

    // Start paused on frame 0. Some browsers won't render a frame until
    // play() is called at least once; play then immediately pause.
    v.play().then(() => ensurePaused()).catch(() => ensurePaused());
    bg?.play().then(() => ensurePaused()).catch(() => ensurePaused());

    return () => {
      window.clearTimeout(errorFallback);
      if (rafId) cancelAnimationFrame(rafId);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onError);
      window.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#000",
      }}
    >
      <video
        ref={bgRef}
        src={videoAsset.url}
        muted
        playsInline
        preload="auto"
        aria-hidden
        tabIndex={-1}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.15)",
          filter: "blur(40px) saturate(1.1)",
          pointerEvents: "none",
        }}
      />
      <video
        ref={videoRef}
        src={videoAsset.url}
        muted
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export default IntroVideo;
