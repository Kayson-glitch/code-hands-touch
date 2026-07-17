## Goal
1:1 replicate good-fella.com's cursor interaction on the ASCII footer. Our current version adds a radial *push* (glyphs slide away from the cursor) and uses a large 130 px influence radius — the source does neither. The source effect is purely a **local brightness/ramp lift**: near the cursor, glyphs get whiter and step up the density ramp; no positional displacement; small radius; instant tracking with no trail.

## Observations from the source (WebGL footer)
Captured via Playwright at `https://good-fella.com` (scrolled to footer, hover close-ups in `/tmp/browser/gf/a_before.png` vs `a_after.png`):

- **No displacement.** Glyph grid stays perfectly on its 10 px lattice under the cursor. No radial push.
- **Small influence radius.** The affected region is roughly a 6–8 cell disc (~60–80 CSS px), not our current 130 px.
- **Brightness whitening.** Cells near cursor shift color toward near-white (not just brighter coral); the base coral ramp remains for the rest.
- **Ramp bump.** Cells near cursor step several rungs up the density ramp (denser glyphs like `@ % # &`).
- **Falloff.** Soft edge — a smoothstep-like falloff so the disc dissolves into the surroundings, not a hard circle.
- **No trail / inertia.** Effect tracks the cursor 1:1; when the cursor leaves, cells snap back after roughly one frame (no lingering ghost).
- **Effect only on populated cells.** Off-silhouette (background) stays empty — the cursor doesn't spawn glyphs where there's no hand.

## Changes in `src/components/AsciiHandsFooter.tsx`

1. **Remove radial push.** Delete the `dx`/`dy` computation and the `push` term. Draw every cell at its original `c.x`/`c.y`.
2. **Shrink `INFLUENCE_RADIUS`** from `130` → `70`.
3. **Reshape the falloff.** Replace the linear `t = 1 - dist/radius` with a smoothstep: `t = smoothstep(0, 1, 1 - dist/radius)`.
4. **Whiten instead of add-coral.** Blend the base coral color toward `rgb(245, 235, 225)` by factor `t` (so cursor core reads near-white; edges keep coral).
5. **Keep the ramp bump** but drive it from the smoothstep-`t` and clamp to `0..6` rungs — the visible max in the source is ~6 rungs.
6. **Keep alpha at 1.** Drop the `alpha + t*0.35` bump — source never fades.
7. **Leave the rest untouched:** image, ramp, gamma, ambient shimmer, colors of unaffected cells, layout, glyph size, wordmark, canvas sizing, reduced-motion path.

## Verification
- Run the build (typecheck + Vite).
- Playwright hover screenshot at footer center; compare `before` vs `after` crops against `/tmp/browser/gf/a_before.png` / `a_after.png` — expect a whitened, denser disc that stays on the 10 px grid with no positional shear.
- Quick sweep to confirm no trail persists after the cursor leaves.