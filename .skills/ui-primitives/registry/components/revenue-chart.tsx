// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Revenue chart (revenue-chart)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * REVENUE CHART: this year as an area, last year behind it
 *
 *   arrive    the first time it's on screen the chart draws
 *             itself from left to right and the total rolls up
 *             from zero
 *   hover     a Tactile follows the pointer from month to month
 *             with a dot on each line, and the header becomes the
 *             readout: the title morphs to "Revenue in August",
 *             the total rolls to that month, the chip and the
 *             last-year line follow
 *   metric    Revenue, Orders, Average order: the pill is thrown
 *             to the choice and both lines morph into their new
 *             shapes while the scale's labels and the figures roll
 *   partial   a year still under way ends its line with a dot at
 *             the latest month
 *
 * The plot is one tab stop: arrow keys move between months and
 * the readout is announced. Every figure is also in a table for
 * screen readers.
 * ───────────────────────────────────────────────────────── */

export interface RevenueMetric {
  id: string;
  /** In the switch and the title, e.g. "Revenue". */
  label: string;
  /** This year, one value per label; may stop early for a year still under way. */
  current: number[];
  /** Last year, one value per label. */
  previous?: number[];
  /** Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" }. */
  format?: Intl.NumberFormatOptions;
  /** How the headline adds the months up. */
  total?: "sum" | "average";
}

export interface RevenueChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Along the bottom, e.g. ["Jan", "Feb", …]. */
  labels: string[];
  /** In the readout, e.g. ["January", …]. Defaults to labels. */
  titles?: string[];
  /** One or more; more than one shows a switch. */
  metrics: RevenueMetric[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** The two lines' names, for the legend and the readout. */
  series?: [string, string];
  locales?: string | string[];
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const PLOT = 200;
const TOP = 10; // room above the highest point
const GUTTER = 44;
const LABELS = 24;
const PAD = 6;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const LINE = "var(--chart-1, var(--primary))";

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

const STEPS = 4; // gridlines above the baseline

/** A top for the scale that divides into four round steps: 20,600 → 24,000 (6K a step). */
function niceTop(value: number) {
  if (value <= 0) return STEPS;
  const raw = value / STEPS;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return step * STEPS;
}

/** A smooth line through the points that never overshoots them (monotone cubic, as in d3's curveMonotoneX). */
function monotone(points: [number, number][]) {
  const n = points.length;
  if (!n) return "";
  if (n === 1) return `M${points[0][0]},${points[0][1]}`;
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) m.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0] || 1));
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  const r = (v: number) => Math.round(v * 100) / 100;
  let d = `M${r(points[0][0])},${r(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = (x1 - x0) / 3;
    d += `C${r(x0 + dx)},${r(y0 + t[i] * dx)} ${r(x1 - dx)},${r(y1 - t[i + 1] * dx)} ${r(x1)},${r(y1)}`;
  }
  return d;
}

/** Tweens a list of numbers toward a target, so a new metric reshapes the line instead of replacing it. */
function useTween(target: number[], reduced: boolean, duration = 640) {
  const [value, setValue] = React.useState(target);
  const from = React.useRef(target);
  React.useEffect(() => {
    if (reduced) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = from.current;
    const begin = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - begin) / duration);
      const e = 1 - Math.pow(1 - t, 4);
      const next = target.map((v, i) => (start[i] ?? start[start.length - 1] ?? 0) + (v - (start[i] ?? start[start.length - 1] ?? 0)) * e);
      from.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.join(","), reduced]);
  return value;
}

export function RevenueChart({
  labels,
  titles,
  metrics,
  value,
  defaultValue,
  onValueChange,
  series = ["This year", "Last year"],
  locales,
  className = "",
  ...props
}: RevenueChartProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [own, setOwn] = React.useState(defaultValue ?? metrics[0]?.id);
  const metricId = value ?? own;
  const metric = metrics.find((m) => m.id === metricId) ?? metrics[0];
  const current = metric?.current ?? [];
  const previous = metric?.previous ?? [];
  const format = metric?.format;

  const [visible, setVisible] = React.useState(false);
  const [plotH, setPlotH] = React.useState(PLOT);
  const [active, setActive] = React.useState<number | null>(null);
  const [keyboard, setKeyboard] = React.useState(false);
  const [width, setWidth] = React.useState(0);
  const [pill, setPill] = React.useState({ left: 0, width: 0, ready: false });
  const rootRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const plotRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const max = niceTop(Math.max(0, ...current, ...previous));
  const drawnMax = useTween([max], reduced)[0];
  const cur = useTween(current, reduced);
  const prev = useTween(previous, reduced);

  // The plot's height is set by the card's width in CSS; read it so the drawing fits.
  React.useLayoutEffect(() => {
    const el = chartRef.current;
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

  React.useLayoutEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const measure = () => setWidth((w) => (w === el.offsetWidth ? w : el.offsetWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useLayoutEffect(() => {
    const el = chipRefs.current[metrics.findIndex((m) => m.id === metricId)];
    if (!el) return;
    setPill((p) => (p.left === el.offsetLeft && p.width === el.offsetWidth ? p : { left: el.offsetLeft, width: el.offsetWidth, ready: p.width > 0 }));
  }, [metricId, metrics]);

  const n = labels.length;
  const x = (i: number) => PAD + (n > 1 ? (i * (width - PAD * 2)) / (n - 1) : (width - PAD * 2) / 2);
  const y = (v: number) => TOP + (plotH - TOP) * (1 - v / (drawnMax || 1));
  const curPoints = cur.map((v, i) => [x(i), y(v)] as [number, number]);
  const prevPoints = prev.map((v, i) => [x(i), y(v)] as [number, number]);
  const curLine = width ? monotone(curPoints) : "";
  const prevLine = width ? monotone(prevPoints) : "";
  const area = curLine && curPoints.length > 1 ? `${curLine}L${curPoints[curPoints.length - 1][0]},${plotH}L${curPoints[0][0]},${plotH}Z` : "";

  const add = (list: number[]) =>
    metric?.total === "average" ? (list.length ? list.reduce((s, v) => s + v, 0) / list.length : 0) : list.reduce((s, v) => s + v, 0);
  const lastIndex = current.length - 1;
  // Last year over the same months as this year, so a year under way compares like with like.
  const prevSame = previous.slice(0, current.length);
  const headline = active !== null ? (current[active] ?? 0) : add(current);
  const before = active !== null ? previous[active] : prevSame.length ? add(prevSame) : undefined;
  const change = before ? (headline - before) / before : null;
  const [lastChange, setLastChange] = React.useState(change ?? 0);
  if (change !== null && change !== lastChange) setLastChange(change);
  const up = (change ?? lastChange) >= 0;
  const fmt = (v: number) => new Intl.NumberFormat(locales, format).format(v);
  const monthName = (i: number) => titles?.[i] ?? labels[i];
  // "last year" reads as words; "2025" reads as "in 2025".
  const then = (label: string) => (/^\d/.test(label) ? `in ${label}` : label.toLowerCase());
  const compact = { ...format, notation: "compact" as const, minimumFractionDigits: 0, maximumFractionDigits: 1 };
  const every = width && n ? Math.max(1, Math.ceil(34 / (width / n))) : 1;
  // Labels thin out on narrow screens; the hovered one always shows, and its close neighbours step aside for it.
  const label = (i: number) => active === i || ((n - 1 - i) % every === 0 && (active === null || every === 1 || Math.abs(i - active) >= every));

  const choose = (next: string) => {
    if (next === metricId) return;
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  const pointAt = (clientX: number) => {
    const r = plotRef.current?.getBoundingClientRect();
    if (!r || !current.length || n < 2) return null;
    const i = Math.round(((clientX - r.left - PAD) / (r.width - PAD * 2)) * (n - 1));
    return Math.min(lastIndex, Math.max(0, i));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!current.length) return;
    const from = active ?? lastIndex;
    const moves: Record<string, number> = { ArrowLeft: from - 1, ArrowRight: from + 1, Home: 0, End: lastIndex };
    if (e.key === "Escape") return setActive(null);
    if (!(e.key in moves)) return;
    e.preventDefault();
    setKeyboard(true);
    setActive(Math.min(lastIndex, Math.max(0, active === null ? from : moves[e.key])));
  };

  const dot = (i: number | null, values: number[], color: string, key: string) => {
    const on = i !== null && values[i] !== undefined;
    const v = on ? values[i] : (values[values.length - 1] ?? 0);
    return (
      <span
        key={key}
        aria-hidden="true"
        className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_var(--background)]"
        style={{
          left: x(on ? (i as number) : Math.max(0, values.length - 1)),
          top: y(v),
          background: color,
          opacity: on ? 1 : 0,
          scale: on ? "1" : "0.4",
          transition: reduced ? "none" : `left 260ms ${THROW}, top 260ms ${THROW}, opacity 200ms ${EASE}, scale 260ms ${EASE}`,
        }}
      />
    );
  };

  return (
    <div ref={rootRef} className={`@container w-full rounded-[22px] bg-background shadow-[0_0_0_1px_var(--border)] ${className}`} {...props}>
      <div className="p-4 @md:p-5 [--gutter:30px] @md:[--gutter:40px] [--plot:160px] @md:[--plot:200px]">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <p className="text-[12px] text-muted-foreground @md:text-[13px]">
              <TextMorph>{active !== null ? `${metric?.label} in ${monthName(active)}` : (metric?.label ?? "")}</TextMorph>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-[22px] font-medium leading-tight tracking-[-0.03em] @md:text-[26px] text-foreground">
                <NumberRoll value={visible ? headline : 0} format={format} locales={locales} duration={active !== null ? 600 : 1000} />
              </span>
              <span
                className="grid"
                style={{
                  gridTemplateColumns: change !== null ? "1fr" : "0fr",
                  opacity: change !== null ? 1 : 0,
                  transition: reduced ? "none" : `grid-template-columns 380ms ${EASE}, opacity 240ms ${EASE}`,
                }}
              >
                <span className="min-w-0 [clip-path:inset(-4px_-2px)]">
                  <span
                    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-px text-[12.5px] font-medium transition-colors duration-300 ${
                      up ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    <svg
                      viewBox="0 0 12 12"
                      aria-hidden="true"
                      className="size-3"
                      style={{ transform: up ? "none" : "rotate(180deg)", transition: reduced ? "none" : `transform 420ms ${THROW}` }}
                    >
                      <path
                        d="M6 9.5V2.5M2.8 5.6 6 2.5l3.2 3.1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <NumberRoll value={visible ? Math.abs(change ?? lastChange) : 0} format={{ style: "percent", maximumFractionDigits: 1 }} duration={700} />
                  </span>
                </span>
              </span>
            </p>
            {before !== undefined && (
              <p className="mt-1 flex items-baseline gap-[0.3em] whitespace-nowrap text-[11.5px] text-muted-foreground @md:text-[12.5px]">
                <NumberRoll value={visible ? before : 0} format={format} locales={locales} duration={700} />
                <TextMorph>
                  {active !== null ? `in ${monthName(active)} ${/^\d/.test(series[1]) ? series[1] : series[1].toLowerCase()}` : then(series[1])}
                </TextMorph>
              </p>
            )}
          </div>

          {metrics.length > 1 && (
            <div role="radiogroup" aria-label="Measure" className="relative inline-flex shrink-0 rounded-full bg-muted p-0.5">
              <span
                aria-hidden="true"
                className="absolute inset-y-0.5 left-0 rounded-full bg-background shadow-[0_0_0_1px_var(--border)]"
                style={{
                  width: pill.width,
                  transform: `translateX(${pill.left}px)`,
                  transition: pill.ready && !reduced ? `transform 460ms ${THROW}, width 380ms ${EASE}` : "none",
                }}
              />
              {metrics.map((m, i) => {
                const selected = m.id === metricId;
                return (
                  <button
                    key={m.id}
                    ref={(el) => {
                      chipRefs.current[i] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => choose(m.id)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                      e.preventDefault();
                      const next = (i + (e.key === "ArrowRight" ? 1 : -1) + metrics.length) % metrics.length;
                      choose(metrics[next].id);
                      chipRefs.current[next]?.focus();
                    }}
                    className={`cursor-pointer relative h-6 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-medium @md:h-7 @md:px-3 @md:text-[12.5px] transition-colors duration-300 ${FOCUS} ${
                      selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* The legend: a line key for each, so the two never rely on colour alone. */}
        <div className="mt-3 flex items-center gap-4 text-[11.5px] text-muted-foreground @md:mt-4 @md:text-[12px]">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-3.5 rounded-full" style={{ background: LINE }} />
            {series[0]}
          </span>
          {previous.length > 0 && (
            <span className="flex items-center gap-1.5">
              <svg aria-hidden="true" width="14" height="2" className="text-foreground/35">
                <line x1="1" y1="1" x2="13" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
              </svg>
              {series[1]}
            </span>
          )}
        </div>

        <div ref={chartRef} className="relative mt-3" style={{ height: `calc(var(--plot) + ${LABELS}px)` }}>
          {/* The scale: rolling labels in the gutter and solid Tactiles. */}
          {Array.from({ length: STEPS + 1 }, (_, k) => 1 - k / STEPS).map((f) => (
            <div key={f} aria-hidden="true" className="absolute inset-x-0" style={{ top: TOP + (plotH - TOP) * (1 - f) }}>
              <span
                className="absolute left-0 top-0 -translate-y-1/2 text-[10px] leading-none tabular-nums text-muted-foreground/80"
                style={{ width: "calc(var(--gutter) - 8px)", textAlign: "right" }}
              >
                <NumberRoll value={visible ? max * f : 0} format={compact} locales={locales} duration={700} />
              </span>
              <div className="border-t border-border" style={{ marginLeft: "var(--gutter)" }} />
            </div>
          ))}

          <div
            ref={plotRef}
            role="group"
            tabIndex={0}
            aria-label={`${metric?.label ?? ""}, ${series[0]} against ${series[1]}. Use the arrow keys to read each month.`}
            onKeyDown={onKeyDown}
            onBlur={() => keyboard && (setActive(null), setKeyboard(false))}
            onPointerMove={(e) => {
              setKeyboard(false);
              setActive(pointAt(e.clientX));
            }}
            onPointerDown={(e) => setActive(pointAt(e.clientX))}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            className={`absolute inset-y-0 right-0 touch-pan-y select-none rounded-lg ${FOCUS}`}
            style={{ left: "var(--gutter)" }}
          >
            {/* Everything drawn reveals left to right the first time it's seen. */}
            <div
              className="absolute inset-x-0 top-0"
              style={{
                height: plotH,
                clipPath: visible ? "inset(-8px -8px -8px -8px)" : "inset(-8px 100% -8px -8px)",
                transition: reduced ? "none" : `clip-path 1200ms ${EASE}`,
              }}
            >
              <svg aria-hidden="true" width={width} height={plotH} className="absolute inset-0 overflow-visible">
                <defs>
                  <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={LINE} stopOpacity="0.14" />
                    <stop offset="100%" stopColor={LINE} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {prevLine && (
                  <path
                    d={prevLine}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-foreground/30"
                  />
                )}
                {area && <path d={area} fill={`url(#${id}-wash)`} />}
                {curLine && <path d={curLine} fill="none" stroke={LINE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
              {/* The end of a year still under way. */}
              {current.length > 0 && current.length < n && (
                <span
                  aria-hidden="true"
                  className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_var(--background)]"
                  style={{
                    left: x(lastIndex),
                    top: y(cur[lastIndex] ?? 0),
                    background: LINE,
                    opacity: active === null ? 1 : 0,
                    transition: `opacity 200ms ${EASE}`,
                  }}
                />
              )}
            </div>

            {/* The hovered month: a Tactile down to the baseline and a dot on each line. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-0 w-px bg-foreground/20"
              style={{
                height: plotH,
                left: active !== null ? x(active) : 0,
                opacity: active !== null ? 1 : 0,
                transition: reduced ? "none" : `left 260ms ${THROW}, opacity 200ms ${EASE}`,
              }}
            />
            {previous.length > 0 && dot(active, prev, "color-mix(in oklab, var(--foreground) 45%, var(--background))", "prev")}
            {dot(active, cur, LINE, "cur")}

            {labels.map((l, i) => (
              <span
                key={l + i}
                aria-hidden="true"
                className={`absolute -translate-x-1/2 whitespace-nowrap text-[11px] leading-none transition-colors duration-200 ${active === i ? "text-foreground" : "text-muted-foreground"}`}
                style={{ left: x(i), top: plotH + 9, opacity: label(i) ? 1 : 0 }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {keyboard && active !== null
            ? `${monthName(active)}: ${fmt(current[active] ?? 0)}${previous[active] !== undefined ? `, ${series[1].toLowerCase()} ${fmt(previous[active])}` : ""}`
            : ""}
        </p>
        <table className="sr-only">
          <caption>
            {metric?.label}: {fmt(add(current))} {series[0].toLowerCase()}
            {prevSame.length ? `, ${fmt(add(prevSame))} ${series[1].toLowerCase()} over the same months` : ""}
          </caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">{series[0]}</th>
              {previous.length > 0 && <th scope="col">{series[1]}</th>}
            </tr>
          </thead>
          <tbody>
            {labels.map((l, i) => (
              <tr key={l + i}>
                <th scope="row">{monthName(i)}</th>
                <td>{current[i] !== undefined ? fmt(current[i]) : "–"}</td>
                {previous.length > 0 && <td>{previous[i] !== undefined ? fmt(previous[i]) : "–"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
