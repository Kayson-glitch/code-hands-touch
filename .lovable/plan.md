# Shrink the reveal disc further

The current disc is still ~2× larger than the source site's. The source shows only a small ~90–120px cluster of glyphs (roughly the size of a fingertip area), not a large plate.

## Changes (single file: `src/components/AsciiHandsFooter.tsx`)

- `GOOEY_RADIUS_UV`: `0.18` → `0.075`
- `GOOEY_SOFTNESS_UV`: `0.09` → `0.04`
- `GOOEY_NOISE`: `0.035` → `0.02`

Keep parallax + scramble + color lift unchanged.

## Verify

Playwright screenshot at hover: expect the bright cream cluster to be ~100px across, tight, not spanning half the hands.
