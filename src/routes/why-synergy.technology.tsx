import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquareCode,
  Map as MapIcon,
  Shield,
  Search,
  Workflow,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { HalftoneHandStill } from "@/components/HalftoneHandStill";
import { Reveal } from "@/components/Reveal";
import { RollingNumber } from "@/components/RollingNumber";
import { FinChatDock } from "@/components/FinChatDock";

import { getLenis } from "@/lib/smoothScroll";
import { DotArrow } from "@/components/DotArrow";

/** Nav (60) + breathing room, so a targeted module never hugs the header. */
const ANCHOR_OFFSET = 60 + 40;

export const Route = createFileRoute("/why-synergy/technology")({
  head: () => ({
    meta: [
      { title: "Technology & Guardrails — Synergy.AI" },
      {
        name: "description",
        content:
          "How the system stays accurate and safe: zero hallucinations, knowledge governance, precision retrieval, and workflow orchestration with human oversight.",
      },
      { property: "og:title", content: "Technology & Guardrails — Synergy.AI" },
      {
        property: "og:description",
        content:
          "How the system stays accurate and safe: zero hallucinations, knowledge governance, precision retrieval, and workflow orchestration with human oversight.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TechnologyPage,
});

/* --------------------------------------------------------------- helpers */

/** 1440px design width → fluid value. */
const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

const GRADIENT =
  "linear-gradient(90deg, #137DFF 0%, #FF18AA 33.333%, #FFCD17 66.666%, #137DFF 100%)";
const SKY = "#8CE0FF";

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
function InlineDemoButton() {
  return (
    <button
      className="shrink-0 cursor-pointer transition-opacity hover:opacity-90"
      style={{
        background: "#0E0B22",
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

/** Alternating sky diamond / ink square bullet (ref: image-134). */
function Bullet({ diamond }: { diamond: boolean }) {
  return (
    <span
      aria-hidden
      className="mt-[7px] inline-block shrink-0"
      style={{
        width: 6,
        height: 6,
        background: diamond ? "#93C5FD" : "#374151",
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

type Module = {
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

const MODULES: Module[] = [
  {
    id: "zero-hallucinations",
    index: "01",
    tab: "Zero Hallucinations",
    eyebrow: "zero hallucinations",
    titleAccent: "Grounded Answers, ",
    titleRest: "Not Confident Guesses",
    intro: [
      "Every reply the system produces is traceable to a source document in the knowledge base. When no source is found, the system says so instead of filling the gap with a plausible-sounding fabrication.",
      "We describe how grounding works, what happens when confidence is low, and the safeguards that prevent fabricated answers from reaching customers.",
    ],
    stats: ["75%", "0"],
    caption: "AI resolution rate across 200K",
    bullets: [
      "AI resolves 55% of conversations end-to-end",
      "AI handles 70% of messages, around 110K/month",
      "Both metrics were zero before launch",
      "No inflated metrics: human agent intervene",
    ],
    light: [
      {
        icon: Shield,
        title: "Retrieval-Augmented Generation With Source Citations",
        body: "The system never generates from raw model weights alone. Each incoming question triggers a retrieval pass against the curated knowledge base — help articles, policy documents, product specs, and approved workflows. The model receives the retrieved passages as context and is instructed to answer only from them. If the retrieved context does not contain a direct answer, the system returns a fallback message and escalates, rather than extrapolating from partial information.",
        divider: true,
      },
      {
        icon: Search,
        title: "Confidence Scoring and the Fallback Path",
        body: "Before any answer is sent, a confidence score is computed by comparing the generated reply against the source passages at the sentence level. Scores below the calibrated threshold never reach the customer. Instead, the conversation is handed to a human agent with the retrieved context and the draft answer attached, so the agent can confirm, correct, or discard in seconds rather than researching from scratch.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: Shield,
        title: "Measured Impact",
        body: "Across 200,000 production conversations, the system maintained a 75% resolution rate with zero confirmed hallucination incidents. The fallback path absorbed 8% of traffic — cases where confidence was genuinely too low — and those cases were resolved by human agents without any customer-facing error. The guardrail is not a theoretical constraint; it is a measured outcome.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Red-Teaming and Adversarial Testing",
        body: "A dedicated red-team runs prompt-injection attempts, jailbreak patterns, and edge-case queries against every model update before it ships. The test suite includes real adversarial transcripts collected from production, synthetic edge cases generated from policy boundaries, and third-party benchmarks. Any model version that fails a red-team case does not deploy until the failure is understood and resolved.",
        divider: false,
      },
    ],
    tail: {
      icon: MapIcon,
      title: "What Changed for Customers",
      body: "Customers stopped receiving confidently wrong answers. When the system does not know, it says so and connects them to a human who already has the context. That honesty is what makes the 75% resolution rate trustworthy — the remaining 25% is handled, not hidden.",
      divider: false,
    },
  },
  {
    id: "knowledge-governance",
    index: "02",
    tab: "Knowledge Governance",
    eyebrow: "knowledge governance",
    titleAccent: "Every Answer Is ",
    titleRest: "Accountable to a Source",
    intro: [
      "The knowledge base is not a dump of every document the company owns. It is a governed layer where every source has an owner, a review cadence, and an expiration date.",
      "We describe how content enters the base, how it is kept current, and how the system refuses to answer from stale or unapproved material.",
    ],
    stats: ["48", "100%"],
    caption: "Hours from content update to deployment, with 100% of sources owner-attributed.",
    bullets: [
      "Every document has a named owner responsible for accuracy and freshness",
      "Content is reviewed on a fixed cadence — weekly for dynamic policies, quarterly for static specs",
      "Expired or unreviewed documents are automatically excluded from retrieval",
      "Version history is preserved, so any answer can be traced to the exact source version used",
    ],
    light: [
      {
        icon: Shield,
        title: "The Content Lifecycle: From Draft to Retrieval",
        body: "A document enters the knowledge base only after it passes a review workflow: a subject-matter expert drafts it, a second reviewer checks accuracy against the live system, and an owner is assigned. Once published, the document is indexed and becomes available to the retrieval layer. The owner receives a reminder before the review cadence expires; if the review is not completed, the document is automatically excluded from retrieval until it is re-verified.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Source Attribution and Audit Trails",
        body: "Every answer the system produces carries a citation to the exact source passage. This is not a link added after the fact — the retrieval layer returns the passage ID alongside the text, and the citation is embedded in the response payload. When a customer asks 'where did you get that?', the system can point to the document, the section, and the version. Audit logs preserve this chain for compliance reviews and post-incident analysis.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: Shield,
        title: "Measured Impact",
        body: "The median time from a content update to production deployment is 48 hours, down from a two-week release cycle under the previous system. 100% of indexed sources have an attributed owner, and the automatic exclusion of expired content has eliminated the class of errors caused by outdated policy references — previously the largest single source of customer complaints.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "What Happens When a Source Is Missing",
        body: "If a question falls outside the governed knowledge base — no matching document, no approved answer — the system does not improvise. It routes the conversation to a human agent and logs the gap. The gap log feeds the content backlog: recurring questions become new documents, reviewed and published through the same lifecycle. The system's coverage grows from observed demand, not from speculation.",
        divider: false,
      },
    ],
    tail: {
      icon: MapIcon,
      title: "What Changed for Operations",
      body: "The knowledge base stopped being a graveyard of outdated PDFs. Owners know what they are responsible for, expired content is quarantined by default, and every answer is auditable down to the source version. Compliance reviews that used to take weeks now run in hours because the citation chain is already there.",
      divider: false,
    },
  },
  {
    id: "precision-retrieval",
    index: "03",
    tab: "Precision Retrieval",
    eyebrow: "precision retrieval",
    titleAccent: "Finding the Right Answer ",
    titleRest: "in a Million Documents",
    intro: [
      "Retrieval is not keyword matching. The system uses hybrid search — semantic embeddings plus lexical exact-match — to find the passage that actually answers the question, not the passage that shares the most words.",
      "We describe the retrieval pipeline, how relevance is measured, and why hybrid search outperforms either method alone.",
    ],
    stats: ["94%", "3.2x"],
    caption: "Retrieval precision on held-out evaluation set, 3.2× higher than lexical-only baseline.",
    bullets: [
      "Hybrid search combines dense semantic embeddings with sparse lexical exact-match",
      "Re-ranking with a cross-encoder improves precision on the top results",
      "Query expansion handles synonyms, abbreviations, and multilingual variants",
      "Retrieval latency stays under 200ms at the 99th percentile across a million documents",
    ],
    light: [
      {
        icon: Search,
        title: "The Hybrid Pipeline: Semantic Meets Lexical",
        body: "Pure semantic search understands intent but misses exact terms — a customer asking about 'SKU 88421' will not match a document that says 'product code 88421' unless the system knows they are the same. Pure lexical search catches the exact string but fails on paraphrase. The hybrid pipeline runs both in parallel: a dense embedding model retrieves the top 50 passages by semantic similarity, a sparse BM25 index retrieves the top 50 by lexical overlap, and the two lists are merged and re-ranked by a cross-encoder that scores each passage against the query at the sentence level.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Query Expansion and Multilingual Retrieval",
        body: "Before retrieval, the query is expanded: synonyms are injected from a domain-specific glossary, abbreviations are spelled out, and if the query is in a non-English language, it is embedded directly using a multilingual encoder rather than translated first. This means a question in Hindi about a payment dispute retrieves the same policy document as the equivalent question in English, without an intermediate translation step that could distort the meaning.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: Search,
        title: "Measured Impact",
        body: "On a held-out evaluation set of 10,000 real customer questions with human-annotated correct passages, the hybrid pipeline achieves 94% precision@1 — meaning the top retrieved passage contains the answer 94% of the time. This is 3.2× higher than the lexical-only baseline and 1.4× higher than semantic-only. The cross-encoder re-rank step accounts for most of the gap, lifting precision from 81% to 94% by filtering out passages that are semantically similar but not actually relevant.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Latency and Scale",
        body: "The full pipeline — embedding, dual retrieval, merge, re-rank — completes in under 200ms at the 99th percentile across a knowledge base of one million documents. The dense index uses approximate nearest neighbour search with a recall target of 98%, and the cross-encoder only scores the top 20 merged candidates. At this latency, retrieval is never the bottleneck in the customer-facing response path.",
        divider: false,
      },
    ],
    tail: {
      icon: MapIcon,
      title: "What Changed for Customers",
      body: "Customers stopped getting answers to slightly different questions than the one they asked. The system finds the passage that actually addresses their situation, not the passage that shares the most keywords. That precision is what makes the grounding layer meaningful — a citation to the wrong passage is no better than no citation at all.",
      divider: false,
    },
  },
  {
    id: "workflow-orchestration",
    index: "04",
    tab: "Workflow Orchestration",
    eyebrow: "workflow orchestration",
    titleAccent: "Multi-Agent Coordination ",
    titleRest: "With a Human Ceiling",
    intro: [
      "Complex customer requests — a refund that requires inventory check, policy lookup, and manager approval — are not handled by a single model call. They are decomposed into steps, each routed to the agent or system best suited to execute it.",
      "We describe the orchestration layer, how decisions are chained, and where human authority is required by design.",
    ],
    stats: ["12", "4"],
    caption: "Average steps per complex workflow, with 4 distinct agent roles coordinated.",
    bullets: [
      "A planner decomposes complex requests into a graph of subtasks with dependencies",
      "Each subtask is routed to the specialised agent or API best suited to execute it",
      "Any step that changes account state requires explicit human approval before execution",
      "The orchestration layer is fully observable — every step, decision, and handoff is logged",
    ],
    light: [
      {
        icon: Workflow,
        title: "The Planner and the Task Graph",
        body: "When a request arrives that cannot be resolved in a single retrieval-and-generation cycle, a planner agent decomposes it into a directed graph of subtasks. A refund request, for example, becomes: verify order status, check return policy, confirm item condition, calculate refund amount, and submit the refund — each a node with dependencies on the previous one. The planner outputs the graph before any step executes, so the full plan is auditable before it begins.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Routing, Execution, and the Authority Ceiling",
        body: "Each subtask is routed to the agent best suited to execute it: a retrieval agent for policy lookups, a calculation agent for refund amounts, a CRM API call for order status, or a human agent for final approval. The routing is deterministic given the task type — there is no model deciding at runtime who should handle what, which removes a class of unpredictability. Critically, any step that changes account state — issuing a refund, closing a ticket, modifying an order — is routed to a human by default. The AI prepares the action; the human authorises it.",
        divider: false,
      },
    ],
    dark: [
      {
        icon: Workflow,
        title: "Measured Impact",
        body: "Complex workflows — defined as requests requiring more than three steps — average 12 orchestrated steps across 4 distinct agent roles. The median completion time for these workflows is 4 minutes, compared to 18 minutes under the previous fully-manual process. The human approval step, which could be seen as a bottleneck, adds a median of 22 seconds because the AI has already assembled the evidence and drafted the action by the time the agent reviews it.",
        divider: true,
      },
      {
        icon: MapIcon,
        title: "Observability and Failure Modes",
        body: "Every step in the graph is logged with its inputs, outputs, duration, and the agent that executed it. When a workflow fails — an API is down, a policy check returns ambiguous, a human rejects the proposed action — the graph state is preserved so the failure can be replayed and diagnosed. The system retries only the failed step, not the entire workflow, which means a transient API error does not force the customer to start over.",
        divider: false,
      },
    ],
    tail: {
      icon: MapIcon,
      title: "What Changed for the Team",
      body: "Agents stopped being switchboard operators. The orchestration layer handles the routing, the API calls, and the evidence assembly; agents focus on the one decision that actually requires their judgement. The result is faster resolution for customers and less cognitive load for the humans in the loop.",
      divider: false,
    },
  },
];

const FOOTER_COLUMNS = [
  { title: "why  synergy", links: ["Features", "Pricing", "Book a demo"] },
  { title: "platform", links: ["Features", "Pricing", "Book a demo"] },
  { title: "solution", links: ["Events", "Blog"] },
  { title: "Company", links: ["About us", "Contact us"] },
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

/** Stats card — two-column split: left primary stat, right bullet list,
 *  separated by a dashed vertical rule (ref: image-134). */
function StatsCard({ module }: { module: Module }) {
  return (
    <Reveal y={32} duration={1600} style={{ background: "#F8F9FA" }}>
      <div
        className="relative flex"
        style={{
          padding: `${fluid(56, 36)} ${fluid(40, 16)}`,
          gap: fluid(40, 20),
        }}
      >
        {/* left column — primary metric */}
        <div className="shrink-0" style={{ width: "35%" }}>
          <p
            className="font-sans uppercase tracking-wide"
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: "18px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#374151",
            }}
          >
            Overall Impact
          </p>
          <div style={{ marginTop: fluid(20, 14) }}>
            <StatValue value={module.stats[0]} />
          </div>
          <p
            style={{
              margin: `${fluid(20, 14)} 0 0`,
              fontSize: 14,
              lineHeight: "22px",
              color: "#6B7280",
              maxWidth: 340,
            }}
          >
            {module.caption}
          </p>
        </div>

        {/* right column — bullet details */}
        <ul
          className="flex flex-1 flex-col justify-between"
          style={{ gap: 22, paddingLeft: fluid(40, 20), margin: 0 }}
        >
          {module.bullets.map((b, i) => (
            <li key={b} className="flex items-start gap-3">
              <Bullet diamond={i % 2 === 0} />
              <span className="whitespace-nowrap" style={{ fontSize: 14, lineHeight: "22px", color: "#374151" }}>
                {b}
              </span>
            </li>
          ))}
        </ul>

        {/* dashed vertical divider — absolutely positioned for precise edge control */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "30%",
            bottom: "30%",
            left: "38%",
            width: 0,
            borderLeft: "1px dashed #D1D5DB",
          }}
        />
      </div>
    </Reveal>
  );
}

/** 100px Clash Display digits with a 60px regular unit (ref: image-134). */
function StatValue({ value }: { value: string }) {
  const match = /^([\d.]+)(.*)$/.exec(value);
  const digits = match ? match[1] : value;
  const unit = match ? match[2] : "";
  return (
    <p
      className="font-display whitespace-nowrap capitalize"
      style={{ margin: 0, fontSize: fluid(100, 52), lineHeight: 1.2, fontWeight: 400, color: "#111827" }}
    >
      <RollingNumber value={digits} />
      {unit ? (
        <span style={{ fontSize: fluid(60, 32), fontWeight: 400, color: "#9CA3AF" }}>{unit}</span>
      ) : null}
    </p>
  );
}

function ModuleArticle({ module }: { module: Module }) {
  return (
    <article id={module.id} className="bg-white">
      {/* module top hairline — Figma: full-width rule opening every module */}
      <Hairline />
      <div style={{ padding: `${fluid(60, 28)} ${fluid(60, 24)} 0` }}>
        <StatsCard module={module} />
      </div>

      {/* header — eyebrow, rule, 48px title, intro, CTA */}
      <div style={{ padding: `${fluid(80, 40)} ${fluid(60, 24)} 0` }}>
        <Reveal y={32} duration={1600}>
          <p
            className="capitalize"
            style={{ margin: 0, fontSize: 12, lineHeight: "20px", color: "var(--ink, #0E0B22)" }}
          >
            {module.eyebrow}
          </p>
          <div style={{ marginTop: 10 }}>
            <Hairline />
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
                <span style={{ color: SKY }}>{module.titleAccent}</span>
                <span className="text-ink">{module.titleRest}</span>
              </h2>
              <div style={{ marginTop: 20 }}>
                {module.intro.map((p) => (
                  <p
                    key={p}
                    style={{
                      margin: 0,
                      fontSize: 13,
                      lineHeight: "20px",
                      color: "var(--ink-muted, #7A7885)",
                    }}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
            <InlineDemoButton />
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
        {module.light.map((b, i) => (
          <ArticleBlock key={b.title} {...b} delay={i * 260} />
        ))}
      </div>

      {/* dark block — full-bleed inside the column */}
      <div
        data-dark-section
        style={{
          background: "#000000",
          padding: `${fluid(80, 44)} ${fluid(60, 24)}`,
          display: "flex",
          flexDirection: "column",
          gap: fluid(60, 36),
        }}
      >
        {module.dark.map((b, i) => (
          <ArticleBlock key={b.title} {...b} dark delay={i * 260} />
        ))}
      </div>

      {/* closing block */}
      <div style={{ padding: `${fluid(80, 44)} ${fluid(60, 24)} ${fluid(60, 36)}` }}>
        <ArticleBlock {...module.tail} />
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ page */

function TechnologyPage() {
  const pad = `0 ${fluid(120, 24)}`;
  const railRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [active, setActive] = useState(MODULES[0].id);

  // Sidebar follows whichever module currently owns the upper viewport.
  useEffect(() => {
    type ModuleGeometry = { position: number; height: number };
    const geometry: Record<string, ModuleGeometry> = {};
    let currentActive = MODULES[0].id;
    let resizeTimer = 0;

    const update = () => {
      const scrollY = window.scrollY;
      let current = MODULES[0].id;
      for (const s of MODULES) {
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
      for (const s of MODULES) {
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
    for (const s of MODULES) {
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
                <span aria-hidden style={{ width: 8, height: 8, background: SKY }} />
                <span
                  className="uppercase"
                  style={{ fontSize: 14, lineHeight: "22px", color: "#7A7885" }}
                >
                  engineering
                </span>
              </Reveal>

              <Reveal immediate delay={120}>
                <h1
                  className="font-display text-ink capitalize"
                  style={{
                    margin: "10px 0 0",
                    maxWidth: 680,
                    fontSize: fluid(48, 30),
                    lineHeight: 1.1667,
                    fontWeight: 500,
                  }}
                >
                  How the System Stays Accurate and Safe
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
                  Governed knowledge, precise retrieval, multi-agent orchestration, and human
                  oversight for high-risk workflows.
                </p>
              </Reveal>

              <Reveal immediate delay={360} style={{ marginTop: fluid(40, 28) }}>
                <RainbowButton label="Book a Demo" />
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- modules */}
      <section style={{ padding: pad }}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col md:flex-row md:items-start">
          {/* sticky index — white panel stays pinned, gradient rails track scroll */}
          <nav
            aria-label="Engineering modules"
            className="shrink-0 md:sticky"
            style={{ width: 220, top: 83, marginRight: 20 }}
          >
            {MODULES.map((s) => {
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
            {MODULES.map((s) => (
              <ModuleArticle key={s.id} module={s} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden" style={{ padding: `${fluid(160, 80)} 0` }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(14,11,34,0.16) 1px, transparent 1px)",
            backgroundSize: "20px 21px",
            maskImage: "radial-gradient(120% 80% at 50% 50%, #000 25%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 80% at 50% 50%, #000 25%, transparent 78%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-[800px] flex-col items-center px-6 text-center">
          <Reveal>
            <h2
              className="font-display"
              style={{ margin: 0, fontSize: fluid(48, 28), lineHeight: 1.1667, fontWeight: 500 }}
            >
              <span className="text-ink-ghost">Get started with the</span>
              <br />
              <span className="text-ink">Synergy.AI today</span>
            </h2>
          </Reveal>
          <Reveal delay={150} style={{ marginTop: fluid(40, 28) }}>
            <RainbowButton label="Book a Demo" />
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- footer */}
      <footer
        data-dark-section
        data-progressive-blur-hide
        className="relative overflow-hidden"
        style={{ background: "#0A0A0A" }}
      >
        <div aria-hidden style={{ height: 2, backgroundImage: GRADIENT, backgroundSize: "200%" }} />

        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", height: 80, boxSizing: "border-box" }}>
          <div className="h-full" style={{ padding: pad }}>
            <div className="mx-auto grid h-full w-full max-w-[1200px] grid-cols-2 items-center gap-9 md:grid-cols-4">
              <div className="flex items-center justify-start gap-2">
                <span
                  aria-hidden
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    backgroundImage: GRADIENT,
                    backgroundSize: "200%",
                  }}
                />
                <span style={{ color: "#FFFFFF", fontSize: 18, lineHeight: "24px", fontWeight: 500 }}>
                  Synergy.AI
                </span>
              </div>
              <div className="hidden md:block md:col-span-3 md:text-right">
                <span
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    lineHeight: "20px",
                  }}
                >
                  Revenue-Driven AI Support. Engineered on Synergy. Scale Securely.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* footer body — Figma 1553:20553: fixed 400px, wordmark absolutely placed */}
        <div className="relative overflow-hidden" style={{ height: 400 }}>
          <div className="flex h-full items-center" style={{ padding: pad }}>
            <div className="mx-auto w-full max-w-[1200px]">
              <div className="grid grid-cols-2 gap-9 md:grid-cols-4">
                {FOOTER_COLUMNS.map((col, i) => (
                  <Reveal key={col.title} delay={i * 90} y={18} className="flex flex-col items-start text-left">
                    <p
                      className="capitalize"
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 12,
                        lineHeight: "20px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {col.title}
                    </p>
                    <ul className="mt-6 flex flex-col items-start gap-[18px]">
                      {col.links.map((l) => (
                        <li key={l}>
                          <span
                            className="cursor-pointer transition-opacity hover:opacity-70"
                            style={{ color: "#FFFFFF", fontSize: 14, lineHeight: "22px" }}
                          >
                            {l}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute left-0 w-full" style={{ top: 198 }}>
            <FitWordmark text="Synergy.AI" />
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", boxSizing: "border-box" }} className="md:h-[68px]">
          <div className="h-full" style={{ padding: pad }}>
            <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 items-center gap-9 py-7 md:h-full md:grid-cols-4 md:py-0">
              <span className="flex justify-start" style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: "20px" }}>
                © {new Date().getFullYear()} Synergy.AI. All rights reserved.
              </span>
              <div className="hidden md:col-span-3 md:flex md:items-center md:justify-end md:gap-4">
                {[Youtube, Twitter, Linkedin].map((Icon, i) => (
                  <span
                    key={i}
                    className="cursor-pointer transition-opacity hover:opacity-70"
                    style={{ color: "#FFFFFF", display: "inline-flex" }}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      <FinChatDock alwaysVisible />
    </div>
  );
}

export default TechnologyPage;

/** Wordmark that fills its container width by uniform font scaling (no glyph stretching). */
function FitWordmark({ text }: { text: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(200);

  const fit = () => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;
    const probe = 200;
    el.style.fontSize = `${probe}px`;
    const w = el.scrollWidth;
    const next = w > 0 ? (probe * box.clientWidth) / w : probe;
    el.style.fontSize = `${next}px`;
    setSize(next);
  };

  useLayoutEffect(fit);
  useEffect(() => {
    window.addEventListener("resize", fit);
    if (document.fonts?.ready) document.fonts.ready.then(fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="pointer-events-none w-full select-none overflow-hidden"
      style={{ lineHeight: 0 }}
    >
      <span
        ref={textRef}
        className="font-display block whitespace-nowrap"
        style={{
          fontSize: size,
          lineHeight: 0.8,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "rgba(255,255,255,0.08)",
          display: "inline-block",
          transform: "translateY(12%)",
        }}
      >
        {text}
      </span>
    </div>
  );
}
