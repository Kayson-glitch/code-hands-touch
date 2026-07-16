# ASCII Hands Footer (Creation of Adam)

Rebuild the effect from good-fella.com's footer: two hands from Michelangelo's *Creation of Adam* rendered entirely out of ASCII glyphs, sitting on a near-black background with copyright text centered between the fingertips and a huge faded "Good/Fella" wordmark ghosted behind. Includes the live interaction.

## Visual anatomy

```text
┌──────────────────────────────────────────────────────────────┐
│  ▓ascii hand▓                                 ▓ascii hand▓   │
│   (God, left,          © 2026                 (Adam, right,  │
│    reaching   Good Fella Studio GmbH.          reaching      │
│    right)    Let the Fellas handle it.         left)         │
│                                                              │
│           G o o d / F e l l a  (huge, ~15% opacity)          │
└──────────────────────────────────────────────────────────────┘
```

- Background: near-black (`#0a0a0a`).
- Glyphs: warm red/coral (`#ff5a4a` range), mono font, small size (~10–12px), letter/line tight.
- Character set: mix of `{}[]()/\|<>?+-~;:,._YZXCVUJKLMNOP0123456789` etc. (matches reference).
- Text block in the exact copy from the reference, centered vertically & horizontally.
- Wordmark "Good/Fella" as a bottom-anchored, oversized, low-opacity SVG/text; clipped so only the top ~40% peeks above the fold.

## Interaction (matches reference)

- **Ambient**: each glyph very slowly re-randomizes (~1 in 200 per frame) so the hands "shimmer".
- **Cursor field**: within a radius (~120px) of the mouse, glyphs
  1. brighten toward white,
  2. get replaced with denser glyphs (`#`, `@`, `%`, `▓`),
  3. get a small radial push outward (parallax offset that eases back).
- **Idle drift**: subtle 1–2px per-glyph offset driven by low-freq noise so the hands feel alive without the mouse.
- **Touch**: same field, following `touchmove`.
- Uses `requestAnimationFrame` on a `<canvas>` (not DOM nodes per glyph — too many).

## How the hands are formed

1. Generate two silhouette source images with `imagegen--generate_image`:
   - `hand-god.png` — Michelangelo's God hand, right hand pointing right with index finger extended, pure white silhouette on solid black, no wrist details beyond forearm fade. 1024×640.
   - `hand-adam.png` — Adam's left hand, limp index finger reaching left. 1024×640.
   Save under `src/assets/` and import as pointer JSON.
2. On mount, draw each image to an offscreen canvas, sample pixels on a grid matching the glyph cell size, and produce an array of `{ x, y, brightness }` cells where brightness > threshold.
3. Each cell gets a random glyph from the character set; render all cells to the visible canvas each frame. Left image aligned to left edge, right image mirrored/aligned to right edge.
4. Wordmark is a separate absolutely-positioned `<div>` with the display text at ~18rem, `color-mix` faded, non-interactive.

## Files

- `src/components/AsciiHandsFooter.tsx` — canvas component, mouse/touch handlers, RAF loop, image sampling.
- `src/components/AsciiHandsFooter.helpers.ts` — glyph set, sampling util, noise helper (small, dependency-free).
- `src/assets/hand-god.png.asset.json`, `src/assets/hand-adam.png.asset.json` — generated silhouette pointers.
- `src/routes/index.tsx` — replace placeholder with a full-viewport section that renders `<AsciiHandsFooter />` (the effect *is* the page for now, mirroring the reference's landing state). Update `head()` with real title/description.
- `src/routes/__root.tsx` — swap default "Lovable App" title/description for project-specific metadata.

No new dependencies; pure canvas + React.

## Technical notes

- Canvas is `devicePixelRatio`-aware; resize observer re-samples on width change (debounced).
- Sampling runs once per image load + on resize, not per frame — per frame only redraws glyphs.
- Cell size ~9×12px → roughly 12–18k active glyphs across both hands on a 1920 viewport; well within canvas budget.
- Respects `prefers-reduced-motion`: disables shimmer + cursor displacement, keeps static render.
- SEO: single H1 is visually hidden ("Good Fella Studio"), decorative canvas has `aria-hidden`.

## Out of scope

- The rest of the good-fella.com site (nav, projects, etc.). Only the footer hands effect + surrounding copy/wordmark, as requested.
