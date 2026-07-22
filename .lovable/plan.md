# Top Aurora Gradient (Hugo.ai style)

Replicate the soft top-edge aurora from hugo.ai: a wide horizontal arc of blue → purple → magenta → red bleeding down from the top of the viewport on the black background, slowly breathing/drifting. It sits behind the hero UI (nav, title, hands) and above the plain black background.

## Scope

Only add one new visual layer. Do not touch nav, hero copy, hands canvas, intro video, burst, or any existing animation timing.

## Where it goes

- New component `src/components/TopAuroraGradient.tsx`.
- Mounted in `src/routes/index.tsx` inside the post-intro block (the `videoSrc !== null && shown` branch), rendered as the first child of that wrapper so it sits under `AsciiHandsFooter`, `SiteNav`, `HeroCopy`, `FinChatDock`.
- Fades in with the same `shown` opacity transition already applied to that wrapper — no extra timing logic.

## Visual spec

- Fixed layer: `position: fixed; inset: 0 0 auto 0; height: ~62vh; pointer-events: none; z-index: 5` (above black bg, below hands canvas / nav / hero which use higher z-indices).
- Two stacked radial gradients composited with `mix-blend-mode: screen` on a transparent element so it glows on black without washing it out:
  - Left lobe: cool blue → indigo (#1E63FF → #4B3AFF, ~0% opacity edges).
  - Right lobe: magenta → red (#D018FF → #FF1245).
  - Center overlap produces the purple-pink blend seen in the reference.
- Bottom edge masked to transparent via `mask-image: linear-gradient(to bottom, black 0%, black 55%, transparent 100%)` so it fades softly into the black hero background — never a hard line.
- Slight top vignette so the very top edge is a touch darker (matches reference).

## Motion

- One keyframes rule `aurora-drift` added to `src/styles.css`: slow 18–22s ease-in-out infinite loop animating `background-position` and `background-size` of each lobe (double-channel breathing, matching the approach already used for `synergy-gradient-flow`).
- Two lobes animate slightly out of phase (different durations / delays) so the shape morphs organically instead of sliding uniformly.
- Respect `prefers-reduced-motion`: disable the animation, keep the static gradient.

## Non-goals

- No changes to colors, typography, layout, nav, hero copy, hands, intro video, burst, scroll hint, or z-index of existing elements.
- No new assets, no canvas/WebGL — pure CSS.

## Technical notes

- Colors are hardcoded brand gradient stops (consistent with existing `HeroCopy` inline gradient); not adding design tokens.
- Keep it under the `GlitchGrainOverlay` scanlines (which sit at z-index 60) so scanlines still read on top of the aurora.
- Verify no visual overlap issue with the intro burst (aurora is only mounted after `shown === true`, i.e. after burst completes, so no interaction).
