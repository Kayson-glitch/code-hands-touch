import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/smoothScroll";
import cometAsset from "@/assets/kore-comet.svg.asset.json";
import valueAsset from "@/assets/kore-value.svg.asset.json";
import scaleAsset from "@/assets/kore-scale.svg.asset.json";
import securityAsset from "@/assets/kore-security.svg.asset.json";

const CARDS = [
  { image: valueAsset.url, title: "{ Outcomes in days }", body: "{ Artemis } handles the infrastructure; your team starts at the business logic. Team focuses on outcomes. Agents ship faster.", value: "+85", unit: "%", outcome: "faster time to value" },
  { image: scaleAsset.url, title: "{ Predictability at Scale }", body: "Every agent is clearly defined, tested, and validated before deployment, so what works in design does not break in production.", value: "13", unit: "k", outcome: "surprises in production" },
  { image: securityAsset.url, title: "{ Security + Governance }", body: "Every action stays within approved policies and boundaries, with full visibility into what happened and why.", value: "+90", unit: "%", outcome: "unauthorized agent actions" },
];


const START_Y = 320;
// Each column gets a substantial, viewport-relative entrance distance so the
// complete dot artwork is readable before the card starts travelling upward.
const ARTWORK_REVEAL_VH = 0.34;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
// Reference site eases each column's reveal instead of translating linearly.
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);


export function MetricsSection() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLDivElement | null>(null);
  const firstCopyRef = useRef<HTMLDivElement | null>(null);
  const firstNumberRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [animationDistance, setAnimationDistance] = useState(1);
  const [viewportHeight, setViewportHeight] = useState(1000);
  const [cardHeight, setCardHeight] = useState(856);
  const [copyTop, setCopyTop] = useState(520);
  const [numberTop, setNumberTop] = useState(600);
  const [desktop, setDesktop] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const isDesktop = window.innerWidth >= 991;
      setDesktop(isDesktop);
      if (!isDesktop) return;
      const item = firstItemRef.current;
      const copy = firstCopyRef.current;
      const cards = cardsRef.current;
      if (item) setCardHeight(item.getBoundingClientRect().height);
      // Source site measures the copy offset against the card box (rect-based).
      const box = copy?.closest(".kore-outcomes__card") as HTMLElement | null;
      if (copy && box) {
        setCopyTop(copy.getBoundingClientRect().top - box.getBoundingClientRect().top);
      }
      const num = firstNumberRef.current;
      if (num && cards) setNumberTop(Math.max(0, num.offsetTop - cards.offsetTop - 32));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (stickyRef.current) observer.observe(stickyRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!desktop || reducedMotion) {
      setProgress(reducedMotion ? 1 : 0);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const wrapper = wrapperRef.current;
      const sticky = stickyRef.current;
      if (!wrapper || !sticky) return;
      const rect = wrapper.getBoundingClientRect();
      const stickyStyle = window.getComputedStyle(sticky);
      const stickyTop = Number.parseFloat(stickyStyle.top) || 0;
      // Start only when the section has actually reached its sticky position.
      // Previously the viewport-height offset advanced the first card before
      // the section arrived, so its dot artwork was already above the viewport.
      const scrolled = stickyTop - rect.top;
      const distance = Math.max(1, rect.height - sticky.getBoundingClientRect().height);
      setScrollDistance(Math.max(0, scrolled));
      setAnimationDistance(distance);
      setViewportHeight(window.innerHeight);
      setProgress(clamp(scrolled / distance));
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    // Lenis drives the page; read progress on its tick so the reveal never
    // trails the smoothed scroll position by a frame.
    const lenis = getLenis();
    lenis?.on("scroll", update);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      lenis?.off("scroll", update);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [desktop, reducedMotion, copyTop]);

  return (
    <section className="kore-outcomes" aria-labelledby="outcomes-heading">
      <div ref={wrapperRef} className="kore-outcomes__wrapper" style={desktop ? { height: cardHeight * CARDS.length } : undefined}>
        <div ref={stickyRef} className="kore-outcomes__sticky">
          <header className="kore-outcomes__header">
            <div className="kore-outcomes__header-inner">
              <img src={cometAsset.url} alt="" className="kore-outcomes__comet" />
              <h2 id="outcomes-heading">
                What {"{ "}<strong>Artemis</strong>{" } "}<em>changes</em><br />for enterprise AI
              </h2>
            </div>
          </header>
          <div className="kore-outcomes__cards-container">
            <div className="kore-outcomes__progress" aria-hidden="true">
              <div
                className="kore-outcomes__progress-fill"
                style={{ "--p": !desktop || reducedMotion ? 1 : clamp(progress) } as React.CSSProperties}
              />
            </div>
            <div ref={cardsRef} className="kore-outcomes__cards">
              {CARDS.map((card, index) => {
                const columnDistance = animationDistance / CARDS.length;
                const columnScrolled = scrollDistance - columnDistance * index;
                const revealDistance = Math.min(
                  viewportHeight * ARTWORK_REVEAL_VH,
                  columnDistance * 0.78,
                );
                const travelDistance = Math.max(1, columnDistance - revealDistance);
                const restY = -copyTop;
                const artworkProgress = reducedMotion ? 1 : clamp(columnScrolled / revealDistance);
                const cardScrollProgress = reducedMotion
                  ? 1
                  : clamp((columnScrolled - revealDistance) / travelDistance);
                const translateY = artworkProgress < 1
                  ? START_Y * (1 - easeOutCubic(artworkProgress))
                  : restY * easeOutCubic(cardScrollProgress);
                const opacity = reducedMotion ? 1 : easeOutCubic(artworkProgress);
                return (
                  <div ref={index === 0 ? firstItemRef : undefined} key={card.title} className="kore-outcomes__item" style={desktop ? { opacity, transform: `translate3d(0, ${translateY}px, 0)` } : undefined}>
                    <article className="kore-outcomes__card">
                      <div className="kore-outcomes__media"><img src={card.image} alt="" /></div>
                      <div ref={index === 0 ? firstCopyRef : undefined} className="kore-outcomes__copy">
                        <h3>{card.title}</h3><p>{card.body}</p>
                      </div>
                    </article>
                    <div ref={index === 0 ? firstNumberRef : undefined} className="kore-outcomes__number">
                      <p className="kore-outcomes__value">{card.value}<span className="kore-outcomes__value-unit">{card.unit}</span></p>
                      <p className="kore-outcomes__label">{card.outcome}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
