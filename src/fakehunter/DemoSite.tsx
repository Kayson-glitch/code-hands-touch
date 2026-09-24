import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import { Preloader } from "./components/Preloader";
import { Button, ScanHeading } from "./components/primitives";
import { caseFiles, nextStep, siteNav } from "./content";
import { detector } from "./content.home";
import { useInView } from "./hooks";
import { Detector } from "./sections/Detector";

/**
 * The product demo, on its own page.
 *
 * The trial module used to sit in the middle of the homepage, which put the
 * single heaviest interaction on the site between two pieces of argument. It
 * gets a page instead: a title, the instrument, and the one thing to do next.
 */
export function DemoSite() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div data-fh className="relative min-h-screen overflow-x-clip">
      <a
        href="#demo"
        className="fh-label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-[color:var(--fh-acid)] focus:px-4 focus:py-2 focus:text-[#0a0a0b]"
      >
        Skip to content
      </a>
      <Preloader />
      <Nav ctaHref="#trial" />

      <main id="main" className="pt-16">
        {/* Page head. The eyebrow ticks along like the section rules elsewhere,
            but there is no number on it — this page is not part of a sequence. */}
        <header className="fh-shell pb-12 pt-[clamp(3rem,6vw,5.5rem)]">
          <div ref={ref} className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2.5">
                <span className="fh-blink block h-1.5 w-1.5 bg-[color:var(--fh-acid)]" />
                <span className="fh-label text-[color:var(--fh-acid)]">{detector.label}</span>
              </div>
              <div className="relative mt-3 h-px w-full overflow-hidden bg-[color:var(--fh-line)]">
                <div
                  className="h-full origin-left bg-[color:var(--fh-acid)]"
                  style={{
                    transform: `scaleX(${inView ? 1 : 0})`,
                    transition: "transform 1100ms var(--fh-ease-out)",
                  }}
                />
              </div>
              {/* h1 at h2 size: this is a tool, and the instrument below it
                  should be the largest thing on the page. */}
              <ScanHeading as="h1" className="fh-h2 mt-7">
                {detector.heading}
              </ScanHeading>
            </div>

            <div className="lg:col-span-5">
              <p className="fh-body">{detector.description}</p>
              <dl className="mt-7 border-t border-[color:var(--fh-line)]">
                {/* What comes back, and what the specimen chips actually are.
                    The accepted formats are already stated on the dropzone, so
                    they are not repeated here. */}
                {[
                  { term: detector.returns, detail: detector.returnFields },
                  { term: detector.specimensTerm, detail: caseFiles.description },
                ].map((row) => (
                  <div
                    key={row.term}
                    className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-[color:var(--fh-line)] py-3"
                  >
                    <dt className="fh-label pt-0.5 text-[color:var(--fh-acid)]">{row.term}</dt>
                    <dd className="text-[0.8125rem] leading-[1.6] text-[color:var(--fh-ink-dim)]">
                      {row.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </header>

        <Detector />

        {/* What to do once the demo has made its point. Copy is the site's own
            trial offer, which is the honest next step from a canned specimen. */}
        <section
          id="trial"
          className="relative mt-[clamp(4rem,8vw,7rem)] scroll-mt-24 overflow-hidden border-t border-[color:var(--fh-line)] py-[clamp(4rem,8vw,7rem)]"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(52% 46% at 50% 104%, rgba(225,240,86,0.09) 0%, transparent 70%)",
            }}
          />
          <div className="fh-shell relative grid gap-8 lg:grid-cols-12">
            <h2 className="fh-h2 lg:col-span-6">{nextStep.title}</h2>
            <div className="lg:col-span-5 lg:col-start-8">
              <p className="fh-body">{nextStep.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/fakehunter#start">{siteNav.cta}</Button>
                <Button href={siteNav.links[0].href} variant="ghost">
                  {siteNav.links[0].label}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <div className="fh-grain" aria-hidden />
    </div>
  );
}
