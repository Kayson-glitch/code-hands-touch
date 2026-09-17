import { Fragment, type CSSProperties } from "react";
import { DotArrow } from "@/components/DotArrow";
import { Reveal } from "@/components/Reveal";

/**
 * Visual anchors for the Why Synergy long-form pages. All three reuse the
 * pages' existing vocabulary — hairlines, square / diamond markers, the
 * display face for numbers — so they read as part of the article rather
 * than as illustrations dropped into it.
 */

const fluid = (px: number, min = px * 0.7) =>
  `clamp(${Math.round(min)}px, ${((px / 1440) * 100).toFixed(4)}vw, ${px}px)`;

type Tone = {
  ink: string;
  muted: string;
  rule: string;
  surface: string;
};

function tone(dark: boolean): Tone {
  return dark
    ? {
        ink: "#FFFFFF",
        muted: "rgba(255,255,255,0.55)",
        rule: "rgba(255,255,255,0.22)",
        surface: "rgba(255,255,255,0.04)",
      }
    : {
        ink: "var(--ink, #0E0B22)",
        muted: "var(--ink-muted, #7A7885)",
        rule: "#E1E0E4",
        surface: "#FAFAFA",
      };
}

/* ------------------------------------------------------------ step diagram */

export type Step = {
  label: string;
  sub?: string;
  /** Outcome node: accent border and marker. */
  emphasis?: boolean;
};

function Connector({ rule, accent }: { rule: string; accent: string }) {
  return (
    <div
      aria-hidden
      className="relative flex shrink-0 items-center justify-center md:w-8 md:self-stretch"
      style={{ minHeight: 24 }}
    >
      {/* horizontal on md+, vertical below */}
      <span className="hidden md:block" style={{ height: 1, width: "100%", background: rule }} />
      <span className="md:hidden" style={{ width: 1, height: 24, background: rule }} />
      <span
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: 6,
          height: 6,
          background: accent,
          transform: "translate(-50%, -50%) rotate(45deg)",
        }}
      />
    </div>
  );
}

export function StepDiagram({
  steps,
  caption,
  accent,
  dark = false,
  className,
  style,
}: {
  steps: Step[];
  caption?: string;
  accent: string;
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const t = tone(dark);
  return (
    <Reveal y={20} duration={1600} className={className} style={style}>
      <figure style={{ margin: 0 }}>
        <div className="flex flex-col md:flex-row md:items-stretch">
          {steps.map((step, i) => (
            <Fragment key={step.label}>
              {i > 0 ? <Connector rule={t.rule} accent={accent} /> : null}
              <div
                className="flex min-w-0 flex-1 flex-col"
                style={{
                  padding: "14px 16px 16px",
                  border: `1px solid ${step.emphasis ? accent : t.rule}`,
                  background: step.emphasis ? "transparent" : t.surface,
                  gap: 8,
                }}
              >
                <span
                  className="font-sans"
                  style={{
                    fontSize: 11,
                    lineHeight: "16px",
                    letterSpacing: "0.08em",
                    color: step.emphasis ? accent : t.muted,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: "20px",
                    fontWeight: 500,
                    color: t.ink,
                  }}
                >
                  {step.label}
                </p>
                {step.sub ? (
                  <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: t.muted }}>
                    {step.sub}
                  </p>
                ) : null}
              </div>
            </Fragment>
          ))}
        </div>
        {caption ? (
          <figcaption
            style={{ marginTop: 14, fontSize: 12, lineHeight: "18px", color: t.muted }}
          >
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </Reveal>
  );
}

/* ---------------------------------------------------------------- pull quote */

export function PullQuote({
  text,
  accent,
  dark = false,
  className,
  style,
}: {
  text: string;
  accent: string;
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const t = tone(dark);
  return (
    <Reveal y={20} duration={1600} className={className} style={style}>
      <blockquote
        className="font-display"
        style={{
          margin: 0,
          padding: `${fluid(8, 4)} 0 ${fluid(8, 4)} ${fluid(28, 20)}`,
          borderLeft: `2px solid ${accent}`,
          fontSize: fluid(28, 22),
          lineHeight: 1.25,
          fontWeight: 500,
          color: t.ink,
          maxWidth: 760,
        }}
      >
        {text}
      </blockquote>
    </Reveal>
  );
}

/* ------------------------------------------------------------- before → after */

export function BeforeAfter({
  before,
  after,
  beforeLabel,
  afterLabel,
  accent,
  dark = false,
  className,
  style,
}: {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  accent: string;
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const t = tone(dark);
  const value = (v: string, emphasis: boolean) => (
    <p
      className="font-display whitespace-nowrap"
      style={{
        margin: 0,
        fontSize: fluid(64, 40),
        lineHeight: 1.1,
        fontWeight: 400,
        color: emphasis ? t.ink : t.muted,
      }}
    >
      {v}
    </p>
  );
  const label = (v: string) => (
    <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: "18px", color: t.muted }}>{v}</p>
  );
  return (
    <Reveal y={20} duration={1600} className={className} style={style}>
      <figure
        className="flex flex-col items-start md:flex-row md:items-end"
        style={{
          margin: 0,
          padding: `${fluid(28, 20)} ${fluid(32, 20)}`,
          gap: `16px ${fluid(40, 24)}`,
          background: t.surface,
          border: `1px solid ${t.rule}`,
        }}
      >
        <div>
          {value(before, false)}
          {label(beforeLabel)}
        </div>
        {/* points right beside the values, down when they stack on phones */}
        <span
          aria-hidden
          className="inline-flex rotate-90 md:rotate-0 md:pb-[30px]"
          style={{ color: accent }}
        >
          <DotArrow size={40} connectOnHover={false} />
        </span>
        <div>
          {value(after, true)}
          {label(afterLabel)}
        </div>
      </figure>
    </Reveal>
  );
}
