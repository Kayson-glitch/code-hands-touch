import { useEffect, useRef, useState } from "react";
import { GlitchGrainOverlay } from "./GlitchGrainOverlay";

type Metric = {
  value: number;
  suffix: string;
  label: string;
  note: string;
};

const METRICS: Metric[] = [
  {
    value: 85,
    suffix: "%+",
    label: "Resolution Rate",
    note: "Tickets resolved on first contact without human handoff.",
  },
  {
    value: 12,
    suffix: "K",
    label: "Conversations / Day",
    note: "Handled across 30+ languages in real time, around the clock.",
  },
  {
    value: 92,
    suffix: "%+",
    label: "CSAT Score",
    note: "Measured across enterprise deployments through 2025.",
  },
];

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

function CountUp({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const dur = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setN(target * easeOutExpo(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return (
    <span>
      {Math.round(n)}
      <span style={{ fontSize: "0.55em", marginLeft: "0.04em" }}>{suffix}</span>
    </span>
  );
}

export function MetricsSection() {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        zIndex: 10,
        background: "#F4F1EA",
        color: "#0A0A0A",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "14vh 6vw",
        overflow: "hidden",
      }}
    >
      <GlitchGrainOverlay intensity="low" />

      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: active ? 1 : 0,
            transform: active ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 700ms ease-out, transform 700ms ease-out",
          }}
        >
          <span
            style={{
              width: 28,
              height: 1,
              background: "rgba(10,10,10,0.35)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontFamily: "'Geist Mono', ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(10,10,10,0.55)",
            }}
          >
            Indicators / 001
          </span>
        </div>

        {/* Title */}
        <h2
          className="font-display"
          style={{
            marginTop: 24,
            fontSize: "clamp(32px, 4.4vw, 60px)",
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            fontWeight: 500,
            maxWidth: 880,
            opacity: active ? 1 : 0,
            filter: active ? "blur(0)" : "blur(10px)",
            transform: active ? "translateY(0)" : "translateY(14px)",
            transition:
              "opacity 900ms cubic-bezier(0.22,1,0.36,1) 120ms, filter 900ms cubic-bezier(0.22,1,0.36,1) 120ms, transform 900ms cubic-bezier(0.22,1,0.36,1) 120ms",
          }}
        >
          Numbers our customers <em style={{ fontStyle: "italic", fontWeight: 400 }}>trust</em> us with.
        </h2>

        {/* Grid */}
        <div
          style={{
            marginTop: "clamp(56px, 8vh, 96px)",
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            position: "relative",
          }}
          className="metrics-grid"
        >
          {METRICS.map((m, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                padding: "0 clamp(16px, 2.4vw, 40px)",
                borderLeft: i === 0 ? "none" : "1px solid transparent",
                backgroundImage:
                  i === 0
                    ? "none"
                    : "linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.14) 20%, rgba(10,10,10,0.14) 80%, rgba(10,10,10,0) 100%)",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1px 100%",
                backgroundPosition: "left top",
              }}
            >
              <div
                style={{
                  opacity: active ? 1 : 0,
                  transform: active ? "translateY(0)" : "translateY(16px)",
                  filter: active ? "blur(0)" : "blur(8px)",
                  transition: `opacity 780ms cubic-bezier(0.22,1,0.36,1) ${240 + i * 140}ms, transform 780ms cubic-bezier(0.22,1,0.36,1) ${240 + i * 140}ms, filter 780ms cubic-bezier(0.22,1,0.36,1) ${240 + i * 140}ms`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Geist Mono', ui-monospace, monospace",
                    fontSize: 12,
                    letterSpacing: "0.24em",
                    color: "rgba(10,10,10,0.4)",
                    marginBottom: 20,
                  }}
                >
                  0{i + 1}
                </div>

                <div
                  className="font-display"
                  style={{
                    fontSize: "clamp(64px, 8.6vw, 128px)",
                    lineHeight: 0.95,
                    letterSpacing: "-0.035em",
                    fontWeight: 500,
                    color: "#0A0A0A",
                  }}
                >
                  <CountUp target={m.value} suffix={m.suffix} active={active} />
                </div>

                <div
                  style={{
                    marginTop: 28,
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                    color: "#0A0A0A",
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: "rgba(10,10,10,0.58)",
                    maxWidth: 280,
                  }}
                >
                  {m.note}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .metrics-grid {
            grid-template-columns: 1fr !important;
            gap: 48px;
          }
          .metrics-grid > div {
            border-left: none !important;
            background-image: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </section>
  );
}

export default MetricsSection;