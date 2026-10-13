// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Workflow canvas (workflow-canvas)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { NODE_WIDTH, NODE_HEIGHT, workflowPath, type WorkflowNode, type WorkflowEdge, type WorkflowPoint } from './workflow-types';

type View = { x: number; y: number; scale: number };
type Gesture = { pointer: number; startX: number; startY: number; origin: WorkflowPoint; node?: string; moved: boolean };

export function useWorkflowViewport(nodes: WorkflowNode[], edges: WorkflowEdge[], width: number, height: number, reduced: boolean, onNodeMove?: (id: string, point: WorkflowPoint) => void) {
  const viewport = React.useRef<HTMLDivElement>(null);
  const world = React.useRef<HTMLDivElement>(null);
  const overrides = React.useRef<Record<string, WorkflowPoint>>({});
  const positions: Record<string, WorkflowPoint> = Object.fromEntries(nodes.map((node) => [node.id, overrides.current[node.id] ?? { x: node.x, y: node.y }]));
  const currentPositions = React.useRef(positions);
  currentPositions.current = positions;
  const viewRef = React.useRef<View>({ x: 0, y: 0, scale: 1 });
  const gesture = React.useRef<Gesture | null>(null);
  const suppressClick = React.useRef(false);
  const [view, setView] = React.useState(viewRef.current);
  const [, commit] = React.useReducer((n: number) => n + 1, 0);
  const [dragging, setDragging] = React.useState(false);

  const paintView = (next: View, animate = false) => {
    viewRef.current = next;
    if (world.current) {
      world.current.style.transition = animate && !reduced ? 'transform 320ms cubic-bezier(0.16,1,0.3,1)' : 'none';
      world.current.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.scale})`;
    }
  };
  const fit = (minimum = 0.2) => {
    const frame = viewport.current;
    if (!frame) return;
    const scale = Math.max(minimum, Math.min(1.25, (frame.clientWidth - 36) / width, (frame.clientHeight - 36) / height));
    const next = { x: width * scale > frame.clientWidth - 36 ? 18 : (frame.clientWidth - width * scale) / 2, y: (frame.clientHeight - height * scale) / 2, scale };
    paintView(next, true); setView(next);
  };
  React.useLayoutEffect(() => {
    const frame = viewport.current;
    if (!frame) return;
    const observer = new ResizeObserver(() => fit(0.85));
    observer.observe(frame);
    return () => observer.disconnect();
    // Refit when the canvas bounds change. Status updates preserve the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, reduced]);

  const zoom = (factor: number) => {
    const frame = viewport.current;
    if (!frame) return;
    const previous = viewRef.current;
    const scale = Math.max(0.25, Math.min(1.75, previous.scale * factor));
    const cx = frame.clientWidth / 2, cy = frame.clientHeight / 2;
    const next = { scale, x: cx - (cx - previous.x) * scale / previous.scale, y: cy - (cy - previous.y) * scale / previous.scale };
    paintView(next, true); setView(next);
  };
  const revealNode = (id: string) => {
    const point = currentPositions.current[id], frame = viewport.current;
    if (!point || !frame) return;
    const previous = viewRef.current;
    const left = point.x * previous.scale + previous.x, top = point.y * previous.scale + previous.y;
    let x = previous.x, y = previous.y;
    if (left < 12) x += 12 - left;
    else if (left + NODE_WIDTH * previous.scale > frame.clientWidth - 12) x -= left + NODE_WIDTH * previous.scale - frame.clientWidth + 12;
    if (top < 12) y += 12 - top;
    else if (top + NODE_HEIGHT * previous.scale > frame.clientHeight - 12) y -= top + NODE_HEIGHT * previous.scale - frame.clientHeight + 12;
    if (x !== previous.x || y !== previous.y) { const next = { ...previous, x, y }; paintView(next, true); setView(next); }
  };
  const paintNode = (id: string, point: WorkflowPoint) => {
    currentPositions.current[id] = point;
    // Keep the draft position through status renders while the pointer is down.
    overrides.current[id] = point;
    const node = world.current?.querySelector<HTMLElement>(`[data-workflow-node="${CSS.escape(id)}"]`);
    if (node) node.style.transform = `translate(${point.x}px, ${point.y}px)`;
    edges.filter((edge) => edge.from === id || edge.to === id).forEach((edge) => {
      const from = currentPositions.current[edge.from], to = currentPositions.current[edge.to];
      if (from && to) world.current?.querySelectorAll<SVGPathElement>(`[data-workflow-edge="${CSS.escape(edge.id)}"]`).forEach((path) => path.setAttribute('d', workflowPath(from, to)));
    });
  };
  const moveNode = (id: string, dx: number, dy: number) => {
    const point = currentPositions.current[id];
    if (!point) return;
    const next = { x: Math.max(0, Math.min(width - NODE_WIDTH, point.x + dx)), y: Math.max(0, Math.min(height - NODE_HEIGHT, point.y + dy)) };
    paintNode(id, next); commit(); onNodeMove?.(id, next); revealNode(id);
  };
  /**
   * While a gesture runs, the moving part gets its own compositor layer so panning and dragging move pixels instead of
   * repainting them. The layer is dropped afterwards so text re-rasterises crisply at the new zoom.
   */
  const layer = (el: HTMLElement | null | undefined, on: boolean) => {
    if (el) el.style.willChange = on ? 'transform' : '';
  };
  const nodeEl = (id?: string) => (id ? world.current?.querySelector<HTMLElement>(`[data-workflow-node="${CSS.escape(id)}"]`) : null);
  const finish = (event: React.PointerEvent, cancelled: boolean) => {
    const state = gesture.current;
    if (!state || state.pointer !== event.pointerId) return;
    gesture.current = null;
    layer(state.node ? nodeEl(state.node) : world.current, false);
    setDragging(false);
    suppressClick.current = state.moved;
    if (state.node) {
      if (cancelled) paintNode(state.node, state.origin);
      else if (state.moved) {
        const point = currentPositions.current[state.node];
        overrides.current[state.node] = point;
        onNodeMove?.(state.node, point);
      }
      commit();
    } else {
      if (cancelled) paintView({ ...viewRef.current, ...state.origin });
      setView(viewRef.current);
    }
  };

  return {
    viewport, world, positions, view, dragging, fit: () => fit(), zoom, revealNode, moveNode,
    handlers: {
      onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
        if (event.button !== 0 || !event.isPrimary || (event.target as HTMLElement).closest('[data-workflow-control]')) return;
        const target = (event.target as HTMLElement).closest<HTMLElement>('[data-workflow-node]');
        const node = target?.dataset.workflowNode;
        suppressClick.current = false;
        (target ?? event.currentTarget).setPointerCapture(event.pointerId);
        if (target) target.focus({ preventScroll: true });
        gesture.current = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, node, origin: node ? { ...currentPositions.current[node] } : { x: viewRef.current.x, y: viewRef.current.y }, moved: false };
      },
      onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
        const state = gesture.current;
        if (!state || state.pointer !== event.pointerId) return;
        const dx = event.clientX - state.startX, dy = event.clientY - state.startY;
        if (!state.moved && Math.hypot(dx, dy) < 5) return;
        if (!state.moved) { state.moved = true; setDragging(true); layer(state.node ? nodeEl(state.node) : world.current, true); }
        if (state.node) paintNode(state.node, {
          x: Math.max(0, Math.min(width - NODE_WIDTH, state.origin.x + dx / viewRef.current.scale)),
          y: Math.max(0, Math.min(height - NODE_HEIGHT, state.origin.y + dy / viewRef.current.scale)),
        });
        else paintView({ ...viewRef.current, x: Math.max(-width * viewRef.current.scale + 60, Math.min((viewport.current?.clientWidth ?? width) - 60, state.origin.x + dx)), y: Math.max(-height * viewRef.current.scale + 60, Math.min((viewport.current?.clientHeight ?? height) - 60, state.origin.y + dy)) });
      },
      onPointerUp: (event: React.PointerEvent) => finish(event, false),
      onPointerCancel: (event: React.PointerEvent) => finish(event, true),
      onLostPointerCapture: (event: React.PointerEvent) => finish(event, true),
      onKeyDown(event: React.KeyboardEvent) {
        const state = gesture.current;
        if (event.key !== 'Escape' || !state) return;
        event.preventDefault(); gesture.current = null; setDragging(false); suppressClick.current = true;
        layer(state.node ? nodeEl(state.node) : world.current, false);
        if (state.node) { paintNode(state.node, state.origin); commit(); }
        else { paintView({ ...viewRef.current, ...state.origin }); setView(viewRef.current); }
      },
      onClickCapture(event: React.MouseEvent) { if (suppressClick.current) { event.stopPropagation(); suppressClick.current = false; } },
    },
  };
}
