## Changes to `src/components/GlitchGrainOverlay.tsx`
- Remove the canvas-based grain layer and its jitter animation entirely.
- Keep only the scanline layer (`repeating-linear-gradient`) with the current subtle intensity.
- Simplify the component to a single fixed `<div>` with the scanline background.

## Changes to `src/components/IntroVideo.tsx`
- Render the same scanline overlay on top of the video canvas during the burn/expansion phase so the growing black hole also carries the scanlines.
- Mount it as a fixed full-screen layer above the video canvas but below UI, gated on the burn being active (or always visible during the IntroVideo lifecycle, matching the dark backdrop).
- Reuse `GlitchGrainOverlay` (now scanline-only) to keep a single source of truth for the scanline style.

No other behavior, timing, or visual effects change.