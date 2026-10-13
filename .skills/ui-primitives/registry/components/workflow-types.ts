// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Workflow canvas (workflow-canvas)
// Pure React and Web Animations API · Zero External Styling Dependencies

import type * as React from 'react';

export type WorkflowStatus = 'idle' | 'queued' | 'running' | 'complete' | 'error';
export type WorkflowPoint = { x: number; y: number };
export interface WorkflowNode extends WorkflowPoint {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: WorkflowStatus;
  detail?: React.ReactNode;
}
export interface WorkflowEdge { id: string; from: string; to: string }
export const NODE_WIDTH = 164;
export const NODE_HEIGHT = 78;

/** Rounded elbows for forward connections; a smooth loop for nodes dragged behind their source. */
export function workflowPath(from: WorkflowPoint, to: WorkflowPoint) {
  const x1 = from.x + NODE_WIDTH, y1 = from.y + NODE_HEIGHT / 2;
  const x2 = to.x, y2 = to.y + NODE_HEIGHT / 2;
  if (x2 - x1 < 40) {
    const reach = Math.max(60, Math.abs(x2 - x1) * 0.6);
    return `M ${x1} ${y1} C ${x1 + reach} ${y1}, ${x2 - reach} ${y2}, ${x2} ${y2}`;
  }
  if (Math.abs(y2 - y1) < 2) return `M ${x1} ${y1} H ${x2}`;
  const mid = (x1 + x2) / 2, sign = Math.sign(y2 - y1), radius = Math.min(14, Math.abs(y2 - y1) / 2);
  return `M ${x1} ${y1} H ${mid - radius} Q ${mid} ${y1} ${mid} ${y1 + sign * radius} V ${y2 - sign * radius} Q ${mid} ${y2} ${mid + radius} ${y2} H ${x2}`;
}
