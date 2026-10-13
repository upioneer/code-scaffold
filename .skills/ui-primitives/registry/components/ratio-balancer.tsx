// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Ratio balancer (ratio-balancer)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

/* ─────────────────────────────────────────────────────────
 * RATIO BALANCER: constrained multi-segment resource allocator
 *
 *   track      a single 1px Tactile bar dividing 100% across
 *              segments; each segment expands or shrinks with
 *              flex-grow
 *   dividers   1px Tactile divider pins with centered grab notches;
 *              dragging redistributes adjacent allocations
 *              with zero layout thrash
 *   locking    padlock toggles freeze individual segments; locked
 *              segments stay firm while others adjust
 *   numbers    percentage readouts roll in place via NumberRoll
 *              upon release; DOM text updates immediately while
 *              dragging
 *
 * Dividers are accessible separators with ArrowLeft/Right keys.
 * ───────────────────────────────────────────────────────── */

import * as React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { NumberRoll } from './number-roll';
import { INTERACTION_FOCUS, useInteractionReducedMotion } from './ui-interaction-motion';
import { normalizeRatios, type RatioSegment, useRatioBalancer } from './use-ratio-balancer';

export type { RatioSegment };

export interface RatioBalancerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  segments?: RatioSegment[];
  defaultSegments?: RatioSegment[];
  minRatio?: number;
  disabled?: boolean;
  onValueChange?: (ratios: number[]) => void;
  onValueCommit?: (ratios: number[]) => void;
  onLockToggle?: (segmentId: string, locked: boolean) => void;
}

const DEFAULT_SEGMENTS: RatioSegment[] = [
  { id: 'inference', label: 'Inference', ratio: 50 },
  { id: 'training', label: 'Training', ratio: 30 },
  { id: 'cache', label: 'Cache & KV', ratio: 20 },
];

const COLORS = [
  'bg-primary/15 text-primary border-primary/25',
  'bg-foreground/5 text-foreground border-foreground/15',
  'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  'bg-accent text-accent-foreground border-border',
  'bg-primary/5 text-foreground border-primary/20',
];

export function RatioBalancer({
  label,
  segments: controlledSegments,
  defaultSegments = DEFAULT_SEGMENTS,
  minRatio = 5,
  disabled = false,
  onValueChange,
  onValueCommit,
  onLockToggle,
  className = '',
  ...props
}: RatioBalancerProps) {
  const reduced = useInteractionReducedMotion();
  const [internalSegments, setInternalSegments] = React.useState<RatioSegment[]>(defaultSegments);
  const segments = controlledSegments ?? internalSegments;

  const currentRatios = React.useMemo(() => normalizeRatios(segments.map((s) => s.ratio)), [segments]);

  const handleChange = React.useCallback(
    (nextRatios: number[]) => {
      onValueChange?.(nextRatios);
    },
    [onValueChange]
  );

  const handleCommit = React.useCallback(
    (nextRatios: number[]) => {
      if (!controlledSegments) {
        setInternalSegments((prev) =>
          prev.map((seg, i) => ({
            ...seg,
            ratio: nextRatios[i] ?? seg.ratio,
          }))
        );
      }
      onValueCommit?.(nextRatios);
    },
    [controlledSegments, onValueCommit]
  );

  const balancer = useRatioBalancer({
    segments,
    minRatio,
    disabled,
    reduced,
    onChange: handleChange,
    onCommit: handleCommit,
  });

  const toggleLock = (segmentId: string) => {
    if (disabled) return;
    const target = segments.find((s) => s.id === segmentId);
    const nextLocked = !(target?.locked ?? false);

    if (!controlledSegments) {
      setInternalSegments((prev) =>
        prev.map((s) => (s.id === segmentId ? { ...s, locked: nextLocked } : s))
      );
    }
    onLockToggle?.(segmentId, nextLocked);
  };

  return (
    <div
      {...props}
      role="region"
      aria-label={label ?? 'Resource ratio balancer'}
      className={`relative flex w-full max-w-xl select-none flex-col text-foreground ${className}`}
    >
      {/* Label and Total */}
      {label && (
        <div className="mb-3 flex items-center justify-between text-[12px] font-medium text-muted-foreground">
          <span>{label}</span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground/80">100% TOTAL</span>
        </div>
      )}

      {/* Main Bar Track */}
      <div
        ref={balancer.trackRef}
        className="relative flex h-14 w-full overflow-hidden rounded-[14px] border border-border bg-surface p-1 shadow-[inset_0_0_0_1px_var(--border)]"
      >
        {segments.map((seg, i) => {
          const colorClass = COLORS[i % COLORS.length];
          const isLast = i === segments.length - 1;
          const ratio = currentRatios[i] ?? seg.ratio;

          return (
            <React.Fragment key={seg.id}>
              {/* Segment Cell */}
              <div
                ref={(el) => {
                  balancer.segmentRefs.current[i] = el;
                }}
                className={`relative flex min-w-[38px] flex-col justify-between overflow-hidden rounded-[10px] border px-2.5 py-1.5 transition-[flex-grow] will-change-[flex-grow] ${colorClass}`}
                style={{ flexGrow: ratio }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] font-medium tracking-tight">{seg.label}</span>
                  <button
                    type="button"
                    onClick={() => toggleLock(seg.id)}
                    aria-label={`${seg.locked ? 'Unlock' : 'Lock'} ${seg.label}`}
                    aria-pressed={seg.locked}
                    className="cursor-pointer text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {seg.locked ? <Lock className="size-3 text-primary" /> : <Unlock className="size-3 opacity-40 hover:opacity-100" />}
                  </button>
                </div>

                <div className="flex items-baseline justify-between">
                  <span
                    ref={(el) => {
                      balancer.readoutRefs.current[i] = el;
                    }}
                    style={{ display: balancer.activeDivider !== null ? 'inline' : 'none' }}
                    className="font-mono text-[13px] font-medium tabular-nums"
                  >
                    {Math.round(ratio)}%
                  </span>
                  <span
                    style={{ display: balancer.activeDivider !== null ? 'none' : 'inline' }}
                    className="font-mono text-[13px] font-medium tabular-nums"
                  >
                    <NumberRoll value={Math.round(ratio)} suffix="%" duration={380} />
                  </span>
                </div>
              </div>

              {/* Divider Grip */}
              {!isLast && (
                <div className="relative z-10 flex w-2 shrink-0 items-center justify-center">
                  <button
                    ref={(el) => {
                      balancer.dividerRefs.current[i] = el;
                    }}
                    {...balancer.getDividerProps(i)}
                    type="button"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Adjust split between ${seg.label} and ${segments[i + 1]?.label}`}
                    className={`group absolute -inset-y-1 -inset-x-1.5 flex cursor-ew-resize items-center justify-center touch-none select-none rounded ${INTERACTION_FOCUS}`}
                  >
                    <span className="h-6 w-0.5 rounded-full bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
                  </button>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Legend & Lock Status */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" />
          <span>Drag dividers to reallocate. Click lock to pin segment.</span>
        </span>
        <div className="flex items-center gap-3">
          {segments.map((seg) => (
            <span key={seg.id} className="flex items-center gap-1 font-mono text-[10px] tabular-nums">
              <span>{seg.label}:</span>
              <span className="font-semibold text-foreground">{Math.round(currentRatios[segments.indexOf(seg)] ?? seg.ratio)}%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
