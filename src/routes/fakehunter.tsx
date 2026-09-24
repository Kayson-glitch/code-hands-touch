import { Outlet, createFileRoute } from "@tanstack/react-router";

/**
 * Shell for the FakeHunter site. `/fakehunter` is the corporate homepage and
 * `/fakehunter/solution` is the product deep dive, matching how the live site
 * splits its homepage from /about.
 */
export const Route = createFileRoute("/fakehunter")({
  component: Outlet,
});
