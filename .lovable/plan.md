## Goal
Add an elegant "scroll to explore" hint during the intro video that guides users to scroll, then disappears on first scroll input.

## New component: `src/components/ScrollHint.tsx`
- Fixed, centered near bottom of viewport (`bottom: 40px`).
- Vertical stack, centered:
  - A minimalist SVG mouse outline (~22×34px, 1.25px stroke) containing a small wheel dot that animates downward on loop (~1.6s, ease-in-out, fade at ends) — signals scroll direction.
  - Small text "SCROLL TO EXPLORE" — Montserrat, 11px, letter-spacing 0.22em, uppercase, `rgba(255,255,255,0.72)`.
  - A thin vertical hairline (1px × 18px, `rgba(255,255,255,0.35)`) below text with a subtle downward gradient.
- Entrance: fade + 6px upward slide, 600ms ease-out, delayed 500ms after mount.
- Exit: fade + 6px downward slide, 300ms ease-out; unmount after transition ends.
- Idle micro-motion: whole group breathes ±2px vertically, 3.2s ease-in-out infinite (very subtle).
- `pointer-events: none`, `z-index: 90` (above burst overlay z:60, below handoff black z:120).
- Props: `visible: boolean`.

## Wiring: `src/components/IntroVideo.tsx`
- Track `hasScrolled` state: set `true` on the first wheel/touchmove/keydown(PageDown/ArrowDown/Space) event handled by the existing scroll listener.
- Render `<ScrollHint visible={!hasScrolled} />` inside the intro video host so it lives only during the intro stage and unmounts with the video.

## Not changed
- Video, burst, nav, hero copy, preloader — all unchanged.
- No new dependencies; pure CSS + inline SVG.