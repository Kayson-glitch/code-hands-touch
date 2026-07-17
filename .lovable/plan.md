# Per-direction edge glyph subsets

Right now every strong edge collapses to one of four glyphs (`-`, `|`, `/`, `\`), which reads mechanical. Replace each direction with a small subset of glyphs of matching visual orientation and slightly varying weight, picked deterministically per cell so the linework doesn't flicker.

## Steps (single file: `src/components/AsciiHandsFooter.tsx`)

1. **Define four direction subsets**
   Replace `EDGE_GLYPHS: string[]` (length 4) with `EDGE_SETS: string[]` (length 4), each a short glyph string ordered dark→bright within that orientation:

   - **Horizontal** (dir 0): `"-_=~—"`  — flat strokes and dashes
   - **Anti-diagonal** (dir 1, `\`): `"\\\\`", `,`, `%`, `¥`" → concretely `"\\`,%¥"` (keep monospace-friendly)
   - **Vertical** (dir 2): `"|!|iI1"` — vertical stems of varying weight
   - **Diagonal** (dir 3, `/`): `"/;/j7"`

   Final glyph strings (kept ASCII-only for monospace-safe rendering):
   - `["-_=~"`, `"\\`,%"`, `"|!Il1"`, `"/;j7"`]`

2. **Deterministic pick per cell**
   Add a stable `seed` to each `Cell` (e.g. `(i * 131 + j * 17) & 0xff`) during sampling. In the render loop, when a strong edge fires, pick `EDGE_SETS[dir].charAt(seed % set.length)` combined with the cell's brightness bucket — e.g. `set.charAt((seed + Math.floor(b * (set.length - 1))) % set.length)` so brighter edges lean toward the heavier glyph in the set. This keeps each cell's edge glyph identical across frames (no flicker) while giving the overall edge run a natural mix.

3. **Medium-edge bump keeps ramp glyph**
   Leave the `edge ∈ (0.35, 0.55)` branch alone — it should stay body-fill glyph bumped up the density ramp, not a line character, so mid-contrast areas don't turn into a hatched mesh.

4. **Ambient shimmer stays off for edges**
   Already gated by `c.edge < 0.55`; no change needed.

## Out of scope

Sobel math, tonemap, color ramp, cursor interaction, layout. No new dependencies.
