/**
 * Hairline frame with crop-mark corners (Figma 底框): rules inset from the
 * section edges, a 6px square where they meet, and ticks continuing past the
 * frame that fade out toward the viewport edge.
 *
 * Shared by the Platform module and the pricing calculator, so a framed block
 * is drawn the same way wherever it appears.
 */
export function CropFrame({
  inset,
  insetTop = inset,
  insetBottom = inset,
  rule = "#E1E0E4",
  mark = "#FFFFFF",
  marks = true,
}: {
  /** Distance from the section's side edges to the frame. */
  inset: string;
  /** Top and bottom can stand further off, leaving a band of plain ground. */
  insetTop?: string;
  insetBottom?: string;
  /** Rule colour; the ticks fade from it to transparent. */
  rule?: string;
  /** Fill of the corner squares — match the surface they sit on. */
  mark?: string;
  /** Drop the corner squares where the crossing rules are enough on their own. */
  marks?: boolean;
}) {
  const edge = (y: "top" | "bottom") => (y === "bottom" ? insetBottom : insetTop);
  const corner = (x: "left" | "right", y: "top" | "bottom") => (
    <span
      key={`${x}-${y}`}
      aria-hidden
      className="absolute"
      style={{
        [x]: inset,
        [y]: edge(y),
        width: 6,
        height: 6,
        background: mark,
        border: `1px solid ${rule}`,
        // the frame's 1px border is centred half a pixel inside the inset
        transform: `translate(calc(${x === "left" ? "-50% + 0.5px" : "50% - 0.5px"}), calc(${y === "top" ? "-50% + 0.5px" : "50% - 0.5px"}))`,
      }}
    />
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      {/* Four rules draw the frame AND its run-outs: each is opaque across the
          frame's own span and fades to nothing at the viewport edge. A separate
          bordered box would lay a second line over every edge — invisible with
          an opaque rule, but double-strength with a translucent one. */}
      {(["top", "bottom"] as const).map((y) => (
        <span
          key={`h-${y}`}
          className="absolute inset-x-0"
          style={{
            [y]: edge(y),
            height: 1,
            background: `linear-gradient(to right, transparent 0, ${rule} ${inset}, ${rule} calc(100% - ${inset}), transparent 100%)`,
          }}
        />
      ))}
      {(["left", "right"] as const).map((x) => (
        <span
          key={`v-${x}`}
          className="absolute inset-y-0"
          style={{
            [x]: inset,
            width: 1,
            background: `linear-gradient(to bottom, transparent 0, ${rule} ${insetTop}, ${rule} calc(100% - ${insetBottom}), transparent 100%)`,
          }}
        />
      ))}
      {marks ? [corner("left", "top"), corner("right", "top"), corner("left", "bottom"), corner("right", "bottom")] : null}
    </div>
  );
}

export default CropFrame;
