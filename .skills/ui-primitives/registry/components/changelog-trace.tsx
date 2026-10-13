// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Changelog trace (changelog-trace)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * CHANGELOG TRACE: what shipped, routed like a circuit
 *
 *   read      the line is a trace: straight through each
 *             release, stepped aside in between. A bead runs
 *             down it as you scroll, a beat behind the page,
 *             following every bend, and fills each dot it reaches
 *   arrive    entries rise out of a light blur the first time
 *             they come into view
 *   filter    All, New, Improved, Fixed: the pill is thrown to
 *             the choice, entries that don't match fold away,
 *             the trace re-routes as they close and the count
 *             rolls
 *   older     "Show 3 older" folds the rest open and morphs to
 *             "Show fewer"
 *
 * Every entry has an anchor, so a release can be linked to.
 * ───────────────────────────────────────────────────────── */

export interface ChangelogEntry {
  id: string;
  date: string | Date;
  title: string;
  version?: string;
  /** e.g. ["new"], ["improved", "fixed"]. */
  tags?: string[];
  body?: React.ReactNode;
  /** An image or video under the text. */
  media?: React.ReactNode;
}

export interface ChangelogTraceProps extends React.HTMLAttributes<HTMLDivElement> {
  entries: ChangelogEntry[];
  /** How many show before "Show older". */
  initialCount?: number;
  /** Filter chips, by tag; defaults to the tags in the entries. */
  filters?: { tag: string; label: string }[];
  locales?: string | string[];
}

type Point = { x: number; y: number };
type Route = { xs: number[]; ys: number[]; ls: number[]; total: number };

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const TAG_LABEL: Record<string, string> = { new: "New", improved: "Improved", fixed: "Fixed" };
const TAG_TONE: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  improved: "bg-muted text-foreground/80",
  fixed: "bg-muted text-muted-foreground",
};
const STEP = 14; // how far the trace steps aside between releases
const CLEAR = 24; // straight run either side of a dot
const CORNER = 8; // how much of each bend is rounded
const LAG = 120; // how far the bead trails the page, in ms

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** The bends: straight through each stop, stepped aside between. A step shrinks with its gap, so a release folding away flattens it smoothly. */
function corners(x: number, stops: number[]): Point[] {
  const points: Point[] = [{ x, y: stops[0] }];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const step = Math.min(STEP, Math.max(0, (b - a - 2 * CLEAR) / 3));
    if (step < 0.5) continue;
    points.push({ x, y: a + CLEAR }, { x: x - step, y: a + CLEAR + step }, { x: x - step, y: b - CLEAR - step }, { x, y: b - CLEAR });
  }
  points.push({ x, y: stops[stops.length - 1] });
  return points;
}

/** Rounds every bend into the path, and samples it so the bead can find any height along it without asking the DOM. */
function trace(points: Point[]): { d: string; route: Route } {
  const r = (n: number) => Math.round(n * 100) / 100;
  const xs = [points[0].x];
  const ys = [points[0].y];
  const ls = [0];
  const add = (x: number, y: number) => {
    const i = xs.length - 1;
    ls.push(ls[i] + Math.hypot(x - xs[i], y - ys[i]));
    xs.push(x);
    ys.push(y);
  };
  let d = `M${r(points[0].x)} ${r(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [prev, p, next] = [points[i - 1], points[i], points[i + 1]];
    const d1 = Math.hypot(p.x - prev.x, p.y - prev.y);
    const d2 = Math.hypot(next.x - p.x, next.y - p.y);
    const k = Math.min(CORNER, d1 / 2, d2 / 2);
    if (!(k > 0)) continue;
    const a = { x: p.x + ((prev.x - p.x) * k) / d1, y: p.y + ((prev.y - p.y) * k) / d1 };
    const b = { x: p.x + ((next.x - p.x) * k) / d2, y: p.y + ((next.y - p.y) * k) / d2 };
    d += `L${r(a.x)} ${r(a.y)}Q${r(p.x)} ${r(p.y)} ${r(b.x)} ${r(b.y)}`;
    add(a.x, a.y);
    for (let s = 1; s <= 6; s++) {
      const t = s / 6;
      const u = 1 - t;
      add(u * u * a.x + 2 * u * t * p.x + t * t * b.x, u * u * a.y + 2 * u * t * p.y + t * t * b.y);
    }
  }
  const last = points[points.length - 1];
  d += `L${r(last.x)} ${r(last.y)}`;
  add(last.x, last.y);
  return { d, route: { xs, ys, ls, total: ls[ls.length - 1] } };
}

/** Where the trace is at height y, and how far along it that is. The trace only ever runs downward. */
function at(route: Route, y: number) {
  const { xs, ys, ls } = route;
  const n = ys.length - 1;
  if (y <= ys[0]) return { x: xs[0], l: 0 };
  if (y >= ys[n]) return { x: xs[n], l: ls[n] };
  let lo = 0;
  let hi = n;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ys[mid] < y) lo = mid;
    else hi = mid;
  }
  const t = ys[hi] === ys[lo] ? 0 : (y - ys[lo]) / (ys[hi] - ys[lo]);
  return { x: xs[lo] + (xs[hi] - xs[lo]) * t, l: ls[lo] + (ls[hi] - ls[lo]) * t };
}

/** Position inside `root` from layout boxes, so transforms (an entry still arriving) don't throw it off. */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = el.offsetWidth / 2;
  let y = el.offsetHeight / 2;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/** Rises out of a light blur the first time it scrolls into view. */
function Arrive({ reduced, children }: { reduced: boolean; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [seen, setSeen] = React.useState(reduced);
  React.useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen]);
  return (
    <div
      ref={ref}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : "translateY(14px)",
        filter: seen ? "none" : "blur(4px)",
        transition: reduced ? "none" : `opacity 560ms ${EASE}, transform 700ms ${EASE}, filter 560ms ${EASE}`,
      }}
    >
      {children}
    </div>
  );
}

export function ChangelogTrace({ entries, initialCount = 4, filters: filtersProp, locales, className = "", ...props }: ChangelogTraceProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [filter, setFilter] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);
  const [lit, setLit] = React.useState<Set<string>>(() => new Set());
  const listRef = React.useRef<HTMLOListElement>(null);
  const baseRef = React.useRef<SVGPathElement>(null);
  const fillRef = React.useRef<SVGPathElement>(null);
  const beadRef = React.useRef<SVGCircleElement>(null);
  const dotRefs = React.useRef(new Map<string, HTMLSpanElement>());
  const reducedRef = React.useRef(reduced);
  const chipRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = React.useState({ left: 0, width: 0, ready: false });

  const filters = React.useMemo(() => {
    if (filtersProp) return filtersProp;
    const tags = Array.from(new Set(entries.flatMap((e) => e.tags ?? [])));
    return tags.map((tag) => ({ tag, label: TAG_LABEL[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1) }));
  }, [entries, filtersProp]);
  const chips = [{ tag: null as string | null, label: "All" }, ...filters];

  const matches = entries.filter((e) => !filter || e.tags?.includes(filter));
  const limit = showAll ? Infinity : initialCount;
  const shownIds = new Set(matches.slice(0, limit).map((e) => e.id));
  const hiddenOlder = Math.max(0, matches.length - initialCount);
  const idsKey = entries.map((e) => e.id).join("\n");

  React.useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  // The trace is laid out from where the dots sit, and drawn as far as the reader has got. Every frame writes straight to the SVG;
  // React only hears about it when a dot lights.
  React.useEffect(() => {
    const list = listRef.current;
    const base = baseRef.current;
    const fill = fillRef.current;
    const bead = beadRef.current;
    if (!list || !base || !fill || !bead) return;
    let route: Route | null = null;
    let dots: { id: string; y: number }[] = [];
    let drawn = NaN;
    let frame = 0;
    let last = 0;
    let visible = false;
    let litKey = "";

    const paint = () => {
      if (!route) return;
      const top = route.ys[0];
      const end = route.ys[route.ys.length - 1];
      const y = Math.min(end, Math.max(top, drawn));
      const { x, l } = at(route, y);
      fill.style.strokeDashoffset = String(route.total - l);
      bead.style.transform = `translate(${x}px, ${y}px)`;
      bead.style.opacity = y > top + 1 && y < end - 1 ? "1" : "0";
      const now = dots.filter((d) => d.y <= y + 0.5).map((d) => d.id);
      const key = now.join(" ");
      if (key !== litKey) {
        litKey = key;
        setLit(new Set(now));
      }
    };

    // One frame: aim at 55% down the screen, close part of the gap (all of it with reduced motion), draw.
    const tick = (now: number) => {
      frame = 0;
      if (!route) return;
      const top = route.ys[0];
      const end = route.ys[route.ys.length - 1];
      const target = Math.min(end, Math.max(top, window.innerHeight * 0.55 - list.getBoundingClientRect().top));
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      if (Number.isNaN(drawn)) drawn = top;
      drawn += (target - drawn) * (reducedRef.current ? 1 : 1 - Math.exp(-dt / LAG));
      if (Math.abs(target - drawn) < 0.25) drawn = target;
      paint();
      if (drawn !== target) frame = requestAnimationFrame(tick);
      else last = 0;
    };
    const run = () => {
      if (visible && !frame) frame = requestAnimationFrame(tick);
    };

    const ids = idsKey.split("\n");
    const layout = () => {
      // Folded releases at the end sit just below the list; hold them to its last line.
      const end = list.offsetHeight - 8;
      const found = ids.flatMap((key) => {
        const el = dotRefs.current.get(key);
        if (!el) return [];
        const { x, y } = offsetIn(el, list);
        return [{ id: key, x, y: Math.min(y, end) }];
      });
      if (!found.length) return;
      dots = found.map(({ id, y }) => ({ id, y }));
      const { d, route: next } = trace(corners(found[0].x, [...dots.map((dot) => dot.y), Math.max(end, dots[dots.length - 1].y)]));
      route = next;
      base.setAttribute("d", d);
      fill.setAttribute("d", d);
      fill.setAttribute("pathLength", String(next.total));
      fill.style.strokeDasharray = `${next.total} ${next.total}`;
      if (Number.isNaN(drawn)) fill.style.strokeDashoffset = String(next.total);
      else paint();
      run();
    };

    // Folding entries resize the list every frame they move, so the trace re-routes with them.
    const resize = new ResizeObserver(layout);
    resize.observe(list);
    list.querySelectorAll(":scope > li").forEach((li) => resize.observe(li));
    // Only listen while the timeline is on screen.
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      run();
    });
    seen.observe(list);
    window.addEventListener("scroll", run, { passive: true, capture: true });
    window.addEventListener("resize", run);
    return () => {
      resize.disconnect();
      seen.disconnect();
      window.removeEventListener("scroll", run, { capture: true });
      window.removeEventListener("resize", run);
      cancelAnimationFrame(frame);
    };
  }, [idsKey]);

  React.useLayoutEffect(() => {
    const el = chipRefs.current[chips.findIndex((c) => c.tag === filter)];
    if (!el) return;
    setPill((p) => (p.left === el.offsetLeft && p.width === el.offsetWidth ? p : { left: el.offsetLeft, width: el.offsetWidth, ready: p.width > 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, filters.length]);

  const dateText = (d: string | Date) => new Date(d).toLocaleDateString(locales ?? "en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fold = (open: boolean): React.CSSProperties => ({
    gridTemplateRows: open ? "1fr" : "0fr",
    opacity: open ? 1 : 0,
    transition: reduced ? "none" : `grid-template-rows 480ms ${EASE}, opacity ${open ? "380ms" : "160ms"} ${EASE}`,
  });

  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Show" className="relative inline-flex rounded-full bg-muted p-0.5">
          <span
            aria-hidden="true"
            className="absolute inset-y-0.5 left-0 rounded-full bg-background shadow-[0_0_0_1px_var(--border)]"
            style={{ width: pill.width, transform: `translateX(${pill.left}px)`, transition: pill.ready && !reduced ? `transform 460ms ${THROW}, width 380ms ${EASE}` : "none" }}
          />
          {chips.map((c, i) => {
            const selected = c.tag === filter;
            return (
              <button
                key={c.label}
                ref={(el) => {
                  chipRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setFilter(c.tag)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const next = (i + (e.key === "ArrowRight" ? 1 : -1) + chips.length) % chips.length;
                  setFilter(chips[next].tag);
                  chipRefs.current[next]?.focus();
                }}
                className={`cursor-pointer relative h-8 rounded-full px-3.5 text-[12.5px] font-medium transition-colors duration-300 ${FOCUS} ${selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <p className="flex items-baseline gap-[0.3em] text-[12.5px] tabular-nums text-muted-foreground">
          <NumberRoll value={matches.length} duration={600} />
          <TextMorph>{matches.length === 1 ? "update" : "updates"}</TextMorph>
        </p>
      </div>

      <div className="relative">
        {/* The trace, the part of it you've read, and the bead at its tip. */}
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <path ref={baseRef} fill="none" strokeWidth={1} className="stroke-border" />
          <path ref={fillRef} fill="none" strokeWidth={1} strokeLinecap="round" className="stroke-foreground/70" />
          <circle ref={beadRef} r={2.5} className="fill-foreground" style={{ opacity: 0, transition: reduced ? "none" : "opacity 200ms" }} />
        </svg>

        <ol ref={listRef} className="relative">
          {entries.map((e) => {
            const shown = shownIds.has(e.id);
            const on = lit.has(e.id);
            return (
              <li key={e.id} id={e.id} inert={!shown} aria-hidden={!shown || undefined} className="grid scroll-mt-24" style={fold(shown)}>
                <div className="min-h-0 overflow-hidden">
                  <Arrive reduced={reduced}>
                    <article className="grid grid-cols-[11px_1fr] gap-x-5 pb-12 pl-4 sm:grid-cols-[104px_11px_1fr] sm:gap-x-6 sm:pl-0">
                      <div className="hidden pt-0.5 text-right sm:block">
                        <time dateTime={new Date(e.date).toISOString()} className="text-[12.5px] text-muted-foreground">
                          {dateText(e.date)}
                        </time>
                        {e.version && <p className="mt-1 font-mono text-[11.5px] text-muted-foreground/80">{e.version}</p>}
                      </div>
                      {/* The dot fills when the bead reaches it. */}
                      <span
                        ref={(el) => {
                          if (el) dotRefs.current.set(e.id, el);
                          else dotRefs.current.delete(e.id);
                        }}
                        aria-hidden="true"
                        className="relative mt-[5px] flex size-[11px] items-center justify-center rounded-full bg-background shadow-[inset_0_0_0_1px_var(--border)] transition-[box-shadow] duration-500"
                        style={{ boxShadow: on ? "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 70%, transparent)" : undefined }}
                      >
                        <span
                          className="size-[5px] rounded-full bg-foreground/70"
                          style={{ transform: on ? "scale(1)" : "scale(0)", transition: reduced ? "none" : `transform 420ms ${THROW}` }}
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2 sm:hidden">
                          <time dateTime={new Date(e.date).toISOString()} className="text-[12px] text-muted-foreground">
                            {dateText(e.date)}
                          </time>
                          {e.version && <span className="font-mono text-[11px] text-muted-foreground/80">{e.version}</span>}
                        </div>
                        {e.tags && e.tags.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {e.tags.map((t) => (
                              <span key={t} className={`rounded-full px-2 py-px text-[11px] font-medium ${TAG_TONE[t] ?? "bg-muted text-foreground/80"}`}>
                                {TAG_LABEL[t] ?? t}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="text-[17px] font-medium leading-snug tracking-[-0.015em] text-foreground">
                          <a href={`#${e.id}`} className={`rounded hover:underline hover:decoration-border hover:underline-offset-4 ${FOCUS}`}>
                            {e.title}
                          </a>
                        </h3>
                        {e.body && <div className="mt-2 text-[14px] leading-relaxed text-muted-foreground [&_li]:mt-1 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">{e.body}</div>}
                        {e.media && <div className="mt-4 overflow-hidden rounded-[16px] border border-border">{e.media}</div>}
                      </div>
                    </article>
                  </Arrive>
                </div>
              </li>
            );
          })}
        </ol>

        {hiddenOlder > 0 && (
          <div className="pl-[47px] sm:pl-[163px]">
            <button
              type="button"
              aria-expanded={showAll}
              onClick={() => setShowAll((s) => !s)}
              className={`cursor-pointer inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-accent ${FOCUS}`}
            >
              <TextMorph>{showAll ? "Show fewer" : `Show ${hiddenOlder} older`}</TextMorph>
            </button>
          </div>
        )}
      </div>
      <p id={`${id}-status`} role="status" className="sr-only">
        {`${matches.length} ${matches.length === 1 ? "update" : "updates"}`}
      </p>
    </div>
  );
}
