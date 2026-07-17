# Use uploaded hands image as ASCII source

Replace the two generated hand silhouettes with the user's uploaded image (human hand on the left, robot hand on the right, reaching toward each other — a Creation of Adam homage).

## Steps

1. **Prepare the source image**
   - Take `user-uploads://kling_20260715_作品_将图片中的手腕和手指_3228_1.png` (white background, two hands).
   - Use `imagegen--edit_image` to remove the white background and re-composite onto a solid pure-black background as a grayscale chiaroscuro image (same brightness data model the current sampler already expects). Save to `/tmp/hands-pair.png` at 1920×1080.
   - Upload via `lovable-assets` → `src/assets/hands-pair.png.asset.json`.

2. **Simplify the component to sample one image**
   - `src/components/AsciiHandsFooter.tsx`: drop the two-image (god + adam) sampling; load the single pair image and sample it once across the full canvas width. The composition (left hand, gap, right hand) is baked into the image, so we no longer place two rects — one rect covering the whole hand band is enough.
   - Delete `hand-god.png.asset.json` and `hand-adam.png.asset.json` from `src/assets/` after the swap (via `lovable-assets delete`).
   - Keep everything else — brightness ramp, coral color mapping, cursor light + push, ambient shimmer, reduced-motion respect.

3. **Layout tweak**
   - The reference has the hands nearly touching at center with the copy block sitting just below/behind the meeting point. Adjust the band height so the fingertips frame the © text without overlapping.

No other files change. No new dependencies.

## Out of scope

Redesigning the page, changing text, or adjusting cursor behavior beyond what the new composition needs.
