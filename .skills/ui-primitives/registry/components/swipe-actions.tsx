// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Swipe actions (swipe-actions)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { StatusButton, type ActionStatus } from './status-button';
import { INTERACTION_FOCUS, useInteractionReducedMotion } from './ui-interaction-motion';
import { useSwipeReveal } from './use-swipe-reveal';

export type SwipeAction = { id: string; label: string; icon?: React.ReactNode; pendingLabel?: string; successLabel?: string; onAction: () => void | Promise<void>; disabled?: boolean };
export interface SwipeActionsProps extends React.HTMLAttributes<HTMLDivElement> { actions: SwipeAction[]; label: string; disabled?: boolean }

/** A foreground row parts to reveal explicit actions. Crossing a swipe threshold never performs an action. */
export function SwipeActions({ actions, label, disabled = false, children, className = '', ...props }: SwipeActionsProps) {
  const reduced = useInteractionReducedMotion();
  const [result, setResult] = React.useState<{ id: string; status: ActionStatus } | null>(null);
  const busy = React.useRef(false), alive = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipe = useSwipeReveal(reduced, disabled || result?.status === 'pending');
  const id = React.useId();
  React.useEffect(() => { alive.current = true; return () => { alive.current = false; if (timer.current) clearTimeout(timer.current); }; }, []);
  const execute = async (action: SwipeAction) => {
    if (busy.current || result?.status === 'success' || disabled || action.disabled) return;
    busy.current = true; if (timer.current) clearTimeout(timer.current); setResult({ id: action.id, status: 'pending' });
    try {
      await action.onAction();
      if (alive.current) {
        setResult({ id: action.id, status: 'success' });
        timer.current = setTimeout(() => {
          const ownsFocus = swipe.content.current?.parentElement?.contains(document.activeElement) ?? false;
          setResult(null); swipe.settle(false, ownsFocus);
        }, 1300);
      }
    } catch { if (alive.current) setResult({ id: action.id, status: 'error' }); }
    finally { busy.current = false; }
  };
  return <div {...props} {...swipe.handlers} role="group" aria-label={label} className={`relative isolate overflow-hidden rounded-[18px] border border-border bg-muted/35 text-foreground ${className}`} style={{ touchAction: 'pan-y', ...props.style }}>
    <div ref={swipe.actions} id={id} inert={!swipe.open} aria-hidden={!swipe.open} className="absolute inset-y-0 right-0 flex max-w-[80%] items-stretch">
      {actions.map((action) => <div key={action.id} className="flex w-[84px] min-w-0 items-center justify-center border-l border-border px-1">
        <StatusButton status={result?.id === action.id ? result.status : 'idle'} labels={{ idle: action.label, pending: action.pendingLabel ?? 'Working', success: action.successLabel ?? 'Done', error: 'Retry' }}
          icon={action.icon} variant="ghost" size="sm" disabled={disabled || action.disabled} aria-disabled={result?.status === 'pending' || result?.status === 'success' || disabled || action.disabled || undefined} onClick={() => void execute(action)} className="!h-auto flex-col gap-1.5 !px-1 !py-2 !text-[11px]" />
      </div>)}
    </div>
    <div ref={swipe.content} className="relative flex min-h-[88px] items-center gap-3 rounded-[17px] bg-background px-4 py-4 will-change-transform">
      <div className="min-w-0 flex-1">{children}</div>
      <button ref={swipe.trigger} type="button" aria-label={`${swipe.open ? 'Hide' : 'Show'} actions for ${label}`} aria-expanded={swipe.open} aria-controls={id} disabled={disabled || result?.status === 'pending'}
        onClick={() => swipe.settle(!swipe.open)} className={`flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-40 ${INTERACTION_FOCUS}`}>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4"><path d="M4 10h.01M10 10h.01M16 10h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
      </button>
    </div>
    <span role="status" className="sr-only">{result ? `${actions.find((action) => action.id === result.id)?.label}: ${result.status === 'error' ? 'Failed. Try again.' : result.status}` : ''}</span>
  </div>;
}
