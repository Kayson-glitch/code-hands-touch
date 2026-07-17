## Goal
Add the reactbits.dev **PrismaticBurst** animated WebGL background to the home page (`/`), rendered behind the existing ASCII hands. No UI/demo controls from the source site — just the raw background component with sensible defaults.

## Steps

1. **Install dependency**
   - `bun add ogl` (the component uses `ogl` for WebGL rendering).

2. **Add the component file**
   - Create `src/components/PrismaticBurst.tsx`, copied verbatim from the TS-Tailwind version at
     `https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/ts-tailwind/Backgrounds/PrismaticBurst/PrismaticBurst.tsx`
     (≈460 lines, self-contained; only external dep is `ogl`).
   - No CSS file needed (TW variant uses inline classes).

3. **Mount it behind the hands** in `src/routes/index.tsx`
   - Wrap `<AsciiHandsFooter />` in a relatively-positioned container.
   - Place `<PrismaticBurst />` as an absolutely-positioned fixed/inset-0 layer with `z-index: 0` and `pointer-events-none`, so mouse parallax on the ASCII layer still works.
   - Give the ASCII layer `position: relative; z-index: 1` and let its background stay transparent (or slightly transparent) so the burst shows through. If `AsciiHandsFooter` paints an opaque background, override with a wrapper style; do not modify the component's internals.

4. **Defaults** (pass as props to keep it subtle behind the hands)
   - `intensity={2}`, `speed={0.5}`, `distort={1}`, `paused={false}`, `colors` left to component defaults, `mixBlendMode='lighten'` if it looks better — final values tuned once mounted.

5. **Verify**
   - `bun run build` passes.
   - Playwright screenshot of `/` confirms the burst is visible behind the ASCII hands and the hover parallax still responds.

## Technical notes
- `ogl` is a small pure-JS WebGL lib, browser-only. The component uses `useRef`/`useEffect`, so it's already client-only — safe under TanStack Start SSR (effect runs after hydration; the ref div renders empty on the server).
- No changes to `AsciiHandsFooter.tsx`, styles.css, or the root route.
- Files touched: `package.json` (via bun add), new `src/components/PrismaticBurst.tsx`, `src/routes/index.tsx`.
