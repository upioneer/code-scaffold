// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Changelog scrubber (changelog-scrubber)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * CHANGELOG SCRUBBER: release history on a ruler you scrub
 *
 *   scrub     drag the playhead along a ruler of days; the ticks
 *             swell under it like a lens and the card changes to
 *             whichever release is nearest
 *   settle    let go, click, tap or press an arrow key and the
 *             playhead is thrown onto a release
 *   change    the version riding the playhead, the date and the
 *             tag morph, the count rolls, and the release slides
 *             in from the side the playhead moved toward while
 *             the card eases to its new height
 *   step      the arrows beside the count step one release; on
 *             a phone, swipe the card: the release follows your
 *             finger and springs back at either end
 *   play      plays the history from the first release to the
 *             latest, at the pace it actually shipped; pause
 *             holds it wherever it is
 *
 * The ruler is a slider: arrows step between releases, Home and
 * End jump to the first and the latest. Nothing listens to the
 * page's scroll; frames run only while the playhead moves.
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

export interface ChangelogScrubberProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Newest first, as in a timeline; the ruler runs from the oldest on the left to the newest on the right. */
  entries: ChangelogEntry[];
  /** The release on show, by id. Starts on the newest. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** How long play takes from the first release to the latest, in ms. Defaults to 1.2s a release. */
  playDuration?: number;
  locales?: string | string[];
}

type Leaving = { index: number; dir: number; key: number; from: number };

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const MORPH = 460;
const DAY = 86_400_000;
const LENS = 7; // how far the lens reaches either side of the playhead, in % of the ruler
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const TAG_LABEL: Record<string, string> = { new: "New", improved: "Improved", fixed: "Fixed" };
const TAG_TONE: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  improved: "bg-muted text-foreground/80",
  fixed: "bg-muted text-muted-foreground",
};

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** A CSS cubic-bezier solved in JS, so the playhead's tweens run on the same curves as everything else. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const curve = (t: number, p1: number, p2: number) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  const slope = (t: number, p1: number, p2: number) => 3 * (1 - t) * (1 - t) * p1 + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (1 - p2);
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(t, x1, x2);
      if (Math.abs(s) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - (curve(t, x1, x2) - x) / s));
    }
    return curve(t, y1, y2);
  };
}
const THROWN = bezier(0.34, 1.36, 0.64, 1);
const LINEAR = (t: number) => t;

/** A tick at p% that swells as the playhead (--x, set on the ruler) comes near. Pure CSS, so moving the playhead is one style write. */
const lens = (p: number, gain: number) =>
  ({
    left: `${p}%`,
    "--p": String(p),
    "--f": `max(0, 1 - max(var(--x) - var(--p), var(--p) - var(--x)) / ${LENS})`,
    transform: `scaleY(calc(1 + ${gain} * var(--f) * var(--f)))`,
  }) as React.CSSProperties;

const swap = (on: boolean, reduced: boolean): React.CSSProperties => ({
  opacity: on ? 1 : 0,
  transform: on ? "scale(1)" : "scale(0.6)",
  filter: on ? "blur(0px)" : "blur(3px)",
  transition: reduced ? "none" : `opacity 240ms ${EASE}, transform 360ms ${EASE}, filter 240ms ${EASE}`,
});

/** One release in the card; it comes in from the side the playhead moved toward and leaves the other way (from where a swipe let it go). */
function Pane({
  children,
  dir,
  leaving,
  reduced,
  from = 0,
  paneRef,
}: {
  children: React.ReactNode;
  dir: number;
  leaving: boolean;
  reduced: boolean;
  from?: number;
  paneRef?: React.Ref<HTMLDivElement>;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced || dir === 0) return;
    const shift = 24 * dir;
    const animation = leaving
      ? el.animate(
          [
            { opacity: 1, filter: "blur(0px)", transform: `translateX(${from}px)` },
            { opacity: 0, filter: "blur(6px)", transform: `translateX(${from - shift}px)` },
          ],
          { duration: MORPH * 0.6, easing: EASE, fill: "forwards" }
        )
      : el.animate(
          [
            { opacity: 0, filter: "blur(6px)", transform: `translateX(${shift}px)` },
            { opacity: 1, filter: "blur(0px)", transform: "none" },
          ],
          { duration: MORPH, easing: EASE, delay: 60, fill: "backwards" }
        );
    return () => animation.cancel();
  }, [dir, leaving, reduced, from]);
  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (typeof paneRef === "function") paneRef(el);
        else if (paneRef) (paneRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      inert={leaving}
      aria-hidden={leaving || undefined}
      className={leaving ? "absolute inset-x-0 top-0" : "relative"}
    >
      {children}
    </div>
  );
}

/** Older / newer. At either end it fades and does nothing, but stays focusable so focus never drops. */
function Step({ dir, disabled, onStep }: { dir: -1 | 1; disabled: boolean; onStep: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir < 0 ? "Older release" : "Newer release"}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && onStep()}
      className={`flex size-7 items-center justify-center rounded-full text-foreground transition-[background-color,opacity] duration-300 ${FOCUS} ${disabled ? "cursor-default opacity-30" : "hover:bg-accent"}`}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5">
        <path d={dir < 0 ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"} />
      </svg>
    </button>
  );
}

export function ChangelogScrubber({ entries, value, defaultValue, onValueChange, playDuration, locales, className = "", ...props }: ChangelogScrubberProps) {
  const reduced = useReducedMotion();

  // The ruler: releases oldest to newest, a little room either side, a tick a day (a week, then four, on long histories) and the months.
  const model = React.useMemo(() => {
    const releases = entries.map((entry) => ({ entry, t: new Date(entry.date).getTime() })).sort((a, b) => a.t - b.t);
    const first = releases[0]?.t ?? 0;
    const last = releases[releases.length - 1]?.t ?? first;
    const span = Math.max(14 * DAY, last - first);
    const pad = Math.max(3 * DAY, span * 0.08);
    const start = first - pad;
    const end = last + pad;
    const pos = (t: number) => ((t - start) / (end - start)) * 100;
    const days = (end - start) / DAY;
    const every = days <= 120 ? 1 : days <= 840 ? 7 : 28;
    const ticks: number[] = [];
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() < start) d.setDate(d.getDate() + 1);
    while (every > 1 && d.getDay() !== 1) d.setDate(d.getDate() + 1);
    for (; d.getTime() <= end; d.setDate(d.getDate() + every)) ticks.push(pos(d.getTime()));
    const label = (m: Date) => m.toLocaleDateString(locales ?? "en-GB", m.getMonth() === 0 ? { month: "short", year: "numeric" } : { month: "short" });
    const months: { p: number; label: string; edge?: boolean }[] = [];
    const m = new Date(start);
    m.setHours(0, 0, 0, 0);
    m.setDate(1);
    const opening = label(m);
    for (m.setMonth(m.getMonth() + 1); m.getTime() <= end; m.setMonth(m.getMonth() + 1)) months.push({ p: pos(m.getTime()), label: label(m) });
    // The month the ruler opens in gets a label too, when there's room before the next.
    if (!months.length || months[0].p > 14) months.unshift({ p: 0, label: opening, edge: true });
    const keep = Math.ceil(months.length / 8);
    return { releases, at: releases.map((r) => pos(r.t)), ticks, months: months.filter((_, i) => i % keep === 0) };
  }, [entries, locales]);

  const n = model.releases.length;
  const [own, setOwn] = React.useState(defaultValue ?? model.releases[n - 1]?.entry.id);
  const active = value ?? own;
  const found = model.releases.findIndex((r) => r.entry.id === active);
  const index = found === -1 ? n - 1 : found;
  const current = model.releases[index]?.entry;

  const [playing, setPlaying] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [height, setHeight] = React.useState<number | null>(null);
  const [initialX] = React.useState(() => String(model.at[index] ?? 0));
  const rulerRef = React.useRef<HTMLDivElement>(null);
  const ghostRef = React.useRef<HTMLSpanElement>(null);
  const paneRef = React.useRef<HTMLDivElement | null>(null);
  const xRef = React.useRef(model.at[index] ?? 0);
  const indexRef = React.useRef(index);
  const tweenRef = React.useRef(0);
  const playingRef = React.useRef(false);
  const dragRef = React.useRef<{ startX: number; moved: boolean } | null>(null);
  const reducedRef = React.useRef(reduced);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const swipeRef = React.useRef<{ id: number; x: number; y: number; t: number; dx: number; axis: "x" | "y" | null } | null>(null);
  const [carry, setCarry] = React.useState(0);

  // Which release left, and which way: kept from the render before, so a controlled value slides the same way.
  const [prev, setPrev] = React.useState({ index, n: 0, dir: 0 });
  const [leaving, setLeaving] = React.useState<Leaving[]>([]);
  if (prev.index !== index) {
    const dir = Math.sign(index - prev.index);
    setPrev({ index, n: prev.n + 1, dir });
    setLeaving((l) => [...l.slice(-1), { index: prev.index, dir, key: prev.n, from: carry }]);
    if (carry) setCarry(0);
  }

  React.useEffect(() => {
    indexRef.current = index;
    reducedRef.current = reduced;
  });

  React.useEffect(() => {
    if (!leaving.length) return;
    const timer = window.setTimeout(() => setLeaving([]), MORPH);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // The card takes the height of the release it's showing.
  React.useLayoutEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const measure = () => setHeight((h) => (h === pane.offsetHeight ? h : pane.offsetHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    return () => observer.disconnect();
  }, [index]);

  React.useEffect(() => () => cancelAnimationFrame(tweenRef.current), []);

  const paint = (x: number) => {
    xRef.current = x;
    rulerRef.current?.style.setProperty("--x", x.toFixed(3));
  };

  /** Moves the playhead; every frame is one custom property on the ruler. */
  const tween = (to: number, duration: number, ease: (t: number) => number, onFrame: (x: number) => void = paint, onEnd?: () => void) => {
    cancelAnimationFrame(tweenRef.current);
    const from = xRef.current;
    const start = performance.now();
    const step = (now: number) => {
      const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
      onFrame(from + (to - from) * ease(t));
      if (t < 1) tweenRef.current = requestAnimationFrame(step);
      else {
        tweenRef.current = 0;
        onEnd?.();
      }
    };
    if (duration > 0) tweenRef.current = requestAnimationFrame(step);
    else step(start);
  };
  const settle = (to: number) => tween(to, reducedRef.current ? 0 : 520, THROWN);

  const choose = (i: number) => {
    const id = model.releases[i]?.entry.id;
    if (!id || i === indexRef.current) return;
    indexRef.current = i;
    if (value === undefined) setOwn(id);
    onValueChange?.(id);
  };
  const nearest = (x: number) => model.at.reduce((best, p, i) => (Math.abs(p - x) < Math.abs(model.at[best] - x) ? i : best), 0);
  const lastPassed = (x: number) => model.at.reduce((found, p, i) => (p <= x + 1e-6 ? i : found), 0);

  // A new release from outside the ruler (keys, a click, a controlled value): throw the playhead onto it.
  React.useEffect(() => {
    if (dragRef.current?.moved || playingRef.current) return;
    const to = model.at[index];
    if (to !== undefined && Math.abs(xRef.current - to) > 0.01) settle(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, model]);

  // A link to a release (#its-id) opens on it.
  React.useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (value === undefined && hash && entries.some((e) => e.id === hash)) setOwn(hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pause = () => {
    if (!playingRef.current) return;
    cancelAnimationFrame(tweenRef.current);
    tweenRef.current = 0;
    playingRef.current = false;
    setPlaying(false);
  };

  // Play runs at the pace the releases shipped: the playhead moves at one speed and the card changes as it passes each one.
  // With reduced motion the playhead steps from release to release instead of gliding.
  const play = () => {
    if (playingRef.current) return pause();
    const { at } = model;
    if (at.length < 2) return;
    const first = at[0];
    const last = at[at.length - 1];
    if (xRef.current >= last - 0.01) {
      paint(first);
      choose(0);
    }
    playingRef.current = true;
    setPlaying(true);
    const total = playDuration ?? at.length * 1200;
    tween(
      last,
      (total * (last - xRef.current)) / (last - first),
      LINEAR,
      (x) => {
        const i = lastPassed(x);
        xRef.current = x;
        rulerRef.current?.style.setProperty("--x", (reducedRef.current ? at[i] : x).toFixed(3));
        choose(i);
      },
      () => {
        playingRef.current = false;
        setPlaying(false);
      }
    );
  };

  const xAt = (clientX: number) => {
    const r = rulerRef.current?.getBoundingClientRect();
    return r ? Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)) : xRef.current;
  };
  const ghost = (x: number | null) => {
    if (x !== null) rulerRef.current?.style.setProperty("--h", x.toFixed(3));
    if (ghostRef.current) ghostRef.current.style.opacity = x === null ? "0" : "1";
  };
  const release = (clientX: number, up: boolean) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (drag.moved) {
      setDragging(false);
      settle(model.at[nearest(xRef.current)]);
      return;
    }
    if (!up) return;
    const i = nearest(xAt(clientX));
    if (i === indexRef.current) settle(model.at[i]);
    else choose(i);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowLeft: index - 1, ArrowDown: index - 1, ArrowRight: index + 1, ArrowUp: index + 1, Home: 0, End: n - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    pause();
    const i = Math.min(n - 1, Math.max(0, moves[e.key]));
    if (i === index) settle(model.at[i]);
    else choose(i);
  };

  const step = (d: number) => {
    pause();
    const i = Math.min(n - 1, Math.max(0, indexRef.current + d));
    if (i !== indexRef.current) choose(i);
  };

  // Swiping the card (touch and pen; a mouse selects text): the release follows the finger, a swipe past 56px or a quick
  // flick moves one release and the old one carries on from where it was let go; anything less springs back.
  const onSwipeStart = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" || (e.target as HTMLElement).closest("button, a")) return;
    swipeRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, axis: null };
  };
  const onSwipeMove = (e: React.PointerEvent) => {
    const s = swipeRef.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (s.axis === "y") {
        swipeRef.current = null;
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      pause();
    }
    const edge = (dx < 0 && indexRef.current === n - 1) || (dx > 0 && indexRef.current === 0);
    s.dx = dx * (edge ? 0.3 : 0.8);
    const stage = stageRef.current;
    if (stage && !reducedRef.current) {
      stage.style.transition = "none";
      stage.style.transform = `translateX(${s.dx}px)`;
    }
  };
  const onSwipeEnd = (e: React.PointerEvent, commit: boolean) => {
    const s = swipeRef.current;
    if (!s || s.id !== e.pointerId) return;
    swipeRef.current = null;
    if (s.axis !== "x") return;
    const stage = stageRef.current;
    const raw = e.clientX - s.x;
    const flick = performance.now() - s.t < 260 && Math.abs(raw) > 24;
    const d = commit && (Math.abs(raw) > 56 || flick) ? (raw < 0 ? 1 : -1) : 0;
    const i = Math.min(n - 1, Math.max(0, indexRef.current + d));
    if (d && i !== indexRef.current) {
      if (stage) {
        stage.style.transition = "none";
        stage.style.transform = "";
      }
      setCarry(reducedRef.current ? 0 : s.dx);
      step(d);
    } else if (stage) {
      stage.style.transition = `transform 420ms ${THROW}`;
      stage.style.transform = "";
    }
  };

  if (!current) return null;

  const dateText = (d: string | Date, short = false) =>
    new Date(d).toLocaleDateString(locales ?? "en-GB", short ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
  const tags = current.tags ?? [];
  const tagText = tags.map((t) => TAG_LABEL[t] ?? t).join(", ");

  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play the releases"}
          onClick={play}
          className={`cursor-pointer relative mt-5 flex size-8 shrink-0 items-center justify-center rounded-full text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-accent ${FOCUS}`}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="absolute size-3.5 translate-x-px" style={swap(!playing, reduced)}>
            <path d="M5 3.6v8.8a.6.6 0 0 0 .92.5l6.9-4.4a.6.6 0 0 0 0-1L5.92 3.1A.6.6 0 0 0 5 3.6Z" />
          </svg>
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="absolute size-3.5" style={swap(playing, reduced)}>
            <rect x="4" y="3" width="2.75" height="10" rx="0.8" />
            <rect x="9.25" y="3" width="2.75" height="10" rx="0.8" />
          </svg>
        </button>

        <div
          ref={rulerRef}
          role="slider"
          tabIndex={0}
          aria-label="Release"
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={index + 1}
          aria-valuetext={`${current.version ? `${current.version}, ` : ""}${current.title}, ${dateText(current.date)}`}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            pause();
            dragRef.current = { startX: e.clientX, moved: false };
          }}
          onPointerMove={(e) => {
            const drag = dragRef.current;
            if (!drag) {
              if (e.pointerType === "mouse") ghost(xAt(e.clientX));
              return;
            }
            if (!drag.moved) {
              if (Math.abs(e.clientX - drag.startX) < 4) return;
              drag.moved = true;
              setDragging(true);
              ghost(null);
            }
            cancelAnimationFrame(tweenRef.current);
            tweenRef.current = 0;
            const x = xAt(e.clientX);
            paint(x);
            choose(nearest(x));
          }}
          onPointerUp={(e) => release(e.clientX, true)}
          onPointerCancel={(e) => release(e.clientX, false)}
          onPointerLeave={() => ghost(null)}
          className={`relative h-[66px] min-w-0 flex-1 touch-none select-none rounded-lg [container-type:inline-size] ${dragging ? "cursor-grabbing" : "cursor-grab"} ${FOCUS}`}
          style={{ "--x": initialX } as React.CSSProperties}
        >
          {/* The baseline, and the part of history already behind the playhead. */}
          <span aria-hidden="true" className="absolute inset-x-0 top-[46px] h-px bg-border" />
          <span aria-hidden="true" className="absolute inset-x-0 top-[46px] h-px origin-left bg-foreground/50" style={{ transform: "scaleX(calc(var(--x) / 100))" }} />
          {model.ticks.map((p, i) => (
            <span key={i} aria-hidden="true" className="absolute top-[40px] h-[6px] w-px origin-bottom bg-border" style={lens(p, 1.6)} />
          ))}
          {model.months.map((m) =>
            m.edge ? null : <span key={`tick-${m.p}`} aria-hidden="true" className="absolute top-[36px] h-[10px] w-px origin-bottom bg-foreground/25" style={lens(m.p, 0.9)} />
          )}
          {model.at.map((p, i) => (
            <span
              key={model.releases[i].entry.id}
              aria-hidden="true"
              className={`absolute top-[32px] h-[14px] w-px origin-bottom transition-colors duration-300 ${i === index ? "bg-foreground" : "bg-foreground/40"}`}
              style={lens(p, 0.45)}
            />
          ))}
          {model.months.map((m) => (
            <span
              key={`label-${m.p}`}
              aria-hidden="true"
              className={`absolute top-[53px] whitespace-nowrap text-[11px] leading-none text-muted-foreground ${m.p > 90 ? "-translate-x-full pr-1" : "pl-1"}`}
              style={{ left: `${m.p}%` }}
            >
              {m.label}
            </span>
          ))}

          {/* Where the pointer would land. */}
          <span
            ref={ghostRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-[26px] h-[24px] w-px bg-foreground/25 opacity-0 transition-opacity duration-200"
            style={{ transform: "translateX(calc(var(--h, 0) * 1cqw))" }}
          />

          {/* The playhead, carrying the version it's on. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-px" style={{ transform: "translateX(calc(var(--x) * 1cqw))" }}>
            <span className="absolute left-0 top-[20px] h-[30px] w-px bg-primary" />
            <span className="absolute left-0 top-0 flex h-5 -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-primary px-2 font-mono text-[11px] font-medium text-primary-foreground">
              <TextMorph>{current.version ?? dateText(current.date, true)}</TextMorph>
            </span>
          </div>
        </div>
      </div>

      <div
        onPointerDown={onSwipeStart}
        onPointerMove={onSwipeMove}
        onPointerUp={(e) => onSwipeEnd(e, true)}
        onPointerCancel={(e) => onSwipeEnd(e, false)}
        className="mt-5 touch-pan-y touch-pinch-zoom rounded-[22px] bg-background p-5 shadow-[0_0_0_1px_var(--border)] sm:p-6"
      >
        <div className="flex items-center justify-between gap-3 text-[12.5px] text-muted-foreground">
          <div className="flex min-w-0 items-center">
            <span
              className="grid"
              style={{
                gridTemplateColumns: tags.length ? "1fr" : "0fr",
                opacity: tags.length ? 1 : 0,
                transition: reduced ? "none" : `grid-template-columns 380ms ${EASE}, opacity 240ms ${EASE}`,
              }}
            >
              <span className="min-w-0 pr-2 [clip-path:inset(-4px_-2px)]">
                <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-px text-[11px] font-medium transition-colors duration-300 ${TAG_TONE[tags[0]] ?? "bg-muted text-foreground/80"}`}>
                  <TextMorph>{tagText || " "}</TextMorph>
                </span>
              </span>
            </span>
            <time dateTime={new Date(current.date).toISOString()}>
              <TextMorph>{dateText(current.date)}</TextMorph>
            </time>
          </div>
          <div className="-my-1 -mr-2 flex shrink-0 items-center">
            <Step dir={-1} disabled={index === 0} onStep={() => step(-1)} />
            <p className="flex items-baseline gap-[0.3em] px-1 tabular-nums">
              <NumberRoll value={index + 1} duration={600} />
              <span>of {n}</span>
            </p>
            <Step dir={1} disabled={index === n - 1} onStep={() => step(1)} />
          </div>
        </div>

        <div className="relative mt-4 [clip-path:inset(0_-20px)]" style={{ height: height ?? undefined, transition: reduced || height === null ? "none" : `height ${MORPH}ms ${EASE}` }}>
          {/* What a swipe moves. */}
          <div ref={stageRef} className="relative">
            {leaving.map((l) => {
              const e = model.releases[l.index]?.entry;
              return e ? (
                <Pane key={`out-${l.key}`} dir={l.dir} leaving reduced={reduced} from={l.from}>
                  <Release entry={e} />
                </Pane>
              ) : null;
            })}
            <Pane key={current.id} dir={prev.dir} leaving={false} reduced={reduced} paneRef={paneRef}>
              <Release entry={current} />
            </Pane>
          </div>
        </div>
      </div>
    </div>
  );
}

function Release({ entry }: { entry: ChangelogEntry }) {
  return (
    <>
      <h3 className="text-[19px] font-medium leading-snug tracking-[-0.02em] text-foreground">{entry.title}</h3>
      {entry.body && <div className="mt-2 text-[14px] leading-relaxed text-muted-foreground [&_li]:mt-1 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">{entry.body}</div>}
      {entry.media && <div className="mt-4 overflow-hidden rounded-[16px] border border-border">{entry.media}</div>}
    </>
  );
}
