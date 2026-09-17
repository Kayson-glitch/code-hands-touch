import { Fragment, type CSSProperties } from "react";
import { DotArrow } from "@/components/DotArrow";
import { Reveal } from "@/components/Reveal";
import { RollingNumber } from "@/components/RollingNumber";
import { fluid } from "@/lib/fluid";

/**
 * Visual anchors for the Why Synergy long-form pages. All three reuse the
 * pages' existing vocabulary — hairlines, square / diamond markers, the
 * display face for numbers — so they read as part of the article rather
 * than as illustrations dropped into it.
 */


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
  /** Outcome node: filled accent marker and accent numeral. */
  emphasis?: boolean;
};

/** Dotted connector — the DotArrow's dot language stretched into a rail. */
function DottedRail({ color, vertical }: { color: string; vertical?: boolean }) {
  return (
    <span
      aria-hidden
      className={vertical ? "block w-[3px] flex-1 xl:hidden" : "hidden h-[3px] flex-1 xl:block"}
      style={{
        backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1.6px)`,
        backgroundSize: vertical ? "3px 8px" : "8px 3px",
        backgroundRepeat: vertical ? "repeat-y" : "repeat-x",
        backgroundPosition: "center",
        margin: vertical ? "6px 0" : "0 6px",
      }}
    />
  );
}

/**
 * Editorial rail: markers on a dotted line, each step hanging below its
 * marker with a display-face numeral — no boxes. From xl up the steps sit in
 * a subgrid so the marker, numeral, label and note rows line up across every
 * column whatever the copy length; on phones the rail turns vertical and the
 * steps read as a timeline. The whole figure sits in a hairline frame.
 */
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
      <figure
        style={{
          margin: 0,
          padding: `${fluid(32, 20)} ${fluid(36, 20)} ${fluid(24, 18)}`,
          border: `1px solid ${t.rule}`,
        }}
      >
        {/* .why-steps (styles.css): vertical timeline below xl, one column per step from xl up */}
        <ol
          className="why-steps m-0 grid list-none p-0 xl:gap-x-6"
          style={{ "--steps": steps.length } as CSSProperties}
        >
          {steps.map((step, i) => {
            const last = i === steps.length - 1;
            const leadsToOutcome = !last && steps[i + 1].emphasis;
            // 1px dots need a touch more contrast than a solid hairline to read.
            const railColor = leadsToOutcome ? accent : dark ? "rgba(255,255,255,0.4)" : "#C6C5CB";
            return (
              <li
                key={step.label}
                className="flex gap-4 xl:row-span-4 xl:grid xl:grid-rows-[subgrid] xl:gap-0"
              >
                {/* marker + rail: vertical column below xl, horizontal row from xl */}
                <div className="flex shrink-0 flex-col items-center self-stretch xl:h-[12px] xl:w-full xl:flex-row xl:self-auto">
                  <span
                    aria-hidden
                    className="block shrink-0"
                    style={{
                      width: 10,
                      height: 10,
                      background: step.emphasis ? accent : "transparent",
                      border: step.emphasis ? "none" : `1px solid ${dark ? "rgba(255,255,255,0.6)" : "#0E0B22"}`,
                    }}
                  />
                  {!last ? (
                    <>
                      <DottedRail color={railColor} vertical />
                      <DottedRail color={railColor} />
                    </>
                  ) : null}
                </div>

                {/* xl+: `contents` lifts numeral / label / note into the subgrid rows */}
                <div className={`${last ? "pb-0" : "pb-8"} xl:contents`}>
                  <p
                    className="font-display xl:pt-6"
                    style={{
                      margin: 0,
                      fontSize: fluid(32, 26),
                      lineHeight: 1.1,
                      fontWeight: 400,
                      color: step.emphasis ? accent : t.muted,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p
                    className="xl:pr-2"
                    style={{
                      margin: "12px 0 0",
                      fontSize: 14,
                      lineHeight: "20px",
                      fontWeight: 500,
                      color: t.ink,
                    }}
                  >
                    {step.label}
                  </p>
                  <p
                    className="xl:pr-2"
                    style={{ margin: "6px 0 0", fontSize: 12, lineHeight: "18px", color: t.muted }}
                  >
                    {step.sub}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        {caption ? (
          <figcaption
            style={{
              marginTop: fluid(28, 20),
              paddingTop: 16,
              borderTop: `1px solid ${t.rule}`,
              fontSize: 12,
              lineHeight: "18px",
              color: t.muted,
            }}
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
          fontWeight: 400,
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
  plain = false,
  className,
  style,
}: {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  accent: string;
  dark?: boolean;
  /** No panel of its own — for use inside a host that already draws one. */
  plain?: boolean;
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
          padding: plain ? 0 : `${fluid(28, 20)} ${fluid(32, 20)}`,
          gap: `16px ${fluid(40, 24)}`,
          background: plain ? "transparent" : t.surface,
          border: plain ? "none" : `1px solid ${t.rule}`,
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

/* ------------------------------------------------------------------- stat */

/** One display-face number with its unit and a caption — the KPI card's
 *  typography, sized for a figure slot. */
export function StatFigure({
  value,
  unit,
  caption,
  dark = false,
  className,
  style,
}: {
  value: string;
  unit?: string;
  caption: string;
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const t = tone(dark);
  return (
    <div className={className} style={style}>
      <p
        className="font-display whitespace-nowrap"
        style={{ margin: 0, fontSize: fluid(72, 44), lineHeight: 1.1, fontWeight: 400, color: t.ink }}
      >
        {value}
        {unit ? (
          <span style={{ fontSize: fluid(36, 24), fontWeight: 400, color: t.muted, marginLeft: 6 }}>
            {unit}
          </span>
        ) : null}
      </p>
      <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: "20px", color: t.muted, maxWidth: 360 }}>
        {caption}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- stats card */

/** Alternating accent diamond / ink square, the bullet used in every list. */
export function ListBullet({ diamond, accent, dark = false }: { diamond: boolean; accent: string; dark?: boolean }) {
  return (
    <span
      aria-hidden
      className="mt-[8px] inline-block shrink-0"
      style={{
        width: 6,
        height: 6,
        background: diamond ? accent : dark ? "#FFFFFF" : "#0E0B22",
        transform: diamond ? "rotate(45deg)" : undefined,
      }}
    />
  );
}

/** 100px Clash Display digits with a 60px unit. */
export function StatValue({ value, dark = false }: { value: string; dark?: boolean }) {
  const t = tone(dark);
  const match = /^([\d.]+)(.*)$/.exec(value);
  const digits = match ? match[1] : value;
  const unit = match ? match[2] : "";
  return (
    <p
      className="font-display whitespace-nowrap"
      style={{ margin: 0, fontSize: fluid(100, 52), lineHeight: 1.2, fontWeight: 400, color: t.ink }}
    >
      {match ? <RollingNumber value={digits} /> : digits}
      {unit ? <span style={{ fontSize: fluid(60, 32), fontWeight: 400, color: dark ? "rgba(255,255,255,0.5)" : "#A1A0A9" }}>{unit}</span> : null}
    </p>
  );
}

/**
 * Module stats card — primary stat left, bullet list right, a dashed vertical
 * rule between them; stacked with a horizontal rule on phones. Shared by the
 * Stories and Technology pages (light and black variants).
 */
export function StatsCard({
  label = "Overall Impact",
  value,
  caption,
  bullets,
  accent,
  dark = false,
}: {
  label?: string;
  value: string;
  caption: string;
  bullets: string[];
  accent: string;
  dark?: boolean;
}) {
  const t = tone(dark);
  return (
    <Reveal y={32} duration={1600} style={{ background: dark ? "#0E0B22" : "#F8F9FA" }}>
      <div
        className="relative flex flex-col md:flex-row"
        style={{ padding: `${fluid(56, 36)} ${fluid(40, 16)}`, gap: fluid(40, 20) }}
      >
        <div className="shrink-0 md:w-[35%]">
          <p
            className="font-sans uppercase"
            style={{ margin: 0, fontSize: 12, lineHeight: "18px", fontWeight: 500, letterSpacing: "0.08em", color: t.muted }}
          >
            {label}
          </p>
          <div style={{ marginTop: fluid(20, 14) }}>
            <StatValue value={value} dark={dark} />
          </div>
          <p style={{ margin: `${fluid(20, 14)} 0 0`, fontSize: 14, lineHeight: "22px", color: t.muted, maxWidth: 340 }}>
            {caption}
          </p>
        </div>

        <div aria-hidden className="md:hidden" style={{ height: 1, background: t.rule }} />

        <ul
          className="flex flex-1 flex-col md:justify-between md:pl-[clamp(20px,2.7778vw,40px)]"
          style={{ gap: 22, margin: 0 }}
        >
          {bullets.map((b, i) => (
            <li key={b} className="flex items-start gap-3">
              <ListBullet diamond={i % 2 === 0} accent={accent} dark={dark} />
              <span style={{ fontSize: 14, lineHeight: "22px", color: t.ink }}>{b}</span>
            </li>
          ))}
        </ul>

        <div
          aria-hidden
          className="hidden md:block"
          style={{ position: "absolute", top: "30%", bottom: "30%", left: "38%", width: 0, borderLeft: `1px dashed ${t.rule}` }}
        />
      </div>
    </Reveal>
  );
}
