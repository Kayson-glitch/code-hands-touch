/**
 * Local media pointers.
 *
 * All binary assets live in `public/media/` and are served by Vite as static
 * files, so the project runs the same locally and on the deploy target with
 * no CDN dependency.
 *
 * Each export keeps a `{ url }` shape so call sites stay unchanged.
 */

/** `BASE_URL` is "/" for the Cloudflare build and a repo subpath on Pages. */
const media = (file: string) => ({ url: `${import.meta.env.BASE_URL}media/${file}` });

export const handsFramesAsset = media("hands-frames.webp");
export const introVideoAsset = media("intro-hands.mp4");
export const dashboardAsset = media("ask-synergy-dashboard.png");

export const logoAsset = media("synergy-logo-v3.png");
export const logoV2Asset = media("synergy-logo-v2.png");
export const logoDarkAsset = media("synergy-logo-dark.png");
export const logoLightAsset = media("synergy-logo-light.png");
export const logoOriginalAsset = media("synergy-logo.png");

/** Why Synergy hero subjects — grayscale marble renders, halftoned at runtime. */
export const whyImpactAsset = media("why-impact-coin.jpg");
export const whyStoriesAsset = media("why-stories-quill.jpg");
export const whyTechnologyAsset = media("why-technology-scale.jpg");
export const whySecurityAsset = media("why-security-handshake.jpg");
/** Testimonial portrait — pre-blurred stand-in, 560×784 for the 280×392 slot. */
export const whySecurityPortraitAsset = media("why-security-portrait.jpg");

/** Solution → Customer Support feature illustrations, exported from Figma at 2× (540×540). */
export const solutionChannelsAsset = media("solution-cs-channels.webp");
export const solutionConsoleAsset = media("solution-cs-console.webp");
export const solutionFlowAsset = media("solution-cs-flow.webp");
/** Platform → RAG 2.0 demo transcript card, exported from Figma at 2× (588×568). */
export const platformRagDemoAsset = media("platform-rag-demo.webp");

/**
 * Homepage closing gallery — one subject per panel, from Figma's 网页配图 sheet.
 * Kept as SVG rather than exported to raster: the source is vector, every
 * shape stays addressable for motion, and the five together are 89KB gzipped
 * against 507KB as WebP. Indexed by panel order, on the full 800×800 canvas
 * so the margins Figma composed around each subject are preserved.
 */
export const closingPanelAssets = [1, 2, 3, 4, 5].map((n) =>
  media(`closing-panel-${n}.svg`),
);

/** Company page — the San Francisco card, from Figma at 2×. */
export const companySanFranciscoAsset = media("company-san-francisco.webp");
/**
 * Equirectangular land mask (720×360, white = land), rasterised from
 * world-atlas' 110m TopoJSON. DotGlobe samples it to decide which dots of the
 * sphere are continents.
 */
export const worldLandMaskAsset = media("world-land-mask.png");

export const cometAsset = media("kore-comet.svg");
export const valueAsset = media("kore-value.svg");
export const scaleAsset = media("kore-scale.svg");
export const securityAsset = media("kore-security.svg");
