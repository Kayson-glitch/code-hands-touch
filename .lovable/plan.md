
## Problem

Making the base a flat `rgb(250,75,22)` killed the light/shadow gradient. The previous coral shadow→highlight ramp was doing the tonal work; glyph density alone isn't enough to read as 3D form.

## Fix

Keep the "site orange" identity, but bring back a proper shadow→highlight ramp in the orange hue, driven by `c.b` (the normalized luminance we already compute). Only the base color changes — hover reveal logic stays as-is.

## Change (single file: `src/components/AsciiHandsFooter.tsx`)

Replace the flat orange assignment in the draw loop with a two-stop orange gradient:

- **Shadow** (`b=0`): `rgb(60, 18, 8)` — deep burnt orange, keeps warmth but reads as shadow.
- **Highlight** (`b=1`): `rgb(255, 110, 40)` — bright site orange, slightly hotter than 250/75/22 so the peaks pop.
- Linear interpolate per channel by `c.b`.

That restores the depth we had with the coral palette while staying inside the orange family shown on good-fella.com. Hover still blends this base → the cell's true source-image RGB via smoothstep `k`.

No other changes.

## Verify

- Screenshot with cursor off-canvas: arms show clear light/shadow modeling in orange (dark burnt-orange in shadow, bright orange on highlights).
- Screenshot with cursor over the arm: soft colorful reveal circle, base tonality preserved outside it.
