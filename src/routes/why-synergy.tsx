import { Outlet, createFileRoute } from "@tanstack/react-router";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

/**
 * Shared layout for every page under the /why-synergy tab.
 * Renders a single fixed bottom progressive-blur overlay so the effect
 * is applied consistently across all why-synergy sub-routes (and only
 * here). The overlay hides itself whenever a footer marked with
 * [data-progressive-blur-hide] scrolls into view.
 */
function WhySynergyLayout() {
  return (
    <>
      <Outlet />
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

export const Route = createFileRoute("/why-synergy")({
  component: WhySynergyLayout,
});

export default WhySynergyLayout;
