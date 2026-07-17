Plan: Re-edit the `hands-pair.png` source image to lift the overall brightness while keeping the stronger light-dark contrast and three-dimensional modeling.

What to change:
- Take the current `hands-pair.png` image asset.
- Apply a brightening edit: lift the mid-tones and shadow areas, brighten the human arm and the darker parts of the robot arm, so the overall composition reads lighter. Keep the highlights, metallic specular accents, and the transparent background unchanged.
- The goal is to keep the enhanced 3D volume from the previous edit but avoid the image becoming too dark overall.
- Replace the asset with the brightened version (updating `src/assets/hands-pair.png.asset.json`), leaving all component code and ASCII parameters untouched.

Verification:
- Run the build to ensure the asset reference remains valid.
- Confirm in the preview that the ASCII footer reads brighter overall while still showing clear light/dark separation and dimensional form.

No other changes to `AsciiHandsFooter.tsx`, the ramp, gamma, sampling, or layout.