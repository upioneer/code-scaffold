// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Split pane (split-pane)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { EASE_OUT, springFrames } from './ui-interaction-motion';

type Orientation = 'horizontal' | 'vertical';

type SplitPaneOptions = {
  orientation?: Orientation;
  split?: number; // 0 to 100
  defaultSplit?: number;
  minSize?: number; // default 15
  maxSize?: number; // default 85
  disabled?: boolean;
  reduced?: boolean;
  onChange?: (split: number) => void;
  onCommit?: (split: number) => void;
};

export function useSplitPane(options: SplitPaneOptions) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const firstPaneRef = React.useRef<HTMLDivElement>(null);
  const dividerRef = React.useRef<HTMLButtonElement>(null);

  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  const [dragging, setDragging] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<'first' | 'second' | null>(null);

  const gesture = React.useRef<{
    id: number;
    startSplit: number;
    currentSplit: number;
    containerSize: number;
    containerStart: number;
  } | null>(null);

  const min = options.minSize ?? 15;
  const max = options.maxSize ?? 85;

  const paint = React.useCallback(
    (splitPercent: number, animate: boolean) => {
      const o = optionsRef.current;
      const pane = firstPaneRef.current;
      if (pane) {
        pane.style.transition = animate && !o.reduced ? `flex-basis 380ms ${EASE_OUT}` : 'none';
        pane.style.flexBasis = `${splitPercent}%`;
      }
      dividerRef.current?.setAttribute('aria-valuenow', String(Math.round(splitPercent)));
    },
    []
  );

  const commit = React.useCallback(
    (splitPercent: number, animate = true) => {
      const clean = Math.max(min, Math.min(max, splitPercent));
      paint(clean, animate);
      setCollapsed(null);
      optionsRef.current.onChange?.(clean);
      optionsRef.current.onCommit?.(clean);
    },
    [min, max, paint]
  );

  const collapse = React.useCallback(
    (side: 'first' | 'second') => {
      const pane = firstPaneRef.current;
      if (!pane) return;
      setCollapsed(side);
      const targetPercent = side === 'first' ? 0 : 100;
      paint(targetPercent, true);
      optionsRef.current.onChange?.(targetPercent);
      optionsRef.current.onCommit?.(targetPercent);
    },
    [paint]
  );

  const expand = React.useCallback(() => {
    setCollapsed(null);
    commit(optionsRef.current.defaultSplit ?? 50, true);
  }, [commit]);

  const snapCycle = React.useCallback(() => {
    const o = optionsRef.current;
    const current = o.split ?? o.defaultSplit ?? 50;
    let next = 50;
    if (Math.abs(current - 50) < 3) next = 25;
    else if (Math.abs(current - 25) < 3) next = 75;
    else next = 50;
    commit(next, true);
  }, [commit]);

  const finish = React.useCallback(
    (cancelled: boolean) => {
      const g = gesture.current;
      if (!g) return;
      gesture.current = null;
      setDragging(false);

      if (cancelled) {
        paint(g.startSplit, true);
        optionsRef.current.onChange?.(g.startSplit);
      } else {
        // If release was in rubber-band territory beyond min or max, spring back smoothly
        const o = optionsRef.current;
        const current = g.currentSplit;
        if (current < min || current > max) {
          const target = current < min ? min : max;
          const pane = firstPaneRef.current;
          if (pane && !o.reduced) {
            const frames = springFrames(current, target, 0, 480);
            const keyframes = frames.map((f) => ({ flexBasis: `${f.value}%` }));
            const anim = pane.animate(keyframes, { duration: 480, fill: 'forwards' });
            anim.onfinish = () => {
              pane.style.flexBasis = `${target}%`;
              anim.cancel();
              commit(target, false);
            };
          } else {
            commit(target, false);
          }
        } else {
          commit(g.currentSplit, false);
        }
      }
    },
    [min, max, commit, paint]
  );

  React.useLayoutEffect(() => {
    if (!gesture.current && collapsed === null) {
      const val = options.split ?? options.defaultSplit ?? 50;
      paint(val, true);
    }
  }, [options.split, options.defaultSplit, options.reduced, collapsed, paint]);

  const startDrag = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || !event.isPrimary || optionsRef.current.disabled) return;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isHorizontal = optionsRef.current.orientation !== 'vertical';
      const containerSize = isHorizontal ? rect.width : rect.height;
      const containerStart = isHorizontal ? rect.left : rect.top;

      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus({ preventScroll: true });

      const currentSplit = optionsRef.current.split ?? optionsRef.current.defaultSplit ?? 50;

      gesture.current = {
        id: event.pointerId,
        startSplit: currentSplit,
        currentSplit,
        containerSize: Math.max(1, containerSize),
        containerStart,
      };

      setDragging(true);
      setCollapsed(null);
      paint(currentSplit, false);
    },
    [paint]
  );

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const g = gesture.current;
      const o = optionsRef.current;
      if (!g || g.id !== event.pointerId) return;

      const isHorizontal = o.orientation !== 'vertical';
      const clientPos = isHorizontal ? event.clientX : event.clientY;
      const rawPercent = ((clientPos - g.containerStart) / g.containerSize) * 100;

      // Rubber-band resistance curve beyond min/max limits
      let dampedPercent = rawPercent;
      if (rawPercent < min) {
        const overflow = min - rawPercent;
        dampedPercent = min - Math.pow(overflow, 0.7);
      } else if (rawPercent > max) {
        const overflow = rawPercent - max;
        dampedPercent = max + Math.pow(overflow, 0.7);
      }

      g.currentSplit = dampedPercent;
      paint(dampedPercent, false);
      o.onChange?.(dampedPercent);
    },
    [min, max, paint]
  );

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(true);
        return;
      }

      const isHorizontal = optionsRef.current.orientation !== 'vertical';
      const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

      if (![prevKey, nextKey, 'Home', 'End', 'Enter'].includes(event.key)) return;
      event.preventDefault();

      if (event.key === 'Enter') {
        snapCycle();
        return;
      }

      const current = optionsRef.current.split ?? optionsRef.current.defaultSplit ?? 50;
      if (event.key === 'Home') {
        commit(min);
        return;
      }
      if (event.key === 'End') {
        commit(max);
        return;
      }

      const mult = event.shiftKey ? 10 : 1;
      const delta = (event.key === nextKey ? 1 : -1) * mult;
      commit(current + delta);
    },
    [min, max, snapCycle, commit, finish]
  );

  return {
    containerRef,
    firstPaneRef,
    dividerRef,
    dragging,
    collapsed,
    collapse,
    expand,
    snapCycle,
    dividerProps: {
      onPointerDown: startDrag,
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
      onDoubleClick: snapCycle,
      onBlur: () => finish(true),
      onKeyDown,
    },
  };
}
