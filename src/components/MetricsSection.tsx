import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Third screen — "Numbers our customers trust us with."
 *
 * 1:1 with the kore.ai `.k2-cards` interaction: the section is pinned under the
 * nav while a fixed-height, overflow-hidden window holds three columns. Each
 * column ([card] + [big number]) travels straight up through that window on a
 * linear, staggered slice of the section progress — the card rises from below,
 * gets pushed out of the top, and the big number comes to rest. Fully
 * reversible; once the last column lands the pin releases.
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

const NAV_H = 69;
const GAP = 48;
const BOTTOM_SAFE = 140; // clear the fixed Fin dock

export function MetricsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const numberRef = useRef<HTMLDivElement | null>(null);

  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [windowH, setWindowH] = useState(560);
  const [numberH, setNumberH] = useState(200);

  // Measure the clipping window (viewport minus sticky header and dock safety)
  // and the height of the big-number block, which sets the resting offset.
  useLayoutEffect(() => {
    const measure = () => {
      const headerH = headerRef.current?.offsetHeight ?? 0;
      const avail = window.innerHeight - NAV_H - headerH - BOTTOM_SAFE;
      setWindowH(Math.max(320, avail));
      setNumberH(numberRef.current?.offsetHeight ?? 200);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

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
      const travel = Math.max(1, el.offsetHeight - window.innerHeight);
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

  const n = COLUMNS.length;
  // Linear, three-way staggered slices — exactly the reference mapping.
  const colT = (i: number) =>
    reduced ? 1 : Math.max(0, Math.min(1, progress * n - i));

  const startY = windowH; // fully below the window, clipped away
  const endY = -(windowH - numberH); // card pushed out, number resting

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{
        backgroundColor: "#FAFAFA",
        height: `calc(100dvh + ${n * 90}vh)`,
        zIndex: 11,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: NAV_H,
          height: `calc(100dvh - ${NAV_H}px)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "min(100% - 48px, 1200px)",
            margin: "0 auto",
          }}
        >
          {/* Header — always visible while the section is pinned */}
          <div ref={headerRef} style={{ paddingTop: 48, paddingBottom: 40 }}>
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

          {/* Clipping window */}
          <div
            style={{
              height: windowH,
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
            }}
          >
            {COLUMNS.map((col, i) => {
              const t = colT(i);
              const y = startY + (endY - startY) * t;
              return (
                <div
                  key={col.title}
                  style={{
                    height: windowH,
                    display: "flex",
                    flexDirection: "column",
                    gap: GAP,
                    marginLeft: i === 0 ? 0 : -1,
                    opacity: t > 0 ? 1 : 0,
                    transform: `translate3d(0, ${y.toFixed(2)}px, 0)`,
                    willChange: "transform",
                  }}
                >
                  {/* Card */}
                  <div
                    style={{
                      flex: "1 1 auto",
                      minHeight: 0,
                      border: "1px solid var(--hairline)",
                      padding: 24,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      aria-hidden
                      style={{
                        flex: "1 1 auto",
                        minHeight: 0,
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

                  {/* Big number */}
                  <div
                    ref={i === 0 ? numberRef : undefined}
                    style={{ flex: "0 0 auto", paddingLeft: 24 }}
                  >
                    <div
                      className="font-display capitalize"
                      style={{
                        fontWeight: 500,
                        color: "#000000",
                        lineHeight: 1,
                      }}
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
      </div>
    </section>
  );
}
