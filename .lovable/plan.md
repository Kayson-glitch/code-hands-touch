# Match source site font + character composition

Findings from `good-fella.com`:
- Root class `geistmono_..._variable` → the entire site (including the ASCII footer canvas) uses **Geist Mono**.
- Theme is `data-theme="dark"`, brand color is a vivid brand orange (~`#F94B14`), applied at varying opacities (e.g. `bg-brand/10`).
- The ASCII grid uses a monochrome brand-orange palette; brightness is encoded by glyph density alone (a classic ramp), not by hue shifts toward white. Glyphs are ASCII symbols/digits — no letters like `M/N/Q/W/B` — so the hand reads as an abstract stipple, not typography.

Changes (single file: `src/components/AsciiHandsFooter.tsx`, plus a Google Fonts link in `src/routes/__root.tsx`):

## 1. Add Geist Mono
- In `src/routes/__root.tsx`, add a Google Fonts `<link>` for `Geist Mono` weights 400 and 500 (preconnect + stylesheet).
- Update the canvas font stack to `'Geist Mono', ui-monospace, 'JetBrains Mono', 'Menlo', monospace`.
- Also apply Geist Mono to the wordmark and to the © copy block so the whole footer matches the source's monospace treatment.

## 2. Rewrite the ramp to symbols/digits only
- Replace current ramp
  `"   ..,':;!li|/\\+=tcvnxzuoaswmkhbdpg#%8&@MWNQ$B"`
  with a symbol-and-digit ramp ordered dark→bright:
  `"   .·,':;-~+=<>()[]?*!/\\|1lI7itcv3zosx#%$&8@"`
  (kept ASCII, no letter shapes that read as typography).
- Bump `RAMP_LEN` accordingly.

## 3. Edge glyph subsets → symbol-only
- Horizontal (dir 0): `"-_=~"` → keep
- Anti-diag  (dir 1): `"\\`,%"` → `"\\`,%"` (unchanged, all symbols)
- Vertical   (dir 2): `"|!Il1"` → `"|!1["` (drop letters `Il`)
- Diagonal   (dir 3): `"/;j7"` → `"/;7)"` (drop letter `j`)

## 4. Single-hue color model
- Base brand: `#F94B14` (r=249, g=75, b=20). Drop the shadow→highlight RGB ramp; render every visible cell in brand orange and let alpha alone carry brightness.
- Alpha: `alpha = 0.35 + b * 0.65` (was `0.45 + 0.55 * b`) — wider low end so shadows recede more.
- Rim highlight for `edge > 0.5 && b > 0.55`: keep the warm-white mix at `t=0.35` toward `#ffe4d4`; the source has faint brighter accents on the very brightest edges, so keep this but slightly reduced.
- Cursor light: additive lift stays but tuned to a pale brand tint — push toward `(255, 205, 170)` instead of pure white so the interaction color still reads brand-orange.

## 5. Cell metrics
- Keep `CELL_W=7`, `CELL_H=9`. Font size stays at `CELL_H`px; Geist Mono at that size renders a hair narrower than JetBrains Mono so the grid packs a touch tighter — no metric change needed.

No new dependencies. No API/animation logic changes beyond the swaps above.
