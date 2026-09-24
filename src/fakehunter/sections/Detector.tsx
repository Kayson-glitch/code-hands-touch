import { useEffect, useRef, useState } from "react";
import { Button, Counter } from "../components/primitives";
import { siteNav } from "../content";
import { detector } from "../content.home";
import { useReducedMotion } from "../hooks";

type Specimen = (typeof detector.specimens)[number];

type Staged =
  | { source: "specimen"; specimen: Specimen }
  | { source: "user"; kind: string; name: string; meta: string };

type Mode = "idle" | "staged" | "running" | "result" | "gate";

const MB = 1024 * 1024;

function formatSize(bytes: number) {
  return bytes >= MB
    ? `${(bytes / MB).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Real validation, using the API's own messages. Nothing is uploaded. */
function inspect(file: File): { staged?: Staged; error?: string } {
  const name = file.name;
  const type = file.type;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  const isImage = type.startsWith("image/") && /^(jpg|jpeg|png)$/.test(ext);
  const isPdf = type === "application/pdf" || ext === "pdf";
  const isVideo = type === "video/mp4" || ext === "mp4";

  if (!isImage && !isPdf && !isVideo) return { error: detector.errors.format };
  if (isImage && file.size > 10 * MB) return { error: detector.errors.imageSize };
  if (isPdf && file.size > 20 * MB) return { error: detector.errors.pdfSize };
  if (isVideo && file.size > 100 * MB) return { error: detector.errors.videoSize };

  const kind = isImage ? (ext === "png" ? "PNG" : "JPG") : isPdf ? "PDF" : "MP4";
  return {
    staged: {
      source: "user",
      kind,
      name,
      meta: `${kind} · ${formatSize(file.size)}`,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Probability gauge                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The verdict, as a measurement rather than a badge.
 *
 * A single track with the decision threshold marked on it, so the score is
 * always read against the line it crossed. The fill animates out from zero
 * once, in the verdict's own colour.
 */
function Gauge({ score, forged }: { score: number; forged: boolean }) {
  const [live, setLive] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setLive(score);
      return;
    }
    const id = requestAnimationFrame(() => setLive(score));
    return () => cancelAnimationFrame(id);
  }, [score, reduced]);

  const tone = forged ? "var(--fh-forged)" : "var(--fh-genuine)";

  return (
    <div>
      <div className="flex items-end justify-between">
        <span className="fh-label text-[color:var(--fh-ink-faint)]">
          {detector.fakeProbability}
        </span>
        <span
          className="fh-label flex items-center gap-1.5"
          style={{
            color: tone,
            background: forged ? "var(--fh-forged-ghost)" : "var(--fh-genuine-ghost)",
            padding: "0.25rem 0.5rem",
          }}
        >
          <span className="block h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
          {forged ? detector.forged : detector.authentic}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1" style={{ color: tone }}>
        <Counter
          value={score}
          decimals={1}
          duration={900}
          className="text-[clamp(2.75rem,5vw,3.75rem)] font-medium leading-none"
        />
        <span className="fh-figure text-[1.5rem] font-normal opacity-70">%</span>
      </div>

      <div className="relative mt-4 h-1.5 bg-[color:var(--fh-line)]">
        <div
          className="h-full origin-left"
          style={{
            background: tone,
            width: `${live}%`,
            transition: "width 1000ms var(--fh-ease-out)",
          }}
        />
        {/* Decision threshold. */}
        <span
          className="absolute -top-1.5 h-[15px] w-px bg-[color:var(--fh-ink-faint)]"
          style={{ left: "50%" }}
        />
        <span className="fh-label absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-[color:var(--fh-ink-ghost)]">
          Threshold 50
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Video segment timeline                                                    */
/* -------------------------------------------------------------------------- */

function SegmentTrack({ start, end, duration }: { start: number; end: number; duration: number }) {
  return (
    <div className="mt-4">
      <div className="relative h-8 border border-[color:var(--fh-line)] bg-[color:var(--fh-void)]">
        {/* Frame ticks, one per second. */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: duration }, (_, i) => (
            <span
              key={i}
              className="h-full flex-1 border-r border-[rgba(255,255,255,0.05)] last:border-r-0"
            />
          ))}
        </div>
        <div
          className="absolute inset-y-0 border-x border-[color:var(--fh-forged)] bg-[color:var(--fh-forged-ghost)]"
          style={{
            left: `${(start / duration) * 100}%`,
            width: `${((end - start) / duration) * 100}%`,
          }}
        />
      </div>
      {/* A sentence, so it stays in the reading face rather than the figure
          face — only isolated values get set in Smooch Sans. */}
      <p className="mt-2.5 text-[0.8125rem] font-medium text-[color:var(--fh-forged)]">
        {detector.suspiciousSegment(start, end, duration)}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Detector                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The trial module. It has its own page, so this renders the instrument only —
 * the page around it owns the title and the closing CTA.
 */
export function Detector() {
  const [mode, setMode] = useState<Mode>("idle");
  const [staged, setStaged] = useState<Staged | null>(null);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reduced = useReducedMotion();

  const specimen = staged?.source === "specimen" ? staged.specimen : null;

  /* Stage progression. Same for a specimen and for a dropped file — what
     differs is where it lands. */
  useEffect(() => {
    if (mode !== "running") return;
    if (reduced) {
      setStage(detector.stages.length - 1);
      setMode(staged?.source === "specimen" ? "result" : "gate");
      return;
    }
    const step = 380;
    const timers = detector.stages.map((_, i) => window.setTimeout(() => setStage(i), i * step));
    const done = window.setTimeout(
      () => setMode(staged?.source === "specimen" ? "result" : "gate"),
      detector.stages.length * step + 260,
    );
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(done);
    };
  }, [mode, staged, reduced]);

  const reset = () => {
    setMode("idle");
    setStaged(null);
    setStage(0);
    setError(null);
    setCode("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const accept = (file: File | undefined) => {
    if (!file) return;
    const { staged: next, error: err } = inspect(file);
    if (err) {
      setError(err);
      setStaged(null);
      setMode("idle");
      return;
    }
    setError(null);
    setStaged(next!);
    setMode("staged");
  };

  const runSpecimen = (s: Specimen) => {
    setError(null);
    setStaged({ source: "specimen", specimen: s });
    setStage(0);
    setMode("running");
  };

  return (
    <section id="demo" className="relative scroll-mt-24">
      <div className="fh-shell">
        {/* ------------------------------------------------------ the window */}
        <div className="border border-[color:var(--fh-line-strong)] bg-[color:var(--fh-surface)]">
          {/* Chrome. Squares rather than traffic lights — this is an instrument,
              not a desktop app. */}
          <div className="relative flex h-12 items-center justify-between border-b border-[color:var(--fh-line)] bg-[color:var(--fh-void)] px-4">
            <div className="flex items-center gap-1.5">
              <span className="block h-2 w-2 bg-[color:var(--fh-ink-ghost)]" />
              <span className="block h-2 w-2 bg-[color:var(--fh-ink-ghost)]" />
              <span className="block h-2 w-2 bg-[color:var(--fh-acid)]" />
            </div>
            <span className="fh-label absolute left-1/2 -translate-x-1/2 text-[0.75rem] tracking-[0.2em]">
              {detector.title}
            </span>
            {/* The chrome's status field tells the truth about what is loaded:
                a published specimen, or a file that never left the browser. */}
            <span className="fh-label text-[10px] text-[color:var(--fh-ink-ghost)]">
              {mode === "running"
                ? detector.analyzing
                : staged?.source === "user"
                  ? detector.localOnly
                  : detector.redacted}
            </span>
          </div>

          <div className="p-4 sm:p-6">
            {/* ------------------------------------------------------- idle */}
            {mode === "idle" && (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    accept(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className="flex min-h-[19rem] cursor-pointer flex-col items-center justify-center px-6 py-12 text-center transition-colors duration-300"
                  style={{
                    border: `1px dashed ${dragging ? "var(--fh-acid)" : "var(--fh-line-strong)"}`,
                    background: dragging ? "var(--fh-acid-ghost)" : "transparent",
                  }}
                >
                  {/* Reticle over a document — the mark's own geometry. */}
                  <svg width="76" height="76" viewBox="0 0 76 76" fill="none" aria-hidden>
                    <rect
                      x="23.5"
                      y="14.5"
                      width="29"
                      height="40"
                      stroke="var(--fh-ink-faint)"
                      strokeDasharray="4 4"
                    />
                    <path
                      d="M30 26h16M30 34h16M30 42h9"
                      stroke="var(--fh-ink-ghost)"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M2 38h9M65 38h9M38 2v9M38 65v9"
                      stroke="var(--fh-acid)"
                      strokeWidth="1.4"
                    />
                    <circle cx="38" cy="38" r="15" stroke="var(--fh-acid)" opacity="0.4" />
                    <circle cx="38" cy="38" r="2" fill="var(--fh-acid)" />
                  </svg>

                  <p className="mt-6 text-[1.0625rem] font-medium">{detector.dragDrop}</p>
                  <p className="fh-body mt-2 max-w-[34rem] text-[0.8125rem]">{detector.formats}</p>

                  <span className="fh-btn fh-btn--primary mt-7">
                    <span>{detector.uploadButton}</span>
                  </span>

                  {error && <p className="fh-label mt-5 text-[color:var(--fh-forged)]">{error}</p>}
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.mp4"
                  className="hidden"
                  onChange={(e) => accept(e.target.files?.[0])}
                />

                {/* Specimens. The way in for anyone without a file to hand. */}
                <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="fh-label text-[color:var(--fh-ink-faint)]">
                    {detector.specimenLabel}
                  </span>
                  {detector.specimens.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => runSpecimen(s)}
                      className="group flex items-center gap-2 border border-[color:var(--fh-line-strong)] px-3 py-2 transition-colors duration-300 hover:border-[color:var(--fh-acid)]"
                    >
                      <span className="fh-label text-[9px] text-[color:var(--fh-acid)]">
                        {s.kind}
                      </span>
                      <span className="text-[0.8125rem] text-[color:var(--fh-ink-dim)] transition-colors duration-300 group-hover:text-[color:var(--fh-ink)]">
                        {s.name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ----------------------------------------------------- staged */}
            {mode === "staged" && staged && (
              <div className="flex min-h-[19rem] flex-col items-center justify-center gap-7 py-12 text-center">
                <FileChip staged={staged} />
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button onClick={() => setMode("running")}>{detector.initiateDetection}</Button>
                  <button
                    type="button"
                    onClick={reset}
                    className="fh-label text-[color:var(--fh-ink-faint)] underline decoration-[color:var(--fh-line-strong)] underline-offset-4 transition-colors hover:text-[color:var(--fh-ink)]"
                  >
                    {detector.newUpload}
                  </button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- running */}
            {mode === "running" && staged && (
              <div className="flex min-h-[19rem] flex-col items-center justify-center gap-8 py-12">
                <FileChip staged={staged} />
                <div className="w-full max-w-[32rem]">
                  <div className="flex items-center justify-between">
                    {detector.stages.map((label, i) => (
                      <span
                        key={label}
                        className="fh-label text-[9px] transition-colors duration-300"
                        style={{
                          color: i <= stage ? "var(--fh-acid)" : "var(--fh-ink-ghost)",
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 h-px bg-[color:var(--fh-line)]">
                    <div
                      className="h-full origin-left bg-[color:var(--fh-acid)]"
                      style={{
                        transform: `scaleX(${(stage + 1) / detector.stages.length})`,
                        transition: "transform 380ms linear",
                      }}
                    />
                  </div>
                  <p className="fh-label mt-4 text-center text-[color:var(--fh-ink-faint)]">
                    {detector.analyzing}
                  </p>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------- result */}
            {mode === "result" && specimen && (
              <div className="grid gap-8 py-2 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-5">
                  <FileChip staged={staged!} align="start" />
                  <div className="mt-8">
                    <Gauge score={specimen.score} forged={specimen.forged} />
                  </div>
                  <div className="mt-10 grid grid-cols-2 gap-4">
                    {[
                      { label: detector.queueMs, value: specimen.queueMs },
                      { label: detector.inferenceMs, value: specimen.inferenceMs },
                    ].map((cell) => (
                      <div key={cell.label} className="border-t border-[color:var(--fh-line)] pt-3">
                        <span className="fh-label text-[10px] text-[color:var(--fh-ink-ghost)]">
                          {cell.label}
                        </span>
                        <Counter
                          value={cell.value}
                          duration={800}
                          className="mt-1 block text-[1.5rem] font-medium leading-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <span className="fh-label text-[color:var(--fh-acid)]">
                    {detector.analysisResults}
                  </span>
                  <p className="fh-body mt-4 text-[0.9375rem] leading-[1.75]">
                    {specimen.analysis}
                  </p>
                  {"segment" in specimen && specimen.segment && (
                    <SegmentTrack
                      start={specimen.segment.start}
                      end={specimen.segment.end}
                      duration={specimen.segment.duration}
                    />
                  )}
                  <div className="mt-8 border-t border-[color:var(--fh-line)] pt-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="fh-label text-[color:var(--fh-ink-faint)]">
                        {detector.runAnother}
                      </span>
                      {detector.specimens
                        .filter((s) => s.id !== specimen.id)
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => runSpecimen(s)}
                            className="group flex items-center gap-2 border border-[color:var(--fh-line-strong)] px-3 py-2 transition-colors duration-300 hover:border-[color:var(--fh-acid)]"
                          >
                            <span className="fh-label text-[9px] text-[color:var(--fh-acid)]">
                              {s.kind}
                            </span>
                            <span className="text-[0.8125rem] text-[color:var(--fh-ink-dim)] transition-colors duration-300 group-hover:text-[color:var(--fh-ink)]">
                              {s.name}
                            </span>
                          </button>
                        ))}
                    </div>
                    <Button variant="ghost" onClick={reset} arrow={false} className="mt-5">
                      {detector.tryAgain}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- gate */}
            {mode === "gate" && staged && (
              <div className="flex min-h-[19rem] flex-col items-center justify-center gap-6 py-12 text-center">
                <FileChip staged={staged} />
                <div>
                  <p className="fh-h3">
                    {detector.invite.titlePrefix}{" "}
                    <span className="text-[color:var(--fh-acid)]">FakeHunter.AI</span>
                  </p>
                  <p className="fh-body mx-auto mt-3 max-w-[36rem] text-[0.875rem]">
                    {detector.invite.helper}
                  </p>
                </div>

                <div className="flex w-full max-w-[26rem] border border-[color:var(--fh-line-strong)] transition-colors focus-within:border-[color:var(--fh-acid)]">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={detector.invite.placeholder}
                    aria-label={detector.invite.placeholder}
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[0.875rem] outline-none placeholder:text-[color:var(--fh-ink-ghost)]"
                  />
                  <span
                    className="fh-label shrink-0 bg-[color:var(--fh-ink)] px-4 py-3 text-[#0a0a0b]"
                    aria-hidden
                  >
                    →
                  </span>
                </div>

                <p className="fh-body max-w-[34rem] text-[0.75rem] text-[color:var(--fh-ink-ghost)]">
                  {detector.invite.note}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button href="#trial">{siteNav.cta}</Button>
                  <button
                    type="button"
                    onClick={reset}
                    className="fh-label text-[color:var(--fh-ink-faint)] underline decoration-[color:var(--fh-line-strong)] underline-offset-4 transition-colors hover:text-[color:var(--fh-ink)]"
                  >
                    {detector.newUpload}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function FileChip({ staged, align = "center" }: { staged: Staged; align?: "center" | "start" }) {
  const kind = staged.source === "specimen" ? staged.specimen.kind : staged.kind;
  const name = staged.source === "specimen" ? staged.specimen.name : staged.name;
  const meta = staged.source === "specimen" ? staged.specimen.meta : staged.meta;

  return (
    <div
      className="flex items-center gap-3"
      style={{ justifyContent: align === "center" ? "center" : "flex-start" }}
    >
      <span className="fh-label flex h-10 w-10 items-center justify-center border border-[color:var(--fh-line-strong)] text-[9px] text-[color:var(--fh-acid)]">
        {kind}
      </span>
      <div className="text-left">
        <p className="max-w-[18rem] truncate text-[0.9375rem] font-medium">{name}</p>
        <p className="fh-figure text-[0.8125rem] text-[color:var(--fh-ink-faint)]">{meta}</p>
      </div>
    </div>
  );
}
