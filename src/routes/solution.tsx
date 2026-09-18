import { Outlet, createFileRoute } from "@tanstack/react-router";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

/** Shared layout for every page under the /solution tab — same chrome as Platform. */
function SolutionLayout() {
  return (
    <>
      <div className="why-synergy">
        <Outlet />
      </div>
      <ProgressiveBlur
        className="fixed !z-20"
        position="bottom"
        height="140px"
        blurAmount="1.5px"
        hiddenWhenSelector="[data-progressive-blur-hide]"
      />
    </>
  );
}

export const Route = createFileRoute("/solution")({
  component: SolutionLayout,
});
