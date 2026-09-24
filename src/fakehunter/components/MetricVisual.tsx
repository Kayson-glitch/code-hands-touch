/**
 * The four visuals in the Sustained Performance cards.
 *
 * On the live site each of these is a screenshot of a dashboard. Drawing them
 * instead means the shape carries the number: the arc stops where the accuracy
 * stops, the decline lands where the bad-debt reduction lands, the variance
 * band closes as the regional rate settles. They draw themselves once, on
 * arrival, and then hold.
 *
 * All four share one 132×60 frame so the set reads as one instrument panel
 * rather than four unrelated charts.
 */

const ACID = "var(--fh-acid)";
const FORGED = "var(--fh-forged)";
const LINE = "rgba(255,255,255,0.1)";
const ease = "cubic-bezier(0.16,1,0.3,1)";

const W = 132;
const H = 60;
/** Plot area, leaving room for the baseline labels. */
const TOP = 6;
const BOTTOM = 52;

function Grid() {
  return (
    <g stroke={LINE} strokeWidth="0.6">
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M0 ${TOP + i * ((BOTTOM - TOP) / 3)} H${W}`} />
      ))}
    </g>
  );
}

/* ------------------------------------------------- 1 · interception rate -- */

/** Per-batch hit rate against the target line. Bars grow left to right. */
function Bars({ on }: { on: boolean }) {
  const series = [71, 78, 74, 83, 86, 82, 89, 92, 90, 92];
  const target = 90;
  const y = (v: number) => BOTTOM - (v / 100) * (BOTTOM - TOP);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden>
      <Grid />
      <path
        d={`M0 ${y(target)} H${W}`}
        stroke={ACID}
        strokeWidth="0.7"
        strokeDasharray="3 2"
        opacity="0.6"
      />
      <text x="0" y={y(target) - 2} fill={ACID} fillOpacity="0.7" fontSize="3.6">
        TARGET 90%
      </text>
      {series.map((v, i) => (
        <rect
          key={i}
          x={4 + i * 12.8}
          y={y(v)}
          width="8"
          height={BOTTOM - y(v)}
          fill={ACID}
          fillOpacity={v >= target ? 0.66 : 0.24}
          style={{
            transform: on ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: `0 ${BOTTOM}px`,
            transition: `transform 620ms ${ease} ${i * 55}ms`,
          }}
        />
      ))}
      <path d={`M0 ${BOTTOM} H${W}`} stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
    </svg>
  );
}

/* ------------------------------------------------------- 2 · arc gauge ---- */

/** Concentric arcs, the outermost stopping at the recognition accuracy. */
function Gauge({ on }: { on: boolean }) {
  const rings = [
    { r: 21, pct: 93.8, weight: 2.6, opacity: 1 },
    { r: 16.5, pct: 82.1, weight: 1.5, opacity: 0.45 },
    { r: 12, pct: 80.2, weight: 1.5, opacity: 0.28 },
    { r: 7.5, pct: 85.9, weight: 1.5, opacity: 0.18 },
  ];
  /* Three-quarter sweep, opening at the bottom like an instrument dial. */
  const SPAN = 1.5 * Math.PI;
  const START = 0.75 * Math.PI;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden>
      <g transform={`translate(${W / 2} ${H / 2 - 1})`}>
        {rings.map((ring, i) => {
          const circ = 2 * Math.PI * ring.r;
          const arc = (SPAN / (2 * Math.PI)) * circ;
          const filled = arc * (ring.pct / 100);
          return (
            <g key={ring.r} transform={`rotate(${(START * 180) / Math.PI})`}>
              <circle
                r={ring.r}
                fill="none"
                stroke={LINE}
                strokeWidth={ring.weight}
                strokeDasharray={`${arc} ${circ}`}
              />
              <circle
                r={ring.r}
                fill="none"
                stroke={ACID}
                strokeOpacity={ring.opacity}
                strokeWidth={ring.weight}
                strokeDasharray={`${filled} ${circ}`}
                style={{
                  strokeDashoffset: on ? 0 : filled,
                  transition: `stroke-dashoffset 1100ms ${ease} ${i * 110}ms`,
                }}
              />
            </g>
          );
        })}
        {/* Graticule outside the dial. */}
        {Array.from({ length: 13 }, (_, i) => {
          const a = START + (SPAN * i) / 12;
          const len = i % 3 === 0 ? 4 : 2.2;
          return (
            <path
              key={i}
              d={`M${Math.cos(a) * 24} ${Math.sin(a) * 24} L${Math.cos(a) * (24 + len)} ${Math.sin(a) * (24 + len)}`}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="0.7"
            />
          );
        })}
        {/* The needle, landing on the reading. */}
        <path
          d={`M0 0 L${Math.cos(START + SPAN * 0.938) * 19} ${Math.sin(START + SPAN * 0.938) * 19}`}
          stroke={ACID}
          strokeWidth="0.9"
          style={{ opacity: on ? 0.85 : 0, transition: `opacity 420ms ${ease} 1000ms` }}
        />
        <circle r="1.6" fill={ACID} />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------- 3 · stability ---- */

/**
 * The regional rate rising while its spread closes. Two lines converging on
 * one number is what "proven stability" actually looks like in a report.
 */
function Stability({ on }: { on: boolean }) {
  const pts = [
    { x: 4, v: 74, spread: 13 },
    { x: 22, v: 79, spread: 11 },
    { x: 40, v: 83, spread: 9 },
    { x: 58, v: 86, spread: 7 },
    { x: 76, v: 88, spread: 5 },
    { x: 94, v: 90, spread: 3.5 },
    { x: 112, v: 91.2, spread: 2.5 },
    { x: 128, v: 92, spread: 1.6 },
  ];
  const y = (v: number) => BOTTOM - (v / 100) * (BOTTOM - TOP);
  const upper = pts.map((p) => `${p.x} ${y(p.v + p.spread)}`).join(" L");
  const lower = [...pts]
    .reverse()
    .map((p) => `${p.x} ${y(p.v - p.spread)}`)
    .join(" L");
  const mid = pts.map((p) => `${p.x} ${y(p.v)}`).join(" L");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden>
      <Grid />
      <path
        d={`M${upper} L${lower} Z`}
        fill={ACID}
        fillOpacity="0.16"
        style={{ opacity: on ? 1 : 0, transition: `opacity 820ms ${ease} 260ms` }}
      />
      {[upper, lower].map((d, i) => (
        <path
          key={i}
          d={`M${d}`}
          fill="none"
          stroke={ACID}
          strokeOpacity="0.4"
          strokeWidth="0.7"
          strokeDasharray="200"
          style={{
            strokeDashoffset: on ? 0 : 200,
            transition: `stroke-dashoffset 900ms ${ease} ${i * 90}ms`,
          }}
        />
      ))}
      <path
        d={`M${mid}`}
        fill="none"
        stroke={ACID}
        strokeWidth="1.6"
        strokeDasharray="200"
        style={{
          strokeDashoffset: on ? 0 : 200,
          transition: `stroke-dashoffset 1000ms ${ease} 160ms`,
        }}
      />
      <path
        d={`M0 ${y(92)} H${W}`}
        stroke={ACID}
        strokeWidth="0.6"
        strokeDasharray="3 2"
        opacity="0.45"
      />
      <rect
        x={pts[pts.length - 1].x - 2}
        y={y(92) - 2}
        width="4"
        height="4"
        fill={ACID}
        style={{ opacity: on ? 1 : 0, transition: `opacity 360ms ${ease} 1100ms` }}
      />
    </svg>
  );
}

/* --------------------------------------------------------- 4 · decline ---- */

/** Bad debt before the engine is in front of it, and after. */
function Decline({ on }: { on: boolean }) {
  const split = 46;
  const before = "M2 14 L16 11 L30 17 L46 12";
  const after = "M46 12 L62 26 L78 38 L94 45 L110 48 L130 49";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden>
      <Grid />
      <path
        d={`M${split} ${TOP - 2} V${BOTTOM}`}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.6"
        strokeDasharray="2 2"
      />
      <text x={split + 2} y={TOP + 1} fill="#fff" fillOpacity="0.4" fontSize="3.6">
        DEPLOYED
      </text>

      <path
        d={`${after} L130 ${BOTTOM} L${split} ${BOTTOM} Z`}
        fill={ACID}
        fillOpacity="0.12"
        style={{ opacity: on ? 1 : 0, transition: `opacity 700ms ${ease} 480ms` }}
      />
      <path
        d={before}
        fill="none"
        stroke={FORGED}
        strokeWidth="1.5"
        strokeDasharray="60"
        style={{
          strokeDashoffset: on ? 0 : 60,
          transition: `stroke-dashoffset 620ms ${ease}`,
        }}
      />
      <path
        d={after}
        fill="none"
        stroke={ACID}
        strokeWidth="1.7"
        strokeDasharray="130"
        style={{
          strokeDashoffset: on ? 0 : 130,
          transition: `stroke-dashoffset 950ms ${ease} 360ms`,
        }}
      />
      <rect
        x="128"
        y="47"
        width="4"
        height="4"
        fill={ACID}
        style={{ opacity: on ? 1 : 0, transition: `opacity 360ms ${ease} 1240ms` }}
      />
      <path d={`M0 ${BOTTOM} H${W}`} stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
    </svg>
  );
}

const VISUALS = { bars: Bars, gauge: Gauge, stability: Stability, decline: Decline } as const;

export type VisualKind = keyof typeof VISUALS;

export function MetricVisual({ kind, on }: { kind: VisualKind; on: boolean }) {
  const Visual = VISUALS[kind];
  return <Visual on={on} />;
}
