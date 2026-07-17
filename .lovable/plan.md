# Shrink reveal disc again — very subtle

Reference shows the bright cluster is only ~40–60px across (roughly 4–6 glyph cells) with soft falloff. Current 0.075 UV radius is still too large on a 1440-wide canvas.

## Changes (`src/components/AsciiHandsFooter.tsx`)

- `GOOEY_RADIUS_UV`: `0.075` → `0.035`
- `GOOEY_SOFTNESS_UV`: `0.04` → `0.025`
- `GOOEY_NOISE`: `0.02` → `0.012`

Everything else unchanged.
