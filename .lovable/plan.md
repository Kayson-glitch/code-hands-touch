# Shrink reveal disc + add subtle parallax on hover

## Diagnosis

1. **Reveal area is too large.** Current uniforms `GOOEY_RADIUS_UV=0.32`, `SOFTNESS=0.18` produce a disc ~500px across on a 1440-wide canvas. Source site's reveal is closer to a ~220–260px cluster.
2. **Missing parallax.** On the source site, moving the cursor over the ASCII art causes the entire hands silhouette to drift slightly toward/away from the cursor (a soft 2D parallax offset, a few pixels). Ours is static.

## Changes (single file: `src/components/AsciiHandsFooter.tsx`)

### 1. Shrink the disc
- `GOOEY_RADIUS_UV`: `0.32` → `0.18`
- `GOOEY_SOFTNESS_UV`: `0.18` → `0.09`
- `GOOEY_NOISE`: `0.06` → `0.035`

This yields a ~240px reveal core with a soft, wobble-edged halo — matches the reference crop scale.

### 2. Add subtle cursor-driven parallax
- Track a smoothed cursor position `parallax = {x, y}` that eases toward the actual cursor each frame (lerp factor ~0.08 for a soft trail).
- Compute offset relative to canvas center, scaled small:
  ```
  const px = (parallax.x - w/2) / w;   // -0.5..0.5
  const py = (parallax.y - h/2) / h;
  const PARALLAX_MAX = 8; // CSS px
  const offX = -px * PARALLAX_MAX * intensity;
  const offY = -py * PARALLAX_MAX * intensity;
  ```
- Apply as a whole-scene translation when drawing cells: `ctx.fillText(ch, c.x + offX, c.y + FONT_PX + offY)`.
- Cursor-UV for the gooey disc uses the raw (un-offset) cursor position so the disc stays under the actual pointer, while the ASCII drifts. This matches the source's feel: the picture responds, the reveal stays anchored to the finger.
- Scaled by `intensity` so it eases in/out with hover (no jump on enter/leave).
- Disabled under `prefersReduce`.

### 3. Verify
- Playwright: move cursor to (720, 400), capture crop. Expect: tight bright cluster ~240px across; whole silhouette shifted a few px opposite the cursor direction; return to rest position ~250ms after leave.
