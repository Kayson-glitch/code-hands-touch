## Goal
Apply the dot-grid background globally (all screens/sections) on a unified pure black background, matching the reference site (redomedia.co) style.

## Changes

1. **`src/styles.css`**
   - Add a global body background: pure black (`#000`) with the radial-gradient dot pattern (`rgba(255,255,255,0.09)` 0.6px dots on 4px tile), fixed attachment so it stays put during scroll.
   - This ensures the dot grid is present across the entire page (hero, slogan section, and any future sections) without needing per-component overlays.

2. **`src/components/AsciiHandsFooter.tsx`**
   - Remove the locally mounted `GlitchGrainOverlay` (no longer needed — grid comes from global background).
   - Keep the black fill of the footer transparent so the global grid shows through.

3. **`src/routes/index.tsx`** (already grid-free at root; no overlay to remove there)
   - Ensure the fixed hero container does not paint an opaque black over the body (use transparent background so global dots show through).

4. **`src/components/SloganSection.tsx`** / other sections
   - Verify backgrounds are transparent (or explicitly transparent) so the global dot grid shows during scroll. Adjust only if an opaque black is currently painted.

5. **`src/components/GlitchGrainOverlay.tsx`**
   - Keep the component file but stop mounting it (or delete usages). Optionally remove if no longer referenced anywhere.

## Notes
- Dot spec unchanged: 4×4px tile, 0.6px white dot at 9% alpha.
- Intro video phase: video sits above the body, so the grid is naturally hidden during playback and only appears once the burn-through reveals the black background — matching the current behavior for the diffusion black.
