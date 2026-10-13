// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Precision dial (precision-dial)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { EASE_OUT } from './ui-interaction-motion';

export const dialAngle = (value: number, min: number, max: number) => -135 + (value - min) / (max - min) * 270;
export function dialValue(value: number, min: number, max: number, step: number) {
  if (!Number.isFinite(value) || value <= min) return min;
  if (value >= max) return max;
  const snapped = min + Math.round((value - min) / step) * step;
  return Number(Math.max(min, Math.min(max, snapped)).toFixed(6));
}

type Options = {
  value: number; min: number; max: number; step: number; disabled: boolean; reduced: boolean;
  onChange: (value: number) => void; onCommit: (value: number) => void; format: (value: number) => string; formatNumber: (value: number) => string;
};

/** Layout is fixed. A gesture writes one rotation, one text node and the slider's accessible value. */
export function usePrecisionDial(options: Options) {
  const face = React.useRef<HTMLDivElement>(null);
  const control = React.useRef<HTMLButtonElement>(null);
  const readout = React.useRef<HTMLSpanElement>(null);
  const optionsRef = React.useRef(options); optionsRef.current = options;
  const gesture = React.useRef<{ id: number; x: number; y: number; value: number; raw: number; last: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const paint = React.useCallback((next: number, animate: boolean) => {
    const o = optionsRef.current;
    if (face.current) {
      face.current.style.transition = animate && !o.reduced ? `transform 420ms ${EASE_OUT}` : 'none';
      face.current.style.transform = `rotate(${dialAngle(next, o.min, o.max)}deg)`;
    }
    if (readout.current) readout.current.textContent = o.formatNumber(next);
    control.current?.setAttribute('aria-valuenow', String(next));
    control.current?.setAttribute('aria-valuetext', o.format(next));
  }, []);

  const commit = React.useCallback((next: number, animate = true) => {
    const o = optionsRef.current;
    const bounded = dialValue(next, o.min, o.max, o.step);
    paint(bounded, animate); o.onChange(bounded); o.onCommit(bounded);
  }, [paint]);

  const finish = React.useCallback((cancelled: boolean) => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null; setDragging(false);
    if (cancelled) { paint(g.value, true); optionsRef.current.onChange(g.value); }
    else commit(g.last, false);
  }, [commit, paint]);

  React.useLayoutEffect(() => { if (!gesture.current) paint(options.value, true); }, [options.value, options.min, options.max, options.reduced, paint]);
  React.useEffect(() => {
    const interrupted = () => finish(true);
    const hidden = () => { if (document.hidden) interrupted(); };
    window.addEventListener('blur', interrupted); document.addEventListener('visibilitychange', hidden);
    return () => { window.removeEventListener('blur', interrupted); document.removeEventListener('visibilitychange', hidden); };
  }, [finish]);
  React.useEffect(() => { if (options.disabled) finish(true); }, [options.disabled, finish]);

  return {
    face, control, readout, dragging, commit,
    handlers: {
      onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
        if (event.button !== 0 || !event.isPrimary || optionsRef.current.disabled) return;
        const o = optionsRef.current;
        event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus({ preventScroll: true });
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, value: o.value, raw: o.value, last: o.value };
        paint(o.value, false); setDragging(true);
      },
      onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
        const g = gesture.current, o = optionsRef.current;
        if (!g || g.id !== event.pointerId) return;
        const travel = g.y - event.clientY + (event.clientX - g.x) * 0.25;
        g.x = event.clientX; g.y = event.clientY;
        g.raw = Math.max(o.min, Math.min(o.max, g.raw + travel * (o.max - o.min) / 180 * (event.shiftKey ? 0.1 : 1)));
        const next = dialValue(g.raw, o.min, o.max, o.step);
        if (next === g.last) return;
        g.last = next; paint(next, false); o.onChange(next);
      },
      onPointerUp(event: React.PointerEvent<HTMLButtonElement>) { if (event.pointerId === gesture.current?.id) finish(false); },
      onPointerCancel(event: React.PointerEvent<HTMLButtonElement>) { if (event.pointerId === gesture.current?.id) finish(true); },
      onLostPointerCapture(event: React.PointerEvent<HTMLButtonElement>) { if (event.pointerId === gesture.current?.id) finish(true); },
      onBlur() { finish(true); },
      onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        if (event.key === 'Escape') { event.preventDefault(); finish(true); return; }
        const o = optionsRef.current;
        if (!['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const up = ['ArrowUp', 'ArrowRight', 'PageUp'].includes(event.key);
        const amount = o.step * (event.key.startsWith('Page') || event.shiftKey ? 10 : 1);
        commit(event.key === 'Home' ? o.min : event.key === 'End' ? o.max : o.value + (up ? amount : -amount));
      },
    },
  };
}
