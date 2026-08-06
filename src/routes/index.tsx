import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { HalftoneHandsFooter } from "@/components/HalftoneHandsFooter";
import { SiteNav } from "@/components/SiteNav";
import { HeroCopy } from "@/components/HeroCopy";
import { FinChatDock } from "@/components/FinChatDock";
import { ScrollHint } from "@/components/ScrollHint";

import { IntroPreloader } from "@/components/IntroPreloader";
import { INTRO_ENABLED } from "@/components/intro/introConfig";

import { SloganSection } from "@/components/SloganSection";
import { MetricsSection } from "@/components/MetricsSection";

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
  const [videoSrc, setVideoSrc] = useState<string | null>(INTRO_ENABLED ? null : "");
  const [handoffVideo, setHandoffVideo] = useState<HTMLVideoElement | null>(null);
  const [shown, setShown] = useState(!INTRO_ENABLED);

  const [debug, setDebug] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrollY(window.scrollY || window.pageYOffset || 0);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("debug") === "1" || p.get("burn") === "1") setDebug(true);
  }, []);

  const handleReady = useCallback((url: string, v: HTMLVideoElement | null) => {
    setHandoffVideo(v);
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
      {INTRO_ENABLED && videoSrc === null && (
        <IntroPreloader src={videoAsset.url} onReady={handleReady} onFail={handleFail} />
      )}

      {videoSrc !== null && (
        <div
          style={{
            opacity: shown ? 1 : 0,
            transition: "opacity 350ms ease-out",
          }}
        >
          {/* Fixed first screen with parallax */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1,
              transform: `translate3d(0, ${-scrollY * 0.35}px, 0)`,
              willChange: "transform",
            }}
          >
            <HalftoneHandsFooter videoSrc={videoSrc} debug={debug} handoffVideo={handoffVideo} />
            <HeroCopy />
          </div>
          <ScrollHint />
          <SiteNav />

          {/* Spacer so the page can scroll to reveal the second screen */}
          <div aria-hidden style={{ height: "100dvh" }} />
          <SloganSection />
          {/* Third screen: pinned metrics block */}
          <MetricsSection />

          {/* Always pinned to bottom, unaffected by parallax */}
          <FinChatDock />
        </div>
      )}
    </div>
  );
}
