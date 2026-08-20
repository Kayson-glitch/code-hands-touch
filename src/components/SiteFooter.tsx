import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, Linkedin, Twitter, Youtube } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/** 1440px design width → fluid value. */
const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

const GRADIENT =
  "linear-gradient(90deg, #137DFF 0%, #FF18AA 33.333%, #FFCD17 66.666%, #137DFF 100%)";

const FOOTER_COLUMNS = [
  { title: "why  synergy", links: ["Features", "Pricing", "Book a demo"] },
  { title: "platform", links: ["Features", "Pricing", "Book a demo"] },
  { title: "solution", links: ["Events", "Blog"] },
  { title: "Company", links: ["About us", "Contact us"] },
];

function RainbowButton({ label, size = "lg" }: { label: string; size?: "lg" | "sm" }) {
  const face = "#0E0B22";
  const faceRgb = "14,11,34";
  const lg = size === "lg";
  return (
    <button
      className="group relative inline-flex shrink-0 cursor-pointer items-center justify-center font-medium transition-all"
      style={{
        height: lg ? 40 : 36,
        fontSize: lg ? 14 : 13,
        lineHeight: "20px",
        fontWeight: 500,
        padding: lg ? "0 24px" : "0 22px",
        borderRadius: 2,
        border: "0.125rem solid transparent",
        color: "#FFFFFF",
        backgroundImage: [
          `linear-gradient(${face},${face})`,
          `linear-gradient(${face} 50%, rgba(${faceRgb},0.6) 80%, rgba(${faceRgb},0))`,
          GRADIENT,
        ].join(","),
        backgroundClip: "padding-box, border-box, border-box",
        backgroundOrigin: "border-box",
        backgroundSize: "200%",
        animation: "rainbow-btn-flow var(--rainbow-speed, 9s) infinite linear",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "-20%",
          zIndex: 0,
          height: "20%",
          width: "60%",
          backgroundImage: GRADIENT,
          backgroundSize: "200%",
          filter: "blur(0.75rem)",
          animation: "rainbow-btn-flow var(--rainbow-speed, 9s) infinite linear",
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-0">
        {label}
        <span className="inline-flex max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:ml-1.5 group-hover:max-w-[20px] group-hover:opacity-100">
          <ArrowRight size={16} strokeWidth={2} className="relative -top-px flex-shrink-0" />
        </span>
      </span>
    </button>
  );
}

/** Wordmark that fills its container width by uniform font scaling (no glyph stretching). */
function FitWordmark({ text }: { text: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(200);

  const fit = () => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;
    const probe = 200;
    el.style.fontSize = `${probe}px`;
    const w = el.scrollWidth;
    const next = w > 0 ? (probe * box.clientWidth) / w : probe;
    el.style.fontSize = `${next}px`;
    setSize(next);
  };

  useLayoutEffect(fit);
  useEffect(() => {
    window.addEventListener("resize", fit);
    if (document.fonts?.ready) document.fonts.ready.then(fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="pointer-events-none w-full select-none overflow-hidden"
      style={{ lineHeight: 0 }}
    >
      <span
        ref={textRef}
        className="font-display block whitespace-nowrap"
        style={{
          fontSize: size,
          lineHeight: 0.8,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "rgba(255,255,255,0.08)",
          display: "inline-block",
          transform: "translateY(12%)",
        }}
      >
        {text}
      </span>
    </div>
  );
}

/** Closing CTA block + brand footer, shared across pages. */
export function SiteFooter() {
  const pad = `0 ${fluid(120, 24)}`;

  return (
    <div className="relative" style={{ zIndex: 20, background: "#FAFAFA" }}>
      {/* ------------------------------------------------------------- CTA */}
      <section className="relative flex overflow-hidden" style={{ height: 880, padding: `${fluid(160, 80)} 0`, alignItems: "center", justifyContent: "center" }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(14,11,34,0.16) 1px, transparent 1px)",
            backgroundSize: "20px 21px",
            maskImage: "radial-gradient(120% 80% at 50% 50%, #000 25%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 80% at 50% 50%, #000 25%, transparent 78%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-[800px] flex-col items-center px-6 text-center">
          <Reveal>
            <h2
              className="font-display"
              style={{ margin: 0, fontSize: fluid(48, 28), lineHeight: 1.1667, fontWeight: 500 }}
            >
              <span className="text-ink-ghost">Get started with the</span>
              <br />
              <span className="text-ink">Synergy.AI today</span>
            </h2>
          </Reveal>
          <Reveal delay={150} style={{ marginTop: fluid(40, 28) }}>
            <RainbowButton label="Book a Demo" />
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- footer */}
      <footer
        data-dark-section
        data-progressive-blur-hide
        className="relative overflow-hidden"
        style={{ background: "#0A0A0A" }}
      >
        <div aria-hidden style={{ height: 2, backgroundImage: GRADIENT, backgroundSize: "200%" }} />

        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", height: 80, boxSizing: "border-box" }}>
          <div className="h-full" style={{ padding: pad }}>
            <div className="mx-auto grid h-full w-full max-w-[1200px] grid-cols-2 items-center gap-9 md:grid-cols-4">
              <div className="flex items-center justify-start gap-2">
                <span
                  aria-hidden
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    backgroundImage: GRADIENT,
                    backgroundSize: "200%",
                  }}
                />
                <span style={{ color: "#FFFFFF", fontSize: 18, lineHeight: "24px", fontWeight: 500 }}>
                  Synergy.AI
                </span>
              </div>
              <div className="hidden md:block md:col-span-3 md:text-right">
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: "20px" }}>
                  Revenue-Driven AI Support. Engineered on Synergy. Scale Securely.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden" style={{ height: 400 }}>
          <div className="flex h-full items-center" style={{ padding: pad }}>
            <div className="mx-auto w-full max-w-[1200px]">
              <div className="grid grid-cols-2 gap-9 md:grid-cols-4">
                {FOOTER_COLUMNS.map((col, i) => (
                  <Reveal
                    key={col.title}
                    delay={i * 90}
                    y={18}
                    className="flex flex-col items-start text-left"
                  >
                    <p
                      className="capitalize"
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 12,
                        lineHeight: "20px",
                        fontWeight: 400,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {col.title}
                    </p>
                    <ul className="mt-6 flex flex-col items-start gap-[18px]">
                      {col.links.map((l) => (
                        <li key={l}>
                          <span
                            className="cursor-pointer transition-opacity hover:opacity-70"
                            style={{ color: "#FFFFFF", fontSize: 14, lineHeight: "22px" }}
                          >
                            {l}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute left-0 w-full" style={{ top: 174 }}>
            <FitWordmark text="Synergy.AI" />
          </div>
        </div>

        <div
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)", boxSizing: "border-box" }}
          className="md:h-[68px]"
        >
          <div className="h-full" style={{ padding: pad }}>
            <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 items-center gap-9 py-7 md:h-full md:grid-cols-4 md:py-0">
              <span
                className="flex justify-start"
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 12,
                  lineHeight: "20px",
                  fontWeight: 500,
                }}
              >
                © {new Date().getFullYear()} Synergy.AI. All rights reserved.
              </span>
              <div className="hidden md:col-span-3 md:flex md:items-center md:justify-end md:gap-4">
                {[Youtube, Twitter, Linkedin].map((Icon, i) => (
                  <span
                    key={i}
                    className="cursor-pointer transition-opacity hover:opacity-70"
                    style={{ color: "#FFFFFF", display: "inline-flex" }}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SiteFooter;
