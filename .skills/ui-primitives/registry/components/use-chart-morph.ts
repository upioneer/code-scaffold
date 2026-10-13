// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Morphing chart (morphing-chart)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';

/*
 * The morphing chart's engine. Bars, beads, the line and the area are four drawings of the same
 * points, so a change of shape is a choreography over shared geometry, never a cross-fade:
 *
 *   bars → line    each bar condenses up into a bead on its value; a thread is strung through the
 *                  beads from the left, and each bead melts into it as the thread passes
 *   line → bars    the thread is pulled out to the right; each bead swells back as the tail leaves
 *                  it and drips a stick to the axis, which lands and spreads into its bar
 *   line → area    the fill pours down from the line to the axis, left to right
 *   area → line    it drains back up into the line
 *   bars → area    the bars widen until they touch and fade to the wash; the steps they make melt
 *                  into the curve and the thread runs along the top
 *   area → bars    the curve sets into steps, which part into bars and fill in
 *
 * Every change is a tape: a pose that is a pure function of time. One frame loop plays it forward
 * or backward (asking for the shape it came from runs it back from where it is), and a finger can
 * hold it at any frame (scrub). Changes of data and the hover bead ride the same loop, which writes
 * path data and transforms straight to the DOM and sleeps when nothing moves.
 */

export type ChartShape = 'bars' | 'line' | 'area';

export type ChartLayout = { width: number; height: number; top: number };

/** The shapes in the switch's order: scrubbing runs along this axis. */
export const CHART_SHAPES: ChartShape[] = ['bars', 'line', 'area'];

const DOT = 7;
const STROKE = 2;
const WASH_TOP = 0.22;
const WASH_BOTTOM = 0.03;
const SAMPLES = 10;
const BEAD_TAU = 70;
/** How far a bar bulges before it pinches (as a share of the pinch), and how high a bead hops as it closes. */
const BULGE = 0.18;
const HOP = 2.2;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** The time at which inOut reaches y. */
const inOutAt = (y: number) => (y < 0.5 ? Math.cbrt(y / 4) : 1 - Math.cbrt(2 * (1 - y)) / 2);
const out = (t: number) => 1 - (1 - t) ** 3;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Tangents of a monotone cubic through the points: smooth, never overshooting a value. */
function tangents(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 2) return xs.map(() => 0);
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) m.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i] || 1));
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  return t;
}

type Pt = [number, number];
const mix = (p: Pt, q: Pt, s: number): Pt => [lerp(p[0], q[0], s), lerp(p[1], q[1], s)];

/** The piece of a cubic between s0 and s1 (de Casteljau twice). */
function piece(p0: Pt, p1: Pt, p2: Pt, p3: Pt, s0: number, s1: number): [Pt, Pt, Pt, Pt] {
  // Keep [0, s1].
  const a = mix(p0, p1, s1), b = mix(p1, p2, s1), c = mix(p2, p3, s1), ab = mix(a, b, s1), bc = mix(b, c, s1), e = mix(ab, bc, s1);
  if (s0 <= 0) return [p0, a, ab, e];
  // Of that, keep [s0 / s1, 1].
  const u = s0 / s1;
  const f = mix(p0, a, u), g = mix(a, ab, u), h = mix(ab, e, u), fg = mix(f, g, u), gh = mix(g, h, u);
  return [mix(fg, gh, u), gh, h, e];
}

/**
 * The curve between two x positions. Each segment's control points sit at thirds in x, so x runs
 * linearly with the curve's parameter and a cut at any x is exact.
 */
function curveBetween(xs: number[], ys: number[], t: number[], xa: number, xb: number) {
  let d = '';
  for (let i = 0; i < xs.length - 1; i++) {
    const h = xs[i + 1] - xs[i];
    if (xs[i + 1] <= xa || xs[i] >= xb || h <= 0) continue;
    const s0 = clamp01((xa - xs[i]) / h), s1 = clamp01((xb - xs[i]) / h);
    if (s1 - s0 < 1e-4) continue;
    const dx = h / 3;
    const [q0, q1, q2, q3] = piece([xs[i], ys[i]], [xs[i] + dx, ys[i] + t[i] * dx], [xs[i + 1] - dx, ys[i + 1] - t[i + 1] * dx], [xs[i + 1], ys[i + 1]], s0, s1);
    if (!d) d = `M${r2(q0[0])},${r2(q0[1])}`;
    d += `C${r2(q1[0])},${r2(q1[1])} ${r2(q2[0])},${r2(q2[1])} ${r2(q3[0])},${r2(q3[1])}`;
  }
  return d;
}

/** The same curve, evaluated at x (cubic Hermite on the segment). */
function curveAt(xs: number[], ys: number[], t: number[], x: number) {
  const n = xs.length;
  if (n === 1) return ys[0];
  let i = Math.min(n - 2, Math.max(0, Math.floor(((x - xs[0]) / (xs[n - 1] - xs[0] || 1)) * (n - 1))));
  while (i > 0 && x < xs[i]) i--;
  while (i < n - 2 && x > xs[i + 1]) i++;
  const h = xs[i + 1] - xs[i] || 1, s = clamp01((x - xs[i]) / h);
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  return h00 * ys[i] + h10 * h * t[i] + h01 * ys[i + 1] + h11 * h * t[i + 1];
}

/** A box with its own top and bottom corner radii. */
function box(l: number, t: number, r: number, b: number, rt: number, rb: number) {
  const w = r - l, h = b - t;
  if (w <= 0.01 || h <= 0.01) return '';
  rt = Math.max(0, Math.min(rt, w / 2, h / 2));
  rb = Math.max(0, Math.min(rb, w / 2, h - rt));
  return `M${r2(l)},${r2(t + rt)}A${r2(rt)},${r2(rt)} 0 0 1 ${r2(l + rt)},${r2(t)}H${r2(r - rt)}A${r2(rt)},${r2(rt)} 0 0 1 ${r2(r)},${r2(t + rt)}V${r2(b - rb)}A${r2(rb)},${r2(rb)} 0 0 1 ${r2(r - rb)},${r2(b)}H${r2(l + rb)}A${r2(rb)},${r2(rb)} 0 0 1 ${r2(l)},${r2(b - rb)}Z`;
}

type Route = { from: ChartShape; to: ChartShape; t: number; dir: 1 | -1 };

type Pose = {
  /** Per point: widened into a step (merge), condensed into a bead (dot), melted into the thread (zip). */
  m: Float32Array; d: Float32Array; z: Float32Array;
  cols: boolean;
  /** 0 solid, 1 the area's fading gradient. */
  wash: number;
  areaOn: boolean;
  /** The area's top edge: 0 the curve, 1 steps. */
  step: number;
  /** The thread is drawn between these fractions of the x range. */
  ta: number; tb: number;
  /** How far the area's floor has poured: 'full', or pouring in / draining out at time t. */
  pour: 'full' | 'in' | 'out'; pourT: number;
};

const poseFor = (n: number): Pose => ({
  m: new Float32Array(n), d: new Float32Array(n), z: new Float32Array(n),
  cols: true, wash: 0, areaOn: false, step: 0, ta: 0, tb: 0, pour: 'full', pourT: 0,
});

/** Timings shared by the tapes; the stagger shrinks with more points so a sweep stays under ~300ms. */
function timing(n: number) {
  const stag = n > 1 ? Math.min(28, 300 / (n - 1)) : 0;
  const spread = (n - 1) * stag;
  const condense = 460;
  const threadIn = condense * 0.9;
  const sweep = Math.max(420, spread * 1.25 + 90);
  const melt = 260;
  const pull = Math.max(380, spread * 1.1 + 120);
  const drip = 540;
  const widen = 380;
  const swap = widen + spread * 0.5;
  return { stag, spread, condense, threadIn, sweep, melt, pull, drip, widen, swap };
}

export function routeDuration(from: ChartShape, to: ChartShape, n: number) {
  const k = timing(n);
  switch (`${from}>${to}`) {
    case 'bars>line': return k.threadIn + k.sweep + 40 + k.melt;
    case 'line>bars': return k.pull + 40 + k.drip;
    case 'line>area': return 760;
    case 'area>line': return 620;
    case 'bars>area': return k.swap + 620;
    case 'area>bars': return 380 + 480 + k.spread * 0.6;
    default: return 0;
  }
}

/** The resting pose of a shape. */
function settle(P: Pose, s: ChartShape) {
  P.m.fill(s === 'area' ? 1 : 0);
  P.d.fill(s === 'line' ? 1 : 0);
  P.z.fill(s === 'line' ? 1 : 0);
  P.cols = s !== 'area';
  P.wash = s === 'area' ? 1 : 0;
  P.areaOn = s === 'area';
  P.step = 0;
  P.ta = 0; P.tb = s === 'bars' ? 0 : 1;
  P.pour = 'full'; P.pourT = 0;
}

/** The pose of a tape at time t. Every field is set, so the tape can run either way or be held. */
function pose(P: Pose, from: ChartShape, to: ChartShape, t: number, n: number) {
  const k = timing(n);
  const u = (i: number) => (n > 1 ? i / (n - 1) : 0);
  settle(P, from);
  switch (`${from}>${to}`) {
    case 'bars>line': {
      // The thread's tip eases across; each bead melts once the tip has passed it.
      const tip = inOut(clamp01((t - k.threadIn) / k.sweep));
      for (let i = 0; i < n; i++) {
        P.d[i] = clamp01((t - i * k.stag) / k.condense);
        P.z[i] = clamp01((t - (k.threadIn + k.sweep * inOutAt(u(i)) + 40)) / k.melt);
      }
      P.ta = 0; P.tb = tip;
      return;
    }
    case 'line>bars': {
      // The tail is pulled to the right; each bead swells just before it's left, then drips its bar.
      const tail = inOut(clamp01(t / k.pull));
      for (let i = 0; i < n; i++) {
        const leave = k.pull * inOutAt(u(i));
        P.z[i] = 1 - out(clamp01((t - Math.max(0, leave - 140)) / 200));
        P.d[i] = 1 - clamp01((t - leave - 40) / k.drip);
      }
      P.ta = tail; P.tb = 1;
      return;
    }
    case 'line>area': {
      P.cols = false; P.areaOn = t > 0; P.wash = 1; P.ta = 0; P.tb = 1;
      P.pour = 'in'; P.pourT = t;
      return;
    }
    case 'area>line': {
      const end = routeDuration('area', 'line', n);
      P.cols = false; P.areaOn = t < end; P.wash = 1; P.ta = 0; P.tb = 1;
      P.pour = 'out'; P.pourT = t;
      return;
    }
    case 'bars>area': {
      for (let i = 0; i < n; i++) P.m[i] = out(clamp01((t - i * k.stag * 0.5) / k.widen));
      P.wash = out(clamp01(t / k.swap));
      if (t < k.swap) { P.step = 1; return; }
      P.cols = false; P.areaOn = true;
      P.step = 1 - inOut(clamp01((t - k.swap) / 460));
      P.ta = 0; P.tb = inOut(clamp01((t - k.swap - 160) / 440));
      return;
    }
    case 'area>bars': {
      P.step = inOut(clamp01(t / 380));
      P.ta = out(clamp01(t / 260)); P.tb = 1;
      if (t < 380) return;
      P.areaOn = false; P.cols = true;
      for (let i = 0; i < n; i++) P.m[i] = 1 - out(clamp01((t - 380 - i * k.stag * 0.6) / 480));
      P.wash = 1 - out(clamp01((t - 380) / (480 + k.spread * 0.6)));
      return;
    }
  }
}

export function useChartMorph({ count, shape, reduced, barWidth = 24 }: { count: number; shape: ChartShape; reduced: boolean; barWidth?: number }) {
  const columns = React.useRef<(SVGPathElement | null)[]>([]);
  const columnGroup = React.useRef<SVGGElement>(null);
  const area = React.useRef<SVGPathElement>(null);
  const line = React.useRef<SVGPathElement>(null);
  const stops = React.useRef<(SVGStopElement | null)[]>([]);
  const bead = React.useRef<HTMLDivElement>(null);
  const rule = React.useRef<HTMLDivElement>(null);

  const st = React.useRef<{
    layout: ChartLayout; pose: Pose; shown: ChartShape; route: Route | null; queued: ChartShape | null; held: boolean;
    vals: Float32Array; from: Float32Array; to: Float32Array; dataT0: number; delay: number; max: number; maxFrom: number; maxTo: number;
    point: number | null; beadX: number; beadOn: boolean; last: number; n: number;
  } | null>(null);
  if (!st.current) {
    const P = poseFor(count);
    settle(P, shape);
    st.current = {
      layout: { width: 0, height: 0, top: 10 }, pose: P, shown: shape, route: null, queued: null, held: false,
      vals: new Float32Array(count), from: new Float32Array(count), to: new Float32Array(count), dataT0: -1, delay: 25, max: 1, maxFrom: 1, maxTo: 1,
      point: null, beadX: 0, beadOn: false, last: 0, n: count,
    };
  }
  const S = st.current;
  if (S.pose.m.length !== count) {
    const keep = (a: Float32Array) => Float32Array.from({ length: count }, (_, i) => a[i] ?? a[a.length - 1] ?? 0);
    S.vals = keep(S.vals); S.from = keep(S.from); S.to = keep(S.to);
    if (S.route) S.shown = S.route.dir > 0 ? S.route.to : S.route.from;
    S.pose = poseFor(count);
    settle(S.pose, S.shown);
    S.route = null; S.queued = null; S.held = false;
    S.point = S.point !== null && S.point < count ? S.point : null;
  }
  S.n = count;

  const frame = React.useRef(0);
  const still = React.useRef(reduced);
  still.current = reduced;

  const paint = (dt = 0) => {
    const P = S.pose, n = S.n;
    const { width: W, height: H, top } = S.layout;
    if (!W || !H || !n) return;
    const band = W / n;
    const bw = Math.min(barWidth, band * 0.56);
    const xs = Array.from({ length: n }, (_, i) => band * (i + 0.5));
    const max = S.max || 1;
    const ys = Array.from(S.vals, (v) => top + (H - top) * (1 - Math.max(0, v) / max));
    const x0 = xs[0], xN = xs[n - 1];
    const tg = tangents(xs, ys);
    const near = (x: number) => ys[Math.max(0, Math.min(n - 1, Math.round((x - x0) / band)))];

    // Columns: bars, steps on their way to the area, or beads.
    const g = columnGroup.current;
    if (g) g.style.display = P.cols ? '' : 'none';
    if (P.cols) {
      for (let i = 0; i < n; i++) {
        const el = columns.current[i];
        if (!el) continue;
        const x = xs[i], yt = ys[i], mi = P.m[i], di = P.d[i], zi = P.z[i];
        let l = lerp(x - bw / 2, n > 1 ? Math.max(x0, x - band / 2) : x - band / 2, mi);
        let r = lerp(x + bw / 2, n > 1 ? Math.min(xN, x + band / 2) : x + band / 2, mi);
        // Condensing: the bar bulges a touch, pinches to a stick, then the stick retracts up into a bead
        // on the value, which hops as it closes. Run backward, the same curves make a drip that lifts
        // off, falls, and spreads past its width as it lands.
        const ps = clamp01(di / 0.45), ls = clamp01((di - 0.3) / 0.7);
        const pinch = inOut(ps) - BULGE * Math.sin(Math.PI * clamp01(ps / 0.45)), lift = inOut(ls);
        const hop = HOP * Math.sin(Math.PI * clamp01((ls - 0.72) / 0.28));
        const cx = (l + r) / 2, w = lerp(r - l, DOT, pinch);
        l = cx - w / 2; r = cx + w / 2;
        let t = yt - (DOT / 2) * lift - hop, b = lerp(H, yt + DOT / 2, lift) - hop;
        // Melting: the bead shrinks to the thread's thickness, under it, and goes.
        if (zi > 0) {
          if (zi >= 1) { el.setAttribute('d', ''); continue; }
          const k = lerp(1, STROKE / DOT, out(zi)), cy = (t + b) / 2, hw = (r - l) / 2, hh = (b - t) / 2;
          l = cx - hw * k; r = cx + hw * k; t = cy - hh * k; b = cy + hh * k;
        }
        const rt = lerp(4 * (1 - mi), DOT / 2, Math.max(0, pinch));
        const rb = (DOT / 2) * lift;
        el.setAttribute('d', box(l, t, r, b, rt, rb));
      }
    }

    // The wash: solid for bars, a fading gradient for the area. Columns paint with a plain fill until it starts.
    const washing = P.wash > 0.001 ? '1' : '';
    if (g && g.dataset.washing !== washing) {
      g.dataset.washing = washing;
      g.setAttribute('fill', washing ? (g.dataset.wash ?? '') : 'var(--chart-1, var(--primary))');
    }
    const [s0, s1] = stops.current;
    if (s0) s0.setAttribute('stop-opacity', String(r2(lerp(1, WASH_TOP, P.wash))));
    if (s1) s1.setAttribute('stop-opacity', String(r2(lerp(1, WASH_BOTTOM, P.wash))));

    // The area: a top edge between the curve and steps, a floor that pours down to the axis.
    const a = area.current;
    if (a) {
      a.style.display = P.areaOn && n > 1 ? '' : 'none';
      if (P.areaOn && n > 1) {
        if (P.step < 0.001 && P.pour === 'full') {
          a.setAttribute('d', `${curveBetween(xs, ys, tg, x0, xN)}L${r2(xN)},${H}L${r2(x0)},${H}Z`);
        } else {
          const px: number[] = [];
          for (let i = 0; i < n - 1; i++) {
            for (let k = 0; k < SAMPLES; k++) px.push(xs[i] + (k / SAMPLES) * band);
            const mid = xs[i] + band / 2;
            px.push(mid - 0.01, mid + 0.01);
          }
          px.push(xN);
          px.sort((p, q) => p - q);
          const tops = px.map((x) => lerp(curveAt(xs, ys, tg, x), near(x), P.step));
          const floor = (x: number) => {
            const v = (x - x0) / (xN - x0 || 1);
            if (P.pour === 'full') return 1;
            if (P.pour === 'in') return out(clamp01((P.pourT - v * 300) / 460));
            return 1 - inOut(clamp01((P.pourT - v * 240) / 380));
          };
          let d = `M${r2(px[0])},${r2(tops[0])}`;
          for (let k = 1; k < px.length; k++) d += `L${r2(px[k])},${r2(tops[k])}`;
          if (P.pour === 'full') d += `L${r2(xN)},${H}L${r2(x0)},${H}Z`;
          else {
            for (let k = px.length - 1; k >= 0; k--) d += `L${r2(px[k])},${r2(lerp(tops[k], H, floor(px[k])))}`;
            d += 'Z';
          }
          a.setAttribute('d', d);
        }
      }
    }

    // The thread: the curve cut exactly between its tail and its tip.
    const ln = line.current;
    if (ln) {
      const xa = lerp(x0, xN, P.ta), xb = lerp(x0, xN, P.tb);
      const on = n > 1 && xb - xa > 0.5;
      ln.style.display = on ? '' : 'none';
      if (on) ln.setAttribute('d', curveBetween(xs, ys, tg, xa, xb));
    }

    // The hover bead slides along the thread (it follows the curve, not a straight line), with a Tactile under it.
    const bd = bead.current, rl = rule.current;
    if (bd && rl) {
      const showing = S.point !== null && n > 1 && (P.areaOn || P.tb - P.ta > 0.98);
      if (S.point !== null) {
        const target = xs[S.point];
        S.beadX = !S.beadOn || still.current ? target : lerp(target, S.beadX, Math.exp(-dt / BEAD_TAU));
        if (Math.abs(S.beadX - target) < 0.05) S.beadX = target;
      }
      if (showing !== S.beadOn) {
        S.beadOn = showing;
        bd.style.opacity = rl.style.opacity = showing ? '1' : '0';
        bd.style.scale = showing ? '1' : '0.4';
      }
      const x = S.beadX, y = lerp(curveAt(xs, ys, tg, x), near(x), P.step);
      bd.style.translate = `${r2(x - 4.5)}px ${r2(y - 4.5)}px`;
      rl.style.translate = `${r2(x - 0.5)}px 0`;
    }
  };

  const tick = (now: number) => {
    frame.current = 0;
    const dt = S.last ? Math.min(64, now - S.last) : 16;
    S.last = now;
    let moving = false;
    // Data: each value eases to its new height, a little after its left neighbour.
    if (S.dataT0 >= 0) {
      const t = now - S.dataT0;
      let done = true;
      for (let i = 0; i < S.n; i++) {
        const k = out(clamp01((t - i * S.delay) / 650));
        if (k < 1) done = false;
        S.vals[i] = lerp(S.from[i], S.to[i], k);
      }
      S.max = lerp(S.maxFrom, S.maxTo, out(clamp01(t / 650)));
      if (done) { S.dataT0 = -1; S.max = S.maxTo; } else moving = true;
    }
    // Shape: play the tape the way it's heading; land, then take any shape asked for meanwhile.
    const R = S.route;
    if (R && !S.held) {
      const end = routeDuration(R.from, R.to, S.n);
      R.t = Math.max(0, Math.min(end, R.t + dt * R.dir));
      if ((R.dir > 0 && R.t >= end) || (R.dir < 0 && R.t <= 0)) {
        S.shown = R.dir > 0 ? R.to : R.from;
        settle(S.pose, S.shown);
        S.route = null;
        const next = S.queued;
        S.queued = null;
        if (next && next !== S.shown) { S.route = { from: S.shown, to: next, t: 0, dir: 1 }; moving = true; }
      } else {
        pose(S.pose, R.from, R.to, R.t, S.n);
        moving = true;
      }
    }
    // The bead: eases toward its point.
    if (S.point !== null && S.beadOn && Math.abs(S.beadX - (S.layout.width / S.n) * (S.point + 0.5)) > 0.05) moving = true;
    paint(dt);
    if (moving) frame.current = requestAnimationFrame(tick);
    else S.last = 0;
  };

  const kick = () => {
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  };

  React.useEffect(() => () => { cancelAnimationFrame(frame.current); frame.current = 0; }, []);

  /**
   * Where the shape is on the switch's axis (0 bars, 1 line, 2 area). Null while a tape that isn't
   * on that axis runs (line → bars, area → line, bars ↔ area are their own choreographies).
   */
  const position = () => {
    const R = S.route;
    if (!R) return CHART_SHAPES.indexOf(S.shown);
    const along = R.t / (routeDuration(R.from, R.to, count) || 1);
    if (R.from === 'bars' && R.to === 'line') return along;
    if (R.from === 'line' && R.to === 'area') return 1 + along;
    return null;
  };

  const shapeTo = (next: ChartShape) => {
    const R = S.route;
    if (still.current) {
      S.route = null; S.queued = null; S.held = false;
      S.shown = next;
      settle(S.pose, next);
      paint();
      return;
    }
    if (R) {
      S.held = false;
      if (next === R.to) { R.dir = 1; S.queued = null; }
      else if (next === R.from) { R.dir = -1; S.queued = null; }
      else S.queued = next;
      kick();
      return;
    }
    if (next === S.shown) return;
    S.route = { from: S.shown, to: next, t: 0, dir: 1 };
    kick();
  };

  return {
    columns, columnGroup, area, line, stops, bead, rule,
    /** The plot's size changed: redraw where everything is. */
    layout(next: ChartLayout) {
      if (S.layout.width === next.width && S.layout.height === next.height && S.layout.top === next.top) return;
      S.layout = next;
      paint();
    },
    /** New values (and scale); from the values on screen, or from `from` for the first arrival. */
    data(values: number[], max: number, opts: { animate: boolean; from?: number }) {
      for (let i = 0; i < count; i++) {
        S.from[i] = opts.from ?? S.vals[i];
        S.to[i] = values[i] ?? 0;
      }
      S.maxFrom = opts.from !== undefined ? max : S.max;
      S.maxTo = max;
      if (!opts.animate || still.current) {
        S.vals.set(S.to);
        S.max = max;
        S.dataT0 = -1;
        paint();
        return;
      }
      S.delay = count > 1 ? Math.min(40, 420 / (count - 1)) : 0;
      S.dataT0 = performance.now();
      kick();
    },
    /** Head for a shape: run the tape on, run it back if that's where it came from, or queue behind it. */
    shape: shapeTo,
    position,
    /** Hold the tape at a point on the shape axis, 0 (bars) to 2 (area), between neighbours. */
    scrub(p: number) {
      if (still.current) return;
      p = Math.max(0, Math.min(CHART_SHAPES.length - 1, p));
      const i = Math.min(CHART_SHAPES.length - 2, Math.floor(p));
      const from = CHART_SHAPES[i], to = CHART_SHAPES[i + 1];
      S.queued = null;
      S.held = true;
      S.route = { from, to, t: (p - i) * routeDuration(from, to, count), dir: 1 };
      pose(S.pose, from, to, S.route.t, count);
      paint();
    },
    /** Let go of the tape: it runs on to `target`, one of the two shapes either side of it. */
    release(target: ChartShape) {
      const R = S.route;
      S.held = false;
      if (!R || still.current) return shapeTo(target);
      if (target === R.from) R.dir = -1;
      else if (target === R.to) R.dir = 1;
      else S.queued = target;
      kick();
    },
    /** The point the bead sits on, or null to hide it. */
    point(i: number | null) {
      if (i === S.point) return;
      S.point = i;
      kick();
    },
  };
}
