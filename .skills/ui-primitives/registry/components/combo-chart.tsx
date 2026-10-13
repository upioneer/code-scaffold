// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Combo chart (combo-chart)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * COMBO CHART: every day as a bar, the trend as a line, one scale
 *
 *   arrive    the first time it's on screen the bars grow up out
 *             of the baseline in a wave and the average draws
 *             itself across them; the figures roll up from zero
 *   hover     the bar under the pointer fills while the rest
 *             dim, the line's dot slides along it and pings once
 *             where it lands, and the header becomes the readout:
 *             the title morphs to the day, the total rolls to its
 *             count, the line below to its average
 *   tiles     the best day, the daily average and the quietest
 *             day, each rolling up on arrival
 *
 * Bars and line share one scale (never two axes), so the line
 * reads in the same units as the bars. The plot is one tab stop:
 * arrow keys move between days and the readout is announced.
 * Every figure is also in a table for screen readers.
 * ───────────────────────────────────────────────────────── */

export interface ComboDay {
  key: string;
  /** Under the bar, e.g. "2 Oct". */
  label: string;
  value: number;
  /** In the readout, e.g. "Thursday 2 October". Defaults to label. */
  title?: string;
}

export interface ComboChartProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  days: ComboDay[];
  /** The line: a rolling average over this many days. */
  rolling?: number;
  /** Your own line values instead (e.g. an average that includes days before the first bar). */
  average?: number[];
  /** The total of the period before, for the change chip. */
  previous?: number;
  /** The two marks' names, for the legend and the readout. */
  series?: [string, string];
  format?: Intl.NumberFormatOptions;
  locales?: string | string[];
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const PLOT = 190;
const TOP = 10;
const GUTTER = 40;
const LABELS = 24;
const STEPS = 4;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const BAR = "var(--chart-1, var(--primary))";
const LINE = "var(--chart-2, #e8743b)";

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

function niceTop(value: number) {
  if (value <= 0) return STEPS;
  const raw = value / STEPS;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return step * STEPS;
}

function monotone(points: [number, number][]) {
  const n = points.length;
  if (!n) return "";
  const r = (v: number) => Math.round(v * 100) / 100;
  if (n === 1) return `M${r(points[0][0])},${r(points[0][1])}`;
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
  let d = `M${r(points[0][0])},${r(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = (x1 - x0) / 3;
    d += `C${r(x0 + dx)},${r(y0 + t[i] * dx)} ${r(x1 - dx)},${r(y1 - t[i + 1] * dx)} ${r(x1)},${r(y1)}`;
  }
  return d;
}

export function ComboChart({
  title = "Orders",
  days,
  rolling = 7,
  average: averageProp,
  previous,
  series = ["Orders", "7-day average"],
  format,
  locales,
  className = "",
  ...props
}: ComboChartProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [visible, setVisible] = React.useState(false);
  const [plotH, setPlotH] = React.useState(PLOT);
  const [active, setActive] = React.useState<number | null>(null);
  const [keyboard, setKeyboard] = React.useState(false);
  const [width, setWidth] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const plotRef = React.useRef<HTMLDivElement>(null);
  const pingRef = React.useRef<HTMLSpanElement>(null);

  const n = days.length;
  const values = days.map((d) => d.value);
  // A rolling average over the days available (the first few average over fewer days).
  const average = React.useMemo(
    () =>
      averageProp ??
      values.map((_, i) => {
        const from = Math.max(0, i - rolling + 1);
        const run = values.slice(from, i + 1);
        return run.reduce((s, v) => s + v, 0) / run.length;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [averageProp, values.join(","), rolling],
  );
  const max = niceTop(Math.max(0, ...values, ...average));
  const total = values.reduce((s, v) => s + v, 0);
  const daily = n ? total / n : 0;
  const best = values.indexOf(Math.max(...values));
  const quiet = values.indexOf(Math.min(...values));
  const change = previous ? (total - previous) / previous : null;

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

  // The dot pings once each time it lands on a new day.
  React.useEffect(() => {
    if (active === null || reduced) return;
    const ring = pingRef.current;
    if (!ring) return;
    const timer = window.setTimeout(() => {
      ring.animate(
        [
          { transform: "translate(-50%, -50%) scale(1)", opacity: 0.45 },
          { transform: "translate(-50%, -50%) scale(2.6)", opacity: 0 },
        ],
        { duration: 640, easing: "cubic-bezier(0.22,1,0.36,1)" },
      );
    }, 180);
    return () => window.clearTimeout(timer);
  }, [active, reduced]);

  const slot = n ? width / n : 0;
  const cx = (i: number) => (i + 0.5) * slot;
  const y = (v: number) => TOP + (plotH - TOP) * (1 - v / max);
  const line = width ? monotone(average.map((v, i) => [cx(i), y(v)] as [number, number])) : "";
  const barWidth = Math.max(3, Math.min(24, slot * 0.62));

  const pointAt = (clientX: number) => {
    const r = plotRef.current?.getBoundingClientRect();
    if (!r || !n) return null;
    return Math.min(n - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * n)));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!n) return;
    const from = active ?? n - 1;
    const moves: Record<string, number> = { ArrowLeft: from - 1, ArrowRight: from + 1, Home: 0, End: n - 1 };
    if (e.key === "Escape") return setActive(null);
    if (!(e.key in moves)) return;
    e.preventDefault();
    setKeyboard(true);
    setActive(Math.min(n - 1, Math.max(0, active === null ? from : moves[e.key])));
  };

  const fmt = (v: number) => new Intl.NumberFormat(locales, { maximumFractionDigits: 0, ...format }).format(v);
  const name = (i: number) => days[i]?.title ?? days[i]?.label ?? "";
  const every = width && n ? Math.max(1, Math.ceil(44 / (width / n))) : 1;
  // Labels thin out on narrow screens; the hovered one always shows, and its close neighbours step aside for it.
  const label = (i: number) => active === i || ((n - 1 - i) % every === 0 && (active === null || every === 1 || Math.abs(i - active) >= every));
  const whole = { maximumFractionDigits: 0, ...format };
  const compact: Intl.NumberFormatOptions = { ...format, notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 1 };

  return (
    <div ref={rootRef} className={`@container w-full rounded-[22px] bg-background shadow-[0_0_0_1px_var(--border)] ${className}`} {...props}>
      <div className="p-4 @md:p-5 [--gutter:30px] @md:[--gutter:40px] [--plot:150px] @md:[--plot:190px]">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <p className="text-[12px] text-muted-foreground @md:text-[13px]">
              <TextMorph>{active !== null ? `${title} on ${name(active)}` : title}</TextMorph>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-[22px] font-medium leading-tight tracking-[-0.03em] @md:text-[26px] text-foreground">
                <NumberRoll
                  value={visible ? (active !== null ? values[active] : total) : 0}
                  format={whole}
                  locales={locales}
                  duration={active !== null ? 600 : 1000}
                />
              </span>
              {change !== null && (
                <span
                  className="grid"
                  style={{
                    gridTemplateColumns: active === null ? "1fr" : "0fr",
                    opacity: active === null ? 1 : 0,
                    transition: reduced ? "none" : `grid-template-columns 380ms ${EASE}, opacity 220ms ${EASE}`,
                  }}
                >
                  <span className="min-w-0 [clip-path:inset(-4px_-2px)]">
                    <span
                      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-px text-[12.5px] font-medium ${
                        change >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3" style={{ transform: change >= 0 ? "none" : "rotate(180deg)" }}>
                        <path
                          d="M6 9.5V2.5M2.8 5.6 6 2.5l3.2 3.1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <NumberRoll value={visible ? Math.abs(change) : 0} format={{ style: "percent", maximumFractionDigits: 1 }} duration={700} />
                    </span>
                  </span>
                </span>
              )}
            </p>
            <p className="mt-1 flex items-baseline gap-[0.3em] whitespace-nowrap text-[11.5px] text-muted-foreground @md:text-[12.5px]">
              <NumberRoll value={visible ? (active !== null ? average[active] : daily) : 0} format={whole} locales={locales} duration={700} />
              <TextMorph>{active !== null ? `on the ${series[1].toLowerCase()}` : "a day on average"}</TextMorph>
            </p>
          </div>
        </div>

        {/* The legend: a bar key and a line key, so the two read by shape as well as colour. */}
        <div className="mt-3 flex items-center gap-4 text-[11.5px] text-muted-foreground @md:mt-4 @md:text-[12px]">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2 rounded-t-[2px]" style={{ background: BAR }} />
            {series[0]}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-3.5 rounded-full" style={{ background: LINE }} />
            {series[1]}
          </span>
        </div>

        <div ref={chartRef} className="relative mt-3" style={{ height: `calc(var(--plot) + ${LABELS}px)` }}>
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
            aria-label={`${title}: ${series[0]} with the ${series[1].toLowerCase()}. Use the arrow keys to read each day.`}
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
            {days.map((d, i) => {
              const hovered = active === i;
              return (
                <React.Fragment key={d.key}>
                  <span
                    aria-hidden="true"
                    className="absolute rounded-t-[4px]"
                    style={{
                      left: cx(i) - barWidth / 2,
                      width: barWidth,
                      top: TOP,
                      height: plotH - TOP,
                      transformOrigin: "bottom",
                      // The bar is drawn full height and scaled, so its 4px rounded top stays round while it grows.
                      clipPath: `inset(${visible ? ((plotH - TOP) * (1 - d.value / max)).toFixed(1) : plotH - TOP}px 0 0 0 round 4px 4px 0 0)`,
                      background: BAR,
                      opacity: hovered ? 1 : active !== null ? 0.18 : 0.32,
                      transition: reduced ? "none" : `clip-path 640ms ${EASE} ${Math.min(i, 40) * 14}ms, opacity 240ms ${EASE}`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className={`absolute -translate-x-1/2 whitespace-nowrap text-[11px] leading-none transition-colors duration-200 ${hovered ? "text-foreground" : "text-muted-foreground"}`}
                    style={{ left: cx(i), top: plotH + 9, opacity: label(i) ? 1 : 0 }}
                  >
                    {d.label}
                  </span>
                </React.Fragment>
              );
            })}

            <div
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{
                height: plotH,
                clipPath: visible ? "inset(-8px -8px -8px -8px)" : "inset(-8px 100% -8px -8px)",
                transition: reduced ? "none" : `clip-path 1100ms ${EASE} 260ms`,
              }}
            >
              <svg aria-hidden="true" width={width} height={plotH} className="absolute inset-0 overflow-visible">
                {line && <path d={line} fill="none" stroke={LINE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            </div>

            {/* The line's dot, and the ring that pings when it lands. */}
            {[pingRef, null].map((ref, k) => (
              <span
                key={k}
                ref={ref ?? undefined}
                aria-hidden="true"
                className={`pointer-events-none absolute size-2.5 rounded-full ${ref ? "" : "shadow-[0_0_0_2px_var(--background)]"}`}
                style={{
                  left: cx(active ?? n - 1),
                  top: y(average[active ?? n - 1] ?? 0),
                  transform: "translate(-50%, -50%)",
                  background: LINE,
                  opacity: active !== null ? (ref ? 0 : 1) : 0,
                  transition: reduced ? "none" : `left 260ms ${THROW}, top 260ms ${THROW}, opacity 200ms ${EASE}`,
                }}
              />
            ))}
          </div>
        </div>

        {/* The day's highlights as a compact strip under a Tactile. */}
        <dl className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border pt-2.5 @md:mt-5 @md:pt-3">
          {[
            { label: "Best day", value: values[best] ?? 0, note: days[best]?.label },
            { label: "Daily average", value: daily, note: `over ${n} days` },
            { label: "Quietest day", value: values[quiet] ?? 0, note: days[quiet]?.label },
          ].map((t) => (
            <div key={t.label} className="min-w-0 px-2.5 first:pl-0 last:pr-0 @md:px-3.5">
              <dt className="truncate text-[11px] text-muted-foreground @md:text-[11.5px]">{t.label}</dt>
              <dd className="mt-0.5 text-[13.5px] font-medium tracking-[-0.01em] text-foreground @md:text-[14.5px]">
                <NumberRoll value={visible ? t.value : 0} format={whole} locales={locales} duration={800} />
              </dd>
              <dd className="truncate text-[10.5px] text-muted-foreground @md:text-[11px]">{t.note}</dd>
            </div>
          ))}
        </dl>

        <p aria-live="polite" className="sr-only">
          {keyboard && active !== null ? `${name(active)}: ${fmt(values[active])}, ${series[1].toLowerCase()} ${fmt(average[active])}` : ""}
        </p>
        <table className="sr-only">
          <caption>
            {title}: {fmt(total)} over {n} days
          </caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">{series[0]}</th>
              <th scope="col">{series[1]}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d, i) => (
              <tr key={d.key} id={`${id}-${d.key}`}>
                <th scope="row">{name(i)}</th>
                <td>{fmt(d.value)}</td>
                <td>{fmt(average[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
