import { useState } from "react";
import { pipeline } from "../content";
import { ScanHeading, Section, SectionHeader } from "../components/primitives";
import { useInView, useReducedMotion, useScrollProgress } from "../hooks";

/* --------------------------------------------------------------- geometry */

const VB = { x: 0, y: 34, w: 1180, h: 424 };

type Node = {
  id: string;
  /** Which of the five stages this node belongs to. */
  stage: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  tone?: "acid" | "genuine" | "forged";
};

const NODES: Node[] = [
  { id: "ingest", stage: 0, x: 8, y: 198, w: 132, h: 46, label: "Upload" },
  { id: "route", stage: 1, x: 196, y: 198, w: 132, h: 46, label: "Type router" },
  { id: "image", stage: 2, x: 400, y: 68, w: 176, h: 46, label: "Image line" },
  { id: "pdf", stage: 2, x: 400, y: 198, w: 176, h: 46, label: "PDF line" },
  { id: "video", stage: 2, x: 400, y: 328, w: 176, h: 46, label: "Video line" },
  { id: "fuse", stage: 3, x: 660, y: 198, w: 132, h: 46, label: "Risk score" },
  { id: "pass", stage: 4, x: 890, y: 84, w: 150, h: 42, label: "Pass", tone: "genuine" },
  { id: "review", stage: 4, x: 890, y: 198, w: 150, h: 46, label: "Review", tone: "acid" },
  { id: "block", stage: 4, x: 890, y: 312, w: 150, h: 42, label: "Block", tone: "forged" },
];

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
const cx = (n: Node) => n.x + n.w / 2;
const cy = (n: Node) => n.y + n.h / 2;

type Wire = { id: string; stage: number; d: string };

/** Orthogonal elbow between two nodes — a schematic, not a flowchart. */
function elbow(from: Node, to: Node): string {
  const x1 = from.x + from.w;
  const y1 = cy(from);
  const x2 = to.x;
  const y2 = cy(to);
  if (Math.abs(y1 - y2) < 2) return `M${x1} ${y1} H${x2}`;
  const mid = x1 + (x2 - x1) / 2;
  return `M${x1} ${y1} H${mid - 12} Q${mid} ${y1} ${mid} ${y1 + (y2 > y1 ? 12 : -12)} V${y2 - (y2 > y1 ? 12 : -12)} Q${mid} ${y2} ${mid + 12} ${y2} H${x2}`;
}

const WIRES: Wire[] = [
  { id: "w-in", stage: 1, d: elbow(byId.ingest, byId.route) },
  { id: "w-img", stage: 2, d: elbow(byId.route, byId.image) },
  { id: "w-pdf", stage: 2, d: elbow(byId.route, byId.pdf) },
  { id: "w-vid", stage: 2, d: elbow(byId.route, byId.video) },
  { id: "w-img-f", stage: 3, d: elbow(byId.image, byId.fuse) },
  { id: "w-pdf-f", stage: 3, d: elbow(byId.pdf, byId.fuse) },
  { id: "w-vid-f", stage: 3, d: elbow(byId.video, byId.fuse) },
  { id: "w-pass", stage: 4, d: elbow(byId.fuse, byId.pass) },
  { id: "w-review", stage: 4, d: elbow(byId.fuse, byId.review) },
  { id: "w-block", stage: 4, d: elbow(byId.fuse, byId.block) },
];

/** The loop: review goes back into training, which is why the numbers move. */
const FEEDBACK = `M${cx(byId.review)} ${byId.review.y + byId.review.h} V442 H${cx(byId.image)} V${byId.video.y + byId.video.h + 4}`;

const TONE: Record<string, string> = {
  acid: "var(--fh-acid)",
  genuine: "var(--fh-genuine)",
  forged: "var(--fh-forged)",
};

/* ----------------------------------------------------------------- diagram */

function Diagram({ stage, focus }: { stage: number; focus: number | null }) {
  const reduced = useReducedMotion();

  const isOn = (s: number) => stage >= s;
  const isDim = (s: number) => focus !== null && focus !== s;

  return (
    <svg
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      className="w-full"
      role="img"
      aria-label="Upload, route, detect on three lines, fuse into a risk score, act by tier, and feed human review back into training."
    >
      <defs>
        <marker
          id="fh-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 1l6 3-6 3z" fill="currentColor" />
        </marker>
      </defs>

      {/* Feedback loop sits under everything — it is the slowest thing here. */}
      <path
        d={FEEDBACK}
        fill="none"
        stroke="var(--fh-acid)"
        strokeWidth="1"
        strokeDasharray="3 6"
        markerEnd="url(#fh-arrow)"
        color="var(--fh-acid)"
        style={{
          opacity: isOn(4) ? (isDim(4) ? 0.15 : 0.45) : 0,
          transition: "opacity 700ms var(--fh-ease-out)",
          animation: reduced ? undefined : "fh-dash-flow 1.6s linear infinite reverse",
        }}
      />
      <text
        x={cx(byId.image) + 18}
        y={433}
        className="fh-label"
        fontSize="10"
        fill="var(--fh-acid)"
        style={{
          opacity: isOn(4) ? 0.6 : 0,
          transition: "opacity 700ms var(--fh-ease-out) 200ms",
        }}
      >
        {pipeline.loopLabel}
      </text>

      {WIRES.map((wire) => (
        <path
          key={wire.id}
          d={wire.d}
          fill="none"
          stroke="var(--fh-acid)"
          strokeWidth="1"
          strokeDasharray="4 5"
          markerEnd="url(#fh-arrow)"
          color="var(--fh-acid)"
          style={{
            opacity: isOn(wire.stage) ? (isDim(wire.stage) ? 0.14 : 0.62) : 0,
            transition: "opacity 600ms var(--fh-ease-out)",
            animation: reduced ? undefined : "fh-dash-flow 1.2s linear infinite",
          }}
        />
      ))}

      {NODES.map((node, i) => {
        const on = isOn(node.stage);
        const dim = isDim(node.stage);
        const stroke = node.tone ? TONE[node.tone] : "var(--fh-line-strong)";
        return (
          <g
            key={node.id}
            style={{
              opacity: on ? (dim ? 0.25 : 1) : 0,
              transform: on ? "none" : "translateY(10px)",
              transformOrigin: `${cx(node)}px ${cy(node)}px`,
              transition: `opacity 620ms var(--fh-ease-out) ${i * 40}ms, transform 620ms var(--fh-ease-out) ${i * 40}ms`,
            }}
          >
            <rect
              x={node.x}
              y={node.y}
              width={node.w}
              height={node.h}
              fill="var(--fh-surface)"
              stroke={stroke}
              strokeWidth="1"
            />
            {/* Corner ticks, matching the frame motif used in the DOM. */}
            <path
              d={`M${node.x} ${node.y + 7} V${node.y} H${node.x + 7}`}
              fill="none"
              stroke={node.tone ? stroke : "var(--fh-acid)"}
              strokeWidth="1"
            />
            <path
              d={`M${node.x + node.w} ${node.y + node.h - 7} V${node.y + node.h} H${node.x + node.w - 7}`}
              fill="none"
              stroke={node.tone ? stroke : "var(--fh-acid)"}
              strokeWidth="1"
            />
            <text
              x={cx(node)}
              y={cy(node) + 4}
              textAnchor="middle"
              className="fh-label"
              fontSize="12"
              fill={node.tone ? stroke : "var(--fh-ink)"}
            >
              {node.label}
            </text>
          </g>
        );
      })}

      {/* Packets. Three files enter, stagger through, and keep going — the
          line is never idle, which is the operational claim being made. */}
      {!reduced &&
        isOn(2) &&
        (["w-img", "w-pdf", "w-vid"] as const).map((id, i) => (
          <circle key={id} r="3" fill="var(--fh-acid)" opacity={isDim(2) ? 0.2 : 0.95}>
            <animateMotion
              dur="2.4s"
              begin={`${i * 0.55}s`}
              repeatCount="indefinite"
              path={WIRES.find((w) => w.id === id)!.d}
            />
          </circle>
        ))}
      {!reduced &&
        isOn(3) &&
        (["w-img-f", "w-pdf-f", "w-vid-f"] as const).map((id, i) => (
          <circle key={id} r="3" fill="var(--fh-acid)" opacity={isDim(3) ? 0.2 : 0.95}>
            <animateMotion
              dur="2.4s"
              begin={`${0.9 + i * 0.55}s`}
              repeatCount="indefinite"
              path={WIRES.find((w) => w.id === id)!.d}
            />
          </circle>
        ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ section */

export function Pipeline() {
  const [trackRef, progress] = useScrollProgress<HTMLDivElement>();
  const [capRef, capInView] = useInView<HTMLParagraphElement>({ threshold: 0.4 });
  const [focus, setFocus] = useState<number | null>(null);
  const reduced = useReducedMotion();

  // Scroll builds the diagram stage by stage: the reader assembles the system
  // by moving through it, rather than being handed a finished picture.
  const raw = (progress - 0.22) / 0.34;
  const stage = reduced ? 4 : Math.max(-1, Math.min(4, Math.floor(raw * 5)));

  return (
    <Section id="product" className="border-t border-[color:var(--fh-line)]">
      <div className="fh-shell">
        <SectionHeader index={pipeline.index} label={pipeline.label} />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ScanHeading className="fh-h2 max-w-[20ch]">{pipeline.title}</ScanHeading>
          </div>
          <div className="lg:col-span-5 lg:pt-2">
            <p className="fh-body">{pipeline.description}</p>
          </div>
        </div>
      </div>

      {/* Sticky stage: the diagram holds while the stage list scrolls past it,
          so the build-up and the explanation are read together. */}
      <div ref={trackRef} className="mt-16 lg:h-[220vh]">
        <div className="lg:sticky lg:top-20">
          <div className="fh-shell">
            <div className="fh-grid-bg relative overflow-hidden border border-[color:var(--fh-line)] bg-[color:var(--fh-void)] px-4 py-6 lg:px-8 lg:py-8">
              <div className="mb-5 flex items-center justify-between">
                <span className="fh-label text-[color:var(--fh-ink-ghost)]">
                  Detection pipeline
                </span>
                <span className="fh-figure flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-[color:var(--fh-acid)]">
                  <span className="fh-blink block h-1.5 w-1.5 bg-[color:var(--fh-acid)]" />
                  {stage < 0 ? "IDLE" : stage >= 4 ? "LIVE" : `STAGE ${stage + 1}/5`}
                </span>
              </div>

              {/* Desktop: the schematic. */}
              <div className="hidden md:block">
                <Diagram stage={stage} focus={focus} />
              </div>

              {/* Mobile: the same five stages as a vertical run. */}
              <ol className="space-y-0 md:hidden">
                {pipeline.stages.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex gap-4 border-t border-[color:var(--fh-line)] py-4 first:border-t-0"
                    style={{
                      opacity: stage >= i ? 1 : 0.18,
                      transition: "opacity 500ms var(--fh-ease-out)",
                    }}
                  >
                    <span className="fh-figure text-[0.875rem] font-semibold text-[color:var(--fh-acid)]">
                      {s.kicker}
                    </span>
                    <span>
                      <span className="block text-[0.95rem] font-medium">{s.title}</span>
                      <span className="mt-1 block text-[0.8125rem] leading-[1.5] text-[color:var(--fh-ink-dim)]">
                        {s.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Stage legend. Hovering isolates one stage in the schematic, so
                the diagram can be interrogated instead of just watched. */}
            <div className="mt-4 hidden grid-cols-5 gap-px bg-[color:var(--fh-line)] md:grid">
              {pipeline.stages.map((s, i) => {
                const reached = stage >= i;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onMouseEnter={() => setFocus(i)}
                    onMouseLeave={() => setFocus(null)}
                    onFocus={() => setFocus(i)}
                    onBlur={() => setFocus(null)}
                    className="group bg-[color:var(--fh-bg)] p-4 text-left transition-colors duration-300 hover:bg-[color:var(--fh-surface)]"
                  >
                    <span
                      className="fh-figure block text-[0.875rem] font-semibold transition-colors duration-500"
                      style={{
                        color: reached ? "var(--fh-acid)" : "var(--fh-ink-ghost)",
                      }}
                    >
                      {s.kicker}
                    </span>
                    <span
                      className="mt-2 block text-[0.9375rem] font-medium transition-colors duration-500"
                      style={{ color: reached ? "var(--fh-ink)" : "var(--fh-ink-faint)" }}
                    >
                      {s.title}
                    </span>
                    <span className="mt-1.5 block text-[0.78rem] leading-[1.45] text-[color:var(--fh-ink-faint)]">
                      {s.body}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="fh-shell">
        <p
          ref={capRef}
          className="fh-body mt-12 max-w-[64ch]"
          style={{
            opacity: capInView ? 1 : 0,
            transform: capInView ? "none" : "translateY(12px)",
            transition: "opacity 700ms var(--fh-ease-out), transform 700ms var(--fh-ease-out)",
          }}
        >
          {pipeline.caption}
        </p>
      </div>
    </Section>
  );
}
