// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Toast stack (toast-stack)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * TOAST STACK: notifications that keep their place in line
 *
 *   arrive     a toast rises in from the edge through a blur and
 *              the ones before it step back into a Tactile stack
 *   stack      three peek out behind the newest, each a little
 *              smaller; hover or focus fans them out into a list
 *   time       a Tactile drains along the bottom; hovering or a
 *              hidden tab pauses it
 *   promise    one toast from start to finish: a spinner while it
 *              works, then the words morph and a check draws
 *              itself (or an alert, and it shakes)
 *   action     Undo and friends sit on the right
 *   dismiss    swipe it away, or the close button; the rest close
 *              up behind it
 *
 * Call toast() from anywhere; render <Toaster /> once.
 * ───────────────────────────────────────────────────────── */

export type ToastType = "default" | "success" | "error" | "info" | "loading";
export type ToastPosition = "bottom-right" | "bottom-center" | "bottom-left" | "top-right" | "top-center" | "top-left";

export interface ToastOptions {
  description?: string;
  type?: ToastType;
  /** How long it stays (ms). Loading toasts stay until they settle. */
  duration?: number;
  action?: { label: string; onClick: () => void };
  /** Reuse an id to update a toast in place. */
  id?: string;
}

interface ToastData extends ToastOptions {
  id: string;
  title: string;
  type: ToastType;
  duration: number;
  /** Bumped when it changes, so its timer starts over. */
  version: number;
  dismissed: boolean;
}

/* ── The store: toast() works from anywhere, <Toaster /> renders it ── */

let toasts: ToastData[] = [];
let counter = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const DEFAULT_DURATION = 4000;

function upsert(title: string, options: ToastOptions = {}): string {
  const id = options.id ?? `t${++counter}`;
  const existing = toasts.find((t) => t.id === id);
  const type = options.type ?? "default";
  const next: ToastData = {
    ...existing,
    ...options,
    id,
    title,
    type,
    duration: options.duration ?? existing?.duration ?? DEFAULT_DURATION,
    version: (existing?.version ?? 0) + 1,
    dismissed: false,
  };
  toasts = existing ? toasts.map((t) => (t.id === id ? next : t)) : [next, ...toasts];
  emit();
  return id;
}

export function toast(title: string, options?: ToastOptions) {
  return upsert(title, options);
}
toast.success = (title: string, options?: Omit<ToastOptions, "type">) => upsert(title, { ...options, type: "success" });
toast.error = (title: string, options?: Omit<ToastOptions, "type">) => upsert(title, { ...options, type: "error" });
toast.info = (title: string, options?: Omit<ToastOptions, "type">) => upsert(title, { ...options, type: "info" });
toast.loading = (title: string, options?: Omit<ToastOptions, "type">) => upsert(title, { ...options, type: "loading" });
/** One toast that follows a promise: loading, then success or error, morphing in place. */
toast.promise = <T,>(
  promise: Promise<T>,
  messages: { loading: string; success: string | ((value: T) => string); error: string | ((error: unknown) => string); description?: string }
) => {
  const id = upsert(messages.loading, { type: "loading", description: messages.description });
  promise.then(
    (value) => upsert(typeof messages.success === "function" ? messages.success(value) : messages.success, { id, type: "success" }),
    (error) => upsert(typeof messages.error === "function" ? messages.error(error) : messages.error, { id, type: "error" })
  );
  return promise;
};
toast.dismiss = (id?: string) => {
  toasts = toasts.map((t) => (id === undefined || t.id === id ? { ...t, dismissed: true } : t));
  emit();
};
const remove = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getToasts = () => toasts;
const getNone = () => [] as ToastData[];

/* ── Rendering ── */

export interface ToasterProps extends React.HTMLAttributes<HTMLElement> {
  position?: ToastPosition;
  /** How many show behind the newest when stacked. */
  visible?: number;
  /** Keyboard shortcut that moves focus to the toasts (with Alt). */
  hotkey?: string;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const GAP = 10;
const PEEK = 10;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

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
  transition: reduced ? "none" : `opacity 240ms ${EASE}, transform 360ms ${EASE}, filter 240ms ${EASE}`,
});

function StatusIcon({ type, reduced }: { type: ToastType; reduced: boolean }) {
  const layer = "absolute inset-0 flex items-center justify-center";
  return (
    <span
      aria-hidden="true"
      className="relative flex h-5 shrink-0 items-center justify-center"
      style={{ width: type === "default" ? 0 : 16, marginRight: type === "default" ? 0 : 10, transition: reduced ? "none" : `width 320ms ${EASE}, margin 320ms ${EASE}` }}
    >
      <span className={layer} style={swap(type === "loading", reduced)}>
        <span className={`size-3.5 rounded-full border-[1.5px] border-border border-t-foreground/70 motion-reduce:animate-none ${type === "loading" ? "animate-spin" : ""}`} />
      </span>
      <span className={`${layer} text-emerald-600 dark:text-emerald-400`} style={swap(type === "success", reduced)}>
        <svg viewBox="0 0 16 16" fill="none" className="size-4">
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            style={{ strokeDashoffset: type === "success" ? 0 : 1, transition: type === "success" && !reduced ? `stroke-dashoffset 380ms ${EASE} 100ms` : "none" }}
          />
        </svg>
      </span>
      <span className={`${layer} text-red-600 dark:text-red-400`} style={swap(type === "error", reduced)}>
        <svg viewBox="0 0 16 16" fill="none" className="size-4">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.75v3.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.9" fill="currentColor" />
        </svg>
      </span>
      <span className={`${layer} text-muted-foreground`} style={swap(type === "info", reduced)}>
        <svg viewBox="0 0 16 16" fill="none" className="size-4">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7.25v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

function ToastCard({
  data,
  index,
  expanded,
  frontHeight,
  height,
  offset,
  top,
  side,
  limit,
  paused,
  reduced,
  onHeight,
}: {
  data: ToastData;
  index: number;
  expanded: boolean;
  frontHeight: number;
  height: number;
  offset: number;
  top: boolean;
  side: "left" | "right" | "center";
  limit: number;
  paused: boolean;
  reduced: boolean;
  onHeight: (id: string, height: number) => void;
}) {
  const ref = React.useRef<HTMLLIElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(reduced);
  const [drag, setDrag] = React.useState<{ x: number; active: boolean }>({ x: 0, active: false });
  const [exitX, setExitX] = React.useState(0);
  const start = React.useRef<{ x: number; t: number } | null>(null);
  const leaving = data.dismissed;
  const sign = top ? 1 : -1;

  // Paint below the edge first, then rise into place.
  React.useEffect(() => {
    if (mounted) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(() => setMounted(true))));
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [mounted]);

  React.useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => onHeight(data.id, el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [data.id, onHeight]);

  // Leaving: run the exit, then drop it from the store.
  React.useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => remove(data.id), reduced ? 0 : 340);
    return () => window.clearTimeout(t);
  }, [leaving, data.id, reduced]);

  // A failure gives a small shake.
  const lastType = React.useRef(data.type);
  React.useEffect(() => {
    if (data.type === "error" && lastType.current !== "error" && !reduced)
      innerRef.current?.animate(
        [{ transform: "none" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-2px)" }, { transform: "none" }],
        { duration: 380, easing: "ease-out" }
      );
    lastType.current = data.type;
  }, [data.type, reduced]);

  const hiddenBehind = index >= limit;
  const scale = expanded || reduced ? 1 : 1 - index * 0.05;
  // Where it sits: fanned out by the heights in front of it, or stacked a rim's width behind the one in front.
  const placed = expanded ? sign * offset : sign * index * PEEK;
  const y = !mounted ? -sign * (frontHeight + 24) : leaving && !exitX ? placed - sign * 12 : placed;
  const x = leaving ? exitX || 0 : drag.x;
  const opacity = !mounted || leaving || hiddenBehind ? 0 : 1;
  const transform = `translate3d(${x}px, ${y}px, 0) scale(${leaving && !exitX ? scale * 0.96 : scale})`;
  // Stacked behind the newest, a toast takes the newest's height so only its rim shows; fanned out, its own.
  const cardHeight = height ? (!expanded && index > 0 && frontHeight ? frontHeight : height) : undefined;

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = { x: e.clientX, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ x: 0, active: true });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    // It follows the finger freely toward the edge, and resists the other way.
    const toward = side === "left" ? -1 : 1;
    setDrag({ x: dx * toward > 0 || side === "center" ? dx : dx * 0.2, active: true });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const speed = Math.abs(dx) / Math.max(1, performance.now() - start.current.t);
    start.current = null;
    if (Math.abs(dx) > 90 || (speed > 0.45 && Math.abs(dx) > 24)) {
      setExitX(Math.sign(dx) * ((ref.current?.offsetWidth ?? 360) + 40));
      toast.dismiss(data.id);
    }
    setDrag({ x: 0, active: false });
  };

  return (
    <li
      ref={ref}
      data-toast={data.id}
      role={data.type === "error" ? "alert" : "status"}
      aria-live={data.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      aria-hidden={hiddenBehind && !expanded ? true : undefined}
      tabIndex={-1}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`group/toast pointer-events-auto absolute inset-x-0 touch-pan-y select-none outline-none ${top ? "top-0 origin-bottom" : "bottom-0 origin-top"}`}
      style={{
        zIndex: 100 - index,
        transform,
        opacity,
        filter: !mounted || (leaving && !exitX) ? "blur(4px)" : "none",
        transition: reduced
          ? "none"
          : drag.active
            ? "none"
            : `transform ${leaving ? 340 : 520}ms ${mounted && !leaving && index === 0 ? THROW : EASE}, opacity ${leaving ? 220 : 360}ms ${EASE}, filter 360ms ${EASE}`,
      }}
    >
      <div
        className="relative overflow-hidden rounded-[14px] bg-popover text-popover-foreground shadow-[inset_0_0_0_1px_var(--border)]"
        style={{ height: cardHeight, transition: reduced ? "none" : `height 420ms ${EASE}` }}
      >
        {/* Measured as it naturally is, whatever height the card is showing it at. */}
        <div ref={innerRef} className="flex min-w-0 items-start p-3.5 pr-10" style={{ opacity: !expanded && index > 0 ? 0 : 1, transition: reduced ? "none" : `opacity 260ms ${EASE}` }}>
          <StatusIcon type={data.type} reduced={reduced} />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium leading-5 text-foreground">
              <TextMorph animateWidth={false}>{data.title}</TextMorph>
            </p>
            {data.description && <p className="mt-0.5 text-[12.5px] leading-5 text-muted-foreground">{data.description}</p>}
          </div>
          {data.action && (
            <button
              type="button"
              onClick={() => {
                data.action?.onClick();
                toast.dismiss(data.id);
              }}
              className={`cursor-pointer -my-0.5 ml-3 inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[12px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-accent ${FOCUS}`}
            >
              {data.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => toast.dismiss(data.id)}
          className={`cursor-pointer absolute right-2.5 top-3 flex size-6 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-[opacity,color,background-color] duration-200 hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/toast:opacity-100 [@media(hover:none)]:opacity-100 ${FOCUS}`}
        >
          <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3">
            <path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        {/* The time left, draining along the bottom edge. Restarts when the toast changes. */}
        {data.type !== "loading" && data.duration !== Infinity && (
          <span
            key={data.version}
            aria-hidden="true"
            onAnimationEnd={() => toast.dismiss(data.id)}
            className="absolute inset-x-3.5 bottom-0 h-px origin-left bg-foreground/15"
            style={{
              animation: `ui-progress ${data.duration}ms linear reverse forwards`,
              animationPlayState: paused || leaving ? "paused" : "running",
              opacity: !expanded && index > 0 ? 0 : 1,
            }}
          />
        )}
      </div>
    </li>
  );
}

export function Toaster({ position = "bottom-right", visible = 3, hotkey = "t", className = "", ...props }: ToasterProps) {
  const reduced = useReducedMotion();
  const list = React.useSyncExternalStore(subscribe, getToasts, getNone);
  const [heights, setHeights] = React.useState<Record<string, number>>({});
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const regionRef = React.useRef<HTMLOListElement>(null);

  const top = position.startsWith("top");
  const side = position.endsWith("left") ? "left" : position.endsWith("right") ? "right" : "center";
  const expanded = hovered || focused || reduced;
  const paused = hovered || focused || hidden;

  const onHeight = React.useCallback((id: string, h: number) => setHeights((m) => (m[id] === h ? m : { ...m, [id]: h })), []);

  React.useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Alt + T jumps to the newest toast; Escape from there dismisses it.
  React.useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.code !== `Key${hotkey.toUpperCase()}`) return;
      e.preventDefault();
      regionRef.current?.querySelector<HTMLElement>("li")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey]);

  // Forget heights of toasts that are gone.
  React.useEffect(() => {
    setHeights((m) => {
      const ids = new Set(list.map((t) => t.id));
      const next = Object.fromEntries(Object.entries(m).filter(([id]) => ids.has(id)));
      return Object.keys(next).length === Object.keys(m).length ? m : next;
    });
  }, [list]);

  const shown = list.filter((t) => !t.dismissed);
  const front = shown[0];
  const frontHeight = front ? heights[front.id] ?? 0 : 0;
  // Each toast's distance from the edge when fanned out: the heights of the ones in front of it.
  const offsets: Record<string, number> = {};
  let acc = 0;
  for (const t of list) {
    offsets[t.id] = acc;
    if (!t.dismissed) acc += (heights[t.id] ?? 0) + GAP;
  }
  const stackHeight = expanded ? Math.max(0, acc - GAP) : frontHeight + Math.min(shown.length - 1, visible - 1) * PEEK;

  return (
    <section
      aria-label="Notifications (Alt+T)"
      className={`pointer-events-none fixed z-[90] flex w-[min(380px,calc(100vw-32px))] ${top ? "top-4" : "bottom-4"} ${
        side === "left" ? "left-4" : side === "right" ? "right-4" : "left-1/2 -translate-x-1/2"
      } ${className}`}
      {...props}
    >
      <ol
        ref={regionRef}
        tabIndex={-1}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocused(false)}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          const id = (e.target as HTMLElement).closest<HTMLElement>("[data-toast]")?.dataset.toast;
          if (id) toast.dismiss(id);
        }}
        className={`relative w-full outline-none ${shown.length ? "pointer-events-auto" : ""}`}
        style={{ height: stackHeight, transition: reduced ? "none" : `height 420ms ${EASE}` }}
      >
        {list.map((t) => {
          const index = t.dismissed ? Math.max(0, shown.findIndex((s) => s.id === t.id)) : shown.indexOf(t);
          return (
            <ToastCard
              key={t.id}
              data={t}
              index={index < 0 ? 0 : index}
              expanded={expanded}
              frontHeight={frontHeight}
              height={heights[t.id] ?? 0}
              offset={offsets[t.id] ?? 0}
              top={top}
              side={side}
              limit={visible}
              paused={paused}
              reduced={reduced}
              onHeight={onHeight}
            />
          );
        })}
      </ol>
    </section>
  );
}
