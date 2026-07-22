export function TopAuroraGradient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0"
      style={{
        height: "62vh",
        zIndex: 5,
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.9) 55%, rgba(0,0,0,0) 100%)",
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.9) 55%, rgba(0,0,0,0) 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          mixBlendMode: "screen",
          background:
            "radial-gradient(60% 75% at 22% 8%, rgba(30,99,255,0.72) 0%, rgba(75,58,255,0.55) 28%, rgba(75,58,255,0) 60%)",
          backgroundSize: "160% 160%",
          backgroundPosition: "0% 0%",
          animation: "aurora-drift-a 22s ease-in-out infinite",
          willChange: "background-position, background-size",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          mixBlendMode: "screen",
          background:
            "radial-gradient(58% 72% at 78% 6%, rgba(208,24,255,0.7) 0%, rgba(255,18,69,0.5) 32%, rgba(255,18,69,0) 62%)",
          backgroundSize: "170% 170%",
          backgroundPosition: "100% 0%",
          animation: "aurora-drift-b 26s ease-in-out infinite",
          animationDelay: "-6s",
          willChange: "background-position, background-size",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          mixBlendMode: "screen",
          background:
            "radial-gradient(45% 55% at 50% 0%, rgba(139,34,255,0.55) 0%, rgba(232,26,138,0.3) 40%, rgba(232,26,138,0) 70%)",
          backgroundSize: "150% 150%",
          backgroundPosition: "50% 0%",
          animation: "aurora-drift-c 19s ease-in-out infinite",
          animationDelay: "-3s",
          willChange: "background-position, background-size",
        }}
      />
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: "12vh",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
        }}
      />
    </div>
  );
}

export default TopAuroraGradient;