import { useCallback, useEffect, useRef, useState } from "react";
import { Verdict } from "./primitives";

type Row = { key: string; value: string; flag: boolean };
type Doc = { amount: string; rows: readonly Row[] };

/**
 * A reconstructed document. Both sides of a comparison render through this
 * component with different data, so the two states line up pixel for pixel
 * and the wipe reveals a difference rather than a different layout.
 */
function DocumentFace({
  doc,
  headline,
  tone,
  showFlags,
}: {
  doc: Doc;
  headline: string;
  tone: "forged" | "genuine";
  showFlags: boolean;
}) {
  const accent = tone === "forged" ? "var(--fh-forged)" : "var(--fh-genuine)";
  return (
    <div className="flex h-full w-full flex-col bg-[#f7f7f4] text-[#0a0a0b]">
      <div className="flex items-center justify-between px-5 py-3" style={{ background: accent }}>
        <span className="fh-label text-[10px] text-[#0a0a0b]">{headline}</span>
        <span className="fh-label text-[10px] text-[#0a0a0b]">
          {tone === "forged" ? "FORGED" : "GENUINE"}
        </span>
      </div>

      <div className="flex-1 px-5 py-5">
        <div className="fh-label text-[9px] text-[#0a0a0b]/45">TOTAL</div>
        <div
          className="fh-tnum mt-1 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.022em]"
          style={{ color: accent }}
        >
          {doc.amount}
        </div>

        <div className="mt-5">
          {doc.rows.map((row) => (
            <div
              key={row.key}
              className="relative flex items-baseline justify-between gap-4 border-t border-black/10 py-2"
              style={{
                background: showFlags && row.flag ? "rgba(255,90,77,0.12)" : undefined,
              }}
            >
              <span className="fh-label text-[9px] text-[#0a0a0b]/50">{row.key}</span>
              <span
                className="fh-tnum text-[0.8125rem] font-medium"
                style={{ color: showFlags && row.flag ? "var(--fh-forged)" : undefined }}
              >
                {row.value}
              </span>
              {showFlags && row.flag && (
                <span
                  className="pointer-events-none absolute inset-0 border border-dashed"
                  style={{ borderColor: "var(--fh-forged)" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Drag-to-compare.
 *
 * The forged document sits on top of the genuine one and is clipped to the
 * handle position. It is the only place on the site where the reader has to
 * do the work themselves — sweeping the handle back and forth over a field
 * that changes by two characters is a faster argument for the product than
 * any paragraph about accuracy.
 *
 * Exposed as a real slider so it works from the keyboard as well as a drag.
 */
export function Compare({
  forged,
  genuine,
  headline,
  label,
}: {
  forged: Doc;
  genuine: Doc;
  headline: string;
  label: string;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState(56);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(96, Math.max(4, pct)));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      setFromClientX(e.clientX);
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
  }, [setFromClientX]);

  return (
    <div className="relative">
      <div
        ref={boxRef}
        className="relative aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden touch-pan-y"
        onPointerDown={(e) => {
          dragging.current = true;
          setFromClientX(e.clientX);
        }}
      >
        <div className="absolute inset-0">
          <DocumentFace doc={genuine} headline={headline} tone="genuine" showFlags={false} />
        </div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <DocumentFace doc={forged} headline={headline} tone="forged" showFlags />
        </div>

        {/* Handle */}
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-[color:var(--fh-acid)]"
          style={{ left: `${pos}%` }}
        >
          <span
            className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
            style={{ background: "var(--fh-acid)" }}
          >
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden>
              <path d="M5 1L1 5l4 4M11 1l4 4-4 4" stroke="#0a0a0b" strokeWidth="1.4" />
            </svg>
          </span>
        </div>

        <input
          type="range"
          min={4}
          max={96}
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`${label} — drag to compare the forged and genuine document`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Verdict tone="forged">Forged</Verdict>
        <span className="fh-label text-[9px] text-[color:var(--fh-ink-ghost)]">
          Drag to compare
        </span>
        <Verdict tone="genuine">Genuine</Verdict>
      </div>
    </div>
  );
}
