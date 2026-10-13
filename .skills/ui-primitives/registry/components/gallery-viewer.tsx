// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Expanding gallery (expanding-gallery)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GalleryPicture, type GalleryImage } from './gallery-picture';
import { EASE_OUT, EASE_SETTLE, INTERACTION_FOCUS, releaseVelocity, samplePointer, useInteractionReducedMotion, type PointerSample } from './ui-interaction-motion';
import { NumberRoll } from './number-roll';
import { TextMorph } from './text-morph';

type Props = { images: GalleryImage[]; index: number; label: string; openingRect: DOMRect | null; getOrigin: (id: string) => HTMLElement | undefined; onSelect: (index: number) => void; onClose: () => void };
const CONTROL = `cursor-pointer disabled:cursor-default flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-accent disabled:opacity-30 ${INTERACTION_FOCUS}`;

/**
 * Holds the page still behind the viewer without touching <html>: changing the root's overflow restyles and
 * relayouts the whole page in the frame the viewer opens, which is the stutter people feel. The viewer covers the
 * screen, so stopping wheel and touch scrolling on it is enough.
 */
function holdScroll(el: HTMLElement) {
  const stop = (event: Event) => event.preventDefault();
  el.addEventListener('wheel', stop, { passive: false });
  el.addEventListener('touchmove', stop, { passive: false });
  return () => {
    el.removeEventListener('wheel', stop);
    el.removeEventListener('touchmove', stop);
  };
}
function rectTransform(from: DOMRect, to: DOMRect) {
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / Math.max(1, to.width)}, ${from.height / Math.max(1, to.height)})`;
}

function LeavingStudy({ image, direction, from }: { image: GalleryImage; direction: number; from: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const animation = el.animate([{ opacity: 1, transform: `translateX(${from}px)` }, { opacity: 0, transform: `translateX(${-direction * 56}px)` }], { duration: 280, easing: EASE_OUT, fill: 'forwards' });
    return () => animation.cancel();
  }, [direction, from]);
  return <div ref={ref} aria-hidden="true" inert className="pointer-events-none absolute inset-0"><GalleryPicture image={image} eager /></div>;
}

export function GalleryViewer({ images, index, label, openingRect, getOrigin, onSelect, onClose }: Props) {
  const reduced = useInteractionReducedMotion();
  const dialog = React.useRef<HTMLDivElement>(null);
  const closeButton = React.useRef<HTMLButtonElement>(null);
  const picture = React.useRef<HTMLDivElement>(null);
  const content = React.useRef<HTMLDivElement>(null);
  const surface = React.useRef<HTMLDivElement>(null);
  const caption = React.useRef<HTMLDivElement>(null);
  const animations = React.useRef<Animation[]>([]);
  const closing = React.useRef(false);
  const mounted = React.useRef(false);
  const previousSize = React.useRef<{ width: number; height: number } | null>(null);
  const first = React.useRef(true);
  const direction = React.useRef(1);
  const drag = React.useRef<{ id: number; start: number; dx: number; samples: PointerSample[] } | null>(null);
  const id = React.useId();
  const image = images[index];
  const [ghost, setGhost] = React.useState<{ image: GalleryImage; direction: number; from: number } | null>(null);

  React.useEffect(() => {
    if (!ghost) return;
    const timer = window.setTimeout(() => setGhost(null), 300);
    return () => window.clearTimeout(timer);
  }, [ghost]);

  const cancelAnimations = () => { animations.current.forEach((animation) => animation.cancel()); animations.current = []; };

  React.useLayoutEffect(() => {
    const el = dialog.current;
    if (!el) return;
    mounted.current = true;
    // A manual popover sits in the top layer like a modal dialog but doesn't make the page inert, which restyles
    // every element on the page twice (open and close). Modality is kept by hand: aria-modal, focus trap, Escape.
    el.showPopover();
    closeButton.current?.focus({ preventScroll: true });
    const unlock = holdScroll(el);
    return () => { mounted.current = false; cancelAnimations(); if (el.matches(':popover-open')) el.hidePopover(); unlock(); first.current = true; closing.current = false; };
  }, []);

  React.useLayoutEffect(() => {
    const frame = picture.current;
    if (!frame) return;
    cancelAnimations();
    frame.style.transform = '';
    if (reduced) { first.current = false; return; }
    const origin = first.current ? openingRect : getOrigin(image.id)?.getBoundingClientRect();
    const target = frame.getBoundingClientRect();
    const entering = first.current;
    first.current = false;
    if (entering) animations.current.push(frame.animate(origin ? [
      { transform: rectTransform(origin, target), borderRadius: '16px' },
      { transform: 'none', borderRadius: '12px' },
    ] : [{ opacity: 0 }, { opacity: 1 }], { duration: 560, easing: EASE_OUT }));
    else if (content.current) animations.current.push(content.current.animate([
      { transform: `translateX(${direction.current * 40}px) scale(0.985)`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ], { duration: 380, easing: EASE_OUT }));
    const size = previousSize.current;
    previousSize.current = null;
    if (!entering && size && (Math.abs(size.width - target.width) > 0.5 || Math.abs(size.height - target.height) > 0.5)) {
      animations.current.push(frame.animate([
        { width: `${size.width}px`, height: `${size.height}px` },
        { width: `${target.width}px`, height: `${target.height}px` },
      ], { duration: 380, easing: EASE_OUT }));
    }
    if (entering && surface.current) animations.current.push(surface.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' }));
    if (caption.current) animations.current.push(caption.current.animate([
      { opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' },
    ], { duration: 320, delay: entering ? 180 : 60, fill: 'backwards', easing: EASE_OUT }));
    return cancelAnimations;
    // Geometry is sampled on selection; a resize simply reflows the settled viewer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.id, reduced]);

  const navigate = (next: number) => {
    if (closing.current || next < 0 || next >= images.length || next === index) return;
    direction.current = Math.sign(next - index);
    const rect = picture.current?.getBoundingClientRect();
    previousSize.current = rect ? { width: rect.width, height: rect.height } : null;
    if (!reduced) setGhost({ image, direction: direction.current, from: (drag.current?.dx ?? 0) * 0.65 });
    drag.current = null;
    onSelect(next);
  };

  const close = async () => {
    if (closing.current) return;
    closing.current = true;
    const frame = picture.current;
    const current = frame?.getBoundingClientRect();
    cancelAnimations();
    const finish = () => { if (mounted.current && closing.current) { closing.current = false; if (dialog.current?.matches(':popover-open')) dialog.current.hidePopover(); onClose(); } };
    if (reduced || !frame || !current) { finish(); return; }
    frame.style.transform = '';
    const base = frame.getBoundingClientRect();
    const target = getOrigin(image.id)?.getBoundingClientRect();
    const inView = target && target.bottom > 0 && target.top < window.innerHeight;
    const animation = frame.animate([
      { transform: rectTransform(current, base), opacity: 1, borderRadius: '12px' },
      { transform: inView ? rectTransform(target, base) : 'scale(0.96)', opacity: inView ? 1 : 0, borderRadius: '16px' },
    ], { duration: 380, easing: EASE_OUT, fill: 'forwards' });
    animations.current.push(animation);
    if (surface.current) animations.current.push(surface.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, fill: 'forwards' }));
    if (caption.current) animations.current.push(caption.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100, fill: 'forwards' }));
    try { await animation.finished; finish(); } catch { finish(); }
  };

  const finishDrag = (event: React.PointerEvent, cancelled = false) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    const velocity = releaseVelocity(state.samples, event.timeStamp);
    const next = index + (state.dx < 0 ? 1 : -1);
    if (!cancelled && (Math.abs(state.dx) > 64 || (Math.abs(state.dx) > 12 && Math.abs(velocity) > 0.5)) && next >= 0 && next < images.length) navigate(next);
    else if (picture.current) {
      const frame = picture.current;
      const from = frame.style.transform || 'none';
      frame.style.transform = '';
      if (!reduced) animations.current.push(frame.animate([{ transform: from }, { transform: 'none' }], { duration: 360, easing: EASE_SETTLE }));
    }
    drag.current = null;
  };

  return (
    <div ref={dialog} popover="manual" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} data-lenis-prevent
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); void close(); return; }
        if (event.key === 'Tab') {
          // Keep focus inside the viewer, as a modal dialog would.
          const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
          const first = focusable[0], last = focusable[focusable.length - 1];
          if (first && last && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
          }
          return;
        }
        if (event.key === 'PageUp' || event.key === 'PageDown') event.preventDefault();
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
          event.preventDefault(); navigate(event.key === 'Home' ? 0 : event.key === 'End' ? images.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1));
        }
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent">
      <div ref={surface} className="absolute inset-0 cursor-zoom-out bg-background" onClick={() => void close()} />
      <div className="pointer-events-none relative flex h-full flex-col items-center justify-center gap-5 px-4 pb-5 pt-20 sm:gap-6">
        <div className="pointer-events-auto absolute inset-x-5 top-5 flex items-center justify-between sm:inset-x-8">
          <span className="text-xs font-medium tracking-wide">{label}</span>
          <button ref={closeButton} type="button" aria-label="Close gallery" onClick={() => void close()} className={CONTROL}><X className="size-4" aria-hidden="true" /></button>
        </div>
        <div ref={picture} className="pointer-events-auto relative shrink-0 origin-top-left cursor-grab overflow-hidden rounded-xl bg-muted will-change-transform active:cursor-grabbing"
          style={{ aspectRatio: `${Math.max(1, image.width)} / ${Math.max(1, image.height)}`, width: `min(88vw, calc((100dvh - 260px) * ${Math.max(1, image.width) / Math.max(1, image.height)}), 980px)`, touchAction: 'pan-y' }}
          onPointerDown={(event) => {
            if (closing.current || event.button !== 0 || !event.isPrimary) return;
            cancelAnimations();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { id: event.pointerId, start: event.clientX, dx: 0, samples: [{ x: event.clientX, time: event.timeStamp }] };
          }}
          onPointerMove={(event) => {
            const state = drag.current;
            if (!state || state.id !== event.pointerId) return;
            state.dx = event.clientX - state.start;
            samplePointer(state.samples, event.clientX, event.timeStamp);
            const edge = (index === 0 && state.dx > 0) || (index === images.length - 1 && state.dx < 0);
            if (!reduced) event.currentTarget.style.transform = `translateX(${state.dx * (edge ? 0.18 : 0.65)}px)`;
          }}
          onPointerUp={(event) => finishDrag(event)} onPointerCancel={(event) => finishDrag(event, true)} onLostPointerCapture={(event) => finishDrag(event, true)}>
          {ghost && !reduced && <LeavingStudy key={ghost.image.id} image={ghost.image} direction={ghost.direction} from={ghost.from} />}
          <div ref={content} className="relative size-full"><GalleryPicture key={image.src} image={image} eager /></div>
        </div>
        <div ref={caption} className="pointer-events-auto w-full max-w-[720px] px-2">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <h2 id={`${id}-title`} className="text-lg font-medium tracking-[-0.025em] sm:text-2xl"><TextMorph animateWidth={false}>{image.title}</TextMorph></h2>
              <p id={`${id}-description`} className="mt-1 line-clamp-2 max-w-[500px] text-[12px] leading-relaxed text-muted-foreground sm:text-sm"><TextMorph animateWidth={false}>{image.description ?? image.alt}</TextMorph></p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" aria-label="Previous image" disabled={index === 0} onClick={() => navigate(index - 1)} className={CONTROL}><ChevronLeft className="size-4" aria-hidden="true" /></button>
              <button type="button" aria-label="Next image" disabled={index === images.length - 1} onClick={() => navigate(index + 1)} className={CONTROL}><ChevronRight className="size-4" aria-hidden="true" /></button>
            </div>
          </div>
          <p aria-live="polite" aria-atomic="true" className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"><NumberRoll value={index + 1} format={{ minimumIntegerDigits: 2 }} /> / <NumberRoll value={images.length} format={{ minimumIntegerDigits: 2 }} />{image.meta && <span> · <TextMorph>{image.meta}</TextMorph></span>}</p>
        </div>
      </div>
    </div>
  );
}
