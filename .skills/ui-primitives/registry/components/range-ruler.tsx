// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Range ruler (range-ruler)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

/* ─────────────────────────────────────────────────────────
 * RANGE RULER: dual needles on a graduated Tactile ruler
 *
 *   ruler      an axis with 1px SVG tick marks; major ticks
 *              mark intervals, minor ticks subdivide steps
 *   needles    two tactile Tactile sliders with 1px indicators;
 *              dragging glides with zero layout thrash
 *   repulsion  drag the lower needle into the upper one and it
 *              pushes the upper needle forward instead of
 *              clipping; drag backwards and it pushes down
 *   badges     floating metric pills roll with NumberRoll;
 *              when needles get within 48px, the badges glide
 *              together into a single merged span
 *   settle     values commit on pointer release, and numbers
 *              roll smoothly to their settled positions
 *
 * Both needles are accessible sliders with full arrow, Home,
 * End, and Page keys.
 * ───────────────────────────────────────────────────────── */

import * as React from 'react';
import { NumberRoll } from './number-roll';
import { INTERACTION_FOCUS, useInteractionReducedMotion } from './ui-interaction-motion';
import { snapRulerValue, useRangeRuler } from './use-range-ruler';

export type RangeValue = [number, number];

export interface RangeRulerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  label?: string;
  value?: RangeValue;
  defaultValue?: RangeValue;
  min?: number;
  max?: number;
  step?: number;
  minDistance?: number;
  unit?: string;
  disabled?: boolean;
  onValueChange?: (value: RangeValue) => void;
  onValueCommit?: (value: RangeValue) => void;
  format?: Intl.NumberFormatOptions;
  locales?: string | string[];
}

export function RangeRuler({
  label,
  value,
  defaultValue = [20, 80],
  min = 0,
  max = 100,
  step = 1,
  minDistance = 0,
  unit = '',
  disabled = false,
  onValueChange,
  onValueCommit,
  format,
  locales,
  className = '',
  ...props
}: RangeRulerProps) {
  const reduced = useInteractionReducedMotion();
  const lower = Number.isFinite(min) ? min : 0;
  const upper = Number.isFinite(max) && max > lower ? max : lower + 100;
  const increment = Number.isFinite(step) && step > 0 ? step : 1;

  const [own, setOwn] = React.useState<RangeValue>(defaultValue);
  const currentVal = value ?? own;

  const safeVal: RangeValue = React.useMemo(() => {
    const l = snapRulerValue(currentVal[0], lower, upper - minDistance, increment);
    const u = snapRulerValue(currentVal[1], l + minDistance, upper, increment);
    return [l, u];
  }, [currentVal, lower, upper, minDistance, increment]);

  const decimals = Math.min(4, Math.max(0, (String(increment).split('.')[1] ?? '').length));

  const formatNumber = React.useCallback(
    (n: number) => {
      const formatted = n.toFixed(decimals);
      return unit ? `${formatted} ${unit}` : formatted;
    },
    [decimals, unit]
  );

  const formatAria = React.useCallback(
    (n: number) => `${n.toFixed(decimals)}${unit ? ` ${unit}` : ''}`,
    [decimals, unit]
  );

  const handleChange = React.useCallback(
    (next: RangeValue) => onValueChange?.(next),
    [onValueChange]
  );

  const handleCommit = React.useCallback(
    (next: RangeValue) => {
      if (value === undefined) setOwn(next);
      onValueCommit?.(next);
    },
    [value, onValueCommit]
  );

  const ruler = useRangeRuler({
    value: safeVal,
    min: lower,
    max: upper,
    step: increment,
    minDistance,
    disabled,
    reduced,
    onChange: handleChange,
    onCommit: handleCommit,
    format: formatAria,
    formatNumber,
  });

  const rangeSpan = upper - lower;
  const tickCount = Math.min(81, Math.max(11, Math.round(rangeSpan / increment) + 1));
  const majorInterval = Math.max(1, Math.round(tickCount / 8));

  const ticks = React.useMemo(() => {
    return Array.from({ length: tickCount }, (_, i) => {
      const fraction = i / (tickCount - 1);
      const isMajor = i % majorInterval === 0 || i === tickCount - 1;
      return { fraction, isMajor, key: i };
    });
  }, [tickCount, majorInterval]);

  const lowerHint = React.useId();
  const upperHint = React.useId();

  return (
    <div
      {...props}
      role="group"
      aria-label={label ?? 'Range selector'}
      className={`relative flex w-full max-w-xl select-none flex-col text-foreground ${className}`}
    >
      {label && (
        <div className="mb-2 flex items-center justify-between text-[12px] font-medium text-muted-foreground">
          <span>{label}</span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground/80">
            {formatNumber(safeVal[0])} — {formatNumber(safeVal[1])}
          </span>
        </div>
      )}

      {/* Floating Readout Badges */}
      <div className="relative mb-3 h-7 w-full">
        {ruler.isMerged ? (
          <div className="absolute inset-x-0 flex items-center justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium tabular-nums shadow-[0_0_0_1px_var(--border)]">
              <span ref={ruler.mergedReadoutRef} style={{ display: ruler.activeThumb ? 'inline' : 'none' }}>
                {formatNumber(safeVal[0])} – {formatNumber(safeVal[1])}
              </span>
              <span style={{ display: ruler.activeThumb ? 'none' : 'inline' }}>
                <NumberRoll value={safeVal[0]} duration={380} />
                <span className="mx-1 text-muted-foreground">–</span>
                <NumberRoll value={safeVal[1]} duration={380} />
                {unit && <span className="ml-1 text-muted-foreground">{unit}</span>}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative size-full">
            <div
              className="absolute -top-0.5 -translate-x-1/2 transition-[opacity,transform] duration-200"
              style={{
                left: `${((safeVal[0] - lower) / rangeSpan) * 100}%`,
              }}
            >
              <div className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium tabular-nums shadow-[0_0_0_1px_var(--border)]">
                <span ref={ruler.lowerReadoutRef} style={{ display: ruler.activeThumb ? 'inline' : 'none' }}>
                  {formatNumber(safeVal[0])}
                </span>
                <span style={{ display: ruler.activeThumb ? 'none' : 'inline' }}>
                  <NumberRoll value={safeVal[0]} duration={380} />
                  {unit && <span className="ml-1 text-muted-foreground">{unit}</span>}
                </span>
              </div>
            </div>

            <div
              className="absolute -top-0.5 -translate-x-1/2 transition-[opacity,transform] duration-200"
              style={{
                left: `${((safeVal[1] - lower) / rangeSpan) * 100}%`,
              }}
            >
              <div className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium tabular-nums shadow-[0_0_0_1px_var(--border)]">
                <span ref={ruler.upperReadoutRef} style={{ display: ruler.activeThumb ? 'inline' : 'none' }}>
                  {formatNumber(safeVal[1])}
                </span>
                <span style={{ display: ruler.activeThumb ? 'none' : 'inline' }}>
                  <NumberRoll value={safeVal[1]} duration={380} />
                  {unit && <span className="ml-1 text-muted-foreground">{unit}</span>}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* The Track & Graduated Tactile Ruler */}
      <div className="relative py-2">
        {/* SVG Graduated Ruler Ticks */}
        <div className="relative h-6 w-full" aria-hidden="true">
          <svg className="size-full overflow-visible text-border" preserveAspectRatio="none">
            {/* Base Tactile Axis */}
            <line x1="0" y1="23.5" x2="100%" y2="23.5" stroke="currentColor" strokeWidth="1" />
            {ticks.map((t) => (
              <line
                key={t.key}
                x1={`${t.fraction * 100}%`}
                y1={t.isMajor ? 8 : 15}
                x2={`${t.fraction * 100}%`}
                y2={23}
                stroke="currentColor"
                strokeWidth="1"
                className={t.isMajor ? 'text-muted-foreground/60' : 'text-border/80'}
              />
            ))}
          </svg>
        </div>

        {/* Track gesture container */}
        <div ref={ruler.trackRef} className="relative h-6 w-full">
          {/* Active Highlight Band */}
          <div
            ref={ruler.highlightRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 h-full rounded border-y border-primary/40 bg-primary/10"
            style={{
              left: `${((safeVal[0] - lower) / rangeSpan) * 100}%`,
              width: `${Math.max(0, ((safeVal[1] - safeVal[0]) / rangeSpan) * 100)}%`,
            }}
          />

          {/* Lower Needle Thumb */}
          <button
            ref={ruler.lowerThumbRef}
            {...ruler.lowerHandlers}
            type="button"
            role="slider"
            disabled={disabled}
            aria-label={`Minimum ${label ?? 'value'}`}
            aria-valuemin={lower}
            aria-valuemax={safeVal[1] - minDistance}
            aria-valuenow={safeVal[0]}
            aria-valuetext={formatAria(safeVal[0])}
            aria-describedby={lowerHint}
            className={`absolute -top-1 -ml-3 z-10 flex h-8 w-6 cursor-ew-resize items-center justify-center rounded-md border border-border bg-background touch-none select-none disabled:cursor-default disabled:opacity-40 will-change-transform ${INTERACTION_FOCUS}`}
            style={{
              transform: `translateX(${((safeVal[0] - lower) / rangeSpan) * 100}%)`,
            }}
          >
            {/* 1px Vertical Needle */}
            <span className="h-5 w-px bg-primary" />
          </button>

          {/* Upper Needle Thumb */}
          <button
            ref={ruler.upperThumbRef}
            {...ruler.upperHandlers}
            type="button"
            role="slider"
            disabled={disabled}
            aria-label={`Maximum ${label ?? 'value'}`}
            aria-valuemin={safeVal[0] + minDistance}
            aria-valuemax={upper}
            aria-valuenow={safeVal[1]}
            aria-valuetext={formatAria(safeVal[1])}
            aria-describedby={upperHint}
            className={`absolute -top-1 -ml-3 z-10 flex h-8 w-6 cursor-ew-resize items-center justify-center rounded-md border border-border bg-background touch-none select-none disabled:cursor-default disabled:opacity-40 will-change-transform ${INTERACTION_FOCUS}`}
            style={{
              transform: `translateX(${((safeVal[1] - lower) / rangeSpan) * 100}%)`,
            }}
          >
            {/* 1px Vertical Needle */}
            <span className="h-5 w-px bg-primary" />
          </button>
        </div>

        {/* Lower / Upper Bound Labels */}
        <div aria-hidden="true" className="mt-2 flex justify-between text-[10px] font-mono tabular-nums text-muted-foreground/70">
          <span>{formatNumber(lower)}</span>
          <span>{formatNumber(upper)}</span>
        </div>
      </div>

      <p id={lowerHint} className="sr-only">
        Adjust minimum. Left arrow decreases, right arrow increases. Shift increases step by 10. Home sets to minimum, End to maximum.
      </p>
      <p id={upperHint} className="sr-only">
        Adjust maximum. Left arrow decreases, right arrow increases. Shift increases step by 10. Home sets to minimum, End to maximum.
      </p>
    </div>
  );
}
