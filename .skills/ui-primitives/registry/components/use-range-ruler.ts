// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Range ruler (range-ruler)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { EASE_OUT } from './ui-interaction-motion';

export function snapRulerValue(value: number, min: number, max: number, step: number) {
  if (!Number.isFinite(value) || value <= min) return min;
  if (value >= max) return max;
  const snapped = min + Math.round((value - min) / step) * step;
  return Number(Math.max(min, Math.min(max, snapped)).toFixed(6));
}

type Range = [number, number];

type RangeRulerOptions = {
  value: Range;
  min: number;
  max: number;
  step: number;
  minDistance?: number;
  disabled: boolean;
  reduced: boolean;
  onChange?: (value: Range) => void;
  onCommit?: (value: Range) => void;
  format: (value: number) => string;
  formatNumber: (value: number) => string;
};

/** High-performance gesture controller for a dual-needle graduated ruler. */
export function useRangeRuler(options: RangeRulerOptions) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const lowerThumbRef = React.useRef<HTMLButtonElement>(null);
  const upperThumbRef = React.useRef<HTMLButtonElement>(null);
  const highlightRef = React.useRef<HTMLDivElement>(null);
  const lowerReadoutRef = React.useRef<HTMLSpanElement>(null);
  const upperReadoutRef = React.useRef<HTMLSpanElement>(null);
  const mergedReadoutRef = React.useRef<HTMLSpanElement>(null);
  const badgeWrapRef = React.useRef<HTMLDivElement>(null);

  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  const [activeThumb, setActiveThumb] = React.useState<'lower' | 'upper' | null>(null);
  const [isMerged, setIsMerged] = React.useState(false);

  // Active drag state kept strictly in refs to prevent layout thrash and React re-renders.
  const gesture = React.useRef<{
    id: number;
    thumb: 'lower' | 'upper';
    startVal: Range;
    currentVal: Range;
    trackLeft: number;
    trackWidth: number;
  } | null>(null);

  const getRatio = React.useCallback(
    (val: number) => {
      const { min, max } = optionsRef.current;
      return Math.max(0, Math.min(1, (val - min) / (max - min)));
    },
    []
  );

  const paint = React.useCallback(
    (range: Range, animate: boolean) => {
      const o = optionsRef.current;
      const track = trackRef.current;
      const width = track ? track.offsetWidth : 0;
      if (!width) return;

      const [lower, upper] = range;
      const lowerRatio = getRatio(lower);
      const upperRatio = getRatio(upper);

      const lowerPx = lowerRatio * width;
      const upperPx = upperRatio * width;

      const transition = animate && !o.reduced ? `transform 360ms ${EASE_OUT}` : 'none';
      const barTransition = animate && !o.reduced ? `left 360ms ${EASE_OUT}, width 360ms ${EASE_OUT}` : 'none';

      if (lowerThumbRef.current) {
        lowerThumbRef.current.style.transition = transition;
        lowerThumbRef.current.style.transform = `translateX(${lowerPx}px)`;
        lowerThumbRef.current.setAttribute('aria-valuenow', String(lower));
        lowerThumbRef.current.setAttribute('aria-valuetext', o.format(lower));
      }

      if (upperThumbRef.current) {
        upperThumbRef.current.style.transition = transition;
        upperThumbRef.current.style.transform = `translateX(${upperPx}px)`;
        upperThumbRef.current.setAttribute('aria-valuenow', String(upper));
        upperThumbRef.current.setAttribute('aria-valuetext', o.format(upper));
      }

      if (highlightRef.current) {
        highlightRef.current.style.transition = barTransition;
        highlightRef.current.style.left = `${lowerPx}px`;
        highlightRef.current.style.width = `${Math.max(0, upperPx - lowerPx)}px`;
      }

      if (lowerReadoutRef.current) lowerReadoutRef.current.textContent = o.formatNumber(lower);
      if (upperReadoutRef.current) upperReadoutRef.current.textContent = o.formatNumber(upper);
      if (mergedReadoutRef.current) {
        mergedReadoutRef.current.textContent = lower === upper ? o.formatNumber(lower) : `${o.formatNumber(lower)} – ${o.formatNumber(upper)}`;
      }

      const merged = upperPx - lowerPx < 48;
      setIsMerged(merged);
    },
    [getRatio]
  );

  const commit = React.useCallback(
    (next: Range, animate = true) => {
      const o = optionsRef.current;
      const dist = o.minDistance ?? 0;
      let lower = snapRulerValue(next[0], o.min, o.max - dist, o.step);
      let upper = snapRulerValue(next[1], o.min + dist, o.max, o.step);

      if (lower > upper - dist) {
        if (next[0] > o.value[0]) upper = Math.min(o.max, lower + dist);
        else lower = Math.max(o.min, upper - dist);
      }

      const clean: Range = [lower, upper];
      paint(clean, animate);
      o.onChange?.(clean);
      o.onCommit?.(clean);
    },
    [paint]
  );

  const finish = React.useCallback(
    (cancelled: boolean) => {
      const g = gesture.current;
      if (!g) return;
      gesture.current = null;
      setActiveThumb(null);

      if (cancelled) {
        paint(g.startVal, true);
        optionsRef.current.onChange?.(g.startVal);
      } else {
        commit(g.currentVal, false);
      }
    },
    [commit, paint]
  );

  React.useLayoutEffect(() => {
    if (!gesture.current) paint(options.value, true);
  }, [options.value, options.min, options.max, options.reduced, paint]);

  // Handle window resizing to recalibrate positions
  React.useEffect(() => {
    const handleResize = () => {
      if (!gesture.current) paint(optionsRef.current.value, false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [paint]);

  React.useEffect(() => {
    const interrupted = () => finish(true);
    const hidden = () => {
      if (document.hidden) interrupted();
    };
    window.addEventListener('blur', interrupted);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', interrupted);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [finish]);

  React.useEffect(() => {
    if (options.disabled) finish(true);
  }, [options.disabled, finish]);

  const startDrag = React.useCallback(
    (thumb: 'lower' | 'upper', event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || !event.isPrimary || optionsRef.current.disabled) return;
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus({ preventScroll: true });

      gesture.current = {
        id: event.pointerId,
        thumb,
        startVal: [...optionsRef.current.value] as Range,
        currentVal: [...optionsRef.current.value] as Range,
        trackLeft: rect.left,
        trackWidth: Math.max(1, rect.width),
      };

      setActiveThumb(thumb);
      paint(optionsRef.current.value, false);
    },
    [paint]
  );

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const g = gesture.current;
      const o = optionsRef.current;
      if (!g || g.id !== event.pointerId) return;

      const clientX = event.clientX;
      const fraction = Math.max(0, Math.min(1, (clientX - g.trackLeft) / g.trackWidth));
      const targetVal = snapRulerValue(o.min + fraction * (o.max - o.min), o.min, o.max, o.step);
      const dist = o.minDistance ?? 0;

      let [lower, upper] = g.currentVal;

      if (g.thumb === 'lower') {
        lower = Math.min(o.max - dist, targetVal);
        // Repulsion physics: lower pushes upper forward
        if (lower > upper - dist) {
          upper = Math.min(o.max, lower + dist);
        }
      } else {
        upper = Math.max(o.min + dist, targetVal);
        // Repulsion physics: upper pushes lower backward
        if (upper < lower + dist) {
          lower = Math.max(o.min, upper - dist);
        }
      }

      if (lower === g.currentVal[0] && upper === g.currentVal[1]) return;

      g.currentVal = [lower, upper];
      paint([lower, upper], false);
      o.onChange?.([lower, upper]);
    },
    [paint]
  );

  const makeKeyHandler = React.useCallback(
    (thumb: 'lower' | 'upper') => (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(true);
        return;
      }

      const o = optionsRef.current;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;

      event.preventDefault();
      const isUp = ['ArrowRight', 'ArrowUp', 'PageUp'].includes(event.key);
      const mult = event.key.startsWith('Page') || event.shiftKey ? 10 : 1;
      const delta = o.step * mult * (isUp ? 1 : -1);
      const dist = o.minDistance ?? 0;

      let [lower, upper] = o.value;

      if (thumb === 'lower') {
        if (event.key === 'Home') lower = o.min;
        else if (event.key === 'End') lower = upper - dist;
        else lower = Math.max(o.min, Math.min(o.max - dist, lower + delta));

        if (lower > upper - dist) upper = Math.min(o.max, lower + dist);
      } else {
        if (event.key === 'Home') upper = lower + dist;
        else if (event.key === 'End') upper = o.max;
        else upper = Math.max(o.min + dist, Math.min(o.max, upper + delta));

        if (upper < lower + dist) lower = Math.max(o.min, upper - dist);
      }

      commit([lower, upper]);
    },
    [commit, finish]
  );

  return {
    trackRef,
    lowerThumbRef,
    upperThumbRef,
    highlightRef,
    lowerReadoutRef,
    upperReadoutRef,
    mergedReadoutRef,
    badgeWrapRef,
    activeThumb,
    isMerged,
    commit,
    lowerHandlers: {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => startDrag('lower', e),
      onPointerMove,
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerId === gesture.current?.id) finish(false);
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerId === gesture.current?.id) finish(true);
      },
      onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerId === gesture.current?.id) finish(true);
      },
      onBlur: () => finish(true),
      onKeyDown: makeKeyHandler('lower'),
    },
    upperHandlers: {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => startDrag('upper', e),
      onPointerMove,
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerId === gesture.current?.id) finish(false);
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerId === gesture.current?.id) finish(true);
      },
      onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerId === gesture.current?.id) finish(true);
      },
      onBlur: () => finish(true),
      onKeyDown: makeKeyHandler('upper'),
    },
  };
}
