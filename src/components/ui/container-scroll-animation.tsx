import React, { useRef } from "react";
import { useScroll, useTransform, useSpring, motion, type MotionValue } from "motion/react";

export const ContainerScroll = ({
  titleComponent,
  children,
  rotateFrom = 20,
  settleAt = 1,
  perspective = 1000,
  spring,
}: {
  titleComponent?: string | React.ReactNode;
  children: React.ReactNode;
  /** Initial X tilt in degrees before the card settles flat. */
  rotateFrom?: number;
  /**
   * Scroll progress (0–1 of the container's own travel) at which the card is
   * fully flat. Lower it when the container's bottom never reaches the
   * viewport bottom (e.g. it is covered by the next section), so the whole
   * flip plays out over the visible approach instead of stalling mid-tilt.
   */
  settleAt?: number;
  /** CSS perspective in px; smaller = stronger foreshortening. */
  perspective?: number;
  /** Optional spring smoothing so the tilt eases behind the scroll instead of tracking it 1:1. */
  spring?: { stiffness?: number; damping?: number; mass?: number };
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: rawProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });
  const smoothed = useSpring(rawProgress, {
    stiffness: spring?.stiffness ?? 300,
    damping: spring?.damping ?? 40,
    mass: spring?.mass ?? 1,
  });
  const scrollYProgress = spring ? smoothed : rawProgress;
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = (): [number, number] => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const end = Math.max(0.05, Math.min(1, settleAt));
  const rotate = useTransform(scrollYProgress, [0, end], [rotateFrom, 0]);
  const scale = useTransform(scrollYProgress, [0, end], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, end], [0, -100]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center p-2 md:p-10"
    >
      <div className="relative w-full" style={{ perspective: `${perspective}px` }}>
        {titleComponent ? (
          <Header translate={translate} titleComponent={titleComponent} />
        ) : null}
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{ translateY: translate }}
      className="mx-auto max-w-5xl text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate?: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
        borderRadius: "24px",
      }}
      className="mx-auto w-full max-w-5xl"
    >
      {children}
    </motion.div>
  );
};
