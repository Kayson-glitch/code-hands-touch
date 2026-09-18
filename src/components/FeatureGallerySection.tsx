import { useEffect, useState, type CSSProperties } from "react";

type Point = { label: string; text: string };

type Panel = {
  id: string;
  eyebrow: string;
  title: string;
  points: Point[];
  /** The module's colour, from the same set the nav menus mark sections with. */
  dot: string;
};

export const PANELS: Panel[] = [
  {
    id: "001",
    dot: "#8CE0FF",
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
    dot: "#FF9ED8",
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
    dot: "#9E8CFF",
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
    dot: "#D1E486",
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
    dot: "#EBA753",
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

/**
 * Ticker label colour: paper grey out at the edges of the strip, lifting to
 * the module's own hue as it slides into the centre. At lum 0 this is the
 * same grey the CSS ramp used before.
 */
function tickerColour(hex: string, lum: number) {
  const n = parseInt(hex.slice(1), 16);
  const to = (channel: number) => Math.round(255 + (channel - 255) * lum);
  const r = to(n >> 16);
  const g = to((n >> 8) & 255);
  const b = to(n & 255);
  return `rgba(${r}, ${g}, ${b}, ${(0.32 + 0.68 * lum).toFixed(3)})`;
}

/** Milliseconds per typed character. */
const CHAR_MS = 30;
/** Extra jitter per character so the rhythm feels human. */
const CHAR_JITTER_MS = 12;
/** Beats held after punctuation and between words. */
const PUNCT_MS = 90;
const SPACE_MS = 18;
/** Delay before a field starts typing once its panel is active. */
const BASE_DELAY = 140;

/**
 * Typewriter text: when `active` flips true the characters appear one by one.
 * The untyped tail is rendered with `visibility: hidden` so the layout never
 * shifts as the text grows.
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
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) {
      setCount(0);
      return;
    }
    // The chain has to schedule itself from the timer, not from inside the
    // state updater: the updater only runs when React gets round to the
    // render, so on this screen — a pinned canvas scrub with the wheel live —
    // every character was waiting on a commit and the real cadence came out
    // near twice the one set here.
    let timer = 0;
    let typed = 0;
    const step = () => {
      typed += 1;
      setCount(typed);
      if (typed >= text.length) return;
      // Pause a little longer after punctuation / spaces, like real typing.
      const ch = text[typed - 1] ?? "";
      const beat = /[.,—:;!?]/.test(ch) ? PUNCT_MS : ch === " " ? SPACE_MS : 0;
      timer = window.setTimeout(step, CHAR_MS + Math.random() * CHAR_JITTER_MS + beat);
    };
    timer = window.setTimeout(step, delay);
    return () => window.clearTimeout(timer);
  }, [active, text, delay]);

  const started = count > 0;
  const done = count >= text.length;
  return (
    <span className={className} style={style} aria-label={text}>
      <span aria-hidden>{text.slice(0, count)}</span>
      {started && !done && <span aria-hidden className="artemis-caret" />}
      {!done && (
        <span aria-hidden style={{ visibility: "hidden" }}>
          {text.slice(count)}
        </span>
      )}
    </span>
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
  tickerPos,
}: {
  activeIndex: number;
  pinned: boolean;
  /** Fractional module position so the label progress bar slides while scrolling. */
  tickerPos?: number;
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
            {(() => {
              // Simultaneous typing: every field starts at the same moment and
              // types at the same speed.
              const eyebrowDelay = BASE_DELAY;
              const titleDelay = BASE_DELAY;
              return (
                <>
                  <p className="artemis-gallery__eyebrow">
                    {/* The section square the nav menus use, in this module's colour. */}
                    <span
                      aria-hidden
                      className="artemis-gallery__mark"
                      style={{ background: panel.dot }}
                    />
                    [ <Typed text={panel.eyebrow} active={active} delay={eyebrowDelay} /> ]
                  </p>
                  <div className="artemis-gallery__row">
                    <div className="artemis-gallery__media" aria-hidden />
                    <div className="artemis-gallery__copy">
                      <h3 className="artemis-gallery__title">
                        <Typed text={panel.title} active={active} delay={titleDelay} />
                      </h3>
                      <ul className="artemis-gallery__list">
                        {panel.points.map((point) => {
                          const labelDelay = BASE_DELAY;
                          const bodyDelay = BASE_DELAY;
                          return (
                            <li key={point.label} className="artemis-gallery__item">
                              <p className="artemis-gallery__label">
                                <Typed text={point.label} active={active} delay={labelDelay} />
                              </p>
                              <p className="artemis-gallery__body">
                                <Typed text={point.text} active={active} delay={bodyDelay} />
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                  {/* Progress indicator: one label per module on a sliding
                      track; the current module sits centred and bright. */}
                  <div className="artemis-gallery__progress" aria-hidden>
                    {(() => {
                      // Cyclic track: clone 2 modules on each side so the strip
                      // is always full — no gap at the first/last module.
                      const CLONES = 2;
                      const n = PANELS.length;
                      const pos = tickerPos ?? index;
                      const items = Array.from({ length: n + CLONES * 2 }, (_, k) => {
                        const real = ((k - CLONES) % n + n) % n;
                        return { key: k, real, panel: PANELS[real] };
                      });
                      return (
                        <div
                          className="artemis-gallery__ticker is-live"
                          style={{ "--i": pos + CLONES } as CSSProperties}
                        >
                          {items.map(({ key, real, panel: p }) => {
                            // Shortest cyclic distance keeps brightness smooth
                            // across the wrap point.
                            const raw = Math.abs(pos - real);
                            const d = Math.min(raw, n - raw);
                            const lum = Math.max(0, 1 - d);
                            return (
                              <span
                                key={key}
                                className="artemis-gallery__ticker-item"
                                style={
                                  {
                                    "--lum": lum.toFixed(3),
                                    color: tickerColour(p.dot, lum),
                                  } as CSSProperties
                                }
                              >
                                [ {p.eyebrow} ]
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                </>
              );
            })()}
          </article>
        );
      })}
    </>
  );
}

export default FeaturePanels;
