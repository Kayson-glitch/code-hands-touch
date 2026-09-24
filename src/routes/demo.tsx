import { createFileRoute } from "@tanstack/react-router";
import { DemoSite } from "@/fakehunter/DemoSite";

const title = "Product Demo — FakeHunter.AI";
const description =
  "Run a payment screenshot, a bank statement or a screen recording through FakeHunter and watch the verdict resolve: queue, inference, fake probability, verdict and the reasons behind it.";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "theme-color", content: "#0a0a0b" },
    ],
  }),
  component: DemoSite,
});
