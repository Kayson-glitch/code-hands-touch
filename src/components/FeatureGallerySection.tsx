import type { ReactNode } from "react";

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

export const PANELS: Panel[] = [
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

/**
 * Feature panels for the closing screen's horizontal track.
 * Reveal is geometric, not index-based: each panel fades and lifts in as its
 * own left edge crosses into the viewport, so it always matches the travel.
 */
export function FeaturePanels({
  offsets,
  x,
  viewportW,
  pinned,
}: {
  offsets: number[];
  x: number;
  viewportW: number;
  pinned: boolean;
}) {
  return (
    <>
      {PANELS.map((panel, index) => {
        const left = (offsets[index] ?? 0) - x;
        const enter = pinned && viewportW > 0 ? clamp((viewportW - left) / (viewportW * 0.35)) : 1;
        const eased = easeOutCubic(enter);
        return (
          <article
            key={panel.id}
            className="artemis-gallery__panel"
            style={
              pinned
                ? { opacity: eased, transform: `translate3d(0, ${(1 - eased) * 40}px, 0)` }
                : undefined
            }
          >
            <div className="artemis-gallery__figure">
              <p className="artemis-gallery__index">[{panel.id}]</p>
              <div className="artemis-gallery__frame">
                <img src={panel.image} alt="" loading="lazy" width={768} height={1024} />
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
    </>
  );
}

export default FeaturePanels;
