## Changes

### 1. Replace nav logo
- Register the uploaded `Container.png` as a Lovable asset: `src/assets/synergy-logo.png.asset.json` (via `lovable-assets create` from `/mnt/user-uploads/Container.png`).
- In `src/components/SiteNav.tsx`: remove the gradient "S" circle + "Synergy.AI" text, replace with a single `<img>` of the new logo, `height: 28px`, `width: auto`, `alt="Synergy.AI"`. Keep the anchor link to `/`.

### 2. Show nav above the intro video
- In `src/components/AsciiHandsFooter.tsx`: the `IntroVideo` wrapper uses `zIndex: 60`, which covers the nav (`z-40`). Raise `SiteNav`'s stacking so it renders above the intro layer from the very first frame.
- Change `SiteNav`'s container from `z-40` to an inline `zIndex: 80` (above intro's 60 and burst overlays). No changes to render timing — it is already mounted in `src/routes/index.tsx` before/around `AsciiHandsFooter`, so it will be visible while the intro video plays.

### 3. Invert logo on light background
- Nav already listens to `app-bg-change` and tracks `theme`. On light bg (intro stage, `#EFE7DA`), apply a CSS filter to the logo image so it renders as its dark/inverted variant; on dark bg, render as-is (logo is already dark-on-light).
- Implementation: on the logo `<img>`, when `theme === 'light'` (light background) → no filter (logo shows its native dark artwork); when `theme === 'dark'` → apply `filter: invert(1) hue-rotate(180deg)` (or `brightness(0) invert(1)` for a clean white silhouette) so the mark stays legible on `#0a0a0a`.
- Keep existing text color adaptation for the rest of the nav items unchanged.

## Files touched
- `src/assets/synergy-logo.png.asset.json` (new)
- `src/components/SiteNav.tsx` (logo swap + z-index + theme-based filter)

No other components, layout, animations, or intro-video logic change.
