// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Workflow canvas (workflow-canvas)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import React from 'react';
import { Circle, CircleAlert } from 'lucide-react';
import { interactionIcon } from './ui-interaction-motion';
import type { WorkflowStatus } from './workflow-types';

export const WORKFLOW_STATUS: Record<WorkflowStatus, string> = { idle: 'Ready', queued: 'Queued', running: 'Running', complete: 'Complete', error: 'Failed' };

export function WorkflowStatusMark({ status, reduced, active }: { status: WorkflowStatus; reduced: boolean; active: boolean }) {
  return <span aria-hidden="true" className="relative size-3.5 shrink-0">
    <span className="absolute inset-0 flex items-center justify-center" style={interactionIcon(status === 'idle' || status === 'queued', reduced)}><Circle className={`size-3 text-muted-foreground ${status === 'queued' ? 'fill-muted-foreground/20' : ''}`} /></span>
    <span className="absolute inset-0" style={interactionIcon(status === 'running', reduced)}><span className={`block size-3.5 rounded-full border-[1.5px] border-primary/25 border-t-primary ${status === 'running' && !reduced ? 'animate-spin' : ''}`} style={{ animationPlayState: active ? 'running' : 'paused' }} /></span>
    <svg viewBox="0 0 16 16" className="absolute inset-0 size-3.5 text-primary" style={interactionIcon(status === 'complete', reduced)}><path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: status === 'complete' ? 0 : 1, transition: reduced ? 'none' : 'stroke-dashoffset 380ms ease-out 80ms' }} /></svg>
    <CircleAlert className="absolute inset-0 size-3.5 text-destructive" style={interactionIcon(status === 'error', reduced)} />
  </span>;
}
