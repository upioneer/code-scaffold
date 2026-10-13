// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Live activity (live-activity)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * LIVE ACTIVITY: one pill for whatever is happening now
 *
 *   arrive    the pill opens out of nothing when an activity
 *             starts and folds away when it's cleared
 *   update    the same activity morphs in place: its label
 *             letter by letter, its progress ring filling, its
 *             figure rolling
 *   switch    a different activity blurs in over the last while
 *             the pill reshapes to fit it
 *   expand    tap it and the pill itself grows into a panel
 *             (size and corners easing together): title, a
 *             progress bar, steps that tick themselves off, and
 *             actions. Escape or a tap outside folds it back
 *   done      the spinner blurs into a check that draws itself;
 *             error, into an alert
 *
 * Put it where activity belongs (top of the app, over a
 * composer); it never covers what it's about.
 * ───────────────────────────────────────────────────────── */

export type LiveActivityStatus = "running" | "done" | "error";

export interface LiveActivityStep {
  label: string;
  done?: boolean;
}

export interface LiveActivityAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface LiveActivityData {
  /** A new id is a different activity (it blurs in); the same id updates in place. */
  id: string;
  /** In the pill, e.g. "Editing 3 files". */
  label: string;
  status?: LiveActivityStatus;
  /** 0 to 1: a ring in the pill and a bar in the panel. */
  progress?: number;
  /** A figure at the pill's end, e.g. elapsed seconds. */
  count?: { value: number; format?: Intl.NumberFormatOptions; suffix?: string };
  icon?: React.ReactNode;
  /** The panel's heading; defaults to the label. */
  title?: string;
  /** A line under it. */
  detail?: string;
  steps?: LiveActivityStep[];
  actions?: LiveActivityAction[];
}

export interface LiveActivityProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  activity: LiveActivityData | null;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** The panel's width when expanded. */
  panelWidth?: number;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const MORPH = 480;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

const swap = (on: boolean, reduced: boolean): React.CSSProperties => ({
  opacity: on ? 1 : 0,
  transform: on ? "none" : "scale(0.6)",
  filter: on ? "none" : "blur(3px)",
  transition: reduced ? "none" : `opacity 240ms ${EASE}, transform 360ms ${EASE}, filter 240ms ${EASE}`,
});

/** Spinner, check or alert in one slot, trading places through a blur. */
function StatusMark({ status, icon, reduced, size = 16 }: { status: LiveActivityStatus; icon?: React.ReactNode; reduced: boolean; size?: number }) {
  return (
    <span aria-hidden="true" className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <span className="absolute inset-0 flex items-center justify-center text-muted-foreground [&_svg]:size-full" style={swap(status === "running", reduced)}>
        {icon ?? (
          <span className={`size-[85%] rounded-full border-[1.5px] border-current/30 border-t-current ${status === "running" ? "animate-spin" : ""} motion-reduce:animate-none`} />
        )}
      </span>
      <span className="absolute inset-0 text-emerald-600" style={swap(status === "done", reduced)}>
        <svg viewBox="0 0 16 16" fill="none" className="size-full">
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            style={{ strokeDashoffset: status === "done" ? 0 : 1, transition: reduced ? "none" : `stroke-dashoffset 420ms ${EASE} 120ms` }}
          />
        </svg>
      </span>
      <span className="absolute inset-0 text-red-500" style={swap(status === "error", reduced)}>
        <svg viewBox="0 0 16 16" fill="none" className="size-full">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.75v3.75M8 11h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  );
}

function Ring({ value, reduced }: { value: number; reduced: boolean }) {
  const c = 2 * Math.PI * 6;
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 -rotate-90 text-primary">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        style={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))), transition: reduced ? "none" : `stroke-dashoffset 500ms ${EASE}` }}
      />
    </svg>
  );
}

export function LiveActivity({ activity, expanded: expandedProp, defaultExpanded = false, onExpandedChange, panelWidth = 320, className = "", ...props }: LiveActivityProps) {
  const reduced = useReducedMotion();
  const panelId = React.useId();
  const [ownExpanded, setOwnExpanded] = React.useState(defaultExpanded);
  // Keep the last activity while the pill folds away, so it doesn't empty as it goes.
  const [last, setLast] = React.useState(activity);
  if (activity && activity !== last) setLast(activity);
  const shown = activity ?? last;
  const present = Boolean(activity);
  // A cleared activity resets the panel, so the next one starts as a pill.
  if (!activity && ownExpanded) setOwnExpanded(false);
  const expanded = (expandedProp ?? ownExpanded) && present;
  const status = shown?.status ?? "running";

  const rootRef = React.useRef<HTMLDivElement>(null);
  const compactRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [size, setSize] = React.useState({ compact: { w: 0, h: 36 }, panel: { w: panelWidth, h: 0 } });
  const [enterKey, setEnterKey] = React.useState(shown?.id);

  const setExpanded = React.useCallback(
    (next: boolean) => {
      if (expandedProp === undefined) setOwnExpanded(next);
      onExpandedChange?.(next);
    },
    [expandedProp, onExpandedChange],
  );

  // Both faces are measured as they are; the surface eases between their sizes.
  React.useLayoutEffect(() => {
    const c = compactRef.current;
    const p = panelRef.current;
    if (!c || !p) return;
    const measure = () =>
      setSize((s) => {
        const next = { compact: { w: c.offsetWidth, h: c.offsetHeight }, panel: { w: p.offsetWidth, h: p.offsetHeight } };
        return s.compact.w === next.compact.w && s.compact.h === next.compact.h && s.panel.w === next.panel.w && s.panel.h === next.panel.h ? s : next;
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(c);
    observer.observe(p);
    return () => observer.disconnect();
  }, []);

  // A different activity blurs in over the last.
  React.useLayoutEffect(() => {
    if (!shown || shown.id === enterKey) return;
    setEnterKey(shown.id);
    const el = compactRef.current;
    if (!el || reduced) return;
    el.animate(
      [
        { opacity: 0, filter: "blur(5px)", transform: "translateY(4px)" },
        { opacity: 1, filter: "blur(0px)", transform: "none" },
      ],
      { duration: 360, easing: EASE },
    );
  }, [shown, enterKey, reduced]);

  // Escape or a tap outside folds the panel back into the pill.
  React.useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setExpanded(false);
      triggerRef.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [expanded, setExpanded]);

  const w = !present ? 0 : expanded ? size.panel.w : size.compact.w;
  const h = !present ? size.compact.h : expanded ? size.panel.h : size.compact.h;
  const progress = shown?.progress;
  const steps = shown?.steps ?? [];
  const doneSteps = steps.filter((s) => s.done).length;

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`} {...props}>
      <div
        className="relative overflow-hidden bg-popover text-popover-foreground shadow-[0_0_0_1px_var(--border)]"
        style={{
          width: w,
          height: h,
          borderRadius: expanded ? 22 : h / 2,
          opacity: present ? 1 : 0,
          transform: present ? "none" : "scale(0.85)",
          transition: reduced
            ? "none"
            : `width ${MORPH}ms ${EASE}, height ${MORPH}ms ${EASE}, border-radius ${MORPH}ms ${EASE}, opacity 260ms ${EASE}, transform ${MORPH}ms ${EASE}`,
        }}
      >
        {/* The pill's face. */}
        <div
          className="absolute left-0 top-0"
          style={{
            opacity: expanded ? 0 : 1,
            filter: expanded ? "blur(4px)" : "none",
            pointerEvents: expanded ? "none" : "auto",
            transition: reduced ? "none" : `opacity ${expanded ? 140 : 300}ms ${EASE}, filter 300ms ${EASE}`,
          }}
        >
          <div ref={compactRef} className="w-max">
            <button
              ref={triggerRef}
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              inert={!present || expanded}
              onClick={() => setExpanded(true)}
              className="cursor-pointer flex h-9 items-center gap-2 whitespace-nowrap rounded-full pl-2.5 pr-3 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
            >
              {/* With progress, the ring is the mark; it hands over to the check when it's done. */}
              <span className="relative flex size-4 shrink-0 items-center justify-center">
                <span className="absolute inset-0" style={swap(progress === undefined || status !== "running", reduced)}>
                  <StatusMark status={status} icon={shown?.icon} reduced={reduced} />
                </span>
                <span className="absolute inset-0" style={swap(progress !== undefined && status === "running", reduced)}>
                  <Ring value={progress ?? 0} reduced={reduced} />
                </span>
              </span>
              <TextMorph>{shown?.label ?? ""}</TextMorph>
              {shown?.count && (
                <span className="text-[12px] font-normal tabular-nums text-muted-foreground">
                  <NumberRoll value={shown.count.value} format={shown.count.format} suffix={shown.count.suffix} duration={600} />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* The panel the pill grows into. */}
        <div
          className="absolute left-0 top-0"
          // The face that isn't showing never catches the pointer.
          style={{
            opacity: expanded ? 1 : 0,
            filter: expanded ? "none" : "blur(4px)",
            pointerEvents: expanded ? "auto" : "none",
            transition: reduced ? "none" : `opacity ${expanded ? `300ms ${EASE} 120ms` : `120ms ${EASE}`}, filter 300ms ${EASE}`,
          }}
        >
          <div ref={panelRef} id={panelId} role="group" aria-label={shown?.title ?? shown?.label} inert={!expanded} className="p-4" style={{ width: `min(${panelWidth}px, calc(100vw - 24px))` }}>
            <div className="flex items-start gap-2.5">
              <span className="mt-px">
                <StatusMark status={status} icon={shown?.icon} reduced={reduced} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium leading-snug text-foreground">
                  <TextMorph animateWidth={false}>{shown?.title ?? shown?.label ?? ""}</TextMorph>
                </p>
                {shown?.detail && <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{shown.detail}</p>}
              </div>
              {shown?.count && (
                <span className="shrink-0 text-[12.5px] tabular-nums text-muted-foreground">
                  <NumberRoll value={shown.count.value} format={shown.count.format} suffix={shown.count.suffix} duration={600} />
                </span>
              )}
            </div>

            {progress !== undefined && (
              <div className="mt-3.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${status === "error" ? "bg-red-500" : status === "done" ? "bg-emerald-500" : "bg-primary"}`}
                    style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`, transition: reduced ? "none" : `width 500ms ${EASE}, background-color 300ms` }}
                  />
                </div>
                <p className="mt-1.5 flex justify-between text-[11.5px] tabular-nums text-muted-foreground">
                  <span>{steps.length ? `${doneSteps} of ${steps.length} steps` : ""}</span>
                  <NumberRoll value={Math.min(1, Math.max(0, progress))} format={{ style: "percent" }} duration={500} />
                </p>
              </div>
            )}

            {steps.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {steps.map((s, i) => {
                  const current = !s.done && steps.slice(0, i).every((x) => x.done) && status === "running";
                  return (
                    <li key={s.label} className={`flex items-center gap-2 text-[12.5px] transition-colors duration-300 ${s.done ? "text-muted-foreground" : current ? "text-foreground" : "text-muted-foreground/70"}`}>
                      <StatusMark status={s.done ? "done" : current ? "running" : "running"} icon={!s.done && !current ? <span className="size-[60%] rounded-full border border-current/40" /> : undefined} reduced={reduced} size={14} />
                      {s.label}
                    </li>
                  );
                })}
              </ul>
            )}

            {shown?.actions && shown.actions.length > 0 && (
              <div className="mt-4 flex justify-end gap-2">
                {shown.actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.onClick}
                    className={`cursor-pointer h-8 rounded-full px-3.5 text-[12.5px] font-medium transition-colors ${FOCUS} ${
                      a.primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:bg-accent"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Announce what changed in words, never the ticking figures. */}
      <p role="status" aria-live="polite" className="sr-only">
        {activity ? `${activity.label}${activity.status === "done" ? ", done" : activity.status === "error" ? ", failed" : ""}` : ""}
      </p>
    </div>
  );
}
