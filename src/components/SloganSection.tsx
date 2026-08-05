import { useEffect, useMemo, useRef, useState } from "react";


const LINES: string[][] = [
  ["We", "craft", "intelligent", "support", "experiences"],
  ["that", "keep", "pace", "with", "your", "ambition."],
  ["So", "your", "team", "can", "focus", "on", "what", "matters,"],
  ["while", "we", "shape", "how", "the", "world", "hears", "you."],
];

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const REVIEWS: string[] = [
  "Synergy cut our first-response time by 80% and freed the team to focus on high-impact conversations. It feels like every customer is talking to a real agent who actually remembers the context.",
  "The bot learned our brand voice in a single afternoon. Within a week it was handling routine questions, escalating complex issues, and sounding indistinguishable from our best support rep.",
  "I was skeptical about AI support, but the 24/7 coverage alone paid for itself within the first month. Our customers get instant answers at 2 a.m. without us hiring a night shift.",
  "It routes complex tickets to humans instantly while handling the repetitive work on its own. That balance saved us hours every day and made the whole support experience feel effortless.",
];

export function SloganSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const words = useMemo(() => LINES.flat(), []);
  const totalChars = useMemo(
    () => words.reduce((sum, w) => sum + w.length, 0),
    [words]
  );

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(1);
      return;
    }

    let raf = 0;
    let active = false;

    const compute = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Start the reveal one viewport earlier so the animation is already in
      // motion while the user is still scrolling through the first screen.
      // Endpoint stays aligned with the end of the sticky track.
      const LEAD_IN = vh;
      const travel = Math.max(1, LEAD_IN + (el.offsetHeight - vh));
      const scrolled = LEAD_IN - rect.top;
      const p = scrolled / travel;
      setProgress(Math.max(0, Math.min(1, p)));

    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) {
          window.addEventListener("scroll", schedule, { passive: true });
          window.addEventListener("resize", schedule);
          schedule();
        } else {
          window.removeEventListener("scroll", schedule);
          window.removeEventListener("resize", schedule);
        }
      },
      { threshold: 0, rootMargin: "100% 0px 0px 0px" }
    );
    if (sectionRef.current) io.observe(sectionRef.current);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Distribute progress across characters with a small overlap window.
  const reveal = (idx: number) => {
    const span = 1 / (totalChars + 6);
    const overlap = span * 8;
    const start = idx * span;
    return smoothstep(start, start + overlap, progress);
  };

  let ci = 0;

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{
        backgroundColor: "#0A0A0A",
        height: "260vh",
        position: "relative",
        zIndex: 10,
      }}

    >
      {/* Faint dot-grid texture over the black backdrop */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          right: "100px",
          bottom: 0,
          left: "100px",
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 2px, transparent 2.4px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 6vw",
          zIndex: 1,
        }}
      >
      <div
        className="font-display"
        style={{
          maxWidth: 1100,
          textAlign: "center",
          fontSize: "clamp(28px, 4.2vw, 54px)",
          lineHeight: 1.25,
          letterSpacing: "-0.01em",
          fontWeight: 500,
          color: "#FAFAFA",
        }}
      >
        {LINES.map((line, li) => (
          <div key={li} style={{ display: "block" }}>
            {line.map((word, i) => {
              return (
                <span
                  key={`${li}-${i}`}
                  style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    marginRight: i === line.length - 1 ? 0 : "0.28em",
                  }}
                >
                  {word.split("").map((ch, ki) => {
                    const a = reveal(ci++);
                    const opacity = 0.18 + a * 0.82;
                    const blur = (1 - a) * 2;
                    return (
                      <span
                        key={ki}
                        style={{
                          display: "inline-block",
                          opacity,
                          filter:
                            blur > 0.02 ? `blur(${blur.toFixed(2)}px)` : "none",
                          transition:
                            "opacity 220ms ease-out, filter 220ms ease-out",
                          willChange: "opacity, filter",
                        }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* Auto-scrolling customer reviews */}
      <style>{`
        @keyframes testimonial-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .testimonial-track {
            animation: none !important;
          }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <div
          className="testimonial-track"
          style={{
            display: "flex",
            width: "max-content",
            animation: "testimonial-marquee 60s linear infinite",
          }}
        >
          {[...REVIEWS, ...REVIEWS].map((text, i) => (
            <div
              key={i}
              style={{
            width: 520,
                padding: "0 48px",
                borderRight: "1px solid rgba(255,255,255,0.12)",
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: '"Montserrat", sans-serif',
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: "22px",
                  color: "rgba(255,255,255,0.72)",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                “{text}”
              </p>
            </div>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}

export default SloganSection;