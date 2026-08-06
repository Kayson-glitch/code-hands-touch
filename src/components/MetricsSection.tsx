import { useEffect, useRef, useState } from "react";

/**
 * Third screen — "Numbers our customers trust us with."
 *
 * Pinned section (kore.ai style): the whole block sticks for one viewport while
 * its content blocks stack in, one after another, as the user scrolls. Blocks
 * stay visible once revealed and fade back out when scrolling up. Once the last
 * block has landed the sticky track ends and the page scrolls on normally.
 */

const CARDS = [
  {
    title: "Accuracy Improvement",
    body: "Tickets resolved on first contact without human handoff.",
  },
  {
    title: "Faster Resolutions",
    body: "Average handling time cut across every support channel.",
  },
  {
    title: "Always-On Coverage",
    body: "Conversations answered instantly, in every timezone.",
  },
];

const STATS = [
  { value: "+85", unit: "%", label: "Accuracy Improvement" },
  { value: "13", unit: "k", label: "Accuracy Improvement" },
  { value: "+90", unit: "%", label: "Accuracy Improvement" },
];

// Reveal order: heading, hairline, card 1-3, stat 1-3.
const BLOCK_COUNT = 8;

function smoothstep(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function MetricsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setProgress(1);
      return;
    }

    let raf = 0;
    const compute = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const travel = Math.max(1, el.offsetHeight - vh);
      setProgress(Math.max(0, Math.min(1, -rect.top / travel)));
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Each block owns a slice of the track; slices overlap by ~30% so the stack
  // reads as a continuous cascade instead of discrete steps.
  const blockAlpha = (index: number) => {
    if (reduced) return 1;
    const span = 1 / (BLOCK_COUNT + 1);
    const start = index * span * 0.7;
    return smoothstep(start, start + span, progress);
  };

  const rise = (a: number) => `translate3d(0, ${((1 - a) * 24).toFixed(2)}px, 0)`;

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{
        backgroundColor: "#FAFAFA",
        height: "320vh",
        zIndex: 11,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100dvh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "min(100% - 48px, 1200px)",
            margin: "0 auto",
            paddingTop: 48,
            paddingBottom: 96,
          }}
        >
          {/* Heading */}
          <h2
            className="font-display capitalize"
            style={{
              margin: 0,
              fontSize: "clamp(30px, 3.4vw, 48px)",
              lineHeight: 1.17,
              fontWeight: 500,
              color: "var(--ink)",
              opacity: blockAlpha(0),
              transform: rise(blockAlpha(0)),
              transition: "opacity 520ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            Numbers our customers
            <br />
            trust us with.
          </h2>

          {/* Gradient hairline */}
          <div
            aria-hidden
            style={{
              marginTop: 40,
              width: 460,
              maxWidth: "100%",
              height: 1,
              background:
                "linear-gradient(90deg, #137DFF 0%, #FF18AA 50%, #FFCD17 100%)",
              opacity: blockAlpha(1),
              transform: rise(blockAlpha(1)),
              transition: "opacity 520ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />

          {/* Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              borderTop: "1px solid var(--hairline)",
            }}
          >
            {CARDS.map((card, i) => {
              const a = blockAlpha(2 + i);
              return (
                <div
                  key={card.title}
                  style={{
                    border: "1px solid var(--hairline)",
                    borderTop: "none",
                    marginLeft: i === 0 ? 0 : -1,
                    padding: 24,
                    opacity: a,
                    transform: rise(a),
                    transition:
                      "opacity 520ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: "100%",
                      aspectRatio: "352 / 220",
                      backgroundColor: "#D9D9D9",
                    }}
                  />
                  <p
                    style={{
                      margin: "24px 0 0",
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 600,
                      fontSize: 16,
                      lineHeight: "24px",
                      color: "var(--ink)",
                    }}
                  >
                    {card.title}
                  </p>
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 400,
                      fontSize: 14,
                      lineHeight: "24px",
                      color: "var(--ink-muted)",
                    }}
                  >
                    {card.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Big stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 24,
              marginTop: 40,
              paddingLeft: 24,
            }}
          >
            {STATS.map((stat, i) => {
              const a = blockAlpha(5 + i);
              return (
                <div
                  key={`${stat.value}${stat.unit}`}
                  style={{
                    opacity: a,
                    transform: rise(a),
                    transition:
                      "opacity 520ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <div
                    className="font-display capitalize"
                    style={{ fontWeight: 500, color: "#000000", lineHeight: 1 }}
                  >
                    <span style={{ fontSize: "clamp(48px, 6.9vw, 100px)" }}>
                      {stat.value}
                    </span>
                    <span style={{ fontSize: "clamp(33px, 4.7vw, 68px)" }}>
                      {stat.unit}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "20px 0 0",
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 500,
                      fontSize: 18,
                      lineHeight: "26px",
                      color: "var(--ink)",
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
