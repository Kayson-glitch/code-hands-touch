Plan: Enhance the tonal contrast and sculptural depth of the `hands-pair.png` source image used by the ASCII footer, so the mechanical arms read as more three-dimensional when sampled into glyphs.

What to change:
- Take the current `hands-pair.png` image asset referenced by `src/assets/hands-pair.png.asset.json`.
- Apply a contrast/depth edit: deepen shadows, lift highlights, slightly exaggerate the light-to-dark gradient on the metal surfaces to increase perceived volume and form. Keep the transparent background and subject framing unchanged.
- Replace the asset with the enhanced version (updating `src/assets/hands-pair.png.asset.json` to point to the new image), leaving all component code and ASCII parameters untouched.

Verification:
- Run the build to ensure the asset reference remains valid.
- Confirm in the preview that the ASCII footer now shows stronger light/dark separation and more dimensional arm forms.

No other changes to `AsciiHandsFooter.tsx`, the ramp, gamma, sampling, or layout.