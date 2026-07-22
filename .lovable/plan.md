Update the two hero buttons to match the exact radii, heights, font sizes, and horizontal padding requested.

Changes
- `src/components/SiteNav.tsx`
  - CTA "Book a Demo" button: `border-radius: 8px`, `height: 32px`, `font-size: 14px`, horizontal padding `14px`.
  - Keep text, colors, and hover behavior unchanged.
- `src/components/HeroCopy.tsx`
  - Hero "Book a Demo" button: `border-radius: 10px`, `height: 40px`, `font-size: 24px`, horizontal padding `24px`.
  - Keep background, text color, and hover behavior unchanged.

Verify
- Build/type-check passes.
- Preview shows the updated button sizes without affecting other layout.