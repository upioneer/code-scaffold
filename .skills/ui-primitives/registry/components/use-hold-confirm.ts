// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Hold to confirm (hold-to-confirm)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { EASE_OUT } from './ui-interaction-motion';

export type HoldStatus = 'idle' | 'holding' | 'pending' | 'success' | 'error';

export function useHoldConfirm(onConfirm: () => void | Promise<void>, duration: number, resetAfter: number, disabled: boolean, reduced: boolean) {
  const [status, setStatus] = React.useState<HoldStatus>('idle');
  const phase = React.useRef<HoldStatus>('idle');
  const progress = React.useRef<SVGCircleElement>(null);
  const animation = React.useRef<Animation | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = React.useRef(false);
  const owner = React.useRef<string | null>(null);
  const alive = React.useRef(false);
  const action = React.useRef(onConfirm); action.current = onConfirm;
  const setPhase = (next: HoldStatus) => { phase.current = next; setStatus(next); };
  const cancel = (source?: string) => {
    if (!held.current || (source && source !== owner.current)) return;
    held.current = false;
    if (timer.current) clearTimeout(timer.current);
    const path = progress.current;
    const from = path ? getComputedStyle(path).strokeDashoffset : '1';
    animation.current?.cancel();
    if (path && !reduced) animation.current = path.animate([{ strokeDashoffset: from }, { strokeDashoffset: '1' }], { duration: 240, easing: EASE_OUT });
    setPhase('idle');
  };
  const begin = (source: string) => {
    if (disabled || held.current || !['idle', 'error'].includes(phase.current)) return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    held.current = true; owner.current = source; setPhase('holding'); animation.current?.cancel();
    if (progress.current) animation.current = progress.current.animate([{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }], { duration, easing: 'linear', fill: 'forwards' });
    timer.current = setTimeout(async () => {
      if (!held.current || !alive.current) return;
      held.current = false; setPhase('pending');
      try { await action.current(); if (alive.current) setPhase('success'); }
      catch { if (alive.current) setPhase('error'); }
      finally {
        animation.current?.cancel();
        if (alive.current && resetAfter > 0) resetTimer.current = setTimeout(() => setPhase('idle'), resetAfter);
      }
    }, duration);
  };
  const cancelRef = React.useRef(cancel); cancelRef.current = cancel;
  React.useEffect(() => {
    alive.current = true;
    const hidden = () => { if (document.hidden) cancelRef.current(); };
    const blur = () => cancelRef.current();
    window.addEventListener('blur', blur); document.addEventListener('visibilitychange', hidden);
    return () => {
      alive.current = false; held.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      animation.current?.cancel();
      window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', hidden);
    };
  }, []);
  React.useEffect(() => { cancelRef.current(); }, [reduced]);
  React.useEffect(() => { if (disabled) cancel(); }, [disabled]);
  return { status, progress, begin, cancel };
}
