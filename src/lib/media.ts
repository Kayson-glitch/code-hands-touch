/**
 * Local media pointers.
 *
 * All binary assets live in `public/media/` and are served by Vite as static
 * files, so the project runs identically on Lovable and on a local machine
 * (Cursor / any IDE) with no CDN dependency.
 *
 * Each export keeps a `{ url }` shape so call sites stay unchanged.
 */

const media = (file: string) => ({ url: `/media/${file}` });

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

export const cometAsset = media("kore-comet.svg");
export const valueAsset = media("kore-value.svg");
export const scaleAsset = media("kore-scale.svg");
export const securityAsset = media("kore-security.svg");
