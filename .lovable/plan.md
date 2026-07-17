# Add a gradient/edge layer for sharper contours and highlight detail

Overlay a second pass on top of the existing luminance grid: a Sobel gradient computed from the same downsampled image, driving both glyph choice and color on cells that sit on strong edges (finger silhouettes, knuckle ridges, wrist bones). This preserves the shading pass and adds crisp linework — the "layered" feel of the reference.

## Steps (single file: `src/components/AsciiHandsFooter.tsx`)

1. **Compute a Sobel gradient during sampling**
   - Inside `sampleImage`, after building the downsampled luma grid, run a 3×3 Sobel over the `cols × rows` buffer:
     - `gx = (−1 0 +1 / −2 0 +2 / −1 0 +1)`, `gy = (−1 −2 −1 / 0 0 0 / +1 +2 +1)`.
     - Store per-cell `mag = min(1, hypot(gx, gy) / normalizer)` (normalize by the 95th percentile of magnitudes so the range is stable across images) and `angle = atan2(gy, gx)`.
   - Attach `edge: number` (magnitude 0..1) and `dir: 0|1|2|3` (quantized angle bin: horizontal `─`, vertical `│`, diag `╱`, anti-diag `╲`) to each `Cell`.

2. **Edge glyph selection**
   - Add a small directional set: `["─", "│", "╱", "╲"]` (or ASCII fallbacks `-`, `|`, `/`, `\`).
   - In the render loop, when `edge > 0.55`, override the ramp glyph with the direction-matched line character. When `edge > 0.35` and `< 0.55`, keep the ramp glyph but bump its index a few rungs up (edges read a bit brighter than surrounding shade).

3. **Highlight rim boost**
   - On strong edges that also sit in the upper half of luminance (`edge > 0.5 && b > 0.55`), lift color toward warm white: mix current rgb 60/40 toward `#ffe4d4`, and drive alpha to 1.0. This is the "specular rim" on knuckles and fingertip tops.

4. **Keep the existing pass intact**
   - Body-fill glyphs, S-curve tonemap, coral color ramp, cursor light/push all stay as-is. Edges are additive detail on top, not a replacement.

5. **Perf**
   - Sobel runs once per resample (already the resize path), not per frame. No per-frame cost change beyond a couple of `if` checks per cell.

## Out of scope

Layout, copy, image asset, background, cursor interaction physics. No new dependencies.
