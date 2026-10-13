// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Steps chart (steps-chart)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * STEPS CHART: a week of steps against a daily goal
 *
 *   arrive    the first time it's on screen the days grow up out
 *             of the baseline one after another and the total
 *             rolls up from zero
 *   week      ‹ and › step through the weeks: the label morphs,
 *             each day eases to its new height in a wave that
 *             runs the way you went, days that made the goal
 *             turn your primary colour, the totals roll
 *   goal      a line at the goal in your primary colour; days at or over it are
 *             filled, a day still in progress is drawn as an
 *             outline with its fill so far
 *   hover     a Tactile column follows the pointer and the
 *             readout at its top slides along, the day morphing
 *             and the steps rolling
 *
 * The plot is one tab stop: arrow keys move between days and the
 * readout is announced. Every day is also in a table for screen
 * readers.
 * ───────────────────────────────────────────────────────── */

export interface StepsDay {
  /** The same in every week (e.g. "mon"), so a day keeps its bar from week to week. */
  key: string;
  /** Under the bar, e.g. "Mon". */
  label: string;
  value: number;
  /** In the readout, e.g. "Thursday 2 October". Defaults to label. */
  title?: string;
  /** A day still under way: drawn as an outline with its fill so far. */
  today?: boolean;
}

export interface StepsWeek {
  id: string;
  /** Between the arrows, e.g. "This week" or "22 to 28 Sept". */
  label: string;
  days: StepsDay[];
}

export interface StepsChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Oldest first; it opens on the last. */
  weeks: StepsWeek[];
  /** Steps a day. */
  goal?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  title?: string;
  locales?: string | string[];
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const PLOT = 176;
const HEADROOM = 30;
const LABELS = 26;
const GUTTER = 40;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const COMPACT: Intl.NumberFormatOptions = { notation: "compact", maximumFractionDigits: 1 };

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(reducedQuery).matches,
    () => false,
  );

function niceMax(value: number) {
  if (value <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * step >= value) return m * step;
  return 10 * step;
}

function Arrow({ dir, disabled, onClick }: { dir: -1 | 1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir < 0 ? "Previous week" : "Next week"}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && onClick()}
      className={`flex size-7 items-center justify-center rounded-full text-foreground transition-[background-color,opacity] duration-300 ${FOCUS} ${
        disabled ? "cursor-default opacity-30" : "hover:bg-accent"
      }`}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-3.5"
      >
        <path d={dir < 0 ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"} />
      </svg>
    </button>
  );
}

export function StepsChart({ weeks, goal = 10_000, value, defaultValue, onValueChange, title = "Steps", locales, className = "", ...props }: StepsChartProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [own, setOwn] = React.useState(defaultValue ?? weeks[weeks.length - 1]?.id);
  const weekId = value ?? own;
  const index = Math.max(
    0,
    weeks.findIndex((w) => w.id === weekId),
  );
  const week = weeks[index];
  const days = week?.days ?? [];

  // The scale holds still across weeks (the busiest week sets it), so heights compare from week to week.
  const max = niceMax(Math.max(goal * 1.2, ...weeks.flatMap((w) => w.days.map((d) => d.value))));
  const total = days.reduce((sum, d) => sum + d.value, 0);
  // The average leaves out days still to come and a day still under way.
  const counted = days.filter((d) => d.value > 0 && (!d.today || d.value >= goal));
  const average = counted.length ? Math.round(counted.reduce((sum, d) => sum + d.value, 0) / counted.length) : 0;
  const met = days.filter((d) => d.value >= goal).length;
  const slot = days.length ? 100 / days.length : 100;
  const scale = (n: number) => (n / max) * (plotH - HEADROOM);

  const [visible, setVisible] = React.useState(false);
  const [plotH, setPlotH] = React.useState(PLOT);
  const [active, setActive] = React.useState<number | null>(null);
  const [keyboard, setKeyboard] = React.useState(false);
  const [dir, setDir] = React.useState(1);
  const [shownIndex, setShownIndex] = React.useState(index);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const barsRef = React.useRef<HTMLDivElement>(null);
  const plotRef = React.useRef<HTMLDivElement>(null);

  // The wave runs the way you went: back in time from the right, forward from the left.
  if (shownIndex !== index) {
    setDir(index > shownIndex ? 1 : -1);
    setShownIndex(index);
  }

  // The plot's height is set by the card's width in CSS; read it so the drawing fits.
  React.useLayoutEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const measure = () =>
      setPlotH((h) => {
        const next = el.offsetHeight - LABELS;
        return next > 0 && next !== h ? next : h;
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const go = (d: -1 | 1) => {
    const next = weeks[index + d];
    if (!next) return;
    if (value === undefined) setOwn(next.id);
    onValueChange?.(next.id);
  };

  // Days still to come can't be read: the readout stops at today.
  const lastDay = Math.max(0, days.reduce((last, d, i) => (d.value > 0 || d.today ? i : last), -1));
  const pointAt = (clientX: number) => {
    const r = barsRef.current?.getBoundingClientRect();
    if (!r || !days.length) return null;
    return Math.min(lastDay, Math.max(0, Math.floor(((clientX - r.left) / r.width) * days.length)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!days.length) return;
    const from = active ?? Math.max(0, days.findIndex((d) => d.today) === -1 ? days.length - 1 : days.findIndex((d) => d.today));
    const moves: Record<string, number> = { ArrowLeft: from - 1, ArrowRight: from + 1, Home: 0, End: lastDay };
    if (e.key === "Escape") return setActive(null);
    if (!(e.key in moves)) return;
    e.preventDefault();
    setKeyboard(true);
    setActive(Math.min(lastDay, Math.max(0, active === null ? from : moves[e.key])));
  };

  const fmt = (n: number) => new Intl.NumberFormat(locales).format(n);
  const shown = active !== null ? days[active] : null;
  const goalTop = HEADROOM + (plotH - HEADROOM) - scale(goal);

  return (
    <div ref={rootRef} className={`@container w-full rounded-[22px] bg-background shadow-[0_0_0_1px_var(--border)] ${className}`} {...props}>
      <div className="p-4 @md:p-5 [--gutter:30px] @md:[--gutter:40px] [--plot:148px] @md:[--plot:176px]">
        {/* The title and the week share a row; the figures sit under both. */}
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[12px] text-muted-foreground @md:text-[13px]">{title}</p>
          <div className="-my-1 -mr-1.5 flex shrink-0 items-center">
            <Arrow dir={-1} disabled={index === 0} onClick={() => go(-1)} />
            <span className="min-w-[78px] px-0.5 text-center text-[11.5px] font-medium text-foreground @md:min-w-[92px] @md:text-[12.5px]" aria-live="polite">
              <TextMorph direction={dir > 0 ? "up" : "down"}>{week?.label ?? ""}</TextMorph>
            </span>
            <Arrow dir={1} disabled={index === weeks.length - 1} onClick={() => go(1)} />
          </div>
        </div>
        <p className="mt-0.5 flex items-baseline gap-1.5 text-[22px] font-medium leading-tight tracking-[-0.03em] text-foreground @md:text-[26px]">
          <NumberRoll value={visible ? total : 0} locales={locales} duration={1000} />
          <span className="text-[12px] font-normal tracking-normal text-muted-foreground">steps</span>
        </p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground @md:text-[12.5px]">
          <span className="flex items-baseline gap-[0.3em]">
            <NumberRoll value={visible ? average : 0} locales={locales} duration={800} className="text-foreground" />a day
          </span>
          <span className="flex items-baseline gap-[0.3em]">
            Goal met on
            <NumberRoll value={visible ? met : 0} duration={700} className="text-foreground" />
            of {days.length} days
          </span>
        </p>

        <div
          ref={plotRef}
          role="group"
          tabIndex={0}
          aria-label={`${title}, ${week?.label ?? ""}. Use the arrow keys to read each day.`}
          onKeyDown={onKeyDown}
          onBlur={() => keyboard && (setActive(null), setKeyboard(false))}
          onPointerMove={(e) => {
            setKeyboard(false);
            setActive(pointAt(e.clientX));
          }}
          onPointerDown={(e) => setActive(pointAt(e.clientX))}
          onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
          className={`relative mt-4 touch-pan-y @md:mt-5 select-none rounded-lg ${FOCUS}`}
          style={{ height: `calc(var(--plot) + ${LABELS}px)` }}
        >
          {/* The scale: the top and the baseline, and the goal as a line in your primary colour. */}
          {[1, 0].map((f) => (
            <div key={f} aria-hidden="true" className="absolute right-0" style={{ left: 0, top: HEADROOM + (1 - f) * (plotH - HEADROOM) }}>
              <span
                className="absolute left-0 top-0 -translate-y-1/2 text-[10px] leading-none tabular-nums text-muted-foreground/80"
                style={{ width: "calc(var(--gutter) - 8px)", textAlign: "right" }}
              >
                <NumberRoll value={max * f} format={COMPACT} locales={locales} duration={700} />
              </span>
              <div className="border-t border-border" style={{ marginLeft: "var(--gutter)" }} />
            </div>
          ))}
          <div aria-hidden="true" className="absolute right-0" style={{ left: 0, top: goalTop }}>
            <span
              className="absolute left-0 top-0 -translate-y-1/2 text-[10px] font-medium leading-none tabular-nums text-primary"
              style={{ width: "calc(var(--gutter) - 8px)", textAlign: "right" }}
            >
              <NumberRoll value={goal} format={COMPACT} locales={locales} duration={700} />
            </span>
            <div className="border-t border-primary/60" style={{ marginLeft: "var(--gutter)" }} />
          </div>

          <div ref={barsRef} className="absolute inset-y-0 right-0" style={{ left: "var(--gutter)" }}>
            {/* The hovered day: a Tactile lane from the readout down to the baseline. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-[10px] bg-foreground/[0.02] shadow-[inset_0_0_0_1px_var(--border)]"
              style={{
                top: 2,
                height: plotH - 2,
                left: active !== null ? `calc(${active * slot}% + 2px)` : 0,
                width: active !== null ? `calc(${slot}% - 4px)` : 0,
                opacity: active !== null ? 1 : 0,
                transition: reduced ? "none" : `left 380ms ${THROW}, width 380ms ${EASE}, opacity 200ms ${EASE}`,
              }}
            />

            {days.map((d, i) => {
              const made = d.value >= goal;
              const hovered = active === i;
              const order = dir > 0 ? i : days.length - 1 - i;
              const tone = d.today
                ? made
                  ? "bg-primary"
                  : "bg-primary/15 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
                : made
                  ? hovered || active === null
                    ? "bg-primary"
                    : "bg-primary/70"
                  : hovered
                    ? "bg-foreground/25"
                    : active !== null
                      ? "bg-foreground/[0.07]"
                      : "bg-foreground/[0.11]";
              return (
                <div key={d.key} aria-hidden="true" className="absolute top-0 h-full" style={{ left: `${i * slot}%`, width: `${slot}%` }}>
                  <div
                    className={`absolute bottom-[26px] left-1/2 w-[min(24px,58%)] -translate-x-1/2 rounded-t-[4px] ${tone}`}
                    style={{
                      // Days still to come have no bar at all.
                      height: visible && d.value > 0 ? Math.max(2, scale(d.value)) : 0,
                      transition: reduced ? "none" : `height 620ms ${EASE} ${order * 34}ms, background-color 320ms ${EASE}, box-shadow 320ms ${EASE}`,
                    }}
                  />
                  <span
                    className={`absolute inset-x-0 bottom-0 text-center text-[11px] leading-[18px] ${d.today ? "font-medium text-foreground" : "text-muted-foreground"}`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}

            {/* The readout rides the top of the lane: the day morphs, the steps roll. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-[5px] flex h-[22px] -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-background px-2.5 text-[11.5px] shadow-[0_0_0_1px_var(--border)]"
              style={{
                left: active !== null ? `clamp(64px, ${(active + 0.5) * slot}%, calc(100% - 64px))` : "50%",
                opacity: shown ? 1 : 0,
                scale: shown ? "1" : "0.94",
                transition: reduced ? "none" : `left 380ms ${THROW}, opacity 200ms ${EASE}, scale 260ms ${EASE}`,
              }}
            >
              <span className="text-muted-foreground">
                <TextMorph>{shown ? (shown.title ?? shown.label) : " "}</TextMorph>
              </span>
              <span className="font-medium tabular-nums text-foreground">
                <NumberRoll value={shown?.value ?? 0} locales={locales} duration={600} />
              </span>
            </div>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {keyboard && shown ? `${shown.title ?? shown.label}: ${fmt(shown.value)} steps${shown.value >= goal ? ", goal met" : ""}` : ""}
        </p>
        <table className="sr-only">
          <caption>
            {title}, {week?.label}: {fmt(total)} steps, goal {fmt(goal)} a day, met on {met} of {days.length} days
          </caption>
          <tbody>
            {days.map((d) => (
              <tr key={d.key} id={`${id}-${d.key}`}>
                <th scope="row">{d.title ?? d.label}</th>
                <td>
                  {fmt(d.value)}
                  {d.today ? " so far" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
