## Goal
Replace the "circular whitening halo" with the source's real interaction: the cursor **spawns a cloud of glyphs into empty background cells** and lifts nearby silhouette cells at the same time. The visible shape is not a clean disc — it's a soft cluster of randomly-picked glyphs whose density falls off with distance from the cursor.

## Observations from the source

- Source captures in `/tmp/browser/gf/hero_hover.png` and `hero_sweep.png` show glyphs appearing in the black space near the cursor — cells that had no glyph before now render one. Our current implementation never draws into background cells.
- Your reference (`user-uploads://image-2.png`) shows the same effect at higher intensity: a dense cluster of ~15×10 varied bright glyphs (`ftmpdOJU`, `k0LZm@`, `bLIk`, `#M:8`, …). The glyphs are randomly chosen from across the ramp — not a smooth density gradient.
- The cluster is roughly circular but its edge is ragged because per-cell spawn is probabilistic — probability falls off with distance from cursor.
- Existing silhouette cells inside the cluster shift toward near-white; background cells that were spawned render as coral-to-white glyphs depending on distance.
- Spawn only lives while the cursor is inside a cell's neighborhood; leave and the spawned glyphs vanish (no trail).

## Changes in `src/components/AsciiHandsFooter.tsx`

1. **Build a full grid of "candidate" cells** at resample time, not only silhouette cells:
   - Keep the existing `Cell` list (silhouette cells with real `b`, `idx`, `ch`).
   - Additionally store, for every grid position covered by the image band, an `isSilhouette: boolean` and a stable random seed so re-renders don't flicker glyph choice.
2. **In the draw loop, iterate over the full grid** (cols × rows), not just populated cells.
   - For silhouette cells: draw as today (with the cursor whitening lift from the previous step).
   - For background cells: only draw when they fall inside a **spawn radius** around the cursor.
3. **Spawn model** for a background cell at distance `d` from cursor:
   - Compute `t = smoothstep(0, 1, 1 - d/SPAWN_RADIUS)` with `SPAWN_RADIUS = 110`.
   - Skip the cell if `t < 0.05`.
   - Use a probabilistic mask: skip when `hash(cellSeed) > t * 0.9` — this produces the ragged, cluster-like edge instead of a filled disc.
   - Pick the glyph from the ramp using a per-cell stable hash so the same cell shows the same glyph while the cursor lingers on it (not flickering every frame). Bias glyph choice toward mid-to-high ramp indices weighted by `t`.
   - Color: interpolate from coral `rgb(60, 30, 30)` (edge) → warm near-white `rgb(245, 235, 225)` (core) by `t`.
4. **Keep the silhouette whitening** from the last patch, but drive it from the same shared `smoothstep(t)` and shrink `INFLUENCE_RADIUS` to match `SPAWN_RADIUS = 110`. Silhouette cells inside the cluster whiten; outside cells stay at the coral ramp color.
5. **No positional displacement.** Already removed.
6. **No trail.** The spawned cells are recomputed every frame from the current cursor position.
7. **Reduced motion & no-cursor path.** When `prefersReducedMotion` is on or `mouseRef.active === false`, skip the spawn loop entirely — behavior identical to current no-cursor idle.
8. **Perf.** Only iterate over grid cells inside the cursor's bounding box (`ceil(SPAWN_RADIUS / CELL_W)` cells around cursor), not the whole grid. Keep the existing silhouette loop as-is.

## Verification

- `bun run build` passes.
- Playwright: hover a fixed point on our footer canvas; capture 240×240 crop around cursor. Expect a soft-edged, ragged cluster of varied glyphs — not a smooth disc. Compare visually against `/tmp/browser/gf/hero_hover.png` and the user's uploaded reference.
- Move cursor off; the cluster disappears with no residue.
- Sweep test: cluster follows cursor smoothly, no trail.

## Open question, only if the plan looks off
If after implementing this the density still doesn't match, the next dial is `SPAWN_RADIUS` (larger → bigger cloud) and the probability curve (`t * 0.9` → `t^0.7`) which fills the core more solidly.