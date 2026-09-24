import { Outlet, createRootRoute, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Button } from "../fakehunter/components/primitives";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { destroySmoothScroll, initSmoothScroll } from "../lib/smoothScroll";

function StatusPage({
  code,
  title,
  body,
  action,
}: {
  code: string;
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div data-fh className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="fh-label text-[color:var(--fh-acid)]">{code}</p>
        <h1 className="fh-h2 mt-5">{title}</h1>
        <p className="fh-body mt-4">{body}</p>
        <div className="mt-9 flex justify-center">{action}</div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <StatusPage
      code="404"
      title="Page not found"
      body="The page you’re looking for doesn’t exist or has been moved."
      action={<Button href="/">Back to home</Button>}
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <StatusPage
      code="Error"
      title="This page didn’t load"
      body="Something went wrong on our end. You can try again, or head back home."
      action={
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </Button>
      }
    />
  );
}

const title = "FakeHunter.AI — Professional AI detection & deepfake identification";
const description =
  "A multimodal AI detection system that rules on forged payment proof across images, PDFs and video.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title },
      { name: "description", content: description },
      { name: "theme-color", content: "#0a0a0b" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300..900&family=Smooch+Sans:wght@300..800&display=swap",
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
  useEffect(() => {
    initSmoothScroll();
    return () => destroySmoothScroll();
  }, []);

  return <Outlet />;
}
