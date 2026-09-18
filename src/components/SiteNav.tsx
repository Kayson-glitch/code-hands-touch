import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { logoAsset as logo } from "@/lib/media";
import {
  PLATFORM_CAPABILITIES,
  PLATFORM_PRODUCTS,
  SOLUTION_INDUSTRIES,
  SOLUTION_USE_CASES,
  WHY_SYNERGY_ITEMS,
  type FeaturedItem,
  type MenuItem,
} from "@/lib/siteMenu";
import { MobileMenu } from "@/components/MobileMenu";

export function SiteNav({
  revealDelay = 4000,
  solid = true,
}: {
  revealDelay?: number;
  /**
   * Keep the frosted bar at the very top too (default). Pass false to let a
   * hero show through until the first scroll.
   */
  solid?: boolean;
} = {}) {
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
  const glassBg = onDark ? "rgba(0,0,0,0.72)" : "rgba(250,250,250,0.72)";
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
          background: scrolled || solid ? glassBg : "transparent",
          backdropFilter: scrolled || solid ? "blur(18px) saturate(140%)" : "none",
          transition:
            "background 260ms ease-out, backdrop-filter 260ms ease-out",
        }}
      >
        <div className="flex h-full w-full max-w-[1200px] items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            preload="intent"
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
          </Link>

          {/* Center menu */}
          <ul
            className="pointer-events-auto hidden flex-1 items-center justify-center gap-2.5 lg:flex"
            style={{ fontSize: 13, lineHeight: "20px" }}
          >
            {[
              { label: "Why Synergy", chevron: true },
              { label: "Platform", chevron: true },
              { label: "Solution", chevron: true },
              { label: "Pricing", chevron: false, to: "/pricing" },
              { label: "Company Hub", chevron: false, to: "/company" },
            ].map((item, i) => (
              <li
                key={item.label}
                className="relative"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {item.to ? (
                  <Link to={item.to} preload="intent" className={navItem} style={itemStyle(i)}>
                    {item.label}
                  </Link>
                ) : (
                  <div className={navItem} style={itemStyle(i)}>
                    {item.label}
                    {item.chevron && <Chevron flipped={hovered === i} />}
                  </div>
                )}
                {i === 0 && <WhySynergyMenu open={hovered === 0} />}
                {i === 1 && <PlatformMenu open={hovered === 1} />}
                {i === 2 && <SolutionMenu open={hovered === 2} />}
              </li>
            ))}

          </ul>

          {/* Right actions */}
          <div className="pointer-events-auto flex h-full shrink-0 items-center gap-2.5">
            <button
              className="hidden px-4 py-[7px] capitalize lg:block"
              style={{ fontSize: 13, lineHeight: "20px", color: inkStrong }}
            >
              Log in
            </button>
            <button
              className="font-normal transition-colors duration-300"
              style={{
                alignSelf: "stretch",
                fontSize: 12,
                lineHeight: "20px",
                padding: "0 16px",
                borderRadius: 0,
                color: onDark ? "#FFFFFF" : "#0E0B22",
                background: onDark ? "rgba(255, 255, 255, 0.15)" : "#F1F1F3",
                border: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = onDark
                  ? "rgba(255, 255, 255, 0.22)"
                  : "#E6E6E8";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = onDark
                  ? "rgba(255, 255, 255, 0.15)"
                  : "#F1F1F3";
              }}
            >
              Book a Demo
            </button>
            <MobileMenu ink={inkStrong} />
          </div>
        </div>
      </div>
    </nav>
  );
}



// Spring-ish easing for the panel reveal.
const PANEL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** The grid rule inside a dropdown panel. */
const MENU_RULE = "#E1E0E4";

/**
 * Registration mark: the 6px white square the page frames put where hairlines
 * cross (platform/rag's crop frame, the Business Impact article rows).
 */
function RuleMark({
  open,
  x,
  y,
  nudge = [0, 0],
  delay = 0,
}: {
  open: boolean;
  /** Position on the grid box, e.g. "0%", "100%", "360px". */
  x: string;
  y: string;
  /** Half-pixel corrections so the square straddles the rule, not the box. */
  nudge?: [number, number];
  delay?: number;
}) {
  return (
    <span
      className="absolute"
      style={{
        left: `calc(${x} + ${nudge[0]}px)`,
        top: `calc(${y} + ${nudge[1]}px)`,
        width: 6,
        height: 6,
        transform: "translate(-50%, -50%)",
        background: "#FFFFFF",
        border: `1px solid ${MENU_RULE}`,
        opacity: open ? 1 : 0,
        transition: `opacity 340ms ${PANEL_EASE} ${delay}ms`,
      }}
    />
  );
}

/**
 * Where a menu grid's interior rules actually sit. The rules are the first
 * child's own borders, and rows/columns are sized by their copy, so read them
 * from layout instead of assuming the grid splits evenly. offsetX/Y are used
 * rather than client rects because the closed panel is scaled.
 */
function useRuleCrossing() {
  const ref = useRef<HTMLDivElement>(null);
  const [rule, setRule] = useState<{ x: number; y: number; bottom: number } | null>(null);

  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    const measure = () => {
      const first = grid.firstElementChild as HTMLElement | null;
      const host = grid.parentElement as HTMLElement | null;
      if (!first || !host) return;
      // A 1px rule is centred half a pixel inside the border box it belongs to.
      setRule({
        x: first.offsetLeft + first.offsetWidth - 0.5,
        y: first.offsetTop + first.offsetHeight - 0.5,
        bottom: host.offsetHeight - 0.5,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    for (const child of grid.children) ro.observe(child);
    return () => ro.disconnect();
  }, []);

  return [ref, rule] as const;
}

/** The mark on each corner of a menu grid. */
function GridCornerMarks({ open, delay = 460 }: { open: boolean; delay?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <RuleMark open={open} x="0%" y="0%" nudge={[0.5, 0.5]} delay={delay} />
      <RuleMark open={open} x="100%" y="0%" nudge={[-0.5, 0.5]} delay={delay + 50} />
      <RuleMark open={open} x="0%" y="100%" nudge={[0.5, -0.5]} delay={delay + 100} />
      <RuleMark open={open} x="100%" y="100%" nudge={[-0.5, -0.5]} delay={delay + 150} />
    </div>
  );
}

/**
 * Shared dropdown shell: white card that wipes open from its anchor corner,
 * a "/ section" kicker, then whatever grid the menu needs.
 */
function MenuPanel({
  open,
  kicker,
  align = "left",
  children,
}: {
  open: boolean;
  kicker: string;
  /** Anchor the panel to the item's left edge, or centre it under the item. */
  align?: "left" | "center";
  children: React.ReactNode;
}) {
  const centered = align === "center";
  const closedTransform = centered
    ? "translate(-50%, -10px) scale(0.96)"
    : "translateY(-10px) scale(0.96)";
  const openTransform = centered ? "translate(-50%, 0) scale(1)" : "translateY(0) scale(1)";
  return (
    <div
      className={`absolute top-full pt-2 ${centered ? "left-1/2" : "left-0"}`}
      style={{
        opacity: open ? 1 : 0,
        transform: open ? openTransform : closedTransform,
        transformOrigin: centered ? "top center" : "top left",
        pointerEvents: open ? "auto" : "none",
        transition: `opacity 420ms ${PANEL_EASE}, transform 560ms ${PANEL_EASE}`,
      }}
    >
      <div
        className="flex flex-col items-start"
        style={{
          gap: 20,
          padding: 24,
          // square, like every other surface on the site
          borderRadius: 0,
          background: "#FFFFFF",
          // the original panel's lighter edge — the shadow does the separating
          border: "1px solid #F1F1F3",
          boxShadow: "0px 12px 36px 0px rgba(0,0,0,0.10)",
          // Clip-path wipe so the card grows open from its anchor edge.
          clipPath: open
            ? "inset(0 0 0 0)"
            : centered
              ? "inset(0 50% 100% 50%)"
              : "inset(0 100% 100% 0)",
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
          {kicker}
        </span>
        {children}
      </div>
    </div>
  );
}

/** Staggered entrance for a menu cell. */
function cellReveal(open: boolean, i: number) {
  return {
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0)" : "translateY(8px)",
    transition: `background 180ms ease, opacity 460ms ${PANEL_EASE} ${220 + i * 110}ms, transform 540ms ${PANEL_EASE} ${220 + i * 110}ms`,
  };
}

function WhySynergyMenu({ open }: { open: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const navigate = useNavigate();
  const [gridRef, rule] = useRuleCrossing();

  return (
    <MenuPanel open={open} kicker="/ why synergy">
      <div className="relative" style={{ width: 620, height: 315 }}>
      <div
        ref={gridRef}
        className="grid h-full w-full grid-cols-2 overflow-hidden"
        style={{
          border: `1px solid ${MENU_RULE}`,
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
              borderRight: i % 2 === 0 ? `1px solid ${MENU_RULE}` : "none",
              borderBottom: i < 2 ? `1px solid ${MENU_RULE}` : "none",
              ...cellReveal(open, i),
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
        {rule ? (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* the grid's one interior crossing */}
            <RuleMark open={open} x={`${rule.x}px`} y={`${rule.y}px`} delay={640} />
          </div>
        ) : null}
        <GridCornerMarks open={open} />
      </div>
    </MenuPanel>
  );
}

/* ------------------------------------------------------- two-column menus */

type RichItem = FeaturedItem;
type ListItem = MenuItem;

/** Colour square + kicker, title (optional tag), one-line description. */
function RichCell({
  item,
  hovered,
  last,
  reveal,
  onEnter,
  onLeave,
  onClick,
}: {
  item: RichItem;
  hovered: boolean;
  last: boolean;
  reveal: React.CSSProperties;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="flex cursor-pointer flex-col items-start"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        padding: "22px 30px",
        gap: 8,
        minHeight: 105,
        background: hovered ? "#F8F8F9" : "transparent",
        borderBottom: last ? "none" : "1px solid #E1E0E4",
        ...reveal,
      }}
    >
      <div className="flex items-center" style={{ gap: 8 }}>
        <span style={{ width: 8, height: 8, background: item.dot, display: "block" }} />
        <span
          className="uppercase whitespace-nowrap"
          style={{ fontSize: 10, lineHeight: "18px", color: "#A1A0A9" }}
        >
          {item.kicker}
        </span>
      </div>
      <div className="flex w-full flex-col items-start" style={{ gap: 6 }}>
        <p
          className="flex w-full items-center font-medium"
          style={{ gap: 8, fontSize: 16, lineHeight: "22px", color: "#000000" }}
        >
          {item.title}
          {item.tag ? (
            <span
              className="uppercase"
              style={{
                fontSize: 10,
                lineHeight: "16px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                padding: "0 6px",
                background: "#0E0B22",
                color: "#FFFFFF",
              }}
            >
              {item.tag}
            </span>
          ) : null}
        </p>
        <p className="w-full" style={{ fontSize: 12, lineHeight: "20px", color: "#7A7885" }}>
          {item.desc}
        </p>
      </div>
    </div>
  );
}

/** Compact row: alternating ink square / diamond (the KPI bullet language), title, one line. */
function ListRow({
  item,
  index,
  hovered,
  last,
  reveal,
  onEnter,
  onLeave,
  onClick,
}: {
  item: ListItem;
  index: number;
  hovered: boolean;
  last: boolean;
  reveal: React.CSSProperties;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="flex flex-1 cursor-pointer items-center"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        padding: "18px 24px 18px 30px",
        gap: 10,
        background: hovered ? "#F8F8F9" : "transparent",
        borderBottom: last ? "none" : "1px solid #E1E0E4",
        ...reveal,
      }}
    >
      <span
        aria-hidden
        className="block shrink-0"
        style={{
          width: 6,
          height: 6,
          background: "#0E0B22",
          transform: index % 2 === 1 ? "rotate(45deg)" : undefined,
        }}
      />
      <div className="flex flex-col" style={{ gap: 2 }}>
        <p className="font-medium" style={{ fontSize: 14, lineHeight: "20px", color: "#000000" }}>
          {item.title}
        </p>
        <p style={{ fontSize: 12, lineHeight: "18px", color: "#7A7885" }}>{item.desc}</p>
      </div>
    </div>
  );
}

/** Column label sitting inside the grid frame, above a column's rows. */
function ColumnHead({ label, reveal }: { label: string; reveal: React.CSSProperties }) {
  return (
    <div
      className="uppercase whitespace-nowrap"
      style={{
        padding: "12px 30px",
        fontSize: 10,
        lineHeight: "18px",
        letterSpacing: "0.06em",
        color: "#A1A0A9",
        borderBottom: "1px solid #E1E0E4",
        ...reveal,
      }}
    >
      {label}
    </div>
  );
}

/**
 * Rich cells on the left, compact list on the right — the shape both the
 * Platform and Solution menus take. The right column is sized to its copy so
 * no dead air trails the descriptions.
 */
function TwoColumnMenu({
  open,
  kicker,
  left,
  right,
  heads,
}: {
  open: boolean;
  kicker: string;
  left: RichItem[];
  right: ListItem[];
  /** Optional column labels, e.g. "By use case" / "By industry". */
  heads?: [string, string];
}) {
  const [hover, setHover] = useState<string | null>(null);
  const navigate = useNavigate();
  const [gridRef, rule] = useRuleCrossing();
  const go = (to?: string) => {
    if (to) navigate({ to });
  };

  return (
    <MenuPanel open={open} kicker={kicker} align="center">
      <div className="relative" style={{ width: 690 }}>
      <div
        ref={gridRef}
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: "360px 330px",
          border: `1px solid ${MENU_RULE}`,
        }}
      >
        <div className="flex flex-col" style={{ borderRight: `1px solid ${MENU_RULE}` }}>
          {heads ? <ColumnHead label={heads[0]} reveal={cellReveal(open, 0)} /> : null}
          {left.map((it, i) => (
            <RichCell
              key={it.title}
              item={it}
              hovered={hover === `l-${i}`}
              last={i === left.length - 1}
              reveal={cellReveal(open, i + 1)}
              onEnter={() => setHover(`l-${i}`)}
              onLeave={() => setHover(null)}
              onClick={() => go(it.to)}
            />
          ))}
        </div>

        <div className="flex flex-col">
          {heads ? <ColumnHead label={heads[1]} reveal={cellReveal(open, 0)} /> : null}
          {right.map((it, i) => (
            <ListRow
              key={it.title}
              item={it}
              index={i}
              hovered={hover === `r-${i}`}
              last={i === right.length - 1}
              reveal={cellReveal(open, i + 2)}
              onEnter={() => setHover(`r-${i}`)}
              onLeave={() => setHover(null)}
              onClick={() => go(it.to)}
            />
          ))}
        </div>
      </div>
        {rule ? (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* where the column rule meets the frame, top and bottom */}
            <RuleMark open={open} x={`${rule.x}px`} y="0.5px" delay={640} />
            <RuleMark open={open} x={`${rule.x}px`} y={`${rule.bottom}px`} delay={690} />
          </div>
        ) : null}
        <GridCornerMarks open={open} />
      </div>
    </MenuPanel>
  );
}

/* --------------------------------------------------------------- platform */

function PlatformMenu({ open }: { open: boolean }) {
  return (
    <TwoColumnMenu
      open={open}
      kicker="/ platform"
      left={PLATFORM_PRODUCTS}
      right={PLATFORM_CAPABILITIES}
    />
  );
}

/* --------------------------------------------------------------- solution */

function SolutionMenu({ open }: { open: boolean }) {
  return (
    <TwoColumnMenu
      open={open}
      kicker="/ solution"
      left={SOLUTION_USE_CASES}
      right={SOLUTION_INDUSTRIES}
      heads={["By use case", "By industry"]}
    />
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
      width="14"
      height="14"
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
