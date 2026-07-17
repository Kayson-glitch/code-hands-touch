
## Goal

Match good-fella.com's hover interaction. Two visual states per glyph:

- **Base (default):** every glyph painted in the site's signature orange `#fa4b16` (brightness still encoded by the ramp glyph itself).
- **Reveal (near cursor):** glyph flips to its "true" color sampled from the source image — the colorful RGB layer that lives underneath. Cursor acts like a spotlight that dissolves the orange coat.

Currently we render a fixed coral gradient everywhere and just brighten it near the cursor. That's wrong on two counts: base isn't orange, and there is no underlying colorful layer.

## Changes (single file: `src/components/AsciiHandsFooter.tsx`)

1. **Sample per-cell RGB from the image**, not just luma.
   - In `sampleImage`, keep the current luma → ramp index pipeline unchanged (glyph choice stays identical, so shape/contrast is preserved).
   - Additionally store the cell's average source RGB (`cr`, `cg`, `cb`) taken from the same downsampled pixel. This is the "colorful underneath" color.
   - Extend the `Cell` type with `cr/cg/cb`.

2. **Base color = orange.** Replace the coral gradient math (lines ~249–252). Every cell paints at `rgb(250, 75, 22)` (site orange), with a slight luminance modulation using `c.b` so denser glyphs read a touch brighter — e.g. `rgb(250, 75, 22)` at `b=1` down to `rgb(180, 55, 16)` at `b=0`. Alpha stays 1.

3. **Cursor reveal → colorful RGB.** Inside the `m.active` block:
   - Compute `t = 1 - dist / INFLUENCE_RADIUS` as today.
   - Interpolate color from orange → `(c.cr, c.cg, c.cb)` by `t` (linear mix). At the cursor core the glyph shows its true image color; at the edge of the influence radius it's still orange.
   - Remove the current white "lift" (`+140` on all channels) — the reveal itself is the effect; no extra brightening.
   - Keep the small radial `push` (positional nudge) and the ramp `bump` near the core, both feel right and match the source's subtle displacement.

4. **Radius tuning.** Bump `INFLUENCE_RADIUS` from 130 → ~160 so the reveal spot feels closer to the source's soft ~300 px diameter halo. Single-value tweak; revisit if it looks off.

5. **No changes** to: image asset, ramp string, gamma, FONT_PX, CELL_W/H, layout, wordmark, section background, or DOM structure.

## Technical notes

- The "colorful underneath" is not a second canvas — it's per-cell RGB carried on `Cell`. This is cheaper than a second draw pass and matches what good-fella.com does (their per-glyph colors are baked at sample time; hover just blends between two color sources).
- Orange base color `#fa4b16` = `rgb(250,75,22)`, sampled from the source-site screenshot.
- Reduced-motion users still get the reveal on hover (it's not motion); only the ambient shimmer + push respect `prefers-reduced-motion`.

## Verify

- Build passes.
- Screenshot with cursor off-canvas → uniform orange silhouette.
- Screenshot with cursor over the hands → colorful reveal in a soft circle, orange elsewhere.
