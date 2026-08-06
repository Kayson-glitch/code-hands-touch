import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { getLenis } from "@/lib/smoothScroll";

import f01 from "@/assets/feature-01.jpg";
import f02 from "@/assets/feature-02.jpg";
import f03 from "@/assets/feature-03.jpg";
import f04 from "@/assets/feature-04.jpg";
import f05 from "@/assets/feature-05.jpg";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

type Panel = {
  id: string;
  image: string;
  name: string;
  body: ReactNode;
};

const PANELS: Panel[] = [
  {
    id: "001",
    image: f01,
    name: "INSTANT ANSWERS",
    body: (
      <>
        Sub-second first response, <span>24/7</span>, with no queue and no night shift.
      </>
    ),
  },
  {
    id: "002",
    image: f02,
    name: "BRAND VOICE",
    body: (
      <>
        Learns your knowledge base and tone, so every reply sounds like <span>your best rep</span>.
      </>
    ),
  },
  {
    id: "003",
    image: f03,
    name: "SMART ROUTING",
    body: (
      <>
        Detects intent and risk, then hands complex tickets to a human <span>instantly</span>.
      </>
    ),
  },
  {
    id: "004",
    image: f04,
    name: "OMNICHANNEL",
    body: (
      <>
        Web, app, email and social share <span>one conversation context</span> across every touchpoint.
      </>
    ),
  },
  {
    id: "005",
    image: f05,
    name: "INSIGHT LOOP",
    body: (
      <>
        Clusters recurring questions automatically and feeds them back into <span>product and scripts</span>.
      </>
    ),
  },
];

export function FeatureGallerySection() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [travel, setTravel] = useState(0);
  const [desktop, setDesktop] = useState(true);
  const [reduced, setReduced] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const isDesktop = window.innerWidth >= 991;
      setDesktop(isDesktop);
      const track = trackRef.current;
      if (!isDesktop || !track) return;
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

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!desktop || reduced) {
      setProgress(0);
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
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    // Same driver as the third screen: read on Lenis' tick so the horizontal
    // travel never trails the smoothed scroll position by a frame.
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
  }, [desktop, reduced]);

  const pinned = desktop && !reduced;
  const p = clamp(progress);
  const x = pinned ? travel * p : 0;

  return (
    <section
      className="artemis-gallery"
      data-dark-section=""
      aria-label="What Artemis does for customer support"
    >
      <div
        aria-hidden
        className="artemis-gallery__dots"
      />
      <div
        ref={wrapperRef}
        className="artemis-gallery__wrapper"
        style={pinned ? { height: `${PANELS.length * 100}vh` } : undefined}
      >
        <div className="artemis-gallery__sticky">
          <div
            ref={trackRef}
            className="artemis-gallery__track"
            style={pinned ? { transform: `translate3d(${-x}px, 0, 0)` } : undefined}
          >
            <div className="artemis-gallery__intro">
              <p className="artemis-gallery__kicker">// INTO THE CONVERSATION</p>
              <h2 className="artemis-gallery__title">
                EXPLORE
                <br />
                AI SUPPORT
              </h2>
            </div>

            {PANELS.map((panel, index) => {
              const columnProgress = pinned
                ? clamp(p * PANELS.length - index * 0.85)
                : 1;
              const eased = easeOutCubic(columnProgress);
              const opacity = pinned ? easeOutCubic(clamp(columnProgress * 3)) : 1;
              const lift = pinned ? (1 - eased) * 40 : 0;
              return (
                <article
                  key={panel.id}
                  className="artemis-gallery__panel"
                  style={
                    pinned
                      ? { opacity, transform: `translate3d(0, ${lift}px, 0)` }
                      : undefined
                  }
                >
                  <div className="artemis-gallery__figure">
                    <p className="artemis-gallery__index">[{panel.id}]</p>
                    <div className="artemis-gallery__frame">
                      <img
                        src={panel.image}
                        alt=""
                        loading="lazy"
                        width={768}
                        height={1024}
                      />
                    </div>
                  </div>
                  <div className="artemis-gallery__copy">
                    <p className="artemis-gallery__label">[COLLECTION NAME] {"{"}</p>
                    <p className="artemis-gallery__name">/&nbsp;&nbsp;{panel.name}</p>
                    <p className="artemis-gallery__label">[DESCRIPTION] {"{"}</p>
                    <p className="artemis-gallery__body">{panel.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureGallerySection;
