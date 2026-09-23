/**
 * Copy for the corporate homepage.
 *
 * Every string is lifted from fakehunter.co as it ships today — the i18n
 * catalogue for the localised blocks, the compiled bundle for the ones that are
 * still hard-coded there. The redesign changes how this reads on screen and
 * what it does when you touch it; it does not change what it says.
 *
 * The deep product page lives in `content.ts` and renders at
 * /fakehunter/solution, mirroring the site's own /about route.
 */

export const homeNav = {
  links: [
    { label: "Demo", href: "#demo" },
    { label: "Technology", href: "#technology" },
    { label: "Accuracy", href: "#accuracy" },
    { label: "Performance", href: "#performance" },
  ],
  solution: { label: "Product Solution", href: "/fakehunter/solution" },
  cta: "Book a Demo",
  fastTry: "Fast Try",
} as const;

export const homeHero = {
  badge: "Built on FakeHunter AI",
  title: "FAKEHUNTER",
  titleSuffix: "AI",
  subtitle:
    "A Multimodal AI Detection System Powered by Caltech Research Institute's Leading Computer Vision Algorithms.",
  primaryCta: "Book a Demo",
  secondaryCta: "Fast Try",
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
  index: "01",
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
  index: "02",
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
  index: "03",
  label: "Technology & Solution",
  titleTop: "TECHNOLOGY",
  titleAccent: "& SOLUTION",
  subtitle: "Pixel-Precision Analysis to Identify Digital Forgeries.",
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
  index: "04",
  label: "Why Are We Most Accurate",
  titleLine1: "why are we",
  titleWhite: "most",
  titleHighlight: "accurate",
  titleTail: "?",
  subtitle:
    "AI Detectors without an in-depth analysis verified by third party studies should be used with caution.",
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

export const performance = {
  index: "05",
  label: "Sustained Performance",
  titleTop: "Sustained",
  titleAccent: "Performance",
  titleTail: "We Make It Possible.",
  subtitle: "Multimodal Payment Voucher Verification Solution.",
  cards: [
    {
      id: "hit-rate",
      value: 92.11,
      decimals: 2,
      unit: "%",
      metric: "Fraud Detection Hit Rate",
      title: "Sub-Second",
      description: "Your first line of defense: Sub-second interception for every request.",
      visual: "bars",
    },
    {
      id: "accuracy",
      value: 93.8,
      decimals: 1,
      unit: "%",
      metric: "Overall Recognition Accuracy",
      title: "Industry-Leading",
      description: "The industry-leading performance your business deserves.",
      visual: "gauge",
    },
    {
      id: "region",
      value: 92,
      decimals: 0,
      prefix: "+",
      unit: "%",
      metric: "South/Southeast Asia Recognition Rate",
      title: "Proven Stability",
      description: "Scaling growth with proven stability in emerging markets.",
      visual: "stability",
    },
    {
      id: "bad-debt",
      value: 92,
      decimals: 0,
      prefix: "+",
      unit: "%",
      metric: "Reduction in Bad Debt Rate",
      title: "Significant",
      description: "Hardening your defenses with significant risk mitigation impact.",
      visual: "decline",
    },
  ],
} as const;

export const secure = {
  index: "06",
  label: "Start Now",
  badge: "Start Now",
  titlePrefix: "LET",
  titleHighlight: "FAKEHUNTER.AI",
  titleSuffix: "SECURE YOUR BUSINESS.",
  cta: "Book a Demo",
  secondaryCta: "Read the product solution",
  cards: [
    {
      id: "accuracy",
      value: 85.8,
      decimals: 1,
      unit: "%",
      title: "Recognition Accuracy",
      description: "Precision detection for even the most advanced forgeries.",
      button: "Loss Reduction",
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

/** Homepage anchors, in page order — drives the nav and the scroll rail. */
export const homeSections = [
  { id: "hero", index: "00", label: "Top" },
  { id: "demo", index: detector.index, label: detector.label },
  { id: "voices", index: wallOfLove.index, label: wallOfLove.label },
  { id: "technology", index: techSolution.index, label: techSolution.label },
  { id: "accuracy", index: accurate.index, label: accurate.label },
  { id: "performance", index: performance.index, label: performance.label },
  { id: "start", index: secure.index, label: secure.label },
] as const;
