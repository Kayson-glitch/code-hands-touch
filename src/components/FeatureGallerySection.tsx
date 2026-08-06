const clamp = (v: number) => Math.max(0, Math.min(1, v));
const easeOutQuint = (x: number) => 1 - Math.pow(1 - x, 5);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

type Point = { label: string; text: string };

type Panel = {
  id: string;
  title: string;
  points: Point[];
};

export const PANELS: Panel[] = [
  {
    id: "001",
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
    title: "Turn Support Data Into Product Insight",
    points: [
      { label: "Auto Clustering", text: "Groups recurring questions into themes you can act on." },
      { label: "Deflection Analytics", text: "Shows exactly which answers save the most agent hours." },
      { label: "Quality Scoring", text: "Reviews every conversation, not a 2% random sample." },
      { label: "Continuous Learning", text: "Feeds gaps straight back into your knowledge base." },
    ],
  },
];

/**
 * Feature panels for the closing screen's horizontal track.
 * Reveal is geometric, not index-based: each panel fades and lifts in as its
 * own left edge crosses into the viewport, so it always matches the travel.
 */
const fieldReveal = (
  enter: number,
  start: number,
  end: number,
  distance = 16,
  blur = 8
) => {
  const a = smoothstep(start, end, enter);
  return {
    opacity: a,
    filter: `blur(${(1 - a) * blur}px)`,
    transform: `translateY(${(1 - a) * distance}px)`,
  };
};

export function FeaturePanels({
  lefts,
  viewportW,
  viewportH,
  pinned,
}: {
  lefts: number[];
  viewportW: number;
  viewportH: number;
  pinned: boolean;
}) {
  return (
    <>
      {PANELS.map((panel, index) => {
        const left = lefts[index];
        const enter =
          pinned && viewportW > 0 && left !== undefined
            ? clamp((viewportW - left) / (viewportW * 0.6))
            : 1;
        const eased = easeOutQuint(enter);
        const lift = pinned && viewportH > 0 ? (1 - eased) * viewportH : 0;
        // Delay the text reveal so the panel shell is already in view first.
        const textEnter = clamp((enter - 0.45) / 0.55);
        return (
          <article
            key={panel.id}
            className="artemis-gallery__panel"
            style={
              pinned
                ? { opacity: clamp(eased), transform: `translate3d(0, ${lift.toFixed(2)}px, 0)` }
                : undefined
            }
          >
            <div className="artemis-gallery__media" aria-hidden />
            <div className="artemis-gallery__copy">
              <h3
                className="artemis-gallery__title"
                style={pinned ? fieldReveal(textEnter, 0.0, 0.35, 18, 10) : undefined}
              >
                {panel.title}
              </h3>
              <ul className="artemis-gallery__list">
                {panel.points.map((point, pi) => {
                  const rowStart = 0.12 + pi * 0.16;
                  const rowEnd = rowStart + 0.35;
                  return (
                    <li
                      key={point.label}
                      className="artemis-gallery__item"
                      style={pinned ? fieldReveal(textEnter, rowStart, rowEnd, 14, 6) : undefined}
                    >
                      <p className="artemis-gallery__label">{point.label}</p>
                      <p className="artemis-gallery__body">{point.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </article>
        );
      })}
    </>
  );
}

export default FeaturePanels;
