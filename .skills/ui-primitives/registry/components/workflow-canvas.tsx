// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Workflow canvas (workflow-canvas)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { Circle, Maximize2, Minus, Plus } from 'lucide-react';
import { WorkflowConnections } from './workflow-connections';
import { useWorkflowViewport } from './use-workflow-viewport';
import { INTERACTION_FOCUS, useInteractionReducedMotion, useInteractionActivity } from './ui-interaction-motion';
import { WorkflowStatusMark, WORKFLOW_STATUS as STATUS } from './workflow-status';
import { WorkflowInspector } from './workflow-inspector';
import { NumberRoll } from './number-roll';
import { TextMorph } from './text-morph';
import { NODE_WIDTH, NODE_HEIGHT, type WorkflowNode, type WorkflowEdge, type WorkflowPoint, type WorkflowStatus } from './workflow-types';
export type { WorkflowNode, WorkflowEdge, WorkflowPoint, WorkflowStatus } from './workflow-types';

export interface WorkflowCanvasProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  width?: number;
  height?: number;
  label?: string;
  onNodeMove?: (id: string, position: WorkflowPoint) => void;
  onNodeSelect?: (id: string | null) => void;
}
const CONTROL = `cursor-pointer disabled:cursor-default flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 ${INTERACTION_FOCUS}`;

/** A bounded workflow viewer with movable nodes, a shared pan/zoom transform and live execution states. */
export function WorkflowCanvas({ nodes, edges, width = 660, height = 340, label = 'Workflow', onNodeMove, onNodeSelect, className = '', ...props }: WorkflowCanvasProps) {
  const reduced = useInteractionReducedMotion();
  const activity = useInteractionActivity<HTMLDivElement>();
  const [selected, setSelected] = React.useState<string | null>(null);
  const nodeRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const canvasWidth = Math.max(NODE_WIDTH, width), canvasHeight = Math.max(NODE_HEIGHT, height);
  const { viewport, world, positions, view, dragging, fit, zoom, revealNode, moveNode, handlers } = useWorkflowViewport(nodes, edges, canvasWidth, canvasHeight, reduced, onNodeMove);
  const selectedNode = nodes.find((node) => node.id === selected);
  const detailsId = React.useId();
  const choose = (id: string | null) => { setSelected(id); onNodeSelect?.(id); };

  return (
    <div ref={activity.ref} role="region" aria-label={label} className={`w-full overflow-clip rounded-[20px] border border-border bg-background text-foreground ${className}`} {...props}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="text-[12px] font-medium">{label}</span>
        <span className="font-mono text-[10px] text-muted-foreground"><NumberRoll value={nodes.length} /> nodes · <NumberRoll value={edges.length} /> connections</span>
      </div>
      <div ref={viewport} {...handlers} data-lenis-prevent className={`relative h-[300px] overflow-clip bg-muted/35 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ touchAction: 'none', backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        <div ref={world} className="absolute left-0 top-0 origin-top-left" style={{ width: canvasWidth, height: canvasHeight, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
          <WorkflowConnections nodes={nodes} edges={edges} positions={positions} reduced={reduced} width={canvasWidth} height={canvasHeight} />
          {nodes.map((node, index) => {
            const status = node.status ?? 'idle';
            return <button key={node.id} type="button" ref={(el) => { if (el) nodeRefs.current.set(node.id, el); else nodeRefs.current.delete(node.id); }}
              data-workflow-node={node.id} aria-label={`${node.title}, ${STATUS[status]}`} aria-expanded={selected === node.id} aria-controls={selected === node.id ? detailsId : undefined}
              onClick={() => choose(selected === node.id ? null : node.id)}
              onFocus={() => revealNode(node.id)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') { event.preventDefault(); choose(null); }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  if (event.altKey) { moveNode(node.id, event.key === 'ArrowRight' ? 12 : event.key === 'ArrowLeft' ? -12 : 0, event.key === 'ArrowDown' ? 12 : event.key === 'ArrowUp' ? -12 : 0); return; }
                  const offset = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
                  nodeRefs.current.get(nodes[(index + offset + nodes.length) % nodes.length].id)?.focus({ preventScroll: true });
                }
              }}
              className={`cursor-pointer absolute left-0 top-0 flex flex-col justify-between rounded-xl border bg-card px-3 py-2.5 text-left text-card-foreground transition-[border-color] duration-300 ${INTERACTION_FOCUS} ${status === 'error' ? 'border-destructive/50' : selected === node.id || status === 'running' ? 'border-primary/70' : 'border-border'}`}
              style={{ width: NODE_WIDTH, height: NODE_HEIGHT, transform: `translate(${positions[node.id].x}px, ${positions[node.id].y}px)` }}>
              <span className="flex w-full items-center gap-2"><span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">{node.icon ?? <Circle className="size-3" aria-hidden="true" />}</span><span className="truncate text-[12px] font-medium"><TextMorph>{node.title}</TextMorph></span></span>
              <span className="flex w-full items-center justify-between gap-2"><span className="truncate text-[11px] text-muted-foreground"><TextMorph>{node.subtitle ?? STATUS[status]}</TextMorph></span><WorkflowStatusMark status={status} reduced={reduced} active={activity.active} /></span>
            </button>;
          })}
        </div>
        <div data-workflow-control className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-xl border border-border bg-background p-1">
          <button type="button" aria-label="Zoom out" disabled={view.scale <= 0.25} onClick={() => zoom(1 / 1.2)} className={CONTROL}><Minus className="size-3.5" aria-hidden="true" /></button>
          <output aria-label="Zoom level" className="w-11 text-center font-mono text-[10px] tabular-nums text-muted-foreground"><NumberRoll value={Math.round(view.scale * 100)} />%</output>
          <button type="button" aria-label="Zoom in" disabled={view.scale >= 1.75} onClick={() => zoom(1.2)} className={CONTROL}><Plus className="size-3.5" aria-hidden="true" /></button>
          <span className="mx-1 h-3 w-px bg-border" />
          <button type="button" aria-label="Fit workflow" onClick={fit} className={CONTROL}><Maximize2 className="size-3.5" aria-hidden="true" /></button>
        </div>
      </div>
      <WorkflowInspector id={detailsId} node={selectedNode} reduced={reduced} onClose={() => { choose(null); if (selectedNode) nodeRefs.current.get(selectedNode.id)?.focus({ preventScroll: true }); }} />
      <p role="status" aria-live="polite" className="sr-only">{nodes.filter((node) => node.status === 'running').map((node) => `${node.title} running`).join('. ') || (nodes.some((node) => node.status === 'error') ? 'Workflow has a failed step.' : nodes.length > 0 && nodes.every((node) => node.status === 'complete') ? 'Workflow complete.' : 'Workflow ready.')}</p>
    </div>
  );
}
