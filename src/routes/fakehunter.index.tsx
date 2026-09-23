import { createFileRoute } from "@tanstack/react-router";
import { HomeSite } from "@/fakehunter/HomeSite";

const title = "FakeHunter.AI — Professional AI detection & deepfake identification";
const description =
  "A multimodal AI detection system powered by Caltech Research Institute's leading computer vision algorithms. FakeHunter rules on forged payment proof across images, PDFs and video and returns an explainable verdict in under 100ms.";

export const Route = createFileRoute("/fakehunter/")({
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
  component: HomeSite,
});
