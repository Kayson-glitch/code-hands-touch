import { useEffect, useRef } from "react";

const LINE1 = "Imagine a space";
const LINE2 = "between vision & impact";
const SUB = "That's where we thrive.";

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function SloganSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const subRef = useRef<HTMLParagraphElement>(null);

  const words = [...LINE1.split(" "), "__BR__", ...LINE2.split(" ")];
  const realWords = words.filter((w) => w !== "__BR__");

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // p=0 when section top hits 85% of viewport; p=1 when section top hits 15%.
      const p = smoothstep(0.85, 0.15, rect.top / vh);
      const N = realWords.length;
      wordsRef.current.forEach((span, i) => {
        if (!span) return;
        const t = N > 1 ? i / (N - 1) : 0;
        const lit = smoothstep(t - 0.18, t + 0.04, p);
        const alpha = lerp(0.16, 1, lit);
        const r = Math.round(lerp(255, 245, lit));
        const g = Math.round(lerp(255, 240, lit));
        const b = Math.round(lerp(255, 230, lit));
        span.style.color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      });
      if (subRef.current) {
        const lit = smoothstep(0.85, 1.05, p);
        subRef.current.style.opacity = String(lerp(0.15, 0.85, lit));
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [realWords.length]);

  let idx = 0;
  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full items-center justify-center bg-black px-6"
    >
      <div className="max-w-[1100px] text-center">
        <h2
          className="font-serif"
          style={{
            fontFamily: '"Cormorant Garamond", "Instrument Serif", Georgia, serif',
            fontWeight: 500,
            fontSize: "clamp(38px, 5.2vw, 76px)",
            lineHeight: 1.18,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          {words.map((w, i) => {
            if (w === "__BR__") return <br key={`br-${i}`} />;
            const myIdx = idx++;
            return (
              <span key={i} style={{ display: "inline-block" }}>
                <span
                  ref={(el) => {
                    if (el) wordsRef.current[myIdx] = el;
                  }}
                  style={{
                    color: "rgba(255,255,255,0.16)",
                    transition: "color 120ms linear",
                    willChange: "color",
                  }}
                >
                  {w}
                </span>
                {i < words.length - 1 && words[i + 1] !== "__BR__" ? "\u00A0" : ""}
              </span>
            );
          })}
        </h2>
        <p
          ref={subRef}
          className="mt-6"
          style={{
            fontSize: 16,
            lineHeight: "24px",
            color: "#EDE7DA",
            opacity: 0.15,
            transition: "opacity 160ms linear",
            willChange: "opacity",
          }}
        >
          {SUB}
        </p>
      </div>
    </section>
  );
}

export default SloganSection;