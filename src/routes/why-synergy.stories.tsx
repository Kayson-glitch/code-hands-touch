import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquareCode,
  Map as MapIcon,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { HalftoneHandStill } from "@/components/HalftoneHandStill";
import { Reveal } from "@/components/Reveal";
import { RollingNumber } from "@/components/RollingNumber";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";

import { getLenis } from "@/lib/smoothScroll";
import { DotArrow } from "@/components/DotArrow";

/** Nav (60) + breathing room, so a targeted module never hugs the header. */
const ANCHOR_OFFSET = 60 + 40;

export const Route = createFileRoute("/why-synergy/stories")({
  head: () => ({
    meta: [
      { title: "Stories from the Front Lines — Synergy.AI" },
      {
        name: "description",
        content:
          "Three real-world breakthroughs: multilingual accuracy in low-resource languages, payment risk control, and a weekly iteration flywheel.",
      },
      { property: "og:title", content: "Stories from the Front Lines — Synergy.AI" },
      {
        property: "og:description",
        content:
          "Three real-world breakthroughs: multilingual accuracy in low-resource languages, payment risk control, and a weekly iteration flywheel.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoriesPage,
});

/* --------------------------------------------------------------- helpers */

/** 1440px design width → fluid value. */
const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

const GRADIENT =
  "linear-gradient(90deg, #137DFF 0%, #FF18AA 33.333%, #FFCD17 66.666%, #137DFF 100%)";
const LIME = "#D1E486";

function RainbowButton({ label }: { label: string }) {
  const face = "#0E0B22";
  const faceRgb = "14,11,34";
  return (
    <button
      className="group relative inline-flex shrink-0 cursor-pointer items-center justify-center font-normal transition-all"
      style={{
        height: 36,
        fontSize: 14,
        lineHeight: "20px",
        fontWeight: 400,
        padding: "0 20px",
        borderRadius: 0,
        borderBottom: "1.5px solid transparent",
        color: "#FFFFFF",
        backgroundImage: [
          `linear-gradient(${face},${face})`,
          `linear-gradient(${face} 50%, rgba(${faceRgb},0.6) 80%, rgba(${faceRgb},0))`,
          GRADIENT,
        ].join(","),
        backgroundClip: "padding-box, border-box, border-box",
        backgroundColor: face,
        backgroundOrigin: "border-box",
        backgroundSize: "200%",
        animation: "rainbow-btn-flow var(--rainbow-speed, 9s) infinite linear",
      }}
    >
      <span className="relative z-10 inline-flex items-center gap-0">
        {label}
        <span className="inline-flex items-center ml-1.5">
          <DotArrow size={16} className="flex-shrink-0" />
        </span>
      </span>
    </button>
  );
}

/** Small dark CTA inside the article header (Figma 1569:103625). */
function InlineDemoButton({ dark = false }: { dark?: boolean }) {
  return (
    <button
      className="shrink-0 cursor-pointer transition-opacity hover:opacity-90"
      style={{
        background: dark ? "rgba(255,255,255,0.12)" : "#0E0B22",
        borderBottom: "1.5px solid #137DFF",
        borderRadius: 0,
        height: 36,
        padding: "0 24px",
        fontSize: 12,
        lineHeight: "20px",
        fontWeight: 500,
        color: "#FFFFFF",
      }}
    >
      Book a Demo
    </button>
  );
}

/** Alternating lime diamond / ink square bullet (Figma 1569:103648 / 103653). */
function Bullet({ diamond, dark = false }: { diamond: boolean; dark?: boolean }) {
  return (
    <span
      aria-hidden
      className="mt-[8px] inline-block shrink-0"
      style={{
        width: 6,
        height: 6,
        background: diamond ? LIME : dark ? "rgba(255,255,255,0.55)" : "#2A2836",
        transform: diamond ? "rotate(45deg)" : undefined,
      }}
    />
  );
}

function Hairline({ dark = false }: { dark?: boolean }) {
  return (
    <div aria-hidden style={{ height: 1, background: dark ? "rgba(255,255,255,0.18)" : "#E1E0E4" }} />
  );
}

/* ------------------------------------------------------------------ data */

type Block = { icon: typeof MapIcon; title: string; body: string; divider: boolean };

type Story = {
  id: string;
  index: string;
  tab: string;
  eyebrow: string;
  titleAccent: string;
  titleRest: string;
  intro: string[];
  stats: [string, string];
  caption: string;
  bullets: string[];
  light: Block[];
  dark: Block[];
  tail: Block;
};

const STORIES: Story[] = [
  {
    id: "multilingual",
    index: "01",
    tab: "Multilingual",
    eyebrow: "multilingual",
    titleAccent: "Targeted Translation for ",
    titleRest: "Low-Resource Language Semantic Drift",
    intro: [
      "BCGame supports 22 languages and performs reliably across major ones. However, systematic semantic drift in low-resource languages was undermining service usability in the Indian market.",
      "We identified the root causes, developed a targeted translation model, and validated its impact.",
    ],
    stats: ["65%", "85%"],
    caption: "India-focused translation accuracy gains over general-purpose APIs.",
    bullets: [
      "Trained a targeted translation model for the Indian region, bypassing English deviations",
      "Multi-model voting generated final results, mastering payment/order scenarios",
      'Minority language users were "understood" for the very first time',
    ],
    light: [
      {
        icon: MessageSquareCode,
        title: "Where General-Purpose Translation Breaks Down",
        body: "Generic translation APIs route low-resource languages through English as a pivot. Each hop drops honorifics, transliterated brand terms, and the numeric formats used in payment requests, so a withdrawal question arrives at the model as a vague balance query. In Hindi, Marathi, and Telugu threads this drift showed up as confidently wrong answers rather than clear failures, which made it invisible in standard quality sampling and visible in customer complaints.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Building a Region-Specific Translation Path",
        body: "We assembled a domain corpus from real support transcripts — payment, order, verification, and promotion intents — then fine-tuned a translation model directly between the source language and the service ontology, with no English pivot. Three candidate models translate each incoming message and a voting layer selects the reading that is consistent with the account state, so a single mistranslation can no longer decide the reply.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: MessageSquareCode,
        title: "Measured Impact",
        body: "On a held-out set of production conversations, intent accuracy in the targeted languages improved by 65% over the general-purpose baseline, and end-to-end resolution for payment and order scenarios reached 85%. Escalations caused by misunderstanding, rather than by policy limits, dropped to a small remainder that is now reviewed weekly.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Conclusion and Clarifications",
        body: "These figures come from the current observation cycle in the Indian market and are not extrapolated to every supported language. The same method is portable, but each region needs its own corpus and its own validation pass before we quote a number. Capability was proven first; rollout to further languages remains a scheduling decision.",
        divider: false,
      },
    ],
    tail: {
      icon: MapIcon,
      title: "What Changed for Users",
      body: "Minority-language users stopped rephrasing themselves in English to be understood. Because the model reads the original message directly, tone and urgency survive the translation, and the reply comes back in the language the customer actually wrote in.",
      divider: false,
    },
  },
  {
    id: "payment-risk",
    index: "02",
    tab: "Payment Risk Control",
    eyebrow: "payment risk control",
    titleAccent: "Catching Payment Abuse ",
    titleRest: "Before It Reaches the Ledger",
    intro: [
      "Payment disputes are the smallest share of inbound volume and the largest share of loss. The system had to separate genuine failures from coordinated abuse without slowing down legitimate customers.",
      "We describe the signals used, the review path, and the limits we deliberately kept in place.",
    ],
    stats: ["92%", "40%"],
    caption: "Suspicious-pattern recall, with a sharp reduction in manual review load.",
    bullets: [
      "Behavioural signals combined with account history instead of single-rule triggers",
      "Every automated hold carries a human-readable reason and a reversible action",
      "Legitimate customers keep a one-touch path to resolution",
    ],
    light: [
      {
        icon: MessageSquareCode,
        title: "Reading Intent Across a Session, Not a Message",
        body: "Abuse rarely announces itself in a single sentence. The system scores the whole session: deposit and withdrawal cadence, device and location continuity, how the request is phrased after a refusal, and whether the same wording has appeared across unrelated accounts in the same window. A first-time customer with a genuinely stuck deposit and a coordinated ring both open with the same question; only the surrounding pattern separates them.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Holds That Explain Themselves",
        body: "When the score crosses the review threshold, the system does not silently refuse. It places a reversible hold, states the reason in plain language, and routes the case to a risk agent with the evidence already summarised. Agents keep full authority to release, and every release feeds back into the scoring set, so the boundary moves with real decisions instead of static thresholds.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: MessageSquareCode,
        title: "Measured Impact",
        body: "Against labelled historical cases, the system recalls 92% of suspicious patterns while manual review volume fell by roughly 40%, because clean cases are closed automatically instead of queued. False holds are tracked as a first-class metric and reviewed alongside recall, so tightening one side cannot quietly degrade the other.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Deliberate Limits",
        body: "The system never moves funds, closes an account, or issues a final refusal on its own. Anything that changes account state stays with a human, and the AI's role ends at evidence and recommendation. This ceiling is a design choice, not a capability gap, and it is what makes the automation acceptable in a regulated payment flow.",
        divider: false,
      },
    ],
    tail: {
      icon: MapIcon,
      title: "What Changed for Agents",
      body: "Risk agents stopped triaging and started deciding. Cases arrive with the timeline, the matching patterns, and the recommended action attached, which is why median handling time on disputes fell even as the volume reaching humans became harder on average.",
      divider: false,
    },
  },
  {
    id: "iteration",
    index: "03",
    tab: "Iteration Flywheel",
    eyebrow: "iteration flywheel",
    titleAccent: "A Weekly Flywheel ",
    titleRest: "That Turns Failures Into Coverage",
    intro: [
      "A support system is never finished. What matters is how quickly an unanswered question becomes a reliable, tested answer without destabilising everything already working.",
      "This is the loop we run every week, and the guardrails that keep it safe.",
    ],
    stats: ["7", "3x"],
    caption: "Days from an observed gap to a validated, deployed improvement.",
    bullets: [
      "Unresolved conversations are clustered into themes, not logged as one-off tickets",
      "Every change ships behind a regression suite built from real transcripts",
      "Coverage grows weekly while resolved intents stay frozen",
    ],
    light: [
      {
        icon: MessageSquareCode,
        title: "Turning Escalations Into a Backlog",
        body: "Every escalated or abandoned session is embedded and clustered, so the output of a week is not a list of complaints but a ranked set of themes with volume attached. A theme that appears twice is documentation; a theme that appears two hundred times is a workflow. That distinction decides what gets built, and it removes the loudest-voice bias from prioritisation.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Shipping Without Regression",
        body: "Each improvement is validated against a suite assembled from real historical conversations covering the intents that already work. A change that raises coverage on a new theme but degrades an existing one does not ship. Because the suite grows with every cycle, the cost of a careless change rises over time, which is exactly the incentive we want.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: MessageSquareCode,
        title: "Measured Impact",
        body: "The median gap-to-deployment cycle is seven days, and the rate of newly covered intents per month is roughly three times what a quarterly release train produced. Coverage compounds because each cycle inherits the previous suite rather than re-testing from scratch.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Conclusion and Clarifications",
        body: "This cadence depends on production traffic and on access to labelled outcomes; a pilot without volume cannot sustain it. The loop is also bounded by the same authority ceiling as the rest of the system: it expands what the AI can answer, never what it is allowed to decide.",
        divider: false,
      },
    ],
    tail: {
      icon: MapIcon,
      title: "What Changed for the Roadmap",
      body: "Product decisions stopped starting from opinion. The clustered backlog is the same artefact support, product, and risk look at, so the argument moves from whether a problem is real to which of several real problems is worth a week.",
      divider: false,
    },
  },
];

/* ------------------------------------------------------------- fragments */

function ArticleBlock({
  icon: Icon,
  title,
  body,
  divider,
  dark,
  delay = 0,
}: Block & { dark?: boolean; delay?: number }) {
  return (
    <Reveal delay={delay} y={20} duration={1600}>
      <Icon size={24} strokeWidth={1.5} color={dark ? "#FFFFFF" : "#0E0B22"} />
      <h3
        style={{
          margin: "10px 0 0",
          fontSize: 18,
          lineHeight: "26px",
          fontWeight: 500,
          color: dark ? "#FFFFFF" : "var(--ink, #0E0B22)",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: "20px 0 0",
          fontSize: 14,
          lineHeight: "22px",
          color: dark ? "rgba(255,255,255,0.5)" : "var(--ink-muted, #7A7885)",
        }}
      >
        {body}
      </p>
      {divider ? (
        <div style={{ marginTop: fluid(60, 36) }}>
          <Hairline dark={dark} />
        </div>
      ) : null}
    </Reveal>
  );
}

/** Stats card — Figma 1569:103640 (880×440, #FAFAFA). */
function StatsCard({ story, dark = false }: { story: Story; dark?: boolean }) {
  return (
    <Reveal y={32} duration={1600} style={{ background: dark ? "#0E0B22" : "#FAFAFA" }}>
      <div style={{ padding: `${fluid(40, 28)} ${fluid(68, 24)}` }}>
        <div className="flex items-center" style={{ gap: fluid(74, 24) }}>
          <StatValue value={story.stats[0]} dark={dark} />
          <span aria-hidden style={{ width: 56, height: 56, background: dark ? "rgba(255,255,255,0.18)" : "#E1E0E4" }} />
          <StatValue value={story.stats[1]} dark={dark} />
        </div>

        <p
          style={{
            margin: `${fluid(20, 14)} 0 0`,
            fontSize: 14,
            lineHeight: "24px",
            color: dark ? "rgba(255,255,255,0.5)" : "var(--ink-faint, #A1A0A9)",
          }}
        >
          {story.caption}
        </p>

        <div style={{ margin: `${fluid(40, 24)} 0 ${fluid(40, 24)}`, maxWidth: 680 }}>
          <Hairline dark={dark} />
        </div>

        <ul className="flex flex-col" style={{ gap: 24 }}>
          {story.bullets.map((b, i) => (
            <li key={b} className="flex items-start gap-2">
              <Bullet diamond={i % 2 === 0} dark={dark} />
              <span style={{ fontSize: 14, lineHeight: "22px", color: dark ? "rgba(255,255,255,0.75)" : "var(--ink, #0E0B22)" }}>
                {b}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

/** 100px Clash Display digits with a 60px regular unit (Figma 1569:103641). */
function StatValue({ value, dark = false }: { value: string; dark?: boolean }) {
  const match = /^([\d.]+)(.*)$/.exec(value);
  const digits = match ? match[1] : value;
  const unit = match ? match[2] : "";
  return (
    <p
      className="font-display whitespace-nowrap capitalize"
      style={{ margin: 0, fontSize: fluid(100, 52), lineHeight: 1.2, fontWeight: 400, color: dark ? "#FFFFFF" : "var(--ink, #0E0B22)" }}
    >
      <RollingNumber value={digits} />
      {unit ? (
        <span style={{ fontSize: fluid(60, 32), fontWeight: 400, color: dark ? "rgba(255,255,255,0.5)" : "#A1A0A9" }}>{unit}</span>
      ) : null}
    </p>
  );
}

function StoryArticle({ story, dark = false }: { story: Story; dark?: boolean }) {
  const ink = dark ? "#FFFFFF" : "var(--ink, #0E0B22)";
  const inkMuted = dark ? "rgba(255,255,255,0.5)" : "var(--ink-muted, #7A7885)";
  return (
    <article id={story.id} style={{ background: dark ? "#000000" : "#FFFFFF" }} data-dark-section={dark || undefined}>
      {/* module top hairline — Figma: full-width rule opening every story module */}
      <Hairline dark={dark} />
      <div style={{ padding: `${fluid(60, 28)} ${fluid(60, 24)} 0` }}>
        <StatsCard story={story} dark={dark} />
      </div>



      {/* header — eyebrow, rule, 48px title, intro, CTA */}
      <div style={{ padding: `${fluid(80, 40)} ${fluid(60, 24)} 0` }}>
        <Reveal y={32} duration={1600}>
          <p
            className="capitalize"
            style={{ margin: 0, fontSize: 12, lineHeight: "20px", color: ink }}
          >
            {story.eyebrow}
          </p>
          <div style={{ marginTop: 10 }}>
            <Hairline dark={dark} />
          </div>

          <div
            className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between"
            style={{ marginTop: fluid(24, 18) }}
          >
            <div style={{ maxWidth: 680 }}>
              <h2
                className="font-display capitalize"
                style={{
                  margin: 0,
                  fontSize: fluid(48, 30),
                  lineHeight: "1.1667",
                  fontWeight: 400,
                }}
              >
                <span style={{ color: LIME }}>{story.titleAccent}</span>
                <span style={{ color: ink }}>{story.titleRest}</span>
              </h2>
              <div style={{ marginTop: 20 }}>
                {story.intro.map((p) => (
                  <p
                    key={p}
                    style={{
                      margin: 0,
                      fontSize: 13,
                      lineHeight: "20px",
                      color: inkMuted,
                    }}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
            <InlineDemoButton dark={dark} />
          </div>
        </Reveal>
      </div>

      {/* light blocks */}
      <div
        style={{
          padding: `${fluid(80, 44)} ${fluid(60, 24)} ${fluid(80, 44)}`,
          display: "flex",
          flexDirection: "column",
          gap: fluid(60, 36),
        }}
      >
        {story.light.map((b, i) => (
          <ArticleBlock key={b.title} {...b} dark={dark} delay={i * 260} />
        ))}
      </div>

      {/* dark-block content now on white bg (black background removed) */}
      <div
        style={{
          padding: `${fluid(80, 44)} ${fluid(60, 24)}`,
          display: "flex",
          flexDirection: "column",
          gap: fluid(60, 36),
        }}
      >
        {story.dark.map((b, i) => (
          <ArticleBlock key={b.title} {...b} dark={dark} delay={i * 260} />
        ))}
      </div>

      {/* closing block */}
      <div style={{ padding: `${fluid(80, 44)} ${fluid(60, 24)} ${fluid(60, 36)}` }}>
        <ArticleBlock {...story.tail} dark={dark} />
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ page */

function StoriesPage() {
  const pad = `0 ${fluid(120, 24)}`;
  const railRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [active, setActive] = useState(STORIES[0].id);

  // Sidebar follows whichever story currently owns the upper viewport.
  useEffect(() => {
    type StoryGeometry = { position: number; height: number };
    const geometry: Record<string, StoryGeometry> = {};
    let currentActive = STORIES[0].id;
    let resizeTimer = 0;

    const update = () => {
      const scrollY = window.scrollY;
      let current = STORIES[0].id;
      for (const s of STORIES) {
        const bounds = geometry[s.id];
        if (!bounds) continue;
        if (scrollY >= bounds.position) current = s.id;
        const p = (scrollY - bounds.position) / Math.max(bounds.height, 1);
        const clamped = Math.min(1, Math.max(0, p));
        const rail = railRefs.current[s.id];
        if (rail) rail.style.transform = `scaleX(${clamped})`;
      }
      if (current !== currentActive) {
        currentActive = current;
        setActive(current);
      }
    };

    const measure = () => {
      const headerOffset = window.innerWidth < 768 ? 100 : 100;
      for (const s of STORIES) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        geometry[s.id] = {
          position: rect.top + window.scrollY - headerOffset,
          height: rect.height,
        };
      }
      update();
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 150);
    };

    measure();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize);

    const observer = new ResizeObserver(onResize);
    for (const s of STORIES) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      window.clearTimeout(resizeTimer);
    };
  }, []);


  return (
    <div className="relative min-h-screen bg-paper">
      <SiteNav revealDelay={0} />

      {/* ------------------------------------------------------------ hero */}
      <header className="relative overflow-hidden">
        <HalftoneHandStill
          cropX={0.5}
          cropW={0.5}
          cropY={0.32}
          cropH={0.52}
          pitch={6}
          className="pointer-events-none absolute select-none"
          style={{
            top: fluid(115, 66),
            left: fluid(780, 420),
            width: fluid(741, 400),
            height: fluid(425, 230),
          }}
        />

        <div style={{ padding: pad }}>
          <div className="relative mx-auto w-full max-w-[1200px]">
            <div
              className="relative z-10"
              style={{ maxWidth: 680, paddingTop: fluid(163, 104), paddingBottom: fluid(172, 100) }}
            >
              <Reveal immediate className="flex items-center gap-2">
                <span aria-hidden style={{ width: 8, height: 8, background: LIME }} />
                <span
                  className="uppercase"
                  style={{ fontSize: 14, lineHeight: "22px", color: "#7A7885" }}
                >
                  stories
                </span>
              </Reveal>

              <Reveal immediate delay={120}>
                <h1
                  className="font-display text-ink capitalize"
                  style={{
                    margin: "10px 0 0",
                    maxWidth: 539,
                    fontSize: fluid(48, 30),
                    lineHeight: 1.1667,
                    fontWeight: 500,
                  }}
                >
                  Three Stories from the Front Lines
                </h1>
              </Reveal>

              <Reveal immediate delay={240}>
                <p
                  style={{
                    margin: "10px 0 0",
                    maxWidth: 563,
                    fontSize: 16,
                    lineHeight: "24px",
                    color: "var(--ink-muted, #7A7885)",
                  }}
                >
                  Three real-world breakthroughs in multilingual accuracy, payment fraud detection,
                  and weekly model improvement.
                </p>
              </Reveal>

              <Reveal immediate delay={360} style={{ marginTop: fluid(40, 28) }}>
                <RainbowButton label="Book a Demo" />
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- stories */}
      <section style={{ padding: pad }}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col md:flex-row md:items-start">
          {/* sticky index — white panel stays pinned, gradient rails track scroll */}
          <nav
            aria-label="Stories"
            className="shrink-0 md:sticky"
            style={{ width: 180, top: 83, marginRight: 20 }}
          >
            {STORIES.map((s) => {
              const on = active === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(event) => {
                    const target = document.getElementById(s.id);
                    if (!target) return;
                    event.preventDefault();
                    const lenis = getLenis();
                    if (lenis) {
                      // real animated scroll through the page, matching the
                      // reference site's inertial anchor jump
                      lenis.scrollTo(target, {
                        offset: -ANCHOR_OFFSET,
                        duration: 1.2,
                      });
                    } else {
                      window.scrollTo({
                        top:
                          target.getBoundingClientRect().top +
                          window.scrollY -
                          ANCHOR_OFFSET,
                        behavior: "smooth",
                      });
                    }
                  }}
                  className="relative flex items-center transition-colors duration-300"
                  style={{
                    height: 54,
                    padding: 12,
                    gap: 6,
                    fontSize: 12,
                    lineHeight: "20px",
                    color: "#0E0B22",
                    opacity: on ? 1 : 0.55,
                  }}
                >
                  {/* base rail; gradient fill only on the active module */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0"
                    style={{ height: 1, background: "#E1E0E4" }}
                  />
                  <span
                    ref={(node) => {
                      railRefs.current[s.id] = node;
                    }}
                    aria-hidden
                    className="stories-rail-flow pointer-events-none absolute left-0 top-0"
                    style={{
                      height: 1.5,
                      width: "100%",
                      opacity: on ? 1 : 0,
                      transform: "scaleX(0)",
                      transformOrigin: "left center",
                      willChange: "transform",
                    }}
                  />

                  <span style={{ width: 24 }}>{s.index}</span>
                  <span className="whitespace-nowrap">{s.tab}</span>
                </a>
              );
            })}
          </nav>


          {/* content column */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ gap: 80 }}>
            {STORIES.map((s) => (
              <StoryArticle key={s.id} story={s} dark={s.id === "payment-risk"} />
            ))}

          </div>
        </div>
      </section>

      {/* CTA + brand footer, shared with the homepage */}
      <SiteFooter />

      <FinChatDock alwaysVisible />
    </div>
  );
}

export default StoriesPage;
