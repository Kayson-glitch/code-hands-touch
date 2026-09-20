// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * Static export for GitHub Pages, off by default.
 *
 * `STATIC_BASE=/repo-name/ bun run build` crawls every route to plain HTML in
 * `.output/public`, which a file host can serve without a server. The default
 * build is untouched: no base, no prerender, still the Cloudflare worker.
 */
const staticBase = process.env.STATIC_BASE;

export default defineConfig({
  // Nitro retargets the output to `.output` for Cloudflare, which is where the
  // prerenderer's own preview server loses track of the build.
  ...(staticBase ? { nitro: false as const } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(staticBase ? { prerender: { enabled: true, crawlLinks: true } } : {}),
  },
  vite: {
    ...(staticBase ? { base: staticBase } : {}),
    server: {
      // The dev server is reached through forwarded/proxied hostnames (cloud
      // previews, tunnels); Vite would otherwise answer 403 for any Host that
      // isn't localhost.
      allowedHosts: true,
    },
  },
});
