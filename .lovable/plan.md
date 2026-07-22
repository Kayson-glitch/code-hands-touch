## Goal
1. Restyle the scroll hint (icon + text + hairline) to black and shift the whole group up by 20px.
2. Temporarily disable wheel-driven burn animation — the intro plays and bursts through automatically once the preloader hands off.

## Changes

### `src/components/ScrollHint.tsx`
- Change `bottom: 40` → `bottom: 60` (up 20px).
- Swap the container `color` and text/hairline colors to black:
  - container `color: "rgba(0,0,0,0.82)"`
  - text `color: "rgba(0,0,0,0.72)"`
  - hairline gradient `rgba(0,0,0,0.45)` → `rgba(0,0,0,0)`.
- SVG uses `currentColor`, so it follows automatically.

### `src/components/IntroVideo.tsx` (auto playback)
- Remove the `window.addEventListener("wheel", onWheel, ...)` binding and its cleanup; also drop the `pendingWheelPx` drain path in the RAF loop (leave the helper but stop feeding it).
- Add an auto driver: on mount (after `firstFrameReady`), start a linear ramp of `targetProgress` from 0 → 1 over a fixed duration:
  - Video segment: ~4.5s to reach `VIDEO_FRACTION` (0.6) — feels like natural playback.
  - Burst segment: ~2.2s from `VIDEO_FRACTION` → 1.
  - Implement as `targetProgress += dt / TOTAL_DURATION` inside the existing RAF loop, where `TOTAL_DURATION ≈ 6.7s`. Everything else (smoothing, video chase, seek logic, burn shader, `fire()`) keeps working unchanged.
- Keep `ScrollHint` mounted for now (still fades out on user scroll/keydown), since the user only asked to disable scroll → burn control, not remove the hint itself.

## Not changed
- Shader, burn shape, glitch layers, nav visibility events, preloader handoff, hero UI.
- ScrollHint dismissal listeners remain (harmless — they no longer drive progress).

## Verification
- Reload preview: after preloader, the video should play through and the burst should complete on its own in ~6–7s, landing on the hero.
- Confirm scroll hint sits 20px higher and reads as black text/icon.
