/**
 * Dot-matrix (halftone) arrow used inside buttons.
 * Drawn on a 7x7 dot grid so it reads as a pixel/dot arrow rather than a stroke icon.
 */
export function DotArrow({
  size = 16,
  className,
  direction = "right",
}: {
  size?: number;
  className?: string;
  direction?: "right" | "up";
}) {
  // [col, row] on a 7x7 grid, arrow pointing right.
  const dots: Array<[number, number]> = [
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
    [4, 3],
    [5, 3],
    [3, 1],
    [4, 2],
    [4, 4],
    [3, 5],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={className}
      style={{
        display: "block",
        flexShrink: 0,
        transform: direction === "up" ? "rotate(-90deg)" : undefined,
      }}
    >
      {dots.map(([c, r]) => (
        <circle
          key={`${c}-${r}`}
          cx={c * 2 + 1}
          cy={r * 2 + 1}
          r={0.85}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

export default DotArrow;
