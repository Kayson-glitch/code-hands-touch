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
    // Freeze on the last frame so it can act as the backdrop while the
    // liquid burst spreads over it.
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
    if (!v) return;
    let fallbackTimer = 0;
    const armFallback = () => {
      window.clearTimeout(fallbackTimer);
      // The video is ~4.04s. If the browser misses `ended`/`timeupdate`, or
      // media metadata stalls in preview, still trigger the transition rather
      // than leaving the intro on a blank frame forever.
      fallbackTimer = window.setTimeout(() => fire(), 4300);
    };
    const onTime = () => {
      if (!v.duration || Number.isNaN(v.duration)) return;
      if (v.currentTime >= v.duration - 0.05) fire();
    };
    const onEnd = () => fire();
    const onMeta = () => armFallback();
    const onError = () => armFallback();
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("error", onError);
    // Kick off playback (some browsers need an explicit call after mount).
    v.play().catch(() => {
      armFallback();
    });
    bgRef.current?.play().catch(() => {});
    armFallback();
    return () => {
      window.clearTimeout(fallbackTimer);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onError);
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
        autoPlay
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
        autoPlay
        muted
        playsInline
        preload="auto"
        onClick={() => {
          videoRef.current?.play().catch(() => {});
          bgRef.current?.play().catch(() => {});
        }}
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
