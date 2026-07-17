import { createFileRoute } from "@tanstack/react-router";
import { AsciiHandsFooter } from "@/components/AsciiHandsFooter";
import PrismaticBurst from "@/components/PrismaticBurst";

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
          "Two hands sculpted from code, responding to your cursor. A study inspired by Michelangelo's Creation of Adam.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10"
      >
        <PrismaticBurst
          intensity={2}
          speed={0.5}
          distort={1}
          mixBlendMode="lighten"
        />
      </div>
      <AsciiHandsFooter />
    </div>
  );
}
