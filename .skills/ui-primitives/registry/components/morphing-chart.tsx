// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Morphing chart (morphing-chart)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

/* ─────────────────────────────────────────────────────────
 * MORPHING CHART: one set of points, three shapes
 *
 *   bars → line    each bar condenses up into a bead on its
 *                  value; a thread is strung through the beads
 *                  from the left and they melt into it as it passes
 *   line → bars    the thread is pulled out to the right; each
 *                  bead swells back as the tail leaves it and drips
 *                  a stick to the axis that lands and spreads
 *   line → area    the fill pours down from the line, left to
 *                  right; back to line, it drains up into it
 *   bars → area    the bars widen until they touch and fade to a
 *                  wash; the steps they make melt into the curve
 *   scrub          drag the switch's thumb and the morph follows
 *                  your finger, frame by frame; let go and it runs
 *                  on to the nearer shape. Asking for the shape it
 *                  came from mid-morph runs it back from there
 *   data           new values: every mark eases to its new height a
 *                  beat after its neighbour and the scale rolls
 *   hover          bars dim but the one you're on; on the line and
 *                  the area a bead slides along the curve to the
 *                  point, and the figure and its label roll to it
 *
 * The plot is one tab stop: arrow keys read each point, and the
 * shape switch is a radio group. Every figure is also in a table
 * for screen readers.
 * ───────────────────────────────────────────────────────── */

import * as React from 'react';
import { NumberRoll } from './number-roll';
import { TextMorph } from './text-morph';
import { EASE_OUT, releaseVelocity, samplePointer, useInteractionReducedMotion, type PointerSample } from './ui-interaction-motion';
import { CHART_SHAPES, type ChartShape, useChartMorph } from './use-chart-morph';

export type { ChartShape };

export interface MorphingChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  title?: string;
  /** Under the figure, e.g. "Last 12 months". */
  caption?: string;
  /** Along the bottom, one per value. */
  labels: string[];
  /** In the readout when a point is read, e.g. "October 2026". Defaults to labels. */
  titles?: string[];
  values: number[];
  shape?: ChartShape;
  defaultShape?: ChartShape;
  onShapeChange?: (shape: ChartShape) => void;
  format?: Intl.NumberFormatOptions;
  locales?: string | string[];
}

const THROW = 'cubic-bezier(0.34,1.36,0.64,1)';
const TOP = 10;
const LABELS = 24;
const STEPS = 4;
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';
const SHAPE_LABELS: Record<ChartShape, string> = { bars: 'Bars', line: 'Line', area: 'Area' };

function niceTop(value: number) {
  if (value <= 0) return STEPS;
  const raw = value / STEPS;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return step * STEPS;
}

export function MorphingChart({
  title = 'Revenue',
  caption,
  labels,
  titles,
  values,
  shape: shapeProp,
  defaultShape = 'bars',
  onShapeChange,
  format,
  locales,
  className = '',
  ...props
}: MorphingChartProps) {
  const reduced = useInteractionReducedMotion();
  const id = React.useId().replace(/[^\w-]/g, '');
  const n = labels.length;
  const [ownShape, setOwnShape] = React.useState<ChartShape>(defaultShape);
  const shape = shapeProp ?? ownShape;
  const morph = useChartMorph({ count: n, shape, reduced });
  const engine = React.useRef(morph);
  engine.current = morph;
  // The engine owns the wash from the first frame on; React only writes the starting value.
  const [firstWash] = React.useState(() => shape === 'area');

  const [visible, setVisible] = React.useState(false);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [active, setActive] = React.useState<number | null>(null);
  const [keyboard, setKeyboard] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const plotRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLSpanElement>(null);
  const chipRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const placed = React.useRef(false);
  const drag = React.useRef<{ id: number; x: number; from: number; p: number; near: number; moved: boolean; samples: PointerSample[] } | null>(null);
  const swallowClick = React.useRef(false);

  const clean = React.useMemo(() => labels.map((_, i) => Math.max(0, values[i] ?? 0)), [labels, values]);
  const max = niceTop(Math.max(0, ...clean));
  const total = clean.reduce((s, v) => s + v, 0);

  // Measure the plot: its width from the card, its height from the --plot variable the container sets.
  React.useLayoutEffect(() => {
    const plot = plotRef.current, chart = chartRef.current;
    if (!plot || !chart) return;
    const measure = () =>
      setSize((s) => {
        const width = plot.offsetWidth, height = chart.offsetHeight - LABELS;
        return width === s.width && height === s.height ? s : { width, height };
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(plot);
    observer.observe(chart);
    return () => observer.disconnect();
  }, []);
  React.useLayoutEffect(() => {
    if (size.width && size.height) engine.current.layout({ width: size.width, height: size.height, top: TOP });
  }, [size]);

  // Arrive once on screen: every mark rises from the axis.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '0px 0px -10% 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const arrived = React.useRef(false);
  const dataKey = `${clean.join(',')}|${max}`;
  React.useLayoutEffect(() => {
    if (!visible || !size.width) {
      engine.current.data(clean.map(() => 0), max, { animate: false });
      return;
    }
    engine.current.data(clean, max, { animate: true, from: arrived.current ? undefined : 0 });
    arrived.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, visible, size.width > 0]);

  const firstShape = React.useRef(true);
  React.useEffect(() => {
    if (firstShape.current) { firstShape.current = false; return; }
    engine.current.shape(shape);
  }, [shape]);
  React.useEffect(() => engine.current.point(active), [active]);

  // The thumb: equal segments, so it only ever translates. Written directly so a drag can carry it.
  const geo = React.useRef({ left: 0, step: 0 });
  const placeThumb = React.useCallback((p: number, animate: boolean) => {
    const el = thumbRef.current, a = chipRefs.current[0], b = chipRefs.current[1];
    if (!el || !a || !b) return;
    geo.current = { left: a.offsetLeft, step: b.offsetLeft - a.offsetLeft };
    el.style.width = `${a.offsetWidth}px`;
    el.style.transition = animate && !reduced ? `translate 460ms ${THROW}` : 'none';
    el.style.translate = `${geo.current.left + p * geo.current.step}px 0`;
  }, [reduced]);
  React.useLayoutEffect(() => {
    if (drag.current?.moved) return;
    placeThumb(CHART_SHAPES.indexOf(shape), placed.current);
    placed.current = true;
  }, [shape, placeThumb]);
  const shapeNow = React.useRef(shape);
  shapeNow.current = shape;
  React.useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // The segments resize when the card crosses its breakpoint; the first call (on observe) is skipped.
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) { first = false; return; }
      if (!drag.current?.moved) placeThumb(CHART_SHAPES.indexOf(shapeNow.current), false);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, [placeThumb]);

  const choose = (next: ChartShape) => {
    if (next === shape) return;
    if (shapeProp === undefined) setOwnShape(next);
    onShapeChange?.(next);
  };

  // Scrub: drag the thumb and the morph is held at the frame under it. Nothing is measured or rendered
  // per move: the segments are measured when the drag starts, and the thumb and the chart are written directly.
  const tint = (near: number | null) =>
    chipRefs.current.forEach((chip, k) => {
      if (chip) chip.style.color = near === null ? '' : k === near ? 'var(--foreground)' : 'var(--muted-foreground)';
    });
  const onTrackPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || reduced) return;
    const chip = (e.target as Element).closest('[role="radio"]');
    const from = engine.current.position();
    if (!chip || chip.getAttribute('aria-checked') !== 'true' || from === null) return;
    drag.current = { id: e.pointerId, x: e.clientX, from, p: from, near: Math.round(from), moved: false, samples: [] };
  };
  const onTrackPointerMove = (e: React.PointerEvent) => {
    const d = drag.current, thumb = thumbRef.current;
    if (!d || d.id !== e.pointerId || !thumb) return;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 4) return;
      d.moved = true;
      try { trackRef.current?.setPointerCapture(e.pointerId); } catch {}
      placeThumb(d.from, false);
      setDragging(true);
    }
    const { left, step } = geo.current;
    d.p = Math.max(0, Math.min(CHART_SHAPES.length - 1, d.from + dx / (step || 1)));
    samplePointer(d.samples, d.p, e.timeStamp);
    engine.current.scrub(d.p);
    thumb.style.translate = `${left + d.p * step}px 0`;
    if (Math.round(d.p) !== d.near) tint((d.near = Math.round(d.p)));
  };
  const onTrackPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    // The click that follows this release isn't a choice; if none comes, stop waiting for it.
    swallowClick.current = true;
    window.setTimeout(() => { swallowClick.current = false; }, 0);
    setDragging(false);
    // Run on to the nearer neighbour, or the one it was flung toward.
    const lo = Math.min(CHART_SHAPES.length - 2, Math.floor(d.p));
    const ahead = d.p + releaseVelocity(d.samples, e.timeStamp) * 160;
    const target = CHART_SHAPES[ahead - lo >= 0.5 ? lo + 1 : lo];
    engine.current.release(target);
    tint(null);
    placeThumb(CHART_SHAPES.indexOf(target), true);
    choose(target);
  };

  const band = n ? size.width / n : 0;
  const pointAt = (clientX: number) => {
    const r = plotRef.current?.getBoundingClientRect();
    if (!r || !n) return null;
    return Math.min(n - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * n)));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!n) return;
    const from = active ?? n - 1;
    const moves: Record<string, number> = { ArrowLeft: from - 1, ArrowRight: from + 1, Home: 0, End: n - 1 };
    if (e.key === 'Escape') return setActive(null);
    if (!(e.key in moves)) return;
    e.preventDefault();
    setKeyboard(true);
    setActive(Math.min(n - 1, Math.max(0, active === null ? from : moves[e.key])));
  };

  const fmt = (v: number) => new Intl.NumberFormat(locales, format).format(v);
  const name = (i: number) => titles?.[i] ?? labels[i];
  const scaleFormat: Intl.NumberFormatOptions = { ...format, notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 };
  const every = size.width && n ? Math.max(1, Math.ceil(38 / (size.width / n))) : 1;
  const label = (i: number) => active === i || ((n - 1 - i) % every === 0 && (active === null || every === 1 || Math.abs(i - active) >= every));

  return (
    <div ref={rootRef} className={`@container w-full rounded-[22px] bg-background text-foreground shadow-[0_0_0_1px_var(--border)] ${className}`} {...props}>
      <div className="p-4 @md:p-5 [--gutter:30px] @md:[--gutter:40px] [--plot:150px] @md:[--plot:190px]">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="text-[12px] text-muted-foreground @md:text-[13px]">
            <TextMorph>{title}</TextMorph>
          </p>
          <div
            ref={trackRef}
            role="radiogroup"
            aria-label="Chart shape"
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={onTrackPointerUp}
            onPointerCancel={onTrackPointerUp}
            onClickCapture={(e) => {
              if (!swallowClick.current) return;
              swallowClick.current = false;
              e.stopPropagation();
            }}
            className={`relative -my-1 inline-grid shrink-0 touch-pan-y select-none auto-cols-fr grid-flow-col rounded-full bg-muted p-0.5 ${dragging ? 'cursor-grabbing' : ''}`}
          >
            <span ref={thumbRef} aria-hidden="true" className="absolute inset-y-0.5 left-0 rounded-full bg-background shadow-[0_0_0_1px_var(--border)]" style={{ willChange: 'translate' }} />
            {CHART_SHAPES.map((s, i) => {
              const selected = s === shape;
              return (
                <button
                  key={s}
                  ref={(el) => { chipRefs.current[i] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => choose(s)}
                  onKeyDown={(e) => {
                    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                    e.preventDefault();
                    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + CHART_SHAPES.length) % CHART_SHAPES.length;
                    choose(CHART_SHAPES[next]);
                    chipRefs.current[next]?.focus();
                  }}
                  className={`relative flex h-6 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 text-[11.5px] font-medium transition-colors duration-300 @md:h-7 @md:gap-1.5 @md:px-3 @md:text-[12.5px] ${FOCUS} ${
                    selected ? `text-foreground ${dragging ? 'cursor-grabbing' : 'cursor-grab'}` : 'cursor-pointer text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ShapeGlyph shape={s} />
                  {SHAPE_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-0.5 text-[22px] font-medium leading-tight tracking-[-0.03em] @md:text-[26px]">
          <NumberRoll value={visible ? (active !== null ? clean[active] : total) : 0} format={format} locales={locales} duration={active !== null ? 600 : 1000} />
        </p>
        <p className="mt-1 whitespace-nowrap text-[11.5px] text-muted-foreground @md:text-[12.5px]">
          <TextMorph>{active !== null ? name(active) : (caption ?? ' ')}</TextMorph>
        </p>

        <div ref={chartRef} className="relative mt-4 @md:mt-5" style={{ height: `calc(var(--plot) + ${LABELS}px)` }}>
          {Array.from({ length: STEPS + 1 }, (_, k) => 1 - k / STEPS).map((f) => (
            <div key={f} aria-hidden="true" className="absolute inset-x-0" style={{ top: TOP + (size.height - TOP) * (1 - f) }}>
              <span className="absolute left-0 top-0 -translate-y-1/2 text-[10px] leading-none tabular-nums text-muted-foreground/80" style={{ width: 'calc(var(--gutter) - 8px)', textAlign: 'right' }}>
                <NumberRoll value={visible ? max * f : 0} format={scaleFormat} locales={locales} duration={700} />
              </span>
              <div className="border-t border-border" style={{ marginLeft: 'var(--gutter)' }} />
            </div>
          ))}

          <div
            ref={plotRef}
            role="group"
            tabIndex={0}
            aria-label={`${title}. Use the arrow keys to read each point.`}
            onKeyDown={onKeyDown}
            onBlur={() => keyboard && (setActive(null), setKeyboard(false))}
            onPointerMove={(e) => { setKeyboard(false); setActive(pointAt(e.clientX)); }}
            onPointerDown={(e) => setActive(pointAt(e.clientX))}
            onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
            onPointerUp={(e) => e.pointerType !== 'mouse' && setActive(null)}
            onPointerCancel={() => setActive(null)}
            className={`absolute inset-y-0 right-0 touch-pan-y select-none rounded-lg ${FOCUS}`}
            style={{ left: 'var(--gutter)' }}
          >
            <svg aria-hidden="true" width={size.width} height={size.height} className="absolute left-0 top-0 overflow-visible will-change-transform">
              <defs>
                <linearGradient id={`${id}-wash`} gradientUnits="userSpaceOnUse" x1="0" y1={TOP} x2="0" y2={size.height || 1}>
                  <stop ref={(el) => { morph.stops.current[0] = el; }} offset="0" stopColor="var(--chart-1, var(--primary))" stopOpacity={firstWash ? 0.22 : 1} />
                  <stop ref={(el) => { morph.stops.current[1] = el; }} offset="1" stopColor="var(--chart-1, var(--primary))" stopOpacity={firstWash ? 0.03 : 1} />
                </linearGradient>
              </defs>
              <path ref={morph.area} fill={`url(#${id}-wash)`} />
              <g ref={morph.columnGroup} data-wash={`url(#${id}-wash)`} fill="var(--chart-1, var(--primary))">
                {labels.map((l, i) => (
                  <path
                    key={`${l}-${i}`}
                    ref={(el) => { morph.columns.current[i] = el; }}
                    style={{ opacity: active === null || active === i || shape !== 'bars' ? 1 : 0.32, transition: reduced ? 'none' : `opacity 220ms ${EASE_OUT}` }}
                  />
                ))}
              </g>
              <path ref={morph.line} fill="none" stroke="var(--chart-1, var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* The hover bead and its Tactile: the engine slides them along the curve. */}
            <div ref={morph.rule} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 w-px bg-border opacity-0" style={{ height: size.height, transition: reduced ? 'none' : `opacity 200ms ${EASE_OUT}` }} />
            <div
              ref={morph.bead}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 size-[9px] rounded-full bg-background opacity-0 shadow-[inset_0_0_0_2px_var(--chart-1,var(--primary))]"
              style={{ scale: 0.4, willChange: 'translate', transition: reduced ? 'none' : `opacity 200ms ${EASE_OUT}, scale 280ms ${THROW}` }}
            />

            {labels.map((l, i) => (
              <span
                key={`${l}-${i}`}
                aria-hidden="true"
                className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] leading-none tabular-nums transition-[opacity,color] duration-300"
                style={{ left: band * (i + 0.5), top: size.height + 9, opacity: label(i) ? 1 : 0, color: active === i ? 'var(--foreground)' : 'var(--muted-foreground)' }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>{title}{caption ? `, ${caption}` : ''}</caption>
        <tbody>
          {labels.map((l, i) => (
            <tr key={`${l}-${i}`}><th scope="row">{name(i)}</th><td>{fmt(clean[i])}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="sr-only" aria-live="polite">{keyboard && active !== null ? `${name(active)}: ${fmt(clean[active])}` : ''}</p>
    </div>
  );
}

/** A small drawing of each shape for the switch. */
function ShapeGlyph({ shape }: { shape: ChartShape }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {shape === 'bars' && <path d="M3 12V7M7 12V3M11 12V8" />}
      {shape === 'line' && <path d="M2 10.5 5.5 6l3 2.5L12 3.5" />}
      {shape === 'area' && <><path d="M2 10 5.5 6l3 2.5L12 4v8H2Z" fill="currentColor" fillOpacity="0.25" stroke="none" /><path d="M2 10 5.5 6l3 2.5L12 4" /></>}
    </svg>
  );
}
