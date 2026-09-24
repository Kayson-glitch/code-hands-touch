/**
 * The FakeHunter mark: a reticle with an F cut out of it.
 * `scanning` animates the reticle's cross-hairs, used in the preloader.
 */
export function Mark({ size = 28, scanning = false }: { size?: number; scanning?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      style={{ display: "block", flex: "0 0 auto" }}
    >
      <rect x="0.5" y="0.5" width="31" height="31" fill="var(--fh-acid)" />
      {/* F, drawn as negative space so the mark stays legible at 16px. */}
      <path d="M11 8h12v3.6h-8.2v3.2H22v3.6h-7.2V24H11V8z" fill="#0a0a0b" />
      {/* Reticle ticks. */}
      <g stroke="#0a0a0b" strokeWidth="1.4" opacity={scanning ? 1 : 0.35}>
        <path d="M0 16h4M28 16h4M16 0v4M16 28v4">
          {scanning && (
            <animate
              attributeName="opacity"
              values="0.2;1;0.2"
              dur="1.2s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "baseline" }}>
      <span
        style={{
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        FakeHunter
      </span>
      <span style={{ color: "var(--fh-acid)", fontWeight: 500, letterSpacing: "-0.02em" }}>
        .AI
      </span>
    </span>
  );
}
