// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Area chart (area-chart)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * AREA CHART: several series, stacked, overlapping or as shares
 *
 *   arrive    the first time it's on screen the chart draws
 *             itself from left to right and every figure rolls
 *             up from zero
 *   layout    Stacked, Overlap, 100%: the pill is thrown to the
 *             choice and every band morphs to its new place, the
 *             scale rolling to counts or percentages
 *   toggle    the tiles are the legend: press one and its band
 *             shrinks away while the others settle into the room,
 *             press it again and it grows back. Colours stay with
 *             their series
 *   hover     a Tactile follows the pointer with a dot on each
 *             band, and the tiles become the readout: the period
 *             morphs to that week and every figure rolls to it
 *
 * The plot is one tab stop: arrow keys move between points and
 * the readout is announced. The tiles are toggle buttons. Every
 * figure is also in a table for screen readers.
 * ───────────────────────────────────────────────────────── */

export interface AreaSeries {
  id: string;
  label: string;
  /** One value per label. */
  values: number[];
}

export type AreaLayout = "stacked" | "overlap" | "percent";

export interface AreaChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  title?: string;
  /** Under the total, e.g. "orders in the last 12 weeks". */
  caption?: string;
  /** Along the bottom, one per point. */
  labels: string[];
  /** In the readout, e.g. "Week of 28 Sept". Defaults to labels. */
  titles?: string[];
  /** Up to five, in a fixed colour order (--chart-1 to --chart-5). */
  series: AreaSeries[];
  layout?: AreaLayout;
  defaultLayout?: AreaLayout;
  onLayoutChange?: (layout: AreaLayout) => void;
  format?: Intl.NumberFormatOptions;
  locales?: string | string[];
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const PLOT = 200;
const TOP = 10;
const GUTTER = 44;
const LABELS = 24;
const PAD = 6;
const STEPS = 4;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const COLORS = ["var(--chart-1, var(--primary))", "var(--chart-2, #e8743b)", "var(--chart-3, #1baf7a)", "var(--chart-4, #8b6fe8)", "var(--chart-5, #e0a21b)"];
const LAYOUTS: { id: AreaLayout; label: string }[] = [
  { id: "stacked", label: "Stacked" },
  { id: "overlap", label: "Overlap" },
  { id: "percent", label: "100%" },
];

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

/** A smooth line through the points that never overshoots them (monotone cubic). Works left to right or right to left. */
function monotone(points: [number, number][], move = true) {
  const n = points.length;
  if (!n) return "";
  const r = (v: number) => Math.round(v * 100) / 100;
  const head = `${move ? "M" : "L"}${r(points[0][0])},${r(points[0][1])}`;
  if (n === 1) return head;
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
  let d = head;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = (x1 - x0) / 3;
    d += `C${r(x0 + dx)},${r(y0 + t[i] * dx)} ${r(x1 - dx)},${r(y1 - t[i + 1] * dx)} ${r(x1)},${r(y1)}`;
  }
  return d;
}

/** Tweens a list of numbers toward a target, so bands reshape instead of being replaced. */
function useTween(target: number[], reduced: boolean, duration = 620) {
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
      const next = target.map((v, i) => (start[i] ?? 0) + (v - (start[i] ?? 0)) * e);
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

export function AreaChart({
  title = "Orders",
  caption,
  labels,
  titles,
  series: allSeries,
  layout: layoutProp,
  defaultLayout = "stacked",
  onLayoutChange,
  format,
  locales,
  className = "",
  ...props
}: AreaChartProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const series = allSeries.slice(0, COLORS.length);
  const [ownLayout, setOwnLayout] = React.useState<AreaLayout>(defaultLayout);
  const layout = layoutProp ?? ownLayout;
  const [hidden, setHidden] = React.useState<Set<string>>(() => new Set());
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

  const n = labels.length;
  const on = (s: AreaSeries) => !hidden.has(s.id);
  // Each series as a band [lower, upper] at every point, in the layout's units; a hidden series is a band of no height.
  const bands = React.useMemo(() => {
    const shown = series.map((s) => (on(s) ? s.values : s.values.map(() => 0)));
    const sums = labels.map((_, i) => shown.reduce((sum, v) => sum + (v[i] ?? 0), 0));
    let running = labels.map(() => 0);
    return shown.map((values) => {
      if (layout === "overlap") return { lower: labels.map(() => 0), upper: labels.map((_, i) => values[i] ?? 0) };
      const lower = running;
      const upper = labels.map((_, i) => lower[i] + (layout === "percent" ? (sums[i] ? (values[i] ?? 0) / sums[i] : 0) : (values[i] ?? 0)));
      running = upper;
      return { lower, upper };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, labels, layout, hidden]);
  const max = layout === "percent" ? 1 : niceTop(Math.max(0, ...bands.flatMap((b) => b.upper)));
  const flat = useTween([max, ...bands.flatMap((b) => [...b.lower, ...b.upper])], reduced);
  const drawnMax = flat[0] || 1;
  const drawn = bands.map((_, s) => ({
    lower: flat.slice(1 + s * 2 * n, 1 + s * 2 * n + n),
    upper: flat.slice(1 + s * 2 * n + n, 1 + (s + 1) * 2 * n),
  }));

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
    const el = chipRefs.current[LAYOUTS.findIndex((l) => l.id === layout)];
    if (!el) return;
    setPill((p) => (p.left === el.offsetLeft && p.width === el.offsetWidth ? p : { left: el.offsetLeft, width: el.offsetWidth, ready: p.width > 0 }));
  }, [layout]);

  const x = (i: number) => PAD + (n > 1 ? (i * (width - PAD * 2)) / (n - 1) : (width - PAD * 2) / 2);
  const y = (v: number) => TOP + (plotH - TOP) * (1 - v / drawnMax);

  const choose = (next: AreaLayout) => {
    if (next === layout) return;
    if (layoutProp === undefined) setOwnLayout(next);
    onLayoutChange?.(next);
  };
  const toggle = (sid: string) =>
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(sid)) next.delete(sid);
      // Keep at least one series showing.
      else if (series.filter((s) => !next.has(s.id)).length > 1) next.add(sid);
      return next;
    });
  const pointAt = (clientX: number) => {
    const r = plotRef.current?.getBoundingClientRect();
    if (!r || n < 2) return null;
    return Math.min(n - 1, Math.max(0, Math.round(((clientX - r.left - PAD) / (r.width - PAD * 2)) * (n - 1))));
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

  const fmt = (v: number) => new Intl.NumberFormat(locales, format).format(v);
  const totalOf = (s: AreaSeries) => (active !== null ? (s.values[active] ?? 0) : s.values.reduce((sum, v) => sum + v, 0));
  const shownTotal = series.filter(on).reduce((sum, s) => sum + totalOf(s), 0);
  const scaleFormat: Intl.NumberFormatOptions =
    layout === "percent" ? { style: "percent" } : { ...format, notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 1 };
  const every = width && n ? Math.max(1, Math.ceil(40 / (width / n))) : 1;
  // Labels thin out on narrow screens; the hovered one always shows, and its close neighbours step aside for it.
  const label = (i: number) => active === i || ((n - 1 - i) % every === 0 && (active === null || every === 1 || Math.abs(i - active) >= every));
  const name = (i: number) => titles?.[i] ?? labels[i];

  return (
    <div ref={rootRef} className={`@container w-full rounded-[22px] bg-background shadow-[0_0_0_1px_var(--border)] ${className}`} {...props}>
      <div className="p-4 @md:p-5 [--gutter:30px] @md:[--gutter:40px] [--plot:160px] @md:[--plot:200px]">
        {/* The title and its control share a row; the figures sit under both. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="text-[12px] text-muted-foreground @md:text-[13px]">{title}</p>
          <div role="radiogroup" aria-label="Layout" className="relative -my-1 inline-flex shrink-0 rounded-full bg-muted p-0.5">
            <span
              aria-hidden="true"
              className="absolute inset-y-0.5 left-0 rounded-full bg-background shadow-[0_0_0_1px_var(--border)]"
              style={{
                width: pill.width,
                transform: `translateX(${pill.left}px)`,
                transition: pill.ready && !reduced ? `transform 460ms ${THROW}, width 380ms ${EASE}` : "none",
              }}
            />
            {LAYOUTS.map((l, i) => {
              const selected = l.id === layout;
              return (
                <button
                  key={l.id}
                  ref={(el) => {
                    chipRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => choose(l.id)}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                    e.preventDefault();
                    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + LAYOUTS.length) % LAYOUTS.length;
                    choose(LAYOUTS[next].id);
                    chipRefs.current[next]?.focus();
                  }}
                  className={`cursor-pointer relative h-6 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-medium @md:h-7 @md:px-3 @md:text-[12.5px] transition-colors duration-300 ${FOCUS} ${
                    selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-0.5 text-[22px] font-medium leading-tight tracking-[-0.03em] @md:text-[26px] text-foreground">
          <NumberRoll value={visible ? shownTotal : 0} format={format} locales={locales} duration={active !== null ? 600 : 1000} />
        </p>
        <p className="mt-1 whitespace-nowrap text-[11.5px] text-muted-foreground @md:text-[12.5px]">
          <TextMorph>{active !== null ? name(active) : (caption ?? " ")}</TextMorph>
        </p>

        <div ref={chartRef} className="relative mt-4 @md:mt-5" style={{ height: `calc(var(--plot) + ${LABELS}px)` }}>
          {Array.from({ length: STEPS + 1 }, (_, k) => 1 - k / STEPS).map((f) => (
            <div key={f} aria-hidden="true" className="absolute inset-x-0" style={{ top: TOP + (plotH - TOP) * (1 - f) }}>
              <span
                className="absolute left-0 top-0 -translate-y-1/2 text-[10px] leading-none tabular-nums text-muted-foreground/80"
                style={{ width: "calc(var(--gutter) - 8px)", textAlign: "right" }}
              >
                <NumberRoll value={visible ? max * f : 0} format={scaleFormat} locales={locales} duration={700} />
              </span>
              <div className="border-t border-border" style={{ marginLeft: "var(--gutter)" }} />
            </div>
          ))}

          <div
            ref={plotRef}
            role="group"
            tabIndex={0}
            aria-label={`${title}. Use the arrow keys to read each point.`}
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
            <div
              className="absolute inset-x-0 top-0"
              style={{
                height: plotH,
                clipPath: visible ? "inset(-8px -8px -8px -8px)" : "inset(-8px 100% -8px -8px)",
                transition: reduced ? "none" : `clip-path 1200ms ${EASE}`,
              }}
            >
              <svg aria-hidden="true" width={width} height={plotH} className="absolute inset-0 overflow-visible">
                {width > 0 &&
                  drawn.map((b, s) => {
                    const upper = b.upper.map((v, i) => [x(i), y(v)] as [number, number]);
                    const lower = b.lower.map((v, i) => [x(i), y(v)] as [number, number]).reverse();
                    const top = monotone(upper);
                    const fill = `${top}${monotone(lower, false)}Z`;
                    const shown = on(series[s]);
                    // Overlap fills lightly so the bands behind still show; stacked bands fill a little more.
                    const wash = layout === "overlap" ? 0.1 : 0.2;
                    return (
                      <g key={series[s].id} style={{ opacity: shown ? 1 : 0, transition: reduced ? "none" : `opacity 300ms ${EASE}` }}>
                        <path d={fill} fill={COLORS[s]} fillOpacity={wash} />
                        <path d={top} fill="none" stroke={COLORS[s]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    );
                  })}
              </svg>
            </div>

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
            {series.map((s, si) => {
              const showDot = active !== null && on(s);
              const v = drawn[si]?.upper[active ?? n - 1] ?? 0;
              return (
                <span
                  key={s.id}
                  aria-hidden="true"
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_var(--background)]"
                  style={{
                    left: x(active ?? n - 1),
                    top: y(v),
                    background: COLORS[si],
                    opacity: showDot ? 1 : 0,
                    scale: showDot ? "1" : "0.4",
                    transition: reduced ? "none" : `left 260ms ${THROW}, top 260ms ${THROW}, opacity 200ms ${EASE}, scale 260ms ${EASE}`,
                  }}
                />
              );
            })}

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

        {/* The tiles: the legend, the switches, and the readout while you point. */}
        {/* The legend as a compact strip: each series is a toggle with its figure and share. */}
        <div
          className="mt-4 grid gap-x-1 border-t border-border pt-2.5 @md:mt-5 @md:pt-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(series.length, 3)}, minmax(0, 1fr))` }}
        >
          {series.map((s, si) => {
            const shown = on(s);
            const value = totalOf(s);
            const share = shownTotal ? value / shownTotal : 0;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={shown}
                onClick={() => toggle(s.id)}
                className={`cursor-pointer -mx-1.5 flex min-w-0 flex-col items-start rounded-lg px-1.5 py-1 text-left transition-[opacity,background-color] duration-300 hover:bg-accent ${FOCUS} ${
                  shown ? "" : "opacity-45"
                }`}
              >
                <span className="flex max-w-full items-center gap-1.5 text-[11px] text-muted-foreground @md:text-[11.5px]">
                  <span
                    aria-hidden="true"
                    className="size-[7px] shrink-0 rounded-full transition-[background-color,box-shadow] duration-300"
                    style={{ background: shown ? COLORS[si] : "transparent", boxShadow: `inset 0 0 0 1.5px ${COLORS[si]}` }}
                  />
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="mt-0.5 flex items-baseline gap-1">
                  <span className="text-[13.5px] font-medium tracking-[-0.01em] text-foreground @md:text-[14.5px]">
                    <NumberRoll value={visible && shown ? value : 0} format={format} locales={locales} duration={600} />
                  </span>
                  <span className="text-[10.5px] text-muted-foreground @md:text-[11px]">
                    <NumberRoll value={visible && shown ? share : 0} format={{ style: "percent" }} duration={600} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="sr-only">
          {keyboard && active !== null
            ? `${name(active)}: ${series
                .filter(on)
                .map((s) => `${s.label} ${fmt(s.values[active] ?? 0)}`)
                .join(", ")}`
            : ""}
        </p>
        <table className="sr-only">
          <caption>
            {title}
            {caption ? `, ${caption}` : ""}
          </caption>
          <thead>
            <tr>
              <th scope="col">Point</th>
              {series.map((s) => (
                <th key={s.id} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((l, i) => (
              <tr key={l + i} id={`${id}-${i}`}>
                <th scope="row">{name(i)}</th>
                {series.map((s) => (
                  <td key={s.id}>{fmt(s.values[i] ?? 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
