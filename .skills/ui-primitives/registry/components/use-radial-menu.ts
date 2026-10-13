// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Radial menu (radial-menu)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';

/** Focus follows the same clockwise order as the geometry. Resize measurements never run in a gesture. */
export function useRadialMenu(count: number, enabled: number[], open: boolean, onOpenChange: (open: boolean) => void) {
  const root = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const buttons = React.useRef(new Map<number, HTMLButtonElement>());
  const focusFrame = React.useRef(0);
  const [radius, setRadius] = React.useState(86);
  const latest = React.useRef({ enabled, onOpenChange }); latest.current = { enabled, onOpenChange };
  React.useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.max(40, Math.min(90, entry.contentRect.width / 2 - 48));
      setRadius((previous) => previous === next ? previous : next);
    });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  React.useEffect(() => {
    if (open) focusFrame.current = requestAnimationFrame(() => buttons.current.get(latest.current.enabled[0])?.focus({ preventScroll: true }));
    return () => { cancelAnimationFrame(focusFrame.current); focusFrame.current = 0; };
  }, [open]);
  const close = (focus = true) => { latest.current.onOpenChange(false); if (focus) trigger.current?.focus({ preventScroll: true }); };
  const navigate = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    const list = latest.current.enabled;
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const at = list.indexOf(index);
    const next = event.key === 'Home' ? list[0] : event.key === 'End' ? list.at(-1) : list[(at + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length];
    if (next !== undefined) buttons.current.get(next)?.focus({ preventScroll: true });
  };
  return { root, trigger, buttons, radius, close, navigate,
    point(index: number) { const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(1, count); return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle: angle * 180 / Math.PI }; },
  };
}
