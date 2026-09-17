import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Database, FileWarning, FolderTree, Gauge, Handshake, Layers, Link2, ListFilter, Maximize2, MessageCircle, Network, Radar, Scissors, ShieldCheck, Target, Timer, TriangleAlert, UserCheck, Users, Workflow } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { whyTechnologyAsset } from "@/lib/media";
import { HalftoneHandStill } from "@/components/HalftoneHandStill";
import { Reveal } from "@/components/Reveal";
import { GradientHoverHeading } from "@/components/GradientHoverHeading";
import { FinChatDock } from "@/components/FinChatDock";
import { SiteFooter } from "@/components/SiteFooter";

import { getLenis } from "@/lib/smoothScroll";
import { fluid } from "@/lib/fluid";
import { RainbowButton } from "@/components/RainbowButton";
import { StatsCard, StepDiagram, type Step } from "@/components/WhyFigures";

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


const SKY = "#8CE0FF";




function Hairline({ dark = false }: { dark?: boolean }) {
  return (
    <div aria-hidden style={{ height: 1, background: dark ? "rgba(255,255,255,0.18)" : "#E1E0E4" }} />
  );
}

/* ------------------------------------------------------------------ data */

type Block = { icon: LucideIcon; title: string; body: string; divider: boolean };

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
  /** Method sketch shown after the light blocks. */
  diagram: { steps: Step[]; caption: string };
  dark: Block[];
  tail: Block;
};

const MODULES: Module[] = [
  {
    id: "zero-hallucinations",
    index: "01",
    tab: "Zero Hallucinations",
    eyebrow: "Zero Hallucinations",
    titleAccent: "Grounded Answers, ",
    titleRest: "Not Confident Guesses",
    intro: [
      "In top-ups, withdrawals and compensation, one hallucinated answer costs more than a few extra handovers.",
      "For compliance and risk leads: the rule, and how it shows up in the numbers.",
    ],
    stats: ["55%", "0"],
    caption: "Auto-handling rate, drawn on purpose",
    bullets: [
      "Has the knowledge: answer. Doesn't: hand over, never invent",
      "Better a real person than a plausible wrong answer",
      "55%, not a forced 95% — the line is drawn on purpose",
      "Coverage grows with knowledge, never by loosening the rule",
    ],
    light: [
      {
        icon: TriangleAlert,
        title: "Why Hallucination Outranks Automation Rate",
        body: "In scenarios that touch money or compliance — top-ups, withdrawals, compensation — a hallucinated reply can translate directly into a wrong fund movement, a compliance breach, or a lost high-value customer. That cost is far higher than the cost of passing one more conversation to a person. The design therefore treats certainty as more important than coverage: the automatic response range is deliberately narrowed rather than allowing unreliable output.",
        divider: true,
      },
      {
        icon: ShieldCheck,
        title: "The Boundary Rule: Answer or Hand Over",
        body: "The system follows an explicit response boundary. If the knowledge base holds an answer, it responds directly. If a question falls outside the current knowledge boundary, it hands over to a human — every time — and does not generate a speculative reply. The rule is only as reliable as the engineering under it: knowledge governance keeps the content accurate, precision retrieval makes sure answerable content is actually found, and boundary control keeps the system silent when it is unsure.",
        divider: false,
      },
    ],
    diagram: {
      steps: [
        { label: "Question arrives", sub: "Money at stake: top-up, withdrawal, claim" },
        { label: "Knowledge lookup", sub: "Governed scripts, found by precision retrieval" },
        { label: "Inside the boundary?", sub: "A confident match in the knowledge base, or not" },
        { label: "Answer or hand over", sub: "No match → a person, every time. Never a guess", emphasis: true },
      ],
      caption: "The boundary rule. Coverage widens as the knowledge base grows; it is never widened by loosening step 03.",
    },
    dark: [
      {
        icon: Gauge,
        title: "Measured Impact",
        body: "This rule is the direct reason the auto-handling rate sits at 55%. The number is not a technical limit; it is the result of active restraint — the system automates only inside the range it is confident about. For an operator, 55% describes stable capacity within a reliable boundary, which is worth more than a higher figure driven by coverage. Across the current observation cycle no fabricated answer has been confirmed.",
        divider: true,
      },
      {
        icon: Maximize2,
        title: "How the Boundary Moves",
        body: "As knowledge governance and model iteration continue, the range the system can answer reliably widens, and the auto-handling rate rises naturally while the zero-hallucination constraint holds. The boundary expands with knowledge coverage — it is never widened by relaxing the rule.",
        divider: false,
      },
    ],
    tail: {
      icon: MessageCircle,
      title: "What Changed for Customers",
      body: "Customers stopped receiving confidently wrong answers. When the system does not know, it says so and connects them to a person who already has the context. That honesty is what makes the 55% trustworthy — the rest is handled, not hidden.",
      divider: false,
    },
  },
  {
    id: "knowledge-governance",
    index: "02",
    tab: "Knowledge Governance",
    eyebrow: "Knowledge Governance",
    titleAccent: "Scripts and Rules, ",
    titleRest: "Kept Structurally Apart",
    intro: [
      "50+ long documents across markets and time windows, with reply scripts and constraint rules mixed together.",
      "For knowledge operations: why plain upload fails and what holds it together.",
    ],
    stats: ["50+", "2"],
    caption: "Long docs across markets and windows",
    bullets: [
      "Region × time window × pre/after-sales in 50+ long documents",
      "Configuration Skill splits reply scripts from constraint rules",
      "Every entry verified by human review and AI tests",
      "Sessions tagged: support traffic becomes a business radar",
    ],
    light: [
      {
        icon: Layers,
        title: "Where the Complexity Comes From",
        body: "Regionally, every market has its own promotions, game rules and reward terms. Temporally, promotions carry explicit validity windows, so past, current and upcoming content coexist. By scenario, the base covers pre-sales through after-sales, and after-sales branches deeply — top-ups and withdrawals, order verification, refunds. On top of that, dozens of long documents contain two different kinds of content side by side: how to reply, and what the system must never do.",
        divider: true,
      },
      {
        icon: FileWarning,
        title: "Why Plain Upload Pollutes the Knowledge Base",
        body: "Uploading those documents as-is pollutes the base: behavioural rules and retrievable content end up stored together, so retrieval precision drops and rules stop binding. With many regions and time windows side by side, the system is prone to cross-scenario recall — returning one region's expired promotion to another region's current user. Governance has to happen before retrieval can be trusted.",
        divider: false,
      },
    ],
    diagram: {
      steps: [
        { label: "50+ long documents", sub: "Region × time window × pre-/after-sales, mixed" },
        { label: "Configuration Skill", sub: "Structures every document into two layers" },
        { label: "Scripts vs. rules", sub: "Scripts → knowledge base; rules → rules layer" },
        { label: "Verified entry by entry", sub: "Human review + AI tests; every session tagged", emphasis: true },
      ],
      caption: "Governance before retrieval: what to say and what never to do are stored apart, then checked twice.",
    },
    dark: [
      {
        icon: FolderTree,
        title: "The Governance Method",
        body: "A configuration Skill we built structures every document into two layers. Reply scripts go into the knowledge base and carry the retrieval job; constraint rules go into a rules layer and carry the behavioural job. The result is verified twice — by human review and by AI-driven automated tests — checking response accuracy entry by entry. Slang, abbreviations and local phrasing are configured deeply enough that customers rarely notice they are talking to a system.",
        divider: true,
      },
      {
        icon: Radar,
        title: "Derived Capability: Business Monitoring",
        body: "On top of the governed base, every session is tagged. Shifts in the distribution of inbound topics point back to business problems and market trends: an unusual spike on one topic usually corresponds to a change in a promotion, a region or a process. Support data becomes a monitoring source for the business, not just a service log.",
        divider: false,
      },
    ],
    tail: {
      icon: Database,
      title: "What Changed for Operations",
      body: "The knowledge base stopped being a pile of long documents nobody trusted. Scripts and rules live where they belong, each entry has been verified, and the same data now tells the business where something just changed. The more complex the base, the more that governance is worth.",
      divider: false,
    },
  },
  {
    id: "precision-retrieval",
    index: "03",
    tab: "Precision Retrieval",
    eyebrow: "Precision Retrieval",
    titleAccent: "Retrieval by Structure, ",
    titleRest: "Not Just Vectors",
    intro: [
      "Chunking long documents into vectors discards structure and context — exactly where errors come from.",
      "For technical leads: the limits of vector-only search and the stack we use instead.",
    ],
    stats: ["3", "2"],
    caption: "Retrieval layers, PageIndex to rerank",
    bullets: [
      "PageIndex vector-free retrieval locates answers by structure",
      "Highest-precision embedding as the underlying representation",
      "Self-built rerank, coarse then fine, right passage first",
      "Explicit boundaries per scenario — no over-answering",
    ],
    light: [
      {
        icon: Scissors,
        title: "Where Chunk-and-Embed Falls Short",
        body: "Standard RAG splits long documents into fragments, embeds them and searches by similarity. The split discards the document's structure and the links between its parts. When the base holds many pieces of content that are regionally close but differ in time, similarity search readily returns a fragment that is semantically near yet factually wrong. Recall precision is capped by the method itself.",
        divider: true,
      },
      {
        icon: ListFilter,
        title: "The Retrieval Stack",
        body: "Recall runs through several layers. PageIndex vector-free hybrid retrieval locates content by the document's own structure and hierarchy, avoiding the context loss of chunking and giving precise recall across scenarios. A high-precision embedding model provides the underlying representation. A rerank model we built ourselves scores the candidates in two stages — coarse, then fine — so the most relevant result lands first.",
        divider: false,
      },
    ],
    diagram: {
      steps: [
        { label: "Customer question", sub: "Close to many passages that differ only in time" },
        { label: "PageIndex locate", sub: "By the document's own structure — no chunking" },
        { label: "Precision embedding", sub: "Highest-precision model as the representation" },
        { label: "Rerank, coarse → fine", sub: "Self-built two-stage scorer, right passage first", emphasis: true },
      ],
      caption: "Three retrieval layers. Each scenario carries an explicit boundary, so the stack never over-answers.",
    },
    dark: [
      {
        icon: Link2,
        title: "Governance and Retrieval Together",
        body: "Governance guarantees the content is correct; retrieval and re-ranking guarantee the correct content is what gets pulled out. One is data quality, the other extraction precision, and reliability needs the whole chain — neither works without the other. This stack is the technical base for the response precision achieved on BCGame's complex knowledge base, and the precondition for the zero-hallucination rule to hold.",
        divider: true,
      },
      {
        icon: Timer,
        title: "Boundaries and Latency",
        body: "Every scenario carries an explicit response boundary so the system never over-answers beyond it. Within that precision constraint, latency is optimised so retrieval is not the bottleneck in the customer-facing path. In a complex knowledge base, response precision is a property of the whole chain — from data governance to ranking — not of any single model.",
        divider: false,
      },
    ],
    tail: {
      icon: Target,
      title: "What Changed for Customers",
      body: "Customers stopped getting answers to a slightly different question than the one they asked. The system finds the passage that addresses their situation, not the one that shares the most words — and that precision is what gives the boundary rule something solid to stand on.",
      divider: false,
    },
  },
  {
    id: "workflow-orchestration",
    index: "04",
    tab: "Workflow Orchestration",
    eyebrow: "Workflow Orchestration",
    titleAccent: "Multi-Agent Coordination ",
    titleRest: "with a Human Ceiling",
    intro: [
      "56 fiat ticket scenarios with deep branches across CRM, ERM and the order system.",
      "For operations leads: how they are orchestrated and where a person stays in the loop.",
    ],
    stats: ["56", "2"],
    caption: "Fiat ticket scenarios, multi-agent",
    bullets: [
      "56 fiat ticket scenarios split across cooperating agents",
      "CRM and ERM connected — orders and notices flow automatically",
      "Top-ups, withdrawals and order checks close automatically",
      "Refunds: AI gathers the evidence, a human double-checks",
    ],
    light: [
      {
        icon: Network,
        title: "56 Scenarios, Deep Branches, Many Systems",
        body: "A single fiat ticket often has to pass through CRM, ERM and the order system several times before it is done. Branches are deep and cross-system dependencies are strong; moving and reconciling information between systems by hand is slow and error-prone. No single flow — and no single model call — could hold the whole space.",
        divider: true,
      },
      {
        icon: Workflow,
        title: "The Orchestration",
        body: "Our on-site FDE team mapped and connected the CRM and ERM ticket flows, then a multi-agent architecture orchestrates the complex tasks. The 56 scenarios are divided across agents that cooperate along the business process; orders, messages and change notifications are connected end to end so information moves between systems automatically and data silos disappear. Standardised flows — top-ups, withdrawals, order verification — close automatically.",
        divider: false,
      },
    ],
    diagram: {
      steps: [
        { label: "Fiat ticket arrives", sub: "One of 56 scenarios, deep cross-system branches" },
        { label: "Multi-agent routing", sub: "Cooperating agents split work along the process" },
        { label: "CRM · ERM · orders", sub: "Connected end to end; nothing copied by hand" },
        { label: "Close or escalate", sub: "Standard steps close; refunds go to a person", emphasis: true },
      ],
      caption: "Orchestration with a human ceiling: high-risk, high-complexity steps are never fully automated.",
    },
    dark: [
      {
        icon: UserCheck,
        title: "High-Risk Steps Stay Human",
        body: "Refunds and other high-risk, high-complexity scenarios are never fully automated. The AI collects and organises all relevant information through tools, assembles a complete basis for the decision, and a person performs the final double check. The AI owns gathering, organising and preliminary checks; the human owns the decision. That split balances automation efficiency with control over the steps that matter.",
        divider: true,
      },
      {
        icon: Handshake,
        title: "Why On-Site FDE Mattered",
        body: "Connecting 56 scenarios across CRM and ERM is business-process work before it is AI work. It was done by an FDE team embedded with the customer, walking each flow with the people who run it. That depth of integration is what separates this system from a surface-level chat layer — and it is the same team that stays on after launch (see Security & Partnership).",
        divider: false,
      },
    ],
    tail: {
      icon: Users,
      title: "What Changed for the Team",
      body: "From front-line questions to back-office tickets, the division of labour is now explicit: standardised steps are handled by AI, key decisions stay with people. Agents stopped being switchboard operators between systems and started focusing on the one judgement that actually needs them.",
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



function ModuleArticle({ module }: { module: Module }) {
  return (
    <article id={module.id} className="bg-white">
      {/* module top hairline — Figma: full-width rule opening every module */}
      <Hairline />
      <div style={{ padding: `${fluid(60, 28)} ${fluid(60, 24)} 0` }}>
        <StatsCard
          value={module.stats[0]}
          caption={module.caption}
          bullets={module.bullets}
          accent={SKY}
        />
      </div>

      {/* header — eyebrow, rule, 48px title, intro, CTA */}
      <div style={{ padding: `${fluid(80, 40)} ${fluid(60, 24)} 0` }}>
        <Reveal y={32} duration={1600}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: "20px", color: "var(--ink, #0E0B22)" }}>
            {module.eyebrow}
          </p>
          <div style={{ marginTop: 10 }}>
            <Hairline />
          </div>

          <div
            className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between"
            style={{ marginTop: fluid(24, 18), columnGap: fluid(72, 40) }}
          >
            <div style={{ maxWidth: 680, minWidth: 0 }}>
              <h2
                className="font-display"
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
            <RainbowButton label="Book a Demo" />
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
        <StepDiagram steps={module.diagram.steps} caption={module.diagram.caption} accent={SKY} />
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
          src={whyTechnologyAsset.url}
          contrast={1.7}
          cropX={0.097}
          cropW={0.903}
          cropY={0.08}
          cropH={0.92}
          className="pointer-events-none absolute hidden select-none lg:block"
          style={{
            // Soften the box edges the subject bleeds through (left arm, lower arm).
            maskImage: "linear-gradient(to right, transparent 0, #000 14%), linear-gradient(to top, transparent 0, #000 14%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 14%), linear-gradient(to top, transparent 0, #000 14%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
            top: fluid(115, 66),
            left: `max(${fluid(780, 420)}, calc(50% + 60px))`,
            width: fluid(741, 400),
            height: fluid(425, 230),
          }}
        />

        <div style={{ padding: pad }}>
          <div className="relative mx-auto w-full max-w-[1200px]">
            <div
              className="why-hero-copy relative z-10"
              style={{ paddingTop: fluid(160, 104), paddingBottom: fluid(172, 100) }}
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
                <GradientHoverHeading
                  as="h1"
                  className="font-display text-ink"
                  text={"How the System Stays\nAccurate and Safe"}
                  breakFrom="md"
                  style={{
                    margin: "10px 0 0",
                    maxWidth: 680,
                    fontSize: fluid(60, 36),
                    lineHeight: 1.1,
                    fontWeight: 400,
                  }}
                />
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
                  Governed knowledge, structure-aware retrieval, multi-agent orchestration — and one
                  hard rule: when the system is not sure, a person answers.
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
          {/* phones: a single scrollable row of chips instead of a stacked list */}
          <nav
            aria-label="Engineering modules"
            className="-mx-1 mb-8 flex shrink-0 gap-2 overflow-x-auto px-1 md:sticky md:mx-0 md:mb-0 md:mr-5 md:block md:w-[220px] md:overflow-visible md:px-0"
            style={{ top: 83, scrollbarWidth: "none" }}
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
                  className="relative flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap border px-3 transition-colors duration-300 md:h-[54px] md:border-0 md:p-3"
                  style={{
                    fontSize: 12,
                    lineHeight: "20px",
                    color: "#0E0B22",
                    opacity: on ? 1 : 0.55,
                    borderColor: on ? "#0E0B22" : "#E1E0E4",
                  }}
                >
                  {/* base rail; gradient fill only on the active module */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 hidden md:block"
                    style={{ height: 1, background: "#E1E0E4" }}
                  />
                  <span
                    ref={(node) => {
                      railRefs.current[s.id] = node;
                    }}
                    aria-hidden
                    className="stories-rail-flow pointer-events-none absolute left-0 top-0 hidden md:block"
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

      {/* CTA + brand footer, shared with the homepage */}
      <SiteFooter />

      <FinChatDock alwaysVisible />
    </div>
  );
}

export default TechnologyPage;
