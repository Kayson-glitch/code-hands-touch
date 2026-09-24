import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";
import { thresholdField as tf } from "../content.home";
import { useReducedMotion } from "../hooks";

/**
 * The hero field: a live stream of payment proofs meeting two policy lines.
 *
 * Proofs arrive from the right as small typed chips and meet the engine line.
 * Each one leaves it as a point, placed at its fake probability, and drifts
 * left into the record — so the left of the field is a scatter plot of every
 * verdict so far, with time running right to left.
 *
 * Two horizontal lines cut through that record — the customer's policy. At or
 * above the block line a proof is rejected without a person; below the pass
 * line it is released without one; between them it goes to a reviewer. The
 * lines are the only interactive things here and the point of the whole hero:
 * drag either and every verdict already on screen re-sorts, and the rates
 * underneath move with it. The model's output does not change. Your policy
 * does.
 *
 * Positions are a pure function of a simulated clock — an item's place is
 * derived from when it crosses the engine, never integrated frame to frame —
 * so a resize, a background tab or a paused frame cannot scramble the order.
 */

type Tier = "pass" | "review" | "block";
type Kind = (typeof tf.kinds)[number]["kind"];

type Item = {
  id: number;
  kind: Kind;
  name: string;
  amount: string;
  score: number;
  /** Offset within the incoming lane, −1…1, so chips do not ride one rail. */
  lane: number;
  /** Simulated time, in seconds, at which the item reaches the engine. */
  at: number;
  /** Seeded history fades in along the record from the engine outward. */
  reveal: number;
};

const ACID = "225,240,86";
const FORGED = "255,90,77";
const INK = "244,244,242";
const SANS = '"Red Hat Display", ui-sans-serif, system-ui, sans-serif';

/** Conveyor speed on the way in, and drift speed of the record. The record is
    slower so it compresses into something that reads as a distribution. */
const V_IN = 118;
const V_OUT = 34;
/** Seconds from crossing the engine to settling at its probability. */
const RESOLVE = 0.62;
/** Mean seconds between arrivals. */
const SPAWN = 0.46;
const MIN_LINE = 4;
const MAX_LINE = 96;
const PAD_T = 46;
const PAD_B = 34;
const CHIP_W = 40;
const CHIP_H = 18;

type LineId = "block" | "pass";
type Lines = Record<LineId, number>;

function tierOf(score: number, lines: Lines): Tier {
  if (score >= lines.block) return "block";
  if (score >= lines.pass) return "review";
  return "pass";
}

const INITIAL_LINES: Lines = { block: tf.lines.block.initial, pass: tf.lines.pass.initial };

function geometry(w: number, h: number) {
  const narrow = w < 700;
  const top = PAD_T;
  const bottom = Math.max(top + 40, h - PAD_B);
  return {
    narrow,
    top,
    bottom,
    scanX: Math.round(w * (narrow ? 0.72 : 0.66)),
    laneY: top + (bottom - top) * 0.5,
    laneSpread: Math.min(34, (bottom - top) * 0.12),
    yOf: (score: number) => bottom - (score / 100) * (bottom - top),
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function gauss() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* The mix: mostly clean, a hard core of obvious forgeries, and an ambiguous
   middle — which is the only reason where the lines sit is a decision at all. */
function drawScore() {
  const r = Math.random();
  if (r < 0.68) return clamp(Math.abs(3 + gauss() * 8), 0.4, 34);
  if (r < 0.84) return clamp(90 + gauss() * 5, 62, 99.6);
  return 18 + Math.random() * 64;
}

function pick<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

let nextId = 1;
function makeItem(at: number, reveal = 0): Item {
  let r = Math.random();
  let kind: (typeof tf.kinds)[number] = tf.kinds[0];
  for (const k of tf.kinds) {
    kind = k;
    if (r < k.weight) break;
    r -= k.weight;
  }
  const cur = pick(tf.currencies);
  const value = cur.min + Math.random() ** 2 * (cur.max - cur.min);
  return {
    id: nextId++,
    kind: kind.kind,
    name: pick(kind.names),
    amount: `${cur.code} ${value.toLocaleString(cur.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    score: drawScore(),
    lane: Math.random() * 2 - 1,
    at,
    reveal,
  };
}

const TIER_TONE: Record<Tier, string> = { pass: INK, review: ACID, block: FORGED };

function Swatch({ tier }: { tier: Tier }) {
  if (tier === "review") {
    return <span className="block h-[7px] w-[7px] border border-[color:var(--fh-acid)]" />;
  }
  return (
    <span
      className="block h-[7px] w-[7px]"
      style={{ background: tier === "block" ? "var(--fh-forged)" : "rgba(244,244,242,0.42)" }}
    />
  );
}

export function ThresholdField({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [lines, setLines] = useState<Lines>(INITIAL_LINES);
  const [touched, setTouched] = useState(false);
  const [dragging, setDragging] = useState<LineId | null>(null);
  const [rates, setRates] = useState<Record<Tier, number>>({ pass: 0, review: 0, block: 0 });
  const [ruled, setRuled] = useState(0);
  /* The tier an item held when it was flagged, kept so the readout can say
     when a change of policy has moved it since. */
  const [flag, setFlag] = useState<(Item & { flaggedAs: Tier }) | null>(null);

  const linesRef = useRef<Lines>(INITIAL_LINES);
  const scoresRef = useRef<number[]>([]);
  const ruledRef = useRef(0);
  const flagIdRef = useRef<number | null>(null);
  const repaintRef = useRef<() => void>(() => {});
  const grabRef = useRef<{ id: LineId; offset: number } | null>(null);

  const computeRates = useCallback(() => {
    const xs = scoresRef.current;
    if (!xs.length) return;
    const t = linesRef.current;
    let review = 0;
    let block = 0;
    for (const s of xs) {
      const tier = tierOf(s, t);
      if (tier === "block") block++;
      else if (tier === "review") review++;
    }
    const b = Math.round((block / xs.length) * 100);
    const r = Math.round((review / xs.length) * 100);
    setRates({ block: b, review: r, pass: 100 - b - r });
  }, []);

  /* ------------------------------------------------------------ the stream */

  useEffect(() => {
    const canvas = canvasRef.current;
    const field = fieldRef.current;
    if (!canvas || !field) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let g = geometry(1, 1);
    let sim = 0;
    let last = performance.now();
    let frame = 0;
    let running = false;
    let onScreen = true;
    let seeded = false;
    let nextAt = 0;
    let lastFlagAt = -10;
    let pulse = 0;
    let items: Item[] = [];

    const record = (score: number) => {
      scoresRef.current.push(score);
      if (scoresRef.current.length > tf.window) scoresRef.current.shift();
    };

    /** Keep the conveyor full out to just past the right edge. */
    const spawn = () => {
      const horizon = sim + (w - g.scanX + CHIP_W * 2) / V_IN;
      while (nextAt <= horizon) {
        items.push(makeItem(nextAt));
        nextAt += SPAWN * (0.5 + Math.random());
      }
    };

    /* The record starts full rather than empty — an empty scatter reads as a
       broken chart. It fills in from the engine outward, a short sweep that
       says "this is history" before the first live item arrives. */
    const seed = () => {
      items = [];
      scoresRef.current = [];
      const span = g.scanX / V_OUT + 1;
      /* Starts one resolve-time back, so no seeded item is caught mid-flight —
         which matters most for the still frame, where it would stay that way. */
      let at = -RESOLVE;
      let i = 0;
      while (-at < span) {
        at -= SPAWN * (0.5 + Math.random());
        items.push(makeItem(at, reduced ? -1 : 0.35 + i * 0.016));
        i++;
      }
      items.sort((a, b) => a.at - b.at);
      /* Rates are over a fixed window, so it starts full too. */
      while (scoresRef.current.length < tf.window) record(drawScore());
      for (const it of items) record(it.score);
      nextAt = SPAWN * 0.4;
      spawn();
      seeded = true;
      computeRates();
    };

    const paint = () => {
      ctx.clearRect(0, 0, w, h);
      const L = linesRef.current;
      const { top, bottom, scanX, laneY, laneSpread, yOf } = g;

      /* Probability rules across the record. */
      ctx.lineWidth = 1;
      for (const s of [0, 25, 50, 75, 100]) {
        const y = Math.round(yOf(s)) + 0.5;
        ctx.strokeStyle = `rgba(255,255,255,${s === 0 || s === 100 ? 0.09 : 0.045})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(scanX, y);
        ctx.stroke();
      }

      /* The incoming lane. */
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.moveTo(scanX, Math.round(laneY) + 0.5);
      ctx.lineTo(w, Math.round(laneY) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      /* The engine. A hairline core inside a soft 9px halo, both fading out at
         the ends so it reads as a beam rather than a drawn rule; brightens for
         a moment on every crossing. */
      for (const [width, alpha] of [
        [9, 0.07 + pulse * 0.08],
        [1, 0.5 + pulse * 0.4],
      ] as const) {
        const beam = ctx.createLinearGradient(0, top - 26, 0, bottom + 26);
        beam.addColorStop(0, `rgba(${ACID},0)`);
        beam.addColorStop(0.5, `rgba(${ACID},${alpha})`);
        beam.addColorStop(1, `rgba(${ACID},0)`);
        ctx.fillStyle = beam;
        ctx.fillRect(scanX + 0.5 - width / 2, top - 26, width, bottom - top + 52);
      }

      ctx.font = `500 9px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if ("letterSpacing" in ctx)
        (ctx as unknown as { letterSpacing: string }).letterSpacing = "1px";

      for (const it of items) {
        const dt = sim - it.at;
        const laneAt = laneY + it.lane * laneSpread;

        /* Still on its way in. */
        if (dt < 0) {
          const x = scanX - dt * V_IN;
          if (x - CHIP_W / 2 > w) continue;
          const edge = clamp((w - x) / 80, 0, 1);
          const near = clamp(1 - (x - scanX) / 90, 0, 1);
          ctx.globalAlpha = edge;
          ctx.fillStyle = "rgba(10,10,11,0.94)";
          ctx.fillRect(x - CHIP_W / 2, laneAt - CHIP_H / 2, CHIP_W, CHIP_H);
          ctx.strokeStyle =
            near > 0 ? `rgba(${ACID},${0.2 + near * 0.55})` : "rgba(255,255,255,0.2)";
          ctx.strokeRect(
            Math.round(x - CHIP_W / 2) + 0.5,
            Math.round(laneAt - CHIP_H / 2) + 0.5,
            CHIP_W - 1,
            CHIP_H - 1,
          );
          ctx.fillStyle = `rgba(${INK},${0.5 + near * 0.3})`;
          ctx.fillText(it.kind, x + 0.5, laneAt + 0.5);
          ctx.globalAlpha = 1;
          continue;
        }

        const x = scanX - dt * V_OUT;
        if (x < -12) continue;
        const k = Math.min(1, dt / RESOLVE);
        const e = 1 - (1 - k) ** 3;
        const target = yOf(it.score);
        const y = laneAt + (target - laneAt) * e;
        const tier = tierOf(it.score, L);
        const tone = TIER_TONE[tier];
        const reveal = clamp((sim - it.reveal) / 0.35, 0, 1);
        const fade = clamp(x / (w * 0.14), 0, 1);
        const a = reveal * fade;
        if (a <= 0) continue;

        /* Settling: the chip collapses into its point and leaves a thread
           back to the lane it came in on. */
        if (k < 1) {
          ctx.strokeStyle = `rgba(${tone},${(1 - k) * 0.5 * a})`;
          ctx.beginPath();
          ctx.moveTo(scanX, laneAt);
          ctx.lineTo(x, y);
          ctx.stroke();
          const cw = CHIP_W + (5 - CHIP_W) * e;
          const ch = CHIP_H + (5 - CHIP_H) * e;
          ctx.strokeStyle = `rgba(${tone},${0.9 * a})`;
          ctx.strokeRect(x - cw / 2, y - ch / 2, cw, ch);
          continue;
        }

        if (tier === "block") {
          ctx.fillStyle = `rgba(${FORGED},${0.14 * a})`;
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(${FORGED},${0.95 * a})`;
          ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
        } else if (tier === "review") {
          ctx.fillStyle = `rgba(${ACID},${0.2 * a})`;
          ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
          ctx.strokeStyle = `rgba(${ACID},${0.95 * a})`;
          ctx.strokeRect(x - 2.5, y - 2.5, 5, 5);
        } else {
          ctx.fillStyle = `rgba(${INK},${0.36 * a})`;
          ctx.fillRect(x - 2, y - 2, 4, 4);
        }

        /* The one the readout is describing gets the survey bracket. */
        if (it.id === flagIdRef.current) {
          ctx.strokeStyle = `rgba(${tone},${0.85 * a})`;
          ctx.strokeRect(Math.round(x - 9) + 0.5, Math.round(y - 9) + 0.5, 18, 18);
          ctx.beginPath();
          ctx.moveTo(x - 13, y - 8.5);
          ctx.lineTo(x - 9, y - 8.5);
          ctx.moveTo(x + 9, y + 9.5);
          ctx.lineTo(x + 13, y + 9.5);
          ctx.stroke();
        }
      }
    };
    repaintRef.current = paint;

    /** Everything that happens as an item reaches the engine. */
    const cross = (from: number, to: number) => {
      for (const it of items) {
        if (it.at <= from || it.at > to) continue;
        record(it.score);
        ruledRef.current++;
        pulse = 1;
        const tier = tierOf(it.score, linesRef.current);
        /* The readout holds each flag long enough to be read. */
        if (tier !== "pass" && to - lastFlagAt > 2.2) {
          lastFlagAt = to;
          flagIdRef.current = it.id;
          setFlag({ ...it, flaggedAs: tier });
        }
      }
    };

    const cull = () => {
      const oldest = sim - (g.scanX + 20) / V_OUT;
      if (items.length && items[0].at < oldest) {
        items = items.filter((it) => it.at >= oldest);
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const prev = sim;
      sim += dt;
      spawn();
      cross(prev, sim);
      cull();
      pulse = Math.max(0, pulse - dt * 3.2);
      paint();
    };

    const start = () => {
      if (running || reduced || !onScreen || document.hidden) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = field.clientWidth;
      h = field.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      g = geometry(w, h);
      setSize({ w, h });
      if (!seeded && w > 0) seed();
      paint();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(field);
    resize();

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    io.observe(field);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    /* Canvas text does not wait for webfonts; repaint once they land. */
    document.fonts?.ready.then(() => paint());

    const stats = window.setInterval(() => {
      computeRates();
      setRuled(ruledRef.current);
    }, 320);

    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.clearInterval(stats);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced, computeRates]);

  /* ----------------------------------------------------------- the control */

  /* The lines can meet but not cross: a pass line above the block line would
     be a policy that releases what it also rejects. */
  const apply = useCallback(
    (id: LineId, value: number) => {
      const cur = linesRef.current;
      const v =
        id === "block"
          ? Math.round(clamp(value, cur.pass + tf.minGap, MAX_LINE))
          : Math.round(clamp(value, MIN_LINE, cur.block - tf.minGap));
      if (v === cur[id]) return;
      const next = { ...cur, [id]: v };
      linesRef.current = next;
      setLines(next);
      setTouched(true);
      computeRates();
      repaintRef.current();
    },
    [computeRates],
  );

  const scoreAt = (clientY: number) => {
    const field = fieldRef.current;
    if (!field) return 0;
    const rect = field.getBoundingClientRect();
    const g = geometry(rect.width, rect.height);
    return ((g.bottom - (clientY - rect.top)) / (g.bottom - g.top)) * 100;
  };

  const dragFor = (id: LineId) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      /* Grabbing a handle off-centre must not make its line jump. */
      grabRef.current = { id, offset: scoreAt(e.clientY) - linesRef.current[id] };
      setDragging(id);
      setTouched(true);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const grab = grabRef.current;
      if (!grab || grab.id !== id) return;
      apply(id, scoreAt(e.clientY) - grab.offset);
    },
    onPointerUp: () => {
      grabRef.current = null;
      setDragging(null);
    },
    onPointerCancel: () => {
      grabRef.current = null;
      setDragging(null);
    },
  });

  const keyFor = (id: LineId) => (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 1;
    const t = linesRef.current[id];
    const next =
      e.key === "ArrowUp" || e.key === "ArrowRight"
        ? t + step
        : e.key === "ArrowDown" || e.key === "ArrowLeft"
          ? t - step
          : e.key === "Home"
            ? MIN_LINE
            : e.key === "End"
              ? MAX_LINE
              : null;
    if (next === null) return;
    e.preventDefault();
    apply(id, next);
  };

  const g = geometry(size.w || 1, size.h || 1);
  const blockY = g.yOf(lines.block);
  const passY = g.yOf(lines.pass);
  const midY = (blockY + passY) / 2;
  const ready = size.w > 0;
  const flagTier = flag ? tierOf(flag.score, lines) : null;
  /* When the lines come close the two handles would stack; the lower one
     steps aside rather than hide under the upper. */
  const crowded = passY - blockY < 34;
  const handles: { id: LineId; y: number; tone: string; ink: string }[] = [
    { id: "block", y: blockY, tone: "var(--fh-forged)", ink: "#0a0a0b" },
    { id: "pass", y: passY, tone: "var(--fh-ink)", ink: "#0a0a0b" },
  ];

  return (
    <div className={cn("flex flex-col", className)} style={style}>
      <div ref={fieldRef} className="relative min-h-[16rem] flex-1 select-none">
        <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />

        {ready && (
          <>
            {/* Full-bleed layer: everything measured against the engine. */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <span
                className="fh-label absolute top-3 -translate-x-1/2 text-[10px] text-[color:var(--fh-acid)]"
                style={{ left: g.scanX }}
              >
                {tf.engine}
              </span>
              <span
                className="fh-label absolute bottom-2.5 text-[10px] text-[color:var(--fh-ink-ghost)]"
                style={{ left: g.scanX + 18 }}
              >
                ← {tf.incoming}
              </span>
              {[100, 0].map((s) => (
                <span
                  key={s}
                  className="fh-figure absolute -translate-y-1/2 text-[0.8125rem] text-[color:var(--fh-ink-ghost)]"
                  style={{ top: g.yOf(s), right: size.w - g.scanX + 9 }}
                >
                  {s}
                </span>
              ))}

              {/* The review band is whatever lies between the two lines. */}
              <div
                className="absolute left-0 transition-[background-color] duration-300"
                style={{
                  top: blockY,
                  height: passY - blockY,
                  width: g.scanX,
                  background: `rgba(${ACID},${dragging ? 0.075 : 0.05})`,
                }}
              />
              <div
                className="absolute left-0 h-px"
                style={{
                  top: blockY,
                  width: g.scanX,
                  background: "var(--fh-forged)",
                  opacity: dragging === "block" ? 1 : 0.75,
                }}
              />
              <div
                className="absolute left-0 h-px"
                style={{
                  top: passY,
                  width: g.scanX,
                  background: "var(--fh-ink)",
                  opacity: dragging === "pass" ? 0.9 : 0.5,
                }}
              />

              {/* The tiers, named where they are. Backed, because the record
                  drifts underneath them on its way out of the engine. */}
              {blockY - g.top > 16 && (
                <span
                  className="fh-label absolute bg-[rgba(10,10,11,0.78)] px-1 text-right text-[10px] text-[color:var(--fh-forged)]"
                  style={{ top: blockY - 18, right: size.w - g.scanX + 34 }}
                >
                  {tf.tiers[2].label}
                </span>
              )}
              {passY - blockY > 18 && (
                <span
                  className="fh-label absolute -translate-y-1/2 bg-[rgba(10,10,11,0.78)] px-1 text-right text-[10px] text-[color:var(--fh-acid)]"
                  style={{ top: midY, right: size.w - g.scanX + 34 }}
                >
                  {tf.tiers[1].label}
                </span>
              )}
              {g.bottom - passY > 22 && (
                <span
                  className="fh-label absolute bg-[rgba(10,10,11,0.78)] px-1 text-right text-[10px] text-[color:var(--fh-ink-faint)]"
                  style={{ top: passY + 7, right: size.w - g.scanX + 34 }}
                >
                  {tf.tiers[0].label}
                </span>
              )}
            </div>

            {/* Hit strips along each line, for a mouse, split at the midpoint so
                two close lines never fight over the same pixels. On touch only
                the handles take the drag, so the page still scrolls under a
                thumb. */}
            <div
              className="absolute left-0 hidden cursor-ns-resize touch-none [@media(hover:hover)]:block"
              style={{ top: blockY - 12, height: Math.min(24, midY - blockY + 12), width: g.scanX }}
              {...dragFor("block")}
            />
            <div
              className="absolute left-0 hidden cursor-ns-resize touch-none [@media(hover:hover)]:block"
              style={{
                top: Math.max(passY - 12, midY),
                height: passY + 12 - Math.max(passY - 12, midY),
                width: g.scanX,
              }}
              {...dragFor("pass")}
            />

            {/* Shell layer: labels and the handle, aligned to the page grid. */}
            <div className="pointer-events-none absolute inset-0">
              <div className="fh-shell relative h-full">
                <span className="fh-label absolute left-[var(--fh-gutter)] top-3 text-[10px] text-[color:var(--fh-ink-ghost)]">
                  ↑ {tf.axis}
                </span>

                {handles.map((h, i) => {
                  const line = tf.lines[h.id];
                  const active = dragging === h.id;
                  return (
                    <div
                      key={h.id}
                      role="slider"
                      tabIndex={0}
                      aria-label={line.aria}
                      aria-valuemin={MIN_LINE}
                      aria-valuemax={MAX_LINE}
                      aria-valuenow={lines[h.id]}
                      onKeyDown={keyFor(h.id)}
                      {...dragFor(h.id)}
                      className={cn(
                        "group pointer-events-auto absolute -translate-y-1/2 cursor-ns-resize touch-none outline-none transition-[left] duration-300 ease-[var(--fh-ease-out)]",
                        h.id === "pass" && crowded
                          ? "left-[calc(var(--fh-gutter)+8.75rem)]"
                          : "left-[var(--fh-gutter)]",
                      )}
                      style={{ top: h.y }}
                    >
                      {/* Outlined at rest, filled while held or focused. */}
                      <div
                        className={cn(
                          "flex items-center gap-2.5 border py-1.5 pl-2.5 pr-3 transition-[transform,background-color,color] duration-200",
                          !touched && !reduced && "fh-nudge",
                          active && "scale-[1.04]",
                        )}
                        style={{
                          borderColor: h.tone,
                          background: active ? h.tone : "rgba(10,10,11,0.9)",
                          color: active ? h.ink : h.tone,
                          animationDelay: `${1.6 + i * 0.35}s`,
                        }}
                      >
                        <svg width="8" height="10" viewBox="0 0 8 10" aria-hidden>
                          <path d="M4 0L7.5 3.5H0.5z M4 10L0.5 6.5H7.5z" fill="currentColor" />
                        </svg>
                        <span className="fh-label text-[10px]">
                          {line.label} {line.sign}
                        </span>
                        <span className="fh-figure min-w-[1.4em] text-[1.0625rem] font-medium leading-none">
                          {lines[h.id]}
                        </span>
                      </div>
                      <span className="pointer-events-none absolute -inset-1 border border-[color:var(--fh-acid)] opacity-0 group-focus-visible:opacity-100" />
                    </div>
                  );
                })}

                {!g.narrow && (
                  <span
                    className="fh-label absolute left-[calc(var(--fh-gutter)+8.75rem)] -translate-y-full pb-2 text-[10px] text-[color:var(--fh-ink-faint)] transition-opacity duration-500"
                    style={{ top: blockY, opacity: touched ? 0 : 1 }}
                    aria-hidden
                  >
                    {tf.hint}
                  </span>
                )}

                {/* What the bracketed point is. */}
                {flag && flagTier && !g.narrow && (
                  <div
                    key={flag.id}
                    className="absolute right-[var(--fh-gutter)] top-3 w-[16.5rem] border border-[color:var(--fh-line)] bg-[rgba(10,10,11,0.86)] px-4 py-3 backdrop-blur-sm"
                    style={{ animation: "fh-rise 520ms var(--fh-ease-out) both" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="fh-label text-[10px] text-[color:var(--fh-ink-ghost)]">
                        {tf.lastFlagged}
                      </span>
                      <span
                        className="fh-label text-[10px]"
                        style={{ color: `rgb(${TIER_TONE[flagTier]})` }}
                      >
                        {flagTier !== flag.flaggedAs && "→ "}
                        {tf.tiers.find((t) => t.id === flagTier)?.label}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-[0.8125rem] text-[color:var(--fh-ink)]">
                        <span className="fh-label mr-2 text-[10px] text-[color:var(--fh-acid)]">
                          {flag.kind}
                        </span>
                        {flag.name}
                      </span>
                      <span className="fh-figure text-[1.25rem] font-medium leading-none">
                        {flag.score.toFixed(1)}
                      </span>
                    </div>
                    <div className="fh-figure mt-1 text-[0.9375rem] text-[color:var(--fh-ink-faint)]">
                      {flag.amount}
                    </div>
                  </div>
                )}

                {/* Under the record, because that is what it qualifies. */}
                <span className="fh-label absolute bottom-2.5 left-[var(--fh-gutter)] text-[10px] text-[color:var(--fh-ink-ghost)]">
                  {tf.simulated}
                  {!g.narrow && ` · ${tf.windowNote}`}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* The rates, which are the policy's consequences. */}
      <div className="fh-shell">
        <div className="grid grid-cols-3 border-y border-[color:var(--fh-line)] lg:grid-cols-4">
          {tf.tiers.map((t) => (
            <div
              key={t.id}
              className="border-l border-[color:var(--fh-line)] py-4 pl-4 first:border-l-0 first:pl-0 sm:pl-6"
            >
              <div className="flex items-center gap-2">
                <Swatch tier={t.id} />
                <span className="fh-label text-[10px] text-[color:var(--fh-ink-faint)]">
                  {t.label}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="fh-figure text-[clamp(1.5rem,2.2vw,1.875rem)] font-medium leading-none">
                  {rates[t.id]}
                  <span className="ml-0.5 text-[0.6em] text-[color:var(--fh-ink-faint)]">%</span>
                </span>
                <span className="hidden text-[0.75rem] text-[color:var(--fh-ink-faint)] sm:inline">
                  {t.detail}
                </span>
              </div>
            </div>
          ))}
          <div className="hidden flex-col items-end justify-center gap-1 py-4 text-right lg:flex">
            <span className="fh-label text-[10px] text-[color:var(--fh-ink-ghost)]">
              {tf.ruled}
            </span>
            <span className="fh-figure text-[1.5rem] font-medium leading-none">
              {ruled.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
