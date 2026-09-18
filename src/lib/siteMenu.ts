/**
 * One source of truth for the site's navigation. The nav dropdowns and the
 * footer's columns both read from here, so the two can't drift apart.
 */

/** A plain destination: title, one-line description, route when it exists. */
export type MenuItem = { title: string; desc: string; to?: string };

/** A featured destination — carries the colour square and kicker the dropdowns show. */
export type FeaturedItem = MenuItem & { dot: string; kicker: string; tag?: string };

export const WHY_SYNERGY_ITEMS: FeaturedItem[] = [
  {
    dot: "#9E8CFF",
    kicker: "Impact",
    title: "Business Impact",
    to: "/why-synergy/business-impact",
    desc: "55% of conversations resolved, with a clear path to lower costs.",
  },
  {
    dot: "#D1E486",
    kicker: "Stories",
    title: "Stories from the Front Lines",
    to: "/why-synergy/stories",
    desc: "Multilingual support, risk management, and continuous improvement.",
  },
  {
    dot: "#8CE0FF",
    kicker: "Engineering",
    title: "Technology & Guardrails",
    to: "/why-synergy/technology",
    desc: "Governed knowledge, precise retrieval, and human oversight.",
  },
  {
    dot: "#EBA753",
    kicker: "Commitment",
    title: "Security & Partnership",
    to: "/why-synergy/security",
    desc: "Private deployment, customer-controlled data, and expert support after launch.",
  },
];

/** Three products (one per row) and four capabilities. */
export const PLATFORM_PRODUCTS: FeaturedItem[] = [
  {
    dot: "#8CE0FF",
    kicker: "Engine",
    title: "Self-Developed RAG 2.0",
    desc: "Intelligent knowledge engine for accurate, context-aware responses.",
    to: "/platform/rag",
  },
  {
    dot: "#9E8CFF",
    kicker: "Knowledge",
    title: "Knowledge Cloud",
    desc: "One governed knowledge base — accurate, controlled, always current.",
  },
  {
    dot: "#D1E486",
    kicker: "Studio",
    title: "Synergy Studio",
    tag: "New",
    desc: "Build and deploy AI agents — no code needed.",
  },
];

export const PLATFORM_CAPABILITIES: MenuItem[] = [
  { title: "AI Mission Control", desc: "Real-time smart dispatch centre" },
  { title: "Human + AI", desc: "Seamless AI–human handoff" },
  { title: "Analytics", desc: "Deep business insights & VOC analysis" },
  { title: "Persona Analysis", desc: "User profiling & personalised service" },
];

/** Two use cases and four industries. */
export const SOLUTION_USE_CASES: FeaturedItem[] = [
  {
    dot: "#EBA753",
    kicker: "Customer service",
    title: "Scale & Stabilise Customer Support",
    desc: "Absorb the repetitive volume; keep people on the judgement calls.",
    to: "/solution/customer-support",
  },
  {
    dot: "#FF9ED8",
    kicker: "Customer support",
    title: "Employee Experience, Designed for Focus",
    desc: "Answer the everyday questions so teams stay on the work that matters.",
  },
];

export const SOLUTION_INDUSTRIES: MenuItem[] = [
  { title: "Financial", desc: "Payments, KYC and compliant handover" },
  { title: "Web3 & Gaming", desc: "22-language support at production load" },
  { title: "Consumer Tech", desc: "Orders, accounts and subscriptions at scale" },
  { title: "Other Industries", desc: "Tell us about your scenario" },
];

/** Nav items that stand on their own, plus the company pages under them. */
export const COMPANY_ITEMS: MenuItem[] = [
  { title: "Pricing", desc: "Plans and the volume calculator", to: "/pricing" },
  { title: "Company Hub", desc: "News, events and the blog" },
  { title: "About us", desc: "Who builds Synergy" },
  { title: "Contact us", desc: "Talk to the team" },
];

/** The footer mirrors the nav: every section, in the nav's order. */
export const FOOTER_COLUMNS: Array<{ title: string; items: MenuItem[] }> = [
  { title: "Why Synergy", items: WHY_SYNERGY_ITEMS },
  { title: "Platform", items: [...PLATFORM_PRODUCTS, ...PLATFORM_CAPABILITIES] },
  { title: "Solution", items: [...SOLUTION_USE_CASES, ...SOLUTION_INDUSTRIES] },
  { title: "Company", items: COMPANY_ITEMS },
];
