import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";
import { thresholdField as tf } from "../content.home";
import { useReducedMotion } from "../hooks";

/**
 * The hero field: a live stream of payment proofs meeting a threshold.
 *
 * Proofs arrive from the right as small typed chips and meet the engine line.
 * Each one leaves it as a point, placed at its fake probability, and drifts
 * left into the record — so the left of the field is a scatter plot of every
 * verdict so far, with time running right to left.
 *
 * One horizontal line cuts through that record. Above it is blocked; a band
 * just under it goes to review; everything below is released. The line is the
 * only interactive thing here and it is the point of the whole hero: drag it
 * and every verdict already on screen re-sorts, and the rates underneath move
 * with it. The model's output does not change. Your policy does.
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
const MIN_T = 12;
const MAX_T = 86;
const PAD_T = 46;
const PAD_B = 34;
const CHIP_W = 40;
const CHIP_H = 18;

function tierOf(score: number, threshold: number): Tier {
  if (score >= threshold) return "block";
  if (score >= threshold - tf.reviewBand) return "review";
  return "pass";
}

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
   middle — which is the only reason the threshold is a decision at all. */
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
  const [threshold, setThreshold] = useState<number>(tf.initialThreshold);
  const [touched, setTouched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [rates, setRates] = useState<Record<Tier, number>>({ pass: 0, review: 0, block: 0 });
  const [ruled, setRuled] = useState(0);
  const [flag, setFlag] = useState<Item | null>(null);

  const thresholdRef = useRef<number>(tf.initialThreshold);
  const scoresRef = useRef<number[]>([]);
  const ruledRef = useRef(0);
  const flagIdRef = useRef<number | null>(null);
  const repaintRef = useRef<() => void>(() => {});
  const grabRef = useRef<number | null>(null);

  const computeRates = useCallback(() => {
    const xs = scoresRef.current;
    if (!xs.length) return;
    const t = thresholdRef.current;
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
      const T = thresholdRef.current;
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
        const tier = tierOf(it.score, T);
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
        const tier = tierOf(it.score, thresholdRef.current);
        /* The readout holds each flag long enough to be read. */
        if (tier !== "pass" && to - lastFlagAt > 2.2) {
          lastFlagAt = to;
          flagIdRef.current = it.id;
          setFlag(it);
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

  const apply = useCallback(
    (value: number) => {
      const v = Math.round(clamp(value, MIN_T, MAX_T));
      if (v === thresholdRef.current) return;
      thresholdRef.current = v;
      setThreshold(v);
      setTouched(true);
      computeRates();
      repaintRef.current();
    },
    [computeRates],
  );

  const scoreAt = (clientY: number) => {
    const field = fieldRef.current;
    if (!field) return thresholdRef.current;
    const rect = field.getBoundingClientRect();
    const g = geometry(rect.width, rect.height);
    return ((g.bottom - (clientY - rect.top)) / (g.bottom - g.top)) * 100;
  };

  const onDown = (e: ReactPointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    /* Grabbing the handle off-centre must not make the line jump. */
    grabRef.current = scoreAt(e.clientY) - thresholdRef.current;
    setDragging(true);
    setTouched(true);
  };
  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (grabRef.current === null) return;
    apply(scoreAt(e.clientY) - grabRef.current);
  };
  const onUp = () => {
    grabRef.current = null;
    setDragging(false);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 1;
    const t = thresholdRef.current;
    const next =
      e.key === "ArrowUp" || e.key === "ArrowRight"
        ? t + step
        : e.key === "ArrowDown" || e.key === "ArrowLeft"
          ? t - step
          : e.key === "Home"
            ? MIN_T
            : e.key === "End"
              ? MAX_T
              : null;
    if (next === null) return;
    e.preventDefault();
    apply(next);
  };

  const g = geometry(size.w || 1, size.h || 1);
  const lineY = g.yOf(threshold);
  const bandY = Math.min(g.bottom, g.yOf(threshold - tf.reviewBand));
  const ready = size.w > 0;
  const flagTier = flag ? tierOf(flag.score, threshold) : null;
  const drag = {
    onPointerDown: onDown,
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp,
  };

  return (
    <div className={cn("flex flex-col", className)} style={style}>
      <div ref={fieldRef} className="relative min-h-[17rem] flex-1 select-none">
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

              {/* Review band, then the line on top of it. */}
              <div
                className="absolute left-0 transition-[background-color] duration-300"
                style={{
                  top: lineY,
                  height: bandY - lineY,
                  width: g.scanX,
                  background: `rgba(${ACID},${dragging ? 0.075 : 0.045})`,
                  borderBottom: `1px dashed rgba(${ACID},0.22)`,
                }}
              />
              <div
                className="absolute left-0 h-px bg-[color:var(--fh-acid)]"
                style={{ top: lineY, width: g.scanX, opacity: dragging ? 1 : 0.8 }}
              />

              {/* The tiers, named where they are. */}
              <span
                className="fh-label absolute text-right text-[10px] text-[color:var(--fh-forged)]"
                style={{ top: lineY - 18, right: size.w - g.scanX + 34 }}
              >
                {tf.tiers[2].label}
              </span>
              {bandY - lineY > 16 && (
                <span
                  className="fh-label absolute -translate-y-1/2 text-right text-[10px] text-[color:var(--fh-acid)]"
                  style={{ top: (lineY + bandY) / 2, right: size.w - g.scanX + 34 }}
                >
                  {tf.tiers[1].label}
                </span>
              )}
              {g.bottom - bandY > 22 && (
                <span
                  className="fh-label absolute text-right text-[10px] text-[color:var(--fh-ink-faint)]"
                  style={{ top: bandY + 7, right: size.w - g.scanX + 34 }}
                >
                  {tf.tiers[0].label}
                </span>
              )}
            </div>

            {/* Hit strip along the line, for a mouse. On touch only the handle
                takes the drag, so the page still scrolls under a thumb. */}
            <div
              className="absolute left-0 hidden cursor-ns-resize touch-none [@media(hover:hover)]:block"
              style={{ top: lineY - 12, height: 24, width: g.scanX }}
              {...drag}
            />

            {/* Shell layer: labels and the handle, aligned to the page grid. */}
            <div className="pointer-events-none absolute inset-0">
              <div className="fh-shell relative h-full">
                <span className="fh-label absolute left-[var(--fh-gutter)] top-3 text-[10px] text-[color:var(--fh-ink-ghost)]">
                  ↑ {tf.axis}
                </span>

                <div
                  role="slider"
                  tabIndex={0}
                  aria-label={tf.thresholdAria}
                  aria-valuemin={MIN_T}
                  aria-valuemax={MAX_T}
                  aria-valuenow={threshold}
                  onKeyDown={onKey}
                  {...drag}
                  className="pointer-events-auto absolute left-[var(--fh-gutter)] -translate-y-1/2 cursor-ns-resize touch-none"
                  style={{ top: lineY }}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2.5 bg-[color:var(--fh-acid)] py-1.5 pl-2.5 pr-3 text-[#0a0a0b] transition-transform duration-200",
                      !touched && !reduced && "fh-nudge",
                      dragging && "scale-[1.04]",
                    )}
                  >
                    <svg width="8" height="10" viewBox="0 0 8 10" aria-hidden>
                      <path d="M4 0L7.5 3.5H0.5z M4 10L0.5 6.5H7.5z" fill="currentColor" />
                    </svg>
                    <span className="fh-label text-[10px]">{tf.threshold}</span>
                    <span className="fh-figure min-w-[1.4em] text-[1.0625rem] font-medium leading-none">
                      {threshold}
                    </span>
                  </div>
                </div>

                {!g.narrow && (
                  <span
                    className="fh-label absolute left-[calc(var(--fh-gutter)+10.25rem)] -translate-y-full pb-2 text-[10px] text-[color:var(--fh-ink-faint)] transition-opacity duration-500"
                    style={{ top: lineY, opacity: touched ? 0 : 1 }}
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
        <div className="grid grid-cols-3 border-t border-[color:var(--fh-line)] lg:grid-cols-4">
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
