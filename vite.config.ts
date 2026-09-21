import { defineConfig, loadEnv, type PluginOption, type UserConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

/**
 * Static export for GitHub Pages, off by default.
 *
 * `STATIC_BASE=/repo-name/ bun run build` crawls every route to plain HTML in
 * `.output/public`, which a file host can serve without a server. The default
 * build is untouched: no base, no prerender, still the Cloudflare worker.
 */
const staticBase = process.env.STATIC_BASE;

export default defineConfig(async ({ command, mode }): Promise<UserConfig> => {
  // Only VITE_-prefixed values, and inlined rather than read at runtime: the
  // Cloudflare worker has no process.env to read them from.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  const plugins: PluginOption[] = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our
      // SSR error wrapper); nitro builds from this.
      server: { entry: "server" },
      // A client bundle that reaches into server code is a leak, not a warning.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      ...(staticBase ? { prerender: { enabled: true, crawlLinks: true } } : {}),
    }),
  ];

  // Build-only, and skipped for the static export: nitro retargets the output
  // to .output for Cloudflare, and the prerenderer's own preview server can't
  // find the build there.
  if (command === "build" && !staticBase) {
    const { nitro } = await import("nitro/vite");
    plugins.push(nitro({ defaultPreset: "cloudflare-module" }));
  }

  plugins.push(viteReact());

  return {
    ...(staticBase ? { base: staticBase } : {}),
    define,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      // One copy of each, or hooks break across duplicated module instances.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    plugins,
    server: {
      host: "::",
      port: 8080,
      // The dev server is reached through forwarded/proxied hostnames (cloud
      // previews, tunnels); Vite would otherwise answer 403 for any Host that
      // isn't localhost.
      allowedHosts: true,
    },
  };
});
