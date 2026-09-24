import { createFileRoute } from "@tanstack/react-router";
import { SolutionSite } from "@/fakehunter/SolutionSite";

const title = "Product Solution — FakeHunter.AI";
const description =
  "FakeHunter spots forgery in payment screenshots, PDF statements and screen recordings. Three detection lines read the same file from different angles and return an explainable risk score.";

export const Route = createFileRoute("/fakehunter/solution")({
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
  component: SolutionSite,
});
