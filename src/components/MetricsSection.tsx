import { useEffect, useLayoutEffect, useRef, useState } from "react";
import cometAsset from "@/assets/kore-comet.svg.asset.json";
import valueAsset from "@/assets/kore-value.svg.asset.json";
import scaleAsset from "@/assets/kore-scale.svg.asset.json";
import securityAsset from "@/assets/kore-security.svg.asset.json";

const CARDS = [
  { image: valueAsset.url, title: "{ Outcomes in days }", body: "{ Artemis } handles the infrastructure; your team starts at the business logic. Team focuses on outcomes. Agents ship faster.", value: "5x", outcome: "faster time to value" },
  { image: scaleAsset.url, title: "{ Predictability at Scale }", body: "Every agent is clearly defined, tested, and validated before deployment, so what works in design does not break in production.", value: "No", outcome: "surprises in production" },
  { image: securityAsset.url, title: "{ Security + Governance }", body: "Every action stays within approved policies and boundaries, with full visibility into what happened and why.", value: "Zero", outcome: "unauthorized agent actions" },
];

const START_Y = 320;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function MetricsSection() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLDivElement | null>(null);
  const firstCopyRef = useRef<HTMLDivElement | null>(null);
  const firstNumberRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
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
      if (copy && cards) setCopyTop(copy.getBoundingClientRect().top - cards.getBoundingClientRect().top);
      const num = firstNumberRef.current;
      const container = cards?.parentElement;
      if (num && cards && container) {
        const top = num.getBoundingClientRect().top - cards.getBoundingClientRect().top;
        const centered = top + (num.getBoundingClientRect().height - container.getBoundingClientRect().height) / 2;
        setNumberTop(Math.max(0, centered));
      }
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
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const distance = Math.max(1, wrapper.offsetHeight - window.innerHeight * 0.8);
      setProgress(clamp(-rect.top / distance));
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [desktop, reducedMotion]);

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
            <div ref={cardsRef} className="kore-outcomes__cards">
              {CARDS.map((card, index) => {
                const columnProgress = reducedMotion ? 1 : clamp(progress * CARDS.length - index);
                const opacity = reducedMotion ? 1 : clamp(columnProgress * 3);
                const restY = -numberTop;
                const translateY = START_Y + (restY - START_Y) * columnProgress;
                return (
                  <div ref={index === 0 ? firstItemRef : undefined} key={card.title} className="kore-outcomes__item" style={desktop ? { opacity, transform: `translate3d(0, ${translateY}px, 0)` } : undefined}>
                    <article className="kore-outcomes__card">
                      <div className="kore-outcomes__media"><img src={card.image} alt="" /></div>
                      <div ref={index === 0 ? firstCopyRef : undefined} className="kore-outcomes__copy">
                        <h3>{card.title}</h3><p>{card.body}</p>
                      </div>
                    </article>
                    <div ref={index === 0 ? firstNumberRef : undefined} className="kore-outcomes__number">
                      <p className="kore-outcomes__value">{card.value}</p>
                      <p className="kore-outcomes__label">{card.outcome}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <footer className="kore-outcomes__footer" >
        <p><span>{"{"}</span>Artemis<span>{"}"}</span><br />delivers<br /><em>certainty</em></p>
      </footer>
    </section>
  );
}
