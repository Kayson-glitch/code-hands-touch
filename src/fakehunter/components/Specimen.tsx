import { useReducedMotion } from "../hooks";

/**
 * A small animated "specimen" per detection line.
 *
 * Each one shows the shape of the evidence that line reads — a receipt under a
 * beam, a PDF's structure tree, a filmstrip with a splice — so the three lines
 * are distinguishable at a glance rather than three paragraphs of text.
 */
export function Specimen({ id, active }: { id: string; active: boolean }) {
  const reduced = useReducedMotion();
  const anim = active && !reduced;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--fh-void)]">
      <div className="fh-grid-bg absolute inset-0 opacity-60" />
      {id === "image" && <ImageSpecimen anim={anim} />}
      {id === "pdf" && <PdfSpecimen anim={anim} active={active} />}
      {id === "video" && <VideoSpecimen anim={anim} active={active} />}
    </div>
  );
}

/* ------------------------------------------------------- image: beam + ELA */

function ImageSpecimen({ anim }: { anim: boolean }) {
  return (
    <svg viewBox="0 0 320 240" className="absolute inset-0 h-full w-full">
      <g transform="translate(96 26)">
        <rect width="128" height="188" fill="#0f0f11" stroke="var(--fh-line-strong)" />
        {/* Receipt furniture: header block, amount, then field rows. */}
        <rect x="14" y="16" width="44" height="7" fill="rgba(255,255,255,0.22)" />
        <rect x="14" y="34" width="76" height="14" fill="rgba(255,255,255,0.4)" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <rect x="14" y={68 + i * 18} width="34" height="5" fill="rgba(255,255,255,0.14)" />
            <rect
              x="58"
              y={68 + i * 18}
              width={i === 2 ? 26 : 52}
              height="5"
              fill="rgba(255,255,255,0.22)"
            />
          </g>
        ))}

        {/* Two regions the pixel model flags. They breathe out of phase so the
            block never reads as a static annotation. */}
        {[
          { x: 54, y: 62, w: 34, h: 17, d: "0s" },
          { x: 10, y: 98, w: 42, h: 17, d: "1.1s" },
        ].map((r) => (
          <g key={r.d}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="var(--fh-forged)" opacity="0.16" />
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill="none"
              stroke="var(--fh-forged)"
              strokeWidth="1"
              strokeDasharray="3 3"
            >
              {anim && (
                <animate
                  attributeName="opacity"
                  values="0.35;1;0.35"
                  dur="2.2s"
                  begin={r.d}
                  repeatCount="indefinite"
                />
              )}
            </rect>
          </g>
        ))}

        {/* The beam. One pass every three seconds, top to bottom. */}
        <rect x="0" y="0" width="128" height="26" fill="url(#beamGrad)" opacity={anim ? 1 : 0}>
          {anim && <animate attributeName="y" values="-26;188" dur="3s" repeatCount="indefinite" />}
        </rect>
      </g>

      <defs>
        <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--fh-acid)" stopOpacity="0" />
          <stop offset="60%" stopColor="var(--fh-acid)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--fh-acid)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* -------------------------------------------------- pdf: structure unfolds */

const TREE = [
  { depth: 0, label: "/Catalog", flag: false },
  { depth: 1, label: "/Pages", flag: false },
  { depth: 2, label: "/Page 3", flag: false },
  { depth: 3, label: "/Contents", flag: false },
  { depth: 3, label: "/Font  Helvetica", flag: false },
  { depth: 3, label: "/Font  ArialMT  ⚑", flag: true },
  { depth: 2, label: "/Producer  ????", flag: true },
  { depth: 1, label: "/Metadata", flag: false },
];

function PdfSpecimen({ anim, active }: { anim: boolean; active: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="w-full max-w-[280px]">
        {TREE.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center gap-2 py-[3px]"
            style={{
              paddingLeft: row.depth * 14,
              opacity: active ? 1 : 0,
              transform: active ? "none" : "translateX(-10px)",
              transition: anim
                ? `opacity 420ms var(--fh-ease-out) ${i * 70}ms, transform 420ms var(--fh-ease-out) ${i * 70}ms`
                : "none",
            }}
          >
            <span
              className="block h-px w-2.5 shrink-0"
              style={{ background: row.flag ? "var(--fh-forged)" : "var(--fh-line-strong)" }}
            />
            <span
              className="fh-mono text-[10px] tracking-[0.06em]"
              style={{ color: row.flag ? "var(--fh-forged)" : "var(--fh-ink-faint)" }}
            >
              {row.label}
            </span>
          </div>
        ))}
        <div
          className="fh-mono mt-3 inline-flex items-center gap-1.5 border border-[color:var(--fh-forged)] px-2 py-1 text-[9px]"
          style={{
            color: "var(--fh-forged)",
            opacity: active ? 1 : 0,
            transition: anim ? "opacity 400ms var(--fh-ease-out) 640ms" : "none",
          }}
        >
          2 RULES FIRED
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------- video: filmstrip with a splice */

const FRAMES = 18;
const SPLICE = 11;

function VideoSpecimen({ anim, active }: { anim: boolean; active: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
      <div className="flex w-full max-w-[280px] gap-[3px]">
        {Array.from({ length: FRAMES }, (_, i) => {
          const bad = i === SPLICE;
          return (
            <span
              key={i}
              className="block flex-1"
              style={{
                height: 46,
                background: bad ? "var(--fh-forged)" : "rgba(255,255,255,0.1)",
                opacity: active ? 1 : 0,
                transform: active ? "none" : "scaleY(0.3)",
                transition: anim
                  ? `opacity 300ms var(--fh-ease-out) ${i * 32}ms, transform 420ms var(--fh-ease-snap) ${i * 32}ms`
                  : "none",
                animation: anim && bad ? "fh-blink 0.9s steps(1,end) infinite 700ms" : undefined,
              }}
            />
          );
        })}
      </div>

      {/* Playhead: it runs the strip and stalls on the splice, which is where
          the temporal model raises its hand. */}
      <div className="relative w-full max-w-[280px]">
        <div className="h-px w-full bg-[color:var(--fh-line-strong)]" />
        <span
          className="absolute -top-[3px] block h-[7px] w-px bg-[color:var(--fh-acid)]"
          style={{
            left: `${(SPLICE / FRAMES) * 100}%`,
          }}
        />
        <span
          className="fh-mono absolute top-3 text-[9px] text-[color:var(--fh-forged)]"
          style={{
            left: `${(SPLICE / FRAMES) * 100}%`,
            transform: "translateX(-50%)",
            opacity: active ? 1 : 0,
            transition: anim ? "opacity 400ms var(--fh-ease-out) 760ms" : "none",
          }}
        >
          0:24
        </span>
      </div>

      <span className="fh-mono mt-4 text-[9px] text-[color:var(--fh-ink-ghost)]">
        CUT AND REJOINED · FINGER JUMPS ACROSS THE SPLICE
      </span>
    </div>
  );
}
