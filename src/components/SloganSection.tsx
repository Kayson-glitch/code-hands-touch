import { useEffect, useMemo, useRef, useState } from "react";
import { GlitchGrainOverlay } from "./GlitchGrainOverlay";

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
        background: "#000",
        height: "260vh",
        position: "relative",
        zIndex: 10,
      }}
    >
      <GlitchGrainOverlay intensity="low" />
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
          color: "#ffffff",
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
      </div>
    </section>
  );
}

export default SloganSection;