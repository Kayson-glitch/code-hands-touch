## Findings from the reference site (redomedia.co)
The "dot grid" is actually a 256×256 grayscale noise PNG tiled at natural size, layered twice with effective opacity ≈ 0.04–0.045 (child layer opacity 0.5 × ancestor opacity 0.08–0.09). It is not a CSS radial-gradient — that's why my current approach doesn't match.

- Asset URL: `https://framerusercontent.com/images/rR6HYXBrMmX4cRpXfXUOvpvpB0.png`
- Tile size: 256×256, `background-size: auto`, `background-repeat: repeat`
- Effective opacity over pure black: ~0.045

## Changes

1. **Add the reference tile as a project asset**
   - `curl` the PNG into `/tmp`, then run `lovable-assets create` to produce `src/assets/dot-grain.png.asset.json` (CDN pointer, no binary copied in).

2. **`src/styles.css` — replace the radial-gradient dot approach with the real tile**
   - Remove the `radial-gradient` + `background-size: 4px 4px` block on `body`.
   - Keep `body { background-color: #000 }`.
   - Add a fixed full-viewport overlay (either a `body::before` layer or a small React div in `__root.tsx`) that:
     - `background-image: url(<asset>)`
     - `background-repeat: repeat`
     - `background-size: auto` (256px natural tile)
     - `opacity: 0.045`
     - `position: fixed; inset: 0; pointer-events: none; z-index: 0`
   - Because CSS can't import a JSON asset URL, implement the overlay as a small React component mounted once in `src/routes/__root.tsx` that imports the asset JSON and renders the fixed div.

3. **Verify layering**
   - Overlay sits behind app content (z-index 0) and above the black body.
   - Hero fixed container, SloganSection, etc. are already transparent, so the grain shows through globally.
   - Intro video still fully covers the overlay during playback (its container is opaque black at higher z-index) — matching the reference behavior of grain only appearing over open black areas.

## Notes
- Effective 0.045 opacity is deliberately faint; anything higher would be more prominent than the reference.
- No changes to hero, slogan, or nav components.
