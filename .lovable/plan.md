## Goal
Hide the nav during the brief all-black handoff between the burst finishing and the ASCII hands / hero copy fading in, so it doesn't sit alone on the black screen.

## Changes

### `src/components/AsciiHandsFooter.tsx`
- Add a `navHidden` state (default `false`).
- When `handleIntroEnded` fires (burst complete → switching to hands): set `navHidden = true` immediately, then schedule `setNavHidden(false)` at ~850ms so it re-appears in sync with `HeroCopy` / `FinChatDock`.
- Broadcast this via a `CustomEvent("app-nav-visibility", { detail: hidden|visible })` on the window, mirroring the existing `app-bg-change` pattern.

### `src/components/SiteNav.tsx`
- Subscribe to `app-nav-visibility` and hold a `hidden` state.
- Apply `opacity: hidden ? 0 : 1`, `pointerEvents: hidden ? "none" : "auto"`, and a short `opacity 260ms ease-out` transition on the nav root. No layout or color logic changes.

## Not changed
- Nav during preloader / intro video playback / after hands are shown — behavior stays as today.
- Burst timing, video, hero copy, chat dock — unchanged.