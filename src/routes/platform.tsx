import { Outlet, createFileRoute } from "@tanstack/react-router";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

/**
 * Shared layout for every page under the /platform tab — same chrome as the
 * Why Synergy pages: long-form typography scope + the fixed bottom blur that
 * hides itself once the footer scrolls in.
 */
function PlatformLayout() {
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

export const Route = createFileRoute("/platform")({
  component: PlatformLayout,
});
