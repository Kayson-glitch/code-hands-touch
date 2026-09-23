import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import { Preloader } from "./components/Preloader";
import { ScrollRail } from "./components/ScrollRail";
import { CaseFiles } from "./sections/CaseFiles";
import { Hero } from "./sections/Hero";
import { NextStep } from "./sections/NextStep";
import { Pipeline } from "./sections/Pipeline";
import { Pricing } from "./sections/Pricing";
import { Problem } from "./sections/Problem";
import { Results } from "./sections/Results";
import { Technology } from "./sections/Technology";
import { ToolGap } from "./sections/ToolGap";

export function Site() {
  return (
    <div data-fh className="relative min-h-screen overflow-x-clip">
      <a
        href="#problem"
        className="fh-label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-[color:var(--fh-acid)] focus:px-4 focus:py-2 focus:text-[#0a0a0b]"
      >
        Skip to content
      </a>
      <Preloader />
      <Nav />
      <ScrollRail />
      <main id="main">
        <Hero />
        <Problem />
        <ToolGap />
        <Pipeline />
        <Technology />
        <CaseFiles />
        <Results />
        <Pricing />
        <NextStep />
      </main>
      <Footer />
      <div className="fh-grain" aria-hidden />
    </div>
  );
}
