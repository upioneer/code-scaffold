// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Split pane (split-pane)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';

export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const EASE_SETTLE = 'cubic-bezier(0.22, 1.18, 0.36, 1)';
export const INTERACTION_FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const query = '(prefers-reduced-motion: reduce)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
export const useInteractionReducedMotion = () => React.useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);

export function useInteractionActivity<T extends Element>() {
  const ref = React.useRef<T>(null);
  const [visible, setVisible] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    const visibility = () => setHidden(document.hidden);
    visibility(); document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return { ref, active: visible && !hidden };
}

export function interactionIcon(on: boolean, reduced: boolean): React.CSSProperties {
  return { opacity: on ? 1 : 0, transform: on ? 'none' : 'scale(0.6)', filter: on ? 'blur(0px)' : 'blur(3px)', transition: reduced ? 'none' : `opacity 220ms ${EASE_OUT}, transform 380ms ${EASE_OUT}, filter 220ms ${EASE_OUT}` };
}

/** Sample recent movement rather than averaging a long drag and losing its release velocity. */
export type PointerSample = { x: number; time: number };
export function samplePointer(samples: PointerSample[], x: number, time: number) {
  samples.push({ x, time });
  while (samples.length > 2 && time - samples[0].time > 100) samples.shift();
}
export function releaseVelocity(samples: PointerSample[], now: number) {
  if (samples.length < 2 || now - samples[samples.length - 1].time > 100) return 0;
  const first = samples[0], last = samples[samples.length - 1];
  return (last.x - first.x) / Math.max(1, last.time - first.time);
}

/** A damped spring sampled by WAAPI: no React renders or perpetual frame loop. */
export function springFrames(from: number, to: number, velocity = 0, duration = 520) {
  const omega = 20, damping = 0.82, damped = omega * Math.sqrt(1 - damping * damping);
  const displacement = from - to;
  const coefficient = (velocity * 1000 + damping * omega * displacement) / damped;
  return Array.from({ length: 33 }, (_, i) => {
    const t = (i / 32) * duration / 1000;
    const value = to + Math.exp(-damping * omega * t) * (displacement * Math.cos(damped * t) + coefficient * Math.sin(damped * t));
    return { value: i === 32 ? to : value, offset: i / 32 };
  });
}
