// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Stage bars (stage-bars)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";

/* ─────────────────────────────────────────────────────────
 * STAGE BARS: a funnel you can read at a glance
 *
 *   arrive    the first time it's on screen the bars grow from
 *             the left one after another and every count and
 *             share rolls up from zero
 *   period    This week, Last week, 30 days: the pill is thrown
 *             to the choice, every bar eases to its new width and
 *             every figure rolls; the drop-off between stages
 *             rolls with them
 *   focus     point at a stage and the others dim, leaving it and
 *             the drop-off into it to read
 *
 * One hue that steps lighter down the funnel, every value
 * labelled on its row, and the whole funnel in a table for
 * screen readers.
 * ───────────────────────────────────────────────────────── */

export interface Stage {
  id: string;
  label: string;
}

export interface StagePeriod {
  id: string;
  /** In the switch, e.g. "This week". */
  label: string;
  /** One count per stage, in the same order. */
  values: number[];
}

export interface StageBarsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  title?: string;
  stages: Stage[];
  periods: StagePeriod[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  format?: Intl.NumberFormatOptions;
  locales?: string | string[];
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const HUE = "var(--chart-1, var(--primary))";

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

export function StageBars({
  title = "Funnel",
  stages,
  periods,
  value,
  defaultValue,
  onValueChange,
  format,
  locales,
  className = "",
  ...props
}: StageBarsProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [own, setOwn] = React.useState(defaultValue ?? periods[0]?.id);
  const periodId = value ?? own;
  const period = periods.find((p) => p.id === periodId) ?? periods[0];
  const values = period?.values ?? [];
  const first = values[0] || 1;

  const [visible, setVisible] = React.useState(false);
  const [focused, setFocused] = React.useState<number | null>(null);
  const [pill, setPill] = React.useState({ left: 0, width: 0, ready: false });
  const rootRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

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

  React.useLayoutEffect(() => {
    const el = chipRefs.current[periods.findIndex((p) => p.id === periodId)];
    if (!el) return;
    setPill((p) => (p.left === el.offsetLeft && p.width === el.offsetWidth ? p : { left: el.offsetLeft, width: el.offsetWidth, ready: p.width > 0 }));
  }, [periodId, periods]);

  const choose = (next: string) => {
    if (next === periodId) return;
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const fmt = (v: number) => new Intl.NumberFormat(locales, format).format(v);
  const overall = values.length > 1 ? (values[values.length - 1] ?? 0) / first : 1;

  return (
    <div ref={rootRef} className={`@container w-full rounded-[22px] bg-background shadow-[0_0_0_1px_var(--border)] ${className}`} {...props}>
      <div className="p-4 @md:p-5 [--gutter:30px] @md:[--gutter:40px]">
        {/* The title and its control share a row; the figures sit under both. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="text-[12px] text-muted-foreground @md:text-[13px]">{title}</p>
          {periods.length > 1 && (
            <div role="radiogroup" aria-label="Period" className="relative -my-1 inline-flex shrink-0 rounded-full bg-muted p-0.5">
              <span
                aria-hidden="true"
                className="absolute inset-y-0.5 left-0 rounded-full bg-background shadow-[0_0_0_1px_var(--border)]"
                style={{
                  width: pill.width,
                  transform: `translateX(${pill.left}px)`,
                  transition: pill.ready && !reduced ? `transform 460ms ${THROW}, width 380ms ${EASE}` : "none",
                }}
              />
              {periods.map((p, i) => {
                const selected = p.id === periodId;
                return (
                  <button
                    key={p.id}
                    ref={(el) => {
                      chipRefs.current[i] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => choose(p.id)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                      e.preventDefault();
                      const next = (i + (e.key === "ArrowRight" ? 1 : -1) + periods.length) % periods.length;
                      choose(periods[next].id);
                      chipRefs.current[next]?.focus();
                    }}
                    className={`cursor-pointer relative h-6 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-medium @md:h-7 @md:px-3 @md:text-[12.5px] transition-colors duration-300 ${FOCUS} ${
                      selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <p className="mt-0.5 flex items-baseline gap-1.5 text-[22px] font-medium leading-tight tracking-[-0.03em] @md:text-[26px] text-foreground">
          <NumberRoll value={visible ? overall : 0} format={{ style: "percent", maximumFractionDigits: 1 }} duration={1000} />
          <span className="text-[13px] font-normal tracking-normal text-muted-foreground">made it all the way</span>
        </p>

        <ol className="mt-4 @md:mt-6" onPointerLeave={() => setFocused(null)}>
          {stages.map((s, i) => {
            const v = values[i] ?? 0;
            const share = v / first;
            const step = i > 0 && values[i - 1] ? v / values[i - 1] : 1;
            const dim = focused !== null && focused !== i;
            // One hue, a step lighter for each stage further down.
            const strength = 1 - (stages.length > 1 ? (i / (stages.length - 1)) * 0.5 : 0);
            return (
              <li key={s.id}>
                {i > 0 && (
                  <p
                    aria-hidden="true"
                    className="flex h-5 items-center gap-1 pl-1 text-[10.5px] tabular-nums @md:h-6 @md:text-[11.5px] text-muted-foreground transition-opacity duration-300"
                    style={{ opacity: dim && focused !== i - 1 ? 0.35 : 1 }}
                  >
                    <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
                      <path d="M6 2.5v7M3 6.6 6 9.5l3-2.9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <NumberRoll value={visible ? step : 0} format={{ style: "percent", maximumFractionDigits: 0 }} duration={800} />
                    <span>carried on</span>
                  </p>
                )}
                <div onPointerEnter={() => setFocused(i)} className={`transition-opacity duration-300 ${dim ? "opacity-40" : ""}`}>
                  <div className="flex items-baseline justify-between gap-3 text-[12.5px] @md:text-[13px]">
                    <span className="truncate text-foreground">{s.label}</span>
                    <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                      <span className="font-medium text-foreground">
                        <NumberRoll value={visible ? v : 0} format={format} locales={locales} duration={900} />
                      </span>
                      <span className="w-10 text-right text-[11px] text-muted-foreground @md:w-11 @md:text-[12px]">
                        <NumberRoll value={visible ? share : 0} format={{ style: "percent", maximumFractionDigits: share < 0.1 ? 1 : 0 }} duration={900} />
                      </span>
                    </span>
                  </div>
                  <div className="relative mt-1 h-3.5 @md:mt-1.5 @md:h-[18px]">
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 rounded-r-[4px]"
                      style={{
                        width: `${visible ? Math.max(0.5, share * 100) : 0}%`,
                        background: `color-mix(in oklab, ${HUE} ${Math.round(strength * 100)}%, var(--background))`,
                        transition: reduced ? "none" : `width 820ms ${EASE} ${visible ? i * 90 : 0}ms`,
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <table className="sr-only">
          <caption>
            {title}, {period?.label}: {Math.round(overall * 1000) / 10}% made it from {stages[0]?.label.toLowerCase()} to{" "}
            {stages[stages.length - 1]?.label.toLowerCase()}
          </caption>
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col">Count</th>
              <th scope="col">Share of the first stage</th>
              <th scope="col">Share of the stage before</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s, i) => (
              <tr key={s.id} id={`${id}-${s.id}`}>
                <th scope="row">{s.label}</th>
                <td>{fmt(values[i] ?? 0)}</td>
                <td>{Math.round(((values[i] ?? 0) / first) * 1000) / 10}%</td>
                <td>{i > 0 && values[i - 1] ? `${Math.round(((values[i] ?? 0) / values[i - 1]) * 1000) / 10}%` : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
