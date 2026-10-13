// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Hold to confirm (hold-to-confirm)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { CircleAlert, Fingerprint } from 'lucide-react';
import { TextMorph } from './text-morph';
import { INTERACTION_FOCUS, interactionIcon, useInteractionReducedMotion } from './ui-interaction-motion';
import { useHoldConfirm, type HoldStatus } from './use-hold-confirm';
export type { HoldStatus } from './use-hold-confirm';

export interface HoldToConfirmProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'> {
  onConfirm: () => void | Promise<void>;
  duration?: number;
  resetAfter?: number;
  labels?: Partial<Record<HoldStatus, string>>;
  icon?: React.ReactNode;
}
const LABELS = { idle: 'Hold to confirm', holding: 'Keep holding', pending: 'Confirming', success: 'Confirmed', error: 'Hold to retry' };

/** Press and keep holding. The threshold owns the action; a click never submits it. */
export function HoldToConfirm({ onConfirm, duration = 1100, resetAfter = 2200, labels, icon, disabled = false, className = '', ...props }: HoldToConfirmProps) {
  const reduced = useInteractionReducedMotion();
  const delay = Number.isFinite(duration) ? Math.max(300, Math.min(5000, duration)) : 1100;
  const { status, progress, begin, cancel } = useHoldConfirm(onConfirm, delay, resetAfter, disabled, reduced);
  const text = { ...LABELS, ...labels }[status];
  const hint = React.useId();
  const pending = status === 'pending', succeeded = status === 'success';
  return <>
    <button {...props} type="button" disabled={disabled} aria-describedby={hint} aria-busy={pending || undefined} aria-disabled={pending || succeeded || disabled || undefined}
      onPointerDown={(event) => {
        if (event.button !== 0 || !event.isPrimary) return;
        event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus({ preventScroll: true }); begin(`pointer:${event.pointerId}`);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) cancel(`pointer:${event.pointerId}`);
      }}
      onPointerUp={(event) => cancel(`pointer:${event.pointerId}`)} onPointerCancel={(event) => cancel(`pointer:${event.pointerId}`)} onLostPointerCapture={(event) => cancel(`pointer:${event.pointerId}`)} onPointerLeave={(event) => cancel(`pointer:${event.pointerId}`)} onBlur={() => cancel()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); cancel(); }
        if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) begin(`key:${event.key}`); }
      }} onKeyUp={(event) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); cancel(`key:${event.key}`); } }}
      onClick={(event) => event.preventDefault()}
      className={`cursor-pointer disabled:cursor-default aria-disabled:cursor-default relative inline-flex h-11 select-none items-center justify-center gap-2.5 overflow-clip rounded-full border px-4 text-[13px] font-medium transition-colors disabled:opacity-40 ${status === 'error' ? 'border-destructive/40 bg-destructive/5 text-destructive' : 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'} ${INTERACTION_FOCUS} ${className}`}
      style={{ touchAction: 'none', ...props.style }}>
      <span aria-hidden="true" className="relative size-5 shrink-0">
        <span className="absolute inset-0 flex items-center justify-center [&>svg]:size-4" style={interactionIcon(status === 'idle' || status === 'holding', reduced)}>{icon ?? <Fingerprint />}</span>
        <svg viewBox="0 0 24 24" className="absolute -inset-1 size-7 -rotate-90" style={{ opacity: status === 'holding' ? 1 : 0, transition: reduced ? 'none' : 'opacity 180ms ease-out' }}>
          <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
          <circle ref={progress} cx="12" cy="12" r="10.5" pathLength="1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1" strokeDashoffset="1" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center" style={interactionIcon(pending, reduced)}><span className={`size-4 rounded-full border-[1.5px] border-current/30 border-t-current ${pending && !reduced ? 'animate-spin' : ''}`} /></span>
        <svg viewBox="0 0 20 20" className="absolute inset-0 size-5" style={interactionIcon(succeeded, reduced)}><path d="m4 10 4 4 8-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: succeeded ? 0 : 1, transition: reduced ? 'none' : 'stroke-dashoffset 380ms ease-out 80ms' }} /></svg>
        <CircleAlert className="absolute inset-0 size-5" style={interactionIcon(status === 'error', reduced)} />
      </span>
      <TextMorph>{text}</TextMorph>
    </button>
    <span id={hint} className="sr-only">Hold the pointer, Space or Enter for {delay / 1000} seconds. Release early or press Escape to cancel.</span>
    <span role="status" className="sr-only">{status === 'idle' ? '' : text}</span>
  </>;
}
