# Synergy.AI — design system

Everything here is read out of the code, not aspirational. Each entry says
where it lives, so there is one place to change it.

Design baseline is **1440px**. Every size in the site is authored as its 1440
value and made fluid from there — see [Fluid sizing](#fluid-sizing).

---

## Colour

### Tokens

Defined in `src/styles.css` (`:root`), registered in `@theme inline` so they
are also Tailwind utilities (`bg-paper`, `text-ink-muted`, …).

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0E0B22` | All primary type, icons, the CTA face |
| `--ink-muted` | `#7A7885` | Body copy, captions, eyebrow text |
| `--ink-faint` | `#A1A0A9` | Units and signs beside a figure, tertiary labels |
| `--ink-ghost` | `#C7C6CD` | Disabled, placeholder |
| `--hairline` | `#E1E0E4` | Every 1px rule and card border |
| `--surface-soft` | `#F7F7F8` | Card and tile grounds, dropdown hover |
| `--surface-inset` | `#F1F1F3` | Controls that sit *into* the page: the nav's button, the preloader's track, dividers |
| `--paper` | `#FAFAFA` | Page ground |
| `--accent-blue` | `#137DFF` | Reserved accent |

White (`#FFFFFF`) is the raised surface — cards that need to lift off `--paper`.
Black (`#000000`) is the inverted surface: the footer, the slogan screen, the
closing gallery, the Enterprise plan card.

> `#FFFFFF` and `#FAFAFA` are still written as literals in 56 places.
> The values are consistent, so nothing is broken, but they should become
> `var(--paper)` / a `--surface-raised` token when someone is in there.

### On black

| Role | Value |
| --- | --- |
| Primary type | `#FFFFFF` |
| Body | `rgba(255,255,255,0.72)` |
| Muted / module titles | `rgba(255,255,255,0.5)` |
| Rules | `rgba(255,255,255,0.1)` |

Mark an inverted section with `data-dark-section` — the nav watches for it and
flips to its dark variant while that surface is under the bar.

### Brand gradient

`src/components/RainbowButton.tsx` exports both forms:

```
GRADIENT_STOPS = ["#137DFF", "#FF18AA", "#FFCD17", "#137DFF"]
GRADIENT       = linear-gradient(90deg, … 0% / 33.333% / 66.666% / 100%)
```

Used by the nav's 2px top bar, the CTA button's flowing border, the footer rule
and the preloader's fill. It is the only place four-colour gradient appears —
headline gradients use the three-stop blue → violet → pink instead.

### Section accents

One colour per section, from `src/lib/siteMenu.ts` (`dot`). They appear as the
8px square beside an eyebrow and as a card's top edge.

| Section | Colour |
| --- | --- |
| Why Synergy · Impact | `#9E8CFF` violet |
| Why Synergy · Stories | `#D1E486` lime |
| Why Synergy · Technology | `#8CE0FF` sky |
| Why Synergy · Security | `#EBA753` amber |
| Solution · Employee Experience | `#FF9ED8` pink |

---

## Type

Two faces, both in `src/styles.css`:

- **`--font-sans`** — Montserrat. Everything by default.
- **`--font-display`** — Clash Display Variable. Headings and figures, via the
  `.font-display` class. Always weight 400; `font-synthesis-weight: none` stops
  the browser faking other weights.

### Scale

| Role | Size / line-height | Weight | Face |
| --- | --- | --- | --- |
| Hero h1 | `fluid(60, 36)` / 1.1 | 400 | display |
| Module h2 | `fluid(48, 30)` / 1.1667 | 400 | display |
| Article h3 | `fluid(28, 22)` / 1.25 | 400 | display |
| Large figure | `fluid(100, 52)` / 1.2 | 400 | display |
| Card figure | `fluid(32, 26)` / 1.1 | 400 | display |
| Hero lead | 16 / 24 | 400 | sans |
| Body | **14 / 22**, `--ink-muted` | 400 | sans |
| Eyebrow | 14 / 22, uppercase, `--ink-muted` | 400 | sans |
| Label | 14 / 20 | 400–500 | sans |
| Caption | 12 / 18 | 400 | sans |

Body is 14/22 **everywhere**. Individual Figma frames sometimes carry 16 or 18;
the site value wins, because a page that sets its own body size reads as a
different site. Same for figures: they are the display face at 400 even where a
frame specifies Montserrat 500.

A figure's unit or sign is dropped to `--ink-faint` and, in the large sizes,
set smaller than the digits — see `StatValue` in `src/components/WhyFigures.tsx`.

### Fluid sizing

`fluid(px, min)` in `src/lib/fluid.ts`:

```ts
fluid(60, 36) // clamp(36px, 4.1667vw, 60px)
```

The first number is the 1440 design value, the second the floor. Default floor
is 70% of the value. Everything above the floor scales with the viewport and
stops at the design value — nothing grows past its 1440 size.

---

## Layout

- **Column**: `max-w-[1200px]`, centred. 24 places rely on it.
- **Gutter**: `fluid(120, 24)` — 120px at 1440, 24px on a phone.
- **Hero top padding**: `fluid(160, 104)`.
- **Section padding**: `fluid(100, 56)` for a standard block, `fluid(80, 44)`
  for a tighter one.
- **Nav**: 60px bar plus a 2px gradient rule. Content `max-w-[1200px]`.

Breakpoints are Tailwind's defaults; the site only uses three:

| | Width | What changes |
| --- | --- | --- |
| `md` | 768 | Single column becomes two; most layout switches here |
| `lg` | 1024 | The nav's centre menu appears — below this it is the hamburger |
| `xl` | 1280 | A few figure refinements |

---

## Components

Reach for these before writing a new one.

| Component | What it is |
| --- | --- |
| `RainbowButton` | **The** CTA. 36px tall, 14px label, square corners, ink face, brand gradient along the bottom edge. `tone="paper"` on black surfaces. There is no second button style. |
| `CropFrame` | Hairline frame with 6px crop-mark corners and ticks that fade toward the viewport edge. Used by the Platform module and the pricing calculator. |
| `StatsCard` / `StatValue` / `ListBullet` | Shared KPI figures and bullets (`WhyFigures.tsx`). |
| `Reveal` | Scroll-triggered entrance. Defaults: `y=24`, `duration=900`. Pages mostly pass `duration={1600}`. `immediate` skips the observer for above-the-fold content. |
| `ProductHero` / `HeroDots` / `BreakLines` | Product-page hero, its dot field, and hand-set line breaks from `\n`. |
| `GradientHoverHeading` | Hero title that takes the gradient on hover. |
| `SiteNav` / `SiteFooter` / `MobileMenu` | Chrome. `SiteFooter cta={false}` renders the brand footer without the closing CTA screen. |
| `fluid()` | Every size goes through it. |

### Navigation data

`src/lib/siteMenu.ts` is the single source. The header dropdowns, the mobile
menu and the footer columns all read from it — add a page there once, not in
three places. `short` gives a condensed label for the footer, where a dropdown's
full marketing title would wrap.

---

## Motion

| | Value |
| --- | --- |
| Entrance easing | `cubic-bezier(0.22, 1, 0.36, 1)` — 22 uses, the house curve |
| Alternate entrance | `cubic-bezier(0.16, 1, 0.3, 1)` for longer travel |
| Hover / state | 200–300ms `ease` |
| Panel open | 320–420ms on the house curve |
| Scroll reveal | 1600ms, `y=24` |

Everything decorative sits behind `@media (prefers-reduced-motion: reduce)`.
Canvas pieces also pause on `IntersectionObserver` when off screen.

---

## Conventions worth knowing before editing

- **Route files export only the route.** A second `export default` beside
  `createFileRoute` stops the router code-splitting that page out.
- **Absolute asset paths** go through `media()` in `src/lib/media.ts`, or
  `import.meta.env.BASE_URL`, so the static export can live under a subpath.
- **Canvas cannot read CSS variables.** Pass real hex values to anything that
  paints into a canvas (the halftone hands, `DotGlobe`, `SonarGrid`).
- **Hand-set line breaks** live in the copy as `\n` and render through
  `BreakLines`. Only set them where a break is a design decision.
- **Dot fields and halftone screens** are the site's texture. Dot pitch follows
  `useHeroLayout`'s `cellSize` so every screen's grain matches.
