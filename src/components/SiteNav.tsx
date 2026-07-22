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
  const hoverFg = isDark ? "hover:text-white" : "hover:text-black";
  const capsuleClass = isDark
    ? "bg-black/55 border-white/12"
    : "bg-white/70 border-black/10";
  const loginBorder = isDark
    ? "border-white/25 text-white/85 hover:text-white hover:border-white/50"
    : "border-black/20 text-black/80 hover:text-black hover:border-black/45";
  const ctaClass = isDark ? "bg-white text-black" : "bg-black text-white";

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 top-0 flex justify-center px-6"
      style={{
        height: 68,
        paddingTop: 20,
        zIndex: 80,
        opacity: hidden ? 0 : 1,
        transition: "opacity 260ms ease-out",
      }}
    >
      <div
        className={`pointer-events-auto flex items-center gap-8 rounded-full border backdrop-blur-xl ${capsuleClass} ${fg}`}
        style={{ height: 52, paddingLeft: 16, paddingRight: 6 }}
      >
        {/* Logo */}
        <a href="/" className="flex items-center" style={{ height: 28 }}>
          <img
            src={isDark ? logoDark.url : logoLight.url}
            alt="Synergy.AI"
            style={{ height: 28, width: "auto", display: "block" }}
          />
        </a>

        {/* Center menu */}
        <ul
          className="hidden items-center gap-8 md:flex"
          style={{ fontSize: 14, lineHeight: "22px" }}
        >
          <li className="flex cursor-pointer items-center gap-1">
            Platform <Chevron />
          </li>
          <li className="flex cursor-pointer items-center gap-1">
            Solution <Chevron />
          </li>
          <li className="cursor-pointer">Pricing</li>
          <li className="cursor-pointer">Company Hub</li>
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2 pl-2">
          <button
            className={`rounded-full border transition-colors ${loginBorder} ${hoverFg}`}
            style={{ height: 32, padding: "0 16px", fontSize: 14, lineHeight: "22px" }}
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
      </div>
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
      className="opacity-70"
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