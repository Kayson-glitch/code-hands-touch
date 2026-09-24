/**
 * The five diagrams behind the Technology & Solution cards.
 *
 * The live site uses baked illustrations here. These are drawn instead, in two
 * phases: `shown` builds the geometry as the card arrives, and `probe` runs the
 * check when you reach for it. So a card is never empty, and hovering it is not
 * decoration — it is the detector finding the thing the caption describes.
 *
 * Nothing in these is ornament. Every mark is something the engine looks at.
 */

const ACID = "var(--fh-acid)";
const FORGED = "var(--fh-forged)";
const LINE = "rgba(255,255,255,0.13)";
const GHOST = "rgba(255,255,255,0.05)";

const ease = "cubic-bezier(0.16,1,0.3,1)";

export type GlyphState = {
  shown: boolean;
  probe: boolean;
  /** Portrait layout for the wide diagram, used once the card stops being wide. */
  compact?: boolean;
};

function Ticks({ w = 100, h = 75 }: { w?: number; h?: number }) {
  /* Survey brackets in the diagram corners — the same motif as Frame. */
  return (
    <g stroke={LINE} strokeWidth="1" fill="none">
      <path d={`M10 4h-6v6M${w - 10} 4h6v6M10 ${h - 4}h-6v-6M${w - 10} ${h - 4}h6v-6`} />
    </g>
  );
}

/* ---------------------------------------------------- 1 · pixel-level ELA -- */

function Pixels({ shown, probe }: GlyphState) {
  const cols = 20;
  const rows = 15;
  /* The tampered patch. Fixed, because a forgery is in one place. */
  const patch = { x: 10, y: 5, w: 6, h: 4 };

  return (
    <svg viewBox="0 0 100 75" className="h-full w-full" aria-hidden>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const inside =
            c >= patch.x && c < patch.x + patch.w && r >= patch.y && r < patch.y + patch.h;
          /* Deterministic noise so the field does not flicker between renders. */
          const n = ((c * 37 + r * 61) % 19) / 19;
          const hot = inside && probe;
          return (
            <rect
              key={`${c}-${r}`}
              x={9 + c * 4.1}
              y={9 + r * 3.85}
              width={3.3}
              height={3.1}
              fill={hot ? FORGED : "#ffffff"}
              style={{
                opacity: shown ? (hot ? 0.3 + n * 0.6 : 0.05 + n * 0.1) : 0,
                transition: `opacity 520ms ${ease} ${
                  probe ? (c - patch.x) * 24 : (c + r) * 9
                }ms, fill 300ms linear`,
              }}
            />
          );
        }),
      )}
      {/* The box the detector draws round what it found. */}
      <g style={{ opacity: probe ? 1 : 0, transition: `opacity 420ms ${ease} 240ms` }}>
        <rect
          x={9 + patch.x * 4.1 - 2}
          y={9 + patch.y * 3.85 - 2}
          width={patch.w * 4.1 + 3}
          height={patch.h * 3.85 + 3}
          fill="none"
          stroke={FORGED}
          strokeWidth="0.8"
        />
        <text x={9 + patch.x * 4.1 - 2} y={9 + patch.y * 3.85 - 5} fill={FORGED} fontSize="4">
          SPLICE
        </text>
      </g>
      <Ticks />
    </svg>
  );
}

/* ------------------------------------------- 2 · layout consistency diff -- */

function Overlay({ shown, probe }: GlyphState) {
  /* Reference layout, and the same layout as submitted. Two rows are wrong. */
  const rows = [
    { y: 22, w: 25, bad: false },
    { y: 31, w: 32, bad: false },
    { y: 40, w: 18, bad: true },
    { y: 49, w: 29, bad: false },
    { y: 58, w: 23, bad: true },
  ];

  return (
    <svg viewBox="0 0 100 75" className="h-full w-full" aria-hidden>
      {/* Reference, pinned. */}
      <g style={{ opacity: shown ? 1 : 0, transition: `opacity 520ms ${ease}` }}>
        <rect x="8" y="12" width="36" height="52" fill={GHOST} stroke={LINE} strokeWidth="0.7" />
        <text x="8" y="9.5" fill="#fff" fillOpacity="0.3" fontSize="4">
          REFERENCE
        </text>
        {rows.map((r) => (
          <rect key={r.y} x="13" y={r.y - 3} width={r.w} height="2.6" fill="#fff" opacity="0.16" />
        ))}
      </g>

      {/* Submitted, sliding over to be compared. */}
      <g
        style={{
          opacity: shown ? 1 : 0,
          transform: probe ? "translateX(0px)" : "translateX(5px)",
          transition: `opacity 520ms ${ease} 120ms, transform 640ms ${ease}`,
        }}
      >
        <rect
          x="56"
          y="12"
          width="36"
          height="52"
          fill={GHOST}
          stroke={probe ? ACID : LINE}
          strokeWidth="0.7"
          style={{ transition: "stroke 420ms linear" }}
        />
        <text x="56" y="9.5" fill="#fff" fillOpacity="0.3" fontSize="4">
          SUBMITTED
        </text>
        {rows.map((r, i) => (
          <rect
            key={r.y}
            x="61"
            y={r.y - 3}
            width={r.w}
            height="2.6"
            fill={r.bad && probe ? FORGED : "#fff"}
            style={{
              opacity: r.bad && probe ? 0.85 : 0.16,
              transition: `opacity 420ms ${ease} ${i * 70}ms, fill 300ms linear`,
            }}
          />
        ))}
      </g>

      {/* The comparison itself: leaders between the rows that disagree. */}
      {rows
        .filter((r) => r.bad)
        .map((r, i) => (
          <path
            key={r.y}
            d={`M44 ${r.y - 1.7} H56`}
            stroke={FORGED}
            strokeWidth="0.8"
            strokeDasharray="2.4 1.8"
            style={{
              opacity: probe ? 1 : 0,
              transition: `opacity 380ms ${ease} ${300 + i * 90}ms`,
            }}
          />
        ))}
      <Ticks />
    </svg>
  );
}

/* ------------------------------------------------ 3 · PDF structure tree -- */

function Tree({ shown, probe }: GlyphState) {
  /* Interior nodes label above their box, because their outgoing edge leaves
     to the right at exactly the height a side label would sit. */
  const nodes = [
    { x: 16, y: 40, label: "Catalog", bad: false, above: true },
    { x: 40, y: 24, label: "Pages", bad: false, above: true },
    { x: 40, y: 56, label: "Metadata", bad: false, above: true },
    { x: 68, y: 16, label: "Font", bad: false, above: false },
    { x: 68, y: 32, label: "XObject", bad: true, above: false },
    { x: 68, y: 62, label: "Producer", bad: true, above: false },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
  ] as const;

  return (
    <svg viewBox="0 0 100 75" className="h-full w-full" aria-hidden>
      {edges.map(([a, b], i) => {
        const bad = nodes[b].bad && probe;
        return (
          <path
            key={`${a}-${b}`}
            d={`M${nodes[a].x + 3.5} ${nodes[a].y} H${(nodes[a].x + nodes[b].x) / 2} V${nodes[b].y} H${nodes[b].x - 3.5}`}
            fill="none"
            stroke={bad ? FORGED : LINE}
            strokeWidth="0.7"
            strokeDasharray="70"
            style={{
              strokeDashoffset: shown ? 0 : 70,
              transition: `stroke-dashoffset 700ms ${ease} ${i * 90}ms, stroke 300ms linear`,
            }}
          />
        );
      })}
      {nodes.map((n, i) => {
        const bad = n.bad && probe;
        return (
          <g
            key={n.label}
            style={{
              opacity: shown ? 1 : 0,
              transition: `opacity 420ms ${ease} ${i * 80}ms`,
            }}
          >
            <rect
              x={n.x - 3.5}
              y={n.y - 3.5}
              width="7"
              height="7"
              fill={bad ? FORGED : "transparent"}
              fillOpacity="0.22"
              stroke={bad ? FORGED : i === 0 ? ACID : LINE}
              strokeWidth="0.8"
              style={{ transition: "stroke 320ms linear, fill 320ms linear" }}
            />
            <text
              x={n.above ? n.x - 3.5 : n.x + 6}
              y={n.above ? n.y - 6 : n.y + 1.5}
              fill={bad ? FORGED : "#fff"}
              fillOpacity={bad ? 0.9 : 0.3}
              fontSize="4.2"
              style={{ transition: "fill-opacity 320ms linear, fill 320ms linear" }}
            >
              {n.label}
            </text>
          </g>
        );
      })}
      <Ticks />
    </svg>
  );
}

/* ---------------------------------------------------- 4 · video filmstrip -- */

function Frames({ shown, probe }: GlyphState) {
  const count = 8;
  const bad = 4;
  const left = 10;
  const pitch = 10;

  return (
    <svg viewBox="0 0 100 75" className="h-full w-full" aria-hidden>
      {/* Sprocket rails. */}
      {[20, 53].map((y) => (
        <g key={y} style={{ opacity: shown ? 1 : 0, transition: `opacity 420ms ${ease}` }}>
          {Array.from({ length: 10 }, (_, i) => (
            <rect
              key={i}
              x={8.5 + i * 8.6}
              y={y}
              width="2.6"
              height="2.6"
              fill="#fff"
              opacity="0.1"
            />
          ))}
        </g>
      ))}

      {Array.from({ length: count }, (_, i) => {
        const flagged = i === bad && probe;
        return (
          <g
            key={i}
            style={{
              opacity: shown ? 1 : 0,
              transition: `opacity 420ms ${ease} ${i * 55}ms`,
            }}
          >
            <rect
              x={left + i * pitch}
              y={26}
              width="8.4"
              height="24"
              fill={flagged ? FORGED : "#fff"}
              fillOpacity={flagged ? 0.18 : 0.045}
              stroke={flagged ? FORGED : LINE}
              strokeWidth="0.7"
              style={{ transition: `all 380ms ${ease}` }}
            />
            {/* The finger, jumping position across the splice. */}
            <circle
              cx={left + i * pitch + (i >= bad ? 5.8 : 2.6)}
              cy={38}
              r="1.5"
              fill={flagged ? FORGED : "#fff"}
              fillOpacity={shown ? 0.7 : 0}
              style={{ transition: `all 420ms ${ease} ${i * 40}ms` }}
            />
          </g>
        );
      })}

      {/* Playhead, travelling to the splice. */}
      <g
        style={{
          opacity: probe ? 1 : 0,
          transform: probe ? "translateX(0)" : "translateX(-30px)",
          transition: `transform 760ms ${ease}, opacity 300ms linear`,
        }}
      >
        <path d={`M${left + bad * pitch} 22 V54`} stroke={ACID} strokeWidth="0.9" />
        <text x={left + bad * pitch + 2.5} y={19} fill={ACID} fontSize="4.6">
          0:24
        </text>
      </g>

      <text
        x={left}
        y={66}
        fill="#fff"
        fillOpacity={probe ? 0.55 : 0.22}
        fontSize="4"
        style={{ transition: "fill-opacity 400ms linear 400ms" }}
      >
        {probe ? "CUT AND REJOINED" : "25 FPS · FRAME BY FRAME"}
      </text>
      <Ticks />
    </svg>
  );
}

/* ------------------------------------------------- 5 · latency waterfall -- */

function Latency({ shown, probe, compact }: GlyphState) {
  const bars = [
    { label: "Queue", ms: 38, x: 0 },
    { label: "Route", ms: 6, x: 38 },
    { label: "Detect", ms: 41, x: 44 },
    { label: "Fuse", ms: 9, x: 85 },
  ];
  const scope = ["Image", "PDF", "Video", "Layout", "Pixels", "Temporal", "Rules", "Semantics"];

  /* Stacked when the card is no longer wide: the waterfall keeps its shape but
     the frame goes portrait, which is the only way the labels stay legible at
     phone widths. */
  if (compact) {
    const originX = 30;
    const scale = 0.62;
    return (
      <svg viewBox="0 0 110 96" className="h-full w-full" aria-hidden>
        <g style={{ opacity: shown ? 1 : 0, transition: `opacity 520ms ${ease}` }}>
          <path
            d={`M${originX + 100 * scale} 8 V46`}
            stroke={ACID}
            strokeWidth="0.6"
            strokeDasharray="2.5 2.5"
            opacity="0.6"
          />
          <text
            x={originX + 100 * scale}
            y="5.5"
            fill={ACID}
            fontSize="5"
            textAnchor="end"
            opacity="0.85"
          >
            100 ms budget
          </text>
        </g>

        {bars.map((b, i) => (
          <g key={b.label}>
            <rect
              x={originX + b.x * scale}
              y={12 + i * 8}
              width={b.ms * scale}
              height="5"
              fill={ACID}
              fillOpacity={0.2 + i * 0.16}
              style={{
                transform: shown ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: `${originX + b.x * scale}px 0`,
                transition: `transform 520ms ${ease} ${i * 110}ms`,
              }}
            />
            <text
              x={originX - 3}
              y={16.4 + i * 8}
              fill="#fff"
              fillOpacity="0.34"
              fontSize="5"
              textAnchor="end"
            >
              {b.label}
            </text>
          </g>
        ))}

        <text x={originX - 3} y="52" fill="#fff" fillOpacity="0.34" fontSize="5" textAnchor="end">
          Total
        </text>
        <text
          x={originX}
          y="52.5"
          fill={ACID}
          fontSize="7"
          style={{ opacity: shown ? 1 : 0, transition: `opacity 420ms ${ease} 620ms` }}
        >
          94 ms
        </text>

        {scope.map((s, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          return (
            <g key={s}>
              <rect
                x={4 + col * 25.8}
                y={64 + row * 13}
                width="24"
                height="10"
                fill={probe ? ACID : "#fff"}
                fillOpacity={probe ? 0.1 : 0.04}
                stroke={probe ? ACID : LINE}
                strokeOpacity={probe ? 0.5 : 1}
                strokeWidth="0.6"
                style={{ transition: `all 400ms linear ${i * 55}ms` }}
              />
              <text
                x={16 + col * 25.8}
                y={70.8 + row * 13}
                fill="#fff"
                fillOpacity={probe ? 0.68 : 0.3}
                fontSize="4.6"
                textAnchor="middle"
                style={{ transition: `fill-opacity 400ms linear ${i * 55}ms` }}
              >
                {s}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  /* 1ms = 1.1 units, so the 100ms budget lands at x = 42 + 110. */
  const originX = 42;
  const scale = 1.1;

  return (
    <svg viewBox="0 0 200 80" className="h-full w-full" aria-hidden>
      {/* The 100ms budget the testimonials on this page claim. */}
      <g style={{ opacity: shown ? 1 : 0, transition: `opacity 520ms ${ease}` }}>
        <path
          d={`M${originX + 100 * scale} 12 V48`}
          stroke={ACID}
          strokeWidth="0.6"
          strokeDasharray="2.5 2.5"
          opacity="0.6"
        />
        <text x={originX + 100 * scale + 3} y="15" fill={ACID} fontSize="4.6" opacity="0.85">
          100 ms budget
        </text>
      </g>

      {bars.map((b, i) => (
        <g key={b.label}>
          <rect
            x={originX + b.x * scale}
            y={18 + i * 7.5}
            width={b.ms * scale}
            height="4.6"
            fill={ACID}
            fillOpacity={0.2 + i * 0.16}
            style={{
              transform: shown ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: `${originX + b.x * scale}px 0`,
              transition: `transform 520ms ${ease} ${i * 110}ms`,
            }}
          />
          <text
            x={originX - 4}
            y={22 + i * 7.5}
            fill="#fff"
            fillOpacity="0.34"
            fontSize="4.4"
            textAnchor="end"
          >
            {b.label}
          </text>
        </g>
      ))}

      {/* Total, landing after the bars have drawn. */}
      <text x={originX - 4} y="55" fill="#fff" fillOpacity="0.34" fontSize="4.4" textAnchor="end">
        Total
      </text>
      <text
        x={originX}
        y="55"
        fill={ACID}
        fontSize="6"
        style={{ opacity: shown ? 1 : 0, transition: `opacity 420ms ${ease} 620ms` }}
      >
        94 ms
      </text>

      {/* Coverage. The "comprehensive scope" half of the claim, lighting up
          under the pointer one chip at a time. */}
      {scope.map((s, i) => (
        <g key={s}>
          <rect
            x={14 + i * 22.6}
            y={64}
            width="20.6"
            height="8.5"
            fill={probe ? ACID : "#fff"}
            fillOpacity={probe ? 0.1 : 0.04}
            stroke={probe ? ACID : LINE}
            strokeOpacity={probe ? 0.5 : 1}
            strokeWidth="0.6"
            style={{ transition: `all 400ms linear ${i * 55}ms` }}
          />
          <text
            x={24.3 + i * 22.6}
            y={69.7}
            fill="#fff"
            fillOpacity={probe ? 0.68 : 0.3}
            fontSize="4"
            textAnchor="middle"
            style={{ transition: `fill-opacity 400ms linear ${i * 55}ms` }}
          >
            {s}
          </text>
        </g>
      ))}
    </svg>
  );
}

const GLYPHS = {
  pixels: Pixels,
  overlay: Overlay,
  tree: Tree,
  frames: Frames,
  latency: Latency,
} as const;

export type GlyphKind = keyof typeof GLYPHS;

export function TechGlyph({ kind, shown, probe, compact }: { kind: GlyphKind } & GlyphState) {
  const Glyph = GLYPHS[kind];
  return <Glyph shown={shown} probe={probe} compact={compact} />;
}
