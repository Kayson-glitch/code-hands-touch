import { useEffect, useRef } from "react";
import videoAsset from "@/assets/intro-hands.mp4.asset.json";

export type IntroVideoEndInfo = {
  videoRect: DOMRect;
  videoW: number;
  videoH: number;
};

export type IntroProgressInfo = {
  /** Total scroll progress across intro (video + burst), 0..1. */
  progress: number;
  /** Video-only sub-progress, 0..1 (clamped to progress / VIDEO_FRACTION). */
  videoProgress: number;
  /** Burst sub-progress, 0..1 (kicks in after VIDEO_FRACTION). */
  burstProgress: number;
  /** Screen-space center of the two fingertips (px). */
  centerX: number;
  centerY: number;
};

/** How much of the total scroll journey is the video vs. the burst. */
const VIDEO_FRACTION = 0.6;
/** Pixels of wheel travel to cover 0→1 of total progress. */
const PIXELS_FOR_FULL_PROGRESS = 2600;

/**
 * Full-screen intro video. Scroll-scrubbed. Emits `onProgress` every frame
 * (video scrub + parallax + burst origin), and `onEnded` exactly once when
 * total scroll progress reaches 1.
 */
export function IntroVideo({
  onEnded,
  onProgress,
}: {
  onEnded: (info: IntroVideoEndInfo) => void;
  onProgress?: (info: IntroProgressInfo) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const firedRef = useRef(false);
  const onProgressRef = useRef(onProgress);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);

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

    // Scroll drives a single `progress` scalar in [0, 1] covering both
    // video scrub and the post-video burst. Wheel deltaY accumulates.
    let progress = 0;
    let rafId = 0;
    let errorFallback = 0;

    const ensurePaused = () => {
      try { v.pause(); } catch { /* ignore */ }
      try { bg?.pause(); } catch { /* ignore */ }
    };

    const emit = () => {
      const videoProgress = Math.min(1, progress / VIDEO_FRACTION);
      const burstProgress = Math.min(
        1,
        Math.max(0, (progress - VIDEO_FRACTION) / (1 - VIDEO_FRACTION)),
      );
      // Parallax: subtle zoom around the finger center, scaling with videoProgress.
      const scale = 1 + videoProgress * 0.05;
      v.style.transformOrigin = "50% 50%";
      v.style.transform = `scale(${scale.toFixed(4)})`;
      // Finger center in viewport px: the video is contain-fit so its
      // getBoundingClientRect() is the letterboxed frame; fingers meet at
      // ~center of the frame.
      const rect = v.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.5;
      onProgressRef.current?.({
        progress,
        videoProgress,
        burstProgress,
        centerX,
        centerY,
      });
    };

    const flush = () => {
      rafId = 0;
      const videoProgress = Math.min(1, progress / VIDEO_FRACTION);
      if (v.duration && !Number.isNaN(v.duration)) {
        const t = videoProgress * v.duration;
        try { v.currentTime = t; } catch { /* ignore */ }
        if (bg) { try { bg.currentTime = t; } catch { /* ignore */ } }
      }
      emit();
      if (progress >= 1) fire();
    };

    const onWheel = (e: WheelEvent) => {
      if (firedRef.current) return;
      e.preventDefault();
      progress = Math.min(
        1,
        Math.max(0, progress + e.deltaY / PIXELS_FOR_FULL_PROGRESS),
      );
      if (!rafId) rafId = requestAnimationFrame(flush);
    };

    const onMeta = () => {
      ensurePaused();
      emit();
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
    emit();

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
