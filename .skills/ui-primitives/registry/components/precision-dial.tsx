// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Precision dial (precision-dial)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { NumberRoll } from './number-roll';
import { INTERACTION_FOCUS, useInteractionReducedMotion } from './ui-interaction-motion';
import { dialAngle, dialValue, usePrecisionDial } from './use-precision-dial';

export interface PrecisionDialProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label: string; value?: number; defaultValue?: number; min?: number; max?: number; step?: number;
  unit?: string; disabled?: boolean; onValueChange?: (value: number) => void; onValueCommit?: (value: number) => void;
}

/** A tactile control with fixed ticks and a composited needle; the number rolls only when committed. */
export function PrecisionDial({ label, value, defaultValue = 50, min = 0, max = 100, step = 1, unit = '', disabled = false, onValueChange, onValueCommit, className = '', ...props }: PrecisionDialProps) {
  const reduced = useInteractionReducedMotion();
  const lower = Number.isFinite(min) ? min : 0;
  const upper = Number.isFinite(max) && max > lower ? max : lower + 100;
  const increment = Number.isFinite(step) && step > 0 ? Math.max(0.000001, step) : 1;
  const [own, setOwn] = React.useState(defaultValue);
  const current = dialValue(Number.isFinite(value ?? own) ? value ?? own : lower, lower, upper, increment);
  const decimals = Math.min(6, Math.max(0, (String(increment).split('.')[1] ?? '').length));
  const format = (n: number) => `${n.toFixed(decimals)}${unit ? ` ${unit}` : ''}`;
  const change = (next: number) => onValueChange?.(next);
  const commit = (next: number) => { if (value === undefined) setOwn(next); onValueCommit?.(next); };
  const dial = usePrecisionDial({ value: current, min: lower, max: upper, step: increment, disabled, reduced, onChange: change, onCommit: commit, format, formatNumber: (n) => n.toFixed(decimals) });
  const hint = React.useId();
  return <div {...props} className={`flex flex-col items-center text-foreground ${className}`}>
    <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
    <div className="relative my-3 size-[204px]">
      <svg viewBox="0 0 204 204" aria-hidden="true" className="absolute inset-0 size-full text-muted-foreground/40">
        {Array.from({ length: 37 }, (_, i) => {
          const angle = (-135 + i * 7.5) * Math.PI / 180;
          const outer = 95, inner = i % 6 === 0 ? 85 : 90;
          return <line key={i} x1={102 + Math.sin(angle) * inner} y1={102 - Math.cos(angle) * inner} x2={102 + Math.sin(angle) * outer} y2={102 - Math.cos(angle) * outer} stroke="currentColor" strokeWidth="1" strokeLinecap="round" />;
        })}
      </svg>
      <button ref={dial.control} {...dial.handlers} type="button" role="slider" disabled={disabled} aria-label={label} aria-valuemin={lower} aria-valuemax={upper} aria-valuenow={current} aria-valuetext={format(current)} aria-describedby={hint}
        onDoubleClick={() => dial.commit(defaultValue)} className={`absolute inset-7 cursor-ns-resize touch-none select-none rounded-full disabled:cursor-default disabled:opacity-40 ${INTERACTION_FOCUS}`}>
        <div ref={dial.face} aria-hidden="true" className="absolute inset-0 rounded-full border border-border bg-background will-change-transform" style={{ transform: `rotate(${dialAngle(current, lower, upper)}deg)` }}>
          <span className="absolute left-1/2 top-3 h-5 w-px -translate-x-1/2 bg-primary" />
          <span className="absolute inset-2 rounded-full border border-border/50" />
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Fine tune</span>
      </button>
      <span aria-hidden="true" className="absolute bottom-0 left-4 text-[10px] tabular-nums text-muted-foreground">{lower}</span>
      <span aria-hidden="true" className="absolute bottom-0 right-4 text-[10px] tabular-nums text-muted-foreground">{upper}</span>
    </div>
    <div aria-hidden="true" className="relative min-w-24 text-center text-[34px] leading-none tracking-[-0.04em] tabular-nums">
      <span style={{ opacity: dial.dragging ? 0 : 1 }}><NumberRoll value={current} format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }} duration={420} /><span className="ml-1.5 text-[13px] tracking-normal text-muted-foreground">{unit}</span></span>
      <span className="absolute inset-0 whitespace-nowrap" style={{ opacity: dial.dragging ? 1 : 0 }}><span ref={dial.readout}>{current.toFixed(decimals)}</span><span className="ml-1.5 text-[13px] tracking-normal text-muted-foreground">{unit}</span></span>
    </div>
    <p id={hint} className="sr-only">Drag up to increase, down to decrease. Hold Shift for fine control. Arrows adjust one step, Page Up and Page Down ten. Home and End reach the limits. Escape cancels. Double-click resets.</p>
  </div>;
}
