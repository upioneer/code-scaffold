// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Card deck (card-deck)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { releaseVelocity, samplePointer, springFrames, type PointerSample } from './ui-interaction-motion';

export type DeckThrow = { id: string; direction: number; from: number; velocity: number };

export function useCardDeckGesture({ id, count, reduced, onThrow, onProgress }: {
  id: string | undefined;
  count: number;
  reduced: boolean;
  onThrow: (direction: number, from: number, velocity: number) => boolean;
  /** How far the front card has travelled toward a throw, 0–1; the stack behind rises with it. */
  onProgress: (progress: number, settle: boolean) => void;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const frontRef = React.useRef<HTMLDivElement>(null);
  const animation = React.useRef<Animation | null>(null);
  const drag = React.useRef<{ pointer: number; startX: number; startY: number; base: number; x: number; width: number; horizontal: boolean; samples: PointerSample[] } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  React.useEffect(() => () => { animation.current?.cancel(); }, []);
  React.useLayoutEffect(() => {
    drag.current = null;
    setDragging(false);
    animation.current?.cancel();
    if (frontRef.current) frontRef.current.style.transform = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reduced]);

  const settle = (from: number, velocity: number) => {
    const front = frontRef.current;
    if (!front) return;
    front.style.transform = '';
    if (reduced) return;
    animation.current?.cancel();
    animation.current = front.animate(springFrames(from, 0, velocity).map(({ value, offset }) => ({
      transform: `translateX(${value}px) rotate(${value / 24}deg)`, offset,
    })), { duration: 520, easing: 'linear' });
  };

  const finish = (event: React.PointerEvent, cancelled: boolean) => {
    const state = drag.current;
    if (!state || state.pointer !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    onProgress(0, true);
    const velocity = releaseVelocity(state.samples, event.timeStamp);
    const crossed = Math.abs(state.x) > Math.min(100, state.width * 0.27);
    const flicked = Math.abs(state.x) > 16 && Math.abs(velocity) > 0.55 && Math.sign(velocity) === Math.sign(state.x);
    if (!cancelled && state.horizontal && (crossed || flicked)) { if (!onThrow(state.x < 0 ? 1 : -1, state.x, velocity)) settle(state.x, velocity); }
    else settle(state.x, cancelled ? 0 : velocity);
  };

  return {
    rootRef, frontRef, dragging,
    handlers: {
      onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
        if (count < 2 || event.button !== 0 || !event.isPrimary || (event.target as HTMLElement).closest('a,button,input,textarea,select,[data-deck-no-drag]')) return;
        const transform = getComputedStyle(event.currentTarget).transform;
        const base = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41;
        animation.current?.cancel();
        if (!reduced) event.currentTarget.style.transform = `translateX(${base}px) rotate(${base / 24}deg)`;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, base, x: base, width: event.currentTarget.clientWidth, horizontal: false, samples: [{ x: event.clientX, time: event.timeStamp }] };
      },
      onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
        const state = drag.current;
        if (!state || state.pointer !== event.pointerId) return;
        const dx = event.clientX - state.startX, dy = event.clientY - state.startY;
        if (!state.horizontal) {
          if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { drag.current = null; settle(state.base, 0); onProgress(0, true); return; }
          if (Math.abs(dx) < 6) return;
          state.horizontal = true;
          setDragging(true);
        }
        state.x = state.base + dx;
        samplePointer(state.samples, event.clientX, event.timeStamp);
        if (!reduced) {
          event.currentTarget.style.transform = `translateX(${state.x}px) rotate(${Math.max(-16, Math.min(16, state.x / 24))}deg)`;
          onProgress(Math.min(1, Math.abs(state.x) / (state.width * 0.65)), false);
        }
      },
      onPointerUp: (event: React.PointerEvent) => finish(event, false),
      onPointerCancel: (event: React.PointerEvent) => finish(event, true),
      onLostPointerCapture: (event: React.PointerEvent) => finish(event, true),
    },
  };
}
