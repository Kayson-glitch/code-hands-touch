import { useEffect, useRef, useState } from "react";

/**
 * Third screen — "Numbers our customers trust us with."
 *
 * Normal-flow section (kore.ai style): the heading block sticks under the nav
 * while the three columns fill in left to right as the user scrolls — card
 * first, then the big number under it. Columns stay visible once revealed and
 * fade back out when scrolling up. When the section ends the heading unsticks
 * and the page scrolls on normally.
 */

const COLUMNS = [
  {
    title: "Accuracy Improvement",
    body: "Tickets resolved on first contact without human handoff.",
    value: "+85",
    unit: "%",
    label: "Accuracy Improvement",
  },
  {
    title: "Faster Resolutions",
    body: "Average handling time cut across every support channel.",
    value: "13",
    unit: "k",
    label: "Accuracy Improvement",
  },
  {
    title: "Always-On Coverage",
    body: "Conversations answered instantly, in every timezone.",
    value: "+90",
    unit: "%",
    label: "Accuracy Improvement",
  },
];

const EASE = "cubic-bezier(0.22,1,0.36,1)";
const TRANSITION = `opacity 520ms ${EASE}, transform 520ms ${EASE}`;

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

  // Column i: card reveals first, its number trails 0.10 behind.
  const cardAlpha = (i: number) =>
    reduced ? 1 : smoothstep(i * 0.22, i * 0.22 + 0.26, progress);
  const statAlpha = (i: number) =>
    reduced ? 1 : smoothstep(i * 0.22 + 0.1, i * 0.22 + 0.36, progress);

  const rise = (a: number) =>
    `translate3d(0, ${((1 - a) * 24).toFixed(2)}px, 0)`;

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ backgroundColor: "#FAFAFA", zIndex: 11 }}
    >
      <div
        style={{
          width: "min(100% - 48px, 1200px)",
          margin: "0 auto",
          paddingTop: 120,
          paddingBottom: "80vh",
        }}
      >
        {/* Sticky heading */}
        <div
          style={{
            position: "sticky",
            top: 69,
            zIndex: 2,
            backgroundColor: "#FAFAFA",
            paddingBottom: 40,
          }}
        >
          <h2
            className="font-display capitalize"
            style={{
              margin: 0,
              fontSize: "clamp(30px, 3.4vw, 48px)",
              lineHeight: 1.17,
              fontWeight: 500,
              color: "var(--ink)",
            }}
          >
            Numbers our customers
            <br />
            trust us with.
          </h2>

          <div
            aria-hidden
            style={{
              marginTop: 40,
              width: 460,
              maxWidth: "100%",
              height: 1,
              background:
                "linear-gradient(90deg, #137DFF 0%, #FF18AA 50%, #FFCD17 100%)",
            }}
          />
        </div>

        {/* Three columns: card + big number */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          }}
        >
          {COLUMNS.map((col, i) => {
            const ca = cardAlpha(i);
            const sa = statAlpha(i);
            return (
              <div key={col.title}>
                <div
                  style={{
                    border: "1px solid var(--hairline)",
                    marginLeft: i === 0 ? 0 : -1,
                    padding: 24,
                    opacity: ca,
                    transform: rise(ca),
                    transition: TRANSITION,
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: "100%",
                      aspectRatio: "352 / 300",
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
                    {col.title}
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
                    {col.body}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: 56,
                    paddingLeft: 24,
                    opacity: sa,
                    transform: rise(sa),
                    transition: TRANSITION,
                  }}
                >
                  <div
                    className="font-display capitalize"
                    style={{ fontWeight: 500, color: "#000000", lineHeight: 1 }}
                  >
                    <span style={{ fontSize: "clamp(48px, 6.9vw, 100px)" }}>
                      {col.value}
                    </span>
                    <span style={{ fontSize: "clamp(33px, 4.7vw, 68px)" }}>
                      {col.unit}
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
                    {col.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
