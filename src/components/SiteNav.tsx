import { useEffect, useState } from "react";
import logoLight from "@/assets/synergy-logo-light.png.asset.json";
import logoDark from "@/assets/synergy-logo-dark.png.asset.json";

export function SiteNav() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hidden, setHidden] = useState(true);

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

  const isDark = theme === "dark";
  const fg = isDark ? "text-white" : "text-black";
  const navItem = `${fg} opacity-50 hover:opacity-100 transition-opacity duration-200`;
  const ctaClass = isDark
    ? "bg-white text-black"
    : "bg-black text-white";

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 top-0 flex items-center justify-between px-10"
      style={{
        height: 68,
        zIndex: 80,
        opacity: hidden ? 0 : 1,
        transition: "opacity 260ms ease-out",
      }}
    >
      {/* Logo */}
      <a
        href="/"
        className={`pointer-events-auto flex items-center gap-2 ${fg}`}
        style={{ height: 28 }}
      >
        <img
          src={isDark ? logoDark.url : logoLight.url}
          alt="Synergy.AI"
          style={{
            height: 28,
            width: "auto",
            display: "block",
          }}
        />
      </a>

      {/* Center menu */}
      <ul
        className="pointer-events-auto hidden items-center gap-10 md:flex"
        style={{ fontSize: 14, lineHeight: "22px" }}
      >
        <li className={`flex cursor-pointer items-center gap-1 ${navItem}`}>
          Platform <Chevron />
        </li>
        <li className={`flex cursor-pointer items-center gap-1 ${navItem}`}>
          Solution <Chevron />
        </li>
        <li className={`cursor-pointer ${navItem}`}>Pricing</li>
        <li className={`cursor-pointer ${navItem}`}>Company Hub</li>
      </ul>

      {/* Right actions */}
      <div className="pointer-events-auto flex items-center gap-4">
        <button
          className={navItem}
          style={{ fontSize: 14, lineHeight: "22px" }}
        >
          Log In
        </button>
        <button
          className={`${ctaClass} rounded-full px-4 font-medium transition-transform hover:scale-[1.02]`}
          style={{ height: 32, fontSize: 14, lineHeight: "22px" }}
        >
          Book a Demo
        </button>
      </div>

      {/* Bottom divider: white at 10% opacity as a soft gradient */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: "100%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
        }}
      />
    </nav>
  );
}

function Chevron() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
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