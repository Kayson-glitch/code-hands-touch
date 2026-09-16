import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Activity, CalendarCheck, ClipboardCheck, FileWarning, Hourglass, Languages, Lock, MessageCircle, RefreshCw, Route as RouteIcon, ScanSearch, TrendingDown, TrendingUp, UserCheck } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { whyStoriesAsset } from "@/lib/media";
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

type Block = { icon: LucideIcon; title: string; body: string; divider: boolean };

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
    titleRest: "Low-Resource Languages",
    intro: [
      "In Hindi and Urdu, 'why is my order still pending' reached the model as 'why am I still pregnant'.",
      "For multilingual ops teams: root cause, targeted model, validation.",
    ],
    stats: ["68%", "86%"],
    caption: "India translation accuracy, general API → targeted model · 1 month",
    bullets: [
      "Targeted Indian model, no English pivot in the middle",
      "Multi-model voting, tuned to payment and order phrasing",
      "Low-resource-language users understood for the first time",
    ],
    light: [
      {
        icon: Languages,
        title: "Where General-Purpose Translation Breaks Down",
        body: "The multilingual pipeline used English as an intermediate layer: Hindi or Urdu text was first translated to English, then passed to intent recognition and response generation. Meaning was lost in that hop. Order tracking, withdrawals and top-ups — the high-sensitivity after-sales questions — are exactly where low-resource-language users concentrate, so a mistranslation went straight to lost trust and churn. The limitation is structural, not a tuning problem: general APIs are trained on corpora that do not reflect how payment and trading terms are actually used in these languages, and even the best of them could not recover the meaning.",
        divider: true,
      },
      {
        icon: RouteIcon,
        title: "Building a Region-Specific Translation Path",
        body: "We trained a targeted translation model for India with three design choices. The English pivot was removed, mapping source languages directly into the target semantic space to eliminate the accumulated error of a second translation. A multi-model voting layer produces the final reading, reducing the variance of any single model on long-tail phrasing. And high-frequency, high-risk transaction terms — pending, withdraw, refund — were calibrated with dedicated corpus so the words that decide money are the words the system gets right.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: TrendingUp,
        title: "Measured Impact",
        body: "Training and rollout took about one month. Benchmarked against human labels on live traffic, translation accuracy for the Indian region rose from 68% with the general-purpose API to 86% with the targeted model. Intent recognition for low-resource-language users improved accordingly, and the broken links in the after-sales conversation were repaired.",
        divider: true,
      },
      {
        icon: ClipboardCheck,
        title: "Conclusion and Clarifications",
        body: "These figures come from the current observation cycle in the Indian market and are not extrapolated to every supported language. The method is portable, but each region needs its own corpus and its own validation pass before we quote a number. When a general translation service hits its precision ceiling in a specific scenario, a targeted model trained on the customer's real business data can lift accuracy substantially within a controlled timeframe — this capability is part of our customised model service.",
        divider: false,
      },
    ],
    tail: {
      icon: MessageCircle,
      title: "What Changed for Users",
      body: "Low-resource-language users stopped rephrasing themselves in English to be understood. Because the model reads the original message directly, tone and urgency survive, and the reply comes back in the language the customer actually wrote in.",
      divider: false,
    },
  },
  {
    id: "payment-risk",
    index: "02",
    tab: "Payment Risk Control",
    eyebrow: "payment risk control",
    titleAccent: "Catching Forged Payment Proofs ",
    titleRest: "Before Payout",
    intro: [
      "Organised rings doctored payment proofs to claim compensation; outsourced KYC checks took days.",
      "For risk and KYC teams: why manual review lost, and the model that replaced it.",
    ],
    stats: ["88%", ""],
    caption: "Forged-proof detection accuracy · about 3 months · PDF / video / image",
    bullets: [
      "Multimodal detection across PDF, video and image proofs",
      "Tiered handling: only suspicious cases reach a human",
      "Days of outsourced KYC checks compressed to near real time",
    ],
    light: [
      {
        icon: FileWarning,
        title: "An Industrialised Forgery Chain",
        body: "The behaviour had all the marks of an industry, not an individual. Payment proofs were edited to a high standard of realism, submitted to support as evidence of a completed payment, and followed by a compensation claim. Forgeries arrived as PDFs, videos and images, and human agents could not reliably tell them apart by eye. Because the work was done in batches, the response had to be fast as well as accurate.",
        divider: true,
      },
      {
        icon: Hourglass,
        title: "Why Manual Verification Kept Losing",
        body: "The existing process relied on an outsourced KYC team. Two limits made it unwinnable: a single verification typically took days, hopelessly mismatched against batch forgery, and cost rose linearly with the volume checked. In an attacker–defender contest, manual review was permanently on the back foot.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: ScanSearch,
        title: "Measured Impact",
        body: "We built a custom image-forensics model for BCGame's Indian payment scenario: multimodal detection across PDF, video and image; detection of image tampering, element substitution and template forgery; and tiered handling in which only suspicious items are passed to human review. Benchmarked against human labels on live traffic, accuracy reached 88% within about three months. Verification that took days now happens in near real time, and the cost of running a forgery operation went up sharply.",
        divider: true,
      },
      {
        icon: Lock,
        title: "Deliberate Limits",
        body: "The model flags; people decide. The system never moves funds, closes an account or issues a final refusal on its own — the AI's role ends at evidence and recommendation, which is what makes automation acceptable inside a regulated payment flow. 88% is the accuracy of a specific observation cycle: behind it is a weekly model-update mechanism (see Iteration Flywheel), so the figure keeps moving with each cycle.",
        divider: false,
      },
    ],
    tail: {
      icon: UserCheck,
      title: "What Changed for Agents",
      body: "Risk agents stopped checking every item and started reviewing the suspicious subset with the evidence already attached. The support system's remit extended from answering questions to controlling fund risk.",
      divider: false,
    },
  },
  {
    id: "iteration",
    index: "03",
    tab: "Iteration Flywheel",
    eyebrow: "iteration flywheel",
    titleAccent: "A Machine That Gets Stronger ",
    titleRest: "Every Friday",
    intro: [
      "Most AI deliveries peak at launch and drift. This loop keeps BCGame's forgery model improving every week.",
      "For technical leads: production labels in, Friday releases out, live service untouched.",
    ],
    stats: ["Friday", ""],
    caption: "A new model version every Friday · PDF, image and video",
    bullets: [
      "Online human labels in, a new model version every Friday",
      "Follows evolving forgery techniques instead of freezing",
      "Runs at QPS 20–50; updates decoupled from live service",
    ],
    light: [
      {
        icon: TrendingDown,
        title: "Why Static Delivery Decays",
        body: "A model trained once and delivered once stops adapting the moment it is deployed. In a forgery scenario where techniques keep evolving, that guarantees decay: new methods are not covered by the old version, and the value of the delivery shrinks with time. BCGame raised the requirement explicitly — the anti-forgery algorithm had to evolve with the attackers — and the weekly mechanism was designed to meet it.",
        divider: true,
      },
      {
        icon: RefreshCw,
        title: "The Closed Loop",
        body: "Human labels from production — on PDF, image and video proofs — are the training input. The algorithm retrains on them weekly and a new version is released every Friday, flowing back into production. Labelling, training, weekly release, higher accuracy, more labels: the loop means detection improves as new forgery samples accumulate, rather than stalling at the delivery date.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: Activity,
        title: "Measured Impact",
        body: "The 88% detection figure in the previous story is an observation from one iteration cycle, not a fixed property of the model; it rises as samples accumulate. The mechanism is engineered for production: it runs at QPS 20–50, and model updates are decoupled from the serving path, so iterating never affects availability. What is delivered is a self-improving production system, not a static algorithm.",
        divider: true,
      },
      {
        icon: ClipboardCheck,
        title: "Conclusion and Clarifications",
        body: "This cadence is a customised delivery for BCGame's Indian market and depends on production traffic and labelled outcomes; a pilot without volume cannot sustain it. Together with private deployment and on-site FDE support it forms our long-term service model (see Security & Partnership). Every accuracy figure quoted should be read as the value within a specific iteration cycle.",
        divider: false,
      },
    ],
    tail: {
      icon: CalendarCheck,
      title: "What Changed for the Roadmap",
      body: "The numbers stopped being a finish line. Each Friday's release is the new baseline, and the conversation with the customer moved from 'what did you deliver' to 'what did it learn this week'.",
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
          {story.stats[1] ? (
            <>
              <span aria-hidden style={{ color: dark ? "rgba(255,255,255,0.5)" : "#A1A0A9", display: "inline-flex" }}>
                <DotArrow size={56} connectOnHover={false} />
              </span>
              <StatValue value={story.stats[1]} dark={dark} />
            </>
          ) : null}
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
      {match ? <RollingNumber value={digits} /> : digits}
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
            style={{ marginTop: fluid(24, 18), columnGap: fluid(72, 40) }}
          >
            <div style={{ maxWidth: 680, minWidth: 0 }}>
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
          src={whyStoriesAsset.url}
          contrast={1.7}
          cropX={0}
          cropW={1}
          cropY={0}
          cropH={1}
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
                  Three real episodes from BCGame's 22-language support: low-resource translation,
                  payment-proof forgery detection, and a model that gets stronger every Friday.
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
