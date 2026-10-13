// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Live map (live-map)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * LIVE MAP: the world as dots, lighting up where people are
 *
 *   land      every continent drawn as an even field of dots (one
 *             path, so it's light), cropped where nobody lives
 *   ping      something happens somewhere (a signup, an order):
 *             the dots around it light up, a Tactile ring ripples
 *             out, and the light fades slowly, so the last minute's
 *             activity stays on the map as a faint tint
 *   label     one card follows the newest ping, gliding from city
 *             to city with its words morphing, never a pile of
 *             popups; near an edge it swings to the other side
 *   route     a ping with a "from" draws an arc from there to here,
 *             and a short dash runs along it, like a parcel
 *   home      fixed places (an office, a store) sit as rings
 *
 * The coastlines are hand-drawn outlines in longitude and latitude,
 * coarse on purpose: at this dot size you'd never see the detail.
 * ───────────────────────────────────────────────────────── */

export interface MapPoint {
  lat: number;
  lon: number;
}

export interface MapPing extends MapPoint {
  id: string | number;
  /** First line of the card, e.g. "New signup". */
  label?: string;
  /** Second line, e.g. "Lisbon, Portugal". */
  detail?: string;
  /** Draws a route from here to the ping. */
  from?: MapPoint;
}

export interface LiveMapProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Recent events, oldest first; each id seen for the first time pings. */
  pings: MapPing[];
  /** Places that are always marked. */
  markers?: (MapPoint & { label?: string })[];
  /** How long a ping's light takes to fade, in ms. */
  afterglow?: number;
  /** Show the card for the newest ping. */
  showLabel?: boolean;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const STEP = 2.6;
const LON0 = -170;
const LAT0 = 76;
const LAT1 = -56;
const SY = 1.25;
const DOT = 0.8;
const W = 350;
const H = (LAT0 - LAT1) * SY;

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

// Coastlines as [lon, lat, lon, lat, …], walked around each landmass.
const LAND: number[][] = [
  // North America
  [-166,68.9,-156.5,71.3,-141,69.7,-135,69.3,-125,70,-115,68.6,-108,68.3,-98,68,-94,71.5,-90,69,-86,68,-82,66.5,-87,64,-94,61,-93,58.8,-88,56.5,-82,55,-80,51.5,-79,54.5,-77,60,-78,62.5,-73,62,-69,60,-65,60.3,-61,56,-57,52.5,-56,51.5,-60,50,-66,50,-64.5,48.8,-65,47,-61,45.5,-66,43.8,-70,43.5,-70,41.7,-74,40.5,-75.5,38.5,-76,37,-75.5,35.2,-78,33.8,-81,31.5,-80.5,28.5,-80,25.5,-81.5,25.5,-82.5,27.5,-83,29.5,-85,29.7,-89,30.2,-89.5,29.2,-94,29.6,-97,27.5,-97.5,25,-97.8,22,-97,20,-95,18.6,-92,18.5,-91,19.5,-90.5,21,-87,21.5,-87.5,18,-88.3,16,-84,15.8,-83.3,12,-82.5,9.5,-79.5,9.5,-77.5,8.5,-78,7.5,-80,7.4,-82,8.2,-85.8,10,-87.5,13,-90,13.8,-92.3,14.5,-94.5,16,-96.5,15.7,-99.5,16.8,-103,18.3,-105.5,20.5,-105.2,22,-106.5,23.5,-109,25.5,-112,28.8,-114.7,31.6,-112.8,28,-110.5,24.2,-109.5,23,-112,24.8,-114,27.5,-115,30,-117,32.5,-118.5,34,-120.6,34.6,-122.5,37.7,-124,40.4,-124.3,43,-124,46.2,-124.7,48.4,-123,49,-127,50.5,-130,54.5,-133,57,-137,58.5,-140,59.8,-146,60.8,-151.5,59.2,-154,57.5,-158,56,-162,54.8,-164.5,54.4,-161,58.6,-162,59.9,-165,60.8,-164.5,63,-161,64.5,-165.5,64.6,-168,65.6],
  // Arctic islands of Canada
  [-62,67,-65,63.5,-72,63,-78,64.5,-80,67,-84,69.5,-88,71,-86,73.5,-78,73.5,-72,72,-67,69.5],
  [-118,71,-110,73,-101,72.5,-101,69.5,-108,68.5,-116,69],
  [-125,72,-120,74.3,-116,73.5,-118,71.3],
  [-95,74,-80,74.3,-80,76.5,-95,76.5],
  [-90,76.5,-79,76.2,-74,78,-90,78],
  // Greenland, Iceland
  [-72,78,-66,76,-58,75.5,-55,72,-52,69.5,-54,67,-51,64,-48,61,-44,60,-42,60.5,-40,64,-37,65.5,-30,68.2,-22,70.2,-22,73,-18,75.5,-18,78],
  [-24,65.5,-22,66.4,-15,66.5,-13.5,65,-18,63.4,-22.5,63.8],
  // Caribbean
  [-85,21.9,-82,23.1,-79,22.6,-75.5,21,-74.2,20.2,-77.5,19.8,-81,21.6],
  [-74.4,18.5,-72.8,19.9,-70,19.8,-68.4,18.6,-70.5,18.2,-73,18],
  // South America
  [-77.5,8.5,-75.5,10.6,-72,12.4,-71.5,10.7,-68,10.6,-64,10.7,-61,10.5,-60,8.5,-57.5,6.3,-53,5.6,-51,4,-50,1.8,-50,0,-48,-1,-44,-2.5,-40,-2.8,-37,-4.8,-35,-5.5,-34.8,-7.5,-35.5,-9.5,-37.5,-12,-39,-14,-39,-17.5,-40,-20,-41,-22,-43.2,-23,-45.5,-23.8,-48.5,-26,-48.6,-28.5,-50.5,-30.8,-52.5,-33.2,-53.5,-34.5,-56,-34.9,-57.5,-36.3,-57.5,-38.2,-62,-39,-62.3,-40.8,-65,-41,-64.3,-42.7,-65.5,-45,-67.5,-46.5,-66,-48,-68,-50.2,-69,-52,-68.5,-53.5,-66.5,-55,-70,-55.3,-74,-52.5,-75.5,-50,-74.8,-47,-74,-44,-73.5,-41.8,-73.7,-37,-71.6,-33,-71.5,-30,-71.3,-27,-70.4,-23.5,-70.2,-18.5,-75.5,-15,-77,-12,-79.5,-7,-81.3,-5,-80.3,-3.4,-80,-1,-80.5,1,-78.8,1.8,-77.5,4,-77.4,6.5],
  // Africa, Madagascar
  [-6,35.8,-1,35.2,2,36.7,10,37.2,11,35.5,10,34,11.5,33,15,32.4,19,30.3,20,32,24,32.6,29,31,32.3,31.3,32.5,29.9,33.5,27.5,35.5,24,37.3,21,38.5,18,39.5,15.5,41.5,13.5,43.3,12.5,45,10.4,48,11.2,51.3,11.8,51,10.4,49,6,47.5,4,45,1.8,42,-1,40.2,-3,39.3,-6.5,39.5,-8.5,40.5,-10.5,40.6,-14.5,39,-16.5,36,-19,35.3,-22,35.5,-24,32.9,-26,32.5,-28.5,31,-30,28.5,-32.5,25.6,-34,22,-34.2,20,-34.8,18.4,-34.2,18,-32.5,17.2,-29,15.5,-26.5,14.5,-23,13,-20.5,11.8,-17.3,12,-14,13.5,-11,13,-8.8,12.3,-6,11.5,-4,9.5,-1.5,9.4,1,9.8,3.5,8.5,4.6,6,4.3,4.5,6.4,2,6.3,-1,5.1,-3,5,-5,5.1,-7.5,4.4,-10,6,-12.5,7.6,-13.3,9.2,-15,11,-16.7,12.5,-17.5,14.7,-16.5,16.5,-16.2,19.5,-17,21,-15,24,-13.5,27.5,-10,29.5,-9.7,32,-7,33.8],
  [49.3,-12,50.5,-15.5,49.5,-18,48,-22,47,-25,45,-25.4,43.6,-23,44,-20,44.3,-17,46.5,-15.8,48,-13.5],
  // Sinai
  [32.4,31.2,34.3,31.3,34.9,29.5,34.2,27.8,32.6,29.9],
  // Eurasia
  [-9,43,-8.9,38.7,-8.9,37,-6,36.7,-5.5,36,-2,36.7,0,38.8,0.5,40.5,3.2,41.9,3,43.3,6,43.1,7.5,43.8,9,44.4,10.3,42.9,12.3,41.7,15.6,40,15.7,37.9,17,39,18.5,40.1,16.2,41.5,14,42.6,12.4,44.5,12.4,45.5,13.7,45.6,16.5,43.5,18.5,42.4,19.5,41.8,19.3,40.3,21,38.4,21.6,37,22.5,36.4,23.1,37.8,24,38.2,22.8,40.5,26,40.8,26.2,39.5,27,38,28.3,36.8,30.5,36.3,32.8,36.1,36,36.6,35.9,34.7,35.5,33.8,34.9,32.5,34.3,31.3,34.9,29.5,35.5,27.6,37,25,39,21.5,40.5,19.5,42.5,16.5,43.4,12.7,45,12.8,48.6,14,52,15.6,55.5,17.8,57.5,18.9,58.8,20.5,59.8,22.5,58.5,23.7,56.4,26.2,56,24.8,54.5,24.3,51.5,24.5,50.2,26.5,48.8,28,48,29.9,50,30.2,51.5,27.9,54,26.7,56.3,27.1,57.5,25.7,61.5,25.1,66.5,25.4,68.5,23.5,69,22.3,70.5,20.8,72.6,21.5,72.8,19,73.5,16,74.5,13.5,75.8,11,76.5,9,77.5,8.1,78.3,9,79.8,10.3,80.2,13,80.3,15.5,82,17,84.5,19.2,86.5,20,87,21.5,89,21.8,90.5,22.5,91.8,22.3,92.3,20.7,94.3,18.5,94.5,16.3,95.5,15.8,97.5,16.5,97.8,14.5,98.5,12,98.7,9.8,98.3,8.2,100.3,6,100.5,4,101.4,2.8,103.5,1.3,104.2,1.5,103.4,4,102.2,6.2,100.5,7.5,100,9.5,99.2,10.5,100,13.5,101,12.7,102.5,12,103,10.8,104.6,10.4,105,8.6,106.7,10.4,109.2,11.5,109.3,13.5,108.8,15.5,106.5,17.5,105.7,18.8,106.5,20.3,108,21.5,110,21,111,21.5,113.5,22.2,116.5,23,118.5,24.5,119.5,26,120.5,28,122,30,121.8,31.3,120.5,33.5,119.2,34.8,120.3,36,122.5,37,119,37.3,117.7,38.8,119.5,39.9,121.5,40.8,122.2,39.5,124.3,39.9,125.3,37.7,126.6,37.4,126.3,35,127.5,34.7,129.3,35.3,129.5,36.9,128.5,38.6,127.5,39.8,129.7,41,130.6,42.4,132,43.2,135,43.6,138,46.5,140.4,48.5,141,52,140.5,53.5,137.5,54,135.2,54.7,137,56.5,141,59,143,59.3,148,59.4,152,59,155,59.4,156.7,61.6,156.5,57,156.7,51,158.6,53,160,54.5,162.5,56.2,163.3,58,164.5,59.8,170,60,173.5,61.7,177.5,62.5,180,65,180,68.8,176,69.8,170,70,161,69.6,155,71,150,71.5,142,72.7,134,71.5,128,72.7,120,73,113,73.7,107,76.8,100,77.8,96,76.1,88,75.3,82,73.5,80,72.2,76,72.5,72,72.8,69,72.8,68,68.5,66,69.4,60,68.8,55,68.4,50,67.8,44,68.4,40,67.8,33,69.4,28.5,70.9,23,70.5,18,69.6,15,68.3,12.5,66,10.5,64,7.5,63,5,61.5,5.2,59.3,6,58.1,8,58,10.5,59.5,11.2,58.4,12.5,56.3,12.8,55.4,14.3,55.6,16.2,56.6,16.6,57.9,18.3,59.3,17.5,61,17.5,62.5,21,64.2,22.3,65.7,25.3,65.2,25,64,21.5,62,21.4,60.6,23,59.9,25,60.2,28.5,60.5,30,59.9,28,59.4,24,59.4,23.4,58.3,24.3,57.2,21.6,57.4,21,56,21.2,55.2,20,54.5,18.6,54.4,16,54.3,14.2,53.9,12,54.2,10.6,57.7,8.2,56.6,8.6,55.5,9,54.5,8.6,54,7,53.6,4.8,53,4.2,52,3.3,51.4,1.6,50.9,0.1,49.6,-1.6,49.7,-1.5,48.6,-4.7,48.4,-2.2,47.3,-1.3,44.5,-1.7,43.4,-4,43.4,-8,43.7],
  // Britain, Ireland
  [-5.7,50.1,-3.5,50.3,1.3,51.1,1.7,52.6,0.3,53.5,-0.2,54.3,-1.5,55.6,-2.1,57.1,-1.8,57.6,-3.2,58.6,-5,58.6,-6,57.5,-5.6,56.3,-5,55,-3,54.9,-3.4,54.4,-3,53.4,-4.5,53.3,-4.2,52.2,-5.2,51.8,-3.3,51.4,-4.2,51.2],
  [-6.3,52.2,-6.2,53.5,-5.5,54.5,-6.2,55.2,-7.5,55.3,-8.5,54.6,-10,54.2,-9.5,53,-10.3,51.8,-8.5,51.6],
  // Japan, Sakhalin, Taiwan, Hainan, Sri Lanka
  [129.6,33.2,130.3,31.2,131.4,31.4,132,33.4,134.2,33.2,135.5,33.5,136.8,34.3,138.8,34.6,140.9,35.7,140.6,36.9,141,38.3,142,39.6,141.4,41.4,140,40.7,139.7,39,138.5,37.8,136.8,37.1,136,35.8,133.3,35.6,131.5,34.5,130.9,33.9],
  [140,41.8,141.2,41.8,143.3,42,145.6,43.3,144.5,44,141.8,45.4,140.4,43.3,139.9,42.3],
  [141.9,46.1,143.4,49.2,142.7,54.4,141.8,51.5],
  [120.2,22.5,121,21.9,121.9,24.6,121.5,25.3,120.1,23.5],
  [108.7,19,110,18.2,111,19.6,110.3,20.1],
  [79.8,8.1,80,9.8,81.4,8.5,81.8,7,80.6,5.9,79.9,6.9],
  // Philippines
  [120.6,18.5,122.2,18.5,122,16.8,121.6,14,124,13,123.8,12.5,120.6,14.3,119.8,16.3],
  [122,11.8,124.5,12.5,126,11,123.8,9.6],
  [122,7,123.5,7.8,125.4,9.8,126.6,7.3,125.4,5.6,124,6.2],
  // Indonesia, New Guinea
  [95.3,5.6,97.5,5.2,100.4,2.2,103.8,-1,106,-3.2,105.9,-5.8,104.5,-5.9,102.3,-4,100.4,-1,98.7,1.7,96.4,3.8],
  [105.2,-6.8,106.5,-6,108.3,-6.2,110.4,-6.9,112.7,-6.9,114.5,-7.8,114.4,-8.7,110.5,-8.2,106.5,-7.4],
  [109,1.5,109.6,-1,110.2,-3,114.5,-3.9,116.3,-3.5,116.5,-1.5,117.5,0.8,118.5,1,119,5,117.7,6.5,116.5,6.9,115.4,5,113.8,4.3,111.5,2.6,109.6,2],
  [118.9,-5.6,120.4,-5.6,120.7,-2.6,122.7,-4.8,123.3,-1,121.3,-1,122.7,0.5,125,1.5,120.8,1.3,119.7,0,119.3,-3],
  [123.5,-10.3,125,-9,127.3,-8.4,124.8,-9.9],
  [131,-1.4,132.5,-0.4,135,-3.3,138,-1.6,141,-2.6,145.8,-4.9,147.5,-6,148,-8,150.5,-10.5,147,-10,146,-8,143.5,-9,141,-9.1,139,-8,137.7,-5.2,135,-4.4,132.5,-4,131.5,-3],
  // Australia, Tasmania, New Zealand
  [113.2,-22,114.1,-21.8,116.7,-20.6,121,-19.5,122.2,-17.5,123.5,-16.4,125,-14.5,127,-13.8,129.5,-14.9,130.2,-13,131,-12.2,132.7,-11.4,136.5,-12,136,-13.5,135.5,-14.8,137.5,-16.2,139.5,-17.5,140.8,-17.4,141.6,-15,141.6,-12.6,142.5,-10.7,143.5,-14,145.3,-15,146,-18.3,149,-20.5,150.8,-22.5,153.2,-25.5,153.6,-28.2,152.9,-31.5,151.2,-33.9,150,-37.5,147.8,-37.9,146.2,-39,144.8,-38.1,143,-38.8,140.5,-38,138,-35.6,137.7,-33,135.6,-34.8,134,-32.7,131.5,-31.5,128,-32.2,124,-33.8,121.8,-33.8,118,-35,115.1,-34.3,115.7,-31.7,114.9,-29,113.4,-26.3,114,-24.5,113.4,-23.5],
  [144.6,-40.7,148.3,-40.9,148,-43,146.9,-43.6,145.3,-42.3],
  [172.7,-34.4,174.5,-35.8,175.9,-37.5,178.5,-37.7,177,-39.3,176.9,-40,175.2,-41.6,174.7,-41.3,173.8,-39.2,174.6,-37.5],
  [172.7,-40.5,174.3,-41.5,173.4,-43,171.2,-44.3,170.7,-45.9,169,-46.6,166.5,-46,167,-45,168.3,-44,170.5,-43,172,-41.5],
];

// Inland seas cut back out of Eurasia.
const WATER: number[][] = [
  [27.5,42.5,28,44,30,45.5,33.5,46,36.5,45.4,38,47,41.5,41.6,39,41,35,42,31,41.2,29,41.2],
  [49,46.5,53,46.8,53.5,44,53,41,54,38,51,36.8,49,37.6,49.5,40.5,47.5,42.5,47,44.5],
];

function inside(poly: number[], lon: number, lat: number) {
  let hit = false;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const xi = poly[i];
    const yi = poly[i + 1];
    const xj = poly[j];
    const yj = poly[j + 1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

const bounds = (poly: number[]) => {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i < poly.length; i += 2) {
    x0 = Math.min(x0, poly[i]);
    x1 = Math.max(x1, poly[i]);
    y0 = Math.min(y0, poly[i + 1]);
    y1 = Math.max(y1, poly[i + 1]);
  }
  return [x0, y0, x1, y1];
};

export const project = (p: MapPoint) => ({ x: p.lon - LON0, y: (LAT0 - p.lat) * SY });

/** The dot field, worked out once: a staggered grid sampled against the coastlines. */
let field: { dots: { x: number; y: number; lat: number; lon: number }[]; path: string } | null = null;
function dotField() {
  if (field) return field;
  const boxes = LAND.map(bounds);
  const dots: { x: number; y: number; lat: number; lon: number }[] = [];
  const r = DOT;
  let row = 0;
  for (let lat = LAT0 - STEP / 2; lat > LAT1; lat -= STEP * 0.866, row++) {
    for (let lon = LON0 + (row % 2 ? STEP / 2 : 0); lon < 180; lon += STEP) {
      const land = LAND.some((poly, i) => {
        const [x0, y0, x1, y1] = boxes[i];
        return lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1 && inside(poly, lon, lat);
      });
      if (land && !WATER.some((poly) => inside(poly, lon, lat))) dots.push({ ...project({ lat, lon }), lat, lon });
    }
  }
  const path = dots.map((d) => `M${(d.x - r).toFixed(2)} ${d.y.toFixed(2)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`).join("");
  field = { dots, path };
  return field;
}

/** A ping's light: the dots around it, fading slowly. */
function Glow({ at, afterglow, reduced }: { at: MapPoint; afterglow: number; reduced: boolean }) {
  const ref = React.useRef<SVGGElement>(null);
  const near = React.useMemo(() => {
    const p = project(at);
    return dotField().dots.filter((d) => (d.x - p.x) ** 2 + (d.y - p.y) ** 2 < 5.2 ** 2).map((d) => ({ ...d, k: Math.hypot(d.x - p.x, d.y - p.y) }));
  }, [at]);
  React.useEffect(() => {
    if (reduced) return;
    ref.current?.animate([{ opacity: 1 }, { opacity: 1, offset: 0.15 }, { opacity: 0.18 }], { duration: afterglow, easing: "ease-out", fill: "forwards" });
  }, [afterglow, reduced]);
  return (
    <g ref={ref}>
      {near.map((d) => (
        <circle key={`${d.lat}:${d.lon}`} cx={d.x} cy={d.y} r={DOT} fill="var(--primary)" opacity={1 - d.k / 6.5} />
      ))}
    </g>
  );
}

function Ripple({ at, reduced }: { at: MapPoint; reduced: boolean }) {
  const ref = React.useRef<SVGCircleElement>(null);
  const p = project(at);
  React.useEffect(() => {
    if (reduced) return;
    // Scale a fixed ring rather than animating r, which not every browser animates.
    ref.current?.animate(
      [
        { transform: "scale(0.05)", opacity: 1 },
        { transform: "scale(1)", opacity: 0 },
      ],
      { duration: 1400, easing: EASE, fill: "forwards" },
    );
  }, [reduced]);
  return (
    <circle
      ref={ref}
      cx={p.x}
      cy={p.y}
      r={9}
      fill="none"
      stroke="var(--primary)"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
      opacity={reduced ? 0 : undefined}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    />
  );
}

/** A route from one place to another: a curve that draws itself, and a dash that runs along it. */
function Route({ from, to, reduced }: { from: MapPoint; to: MapPoint; reduced: boolean }) {
  const line = React.useRef<SVGPathElement>(null);
  const dash = React.useRef<SVGPathElement>(null);
  const a = project(from);
  const b = project(to);
  const lift = Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.32);
  const d = `M${a.x} ${a.y}Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y}`;
  React.useLayoutEffect(() => {
    const path = line.current;
    const svg = path?.ownerSVGElement;
    if (!path || !svg || reduced) return;
    // Tactile strokes don't scale, so their dashes are measured on screen: the curve's length in pixels.
    const len = path.getTotalLength() * (svg.getBoundingClientRect().width / W);
    const comet = Math.min(18, len * 0.2);
    path.style.strokeDasharray = `${len} ${len}`;
    path.animate(
      [
        { strokeDashoffset: len, opacity: 1 },
        { strokeDashoffset: 0, opacity: 1, offset: 0.35 },
        { strokeDashoffset: 0, opacity: 0 },
      ],
      { duration: 3200, easing: EASE, fill: "forwards" },
    );
    if (dash.current) {
      dash.current.style.strokeDasharray = `${comet} ${len + comet}`;
      dash.current.animate([{ strokeDashoffset: comet }, { strokeDashoffset: -len }], {
        duration: 1500,
        delay: 250,
        easing: "cubic-bezier(0.45,0,0.2,1)",
        fill: "both",
      });
    }
  }, [d, reduced]);
  return (
    <g fill="none" opacity={reduced ? 0 : 1}>
      <path ref={line} d={d} stroke="var(--primary)" strokeOpacity={0.5} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <path ref={dash} d={d} stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

export function LiveMap({ pings, markers = [], afterglow = 9000, showLabel = true, className = "", ...props }: LiveMapProps) {
  const reduced = useReducedMotion();
  const { path } = React.useMemo(() => dotField(), []);
  // Keep the pings recent enough to still be glowing, keyed so each new id plays once.
  const [live, setLive] = React.useState<(MapPing & { at: number })[]>([]);
  const seen = React.useRef(new Set<string | number>());
  React.useEffect(() => {
    const fresh = pings.filter((p) => !seen.current.has(p.id));
    if (!fresh.length) return;
    fresh.forEach((p) => seen.current.add(p.id));
    const now = Date.now();
    setLive((l) => [...l.filter((p) => now - p.at < afterglow), ...fresh.map((p) => ({ ...p, at: now }))]);
  }, [pings, afterglow]);

  const newest = live[live.length - 1];
  const spot = newest ? project(newest) : null;
  // The card sits above and to the right of the point, and swings away from whichever edge is close.
  const right = spot ? spot.x / W > 0.68 : false;
  const below = spot ? spot.y / H < 0.3 : false;

  return (
    <div className={`@container relative w-full select-none ${className}`} {...props}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden="true">
        <path d={path} fill="var(--muted-foreground)" fillOpacity={0.4} />
        {live.map((p) => (
          <g key={p.id}>
            <Glow at={p} afterglow={afterglow} reduced={reduced} />
            {p.from && <Route from={p.from} to={p} reduced={reduced} />}
            <Ripple at={p} reduced={reduced} />
          </g>
        ))}
        {markers.map((m, i) => {
          const p = project(m);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={2.4} fill="var(--background)" stroke="var(--foreground)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <circle cx={p.x} cy={p.y} r={1} fill="var(--foreground)" />
            </g>
          );
        })}
      </svg>

      {/* One card that follows the newest ping. */}
      {showLabel && spot && newest && (newest.label || newest.detail) && (
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{
            left: `${(spot.x / W) * 100}%`,
            top: `${(spot.y / H) * 100}%`,
            transition: reduced ? "none" : `left 620ms ${EASE}, top 620ms ${EASE}`,
          }}
        >
          <div
            className="absolute w-max rounded-[10px] border border-border bg-popover px-2 py-1 leading-tight @min-[420px]:px-2.5 @min-[420px]:py-1.5"
            style={{
              left: right ? undefined : 10,
              right: right ? 10 : undefined,
              top: below ? 10 : -8,
              transform: below ? "none" : "translateY(-100%)",
            }}
          >
            {newest.label && (
              <p className="text-[11px] font-medium text-foreground @min-[420px]:text-[11.5px]">
                <TextMorph>{newest.label}</TextMorph>
              </p>
            )}
            {newest.detail && (
              <p className="mt-0.5 text-[10.5px] text-muted-foreground @min-[420px]:text-[11px]">
                <TextMorph>{newest.detail}</TextMorph>
              </p>
            )}
          </div>
        </div>
      )}
      <p className="sr-only" role="status">
        {newest ? [newest.label, newest.detail].filter(Boolean).join(", ") : ""}
      </p>
    </div>
  );
}
