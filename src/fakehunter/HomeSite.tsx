import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import { Preloader } from "./components/Preloader";
import { ScrollRail } from "./components/ScrollRail";
import { homeSections } from "./content.home";
import { Accurate } from "./sections/home/Accurate";
import { HomeHero } from "./sections/home/HomeHero";
import { Performance } from "./sections/home/Performance";
import { Secure } from "./sections/home/Secure";
import { TechSolution } from "./sections/home/TechSolution";
import { WallOfLove } from "./sections/home/WallOfLove";

/**
 * The corporate homepage.
 *
 * Section order follows fakehunter.co — hero, testimonial band, technology,
 * accuracy, performance, closing CTA — because that order is the argument the
 * company makes. What changed is everything about how it is put on screen: one
 * accent instead of a violet-and-blue gradient wash, and live instruments where
 * the original ships screenshots.
 *
 * The trial module is not here. It is the heaviest interaction on the site and
 * it has its own page at /fakehunter/demo, so the homepage can stay an argument
 * rather than stopping halfway through to become a tool.
 */
export function HomeSite() {
  return (
    <div data-fh className="relative min-h-screen overflow-x-clip">
      <a
        href="#voices"
        className="fh-label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-[color:var(--fh-acid)] focus:px-4 focus:py-2 focus:text-[#0a0a0b]"
      >
        Skip to content
      </a>
      <Preloader />
      <Nav sections={homeSections} ctaHref="#start" />
      <ScrollRail sections={homeSections} />
      <main id="main">
        <HomeHero />
        <WallOfLove />
        <TechSolution />
        <Accurate />
        <Performance />
        <Secure />
      </main>
      <Footer />
      <div className="fh-grain" aria-hidden />
    </div>
  );
}
