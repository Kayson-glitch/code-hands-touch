import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { destroySmoothScroll, initSmoothScroll } from "../lib/smoothScroll";
import { SitePreloader } from "../components/SitePreloader";
import { fluid } from "../lib/fluid";

/**
 * What a shared link shows. `SITE_IMAGE` is relative because the deploy
 * domain isn't known here — Slack, Facebook and LinkedIn resolve that against
 * the page URL; set it to the absolute URL once the domain is fixed so X
 * shows a card too.
 */
const SITE_TITLE = "Synergy.AI — Revenue-Driven AI Support";
const SITE_DESCRIPTION =
  "The intelligence layer for customer success. Synergy.AI resolves support conversations end to end and keeps people on the judgement calls.";
const SITE_IMAGE = "/media/og-card.png";

const INK = "#0E0B22";
const MUTED = "#7A7885";
const FAINT = "#A1A0A9";
const HAIRLINE = "rgba(14,11,34,0.10)";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="uppercase"
      style={{ margin: 0, fontSize: 10, lineHeight: "16px", letterSpacing: "0.14em", color: FAINT }}
    >
      {children}
    </p>
  );
}

function HomeLink({ label }: { label: string }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2"
      style={{ fontSize: 13, lineHeight: "20px", color: INK, borderBottom: `1px solid ${INK}`, paddingBottom: 2 }}
    >
      {label}
      <span aria-hidden>&#8594;</span>
    </Link>
  );
}

/** Off-brand fallbacks read as a different product, so both shells stay in the site's paper/ink language. */
function StatusShell({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "#FAFAFA", padding: "0 24px" }}
    >
      <div style={{ width: "100%", maxWidth: 520, borderTop: `1px solid ${HAIRLINE}`, paddingTop: 24 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1
          className="font-display"
          style={{ margin: "16px 0 0", fontSize: fluid(44, 30), lineHeight: 1.08, fontWeight: 400, color: INK }}
        >
          {title}
        </h1>
        <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: "22px", color: MUTED }}>{body}</p>
        <div className="mt-8 flex flex-wrap items-center gap-6">{children}</div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <StatusShell
      eyebrow="404 / Not Found"
      title="This page doesn't exist."
      body="The link may be out of date, or the page has moved somewhere else on the site."
    >
      <HomeLink label="Back to home" />
    </StatusShell>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <StatusShell
      eyebrow="Error / Load Failed"
      title="This page didn't load."
      body="Something went wrong on our end. Try again, or head back to the home page."
    >
      <button
        onClick={() => {
          router.invalidate();
          reset();
        }}
        style={{ fontSize: 13, lineHeight: "20px", color: INK, borderBottom: `1px solid ${INK}`, paddingBottom: 2 }}
      >
        Try again
      </button>
      <HomeLink label="Back to home" />
    </StatusShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:site_name", content: "Synergy.AI" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_IMAGE },
      { property: "og:image:alt", content: "Synergy.AI — resolve support end to end, securely." },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: SITE_IMAGE },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://api.fontshare.com/v2/css?f[]=clash-display@variable&display=swap",
      },

    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Page-wide inertial smooth scroll (kore.ai-like feel).
  useEffect(() => {
    initSmoothScroll();
    return () => destroySmoothScroll();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Held over the first paint of a page load; route changes never see it. */}
      <SitePreloader />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
