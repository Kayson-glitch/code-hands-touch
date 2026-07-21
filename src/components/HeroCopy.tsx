import { useEffect, useState } from "react";

export function HeroCopy() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      if (detail === "dark") {
        // Fade in shortly after the hands stage begins
        window.setTimeout(() => setVisible(true), 350);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener("app-bg-change", onBg);
    return () => window.removeEventListener("app-bg-change", onBg);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-30 flex flex-col items-center px-6 text-center"
      style={{
        top: "50%",
        transform: visible
          ? "translateY(calc(-50% - 30vh))"
          : "translateY(calc(-50% - 30vh + 12px))",
        opacity: visible ? 1 : 0,
        transition: "opacity 700ms ease-out, transform 700ms ease-out",
      }}
    >
      <h1
        className="font-display text-white"
        style={{
          fontSize: 48,
          lineHeight: "56px",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          maxWidth: 900,
        }}
      >
        Support that drives revenue,
        <br />
        powered by{" "}
        <span
          style={{
            background:
              "linear-gradient(90deg, #6B4CFF 0%, #B478FF 55%, #E36BFF 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          Synergy.AI.
        </span>
      </h1>

      <p
        className="mt-5 text-white/60"
        style={{ fontSize: 16, lineHeight: "24px", fontWeight: 400 }}
      >
        Intelligent Knowledge Engine for accurate, context-aware responses.
      </p>

      <button
        className="pointer-events-auto mt-8 rounded-full bg-white px-6 font-medium text-black transition-transform hover:scale-[1.03]"
        style={{ height: 40, fontSize: 14, lineHeight: "22px" }}
      >
        Book a Demo
      </button>
    </div>
  );
}

export default HeroCopy;