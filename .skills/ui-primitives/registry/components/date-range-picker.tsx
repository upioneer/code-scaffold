// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Date range picker (date-range-picker)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * DATE RANGE PICKER: the range is one liquid band
 *
 *   open      the panel unfolds out of the pill's footprint:
 *             presets on one side, the month on the other
 *   pick      the first day you tap drops a dot; a band follows
 *             the pointer to wherever you'd end it, and a second
 *             dot rides along with it. The second tap sets it.
 *             The band is one shape per week, stretching between
 *             days, and the dots glide from day to day, so
 *             nothing lights up cell by cell
 *   presets   a highlight slides to the preset you choose; the
 *             band flows to its span and the label and the day
 *             count morph and roll to match
 *   month     ‹ and › slide the next month in from the side you
 *             went
 *   apply     the pill's label morphs to the new range; Cancel,
 *             Escape or a tap outside folds the panel back into
 *             the pill unchanged
 *
 * The days are a grid for the keyboard too: arrows, Home/End,
 * Page Up/Down for months, Enter to pick.
 * ───────────────────────────────────────────────────────── */

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateRangePreset {
  label: string;
  range: (today: Date) => DateRange;
}

export interface DateRangePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange) => void;
  /** Shortcuts down the side; pass [] for none. */
  presets?: DateRangePreset[];
  /** Days before or after these can't be picked. */
  min?: Date;
  max?: Date;
  /** Count days (analytics) or nights (stays, which need at least one). */
  unit?: "days" | "nights";
  /** Weeks start on Monday (1) or Sunday (0). */
  weekStartsOn?: 0 | 1;
  locales?: string | string[];
  placeholder?: string;
  /** Line the panel up with the pill's left or right edge. */
  align?: "start" | "end";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const GLIDE = 340;
/** The gap between a day's dot and its cell, in CSS. */
const INSET = "calc((var(--cell) - var(--dot)) / 2)";

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const monthOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const order = (a: Date, b: Date): DateRange => (a <= b ? { start: day(a), end: day(b) } : { start: day(b), end: day(a) });
const span = (r: DateRange) => Math.round((day(r.end).getTime() - day(r.start).getTime()) / 86_400_000) + 1;
/** The same day of the month n months on, kept inside that month. */
const shiftMonth = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { label: "Today", range: (t) => ({ start: t, end: t }) },
  { label: "Last 7 days", range: (t) => ({ start: addDays(t, -6), end: t }) },
  { label: "Last 30 days", range: (t) => ({ start: addDays(t, -29), end: t }) },
  { label: "This month", range: (t) => ({ start: new Date(t.getFullYear(), t.getMonth(), 1), end: t }) },
  { label: "Last month", range: (t) => ({ start: new Date(t.getFullYear(), t.getMonth() - 1, 1), end: new Date(t.getFullYear(), t.getMonth(), 0) }) },
  { label: "This year", range: (t) => ({ start: new Date(t.getFullYear(), 0, 1), end: t }) },
];

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** Six weeks of days for the month, starting on the week's first day. */
function weeksOf(month: Date, weekStartsOn: number) {
  const lead = (month.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(month, -lead);
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
}

/** The dot on the range's first or last day; it glides when the day changes and pops in when it appears. */
function Dot({ row, col, reduced, light }: { row: number; col: number; reduced: boolean; light: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    if (reduced) return;
    ref.current?.animate([{ transform: "scale(0.5)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 300, easing: THROW });
  }, [reduced]);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`absolute rounded-full ${light ? "bg-primary/80" : "bg-primary"}`}
      style={{
        left: `calc(var(--cell) * ${col} + ${INSET})`,
        top: `calc(var(--cell) * ${row} + ${INSET})`,
        width: "var(--dot)",
        height: "var(--dot)",
        transition: reduced ? "none" : `left ${GLIDE}ms ${EASE}, top ${GLIDE}ms ${EASE}, background-color 200ms`,
      }}
    />
  );
}

export function DateRangePicker({
  value,
  defaultValue = null,
  onValueChange,
  presets = DATE_RANGE_PRESETS,
  min,
  max,
  unit = "days",
  weekStartsOn = 1,
  locales,
  placeholder = "Pick dates",
  align = "start",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className = "",
  ...props
}: DateRangePickerProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [today] = React.useState(() => day(new Date()));
  const [own, setOwn] = React.useState<DateRange | null>(defaultValue);
  const committed = value === undefined ? own : value;
  const [phase, setPhase] = React.useState<"closed" | "opening" | "open" | "closing">(() => ((openProp ?? defaultOpen) ? "open" : "closed"));
  const [draft, setDraft] = React.useState<DateRange | null>(() => committed && order(committed.start, committed.end));
  const [anchor, setAnchor] = React.useState<Date | null>(null);
  const [hover, setHover] = React.useState<Date | null>(null);
  const [month, setMonth] = React.useState(() => monthOf(committed?.end ?? today));
  const [focusDay, setFocusDay] = React.useState<Date>(() => day(committed?.end ?? today));
  const [frame, setFrame] = React.useState({ shift: 0, left: 0, right: 0, max: 0 });
  const [mark, setMark] = React.useState({ x: 0, y: 0, w: 0, h: 0, on: false, slide: false });
  const [announce, setAnnounce] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const presetRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const dayRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const focusGrid = React.useRef(false);
  const isOpen = phase === "open" || phase === "opening";
  const mounted = phase !== "closed";
  const nights = unit === "nights";
  const lo = min ? day(min) : null;
  const hi = max ? day(max) : null;
  const blocked = (d: Date) => Boolean((lo && d < lo) || (hi && d > hi));

  const fmt = React.useMemo(() => new Intl.DateTimeFormat(locales ?? "en-GB", { day: "numeric", month: "short", year: "numeric" }), [locales]);
  const longFmt = React.useMemo(() => new Intl.DateTimeFormat(locales ?? "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), [locales]);
  const label = (r: DateRange | null) => (r ? (same(r.start, r.end) ? fmt.format(r.start) : fmt.formatRange(r.start, r.end)) : placeholder);
  const monthTitle = new Intl.DateTimeFormat(locales ?? "en-GB", { month: "long", year: "numeric" }).format(month);
  const weekdays = React.useMemo(() => {
    const narrow = new Intl.DateTimeFormat(locales ?? "en-GB", { weekday: "narrow" });
    return Array.from({ length: 7 }, (_, i) => narrow.format(new Date(2024, 0, 7 + i + weekStartsOn))); // 7 Jan 2024 was a Sunday
  }, [locales, weekStartsOn]);
  const weeks = React.useMemo(() => weeksOf(month, weekStartsOn), [month, weekStartsOn]);

  const begin = () => {
    setDraft(committed && order(committed.start, committed.end));
    setAnchor(null);
    setHover(null);
    setMonth(monthOf(committed?.end ?? today));
    setFocusDay(day(committed?.end ?? today));
    setPhase("opening");
  };
  const end = () => setPhase((p) => (p === "closed" ? p : "closing"));
  const request = (next: boolean, returnFocus = true) => {
    if (openProp === undefined) (next ? begin : end)();
    onOpenChange?.(next);
    if (!next && returnFocus) triggerRef.current?.focus();
  };

  // Controlled: follow the open prop.
  React.useEffect(() => {
    if (openProp === undefined) return;
    if (openProp && !isOpen) begin();
    if (!openProp && isOpen) end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openProp]);

  // Before the panel shows: keep it inside the screen and any box that clips it (narrowing it if it
  // has to), and find the pill's footprint inside it to unfold from.
  const place = React.useCallback(() => {
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!panel || !trigger) return;
    let lo = 0;
    let hi = window.innerWidth;
    for (let el = rootRef.current?.parentElement; el && el !== document.body; el = el.parentElement) {
      if (getComputedStyle(el).overflowX === "visible") continue;
      const r = el.getBoundingClientRect();
      lo = Math.max(lo, r.left);
      hi = Math.min(hi, r.right);
    }
    const edge = 8;
    const max = Math.max(240, hi - lo - edge * 2);
    panel.style.maxWidth = `${max}px`;
    setFrame((f) => {
      const p = panel.getBoundingClientRect();
      const left = p.left - f.shift;
      let shift = 0;
      if (left + p.width > hi - edge) shift = hi - edge - p.width - left;
      if (left + shift < lo + edge) shift = lo + edge - left;
      const t = trigger.getBoundingClientRect();
      return { shift, max, left: Math.max(0, t.left - (left + shift)), right: Math.max(0, left + shift + p.width - t.right) };
    });
  }, []);
  React.useLayoutEffect(() => {
    if (phase === "opening" || (phase === "open" && frame.left === 0 && frame.right === 0)) place();
  }, [phase, place, frame.left, frame.right]);
  React.useEffect(() => {
    if (!mounted) return;
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [mounted, place]);

  // Opening grows the panel on the next frame; closing folds it back, then unmounts it.
  React.useEffect(() => {
    if (phase === "opening") {
      let inner = 0;
      const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(() => setPhase("open"))));
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    if (phase === "closing") {
      const timer = window.setTimeout(() => setPhase("closed"), reduced ? 0 : 240);
      return () => window.clearTimeout(timer);
    }
  }, [phase, reduced]);

  React.useEffect(() => {
    if (!mounted) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) request(false, false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  });

  // Keyboard moves (and opening from the pill) put focus on the day; clicks elsewhere leave it alone.
  React.useEffect(() => {
    if (phase !== "open" || !focusGrid.current) return;
    focusGrid.current = false;
    dayRefs.current.get(focusDay.toDateString())?.focus({ preventScroll: true });
  }, [focusDay, phase, month]);

  const showMonth = (target: Date) => {
    const next = monthOf(target);
    const dir = Math.sign(next.getTime() - month.getTime());
    if (!dir) return;
    setMonth(next);
    if (reduced) return;
    gridRef.current?.animate(
      [
        { transform: `translateX(${dir * 20}px)`, opacity: 0, filter: "blur(4px)" },
        { transform: "none", opacity: 1, filter: "blur(0px)" },
      ],
      { duration: 380, easing: EASE },
    );
  };
  const step = (n: number) => {
    setFocusDay((d) => shiftMonth(d, n));
    showMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  };

  const pick = (d: Date) => {
    if (blocked(d)) return;
    if (!anchor) {
      setAnchor(d);
      setDraft({ start: d, end: d });
      return;
    }
    if (nights && same(anchor, d)) return; // a stay needs at least one night
    const r = order(anchor, d);
    setDraft(r);
    setAnchor(null);
    setHover(null);
    setAnnounce(label(r));
  };

  const choose = (p: DateRangePreset) => {
    const r = p.range(today);
    setDraft(r);
    setAnchor(null);
    setHover(null);
    setFocusDay(day(r.end));
    showMonth(r.end);
    setAnnounce(label(r));
  };

  const apply = () => {
    if (!draft) return;
    if (value === undefined) setOwn(draft);
    onValueChange?.(draft);
    request(false);
  };

  // What the band shows: the range being picked (first day to pointer), otherwise the draft.
  const band: DateRange | null = anchor && hover ? order(anchor, hover) : draft;
  const count = band ? span(band) - (nights ? 1 : 0) : 0;
  const ready = Boolean(draft) && !(nights && draft && same(draft.start, draft.end));
  const presetIndex = presets.findIndex((p) => {
    if (!draft || anchor) return false;
    const r = p.range(today);
    return same(r.start, draft.start) && same(r.end, draft.end);
  });

  // The preset highlight slides between presets; with none chosen it fades out where it is.
  React.useLayoutEffect(() => {
    if (!mounted) return;
    const el = presetRefs.current[presetIndex];
    setMark((m) =>
      el
        ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, on: true, slide: m.on }
        : { ...m, on: false, slide: false },
    );
    // In the narrow row of chips, scroll the chosen one into the middle.
    const row = el?.parentElement;
    if (el && row && row.scrollWidth > row.clientWidth)
      row.scrollTo({ left: el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2, behavior: phase === "open" && !reduced ? "smooth" : "auto" });
  }, [presetIndex, mounted, phase, reduced]);

  const tabDay = weeks.some((w) => w.some((d) => same(d, focusDay))) ? focusDay : month;
  const onGridKey = (e: React.KeyboardEvent) => {
    const col = (focusDay.getDay() - weekStartsOn + 7) % 7;
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDay, -1),
      ArrowRight: () => addDays(focusDay, 1),
      ArrowUp: () => addDays(focusDay, -7),
      ArrowDown: () => addDays(focusDay, 7),
      Home: () => addDays(focusDay, -col),
      End: () => addDays(focusDay, 6 - col),
      PageUp: () => shiftMonth(focusDay, -1),
      PageDown: () => shiftMonth(focusDay, 1),
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = moves[e.key]();
    focusGrid.current = true;
    setFocusDay(next);
    if (anchor) setHover(next);
    showMonth(next);
  };

  const find = (d: Date) => {
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) if (same(weeks[r][c], d)) return { r, c };
    return null;
  };
  const startAt = band ? find(band.start) : null;
  const endAt = band ? find(band.end) : null;
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const prevOff = Boolean(lo && month <= monthOf(lo));
  const nextOff = Boolean(hi && month >= monthOf(hi));
  const closedClip = `inset(0 ${frame.right}px calc(100% - 36px) ${frame.left}px round 18px)`;

  return (
    <div
      ref={rootRef}
      className={`relative inline-block ${className}`}
      {...props}
      onKeyDown={(e) => {
        props.onKeyDown?.(e);
        if (e.key !== "Escape" || !isOpen) return;
        e.stopPropagation();
        request(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={mounted ? `${id}-panel` : undefined}
        onClick={() => {
          if (!isOpen) focusGrid.current = true;
          request(!isOpen);
        }}
        className={`cursor-pointer inline-flex h-9 max-w-full items-center gap-2 rounded-full border border-border pl-3 pr-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-accent ${isOpen ? "bg-accent" : "bg-background"} ${FOCUS}`}
      >
        <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <TextMorph className="truncate tabular-nums">{label(committed)}</TextMorph>
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground"
          style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: reduced ? "none" : `transform 320ms ${EASE}` }}
        />
      </button>

      {mounted && (
        <div
          ref={panelRef}
          id={`${id}-panel`}
          role="dialog"
          aria-label="Choose dates"
          className={`@container absolute top-full z-50 mt-2 rounded-[20px] border border-border bg-popover text-popover-foreground ${align === "end" ? "right-0" : "left-0"} ${
            presets.length ? "w-[min(400px,calc(100vw-24px))]" : "w-[min(292px,calc(100vw-24px))]"
          }`}
          style={{
            translate: `${frame.shift}px 0`,
            maxWidth: frame.max || undefined,
            clipPath: phase === "open" ? "inset(0 0 0 0 round 20px)" : closedClip,
            opacity: phase === "open" ? 1 : 0,
            transition: reduced
              ? "none"
              : phase === "closing"
                ? `clip-path 240ms ${EASE}, opacity 180ms ${EASE} 40ms`
                : `clip-path 440ms ${EASE}, opacity 200ms ${EASE}`,
          }}
        >
          <div
            className={`grid p-2 [--cell:min(40px,calc((100cqw_-_26px)/7))] [--dot:calc(var(--cell)_-_6px)] ${
              presets.length ? "@min-[390px]:grid-cols-[112px_1fr] @min-[390px]:[--cell:36px]" : ""
            }`}
          >
            {presets.length > 0 && (
              <div
                role="group"
                aria-label="Presets"
                className="relative -mx-2 flex gap-1 overflow-x-auto px-2 pb-2 pr-8 [mask-image:linear-gradient(to_right,transparent,black_10px,black_calc(100%_-_32px),transparent)] [scrollbar-width:none] @min-[390px]:mx-0 @min-[390px]:flex-col @min-[390px]:overflow-visible @min-[390px]:border-r @min-[390px]:border-border @min-[390px]:px-0 @min-[390px]:pb-0 @min-[390px]:pr-2 @min-[390px]:[mask-image:none] [&::-webkit-scrollbar]:hidden"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 rounded-full bg-accent @min-[390px]:rounded-[10px]"
                  style={{
                    transform: `translate(${mark.x}px, ${mark.y}px)`,
                    width: mark.w,
                    height: mark.h,
                    opacity: mark.on ? 1 : 0,
                    transition: reduced
                      ? "none"
                      : `${mark.slide ? `transform 380ms ${EASE}, width 380ms ${EASE}, height 380ms ${EASE}, ` : ""}opacity 200ms ${EASE}`,
                  }}
                />
                {presets.map((p, i) => (
                  <button
                    key={p.label}
                    ref={(el) => {
                      presetRefs.current[i] = el;
                    }}
                    type="button"
                    aria-pressed={i === presetIndex}
                    onClick={() => choose(p)}
                    className={`cursor-pointer relative h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-left text-[12.5px] transition-colors duration-200 @min-[390px]:rounded-[10px] @min-[390px]:px-2.5 ${FOCUS} ${
                      i === presetIndex ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="mx-auto" style={{ width: "calc(var(--cell) * 7)" }}>
              <div className="flex h-9 items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous month"
                  disabled={prevOff}
                  onClick={() => step(-1)}
                  className={`cursor-pointer disabled:cursor-default -ml-1 flex size-8 items-center justify-center rounded-full text-foreground transition-opacity hover:bg-accent disabled:pointer-events-none disabled:opacity-30 ${FOCUS}`}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <p className="text-[13px] font-medium text-foreground" aria-live="polite">
                  <TextMorph>{monthTitle}</TextMorph>
                </p>
                <button
                  type="button"
                  aria-label="Next month"
                  disabled={nextOff}
                  onClick={() => step(1)}
                  className={`cursor-pointer disabled:cursor-default -mr-1 flex size-8 items-center justify-center rounded-full text-foreground transition-opacity hover:bg-accent disabled:pointer-events-none disabled:opacity-30 ${FOCUS}`}
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex text-[11px] text-muted-foreground" aria-hidden="true">
                {weekdays.map((w, i) => (
                  <span key={i} className="flex h-7 items-center justify-center" style={{ width: "var(--cell)" }}>
                    {w}
                  </span>
                ))}
              </div>

              <div ref={gridRef} role="grid" aria-label={monthTitle} onKeyDown={onGridKey} onPointerLeave={() => setHover(null)} className="relative">
                {/* The band and its dots, laid out per month so they never glide across a month change. */}
                <div key={monthKey} aria-hidden="true" className="pointer-events-none absolute inset-0">
                  {weeks.map((row, r) => {
                    let a = -1;
                    let b = -1;
                    if (band)
                      row.forEach((d, c) => {
                        if (d >= band.start && d <= band.end) {
                          if (a === -1) a = c;
                          b = c;
                        }
                      });
                    const on = a !== -1 && band !== null;
                    const opens = on && same(row[a], band.start);
                    const closes = on && same(row[b], band.end);
                    const after = band !== null && row[0] > band.end;
                    return (
                      <span
                        key={r}
                        className={`absolute ${anchor ? "bg-primary/[0.07]" : "bg-primary/[0.1]"}`}
                        style={{
                          top: `calc(var(--cell) * ${r} + ${INSET})`,
                          height: "var(--dot)",
                          left: on ? `calc(var(--cell) * ${a} + ${opens ? INSET : "2px"})` : after ? "2px" : "calc(var(--cell) * 7 - 2px)",
                          width: on ? `calc(var(--cell) * ${b - a + 1} - ${opens ? INSET : "2px"} - ${closes ? INSET : "2px"})` : "0px",
                          opacity: on ? 1 : 0,
                          borderRadius: `${opens ? 999 : 8}px ${closes ? 999 : 8}px ${closes ? 999 : 8}px ${opens ? 999 : 8}px`,
                          transition: reduced
                            ? "none"
                            : `left ${GLIDE}ms ${EASE}, width ${GLIDE}ms ${EASE}, opacity 220ms ${EASE}, border-radius 260ms ${EASE}, background-color 200ms`,
                        }}
                      />
                    );
                  })}
                  {startAt && <Dot row={startAt.r} col={startAt.c} reduced={reduced} light={false} />}
                  {endAt && <Dot row={endAt.r} col={endAt.c} reduced={reduced} light={Boolean(anchor && hover)} />}
                </div>

                {weeks.map((row, r) => (
                  <div key={r} role="row" className="relative flex">
                    {row.map((d) => {
                      const inMonth = d.getMonth() === month.getMonth();
                      const edge = band !== null && (same(d, band.start) || same(d, band.end));
                      const off = blocked(d);
                      return (
                        <button
                          key={d.toDateString()}
                          ref={(el) => {
                            if (el) dayRefs.current.set(d.toDateString(), el);
                            else dayRefs.current.delete(d.toDateString());
                          }}
                          type="button"
                          role="gridcell"
                          tabIndex={same(d, tabDay) ? 0 : -1}
                          aria-selected={band !== null && d >= band.start && d <= band.end}
                          aria-disabled={off || undefined}
                          aria-current={same(d, today) ? "date" : undefined}
                          aria-label={longFmt.format(d)}
                          onClick={() => {
                            setFocusDay(d);
                            pick(d);
                          }}
                          onPointerEnter={() => {
                            if (anchor && !off) setHover(d);
                          }}
                          className={`group flex items-center justify-center outline-none ${off ? "cursor-default" : ""}`}
                          style={{ width: "var(--cell)", height: "var(--cell)" }}
                        >
                          <span
                            className={`flex items-center justify-center rounded-full text-[13px] tabular-nums group-focus-visible:ring-2 group-focus-visible:ring-ring/40 @min-[390px]:text-[12.5px] ${
                              edge
                                ? "font-medium text-primary-foreground"
                                : off
                                  ? "text-muted-foreground/35"
                                  : `${inMonth ? "text-foreground" : "text-muted-foreground/60"} group-hover:bg-accent`
                            } ${same(d, today) && !edge ? "shadow-[inset_0_0_0_1px_var(--border)]" : ""}`}
                            style={{
                              width: "var(--dot)",
                              height: "var(--dot)",
                              transition: reduced ? "none" : `color 220ms ${EASE} ${edge ? 90 : 0}ms, background-color 160ms`,
                            }}
                          >
                            {d.getDate()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* The range as it stands, morphing while you pick, and the way out. */}
          <div className="flex items-center justify-between gap-3 border-t border-border py-2 pl-3.5 pr-2">
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[12.5px] font-medium tabular-nums text-foreground">
                <TextMorph>{band ? label(band) : placeholder}</TextMorph>
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground" aria-hidden="true">
                <NumberRoll value={count} />{" "}
                <TextMorph>{nights ? (count === 1 ? "night" : "nights") : count === 1 ? "day" : "days"}</TextMorph>
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => request(false)}
                className={`cursor-pointer h-8 rounded-full px-3 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${FOCUS}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={!ready}
                className={`cursor-pointer disabled:cursor-default h-8 rounded-full bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground transition-opacity disabled:opacity-40 ${FOCUS}`}
              >
                Apply
              </button>
            </div>
          </div>
          <p className="sr-only" role="status">
            {announce}
          </p>
        </div>
      )}
    </div>
  );
}
