import { useEffect, useState } from "react";
import logo from "@/assets/synergy-logo-v2.png.asset.json";

export function SiteNav() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hidden, setHidden] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Nav starts hidden through the intro video + burst. Only show it
    // once we've received an explicit "visible" signal (after the black
    // handoff). Fallback: if no burst is ever dispatched (e.g. reduced
    // motion path), reveal after a short delay so the site is usable.
    const t = window.setTimeout(() => setHidden(false), 4000);
    return () => window.clearTimeout(t);
  }, []);

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The whole site now sits on a light background, so the nav is always
  // rendered in its light (dark-ink) variant.
  const isDark = false;
  void theme;
  const navItem =
    "flex cursor-pointer items-center gap-1.5 p-4 capitalize text-ink-muted transition-colors duration-200 hover:text-ink";
  const navItemActive =
    "flex cursor-pointer items-center gap-1.5 p-4 capitalize text-ink transition-colors duration-200";
  const glassBg = "rgba(250,250,250,0.72)";


  return (
    <nav
      className="pointer-events-none fixed inset-x-0 top-0 flex items-center justify-center px-6"
      style={{
        height: 68,
        zIndex: 80,
        opacity: hidden ? 0 : 1,
        background: scrolled ? glassBg : "transparent",
        backdropFilter: scrolled ? "blur(18px) saturate(140%)" : "none",
        borderBottom: "2px solid var(--accent-blue)",
        transition:
          "opacity 260ms ease-out, background 260ms ease-out, backdrop-filter 260ms ease-out",
      }}
    >
      <div className="flex h-full w-full max-w-[1200px] items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          className="pointer-events-auto flex shrink-0 items-center gap-2 text-ink"
          style={{ height: 28 }}
        >
          <img
            src={logo.url}
            alt="Synergy.AI"
            style={{
              height: 28,
              width: 28,
              display: "block",
              borderRadius: 888,
              objectFit: "cover",
              filter: isDark ? "none" : "invert(1)",
            }}
          />
          <span
            className="font-medium"
            style={{ fontSize: 18, lineHeight: "24px" }}
          >
            Synergy.AI
          </span>
        </a>

        {/* Center menu */}
        <ul
          className="pointer-events-auto hidden flex-1 items-center justify-center gap-2.5 md:flex"
          style={{ fontSize: 14, lineHeight: "22px" }}
        >
          <li className={navItemActive}>
            Platform <Chevron />
          </li>
          <li className={navItem}>
            Solution <Chevron />
          </li>
          <li className={navItem}>Pricing</li>
          <li className={navItem}>Company Hub</li>
        </ul>

        {/* Right actions */}
        <div className="pointer-events-auto flex shrink-0 items-center gap-2.5">
          <button
            className="px-4 py-[7px] capitalize text-ink"
            style={{ fontSize: 14, lineHeight: "22px" }}
          >
            Log in
          </button>
          <button
            className="bg-ink font-medium text-white transition-transform hover:scale-[1.02]"
            style={{
              height: 32,
              fontSize: 12,
              lineHeight: "20px",
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid var(--ink)",
            }}
          >
            Book a Demo
          </button>
        </div>
      </div>
    </nav>

  );
}

function Chevron() {
  return (
    <svg
    <svg
      width="16"
      height="16"
      viewBox="0 0 10 10"
      fill="none"
    >

    >
      <path
        d="M2 3.5L5 6.5L8 3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default SiteNav;