# Fix hover reveal — match source density & brightness

## Diagnosis

Comparing the current hover screenshot with the reference images:
- Reference: inside the disc, glyphs are **dense and bright cream** — even cells that are dark at rest surface as legible characters.
- Current: cells barely change. Only cells with high base luminance shift slightly warmer; dark silhouette cells stay near-black.

Two things are missing from the port:

1. **No ramp-index lift inside the disc.** The source's `sharpBlend` doesn't just recolor — the scrambled index is added to `c.idx`, and combined with the color lift, dark cells surface as visible glyphs. Our scramble multiplies by `bb` (luminance), so dark cells barely scramble and stay dark-glyph → invisible on black.
2. **Color mix is too weak.** Base coral (`30,17,22`) at low `bb` mixed 100% toward `240,200,175` should be bright cream, but visually reads as muddy because the underlying glyph is still `.` or `` ` `` (near-empty ramp). Need to also push the ramp index up so a denser glyph is drawn.

## Changes (single file: `src/components/AsciiHandsFooter.tsx`)

Inside the `if (sharp > 0.01)` block:

1. **Lift the ramp index by `sharp`** so dark cells surface with denser glyphs:
   ```
   const lifted = c.idx + sharp * (RAMP_LEN - 1 - c.idx) * 0.85;
   const scrambleOffset = Math.floor(scramble * RAMP_LEN * (0.3 + 0.7 * sharp));
   const finalIdx = (Math.floor(lifted) + scrambleOffset) % RAMP_LEN;
   ch = glyphAt(finalIdx);
   ```
   Remove the `* bb` luminance gate on scramble — the source scrambles all cells inside the disc.

2. **Stronger color lift** — mix toward highlight with an eased factor so even dark base cells hit near-cream inside the core:
   ```
   const colorMix = sharp; // already smoothstep-eased
   r = 30 + bb * 193 + (HR - (30 + bb * 193)) * colorMix;
   // same for g, bl
   ```
   (Current already does this, but combined with the ramp lift the character will now be visible so the color will read.)

3. **Slightly tighter softness core** — `sharpBlend = smoothstep(0, 0.15, gooey)` is correct; keep as-is.

4. Keep radius/softness/noise uniforms unchanged (they match the source).

5. Verify with Playwright: hover at center of hands → capture crop → confirm dense bright cluster on black, with wobbly edge, matching image-3/image-4.

## Out of scope

- No changes to base silhouette sampling, layout, or wordmark.
- No changes to background cells (they stay black — matches source).
