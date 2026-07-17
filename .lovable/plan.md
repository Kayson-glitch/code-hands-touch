Plan: Adjust the ASCII rendering parameters in `src/components/AsciiHandsFooter.tsx` so the final footer reads brighter overall, while keeping the enhanced light-dark contrast and three-dimensional form.

What to change:
- Reduce the `gamma` value from `1.15` to around `0.92` in the `sampleImage` function. This lifts the midtones toward the brighter glyph end of the ramp without changing the image asset or the density ramp itself.
- The result: darker cells stay sparse (shadows), midtones become brighter, and highlights remain bright — the overall composition becomes lighter while preserving the 3D volume.

Verification:
- Run the build to ensure no TypeScript errors after the change.
- Confirm in the preview that the ASCII arms are visibly brighter overall and the human arm is no longer lost in the dark background.

No other changes to the image asset, the glyph ramp, colors, layout, or cursor interaction.