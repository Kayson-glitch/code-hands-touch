import { createFileRoute } from "@tanstack/react-router";
import { AsciiHandsFooter } from "@/components/AsciiHandsFooter";
import { MatrixCodeRain } from "@/components/ui/matrix-code-rain";

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
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 z-0">
        <MatrixCodeRain />
      </div>
      <div className="relative z-10">
        <AsciiHandsFooter />
      </div>
    </div>
  );
}
