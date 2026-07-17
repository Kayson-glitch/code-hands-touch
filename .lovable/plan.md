# Better luminance mapping + finer density ramp

The current renderer washes out midtones because (a) luminance is a raw RGB average, (b) the 8-bucket ramp jumps too coarsely, and (c) alpha and color both scale linearly with brightness so dark regions vanish while highlights bloom flat. Fix all three.

## Steps (single file: `src/components/AsciiHandsFooter.tsx`)

1. **Perceptual luminance + histogram stretch**
   - Sample luma via Rec. 709: `Y = 0.2126R + 0.7152G + 0.0722B`.
   - During `sampleImage`, first pass collects raw Y for every included cell; compute the 2nd and 98th percentiles and remap to `[0,1]` (contrast stretch) so the darkest hand shadow → 0 and the brightest knuckle highlight → 1, regardless of the source image's exposure.
   - Apply a mild gamma (~0.85) after stretching to lift midtones — this is where the reference site gets its readable "shading" band.
   - Lower the visibility threshold to ~0.04 so faint forearm shadows still emit glyphs.

2. **Finer, ordered density ramp (12 buckets)**
   - Replace the 8-bucket padded-space ramp with a single ordered string of ~70 glyphs, dark→bright, e.g. `` ` . , ' : ; ! i | ( ) / \ + = t r c v n x z u o a e s w m k h b d q p g y # % 8 & @ M W N Q $ B ``. Each cell's index into this string = `floor(Y * (N-1))`, giving 70 steps of visual weight instead of 8.
   - Ambient shimmer picks a neighboring index (±1) instead of a random glyph from a bucket, so shading stays coherent frame-to-frame.

3. **Decouple color, alpha, and glyph**
   - Glyph choice already encodes brightness — stop double-encoding with alpha.
   - Alpha stays high (0.75–1.0) across all visible cells; color still ramps coral (shadow `#5a1a12` → highlight `#ffb0a0`) but on a gamma-corrected curve so midtone hue reads warm, not muddy.
   - Cursor light: additive lift on RGB (as today) plus a small index bump (+2..+4 steps up the ramp near cursor core) instead of the current +1 bucket. Push amplitude unchanged.

4. **Cell density tuning**
   - Keep `CELL_W=7`, drop `CELL_H` to `9` for slightly denser vertical sampling — makes the fingers read as solid volumes rather than stripes.

## Out of scope

Layout, copy, background, wordmark, and image asset stay as-is. No new dependencies.
