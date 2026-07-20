import { createFileRoute } from "@tanstack/react-router";
import { AsciiHandsFooter } from "@/components/AsciiHandsFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Good/Fella — ASCII Creation of Adam" },
      {
        name: "description",
        content:
          "An interactive ASCII homage to Michelangelo's Creation of Adam — two hands sculpted from code, responding to your cursor.",
      },
      { property: "og:title", content: "Good/Fella — ASCII Creation of Adam" },
      {
        property: "og:description",
        content:
          "An interactive ASCII homage to Michelangelo's Creation of Adam — two hands sculpted from code, responding to your cursor.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <AsciiHandsFooter />;
}
