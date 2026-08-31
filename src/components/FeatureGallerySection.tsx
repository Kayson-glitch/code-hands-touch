import type { CSSProperties } from "react";
import TextRoll from "@/components/ui/text-roll";


type Point = { label: string; text: string };

type Panel = {
  id: string;
  eyebrow: string;
  title: string;
  points: Point[];
};

export const PANELS: Panel[] = [
  {
    id: "001",
    eyebrow: "Rapid Response",
    title: "Resolve 93% of Customer Issues Instantly",
    points: [
      { label: "Rapid Response", text: "Answers in under 3 seconds—always fast, always ready." },
      {
        label: "Smart Assistance",
        text: "Guides new agents with AI-suggested answers that stay on brand.",
      },
      {
        label: "Complex Workflow Handling",
        text: "Handles complex workflows—not just questions—end to end.",
      },
      { label: "Seamless Human Handoff", text: "Instant context summaries for smooth agent takeover." },
    ],
  },
  {
    id: "002",
    eyebrow: "Brand Voice",
    title: "Speak in Your Brand Voice, Every Time",
    points: [
      { label: "Tone Control", text: "Tuned to your style guide, from playful to strictly formal." },
      { label: "Grounded Answers", text: "Replies cite your help center, docs and policy pages." },
      { label: "Multilingual by Default", text: "Answers in 30+ languages without separate content sets." },
      { label: "Guardrails", text: "Blocks off-topic promises, refunds and claims you never approved." },
    ],
  },
  {
    id: "003",
    eyebrow: "Smart Routing",
    title: "Route Every Conversation to the Right Place",
    points: [
      { label: "Intent Detection", text: "Reads urgency, sentiment and account value in real time." },
      { label: "Priority Queues", text: "VIP and at-risk customers reach a human before they churn." },
      { label: "Skill Matching", text: "Billing, shipping or technical—each ticket finds its expert." },
      { label: "Zero Repetition", text: "Full history travels with the customer, no retelling required." },
    ],
  },
  {
    id: "004",
    eyebrow: "Omnichannel",
    title: "One Conversation Across Every Channel",
    points: [
      { label: "Unified Inbox", text: "Web chat, email, app and social threads live in one timeline." },
      { label: "Shared Context", text: "Start on mobile, finish on desktop—nothing gets lost." },
      { label: "Proactive Nudges", text: "Reaches out on order delays before the customer asks." },
      { label: "Native Integrations", text: "Connects to your CRM, order system and ticketing in minutes." },
    ],
  },
  {
    id: "005",
    eyebrow: "Support Insight",
    title: "Turn Support Data Into Product Insight",
    points: [
      { label: "Auto Clustering", text: "Groups recurring questions into themes you can act on." },
      { label: "Deflection Analytics", text: "Shows exactly which answers save the most agent hours." },
      { label: "Quality Scoring", text: "Reviews every conversation, not a 2% random sample." },
      { label: "Continuous Learning", text: "Feeds gaps straight back into your knowledge base." },
    ],
  },
];

/** Seconds of stagger per letter. */
const LETTER_STEP = 0.018;
/** Delay before a field starts rolling once its panel is active. */
const BASE_DELAY = 0.12;

/**
 * Roll-in text: when `active` flips true each letter flips up into place.
 * While inactive the text stays in the layout but invisible, so nothing shifts.
 */
function Typed({
  text,
  active,
  delay = 0,
  className,
  style,
}: {
  text: string;
  active: boolean;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  if (!active) {
    return (
      <span className={className} style={{ ...style, visibility: "hidden" }} aria-label={text}>
        {text}
      </span>
    );
  }
  return (
    <TextRoll
      key={text}
      className={className}
      duration={0.5}
      getEnterDelay={(i) => delay + i * LETTER_STEP}
      getExitDelay={(i) => delay + i * LETTER_STEP + 0.2}
      transition={{ ease: "easeIn" }}
    >
      {text}
    </TextRoll>
  );
}


/**
 * Feature panels for the closing screen's horizontal track.
 * The track snaps between discrete states, so the reveal is time-based: when a
 * panel becomes the active state its content animates in with a stagger (CSS
 * keyframes) and each field types itself out, independent of wheel position.
 */
export function FeaturePanels({
  activeIndex,
  pinned,
}: {
  activeIndex: number;
  pinned: boolean;
}) {
  return (
    <>
      {PANELS.map((panel, index) => {
        const active = !pinned || index === activeIndex;
        return (
          <article
            key={panel.id}
            className={`artemis-gallery__panel${active ? " is-active" : ""}`}
          >
            <p className="artemis-gallery__eyebrow">
              [ <Typed text={panel.eyebrow} active={active} delay={BASE_DELAY} /> ]
            </p>
            <div className="artemis-gallery__row">
              <div className="artemis-gallery__media" aria-hidden />
              <div className="artemis-gallery__copy">
                <h3 className="artemis-gallery__title">
                  <Typed text={panel.title} active={active} delay={BASE_DELAY + 0.15} />
                </h3>
                <ul className="artemis-gallery__list">
                  {panel.points.map((point, pointIndex) => {
                    const pointDelay = BASE_DELAY + 0.35 + pointIndex * 0.18;
                    return (
                      <li key={point.label} className="artemis-gallery__item">
                        <p className="artemis-gallery__label">
                          <Typed text={point.label} active={active} delay={pointDelay} />
                        </p>
                        <p className="artemis-gallery__body">
                          <Typed text={point.text} active={active} delay={pointDelay + 0.12} />
                        </p>

                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </article>
        );
      })}
    </>
  );
}

export default FeaturePanels;
