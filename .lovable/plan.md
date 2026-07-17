Plan: Reduce the ASCII footer glyph size from 9 px to 8 px to see if it improves the rendering.

What to change:
- Change the `FONT_PX` constant in `src/components/AsciiHandsFooter.tsx` from `9` to `8`.
- The `CELL_W` and `CELL_H` remain at 10 CSS px, so the glyphs will sit in the same grid but render slightly smaller, giving each character a bit more breathing room.

Verification:
- Run the build to ensure no errors after the constant change.
- Confirm in the preview that the ASCII arms still form a recognizable silhouette and the smaller glyph size looks acceptable.

No other changes to the image asset, ramp, gamma, colors, layout, or cursor interaction.