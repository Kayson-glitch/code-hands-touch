import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AsciiHandsFooter } from "@/components/AsciiHandsFooter";
import { SiteNav } from "@/components/SiteNav";
import { HeroCopy } from "@/components/HeroCopy";
import { FinChatDock } from "@/components/FinChatDock";
import { IntroPreloader } from "@/components/IntroPreloader";
import videoAsset from "@/assets/intro-hands.mp4.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Good/Fella — ASCII Creation of Adam" },
      {
        name: "description",
        content:
          "An interactive ASCII homage to Michelangelo's Creation of Adam — two hands sculpted from code, responding to your cursor.",
      },
      { property: "og:title", content: "Good/Fella — ASCII Creation of Adam" },
      {
        property: "og:description",
        content:
          "An interactive ASCII homage to Michelangelo's Creation of Adam — two hands sculpted from code, responding to your cursor.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("debug") === "1" || p.get("burn") === "1") setDebug(true);
  }, []);

  const handleReady = useCallback((url: string) => {
    setVideoSrc(url);
    // next frame → fade in
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, []);
  const handleFail = useCallback(() => {
    setVideoSrc(videoAsset.url);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, []);

  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith("blob:")) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  return (
    <div className="relative min-h-screen">
      {videoSrc === null && (
        <IntroPreloader src={videoAsset.url} onReady={handleReady} onFail={handleFail} />
      )}
      {videoSrc !== null && (
        <div
          style={{
            opacity: shown ? 1 : 0,
            transition: "opacity 350ms ease-out",
          }}
        >
          <AsciiHandsFooter videoSrc={videoSrc} debug={debug} />
          <SiteNav />
          <HeroCopy />
          <FinChatDock />
        </div>
      )}
    </div>
  );
}
