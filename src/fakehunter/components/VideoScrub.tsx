import { useEffect, useRef, useState } from "react";
import { Verdict } from "./primitives";
import { useReducedMotion } from "../hooks";

/**
 * Scrubbable screen recording.
 *
 * The finger travels down the screen on a smooth path, except across second
 * 24 where it jumps — the discontinuity a spliced recording leaves behind.
 * Scrub past it and you can feel the jump; play it at speed and you cannot,
 * which is exactly why manual review misses this class of forgery.
 */
export function VideoScrub({
  duration,
  spliceAt,
  caption,
}: {
  duration: number;
  spliceAt: number;
  caption: string;
}) {
  const [t, setT] = useState(spliceAt - 6);
  const [playing, setPlaying] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!playing || reduced) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => (prev + dt * 4 > duration ? 0 : prev + dt * 4));
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration, reduced]);

  useEffect(() => {
    const setFrom = (clientX: number) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const pct = (clientX - rect.left) / rect.width;
      setT(Math.min(duration, Math.max(0, pct * duration)));
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      setFrom(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [duration]);

  // Continuous descent with a single discontinuity at the splice.
  const base = 0.14 + (t / duration) * 0.58;
  const fingerY = (t >= spliceAt ? base + 0.17 : base) * 100;
  const atSplice = Math.abs(t - spliceAt) < 0.9;

  const mmss = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex flex-1 items-center justify-center bg-[color:var(--fh-void)] p-6">
        <div className="fh-grid-bg absolute inset-0 opacity-60" />

        {/* Phone frame */}
        <div
          className="relative aspect-[9/17] w-[108px] overflow-hidden border bg-[#101014] transition-colors duration-200"
          style={{
            borderColor: atSplice ? "var(--fh-forged)" : "var(--fh-line-strong)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-6 bg-white/[0.06]" />
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="absolute left-3 right-3 block h-[5px] bg-white/[0.08]"
              style={{ top: 38 + i * 16 }}
            />
          ))}
          <span className="absolute left-3 block h-3 w-12 bg-white/20" style={{ top: 120 }} />

          {/* The finger. */}
          <span
            className="absolute left-1/2 block h-4 w-4 -translate-x-1/2 rounded-full border"
            style={{
              top: `${fingerY}%`,
              borderColor: atSplice ? "var(--fh-forged)" : "var(--fh-acid)",
              background: atSplice ? "rgba(255,90,77,0.3)" : "rgba(225,240,86,0.22)",
              transition: dragging.current ? "none" : "top 90ms linear",
            }}
          />

          {atSplice && (
            <span className="fh-label absolute inset-x-0 bottom-2 text-center text-[8px] text-[color:var(--fh-forged)]">
              SPLICE
            </span>
          )}
        </div>

        <span className="fh-label absolute left-4 top-4 text-[9px] text-[color:var(--fh-ink-ghost)]">
          {mmss(t)} / {mmss(duration)}
        </span>
        <span
          className="fh-label absolute right-4 top-4 text-[9px]"
          style={{ color: atSplice ? "var(--fh-forged)" : "var(--fh-ink-ghost)" }}
        >
          FRAME {String(Math.floor(t * 25)).padStart(4, "0")}
        </span>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-3 border-t border-[color:var(--fh-line)] px-4 py-3">
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-6 w-6 shrink-0 items-center justify-center border border-[color:var(--fh-line-strong)] transition-colors duration-200 hover:border-[color:var(--fh-acid)]"
        >
          {playing ? (
            <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden>
              <rect width="2.5" height="9" fill="var(--fh-acid)" />
              <rect x="5" width="2.5" height="9" fill="var(--fh-acid)" />
            </svg>
          ) : (
            <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden>
              <path d="M0 0l8 4.5L0 9z" fill="var(--fh-acid)" />
            </svg>
          )}
        </button>

        <div
          ref={barRef}
          className="relative h-6 flex-1 cursor-ew-resize"
          onPointerDown={(e) => {
            dragging.current = true;
            setPlaying(false);
            const rect = e.currentTarget.getBoundingClientRect();
            setT(
              Math.min(duration, Math.max(0, ((e.clientX - rect.left) / rect.width) * duration)),
            );
          }}
        >
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[color:var(--fh-line-strong)]" />
          <span
            className="absolute top-1/2 h-px -translate-y-1/2 bg-[color:var(--fh-acid)]"
            style={{ left: 0, width: `${(t / duration) * 100}%` }}
          />
          {/* The suspect window the temporal model returns. */}
          <span
            className="absolute top-1/2 h-3 -translate-y-1/2"
            style={{
              left: `${((spliceAt - 1) / duration) * 100}%`,
              width: `${(2 / duration) * 100}%`,
              background: "rgba(255,90,77,0.35)",
              outline: "1px solid var(--fh-forged)",
            }}
          />
          <span
            className="absolute top-1/2 block h-3.5 w-[3px] -translate-x-1/2 -translate-y-1/2 bg-[color:var(--fh-acid)]"
            style={{ left: `${(t / duration) * 100}%` }}
          />
        </div>

        <Verdict tone="forged">0:24</Verdict>
      </div>

      <p className="border-t border-[color:var(--fh-line)] px-4 py-3 text-[0.8125rem] italic leading-[1.5] text-[color:var(--fh-ink-faint)]">
        {caption}
      </p>
    </div>
  );
}
