import { useEffect, useState } from "react";
import { useReducedMotion } from "../hooks";
import { Mark } from "./Mark";

const STAGES = ["BOOT DETECTION LINES", "LOAD RULE LIBRARY", "CALIBRATE THRESHOLD", "READY"];

/**
 * Cold-open.
 *
 * The wordmark is masked and an acid beam sweeps it into existence while a
 * mono readout steps through the boot stages — the same "scan resolves the
 * truth" idea the rest of the page is built on, stated once, up front.
 *
 * It runs for ~1.7s, only on the first visit of a session, and is skipped
 * entirely under reduced motion. Nothing on the page waits for it: the hero is
 * already mounted underneath, so the beam is pure theatre, not a loading gate.
 */
export function Preloader({ onDone }: { onDone?: () => void }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"init" | "run" | "lift" | "gone">("init");
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const seen = sessionStorage.getItem("fh-intro");
    if (reduced || seen) {
      setPhase("gone");
      onDone?.();
      return;
    }
    sessionStorage.setItem("fh-intro", "1");

    document.body.style.overflow = "hidden";
    const timers = [
      window.setTimeout(() => setPhase("run"), 40),
      ...STAGES.map((_, i) => window.setTimeout(() => setStage(i), 220 + i * 340)),
      window.setTimeout(() => setPhase("lift"), 1700),
      window.setTimeout(() => {
        setPhase("gone");
        document.body.style.overflow = "";
        onDone?.();
      }, 2380),
    ];
    return () => {
      timers.forEach(window.clearTimeout);
      document.body.style.overflow = "";
    };
  }, [reduced, onDone]);

  if (phase === "gone") return null;

  const lifting = phase === "lift";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[color:var(--fh-void)]"
      style={{
        clipPath: lifting ? "inset(0 0 100% 0)" : "inset(0 0 0 0)",
        transition: "clip-path 680ms cubic-bezier(0.76, 0, 0.24, 1)",
      }}
      aria-hidden
    >
      <div className="fh-grid-bg absolute inset-0 opacity-40" />

      <div className="relative flex flex-col items-center gap-6">
        <div className="fh-scan relative px-2" data-shown={phase !== "init"}>
          <span className="fh-scan__beam" />
          <div className="fh-scan__text flex items-center gap-3">
            <Mark size={34} scanning />
            <span
              className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold tracking-[-0.03em]"
              style={{ color: "var(--fh-ink)" }}
            >
              FakeHunter<span style={{ color: "var(--fh-acid)" }}>.AI</span>
            </span>
          </div>
        </div>

        <div className="flex h-4 items-center gap-2">
          <span
            className="block h-1 w-1 bg-[color:var(--fh-acid)]"
            style={{ animation: "fh-blink 0.9s steps(1,end) infinite" }}
          />
          <span className="fh-mono text-[10px]" style={{ color: "var(--fh-ink-faint)" }}>
            {STAGES[stage]}
          </span>
        </div>

        <div className="h-px w-[min(58vw,320px)] overflow-hidden bg-[color:var(--fh-line)]">
          <div
            className="h-full origin-left bg-[color:var(--fh-acid)]"
            style={{
              transform: `scaleX(${(stage + 1) / STAGES.length})`,
              transition: "transform 420ms var(--fh-ease-out)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
