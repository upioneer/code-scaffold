// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Swipe actions (swipe-actions)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { springFrames } from './ui-interaction-motion';

type Gesture = { id: number; x: number; y: number; origin: number; last: number; started: boolean; width: number };

/** Measure once at pointer-down; every move writes only the foreground transform. */
export function useSwipeReveal(reduced: boolean, disabled: boolean) {
  const content = React.useRef<HTMLDivElement>(null);
  const actions = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const position = React.useRef(0);
  const gesture = React.useRef<Gesture | null>(null);
  const animation = React.useRef<Animation | null>(null);
  const suppressed = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  const paint = (x: number) => { position.current = x; if (content.current) content.current.style.transform = `translate3d(${x}px,0,0)`; };
  const settle = (show: boolean, restoreFocus = false) => {
    const from = animation.current?.playState === 'running' && content.current ? new DOMMatrixReadOnly(getComputedStyle(content.current).transform).m41 : position.current;
    const target = show ? -(actions.current?.offsetWidth ?? 0) : 0;
    animation.current?.cancel(); paint(target); setOpen(show);
    if (!reduced && content.current && Math.abs(from - target) > 0.5) {
      animation.current = content.current.animate(springFrames(from, target, 0, 420).map(({ value, offset }) => ({ transform: `translate3d(${value}px,0,0)`, offset })), { duration: 420, easing: 'linear' });
    }
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  };
  const finish = (cancelled: boolean) => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    if (!g.started) return;
    suppressed.current = true;
    settle(cancelled ? g.origin < 0 : -g.last > g.width * 0.45);
  };
  const finishRef = React.useRef(finish); finishRef.current = finish;
  React.useEffect(() => {
    const cancel = () => finishRef.current(true);
    const hidden = () => { if (document.hidden) cancel(); };
    window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', hidden);
    const observer = new ResizeObserver(() => { if (position.current < 0 && !gesture.current) paint(-(actions.current?.offsetWidth ?? 0)); });
    if (actions.current) observer.observe(actions.current);
    return () => { animation.current?.cancel(); observer.disconnect(); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  React.useEffect(() => { if (disabled) finishRef.current(true); }, [disabled]);
  return {
    content, actions, trigger, open, settle,
    handlers: {
      onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
        suppressed.current = false;
        if (disabled || event.button !== 0 || !event.isPrimary || (event.target as Element).closest('button, a, input, textarea, select, [role="slider"]')) return;
        const current = animation.current?.playState === 'running' && content.current ? new DOMMatrixReadOnly(getComputedStyle(content.current).transform).m41 : position.current;
        animation.current?.cancel(); paint(current);
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: position.current, last: position.current, started: false, width: actions.current?.offsetWidth ?? 0 };
      },
      onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
        const g = gesture.current;
        if (!g || event.pointerId !== g.id) return;
        const dx = event.clientX - g.x, dy = event.clientY - g.y;
        if (!g.started) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          if (Math.abs(dy) > Math.abs(dx)) { gesture.current = null; return; }
          g.started = true; event.currentTarget.setPointerCapture(event.pointerId);
        }
        const raw = g.origin + dx;
        g.last = raw > 0 ? Math.min(18, raw * 0.15) : raw < -g.width ? -g.width - Math.min(18, (-raw - g.width) * 0.15) : raw;
        paint(g.last);
      },
      onPointerUp(event: React.PointerEvent<HTMLDivElement>) { if (event.pointerId === gesture.current?.id) finish(false); },
      onPointerCancel(event: React.PointerEvent<HTMLDivElement>) { if (event.pointerId === gesture.current?.id) finish(true); },
      onLostPointerCapture(event: React.PointerEvent<HTMLDivElement>) { if (event.pointerId === gesture.current?.id) finish(true); },
      onClickCapture(event: React.MouseEvent) { if (suppressed.current) { event.preventDefault(); event.stopPropagation(); suppressed.current = false; } },
      onKeyDown(event: React.KeyboardEvent) { if (event.key === 'Escape') { event.preventDefault(); settle(false, true); } },
      onBlur(event: React.FocusEvent) { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { gesture.current = null; settle(false); } },
    },
  };
}
