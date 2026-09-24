# Synergy.AI

Marketing site for Synergy.AI — an AI support product. React 19 + TanStack
Start (SSR), Tailwind 4, built by Vite into a Cloudflare worker.

## Running it

The repo is set up for [Bun](https://bun.sh); npm works too if you swap the
commands.

```sh
bun install
bun run dev        # http://localhost:8080
```

| Command             | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `bun run dev`       | Dev server on port 8080                                      |
| `bun run build`     | Production build into `.output` (Cloudflare worker + assets) |
| `bun run lint`      | ESLint, including Prettier as a rule                         |
| `bun run format`    | Prettier over the repo                                       |
| `bunx tsc --noEmit` | Type-check without emitting                                  |

## Layout

```
src/routes/      file-based routes; the file name is the URL
src/components/  everything shared, including the canvas pieces
src/lib/         data and helpers with no JSX (siteMenu, media, fluid…)
public/media/    images and video, referenced through src/lib/media.ts
```

A few things worth knowing before editing:

- **`src/lib/siteMenu.ts` is the single source for navigation.** The header
  dropdowns, the mobile menu and the footer columns all read from it, so add a
  page there once rather than in three places.
- **`fluid(px, min)`** in `src/lib/fluid.ts` turns a 1440px design value into a
  clamped viewport-relative length. Most sizing in the site goes through it.
- **Route files export only the route.** A second `export default` beside
  `createFileRoute` stops the router code-splitting that page out.
- Absolute asset paths go through `media()` or `import.meta.env.BASE_URL`, so
  the static export can live under a subpath.

## Deploying

The default build targets Cloudflare Workers, and `.output/server/wrangler.json`
is written for you:

```sh
bun run build
cd .output/server
bunx wrangler deploy
```

There is also a static export for a file host, which prerenders every route to
HTML in `dist/client`:

```sh
STATIC_BASE=/repo-name/ bun run build
```

`.github/workflows/pages.yml` runs that export for GitHub Pages. It needs Pages
enabled on the repository first, which a private repo on a free plan can't do.
