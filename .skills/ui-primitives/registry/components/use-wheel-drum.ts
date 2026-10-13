// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Wheel picker (wheel-picker)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';

/*
 * One wheel's motion engine. The options sit on a ring of SLOTS faces round a cylinder; turning
 * the wheel is one rotateX on the drum (and the same on its copy in the lens), so a fling costs two
 * transforms a frame. Only faces turning round the back are relabelled, so a wheel of 60 minutes or
 * 200 years still has 18 faces. Nothing renders through React while it turns: the value is committed
 * once the wheel comes to rest.
 *
 *   drag     follows the finger one row per row height; past the ends of a wheel that doesn't
 *            loop it stretches with resistance
 *   fling    release velocity is projected forward and rounded to a row, then the wheel decays
 *            onto it exponentially, so it lands without a separate snap
 *   wheel    a mouse notch moves one row; trackpad scrolling turns it freely and settles when quiet
 *   tap      a row above or below the lens turns to the middle
 */

export const SLOTS = 18;
export const STEP = 360 / SLOTS;

export type DrumOptions = {
  count: number;
  loop: boolean;
  itemHeight: number;
  reduced: boolean;
  haptics: boolean;
  label: (index: number) => string;
  disabled: (index: number) => boolean;
  /** The wheel came to rest on this option. */
  onRest: (index: number) => void;
};

const mod = (n: number, m: number) => ((n % m) + m) % m;
const rubber = (x: number) => (1 - 1 / (x * 0.6 + 1)) / 0.6;

export function useWheelDrum(initial: number, options: DrumOptions) {
  const opts = React.useRef(options);
  opts.current = options;
  const column = React.useRef<HTMLDivElement>(null);
  const drum = React.useRef<HTMLDivElement>(null);
  const lens = React.useRef<HTMLDivElement>(null);
  const faces = React.useRef<(HTMLElement | null)[]>([]);
  const lensFaces = React.useRef<(HTMLElement | null)[]>([]);
  const shown = React.useRef<number[]>([]);
  const sim = React.useRef({ p: initial, from: initial, target: initial, tau: 0.3, t0: 0, settling: false, rested: initial, tick: Math.round(initial), buzz: 0, touch: false });
  const frame = React.useRef(0);

  const radius = options.itemHeight / (2 * Math.tan((STEP / 2) * (Math.PI / 180)));

  /** Write the drum's rotation and relabel the faces that crossed the back. */
  const paint = React.useCallback((force = false) => {
    const { count, loop, label, disabled, haptics } = opts.current;
    const s = sim.current;
    const r = opts.current.itemHeight / (2 * Math.tan((STEP / 2) * (Math.PI / 180)));
    const transform = `translateZ(${-r}px) rotateX(${s.p * STEP}deg)`;
    if (drum.current) drum.current.style.transform = transform;
    if (lens.current) lens.current.style.transform = transform;
    for (let k = 0; k < SLOTS; k++) {
      const i = k + SLOTS * Math.round((s.p - k) / SLOTS);
      if (!force && shown.current[k] === i) continue;
      shown.current[k] = i;
      const real = loop ? mod(i, count) : i;
      const empty = !loop && (i < 0 || i >= count);
      const text = empty || !count ? '' : label(real);
      const off = !empty && count > 0 && disabled(real);
      for (const el of [faces.current[k], lensFaces.current[k]]) {
        if (!el) continue;
        if (el.textContent !== text) el.textContent = text;
        el.toggleAttribute('data-off', off);
      }
    }
    // A tick under the finger for every row that passes the lens (phones that support it).
    const row = Math.round(s.p);
    if (row !== s.tick) {
      s.tick = row;
      const now = performance.now();
      if (haptics && s.touch && now - s.buzz > 45 && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        s.buzz = now;
        try { navigator.vibrate(3); } catch { /* not allowed yet */ }
      }
    }
  }, []);

  const rest = React.useCallback(() => {
    const { count, loop, disabled, onRest } = opts.current;
    const s = sim.current;
    s.settling = false;
    if (!count) return;
    let index = loop ? mod(Math.round(s.p), count) : Math.max(0, Math.min(count - 1, Math.round(s.p)));
    // Landed on an option that can't be chosen: turn on to the nearest one that can.
    if (disabled(index)) {
      for (let d = 1; d < count; d++) {
        const down = index - d, up = index + d;
        const ok = (i: number) => (loop || (i >= 0 && i < count)) && !disabled(mod(i, count));
        const next = ok(down) ? down : ok(up) ? up : null;
        if (next !== null) {
          settleTo(Math.round(s.p) + (next - index), 0.16);
          return;
        }
      }
      return;
    }
    s.rested = index;
    onRest(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = React.useCallback((now: number) => {
    frame.current = 0;
    const s = sim.current;
    if (!s.settling) return;
    const t = (now - s.t0) / 1000;
    const k = Math.exp(-t / s.tau);
    s.p = s.target + (s.from - s.target) * k;
    if (Math.abs(s.p - s.target) < 0.002) {
      s.p = s.target;
      paint();
      rest();
      return;
    }
    paint();
    frame.current = requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paint]);

  function settleTo(target: number, tau: number) {
    const s = sim.current;
    s.from = s.p;
    s.target = target;
    s.tau = tau;
    s.t0 = performance.now();
    s.settling = true;
    if (opts.current.reduced) {
      s.p = target;
      paint();
      rest();
      return;
    }
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(step);
  }

  const clampTarget = (target: number) => {
    const { count, loop } = opts.current;
    return loop ? target : Math.max(0, Math.min(count - 1, target));
  };

  /** Turn to an option. Loops take the shorter way round. */
  const turnTo = React.useCallback((index: number, animate = true) => {
    const { count, loop } = opts.current;
    const s = sim.current;
    if (!count) return;
    let target = index;
    if (loop) {
      const base = Math.round(s.settling ? s.target : s.p);
      const delta = mod(index - mod(base, count) + count / 2, count) - count / 2;
      target = base + Math.round(delta);
    }
    s.rested = mod(index, count);
    if (!animate) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      s.settling = false;
      s.p = s.target = target;
      paint();
      return;
    }
    settleTo(target, 0.16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paint]);

  /** Move by whole rows from wherever the wheel is heading (keys, mouse notches). */
  const nudge = React.useCallback((rows: number) => {
    const s = sim.current;
    s.touch = false;
    const base = s.settling ? s.target : Math.round(s.p);
    settleTo(clampTarget(base + rows), 0.11);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pointer, wheel and the initial paint.
  React.useEffect(() => {
    const el = column.current;
    if (!el) return;
    paint(true);
    let drag: { id: number; y: number; p: number; moved: boolean; samples: { y: number; t: number }[] } | null = null;
    let quiet: ReturnType<typeof setTimeout> | null = null;
    const s = sim.current;
    const H = () => opts.current.itemHeight;

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || drag) return;
      el.setPointerCapture(e.pointerId);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      s.settling = false;
      s.touch = e.pointerType === 'touch';
      drag = { id: e.pointerId, y: e.clientY, p: s.p, moved: false, samples: [{ y: e.clientY, t: e.timeStamp }] };
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dy) < 3) return;
      drag.moved = true;
      drag.samples.push({ y: e.clientY, t: e.timeStamp });
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 90) drag.samples.shift();
      const { count, loop } = opts.current;
      let p = drag.p - dy / H();
      if (!loop) {
        if (p < 0) p = -rubber(-p);
        else if (p > count - 1) p = count - 1 + rubber(p - (count - 1));
      }
      s.p = p;
      paint();
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!d.moved) {
        // A tap above or below the lens turns that row to the middle.
        const r = el.getBoundingClientRect();
        const r0 = opts.current.itemHeight / (2 * Math.tan((STEP / 2) * (Math.PI / 180)));
        const off = (Math.asin(Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r0))) * 180) / Math.PI / STEP;
        const rows = Math.round(off);
        if (rows) settleTo(clampTarget(Math.round(s.p) + rows), 0.16);
        else settleTo(clampTarget(Math.round(s.p)), 0.12);
        return;
      }
      const first = d.samples[0], last = d.samples[d.samples.length - 1];
      const fresh = e.timeStamp - last.t < 80 && last.t > first.t;
      const velocity = fresh ? -((last.y - first.y) / (last.t - first.t)) * (1000 / H()) : 0; // rows per second
      const { count, loop } = opts.current;
      const outside = !loop && (s.p < 0 || s.p > count - 1);
      const projected = outside ? s.p : s.p + velocity * 0.3;
      const target = clampTarget(Math.round(projected));
      settleTo(target, outside ? 0.14 : Math.abs(target - s.p) < 0.75 ? 0.12 : 0.3);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      s.touch = false;
      const px = e.deltaMode === 1 ? e.deltaY * H() : e.deltaMode === 2 ? e.deltaY * H() * 5 : e.deltaY;
      // A mouse wheel notch is one row; a trackpad turns the wheel freely and settles once it goes quiet.
      if (Math.abs(px) >= 50 && Number.isInteger(e.deltaY)) {
        nudge(Math.sign(px));
        return;
      }
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      s.settling = false;
      const { count, loop } = opts.current;
      let p = s.p + px / H();
      if (!loop) p = Math.max(-0.35, Math.min(count - 1 + 0.35, p));
      s.p = p;
      paint();
      if (quiet) clearTimeout(quiet);
      quiet = setTimeout(() => settleTo(clampTarget(Math.round(s.p)), 0.14), 120);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      if (quiet) clearTimeout(quiet);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Options changed (a month with fewer days): relabel every face.
  const signature = `${options.count}|${options.loop}`;
  React.useEffect(() => {
    paint(true);
  }, [signature, paint]);

  return { column, drum, lens, faces, lensFaces, radius, turnTo, nudge, repaint: () => paint(true), resting: () => sim.current.rested, moving: () => sim.current.settling };
}
