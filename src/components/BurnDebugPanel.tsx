import { useState } from "react";

export type BurnParams = {
  warpAmp: number;
  warpFreq: number;
  streakAmp: number;
  streakFreq: number;
  angularAmp: number;
  angularFreq: number;
  chromaAberration: number;
  shardDisplace: number;
  grainAmount: number;
  glitchFlicker: number;
  coreRimAlpha: number;
  hotHaloAlpha: number;
  cloudDiffuseAlpha: number;
  mistAlpha: number;
  haloFalloff: number;
};

export const DEFAULT_BURN_PARAMS: BurnParams = {
  warpAmp: 0.78,
  warpFreq: 1.05,
  streakAmp: 0.52,
  streakFreq: 2.7,
  angularAmp: 1.7,
  angularFreq: 0.55,
  chromaAberration: 0.34,
  shardDisplace: 0.55,
  grainAmount: 1.0,
  glitchFlicker: 0.0,
  coreRimAlpha: 0.95,
  hotHaloAlpha: 0.55,
  cloudDiffuseAlpha: 0.29,
  mistAlpha: 0.2,
  haloFalloff: 0.72,
};

type Range = { min: number; max: number; step: number };

const RANGES: Record<keyof BurnParams, Range> = {
  warpAmp: { min: 0, max: 1.2, step: 0.01 },
  warpFreq: { min: 0.3, max: 6, step: 0.05 },
  streakAmp: { min: 0, max: 0.6, step: 0.005 },
  streakFreq: { min: 1, max: 14, step: 0.1 },
  angularAmp: { min: 0, max: 3, step: 0.02 },
  angularFreq: { min: 0.2, max: 3, step: 0.02 },
  chromaAberration: { min: 0, max: 2.5, step: 0.02 },
  shardDisplace: { min: 0, max: 2.5, step: 0.02 },
  grainAmount: { min: 0, max: 2, step: 0.02 },
  glitchFlicker: { min: 0, max: 2, step: 0.02 },
  coreRimAlpha: { min: 0, max: 1.5, step: 0.01 },
  hotHaloAlpha: { min: 0, max: 1.5, step: 0.01 },
  cloudDiffuseAlpha: { min: 0, max: 1.5, step: 0.01 },
  mistAlpha: { min: 0, max: 1.5, step: 0.01 },
  haloFalloff: { min: 0.3, max: 3, step: 0.02 },
};

const GROUPS: Array<{ title: string; keys: (keyof BurnParams)[] }> = [
  {
    title: "不规则度 Shape",
    keys: ["warpAmp", "warpFreq", "streakAmp", "streakFreq", "angularAmp", "angularFreq"],
  },
  {
    title: "噪声强度 Glitch",
    keys: ["chromaAberration", "shardDisplace", "grainAmount", "glitchFlicker"],
  },
  {
    title: "边缘层 Halo",
    keys: ["coreRimAlpha", "hotHaloAlpha", "cloudDiffuseAlpha", "mistAlpha", "haloFalloff"],
  },
];

export function BurnDebugPanel({
  values,
  onChange,
  onReset,
  onJumpToBurst,
  onFinish,
}: {
  values: BurnParams;
  onChange: (next: BurnParams) => void;
  onReset: () => void;
  onJumpToBurst?: () => void;
  onFinish?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const setField = (k: keyof BurnParams, v: number) => {
    onChange({ ...values, [k]: v });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(values, null, 2));
    } catch { /* ignore */ }
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: "fixed", top: 88, right: 16, zIndex: 200,
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(20,20,24,0.85)", color: "#fff",
          border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
          fontSize: 14, fontFamily: "monospace",
        }}
        aria-label="Open Burn Debug"
      >⚙</button>
    );
  }

  return (
    <div
      style={{
        position: "fixed", top: 88, right: 16, zIndex: 200,
        width: 280, maxHeight: "calc(100vh - 120px)", overflowY: "auto",
        background: "rgba(16,16,20,0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        color: "#e8e8ec",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
        padding: "10px 12px 12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 600, letterSpacing: 0.3 }}>Burn Ring Debug</div>
        <button
          onClick={() => setCollapsed(true)}
          style={{ background: "transparent", color: "#aaa", border: "none", cursor: "pointer", fontSize: 14 }}
          aria-label="Collapse"
        >×</button>
      </div>
      {GROUPS.map((g) => (
        <div key={g.title} style={{ marginBottom: 10 }}>
          <div style={{ color: "#9aa0a6", marginBottom: 4, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>{g.title}</div>
          {g.keys.map((k) => {
            const r = RANGES[k];
            const v = values[k];
            return (
              <div key={k} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span>{k}</span>
                  <input
                    type="number"
                    value={Number(v.toFixed(3))}
                    step={r.step}
                    min={r.min}
                    max={r.max}
                    onChange={(e) => setField(k, parseFloat(e.target.value) || 0)}
                    style={{
                      width: 60, background: "rgba(255,255,255,0.06)", color: "#fff",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4,
                      padding: "1px 4px", fontSize: 10, fontFamily: "inherit", textAlign: "right",
                    }}
                  />
                </div>
                <input
                  type="range"
                  min={r.min}
                  max={r.max}
                  step={r.step}
                  value={v}
                  onChange={(e) => setField(k, parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#C5A9FF" }}
                />
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button
          onClick={onReset}
          style={{
            flex: 1, padding: "5px 8px", background: "rgba(255,255,255,0.08)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.14)", borderRadius: 5, cursor: "pointer", fontSize: 11,
          }}
        >Reset</button>
        <button
          onClick={copy}
          style={{
            flex: 1, padding: "5px 8px", background: "rgba(197,169,255,0.18)", color: "#fff",
            border: "1px solid rgba(197,169,255,0.35)", borderRadius: 5, cursor: "pointer", fontSize: 11,
          }}
        >Copy JSON</button>
      </div>
      {(onJumpToBurst || onFinish) && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {onJumpToBurst && (
            <button
              onClick={onJumpToBurst}
              style={{
                flex: 1, padding: "5px 8px", background: "rgba(255,255,255,0.08)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.14)", borderRadius: 5, cursor: "pointer", fontSize: 11,
              }}
            >Jump to Burst</button>
          )}
          {onFinish && (
            <button
              onClick={onFinish}
              style={{
                flex: 1, padding: "5px 8px", background: "rgba(197,169,255,0.28)", color: "#fff",
                border: "1px solid rgba(197,169,255,0.5)", borderRadius: 5, cursor: "pointer", fontSize: 11,
              }}
            >Finish →</button>
          )}
        </div>
      )}
    </div>
  );
}

export default BurnDebugPanel;