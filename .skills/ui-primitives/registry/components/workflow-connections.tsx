// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Workflow canvas (workflow-canvas)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { workflowPath, type WorkflowEdge, type WorkflowNode, type WorkflowPoint } from './workflow-types';

function Connection({ edge, nodes, positions, reduced, playing }: { edge: WorkflowEdge; nodes: WorkflowNode[]; positions: Record<string, WorkflowPoint>; reduced: boolean; playing: boolean }) {
  const ref = React.useRef<SVGPathElement>(null);
  const from = nodes.find((node) => node.id === edge.from), to = nodes.find((node) => node.id === edge.to);
  const active = from?.status === 'complete' && to?.status === 'running';
  const completed = from?.status === 'complete' && to?.status === 'complete';
  const d = from && to ? workflowPath(positions[from.id] ?? from, positions[to.id] ?? to) : '';
  React.useEffect(() => {
    const path = ref.current;
    if (!path || !active || !playing || reduced) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `14 ${length}`;
    const animation = path.animate([{ strokeDashoffset: '0' }, { strokeDashoffset: String(-length - 14) }], { duration: Math.max(700, length / 0.2), iterations: Infinity, easing: 'linear' });
    return () => { animation.cancel(); path.style.strokeDasharray = ''; };
  }, [active, playing, reduced, d]);
  if (!from || !to) return null;
  return (
    <g>
      <path data-workflow-edge={edge.id} d={d} fill="none" stroke={active || completed ? 'var(--primary)' : 'var(--border)'} strokeOpacity={active || completed ? 0.35 : 1} strokeWidth="1.5" />
      {active && <path ref={ref} data-workflow-edge={edge.id} d={d} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity={reduced ? 0.6 : 1} />}
    </g>
  );
}

export function WorkflowConnections({ nodes, edges, positions, reduced, width, height }: { nodes: WorkflowNode[]; edges: WorkflowEdge[]; positions: Record<string, WorkflowPoint>; reduced: boolean; width: number; height: number }) {
  const ref = React.useRef<SVGSVGElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  React.useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(svg);
    const visibility = () => setHidden(document.hidden);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <svg ref={ref} aria-hidden="true" width={width} height={height} className="pointer-events-none absolute inset-0 overflow-visible">
    {edges.map((edge) => <Connection key={edge.id} edge={edge} nodes={nodes} positions={positions} reduced={reduced} playing={visible && !hidden} />)}
  </svg>;
}
