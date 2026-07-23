## Goal
Match the reference site's second-screen behavior: when the slogan pins to the viewport center, the word-by-word color/blur reveal is still in progress and continues as the user keeps scrolling. Currently the reveal finishes while the section is still sliding in, so by the time it's centered everything is already white.

## Change (only `src/components/SloganSection.tsx`)

1. **Make the section a tall scroll track with a sticky stage**
   - Outer `<section>`: `height: 260vh` (tunable), `position: relative`, keep `zIndex: 10` and `background: #000`.
   - Inner wrapper: `position: sticky; top: 0; height: 100vh`, centers the slogan (flex center). This pins the text once it reaches the top of the viewport.

2. **Rewrite the progress mapping to be scroll-length driven**
   - Compute progress from the section's own scroll track, not from viewport entry:
     - `const rect = section.getBoundingClientRect();`
     - `const scrolled = -rect.top;` (0 when the tall section's top hits the viewport top)
     - `const travel = section.offsetHeight - window.innerHeight;`
     - `progress = clamp(scrolled / travel, 0, 1)`
   - This means: the slogan pins as soon as `scrolled >= 0`, and the words keep revealing across the remaining ~160vh of scroll — matching the reference where text is still lighting up while pinned.

3. **Slow down the per-word reveal window**
   - Keep the current `smoothstep` reveal but widen the overlap so the last word finishes near `progress ≈ 1` rather than early. Use `span = 1 / (total + 2)` and `overlap = span * 2.2` so words continue transitioning through most of the pinned scroll.

4. **Leave everything else untouched**
   - No changes to `src/routes/index.tsx`, parallax, nav, dock, hero, glitch overlay, colors, typography, or word list.
   - Reduced-motion branch unchanged (immediate `progress = 1`).

## Technical notes
- The fixed hero layer in `index.tsx` already uses `translate3d(0, -scrollY * 0.35, 0)`, so it continues its parallax underneath the taller sticky section — no coordination change needed.
- `FinChatDock` stays outside the parallax layer and remains pinned.
- Section height (`260vh`) is the single knob controlling how long the reveal lasts while pinned; can be tuned after visual check.