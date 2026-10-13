// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Drop zone (drop-zone)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';

/*
 * The drop zone's membrane. Its border is a ring of points round a rounded rectangle, each free
 * to move along its outward normal. Every point is held to its goal by a spring and to its
 * neighbours by tension, so a pull in one place makes a smooth tent and a release sends a ripple
 * both ways round the edge. One frame loop integrates it and writes the path; it sleeps when the
 * line is still, and a line at rest is drawn as an exact rounded rectangle.
 *
 *   reach    a file outside pulls the nearest stretch of border out to meet it; close to the
 *            edge the bulge reaches past the file, so it is held before it crosses
 *   cross    once the file is inside the stretched line lets go and wobbles back
 *   press    inside, near an edge, the file presses the border out
 *   recoil   a file the zone can't take makes the line shrink away from it
 *   carry    a file leaving through the border drags it along until it slips off
 *   gulp     a drop pulls the whole border in and rings out from the drop point
 *   spit     a refused drop is pushed back out where it landed
 */

export type MembraneForce = { x: number; y: number; kind: 'reach' | 'recoil' | 'carry'; spread?: number };

type Ring = {
  count: number; w: number; h: number; r: number;
  bx: Float32Array; by: Float32Array; nx: Float32Array; ny: Float32Array;
  u: Float32Array; v: Float32Array; goal: Float32Array; acc: Float32Array;
};

const STEP = 1 / 240;
const SPRING = 220; // toward the goal
const TENSION = 15000; // toward the neighbours: a pull makes a tent, a release travels as a ripple
const DRAG = 6.5;
const VISCOSITY = 58; // damping between neighbours, so short wobbles die before long ones
const SPACING = 5; // px of border per point
const REACH = 200; // how far out a file starts to pull
const PULL = 44; // goal at the line itself; tension spreads it, so the line reaches about half of it
const SLIP = 32; // how far a carried file drags the line before it slips off

const round = (n: number) => Math.round(n * 100) / 100;

/** The exact rest shape, on half pixels so the 1px line is crisp. */
function restPath(w: number, h: number, radius: number) {
  const x0 = 0.5, y0 = 0.5, x1 = w - 0.5, y1 = h - 0.5;
  const r = Math.max(0, Math.min(radius - 0.5, (x1 - x0) / 2, (y1 - y0) / 2));
  return `M${x0 + r},${y0}H${x1 - r}A${r},${r} 0 0 1 ${x1},${y0 + r}V${y1 - r}A${r},${r} 0 0 1 ${x1 - r},${y1}H${x0 + r}A${r},${r} 0 0 1 ${x0},${y1 - r}V${y0 + r}A${r},${r} 0 0 1 ${x0 + r},${y0}Z`;
}

/** Points spaced evenly along the rounded rectangle, with their outward normals. */
function buildRing(w: number, h: number, radius: number): Ring {
  const x0 = 0.5, y0 = 0.5, x1 = w - 0.5, y1 = h - 0.5;
  const r = Math.max(0, Math.min(radius - 0.5, (x1 - x0) / 2, (y1 - y0) / 2));
  const sw = x1 - x0 - 2 * r, sh = y1 - y0 - 2 * r, arc = (Math.PI * r) / 2;
  const length = 2 * sw + 2 * sh + 4 * arc;
  const count = Math.max(48, Math.min(360, Math.round(length / SPACING)));
  const ring: Ring = {
    count, w, h, r,
    bx: new Float32Array(count), by: new Float32Array(count), nx: new Float32Array(count), ny: new Float32Array(count),
    u: new Float32Array(count), v: new Float32Array(count), goal: new Float32Array(count), acc: new Float32Array(count),
  };
  // Edges and corners clockwise from the top-left end of the top edge.
  const parts: { len: number; at: (t: number) => [number, number, number, number] }[] = [
    { len: sw, at: (t) => [x0 + r + t * sw, y0, 0, -1] },
    { len: arc, at: (t) => corner(x1 - r, y0 + r, -Math.PI / 2 + (t * Math.PI) / 2) },
    { len: sh, at: (t) => [x1, y0 + r + t * sh, 1, 0] },
    { len: arc, at: (t) => corner(x1 - r, y1 - r, (t * Math.PI) / 2) },
    { len: sw, at: (t) => [x1 - r - t * sw, y1, 0, 1] },
    { len: arc, at: (t) => corner(x0 + r, y1 - r, Math.PI / 2 + (t * Math.PI) / 2) },
    { len: sh, at: (t) => [x0, y1 - r - t * sh, -1, 0] },
    { len: arc, at: (t) => corner(x0 + r, y0 + r, Math.PI + (t * Math.PI) / 2) },
  ];
  function corner(cx: number, cy: number, a: number): [number, number, number, number] {
    const c = Math.cos(a), s = Math.sin(a);
    return [cx + c * r, cy + s * r, c, s];
  }
  for (let i = 0; i < count; i++) {
    let s = (i / count) * length;
    let k = 0;
    while (k < parts.length - 1 && s > parts[k].len) s -= parts[k++].len;
    const [x, y, nx, ny] = parts[k].at(parts[k].len ? Math.min(1, s / parts[k].len) : 0);
    ring.bx[i] = x; ring.by[i] = y; ring.nx[i] = nx; ring.ny[i] = ny;
  }
  return ring;
}

export function useMembrane({ radius, reduced }: { radius: number; reduced: boolean }) {
  const box = React.useRef<HTMLElement | null>(null);
  const path = React.useRef<SVGPathElement>(null);
  const arrow = React.useRef<HTMLSpanElement>(null);
  const ring = React.useRef<Ring | null>(null);
  const forces = React.useRef(new Map<string, MembraneForce & { inside: boolean }>());
  const swell = React.useRef(0);
  const frame = React.useRef(0);
  const last = React.useRef(0);
  const turn = React.useRef({ angle: 0, lean: 0, x: 0, y: 0 });
  const still = React.useRef(reduced);
  still.current = reduced;

  const draw = React.useCallback((rest: boolean) => {
    const g = ring.current, el = path.current;
    if (!g || !el) return;
    if (rest) return el.setAttribute('d', restPath(g.w, g.h, radius));
    const { count: n, bx, by, nx, ny, u } = g;
    // Quadratic curves through the midpoints: smooth, and straight where the line is straight.
    const px = (i: number) => bx[i] + nx[i] * u[i];
    const py = (i: number) => by[i] + ny[i] * u[i];
    let d = `M${round((px(n - 1) + px(0)) / 2)},${round((py(n - 1) + py(0)) / 2)}`;
    for (let i = 0; i < n; i++) {
      const j = i === n - 1 ? 0 : i + 1;
      d += `Q${round(px(i))},${round(py(i))} ${round((px(i) + px(j)) / 2)},${round((py(i) + py(j)) / 2)}`;
    }
    el.setAttribute('d', `${d}Z`);
  }, [radius]);

  const tick = React.useCallback((now: number) => {
    frame.current = 0;
    const g = ring.current;
    if (!g) return;
    const dt = last.current ? Math.min(0.05, (now - last.current) / 1000) : 1 / 60;
    last.current = now;
    const { count: n, w, h, bx, by, nx, ny, u, v, goal, acc } = g;

    // Goals: each force bends the stretch of line nearest it; where two overlap the stronger wins.
    goal.fill(0);
    let pointer: (MembraneForce & { inside: boolean }) | null = null;
    for (const f of forces.current.values()) {
      if (f.kind !== 'carry') pointer = f;
      const sigma = f.spread ?? 38, two = 2 * sigma * sigma, far = 9 * sigma * sigma;
      const inside = f.x > 0 && f.x < w && f.y > 0 && f.y < h;
      for (let i = 0; i < n; i++) {
        const dx = f.x - bx[i], dy = f.y - by[i];
        const s = dx * nx[i] + dy * ny[i];
        const lateral = dx * dx + dy * dy - s * s;
        if (lateral > far || (!inside && s < -6)) continue;
        const fall = Math.exp(-lateral / two);
        let want: number;
        if (f.kind === 'reach') want = inside ? 10 * Math.exp(s / 28) : s < REACH ? PULL * (1 - Math.max(0, s) / REACH) ** 2 : 0;
        else if (f.kind === 'recoil') want = inside ? -7 * Math.exp(s / 28) : s < REACH ? -12 * (1 - Math.max(0, s) / REACH) ** 2 : 0;
        else want = inside ? 18 * Math.exp(s / 22) : s < SLIP ? (s + 6) * 1.6 : 0;
        want *= fall;
        if (Math.abs(want) > Math.abs(goal[i])) goal[i] = want;
      }
      // Crossing into the zone releases the stretched line: kick it back so it snaps rather than eases.
      if (f.kind === 'reach' && inside && !f.inside) {
        for (let i = 0; i < n; i++) {
          const dx = f.x - bx[i], dy = f.y - by[i];
          v[i] -= 150 * Math.exp(-(dx * dx + dy * dy) / (2 * 60 * 60));
        }
      }
      f.inside = inside;
    }
    if (swell.current) for (let i = 0; i < n; i++) goal[i] += swell.current;

    // Integrate in fixed small steps; the tension is stiff.
    for (let t = 0; t < dt - 1e-6; t += STEP) {
      const h2 = Math.min(STEP, dt - t);
      for (let i = 0; i < n; i++) {
        const l = i === 0 ? n - 1 : i - 1, r = i === n - 1 ? 0 : i + 1;
        acc[i] = SPRING * (goal[i] - u[i]) + TENSION * (u[l] + u[r] - 2 * u[i]) - DRAG * v[i] + VISCOSITY * (v[l] + v[r] - 2 * v[i]);
      }
      for (let i = 0; i < n; i++) {
        v[i] += acc[i] * h2;
        u[i] += v[i] * h2;
      }
    }

    let moving = false, flat = true;
    for (let i = 0; i < n; i++) {
      if (Math.abs(u[i] - goal[i]) > 0.03 || Math.abs(v[i]) > 0.4) moving = true;
      if (Math.abs(goal[i]) > 0.001 || Math.abs(u[i]) > 0.03) flat = false;
    }
    if (!moving && flat) {
      u.fill(0); v.fill(0);
    }
    draw(!moving && flat);

    // The arrow watches a file outside, points into the zone once it is over it, and rests pointing up.
    const a = arrow.current, tr = turn.current;
    let angle = 0, lean = 0;
    if (pointer) {
      const cx = w / 2, cy = h / 2, dx = pointer.x - cx, dy = pointer.y - cy;
      angle = pointer.inside ? (pointer.kind === 'reach' ? 180 : 0) : (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      lean = pointer.inside ? 0 : Math.min(4, Math.hypot(dx, dy) / 40);
      tr.x = dx; tr.y = dy;
    }
    const k = 1 - Math.exp(-dt / 0.08);
    let delta = ((angle - tr.angle + 540) % 360) - 180;
    if (Math.abs(delta) < 0.05) delta = 0;
    tr.angle += delta * k;
    tr.lean += (lean - tr.lean) * k;
    if (Math.abs(delta) > 0.05 || Math.abs(lean - tr.lean) > 0.02) moving = true;
    if (a) {
      const m = Math.hypot(tr.x, tr.y) || 1;
      a.style.transform = `translate3d(${round((tr.x / m) * tr.lean)}px,${round((tr.y / m) * tr.lean)}px,0) rotate(${round(tr.angle)}deg)`;
    }

    if (moving) frame.current = requestAnimationFrame(tick);
    else last.current = 0;
  }, [draw]);

  const kick = React.useCallback(() => {
    if (still.current) return;
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  }, [tick]);

  // Build the ring from the box's size and rebuild it when the box resizes.
  const attach = React.useCallback((el: HTMLElement | null) => {
    box.current = el;
  }, []);
  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth, h = el.offsetHeight;
      if (!w || !h || (ring.current && ring.current.w === w && ring.current.h === h)) return;
      ring.current = buildRing(w, h, radius);
      draw(true);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [radius, draw]);

  React.useEffect(() => {
    if (!reduced) return;
    // Reduced motion: no bending. Settle everything where it is.
    forces.current.clear();
    swell.current = 0;
    if (ring.current) { ring.current.u.fill(0); ring.current.v.fill(0); }
    draw(true);
    if (arrow.current) arrow.current.style.transform = '';
  }, [reduced, draw]);

  const impulse = React.useCallback((x: number, y: number, base: number, peak: number, sigma: number) => {
    const g = ring.current;
    if (!g || still.current) return;
    for (let i = 0; i < g.count; i++) {
      const dx = x - g.bx[i], dy = y - g.by[i];
      g.v[i] += base + peak * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
    }
    kick();
  }, [kick]);

  return React.useMemo(() => ({
    attach, path, arrow,
    /** Set, move or (with null) remove one force, in the box's own coordinates. */
    set(key: string, force: MembraneForce | null) {
      if (still.current) return;
      const prev = forces.current.get(key);
      if (force) forces.current.set(key, { ...force, inside: prev?.inside ?? (force.x > 0 && force.y > 0 && force.x < (ring.current?.w ?? 0) && force.y < (ring.current?.h ?? 0)) });
      else if (prev) forces.current.delete(key);
      else return;
      kick();
    },
    /** Push the whole line out (positive) or in by a few pixels. */
    swell(px: number) {
      if (swell.current === px) return;
      swell.current = px;
      kick();
    },
    gulp(x: number, y: number) { impulse(x, y, -70, -230, 90); },
    spit(x: number, y: number) { impulse(x, y, 0, 320, 64); },
  }), [attach, kick, impulse]);
}
