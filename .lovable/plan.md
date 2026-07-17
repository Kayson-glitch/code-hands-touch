## Problem
PrismaticBurst is currently mounted as a fixed overlay on top of the hands with `mix-blend-mode: lighten`. The burst is bright enough that it washes out the ASCII hands. User wants the burst as a true background **behind** the hands.

## Fix

1. **Move PrismaticBurst behind the hands**
   - In `src/routes/index.tsx`, drop `z-10` and the `mix-blend-mode` on the burst layer.
   - Render the burst as `fixed inset-0 -z-10 pointer-events-none` (or `z-0`), and give the `<AsciiHandsFooter />` wrapper `relative z-10` so hands sit above the burst.

2. **Make the hands canvas background transparent**
   - `AsciiHandsFooter.tsx` currently sets inline `style={{ backgroundColor: "#0a0a0a", ... }}` on its root, which hides anything behind it. Change that to `backgroundColor: "transparent"` (keep height/minHeight untouched). This is the minimal change needed so the burst is visible underneath.
   - Also set the page/body backdrop to a dark fallback via a wrapper `bg-[#0a0a0a]` on the outer div in `index.tsx`, so when the burst is dim there's still a dark canvas (matches current look).

3. **Verify**
   - `bun run build` passes.
   - Playwright screenshot: ASCII hands clearly visible, prismatic burst glowing behind them, hover parallax still works.

## Files touched
- `src/routes/index.tsx` — reorder z-index, remove blend mode, add dark bg wrapper.
- `src/components/AsciiHandsFooter.tsx` — one-line change: `backgroundColor: "#0a0a0a"` → `"transparent"`.
