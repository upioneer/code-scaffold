// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Sortable list (sortable-list)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";

/* ─────────────────────────────────────────────────────────
 * SORTABLE LIST: reorder by hand, and watch everything move
 *
 *   lift      press the grip and the row lifts: a darker Tactile,
 *             a touch larger, above the rest; no shadow
 *   drag      it follows your finger exactly; the rows it passes
 *             slide out of its way, one slot at a time
 *   drop      it settles into its slot with a small overshoot,
 *             every rank number rolls to its new place, and the
 *             row you moved says how far it went ("↑ 2") for a
 *             moment
 *   sort      optional presets ("Votes", "Effort") re-sort the
 *             whole list and every row glides to where it belongs;
 *             the highlight slides to the preset, and fades when
 *             you've made your own order
 *   keys      Space on a grip picks the row up, arrows move it,
 *             Space drops it, Escape puts it back; every step is
 *             announced
 * ───────────────────────────────────────────────────────── */

export interface SortableListSort<T> {
  label: string;
  compare: (a: T, b: T) => number;
}

export interface SortableListProps<T extends { id: string }> extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, state: { index: number; lifted: boolean }) => React.ReactNode;
  /** What to call an item when announcing moves; defaults to its id. */
  getLabel?: (item: T) => string;
  /** Ready-made orders shown as a segmented control above the list. */
  sorts?: SortableListSort<T>[];
  /** Accessible name for the list. */
  label?: string;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const GAP = 6;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

const move = <T,>(list: T[], from: number, to: number) => {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

function Grip() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true" className="fill-current">
      {[2, 7, 12].map((y) => (
        <React.Fragment key={y}>
          <circle cx="2.5" cy={y} r="1.25" />
          <circle cx="7.5" cy={y} r="1.25" />
        </React.Fragment>
      ))}
    </svg>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  getLabel = (item) => item.id,
  sorts,
  label = "Reorderable list",
  className = "",
  ...props
}: SortableListProps<T>) {
  const reduced = useReducedMotion();
  const uid = React.useId();
  const listRef = React.useRef<HTMLUListElement>(null);
  const rows = React.useRef(new Map<string, HTMLLIElement>());
  const handles = React.useRef(new Map<string, HTMLButtonElement>());
  const offsets = React.useRef(new Map<string, number>());
  const pending = React.useRef<{ first: Map<string, number>; settle?: string; focus?: string } | null>(null);
  const drag = React.useRef<{ id: string; from: number; to: number; startY: number; tops: number[]; heights: number[] } | null>(null);
  const [lifted, setLifted] = React.useState<string | null>(null);
  const [keyLift, setKeyLift] = React.useState<{ id: string; from: number } | null>(null);
  const [moved, setMoved] = React.useState<{ id: string; by: number; key: number } | null>(null);
  const [announce, setAnnounce] = React.useState("");

  // Where every row is on screen right now (its slot plus any shift), for gliding from there.
  const snapshot = () => {
    const first = new Map<string, number>();
    rows.current.forEach((el, id) => first.set(id, el.offsetTop + (offsets.current.get(id) ?? 0)));
    return first;
  };

  const shift = (id: string, y: number, glide: boolean) => {
    const el = rows.current.get(id);
    if (!el) return;
    offsets.current.set(id, y);
    el.style.transition = glide && !reduced ? `transform 220ms ${EASE}` : "none";
    el.style.transform = y ? `translateY(${y}px)` : "";
  };

  // After any new order: every row glides from where it was to its new slot.
  const play = React.useCallback(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    rows.current.forEach((el, id) => {
      el.style.transition = "none";
      el.style.transform = "";
      offsets.current.set(id, 0);
      const from = p.first.get(id);
      if (from === undefined || reduced) return;
      const delta = from - el.offsetTop;
      if (Math.abs(delta) < 0.5) return;
      el.animate([{ transform: `translateY(${delta}px)` }, { transform: "none" }], {
        duration: id === p.settle ? 380 : 420,
        easing: id === p.settle ? THROW : EASE,
      });
    });
    if (p.focus) handles.current.get(p.focus)?.focus({ preventScroll: true });
  }, [reduced]);

  React.useLayoutEffect(() => {
    play();
  }, [items, play]);

  const commit = (next: T[], settle?: string, focus?: string) => {
    pending.current = { first: snapshot(), settle, focus };
    onReorder(next);
    // If the order didn't change after all, still put everything back.
    requestAnimationFrame(() => requestAnimationFrame(play));
  };

  const showMoved = (id: string, by: number) => {
    if (!by) return;
    const key = Date.now();
    setMoved({ id, by, key });
    window.setTimeout(() => setMoved((m) => (m?.key === key ? null : m)), 1800);
  };

  // Pointer dragging: transforms only until the drop.
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.button !== 0 || keyLift) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const from = items.findIndex((it) => it.id === id);
    const els = items.map((it) => rows.current.get(it.id)!);
    drag.current = { id, from, to: from, startY: e.clientY, tops: els.map((el) => el.offsetTop), heights: els.map((el) => el.offsetHeight) };
    setLifted(id);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    const center = d.tops[d.from] + d.heights[d.from] / 2 + dy;
    let to = 0;
    items.forEach((_, i) => {
      if (i !== d.from && center > d.tops[i] + d.heights[i] / 2) to++;
    });
    d.to = to;
    shift(d.id, dy, false);
    const step = d.heights[d.from] + GAP;
    items.forEach((it, i) => {
      if (i === d.from) return;
      const y = d.from < to && i > d.from && i <= to ? -step : d.from > to && i < d.from && i >= to ? step : 0;
      if ((offsets.current.get(it.id) ?? 0) !== y) shift(it.id, y, true);
    });
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setLifted(null);
    const item = items[d.from];
    commit(move(items, d.from, d.to), d.id);
    showMoved(d.id, d.from - d.to);
    if (d.to !== d.from) setAnnounce(`${getLabel(item)} moved to position ${d.to + 1} of ${items.length}.`);
  };

  // Keyboard: Space picks up and drops, arrows move one place, Escape puts it back.
  const onKeyDown = (e: React.KeyboardEvent, id: string) => {
    const index = items.findIndex((it) => it.id === id);
    const item = items[index];
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (keyLift?.id === id) {
        setKeyLift(null);
        setLifted(null);
        showMoved(id, keyLift.from - index);
        setAnnounce(`${getLabel(item)} dropped at position ${index + 1} of ${items.length}.`);
      } else {
        setKeyLift({ id, from: index });
        setLifted(id);
        setAnnounce(`${getLabel(item)} picked up, position ${index + 1} of ${items.length}. Arrow keys move it, Space drops it, Escape cancels.`);
      }
      return;
    }
    if (keyLift?.id !== id) return;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const to = Math.max(0, Math.min(items.length - 1, index + (e.key === "ArrowUp" ? -1 : 1)));
      if (to === index) return;
      commit(move(items, index, to), id, id);
      setAnnounce(`${getLabel(item)}, position ${to + 1} of ${items.length}.`);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      commit(move(items, index, keyLift.from), id, id);
      setKeyLift(null);
      setLifted(null);
      setAnnounce(`${getLabel(item)} put back at position ${keyLift.from + 1}.`);
    }
  };

  // Presets: which one the current order matches, and a highlight that slides to it.
  const sortRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const active = sorts ? sorts.findIndex((s) => items.every((it, i) => i === 0 || s.compare(items[i - 1], it) <= 0)) : -1;
  const [mark, setMark] = React.useState({ x: 0, w: 0, on: false, slide: false });
  React.useLayoutEffect(() => {
    const el = sortRefs.current[active];
    setMark((m) => (el ? { x: el.offsetLeft, w: el.offsetWidth, on: true, slide: m.on } : { ...m, on: false, slide: false }));
  }, [active]);

  return (
    <div className={`w-full ${className}`} {...props}>
      {sorts && sorts.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div role="group" aria-label="Sort by" className="relative flex rounded-full border border-border p-0.5">
            <span
              aria-hidden="true"
              className="absolute bottom-0.5 left-0 top-0.5 rounded-full bg-accent"
              style={{
                transform: `translateX(${mark.x}px)`,
                width: mark.w,
                opacity: mark.on ? 1 : 0,
                transition: reduced ? "none" : `${mark.slide ? `transform 360ms ${EASE}, width 360ms ${EASE}, ` : ""}opacity 220ms ${EASE}`,
              }}
            />
            {sorts.map((s, i) => (
              <button
                key={s.label}
                ref={(el) => {
                  sortRefs.current[i] = el;
                }}
                type="button"
                aria-pressed={i === active}
                onClick={() => {
                  const next = items.slice().sort(s.compare);
                  commit(next);
                  setAnnounce(`Sorted by ${s.label}.`);
                }}
                className={`cursor-pointer relative h-7 rounded-full px-3 text-[12.5px] transition-colors duration-200 ${FOCUS} ${
                  i === active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span
            className="text-[12px] text-muted-foreground"
            style={{ opacity: active === -1 ? 1 : 0, transition: reduced ? "none" : `opacity 220ms ${EASE}` }}
            aria-hidden={active !== -1}
          >
            Your order
          </span>
        </div>
      )}

      <ul ref={listRef} aria-label={label} className="relative flex flex-col" style={{ gap: GAP }} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        {items.map((item, index) => {
          const up = lifted === item.id;
          const badge = moved?.id === item.id ? moved : null;
          return (
            <li
              key={item.id}
              ref={(el) => {
                if (el) rows.current.set(item.id, el);
                else rows.current.delete(item.id);
              }}
              className="relative"
              style={{ zIndex: up ? 2 : undefined }}
            >
              <div
                className="relative flex min-h-12 items-center gap-2.5 rounded-[12px] border bg-card py-2 pl-1.5 pr-3"
                style={{
                  borderColor: up ? "color-mix(in oklab, var(--foreground) 28%, transparent)" : "var(--border)",
                  transform: up ? "scale(1.015)" : "none",
                  transition: reduced ? "none" : `transform 200ms ${EASE}, border-color 200ms`,
                }}
              >
                <button
                  ref={(el) => {
                    if (el) handles.current.set(item.id, el);
                    else handles.current.delete(item.id);
                  }}
                  type="button"
                  aria-label={`Reorder ${getLabel(item)}`}
                  aria-describedby={`${uid}-how`}
                  aria-pressed={keyLift?.id === item.id}
                  onPointerDown={(e) => onPointerDown(e, item.id)}
                  onKeyDown={(e) => onKeyDown(e, item.id)}
                  onBlur={() => {
                    if (keyLift?.id === item.id && !pending.current) {
                      setKeyLift(null);
                      setLifted(null);
                    }
                  }}
                  className={`flex h-8 w-6 shrink-0 touch-none items-center justify-center rounded-[8px] text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground ${
                    up ? "cursor-grabbing bg-accent text-foreground" : "cursor-grab"
                  } ${FOCUS}`}
                >
                  <Grip />
                </button>
                <span className="w-5 shrink-0 text-[12px] tabular-nums text-muted-foreground" aria-hidden="true">
                  <NumberRoll value={index + 1} duration={500} />
                </span>
                <div className="min-w-0 flex-1">{renderItem(item, { index, lifted: up })}</div>
                {/* How far it moved, sitting on the row's top edge so nothing shifts. */}
                {badge && (
                  <span
                    key={badge.key}
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-2.5 right-3 rounded-full border border-border bg-card px-1.5 text-[11px] font-medium leading-[18px] tabular-nums text-foreground"
                    ref={(el) => {
                      if (!el || reduced || el.dataset.in) return;
                      el.dataset.in = "1";
                      el.animate(
                        [
                          { opacity: 0, filter: "blur(4px)", transform: "translateY(4px)" },
                          { opacity: 1, filter: "blur(0px)", transform: "none", offset: 0.15 },
                          { opacity: 1, filter: "blur(0px)", transform: "none", offset: 0.8 },
                          { opacity: 0, filter: "blur(4px)", transform: "translateY(-4px)" },
                        ],
                        { duration: 1800, easing: EASE, fill: "forwards" },
                      );
                    }}
                  >
                    {badge.by > 0 ? "↑" : "↓"} {Math.abs(badge.by)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p id={`${uid}-how`} className="sr-only">
        Press Space to pick up, arrow keys to move, Space to drop, Escape to cancel.
      </p>
      <p className="sr-only" role="status">
        {announce}
      </p>
    </div>
  );
}
