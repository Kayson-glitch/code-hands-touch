/**
 * Copy for the corporate homepage and the product demo page.
 *
 * Almost every string is lifted from fakehunter.co as it ships today — the i18n
 * catalogue for the localised blocks, the compiled bundle for the ones that are
 * still hard-coded there.
 *
 * The exceptions are marked `authored` and were written for this build, in the
 * two places where the original copy was not doing its job: the hero, which led
 * with the company's own name instead of what the product is for, and a handful
 * of section subtitles that repeated a card's text back verbatim. Authored
 * strings never make a claim the rest of the site does not already make.
 *
 * The deep product page lives in `content.ts` and renders at
 * /fakehunter/solution, mirroring the site's own /about route.
 */

/**
 * The hero. Authored.
 *
 * A first-time visitor arrives knowing nothing, and the wordmark is already in
 * the header — so the headline spends itself on the decision the product is
 * bought to make, and the subtitle names the three things it reads. The Caltech
 * line is a credential, not a value proposition, so it sits at credential size.
 */
export const homeHero = {
  badge: "Payment-proof forensics",
  titleLead: "Rule on every payment proof",
  titleAccent: "before the money moves.",
  subtitle:
    /* Balanced line breaks must not split the product's name. */
    "Payment screenshots, bank statements, screen recordings. FakeHunter\u00A0AI reads each one the way a forensic examiner would — pixels, document structure, timeline — and returns a verdict with its reasons in under a second.",
  credential: "Powered by Caltech Research Institute computer vision",
  primaryCta: "Book a Demo",
  /* The live site labels this "Fast Try", which is the name of its batch
     workspace — a different surface. This one goes to the demo, so it says so. */
  secondaryCta: "Product Demo",
  /** Readouts under the fold line — the sweep's own telemetry. */
  telemetry: [
    {
      label: "Modalities",
      value: 3,
      decimals: 0,
      prefix: "",
      suffix: "",
      detail: "Image · PDF · Video",
    },
    { label: "Verdict", value: 100, decimals: 0, prefix: "<", suffix: "ms", detail: "API latency" },
    {
      label: "Accuracy",
      value: 93.8,
      decimals: 1,
      prefix: "",
      suffix: "%",
      detail: "Overall recognition",
    },
  ],
} as const;

/**
 * The Product Demo window.
 *
 * On the live site this is a real uploader behind an invitation code. Here it
 * accepts a drop to show the interaction, and ships three redacted specimens so
 * a first-time visitor can watch a verdict resolve without having a file to
 * hand. Every finding below is a real one, taken from the case files the
 * product page publishes.
 */
export const detector = {
  label: "Product Demo",
  title: "Product Demo",
  heading: "Drop a file in and watch the engine rule on it",
  description:
    "Queue, inference, probability, verdict, reasons. The same five things the API returns, in the same order, as fast as it returns them.",
  dragDrop: "Click or drag files here",
  formats: "JPG/PNG ≤10MB · PDF ≤20MB and 10 pages · MP4 ≤100MB and 2 minutes",
  analyzing: "Analyzing...",
  uploadButton: "Upload File",
  initiateDetection: "Initiate Detection",
  tryAgain: "Try Again",
  newUpload: "Clear and upload another file",
  fakeProbability: "Fake Probability",
  forged: "Forged",
  authentic: "Authentic",
  analysisResults: "Analysis Results",
  queueMs: "Queue Ms",
  inferenceMs: "Inference Ms",
  returns: "Returns",
  specimensTerm: "Specimens",
  returnFields:
    "Fake probability against the decision threshold, the verdict, the reasons behind it, and the queue and inference time it took.",
  specimenLabel: "Or run a redacted specimen",
  runAnother: "Run another",
  redacted: "Sample · redacted",
  localOnly: "Local only · nothing uploaded",
  stages: ["Queued", "Routing", "Detecting", "Fusing", "Verdict"],
  specimens: [
    {
      id: "image",
      kind: "IMG",
      name: "comprobante_4412.png",
      meta: "PNG · 1080×2160 · 412 KB",
      score: 96.4,
      forged: true,
      queueMs: 38,
      inferenceMs: 812,
      analysis:
        "Incomplete party details: the sender is missing the CUIL/CUIT tax ID line, which genuine receipts carry for both sender and recipient. The operation number is 6 alphanumeric characters; the official format is 10 digits.",
    },
    {
      id: "pdf",
      kind: "PDF",
      name: "statement_apr.pdf",
      meta: "PDF · 6 pages · 1.2 MB",
      score: 91.2,
      forged: true,
      queueMs: 44,
      inferenceMs: 1_940,
      analysis:
        "On the forgery the final balance carries one decimal place while every other line carries two, and the running total does not reconcile.",
    },
    {
      id: "video",
      kind: "MP4",
      name: "transfer_screen.mp4",
      meta: "MP4 · 0:41 · 25 fps",
      score: 88.7,
      forged: true,
      queueMs: 52,
      inferenceMs: 3_260,
      segment: { start: 23, end: 25, duration: 41 },
      analysis:
        "Screen recording spliced: the finger position jumps between frames at 0:24. The temporal model reads the logic across surrounding frames, where no single still gives anything away, and marks the start and end of the suspect segment.",
    },
    {
      id: "genuine",
      kind: "PDF",
      name: "statement_mar.pdf",
      meta: "PDF · 6 pages · 1.1 MB",
      score: 3.1,
      forged: false,
      queueMs: 41,
      inferenceMs: 1_705,
      analysis:
        "The genuine statement keeps two decimals throughout and stays consistent line by line — the structure, format and logic checks all land together.",
    },
  ],
  /** Rendered into the suspicious-segment line for the video specimen. */
  suspiciousSegment: (start: number, end: number, duration: number) =>
    `Suspicious Segment: ${start}s ~ ${end}s (Total Duration: ${duration}s)`,
  /**
   * The live engine sits behind an invitation code on production, so a file you
   * drop in here lands on the same gate it would there rather than on a made-up
   * verdict. The specimens above are published case files, which is why those
   * can run all the way through.
   */
  invite: {
    titlePrefix: "Get started with",
    placeholder: "Enter invitation code",
    submitLabel: "Submit invitation code",
    helper: "Please enter the exclusive invitation code provided by the administrator",
    note: "Your file never left this browser. Book a demo and we will run it on your own samples.",
  },
  errors: {
    format: "Unsupported file. Upload JPG, PNG, PDF, or MP4.",
    imageSize: "Images must be 10MB or smaller.",
    pdfSize: "PDF files must be 20MB or smaller.",
    videoSize: "Videos must be 100MB or smaller.",
  },
} as const;

export const wallOfLove = {
  index: "04",
  label: "Wall Of Love",
  title: "Wall of Love.",
  description:
    "Risk, credit and finance teams in the markets where payment-proof forgery is worst.",
  quotes: [
    {
      id: "aisha",
      name: "Aisha K.",
      role: "Finance Operations",
      before:
        "In South and Southeast Asian markets, sophisticated account statement forgery was a major hurdle. FakeHunter",
      highlight: "AI's guaranteed 92%+ interception",
      after:
        "instantly blocks fraud before payment, significantly relieving risk teams and minimizing costly misjudgments.",
    },
    {
      id: "michael",
      name: "Michael T.",
      role: "Risk Operations",
      before:
        "Massive claims from manual review errors were the largest source of bad debt. After deploying FakeHunter AI, our bad debt rate",
      highlight: "dropped 90% in the pilot.",
      after:
        "Finance can now forecast risk costs accurately. This is not a technical upgrade, but direct bottom-line growth.",
    },
    {
      id: "david",
      name: "David L.",
      role: "Credit Review Officer",
      before:
        "FakeHunter AI's proprietary model for Payment Credentials and Account Statements is highly effective. The API is fast,",
      highlight: "with latency under 100ms.",
      after:
        "The Explainable Verdict package supports our legal and compliance auditing needs, and integration was seamless.",
    },
    {
      id: "priya",
      name: "Priya R.",
      role: "Operations Manager",
      before: "FakeHunter AI balances high transaction volume with regional compliance",
      highlight: "in South Asia while supporting GDPR-level anonymization.",
      after: "This gives us the confidence to accelerate growth without sacrificing risk quality.",
    },
    {
      id: "chen",
      name: "Chen W.",
      role: "Junior Risk Officer",
      before:
        "As a fast-growing lending platform, we cannot afford a large manual auditing team. FakeHunter AI provides top-tier computer vision protection",
      highlight: "at a fraction of the cost.",
      after: "It has reduced losses and improved efficiency and trust in our client onboarding.",
    },
  ],
} as const;

export const techSolution = {
  index: "01",
  label: "Technology & Solution",
  titleTop: "TECHNOLOGY",
  titleAccent: "& SOLUTION",
  /* Authored. The site repeats the first card's description here, which leaves
     the section itself unexplained and the card redundant. This says what the
     set of cards has in common instead. */
  subtitle:
    "Four forensic reads — pixels, layout, document structure and time — running inside a single millisecond-scale call.",
  /** Where the same subject is treated at full depth. */
  more: { label: "The three detection lines in full", href: "/fakehunter/solution#technology" },
  cards: [
    {
      id: "image",
      title: "Image Forensics",
      description: "Pixel-Precision Analysis to Identify Digital Forgeries.",
      glyph: "pixels",
    },
    {
      id: "consistency",
      title: "Visual Consistency Verification",
      description: "Pixel-level comparative detection to identify image tampering and splicing.",
      glyph: "overlay",
    },
    {
      id: "structure",
      title: "Document Structure Validation",
      description: "Template and Semantic Verification to Ensure Document Integrity.",
      glyph: "tree",
    },
    {
      id: "video",
      title: "Video Frame Forensics",
      description: "Identifying 'Screen Re-capture' and 'Playback' Manipulation.",
      glyph: "frames",
    },
    {
      id: "latency",
      title: "Millisecond Security. Comprehensive Scope.",
      description:
        "Delivering end-to-end protection with real-time, millisecond speed and full fraud risk coverage.",
      glyph: "latency",
      wide: true,
    },
  ],
} as const;

export const accurate = {
  index: "02",
  label: "Why Are We Most Accurate",
  titleLine1: "why are we",
  titleWhite: "most",
  titleHighlight: "accurate",
  titleTail: "?",
  /* Authored, lightly: the site's own sentence says the right thing in a
     grammar that stumbles on the way out. Same claim, read aloud cleanly. */
  subtitle:
    "Treat any AI detector with caution until its accuracy has been examined in depth and verified against third-party studies. Here is what ours rests on.",
  cards: [
    {
      id: "pretraining",
      title: "Domain-Specific Pretraining & Fine-Tuning",
      description:
        "Pretrained on payment receipts and bank statements, FakeHunter AI masters layouts, fonts, and stamps. Targeted fine-tuning with limited labels accelerates convergence and adaptation to new patterns.",
      glyph: "corpus",
    },
    {
      id: "benchmark",
      title: "Multimodal Vision Architecture with Continuous Benchmarking",
      description:
        "Proprietary multimodal vision architecture models visual signals, layout, and semantic consistency. Releases are benchmarked against OpenAI, Anthropic, and Meta using identical datasets and criteria.",
      glyph: "benchmark",
    },
    {
      id: "adversarial",
      title: "Adversarial KYC Data Training",
      description:
        "Adversarial KYC datasets from real-world fraud—including manipulation, template reuse, OCR interference, and compression artifacts—allow FakeHunter AI to detect sophisticated forgeries that generic vision models miss.",
      glyph: "adversarial",
    },
  ],
} as const;

/**
 * The four numbers, each drawn as well as stated.
 *
 * The site gives every card an adjective for a heading — "Sub-Second",
 * "Industry-Leading", "Significant" — and then spends the sentence underneath
 * saying the adjective again. The measurement is the heading here, and the
 * sentence is where the number gets its context.
 */
export const performance = {
  index: "03",
  label: "Sustained Performance",
  titleTop: "Sustained",
  titleAccent: "Performance",
  /* The site closes this title with "We Make It Possible." and subtitles it
     "Multimodal Payment Voucher Verification Solution." — a slogan and a noun
     phrase, neither of which says anything about the four numbers underneath.
     Dropped in favour of one line about where the numbers come from, which is
     the only question a reader has at this point. Authored. */
  subtitle:
    "Measured on live payment traffic across all three detection lines, not on a curated benchmark set.",
  cards: [
    {
      id: "hit-rate",
      value: 92.11,
      decimals: 2,
      unit: "%",
      metric: "Fraud Detection Hit Rate",
      description: "Your first line of defence: sub-second interception on every request.",
      visual: "bars",
    },
    {
      id: "accuracy",
      value: 93.8,
      decimals: 1,
      unit: "%",
      metric: "Overall Recognition Accuracy",
      description: "Across all three detection lines, on genuine and forged samples mixed.",
      visual: "gauge",
    },
    {
      id: "region",
      value: 92,
      decimals: 0,
      prefix: "+",
      unit: "%",
      metric: "South/Southeast Asia Recognition Rate",
      description: "Held in the markets where forgery templates circulate fastest.",
      visual: "stability",
    },
    {
      id: "bad-debt",
      value: 92,
      decimals: 0,
      prefix: "+",
      unit: "%",
      metric: "Reduction in Bad Debt Rate",
      description: "What risk teams report after a pilot, read straight off the bottom line.",
      visual: "decline",
    },
  ],
  /** Where the same subject is treated at full depth. */
  more: { label: "How these were measured", href: "/fakehunter/solution#results" },
} as const;

export const secure = {
  index: "05",
  label: "Start Now",
  badge: "Start Now",
  titlePrefix: "LET",
  titleHighlight: "FAKEHUNTER.AI",
  titleSuffix: "SECURE YOUR BUSINESS.",
  /* The closing pair sends you to the two things there are to do: try it, or
     read the case in full. "Book a Demo" already sits in the header. */
  demoCta: "Try the product demo",
  secondaryCta: "Read the product solution",
  cards: [
    {
      id: "accuracy",
      value: 85.8,
      decimals: 1,
      unit: "%",
      /* The site labels this "Recognition Accuracy", which reads as a second,
         lower answer to the 93.8% stated two sections up. It is the image line
         measured on its own — 85.86% on the solution page — so it says which
         line it belongs to and the two numbers stop arguing. */
      title: "Image-Line Accuracy",
      description: "Precision detection for even the most advanced forgeries.",
      button: "See the measurements",
    },
    {
      id: "roi",
      value: 10,
      decimals: 0,
      unit: "×",
      title: "Return on Investment",
      titleNote: "(ROI)",
      featured: true,
    },
    {
      id: "loss",
      value: 65,
      decimals: 0,
      unit: "%",
      title: "Loss Reduction",
      note: "Wall of Love.",
      description: "Turning risk management into a strategic advantage.",
    },
  ],
} as const;

/**
 * Homepage anchors, in page order — drives the scroll rail and mobile sheet.
 *
 * The live site opens on testimonials, before it has said what the product is.
 * Here the argument runs first — what it does, why it is accurate, what it
 * measures — and the customers speak last, to a reader who now knows what they
 * are agreeing with. It also puts the quotes directly above the closing CTA,
 * where they do the most work.
 */
export const homeSections = [
  { id: "hero", index: "00", label: "Top" },
  { id: "technology", index: techSolution.index, label: techSolution.label },
  { id: "accuracy", index: accurate.index, label: accurate.label },
  { id: "performance", index: performance.index, label: performance.label },
  { id: "voices", index: wallOfLove.index, label: wallOfLove.label },
  { id: "start", index: secure.index, label: secure.label },
] as const;
