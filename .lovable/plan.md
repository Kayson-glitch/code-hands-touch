## Goal
Replace our current cursor implementation with a faithful port of good-fella.com's ASCIIEffect gooey reveal. The correct effect is **glyph scrambling + color lift, on silhouette cells only, inside a noise-distorted wobbling disc** — not a glyph cloud spawned into background cells. Confirmed by reading the unminified GLSL (`734d3e55f9f110c2.js` in the source bundle).

## Source shader — parameters to mirror
- `radius = 0.15` in UV (fraction of the shorter screen dim, aspect-corrected)
- `softness = 0.08` in UV
- `noiseIntensity = 0.03`
- `intensity` (animated ease 0→1) — fade in on cursor enter (~200 ms), fade out on leave (~250 ms)
- Distorted distance per cell:
  `d' = d + hash(cell) * noiseIntensity * 2 + sin(time*1.5 + hash(cell)*τ) * noiseIntensity * 0.3`
- Gooey blend: `1 - smoothstep(R*I - S*I*0.5, R*I + S*I*0.5, d')`
- Scramble: `idx' = (idx + hash(cell+scrambleSeed) * rampLen * luminance) mod rampLen`
  - `luminance` here is our per-cell `b` (already 0..1)
- Sharp blend gate: `sharpBlend = smoothstep(0, 0.15, gooeyBlend)` — used as color mix factor
- Color inside disc: mix toward a "reveal target" color that matches what the source's underlying scene contributes. Since we don't have a separate underlying image texture, use a fixed warm highlight `rgb(240, 200, 175)` mixed with the base ramp color by `sharpBlend`.

## Changes in `src/components/AsciiHandsFooter.tsx`

1. **Remove the background-cell spawn code.** Drop the loop that draws into `sIdx === -1` cells. Background stays black at all times.
2. **Keep the per-cell grid metadata** (`silIdx`, `seed`) — we still need per-cell hash and stable random for the scramble and edge noise. Rename `seed` semantics to `hash(cell)` values, still 0..1.
3. **Merge the two draw passes back into one silhouette-only pass.** Iterate over `cells` (silhouette cells only). For each cell:
   - Compute `d` = distance from cell to cursor **in UV units**: divide pixel distance by `min(canvasW, canvasH)` and aspect-correct x by `canvasW/canvasH` (mirror the shader).
   - Compute `d' = d + h*NOISE*2 + sin(t*1.5 + h*τ)*NOISE*0.3` where `h = grid.seed[k]` and `t` is a rolling seconds clock.
   - Compute `intensity` from a state that eases `0↔1` toward `mouseRef.active ? 1 : 0` with time-based tween (200/250 ms).
   - `R = 0.15 * intensity`, `S = 0.08 * intensity * 0.5`; skip if `d' > R + S`.
   - `gooey = 1 - smoothstep(R-S, R+S, d')`.
   - `sharp = smoothstep(0, 0.15, gooey)`.
   - Scrambled index: `idx' = floor((c.idx + hash(k+scrambleSeed) * RAMP_LEN * c.b) % RAMP_LEN)`. Only apply when `sharp > 0`.
   - Color: base ramp color (coral) → mix toward `rgb(240, 200, 175)` (warm highlight, sampled from the source's revealed cells) by `sharp`.
4. **Add a `uScrambleSeed`-equivalent.** Bump every ~2 frames or on cursor stop so scrambled cells re-shuffle glyphs continuously; source visibly re-shuffles inside the disc.
5. **Animate `intensity`.** Store `intensityRef` as a number; every frame ease toward target by `dt / durationMs`. Keeps the disc from popping.
6. **Adjust radius to CSS px.** UV `0.15` on a `min(w,h)` basis means pixel radius `0.15 * min(canvasW, canvasH)`; use that instead of the current `INFLUENCE_RADIUS = 110`.
7. **Remove ambient shimmer's dependence on `c.ch`** so it doesn't fight the scramble; keep it minimal or drop it.
8. **Reduced-motion path:** skip scramble and edge noise; still allow static gooey lift (no time term, no animated intensity).

## Non-goals
- Not replicating the reveal typewriter (`uProgress`), click ripples (`uClickPoint`, `uImpactProgress`), or depth parallax — those are separate site features unrelated to the hover.

## Verification
- `bun run build` passes.
- Playwright: hover, capture 240 px crop; expect only silhouette cells to change (background remains black); glyphs inside the disc look randomized; disc edge is soft and slightly ragged / wobbling frame-to-frame.
- Cursor leave: cells return to base coral within ~250 ms, no residue.
- Compare against captures under `/tmp/browser/gf/` and the earlier user-uploaded reference.