// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Image compare (image-compare)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

/* ─────────────────────────────────────────────────────────
 * IMAGE COMPARE: two pictures, one divide
 *
 *   drag     press anywhere and the divide is thrown to your
 *            finger, then follows it exactly
 *   reveal   the "after" picture sits in a window that slides one
 *            way while the picture inside slides back the other:
 *            two moving layers, nothing repainted while you drag
 *   labels   each side's label fades as its picture runs out
 *   keys     arrows by 1%, Shift by 10%, Home and End; a
 *            double-click brings the divide home to the middle
 * ───────────────────────────────────────────────────────── */

import * as React from 'react';
import { ChevronsLeftRight, ImageOff } from 'lucide-react';
import { EASE_OUT, INTERACTION_FOCUS, useInteractionReducedMotion } from './ui-interaction-motion';
import { TextMorph } from './text-morph';

export type CompareImage = { src: string; alt: string; className?: string };
export interface ImageCompareProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  before: CompareImage;
  after: CompareImage;
  beforeLabel?: string;
  afterLabel?: string;
  label?: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  onValueCommit?: (value: number) => void;
  aspectRatio?: number;
}
const clamp = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50);

function Picture({ image }: { image: CompareImage }) {
  const [failed, setFailed] = React.useState(false);
  return failed ? (
    <div role="img" aria-label={`${image.alt} (unavailable)`} className="flex size-full items-center justify-center bg-muted text-muted-foreground">
      <ImageOff className="size-6" aria-hidden="true" />
    </div>
  ) : (
    <img src={image.src} alt={image.alt} draggable={false} decoding="async" onError={() => setFailed(true)} className={`size-full select-none object-cover ${image.className ?? ''}`} />
  );
}

// The same strings are written by React and by the gesture, so either can take over from the other.
const windowAt = (p: number) => `translate3d(${p - 100}%,0,0)`;
const pictureAt = (p: number) => `translate3d(${100 - p}%,0,0)`;
const lineAt = (p: number) => `translate3d(${p}%,0,0)`;
const handleAt = (p: number) => `translate3d(clamp(22px, ${p}%, calc(100% - 22px)),0,0)`;

export function ImageCompare({ before, after, beforeLabel = 'Before', afterLabel = 'After', label = 'Image comparison', value, defaultValue = 50, onValueChange, onValueCommit, aspectRatio = 1.6, className = '', ...props }: ImageCompareProps) {
  const reduced = useInteractionReducedMotion();
  const [own, setOwn] = React.useState(clamp(defaultValue));
  const position = clamp(value ?? own);
  const frame = React.useRef<HTMLDivElement>(null);
  const win = React.useRef<HTMLDivElement>(null);
  const picture = React.useRef<HTMLDivElement>(null);
  const line = React.useRef<HTMLDivElement>(null);
  const rail = React.useRef<HTMLDivElement>(null);
  const handle = React.useRef<HTMLButtonElement>(null);
  const afterTag = React.useRef<HTMLSpanElement>(null);
  const beforeTag = React.useRef<HTMLSpanElement>(null);
  const gesture = React.useRef<{ id: number; origin: number; last: number; left: number; width: number; moved: boolean } | null>(null);
  const hintId = React.useId();

  const motion = (on: boolean) => {
    const t = on && !reduced ? `transform 420ms ${EASE_OUT}` : 'none';
    for (const el of [win.current, picture.current, line.current, rail.current]) if (el) el.style.transition = t;
  };
  const paint = (p: number) => {
    if (win.current) win.current.style.transform = windowAt(p);
    if (picture.current) picture.current.style.transform = pictureAt(p);
    if (line.current) line.current.style.transform = lineAt(p);
    if (rail.current) rail.current.style.transform = handleAt(p);
    if (afterTag.current) afterTag.current.style.opacity = p > 12 ? '1' : '0';
    if (beforeTag.current) beforeTag.current.style.opacity = p < 88 ? '1' : '0';
    handle.current?.setAttribute('aria-valuenow', String(Math.round(p)));
    handle.current?.setAttribute('aria-valuetext', `${Math.round(p)}% ${afterLabel}`);
  };
  /** Settle on a value: React state, the parent, and an eased move when it wasn't under the finger. */
  const go = (next: number, animate: boolean, commit = true) => {
    const p = clamp(next);
    motion(animate);
    paint(p);
    if (value === undefined) setOwn(p);
    onValueChange?.(p);
    if (commit) onValueCommit?.(p);
    return p;
  };

  // A controlled value that changes from outside eases there.
  React.useLayoutEffect(() => {
    if (gesture.current) return;
    motion(true);
    paint(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const finish = (event: React.PointerEvent, cancelled = false) => {
    const state = gesture.current;
    if (!state || event.pointerId !== state.id) return;
    gesture.current = null;
    // A release near the middle snaps home.
    const next = cancelled ? state.origin : Math.abs(state.last - 50) < 3 ? 50 : state.last;
    go(next, cancelled || next !== state.last || !state.moved, !cancelled);
  };

  return (
    <div {...props} role="region" aria-label={label} className={`w-full text-foreground ${className}`}>
      <div
        ref={frame}
        className="relative isolate cursor-ew-resize overflow-clip rounded-[20px] border border-border bg-muted"
        style={{ aspectRatio: Math.max(0.25, aspectRatio), touchAction: 'pan-y' }}
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return;
          // Keep the handle focused: the mousedown that follows would otherwise move focus to the page.
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.setPointerCapture(event.pointerId);
          // Focus follows the press so the arrow keys work next, without a keyboard focus ring after a mouse drag.
          handle.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
          const p = clamp(((event.clientX - rect.left) / Math.max(1, rect.width)) * 100);
          gesture.current = { id: event.pointerId, origin: position, last: p, left: rect.left, width: Math.max(1, rect.width), moved: false };
          // Thrown to the finger, then attached to it.
          motion(true);
          paint(p);
        }}
        onPointerMove={(event) => {
          const state = gesture.current;
          if (!state || state.id !== event.pointerId) return;
          if (!state.moved) {
            state.moved = true;
            motion(false);
          }
          state.last = clamp(((event.clientX - state.left) / state.width) * 100);
          paint(state.last);
          onValueChange?.(state.last);
        }}
        onDoubleClick={() => go(50, true)}
        onPointerUp={(event) => finish(event)}
        onPointerCancel={(event) => finish(event, true)}
        onLostPointerCapture={(event) => finish(event, true)}
      >
        <div className="absolute inset-0">
          <Picture key={before.src} image={before} />
        </div>
        <div ref={win} className="absolute inset-0 overflow-hidden will-change-transform" style={{ transform: windowAt(position) }}>
          <div ref={picture} className="absolute inset-0 will-change-transform" style={{ transform: pictureAt(position) }}>
            <Picture key={after.src} image={after} />
          </div>
        </div>
        <div ref={line} aria-hidden="true" className="pointer-events-none absolute inset-0 will-change-transform" style={{ transform: lineAt(position) }}>
          <span className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-background" />
        </div>
        <div ref={rail} className="pointer-events-none absolute inset-0 will-change-transform" style={{ transform: handleAt(position) }}>
          <button
            ref={handle}
            type="button"
            role="slider"
            aria-label={label}
            aria-describedby={hintId}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            aria-valuetext={`${Math.round(position)}% ${afterLabel}`}
            aria-orientation="horizontal"
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const step = (event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 10 : 1);
              go(event.key === 'Home' ? 0 : event.key === 'End' ? 100 : position + step, true);
            }}
            className={`pointer-events-auto absolute left-0 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-border bg-background text-foreground ${INTERACTION_FOCUS}`}
          >
            <ChevronsLeftRight className="size-4" aria-hidden="true" />
          </button>
        </div>
        <span
          ref={afterTag}
          className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-medium transition-opacity duration-300 motion-reduce:transition-none"
          style={{ opacity: position > 12 ? 1 : 0 }}
        >
          <TextMorph>{afterLabel}</TextMorph>
        </span>
        <span
          ref={beforeTag}
          className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-medium transition-opacity duration-300 motion-reduce:transition-none"
          style={{ opacity: position < 88 ? 1 : 0 }}
        >
          <TextMorph>{beforeLabel}</TextMorph>
        </span>
      </div>
      <p id={hintId} className="sr-only">
        Drag to compare. Arrow keys adjust by one percent, Shift and arrows by ten. Home and End reveal either image. Double-click to centre.
      </p>
    </div>
  );
}
