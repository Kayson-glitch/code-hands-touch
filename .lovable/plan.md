# Push chiaroscuro contrast harder

Boost the dark-to-bright separation so shadows read as deep negative space and highlights punch out — closer to the reference site's dramatic Michelangelo lighting.

## Steps (single file: `src/components/AsciiHandsFooter.tsx`)

1. **Tighter percentile stretch**
   - Change stretch window from 2nd/98th → **8th/92nd** percentiles. Anything darker than the 8th percentile clamps to pure shadow; anything brighter than the 92nd clamps to full highlight. Bigger dynamic range → stronger contrast.

2. **S-curve remap, not just gamma**
   - Replace the `pow(x, 0.85)` gamma lift with an S-curve: `smoothstep`-style `3x² - 2x³` applied after the stretch. This crushes lower midtones toward black and pulls upper midtones toward highlight — the exact "contrasty" look the reference has.

3. **Two-tier drop below threshold**
   - Raise the visibility threshold from `0.04` → `0.07` on raw luma so faint gray background pixels stop rendering as sparse dots (they currently create a low-level noise haze around the hands that flattens contrast).

4. **Widen color range**
   - Shadow floor darker: `rgb(50,14,10)` (was 90,26,18).
   - Highlight ceiling brighter and warmer-white: `rgb(255,210,190)` (was 255,176,160).
   - Alpha range widens: `0.45 + bb * 0.55` (was 0.75 + 0.25) so shadow glyphs recede while highlight glyphs pop.

5. **Ramp weight redistribution**
   - Front-load the ramp with more light-weight glyphs (spaces, dots, backticks) so the shadow half naturally has more visual "emptiness." New ramp:
     ` `  ` `  ` `  `.`  `.`  `,`  `'`  `:`  `;`  `!`  `i`  `|`  `/`  `\`  `+`  `=`  `t`  `c`  `v`  `n`  `x`  `z`  `u`  `o`  `a`  `s`  `w`  `m`  `k`  `h`  `b`  `d`  `p`  `g`  `#`  `%`  `8`  `&`  `@`  `M`  `W`  `N`  `Q`  `$`  `B`
     Three leading spaces mean the darkest ~7% of visible cells render nothing at all — real negative space where the hand shadow deepens.

## Out of scope

Cursor interaction physics, layout, copy, background, and image asset stay as-is. No new dependencies.
