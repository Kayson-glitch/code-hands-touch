## Plan

**1. `src/components/ScrollHint.tsx`** — visual tweaks only
- Move up 20px: `bottom: 40` → `bottom: 60`.
- Recolor to black: outer container color `rgba(0,0,0,0.82)`, label `rgba(0,0,0,0.72)`, bottom gradient from `rgba(0,0,0,0.45)` to transparent. SVG uses `currentColor` so it follows automatically.

**2. `src/components/IntroVideo.tsx`** — decouple burst from scroll (temporary, auto-play)
- Cap wheel-driven `targetProgress` at `VIDEO_FRACTION` (0.6) so scrolling can only reach the end of the video segment.
- Add an auto-burst driver that starts the first frame `videoProgress >= 1`:
  - Record `burnStartTs` on entry.
  - Each frame compute `burstProgress = clamp01((now - burnStartTs) / BURN_AUTO_MS)` with `BURN_AUTO_MS = 3600`.
  - Feed into `uniforms.uBurn`, and synthesize `progress = VIDEO_FRACTION + burstProgress * (1 - VIDEO_FRACTION)` for `uProgress`, `uTime`, and parent `onProgress` so nav-hide / hero fade-in still trigger.
  - Fire `onEnded` when `burstProgress >= 1`.
- Video seek/playback, smoothing, shader math, chroma/glitch — all unchanged.
- Debug panel: `onJumpToBurst` seeds `targetProgress = VIDEO_FRACTION` to kick auto-burst; `onFinish` still fires directly.

**Not changed:** shader, hero UI, nav, preloader, wheel→video mapping within the video segment.