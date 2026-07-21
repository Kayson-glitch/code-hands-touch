import { useEffect, useRef } from "react";
import videoAsset from "@/assets/intro-hands.mp4.asset.json";

/**
 * Full-screen intro video. Calls `onEnded` exactly once when playback
 * reaches the last frame, so the caller can trigger the burst transition.
 */
export function IntroVideo({ onEnded }: { onEnded: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const firedRef = useRef(false);

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onEnded();
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (!v.duration || Number.isNaN(v.duration)) return;
      if (v.currentTime >= v.duration - 0.05) fire();
    };
    const onEnd = () => fire();
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    // Kick off playback (some browsers need an explicit call after mount).
    v.play().catch(() => {
      /* autoplay blocked — user click on the video will start it */
    });
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <video
      ref={videoRef}
      src={videoAsset.url}
      autoPlay
      muted
      playsInline
      preload="auto"
      onClick={() => videoRef.current?.play().catch(() => {})}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain",
        background: "#EFE7DA",
      }}
    />
  );
}

export default IntroVideo;
