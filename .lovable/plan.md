## Plan

**1. `src/components/IntroVideo.tsx` — faster, immediate burn**
- `BURN_AUTO_MS` 3600 → 1800.
- Shader: `appear = smoothstep(0.0, 0.10, b)` → `smoothstep(0.0, 0.02, b)` so the edge is visible immediately.
- Video-end trigger unchanged (fires the frame `videoProgress >= 1`).

**2. Shader shape — more irregular ellipse**
- Ellipse ratio: `pe = vec2(p.x, p.y * 1.75)` → `p.y * 2.15`.
- Stronger horizontal lobe bias in `wob`: `+ 0.05 * cos(ang * 2.0)` → `+ 0.09 * cos(ang * 2.0) + 0.04 * cos(ang * 4.0 + 1.1)`.
- Bump `DEFAULT_BURN_PARAMS` in `src/components/BurnDebugPanel.tsx`:
  - `warpAmp` 0.62 → 0.78
  - `warpFreq` 1.15 → 1.05
  - `streakAmp` 0.40 → 0.52
  - `streakFreq` 2.4 → 2.7
  - `angularAmp` 1.4 → 1.7

**Not changed:** scroll→video mapping, glitch/chroma layers, halo layers, colors, hero UI.