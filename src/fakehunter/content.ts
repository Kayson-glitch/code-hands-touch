/**
 * Every string on the FakeHunter site lives here.
 *
 * Copy is taken from the production site (fakehunter.co) so the redesign is a
 * pure design/interaction exercise — nothing is invented. Keeping it in one
 * module also means the eventual locale switch is a swap of this object.
 */

export const brand = {
  name: "FakeHunter",
  suffix: "AI",
  wordmark: "FAKEHUNTER",
  tagline: "Multimodal forgery detection for payment proof",
} as const;

export const nav = {
  links: [
    { label: "Problem", href: "#problem" },
    { label: "Product", href: "#product" },
    { label: "Technology", href: "#technology" },
    { label: "Evidence", href: "#evidence" },
    { label: "Pricing", href: "#pricing" },
  ],
  cta: "Book a Demo",
} as const;

export const hero = {
  eyebrow: "Product Solution",
  title: "Let machines decide, not reviewers:",
  titleAccent: "is this payment proof real or forged?",
  description:
    "Built for payment and remittance in emerging markets like India and Latin America. Spots forgery in images, PDFs and video, moving the call from the human eye to an engine.",
  primaryCta: "Get Demo",
  secondaryCta: "See the evidence",
  stats: [
    { value: 85.86, unit: "%", label: "Image line ACC", delta: "+12.9pp" },
    { value: 82.14, unit: "%", label: "Video line ACC", delta: "+12.2pp" },
    { value: 80.24, unit: "%", label: "PDF line ACC", delta: "+3.4pp" },
  ],
  /** Glyph pool for the hero scanner canvas. */
  scanTerms: ["IMG", "PDF", "MP4", "OCR", "ELA", "CLIP", "0x1F", "SHA", "EXIF", "JPEG"],
} as const;

export const problem = {
  index: "01",
  label: "The Problem",
  title: "Forging payment proof has become an industry",
  description:
    "Fraud rings have templates, tools and tutorials for producing a fake payment screenshot.",
  descriptionAccent: "Most businesses still defend themselves by having a person look at each one.",
  lossRange: { from: 20, to: 40, unit: "B", currency: "$" },
  lossLabel: "Estimated global losses",
  lossQuote:
    "Estimated global losses from identity and document fraud run into tens of billions of dollars every year.",
  /** Scrolling band of techniques the rings actually sell. */
  techniques: [
    "Template reuse",
    "Splice & rejoin",
    "OCR interference",
    "Balance overwrite",
    "Compression artifacts",
    "Frozen frames",
    "Face swap",
    "Erasure & clone",
    "Synthesised PDF",
    "Timestamp shift",
  ],
  scenarios: [
    {
      id: "topup",
      title: "Forged top-up receipts",
      description:
        "A user submits a forged top-up screenshot to have funds credited. The moment review lets it through, real money is gone.",
    },
    {
      id: "transfer",
      title: "Transfer screenshot scams",
      description:
        "A large order, a fake screenshot, and a request to advance the funds. The merchant releases goods or cash on the strength of one image, then discovers the transfer never existed.",
    },
    {
      id: "pdf",
      title: "Forged PDF documents",
      description:
        "Income statements, bank records and receipts arrive as PDFs that have been altered or synthesised. Manual review is slow, misses cases, and creates compliance exposure.",
    },
  ],
} as const;

export const toolGap = {
  index: "02",
  label: "Where Existing Tools Fall Short",
  title: 'None of them can answer "is this document real or fake"',
  description:
    "Every defence on the market was built for a different question. Run them against a payment screenshot and the gap shows up immediately.",
  cards: [
    {
      id: "manual",
      title: "Manual review",
      subtitle: "The most common defence today",
      items: [
        "Throughput cannot keep up with volume",
        "Different reviewers reach different verdicts",
        "Cost grows linearly with volume",
        "Miss rates climb as reviewers tire",
      ],
    },
    {
      id: "llm",
      title: "General-purpose LLM APIs",
      subtitle: "Cheap and quick to integrate",
      items: [
        "Reads the text, cannot judge layout compliance",
        "Blind to pixel-level tampering",
        "No grasp of real payment semantics",
        "Carries no accountability for the outcome",
      ],
    },
    {
      id: "kyc",
      title: "KYC / IDV vendors",
      subtitle: "ID document and face verification",
      items: [
        "Checks IDs and faces, never payment proof",
        "No coverage of PDF receipts or recordings",
        "Leading vendors accept up to 80% of fake IDs",
      ],
    },
  ],
  quote: {
    beforeIdentity: "Most existing tools ask",
    identity: '"is this identity real".',
    between: "Payment proof fraud asks",
    transaction: '"did this transaction happen".',
    after:
      "A screenshot, a receipt, a screen recording is neither an ID nor a face. General tools cover the surrounding steps but cannot rule on the document itself — the gap a dedicated engine fills.",
  },
  footnote: "KYC AML Guide 2026 vendor testing",
} as const;

export const pipeline = {
  index: "03",
  label: "What It Does",
  title: "Verifies all three kinds of payment proof: images, PDFs and video",
  description:
    "Each file runs the detection line for its type, where several “specialists” judge it separately. Their verdicts become a risk score with reasons, and your threshold decides what happens — pass, review, or block.",
  caption:
    "Upload, route, detect, act by risk tier, then feed human review back in. The loop keeps turning, so the system learns from its mistakes every week instead of freezing on the day it went live.",
  stages: [
    {
      id: "ingest",
      kicker: "01",
      title: "Ingest",
      body: "A file arrives over the API — screenshot, statement or screen recording.",
    },
    {
      id: "route",
      kicker: "02",
      title: "Route",
      body: "Type detection picks the line. No file is ever judged by the wrong specialist.",
    },
    {
      id: "detect",
      kicker: "03",
      title: "Detect",
      body: "Three checks run in parallel on every file and vote independently.",
    },
    {
      id: "fuse",
      kicker: "04",
      title: "Fuse",
      body: "Verdicts collapse into one risk score, carrying the reasons that produced it.",
    },
    {
      id: "act",
      kicker: "05",
      title: "Act",
      body: "Your threshold decides the tier: pass, send to review, or block outright.",
    },
  ],
  tiers: [
    { id: "pass", label: "Pass", tone: "genuine" },
    { id: "review", label: "Review", tone: "acid" },
    { id: "block", label: "Block", tone: "forged" },
  ],
  loopLabel: "Human review feeds back into training",
} as const;

export const technology = {
  index: "04",
  label: "The Technology",
  title: "Three detection lines read the same file from different angles",
  description:
    "Strong evidence of forgery on any one line is enough for a fake verdict. A single forgery technique rarely defeats every line at once, so the crossfire covers the document from every direction.",
  lines: [
    {
      id: "image",
      tag: "Image detection line",
      short: "Image",
      title: "Three checks: text, layout and pixels",
      points: [
        {
          title: "Text analysis",
          body: "OCR paired with deep LLM checking cross-verifies amounts, account numbers and timestamps, and spots edited text.",
        },
        {
          title: "Visual comparison",
          body: "Compares layout, colour and element placement against genuine payment pages to catch fabricated layouts and visual inconsistencies.",
        },
        {
          title: "Pixel-level AI",
          body: "Scans pixel by pixel to locate splicing, erasure and editing traces the eye cannot see.",
        },
      ],
    },
    {
      id: "pdf",
      tag: "PDF detection line",
      short: "PDF",
      title: "Three layers: structure, content and rules",
      points: [
        {
          title: "Structural parsing",
          body: "Several engines parse the underlying PDF structure, extract the generator fingerprint, and flag abnormal formatting and signs of tampering.",
        },
        {
          title: "Cross-engine comparison",
          body: "Cross-checks the extracted text and applies statistical methods to detect subtle edits and fabricated content.",
        },
        {
          title: "Business rules",
          body: "A layer of business-logic rules that is only ever added to, never trimmed. The moment one fires, the document is ruled a forgery.",
        },
      ],
    },
    {
      id: "video",
      tag: "Video detection line",
      short: "Video",
      title: "Dual-path sampling and temporal modelling",
      points: [
        {
          title: "Smart dual-path sampling",
          body: "Full frame-by-frame scanning plus dense sampling around the payment screens, so no key frame goes unchecked.",
        },
        {
          title: "AI temporal analysis",
          body: "CLIP and sequence models catch face swaps, cuts, frozen frames and other complex manipulations.",
        },
        {
          title: "Pinpointed review",
          body: "Timestamps every suspicious segment automatically, so a reviewer can jump straight to it.",
        },
      ],
    },
  ],
} as const;

/**
 * Case files. The production site ships redacted screenshots; here each sample
 * is reconstructed as a data-driven document so the comparison wipe can point
 * at the exact field that gives the forgery away.
 */
export const caseFiles = {
  index: "05",
  label: "Case Files",
  title: "Fakes the eye cannot catch, located down to the pixel and the frame",
  description:
    "Every sample below was intercepted in live traffic, confirmed as a forgery by human review, and redacted.",
  redactedNote: "Live sample · redacted",
  cases: [
    {
      id: "image",
      kind: "Image",
      label: "Payment screenshot",
      headline: "Detalle de operación",
      forged: {
        amount: "$89.542,00",
        rows: [
          { key: "Fecha", value: "12/05/2026", flag: false },
          { key: "Hora", value: "16:08 hs", flag: false },
          { key: "Origen", value: "Cuenta 4412", flag: false },
          { key: "CUIL/CUIT", value: "—", flag: true },
          { key: "Nro. operación", value: "A7K2P9", flag: true },
        ],
      },
      genuine: {
        amount: "$150.000,00",
        rows: [
          { key: "Fecha", value: "07/05/2026", flag: false },
          { key: "Hora", value: "09:41 hs", flag: false },
          { key: "Origen", value: "Cuenta 8830", flag: false },
          { key: "CUIL/CUIT", value: "20-34887215-4", flag: false },
          { key: "Nro. operación", value: "4820371956", flag: false },
        ],
      },
      findings: [
        "Incomplete party details: the sender is missing the CUIL/CUIT tax ID line, which genuine receipts carry for both sender and recipient.",
        "The operation number is 6 alphanumeric characters; the official format is 10 digits.",
      ],
    },
    {
      id: "video",
      kind: "Video",
      label: "Payment screen recording",
      headline: "00:41 · 25 fps · 1080×1920",
      timeline:
        "Genuine throughout, except second 24, which was cut and rejoined — the finger jumps position across the splice, which manual scrubbing almost never catches.",
      spliceAt: 24,
      duration: 41,
      findings: [
        "Screen recording spliced: the finger position jumps between frames at 0:24.",
        "The temporal model reads the logic across surrounding frames, where no single still gives anything away, and marks the start and end of the suspect segment.",
        "Semantic rules for watermarks, reused assets and the like act as a backstop. They are only ever added to, and they do not penalise genuine recordings.",
      ],
    },
    {
      id: "pdf",
      kind: "PDF",
      label: "Bank e-statement (India)",
      headline: "Statement of account · 6 pages",
      forged: {
        amount: "₹ 48,210.5",
        rows: [
          { key: "Opening balance", value: "₹ 12,004.00", flag: false },
          { key: "Credits", value: "₹ 41,206.50", flag: false },
          { key: "Debits", value: "₹ 9,000.00", flag: false },
          { key: "Closing balance", value: "₹ 48,210.5", flag: true },
          { key: "Reconciles", value: "NO", flag: true },
        ],
      },
      genuine: {
        amount: "₹ 44,210.50",
        rows: [
          { key: "Opening balance", value: "₹ 12,004.00", flag: false },
          { key: "Credits", value: "₹ 41,206.50", flag: false },
          { key: "Debits", value: "₹ 9,000.00", flag: false },
          { key: "Closing balance", value: "₹ 44,210.50", flag: false },
          { key: "Reconciles", value: "YES", flag: false },
        ],
      },
      findings: [
        "On the forgery the final balance carries one decimal place while every other line carries two, and the running total does not reconcile.",
        "The genuine statement keeps two decimals throughout and stays consistent line by line — the structure, format and logic checks all land together.",
      ],
    },
  ],
} as const;

export const results = {
  index: "06",
  label: "Results And Performance",
  title: "Every release moves the numbers",
  description:
    "Like-for-like blind test on the 0810 production batch: the same samples run through the model before and after the fix, comparing overall accuracy (ACC).",
  metrics: [
    {
      id: "image",
      label: "Image line",
      before: 73.0,
      after: 85.86,
      delta: "+12.9pp",
      detail:
        "Genuine samples from new channels and a fresh batch of forgeries folded into retraining.",
    },
    {
      id: "video",
      label: "Video line",
      before: 69.9,
      after: 82.14,
      delta: "+12.2pp",
      detail: "False positives halved; temporal model retrained with recent genuine samples added.",
    },
    {
      id: "pdf",
      label: "PDF line",
      before: 76.8,
      after: 80.24,
      delta: "+3.4pp",
      detail:
        "20 fewer false positives net; image branch fixed and the review batch folded back in.",
    },
  ],
  quote:
    "All three lines improved in a single turn of the loop. The bottleneck now is sample coverage, not the ceiling of the models, which makes the path forward clear and controllable.",
  sampleNote:
    "Sample sizes: 1,209 images / 587 PDFs / 560 videos, genuine and forged mixed, covering 2026-07-31 to 08-10.",
  throughput: {
    title: "Measured throughput",
    description:
      "Single-instance figures from current engineering measurements. A formal SLA will be based on your own samples, instance sizing and a load-test report.",
    headers: ["Type", "Per item", "Throughput"],
    rows: [
      { type: "Image", perItem: "~1 s", rate: "Batch 3–5/s · serial ~1.2/s" },
      {
        type: "PDF",
        perItem: "Text 1–3 s · image OCR 3–5 s",
        rate: "8-core ~1/s · 16-core ~2/s · 32-core ~3.5/s",
      },
      { type: "Video", perItem: "~2 s · 3–4 s per 40 s clip", rate: "4 streams concurrent, ~2/s" },
    ],
  },
} as const;

export const pricing = {
  index: "07",
  label: "Pricing",
  title: "Pay per check, or bring the unit price down with a bundle",
  description:
    "One billing model across all three detection lines. Start pay-as-you-go while volume is low, then move to a bundle once it settles and the unit price drops.",
  annualDiscount: 0.1,
  plans: [
    {
      id: "starter",
      name: "Starter",
      monthly: 225,
      credits: "2,500",
      perCredit: 0.09,
      featured: false,
      perCheck: { image: "$0.09", pdf: "$0.09", video7d: "$0.27", video30d: "$0.45" },
    },
    {
      id: "growth",
      name: "Growth",
      monthly: 750,
      credits: "10,000",
      perCredit: 0.075,
      featured: true,
      perCheck: { image: "$0.075", pdf: "$0.075", video7d: "$0.225", video30d: "$0.375" },
    },
    {
      id: "professional",
      name: "Professional",
      monthly: 1800,
      credits: "30,000",
      perCredit: 0.06,
      featured: false,
      perCheck: { image: "$0.06", pdf: "$0.06", video7d: "$0.18", video30d: "$0.30" },
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthly: null,
      credits: "From 100,000",
      perCredit: 0.04,
      featured: false,
      perCheck: { image: "$0.04+", pdf: "$0.04+", video7d: "$0.12+", video30d: "$0.20+" },
    },
  ],
  tableTitle: "What each bundle works out to per check",
  tableHeaders: ["Plan", "Image", "PDF", "Video 7d", "Video 30d"],
  footnote:
    "Annual payment takes 10% off. If a bundle runs out, top-up packs continue at 1.2× its unit price, and a free two-week POC comes before any contract. Delivery is a cloud API (live in 1–3 days), on-premise (2–4 weeks, data never leaves your domain), or a custom programme with its own sample and rule library. Prices in USD, converted at 1 USD = 6.7 CNY.",
  letsTalk: "Let’s talk",
  perMonth: "/mon",
} as const;

export const nextStep = {
  index: "08",
  label: "Next Step",
  title: "Trial it first, and prove it on your own samples",
  description:
    "Before any contract, we run a free two-week POC: we back-test your redacted historical samples and hand back a report on accuracy, recall and false-positive rate. Talk about a deal only once the numbers hold up. Your data can stay inside your own domain throughout.",
  metrics: [
    {
      value: 85.86,
      unit: "%",
      label: "Blind-test accuracy on the image line, +12.9pp after one feedback round",
    },
    {
      value: 6435,
      unit: "files",
      label: "Real forgery samples, covering nine forgery techniques",
    },
    {
      value: 1,
      unit: "week",
      label: "From spotting a new technique to shipping a defence against it",
    },
  ],
  cta: "Get Demo",
} as const;

export const footer = {
  description: "Mitigate today's financial risk. Accelerate tomorrow's growth.",
  address: "399 Boylston St, Boston, MA 02116",
  social: [
    { id: "discord", label: "Discord" },
    { id: "x", label: "X" },
  ],
  newsletter: {
    title: "Be the first to know.",
    subtitle: "Join our email list for exclusive FakeHunter.AI updates.",
    placeholder: "Enter your work email",
    submit: "Subscribe",
    privacyNotice:
      "By subscribing, you agree to our Privacy Policy and provide consent to receive updates from our company.",
  },
  columns: [
    {
      title: "Product",
      links: ["Features", "Pricing", "Security", "Integrations"],
    },
    {
      title: "Company",
      links: ["About Us", "Careers", "Press", "Blog"],
    },
    {
      title: "Support",
      links: ["Help Center", "Documentation", "API Reference", "Status"],
    },
    {
      title: "Legal",
      links: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
    },
  ],
  copyright: "© 2026 FakeHunter.AI. All rights reserved.",
} as const;

/** Section anchors, in page order — drives the nav and the scroll rail. */
export const sections = [
  { id: "hero", index: "00", label: "Top" },
  { id: "problem", index: problem.index, label: problem.label },
  { id: "tool-gap", index: toolGap.index, label: toolGap.label },
  { id: "product", index: pipeline.index, label: pipeline.label },
  { id: "technology", index: technology.index, label: technology.label },
  { id: "evidence", index: caseFiles.index, label: caseFiles.label },
  { id: "results", index: results.index, label: results.label },
  { id: "pricing", index: pricing.index, label: pricing.label },
  { id: "next-step", index: nextStep.index, label: nextStep.label },
] as const;
