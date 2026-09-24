---
name: ascii-image-footer
description: Recreate the interactive ASCII "Creation of Adam" style hero — a full-viewport canvas that renders a user-supplied image as animated ASCII glyphs with cursor parallax, per-glyph tilt, and a gooey reveal disc. Trigger when the user asks for an ASCII image effect, ASCII portrait, ASCII hands, "the same ASCII effect as before", or "just swap the image".
---

# ASCII Image Footer / Hero

Locked, pre-tuned implementation of the ASCII image effect. Replacing the source image is the only step needed to reskin it; the component and every tuning constant stay untouched by default.

## Preflight

1. Project must be TanStack Start (has `src/routes/` and `src/components/`). If not, stop and tell the user.
2. Get the source image. Prefer a file the user just uploaded under `/mnt/user-uploads/`. If none is present and the user hasn't provided one, ask for an image before continuing.

## Steps

Run these in order. Batch independent file writes in parallel.

1. **Drop the image into `public/`** — keep the filename fixed so the component never changes:
   ```bash
   mkdir -p public/media && cp <source-image-path> public/media/hands-pair.png
   ```
2. **Install the component** — copy `assets/AsciiHandsFooter.tsx` from this skill verbatim to `src/components/AsciiHandsFooter.tsx`. Do not modify any constants.
3. **Wire the route** — write `references/route-template.tsx.txt` to `src/routes/index.tsx`. Replace `{{TITLE}}` and `{{DESCRIPTION}}` with project-appropriate copy; if the user gave none, use the neutral fallbacks in the template comments. Do not add `og:image` here (leaf-route rule: only set og:image when there is a real meaningful image URL; the hand image is decorative, so omit it and let hosting supply a preview).
4. **Verify** — run `bun run build`. If it fails, fix the failure in the same turn before finishing.
5. **Report** — one short sentence to the user: image swapped, effect reproduced, tuning unchanged.

## Do not touch (unless the user explicitly asks)

The constants at the top of `AsciiHandsFooter.tsx` are locked defaults from prior tuning rounds. See `references/tuning-notes.md` for the exact current values and the only-touch-on-request rule. If the user asks for "stronger / weaker / faster", edit the relevant constant, then update `references/tuning-notes.md` in the same turn so the next reproduction inherits the new default.

## Contract with the component

The component talks to the outside world through exactly one path:

```ts
const handsPairAsset = { url: "/media/hands-pair.png" };
```

Therefore: replacing that file under `public/media/` swaps the visual; nothing else needs to change.
