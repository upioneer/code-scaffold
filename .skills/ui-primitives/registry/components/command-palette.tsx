// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Command palette (command-palette)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * COMMAND PALETTE: ⌘K, from the pill that was always there
 *
 *   closed    a quiet "Search… ⌘K" pill
 *   opening   the pill itself lifts and grows into the palette:
 *             position, size and corners ease from pill to panel
 *             while its placeholder becomes the field's
 *   search    results narrow as you type, the letters that match
 *             are marked, the panel's height eases to fit and a
 *             highlight glides between rows
 *   nested    "Change theme…" opens its own list in place: it
 *             slides in from the right as a chip joins the field;
 *             Backspace slides back
 *   running   a command's shortcut blurs into a spinner, then a
 *             check that draws itself, and the palette folds back
 *             into the pill, which it lands as exactly (hotkey
 *             and all), so the hand-off never shows
 *   empty     "No results for “xyz”", morphing as you type
 *
 * A real dialog: focus moves in and back, arrow keys, Home/End,
 * Enter, Escape (back, then close) and the hotkey to toggle.
 * ───────────────────────────────────────────────────────── */

export interface CommandItem {
  id: string;
  label: string;
  /** Rows are grouped under this heading, in the order groups first appear. */
  group?: string;
  icon?: React.ReactNode;
  /** Shown on the right, e.g. ["⌘", "N"]. */
  shortcut?: string[];
  /** Other words that should find it, e.g. ["dark", "light"] for "Change theme". */
  keywords?: string[];
  description?: string;
  /** Navigate here when chosen. */
  href?: string;
  /** Run it. Return a promise to show progress on the row before the palette closes. */
  onSelect?: () => void | Promise<unknown>;
  /** A nested list, opened in place (e.g. "Change theme…"). */
  items?: CommandItem[];
}

export interface CommandPaletteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  items: CommandItem[];
  placeholder?: string;
  /** The letter that opens it with ⌘ (or Ctrl). Empty string turns the hotkey off. */
  hotkey?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Show the "Search… ⌘K" pill. Without it, open with the hotkey or the open prop. */
  showTrigger?: boolean;
  /** The pill's words. */
  triggerLabel?: string;
}

type Phase = "closed" | "opening" | "open" | "closing";
type Page = { title: string; items: CommandItem[] };
type Row = { item: CommandItem; marks: number[]; score: number };
type Rect = { left: number; top: number; width: number; height: number; radius: number };
type RunState = { id: string; state: "pending" | "done" | "error" };

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const DURATION = 440;
const WIDTH = 580;
const ROW = 40;
const LIST_MAX = 352;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** Icons trade places through a blur: the old one shrinks away as the new one grows in. */
const swap = (on: boolean, reduced: boolean): React.CSSProperties => ({
  opacity: on ? 1 : 0,
  transform: on ? "none" : "scale(0.6)",
  filter: on ? "none" : "blur(3px)",
  transition: reduced ? "none" : `opacity 220ms ${EASE}, transform 340ms ${EASE}, filter 220ms ${EASE}`,
});

/** Where the query's letters land in the text: one run if it's there whole, otherwise in order. */
function match(text: string, query: string): number[] | null {
  const t = text.toLowerCase();
  const q = query.toLowerCase().replace(/\s+/g, " ").trim();
  if (!q) return [];
  const at = t.indexOf(q);
  if (at >= 0) return Array.from({ length: q.length }, (_, i) => at + i);
  const marks: number[] = [];
  let j = 0;
  for (let i = 0; i < t.length && j < q.length; i++) {
    if (q[j] === " ") j++;
    if (t[i] === q[j]) {
      marks.push(i);
      j++;
    }
  }
  return j >= q.length ? marks : null;
}

function rank(items: CommandItem[], query: string): Row[] {
  const q = query.trim();
  if (!q) return items.map((item) => ({ item, marks: [], score: 0 }));
  const rows: Row[] = [];
  for (const item of items) {
    const marks = match(item.label, q);
    if (marks) {
      const contiguous = marks.length > 1 && marks[marks.length - 1] - marks[0] === marks.length - 1;
      const start = marks[0] ?? 0;
      const wordStart = start === 0 || item.label[start - 1] === " ";
      const score = (contiguous ? 60 : 30) + (start === 0 ? 40 : wordStart ? 20 : 0) - (marks[marks.length - 1] - start) * 0.5;
      rows.push({ item, marks, score });
    } else if (item.keywords?.some((k) => match(k, q)) || (item.description && match(item.description, q))) {
      rows.push({ item, marks: [], score: 10 });
    }
  }
  return rows.sort((a, b) => b.score - a.score);
}

function Marked({ text, marks }: { text: string; marks: number[] }) {
  if (!marks.length) return <>{text}</>;
  const set = new Set(marks);
  return (
    <>
      {Array.from(text).map((ch, i) =>
        set.has(i) ? (
          <span key={i} className="font-medium text-foreground">
            {ch}
          </span>
        ) : (
          <React.Fragment key={i}>{ch}</React.Fragment>
        )
      )}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="flex h-5 min-w-5 items-center justify-center rounded-md px-1 font-sans text-[11px] text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]">
      {children}
    </kbd>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={`size-4 shrink-0 ${className}`}>
      <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** The pill's face. The trigger draws it, and so does the palette as it grows out of the pill and folds back, so the hand-off changes nothing. */
function PillFace({ label, keys }: { label: string; keys: string[] }) {
  return (
    <>
      <SearchIcon />
      <span className="pr-6">{label}</span>
      {keys.length > 0 && (
        <span className="flex items-center gap-0.5">
          {keys.map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
        </span>
      )}
    </>
  );
}

function Check({ drawn, reduced }: { drawn: boolean; reduced: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-4">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{ strokeDashoffset: drawn ? 0 : 1, transition: drawn && !reduced ? `stroke-dashoffset 360ms ${EASE} 80ms` : "none" }}
      />
    </svg>
  );
}

/** One page of results. Kept as its own piece so the page you leave can slide out while the next slides in. */
function Results({
  rows,
  active,
  run,
  reduced,
  listId,
  optionId,
  setActive,
  choose,
  rowRefs,
}: {
  rows: Row[];
  active: number;
  run: RunState | null;
  reduced: boolean;
  listId?: string;
  optionId?: (i: number) => string;
  setActive?: (i: number) => void;
  choose?: (i: number) => void;
  rowRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>;
}) {
  let lastGroup: string | undefined;
  return (
    <div id={listId} role={listId ? "listbox" : undefined} aria-label={listId ? "Commands" : undefined}>
      {rows.map((row, i) => {
        const { item } = row;
        const heading = item.group && item.group !== lastGroup ? item.group : null;
        lastGroup = item.group;
        const running = run?.id === item.id;
        const state = running ? run.state : null;
        return (
          <React.Fragment key={item.id}>
            {heading && (
              <div role="presentation" className="px-3 pb-1 pt-2.5 text-[11.5px] font-medium text-muted-foreground first:pt-1">
                {heading}
              </div>
            )}
            <div
              ref={(el) => {
                if (rowRefs) rowRefs.current[i] = el;
              }}
              id={optionId?.(i)}
              role="option"
              aria-selected={i === active}
              aria-disabled={Boolean(run) || undefined}
              onPointerMove={() => i !== active && setActive?.(i)}
              onClick={() => choose?.(i)}
              className="relative flex cursor-pointer items-center gap-3 rounded-xl px-3 text-[13.5px] text-foreground/80"
              style={{ height: ROW }}
            >
              {item.icon && (
                <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4 [&_svg]:stroke-[1.7]">
                  {item.icon}
                </span>
              )}
              <span className="min-w-0 truncate">
                <Marked text={item.label} marks={row.marks} />
                {item.items && <span className="text-muted-foreground">…</span>}
              </span>
              {item.description && <span className="hidden min-w-0 flex-1 truncate text-[12px] text-muted-foreground sm:block">{item.description}</span>}
              {/* The right edge: shortcut or chevron, which blurs into a spinner and then a check while it runs. */}
              <span className="relative ml-auto flex h-5 shrink-0 items-center justify-end">
                <span className="flex items-center gap-1" style={swap(!state, reduced)}>
                  {item.items ? (
                    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 text-muted-foreground">
                      <path d="m4.5 2.5 3.5 3.5-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    item.shortcut?.map((k) => <Kbd key={k}>{k}</Kbd>)
                  )}
                </span>
                <span aria-hidden="true" className="absolute inset-y-0 right-0 flex items-center" style={swap(state === "pending", reduced)}>
                  <span className={`size-3.5 rounded-full border-[1.5px] border-border border-t-foreground/70 motion-reduce:animate-none ${state === "pending" ? "animate-spin" : ""}`} />
                </span>
                <span aria-hidden="true" className="absolute inset-y-0 right-0 flex items-center text-emerald-600 dark:text-emerald-400" style={swap(state === "done", reduced)}>
                  <Check drawn={state === "done"} reduced={reduced} />
                </span>
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function CommandPalette({
  items,
  placeholder = "Search or jump to…",
  hotkey = "k",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  showTrigger = true,
  triggerLabel = "Search…",
  className = "",
  ...props
}: CommandPaletteProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [phase, setPhase] = React.useState<Phase>(defaultOpen ? "open" : "closed");
  const [query, setQuery] = React.useState("");
  const [stack, setStack] = React.useState<Page[]>([]);
  const [active, setActive] = React.useState(0);
  const [run, setRun] = React.useState<RunState | null>(null);
  const [from, setFrom] = React.useState<Rect | null>(null);
  const [listHeight, setListHeight] = React.useState(0);
  const [highlight, setHighlight] = React.useState({ top: 0, ready: false });
  const [leaving, setLeaving] = React.useState<{ key: number; rows: Row[]; active: number; dir: number }[]>([]);
  const [enterDir, setEnterDir] = React.useState(0);
  const [mac, setMac] = React.useState(true);
  const [portal, setPortal] = React.useState<HTMLElement | null>(null);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const paneRef = React.useRef<HTMLDivElement>(null);
  const rowRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const returnFocus = React.useRef<HTMLElement | null>(null);
  const timer = React.useRef(0);
  const leaveKey = React.useRef(0);

  const isOpen = phase === "open";
  const mounted = phase !== "closed";
  const page = stack[stack.length - 1];
  const pageItems = page ? page.items : items;
  const rows = React.useMemo(() => rank(pageItems, query), [pageItems, query]);

  React.useEffect(() => {
    setPortal(document.body);
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  // Where the pill is, so the palette can grow out of it (and fold back into it).
  const pillRect = (): Rect | null => {
    const el = triggerRef.current;
    if (!el || !showTrigger) return null;
    const r = el.getBoundingClientRect();
    // Off screen, or hidden (a pill tucked away on narrow screens has no box): open in place instead.
    if (!r.width || r.bottom < 0 || r.top > window.innerHeight) return null;
    return { left: r.left, top: r.top, width: r.width, height: r.height, radius: r.height / 2 };
  };

  const target = (): Rect => {
    const vw = document.documentElement.clientWidth;
    const width = Math.min(WIDTH, vw - 24);
    return { left: (vw - width) / 2, top: Math.max(48, Math.round(window.innerHeight * 0.16)), width, height: 0, radius: 20 };
  };

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) {
        window.clearTimeout(timer.current);
        if (next) {
          returnFocus.current = document.activeElement as HTMLElement | null;
          setFrom(pillRect());
          setPhase(reduced ? "open" : "opening");
        } else {
          setFrom(pillRect());
          if (reduced) setPhase("closed");
          else {
            setPhase("closing");
            timer.current = window.setTimeout(() => setPhase("closed"), DURATION);
          }
          const back = returnFocus.current;
          requestAnimationFrame(() => (back && document.contains(back) ? back : triggerRef.current)?.focus({ preventScroll: true }));
        }
      }
      onOpenChange?.(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openProp, onOpenChange, reduced, showTrigger]
  );

  // Controlled: follow the prop through the same phases.
  React.useEffect(() => {
    if (openProp === undefined) return;
    window.clearTimeout(timer.current);
    if (openProp && (phase === "closed" || phase === "closing")) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setFrom(pillRect());
      setPhase(reduced ? "open" : "opening");
    } else if (!openProp && (phase === "open" || phase === "opening")) {
      setFrom(pillRect());
      if (reduced) setPhase("closed");
      else {
        setPhase("closing");
        timer.current = window.setTimeout(() => setPhase("closed"), DURATION);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openProp]);

  // Paint at the pill's size first, then let it grow.
  React.useEffect(() => {
    if (phase !== "opening") return;
    let inner = 0;
    const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(() => setPhase("open"))));
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [phase]);

  // A fresh start each time it opens.
  React.useEffect(() => {
    if (phase !== "opening" && !(phase === "open" && reduced)) return;
    setQuery("");
    setStack([]);
    setActive(0);
    setRun(null);
    setLeaving([]);
    setHighlight({ top: 0, ready: false });
  }, [phase, reduced]);

  React.useEffect(() => {
    if (isOpen) inputRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  // The hotkey, from anywhere on the page.
  React.useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== hotkey.toLowerCase() || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      e.preventDefault();
      setOpen(!(phase === "open" || phase === "opening"));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey, phase, setOpen]);

  // The page behind stays where it is.
  React.useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    const gap = window.innerWidth - html.clientWidth;
    const before = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
    html.style.overflow = "hidden";
    if (gap > 0) html.style.paddingRight = `${gap}px`;
    return () => {
      html.style.overflow = before.overflow;
      html.style.paddingRight = before.paddingRight;
    };
  }, [mounted]);

  // The list's height, so the panel can ease to fit the results.
  React.useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setListHeight((h) => (h === el.offsetHeight ? h : el.offsetHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  // Keep the active row in range as the results change.
  React.useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, rows.length - 1)));
  }, [rows.length]);

  // The highlight glides to the active row; the list scrolls only as far as it must.
  React.useLayoutEffect(() => {
    const row = rowRefs.current[active];
    const list = listRef.current;
    if (!row || !list) return;
    const top = row.offsetTop;
    setHighlight((h) => (h.top === top && h.ready ? h : { top, ready: h.ready || isOpen }));
    if (top < list.scrollTop) list.scrollTop = top - 4;
    else if (top + ROW > list.scrollTop + list.clientHeight) list.scrollTop = top + ROW - list.clientHeight + 4;
  }, [active, rows, isOpen]);

  // A new page slides in from the side you went.
  React.useLayoutEffect(() => {
    if (!enterDir || reduced) return;
    paneRef.current?.animate(
      [
        { opacity: 0, filter: "blur(4px)", transform: `translateX(${enterDir * 28}px)` },
        { opacity: 1, filter: "blur(0px)", transform: "none" },
      ],
      { duration: 360, easing: EASE, delay: 40, fill: "backwards" }
    );
  }, [stack.length, enterDir, reduced]);

  React.useEffect(() => {
    if (!leaving.length) return;
    const t = window.setTimeout(() => setLeaving([]), 260);
    return () => window.clearTimeout(t);
  }, [leaving]);

  const go = (dir: 1 | -1, next: Page[]) => {
    if (!reduced) setLeaving((l) => [...l, { key: ++leaveKey.current, rows, active, dir }]);
    setEnterDir(dir);
    setStack(next);
    setQuery("");
    setActive(0);
    setHighlight((h) => ({ ...h, ready: false }));
  };

  const choose = async (i: number) => {
    const row = rows[i];
    if (!row || run) return;
    const { item } = row;
    setActive(i);
    if (item.items) return go(1, [...stack, { title: item.label.replace(/…$/, ""), items: item.items }]);
    if (item.href && !item.onSelect) {
      setOpen(false);
      window.location.assign(item.href);
      return;
    }
    const result = item.onSelect?.();
    if (!(result instanceof Promise)) return setOpen(false);
    setRun({ id: item.id, state: "pending" });
    try {
      await result;
      setRun({ id: item.id, state: "done" });
      timer.current = window.setTimeout(() => setOpen(false), reduced ? 0 : 520);
    } catch {
      setRun(null);
      rowRefs.current[i]?.animate(
        [{ transform: "none" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-2px)" }, { transform: "none" }],
        { duration: 380, easing: "ease-out" }
      );
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    const moves: Record<string, number> = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: rows.length - 1 };
    if (e.key in moves && rows.length) {
      if ((e.key === "Home" || e.key === "End") && query) return;
      e.preventDefault();
      setActive((moves[e.key] + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (query) setQuery("");
      else if (stack.length) go(-1, stack.slice(0, -1));
      else setOpen(false);
    } else if (e.key === "Backspace" && !query && stack.length) {
      e.preventDefault();
      go(-1, stack.slice(0, -1));
    } else if (e.key === "Tab") {
      // Focus stays in the field; the list is reached with the arrows.
      e.preventDefault();
    }
  };

  const final = mounted ? target() : null;
  const shape = isOpen || !from ? final : from;
  const listVisible = Math.min(listHeight, LIST_MAX);
  const panelHeight = 52 + (listVisible ? listVisible + 12 : 0) + 37;
  const empty = rows.length === 0;
  const keys = hotkey ? [mac ? "⌘" : "Ctrl", hotkey.toUpperCase()] : [];

  const panel =
    mounted && final && shape ? (
      <div className="fixed inset-0 z-[100]" onKeyDown={onKeyDown}>
        {/* A faint veil over the page; clicking it closes. */}
        <div
          aria-hidden="true"
          onPointerDown={() => setOpen(false)}
          className="absolute inset-0 bg-background/55"
          style={{ opacity: isOpen ? 1 : 0, transition: reduced ? "none" : `opacity ${DURATION}ms ${EASE}` }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="absolute overflow-hidden bg-popover text-popover-foreground"
          style={{
            left: shape.left,
            top: shape.top,
            width: shape.width,
            height: isOpen || !from ? panelHeight : from.height,
            borderRadius: shape.radius,
            backgroundColor: !isOpen && from ? "var(--background)" : "var(--popover)",
            boxShadow: "inset 0 0 0 1px var(--border)",
            opacity: !from && !isOpen ? 0 : 1,
            transform: !from && !isOpen ? "scale(0.97) translateY(-6px)" : "none",
            transition: reduced
              ? "none"
              : `left ${DURATION}ms ${EASE}, top ${DURATION}ms ${EASE}, width ${DURATION}ms ${EASE}, height ${DURATION}ms ${EASE}, border-radius ${DURATION}ms ${EASE}, background-color ${DURATION}ms ${EASE}, opacity 240ms ${EASE}, transform ${DURATION}ms ${EASE}`,
          }}
        >
          {/* The pill's face, hotkey and all, fading as the panel grows out of it and back as it folds in. */}
          {from && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 flex items-center gap-2 whitespace-nowrap pl-3 pr-1.5 text-[13px] text-muted-foreground"
              style={{ height: from.height, opacity: isOpen ? 0 : 1, transition: reduced ? "none" : isOpen ? "opacity 120ms ease-out" : "opacity 200ms ease-out 200ms" }}
            >
              <PillFace label={triggerLabel} keys={keys} />
            </span>
          )}

          <div
            inert={!isOpen}
            className="absolute left-0 top-0 flex flex-col"
            style={{
              width: final.width,
              opacity: isOpen ? 1 : 0,
              transition: reduced ? "none" : isOpen ? `opacity 260ms ease-out 120ms` : "opacity 100ms ease-out",
            }}
          >
            <div className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-border px-4">
              <SearchIcon className="text-muted-foreground" />
              {/* Where you are, as a chip that opens in when you go into a list. */}
              <span
                className="grid shrink-0"
                style={{
                  gridTemplateColumns: page ? "1fr" : "0fr",
                  opacity: page ? 1 : 0,
                  transition: reduced ? "none" : `grid-template-columns 360ms ${EASE}, opacity 240ms ${EASE}`,
                }}
              >
                <span className="min-w-0 overflow-hidden">
                  <span className="mr-0.5 flex h-6 items-center whitespace-nowrap rounded-md bg-muted px-2 text-[12px] font-medium text-foreground">
                    <TextMorph>{page?.title ?? ""}</TextMorph>
                  </span>
                </span>
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={page ? `Search ${page.title.toLowerCase()}…` : placeholder}
                role="combobox"
                aria-expanded="true"
                aria-controls={`${id}-list`}
                aria-activedescendant={rows.length ? `${id}-opt-${active}` : undefined}
                aria-autocomplete="list"
                spellCheck={false}
                className="h-full min-w-0 flex-1 bg-transparent text-[14.5px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Kbd>esc</Kbd>
            </div>

            <div
              ref={listRef}
              className="relative overflow-y-auto overscroll-contain px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ height: listVisible ? listVisible + 12 : 0, transition: reduced || !isOpen ? "none" : `height 300ms ${EASE}` }}
            >
              <div ref={innerRef} className="relative py-1.5">
                {!empty && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 rounded-xl bg-accent"
                    style={{
                      top: 0,
                      height: ROW,
                      transform: `translateY(${highlight.top}px)`,
                      transition: highlight.ready && !reduced ? `transform 200ms ${EASE}` : "none",
                    }}
                  />
                )}
                {leaving.map((l) => (
                  <LeavingPane key={l.key} dir={l.dir}>
                    <Results rows={l.rows} active={l.active} run={null} reduced={reduced} />
                  </LeavingPane>
                ))}
                <div ref={paneRef} key={stack.length}>
                  <Results
                    rows={rows}
                    active={active}
                    run={run}
                    reduced={reduced}
                    listId={`${id}-list`}
                    optionId={(i) => `${id}-opt-${i}`}
                    setActive={(i) => !run && setActive(i)}
                    choose={choose}
                    rowRefs={rowRefs}
                  />
                </div>
                {empty && (
                  <p role="status" className="flex items-center px-3 text-[13px] text-muted-foreground" style={{ height: ROW }}>
                    <TextMorph>{query ? `No results for “${query.trim()}”` : "Nothing here yet"}</TextMorph>
                  </p>
                )}
              </div>
            </div>

            <div className="flex h-[37px] shrink-0 items-center gap-4 border-t border-border px-4 text-[11.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                to move
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                to open
              </span>
              <span
                className="grid"
                style={{
                  gridTemplateColumns: page ? "1fr" : "0fr",
                  opacity: page ? 1 : 0,
                  transition: reduced ? "none" : `grid-template-columns 360ms ${EASE}, opacity 240ms ${EASE}`,
                }}
              >
                <span className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
                  <Kbd>⌫</Kbd>
                  to go back
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className={`inline-flex ${className}`} {...props}>
      {showTrigger && (
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setOpen(true)}
          className={`cursor-pointer group inline-flex h-9 items-center gap-2 rounded-full bg-background pl-3 pr-1.5 text-[13px] text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-[box-shadow,color] duration-300 hover:text-foreground hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_22%,transparent)] ${FOCUS}`}
          // When the palette folded back into the pill, it already looks exactly like it: take over without a fade.
          style={{ opacity: mounted ? 0 : 1, transition: mounted || reduced || from ? "none" : "opacity 160ms ease-out" }}
        >
          <PillFace label={triggerLabel} keys={keys} />
        </button>
      )}
      {portal && panel ? createPortal(panel, portal) : null}
    </div>
  );
}

/** The page you left: it slides out toward the side you came from, then removes itself. */
function LeavingPane({ dir, children }: { dir: number; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const animation = ref.current?.animate(
      [
        { opacity: 1, filter: "blur(0px)", transform: "none" },
        { opacity: 0, filter: "blur(4px)", transform: `translateX(${-dir * 28}px)` },
      ],
      { duration: 240, easing: EASE, fill: "forwards" }
    );
    return () => animation?.cancel();
  }, [dir]);
  return (
    <div ref={ref} inert aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1.5">
      {children}
    </div>
  );
}
