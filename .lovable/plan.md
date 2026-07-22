## Goal
Make the burn-through hole and glow read as a wide, irregular ellipse (like unseen.co/world), not the current near-circular blob.

## Changes — `src/components/IntroVideo.tsx` (fragment shader only)

1. **Elliptical base shape**
   - After computing aspect-corrected `p`, squash the vertical axis so the front is naturally wider than tall:
     - `vec2 pe = vec2(p.x, p.y * 1.75);` (ellipse ratio ≈ 1.75:1, close to the reference frame)
   - Use `pe` in place of `p` for `len`, `ang`, and the warp/streak/hi sampling. Keep the shader input `p` as-is for chroma/other layers.

2. **Stronger irregular edge** (petal/tongue silhouette rather than gentle wobble)
   - Bump default warp: `uWarpAmp` default 0.42 → ~0.62; `uWarpFreq` 1.3 → ~1.15 (bigger lobes).
   - Bump streak: `uStreakAmp` 0.28 → 0.40, `uStreakFreq` 1.9 → 2.4 (longer horizontal tongues, matches the ref's side flares).
   - Angular wobble: raise `uAngularAmp` 1.0 → 1.4 and skew harmonics so horizontal lobes dominate:
     - Add `+ 0.05 * cos(ang * 2.0)` bias to `wob` so left/right bulge more than top/bottom.

3. **Slightly softer, wider outer halo** (the reference glow is broad and diffuse around the ellipse)
   - Raise `uHaloFalloff` default 1.0 → 1.25.
   - Keep core rim / hot halo alphas unchanged so the ring stays crisp.

4. **Debug panel defaults** — update `DEFAULT_BURN_PARAMS` in `src/components/BurnDebugPanel.tsx` to match new values so the panel reflects the shipped look.

## Not changed
- Timeline, easing, scroll mapping, video parallax, chroma/shard/glitch layers, center point.
- No new uniforms; ellipse ratio is a hardcoded constant (can be lifted to a uniform later if needed).

## Verification
- Load `/?debug=1`, scroll to trigger burn, screenshot at ~30 %, ~60 %, ~90 % burn and compare silhouette to the reference (wide, lobed, horizontally elongated).
