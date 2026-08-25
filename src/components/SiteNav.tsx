import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import logo from "@/assets/synergy-logo-v3.png.asset.json";

export function SiteNav({ revealDelay = 4000 }: { revealDelay?: number } = {}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hidden, setHidden] = useState(revealDelay > 0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Nav starts hidden through the intro video + burst. Only show it
    // once we've received an explicit "visible" signal (after the black
    // handoff). Fallback: if no burst is ever dispatched (e.g. reduced
    // motion path), reveal after a short delay so the site is usable.
    if (revealDelay <= 0) {
      setHidden(false);
      return;
    }
    const t = window.setTimeout(() => setHidden(false), revealDelay);
    return () => window.clearTimeout(t);
  }, [revealDelay]);


  useEffect(() => {
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      setTheme(detail === "dark" ? "dark" : "light");
    };
    window.addEventListener("app-bg-change", onBg);
    return () => window.removeEventListener("app-bg-change", onBg);
  }, []);

  useEffect(() => {
    const onVis = (e: Event) => {
      const detail = (e as CustomEvent<"hidden" | "visible">).detail;
      setHidden(detail === "hidden");
    };
    window.addEventListener("app-nav-visibility", onVis);
    return () => window.removeEventListener("app-nav-visibility", onVis);
  }, []);

  const [onDark, setOnDark] = useState(false);
  // Gradient bar: visible by default, hides on scroll-down, returns on scroll-up.
  const [barVisible, setBarVisible] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      if (Math.abs(dy) > 4) {
        setBarVisible(y <= 8 ? true : dy < 0);
        lastY = y;
      }
      setScrolled(y > 8);
      // The nav flips to its dark variant only while the black section is the
      // surface sitting under the bar — the light third screen flips it back.
      const darks = Array.from(document.querySelectorAll("[data-dark-section]"));
      const dark = darks.find((el) => {
        const b = el.getBoundingClientRect();
        return b.top <= 69 && b.bottom > 69;
      }) ?? null;
      setOnDark(Boolean(dark));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  void theme;
  const [hovered, setHovered] = useState<number | null>(null);
  const navItem =
    "flex cursor-pointer items-center gap-1.5 p-4 capitalize transition-colors duration-200";
  // Light variant (first screen) / dark variant (black second screen, per Figma).
  const glassBg = onDark ? "rgba(10,10,10,0.72)" : "rgba(250,250,250,0.72)";
  const inkStrong = onDark ? "#FFFFFF" : "#0E0B22";
  const inkSoft = "#7A7885";
  const hairline = onDark ? "rgba(255,255,255,0.15)" : "#F1F1F3";
  // Hover: color change only, no background fill.
  const itemStyle = (i: number) => ({
    color: hovered === i ? inkStrong : inkSoft,
    transition: "color 200ms ease",
  });


  return (
    <nav
      className="pointer-events-none fixed inset-x-0 top-0 flex flex-col items-stretch"
      style={{
        zIndex: 80,
        opacity: hidden ? 0 : 1,
        transition: "opacity 260ms ease-out",
      }}
    >
      {/* Flowing gradient top bar — 2px per Figma (62px total with the 60px nav).
          Scrolling down collapses it away so the nav alone is 60px tall. */}
      <span
        aria-hidden
        className="pointer-events-none block w-full shrink-0"
        style={{
          height: 2,
          marginTop: barVisible ? 0 : -2,
          backgroundImage:
            "linear-gradient(90deg, #137DFF 0%, #FF18AA 33.333%, #FFCD17 66.666%, #137DFF 100%)",
          backgroundSize: "120vw 100%",
          backgroundRepeat: "repeat-x",
          animation: "nav-border-flow 9s linear infinite",
          opacity: barVisible ? 1 : 0,
          transition:
            "margin-top 320ms cubic-bezier(0.22,1,0.36,1), opacity 240ms ease",
        }}
      />


      <div
        className="flex items-center justify-center px-6"
        style={{
          height: 60,
          borderBottom: `1px solid ${hairline}`,
          background: scrolled ? glassBg : "transparent",
          backdropFilter: scrolled ? "blur(18px) saturate(140%)" : "none",
          transition:
            "background 260ms ease-out, backdrop-filter 260ms ease-out",
        }}
      >
        <div className="flex h-full w-full max-w-[1200px] items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="pointer-events-auto flex shrink-0 items-center gap-2"
            style={{ height: 24, color: inkStrong, transition: "color 300ms ease" }}
          >
            <img
              src={logo.url}
              alt="Synergy.AI"
              style={{
                height: 24,
                width: 24,
                display: "block",
                borderRadius: 888,
                objectFit: "cover",
              }}
            />
            <span
              className="font-medium"
              style={{ fontSize: 16, lineHeight: "24px" }}
            >
              Synergy.AI
            </span>
          </a>

          {/* Center menu */}
          <ul
            className="pointer-events-auto hidden flex-1 items-center justify-center gap-2.5 md:flex"
            style={{ fontSize: 13, lineHeight: "20px" }}
          >
            {[
              { label: "Why Synergy", chevron: true },
              { label: "Platform", chevron: true },
              { label: "Solution", chevron: true },
              { label: "Pricing", chevron: false },
              { label: "Company Hub", chevron: false },
            ].map((item, i) => (
              <li
                key={item.label}
                className="relative"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className={navItem} style={itemStyle(i)}>
                  {item.label}
                  {item.chevron && <Chevron flipped={hovered === i} />}
                </div>
                {i === 0 && <WhySynergyMenu open={hovered === 0} />}
              </li>
            ))}

          </ul>

          {/* Right actions */}
          <div className="pointer-events-auto flex shrink-0 items-center gap-2.5">
            <button
              className="px-4 py-[7px] capitalize"
              style={{ fontSize: 13, lineHeight: "20px", color: inkStrong }}
            >
              Log in
            </button>
            <button
              className="font-normal transition-transform hover:scale-[1.02]"
              style={{
                height: 32,
                fontSize: 12,
                lineHeight: "20px",
                padding: "0 14px",
                borderRadius: 0,
                color: onDark ? "#0E0B22" : "#FFFFFF",
                background: onDark ? "#FFFFFF" : "#0E0B22",
                border: `1px solid ${onDark ? "#FFFFFF" : "#0E0B22"}`,

                transition: "background 300ms ease, color 300ms ease, border-color 300ms ease",
              }}
            >
              Book a Demo
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}



const WHY_SYNERGY_ITEMS: Array<{
  dot: string;
  kicker: string;
  title: string;
  desc: string;
  to?: string;
}> = [
  {
    dot: "#9E8CFF",
    kicker: "Impact",
    title: "Business Impact",
    to: "/why-synergy/business-impact",
    desc: "55% of conversations resolved, with a clear path to lower costs.",
  },
  {
    dot: "#D1E486",
    kicker: "Stories",
    title: "Stories from the Front Lines",
    to: "/why-synergy/stories",
    desc: "Multilingual support, risk management, and continuous improvement.",
  },
  {
    dot: "#8CE0FF",
    kicker: "Engineering",
    title: "Technology & Guardrails",
    desc: "Governed knowledge, precise retrieval, and human oversight.",
  },
  {
    dot: "#FFCE91",
    kicker: "Commitment",
    title: "Security & Partnership",
    desc: "Private deployment, customer-controlled data, and expert support after launch.",
  },
];

function WhySynergyMenu({ open }: { open: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const navigate = useNavigate();
  // Spring-ish easing for the panel reveal.
  const PANEL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <div
      className="absolute left-0 top-full pt-2"
      style={{
        opacity: open ? 1 : 0,
        transform: open
          ? "translateY(0) scale(1)"
          : "translateY(-10px) scale(0.96)",
        transformOrigin: "top left",
        pointerEvents: open ? "auto" : "none",
        transition: `opacity 420ms ${PANEL_EASE}, transform 560ms ${PANEL_EASE}`,
      }}
    >
      <div
        className="flex flex-col items-start"
        style={{
          gap: 20,
          padding: 24,
          borderRadius: 16,
          background: "#FFFFFF",
          border: "1px solid #F1F1F3",
          boxShadow: "0px 12px 36px 0px rgba(0,0,0,0.10)",
          // Clip-path wipe so the card grows open from the top-left corner.
          clipPath: open
            ? "inset(0 0 0 0 round 16px)"
            : "inset(0 100% 100% 0 round 16px)",
          transition: `clip-path 620ms ${PANEL_EASE}`,
        }}
      >
        <span
          className="capitalize text-center whitespace-nowrap"
          style={{
            fontSize: 14,
            lineHeight: "20px",
            color: "#7A7885",
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(-6px)",
            transition: `opacity 360ms ${PANEL_EASE} 140ms, transform 440ms ${PANEL_EASE} 140ms`,
          }}
        >
          / why synergy
        </span>
        <div
          className="grid grid-cols-2 overflow-hidden"
          style={{
            width: 620,
            height: 315,
            border: "1px solid #E1E0E4",
          }}
        >
          {WHY_SYNERGY_ITEMS.map((it, i) => (
            <div
              key={it.title}
              className="flex cursor-pointer flex-col items-start"
              onClick={() => {
                if (it.to) navigate({ to: it.to });
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}

              style={{
                padding: 30,
                gap: 8,
                background: hover === i ? "#F8F8F9" : "transparent",
                borderRight: i % 2 === 0 ? "1px solid #E1E0E4" : "none",
                borderBottom: i < 2 ? "1px solid #E1E0E4" : "none",
                opacity: open ? 1 : 0,
                transform: open ? "translateY(0)" : "translateY(8px)",
                transition: `background 180ms ease, opacity 460ms ${PANEL_EASE} ${220 + i * 110}ms, transform 540ms ${PANEL_EASE} ${220 + i * 110}ms`,
              }}
            >
              <div className="flex items-center" style={{ gap: 8 }}>
                <span style={{ width: 8, height: 8, background: it.dot, display: "block" }} />
                <span
                  className="uppercase whitespace-nowrap"
                  style={{ fontSize: 10, lineHeight: "18px", color: "#A1A0A9" }}
                >
                  {it.kicker}
                </span>
              </div>
              <div className="flex w-full flex-col items-start" style={{ gap: 8 }}>
                <p
                  className="w-full font-medium"
                  style={{ fontSize: 16, lineHeight: "22px", color: "#000000" }}
                >
                  {it.title}
                </p>
                <p
                  className="w-full"
                  style={{ fontSize: 12, lineHeight: "20px", color: "#7A7885" }}
                >
                  {it.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chevron({ flipped }: { flipped?: boolean }) {
  // Dot-matrix (halftone) chevron on a 7x7 grid, matching DotArrow's dot style.
  const dots: Array<[number, number]> = [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 3],
    [5, 2],
  ];
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 7 7"
      fill="none"
      aria-hidden
      style={{
        display: "block",
        flexShrink: 0,
        transform: flipped ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 240ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x + 0.5} cy={y + 0.5} r={0.35} fill="currentColor" />
      ))}
    </svg>
  );
}


export default SiteNav;
