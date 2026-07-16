# Fix: Real Chiaroscuro Shading on the ASCII Hands

## What's wrong now

The current implementation samples a **flat white silhouette** and renders every "on" cell as a uniform coral glyph. Result: two solid red blobs with no volume. The reference is doing the opposite — glyphs vary in brightness across the hand, so the eye reads muscle, tendon, and finger volume. It's classic ASCII-art chiaroscuro.

Two root causes:

1. The source silhouettes I generated are pure white on black — no grayscale, no shading information to sample.
2. The renderer uses a hard threshold (`b > 0.35 → same alpha`) and picks glyphs randomly instead of by brightness.

## Fix

### 1. Regenerate the hand images with real chiaroscuro
Replace `hand-god.png` and `hand-adam.png` with grayscale renderings styled after Michelangelo's *Creation of Adam* — bright highlights on knuckles/index-finger ridge/forearm top, deep shadows in the palm/underside, soft midtones on skin planes. Solid black background. No color, just a full 0–255 luminance range. This is the actual data source for the shading.

### 2. Rewrite the sampler + renderer to be brightness-driven
- **Sampling**: keep the grid, but store the raw luminance `b ∈ [0,1]` per cell. Lower inclusion threshold to ~0.08 so shadow areas still get glyphs (just dim ones).
- **Glyph ramp**: pick the glyph by brightness from a density ramp — dim cells get sparse marks (`.`, `` ` ``, `,`, `:`, `;`, `'`), midtones get medium glyphs (`/`, `\`, `|`, `<`, `>`, `?`, `+`, `t`, `r`, `x`, `z`), bright cells get dense glyphs (`Y`, `X`, `Z`, `0`, `8`, `#`, `@`, `%`, `&`). Each cell keeps a *seed* and a *set index* driven by its brightness; the shimmer reroll stays within the same density bucket so it never brightens a shadow.
- **Color/alpha per cell**: alpha ramps `0.15 → 1.0` with brightness; hue stays coral (`~#ff5a4a`) but shadow cells desaturate slightly toward `#7a1f1a`, highlights push toward warm off-white. This produces the visible volume in the reference.

### 3. Cursor interaction stays, tuned to shading
- Same radial influence, but the brightening now *stacks on top of* the base luminance instead of overwriting it, so cursor light reads like a physical highlight moving across the hand — not a flat white patch.
- Densification near the cursor jumps the cell one bucket up the ramp (not straight to `#`), preserving texture.
- Push amplitude reduced from 14px to ~8px so the shading isn't shredded.

### 4. Minor cleanup
- Reduce cell size to 7×10 for finer detail (the reference is dense).
- Tighten the horizontal placement so both hands reach toward the center, leaving the copy block between the fingertips (currently the hands extend too far and overlap the text).

## Files touched

- Regenerate `/tmp/hand-god.png`, `/tmp/hand-adam.png` with new prompt, re-upload via `lovable-assets` (delete old pointers via CLI, write new ones).
- `src/components/AsciiHandsFooter.tsx` — new glyph ramp, brightness-indexed rendering, tuned cursor logic, smaller cells, tighter layout.

No new dependencies. No changes to routing or metadata.

## Out of scope

Adding page chrome, animations elsewhere on the site, or migrating the effect to WebGL. This is a targeted quality fix on the existing footer effect.
