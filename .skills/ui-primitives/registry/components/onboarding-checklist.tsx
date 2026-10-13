// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Onboarding checklist (onboarding-checklist)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * ONBOARDING CHECKLIST: the first five things, ticked off
 *
 *   next       the first open task is open in place: what it is,
 *              why it matters and the one button that does it
 *   doing      its button spins while your action runs, then a
 *              check draws itself on the row, a strike draws
 *              through the label and the next task opens
 *   progress   a ring fills and "2 of 5" rolls with every tick
 *   pick       open any task by its row, done or not
 *   folded     the whole card folds to its header (ring and
 *              count) and opens again
 *   done       the list folds away, the ring fills and becomes a
 *              check with a small burst, and the title morphs to
 *              "You're all set"
 *
 * Drive it from your data (done per task) or let it keep its own.
 * ───────────────────────────────────────────────────────── */

export interface OnboardingTask {
  id: string;
  title: string;
  description?: string;
  /** The one button that does the task. Return a promise to show progress; it's ticked off when it resolves. */
  action?: { label: string; /** Shown while a promise runs, e.g. "Connecting". */ pendingLabel?: string; onClick?: () => void | Promise<unknown>; href?: string };
  /** Controlled: whether it's done. Leave out to let the checklist track it. */
  done?: boolean;
}

export interface OnboardingChecklistProps extends React.HTMLAttributes<HTMLDivElement> {
  tasks: OnboardingTask[];
  title?: string;
  doneTitle?: string;
  doneDescription?: string;
  /** Called when a task is ticked off (its action resolved). */
  onTaskComplete?: (id: string) => void;
  /** Called with "Hide" once everything is done. */
  onDismiss?: () => void;
  defaultCollapsed?: boolean;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
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

function Check({ drawn, reduced, width = 2, delay = 80 }: { drawn: boolean; reduced: boolean; width?: number; delay?: number }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-full">
      <path
        d="M4.2 8.4 6.8 11 11.8 5.4"
        stroke="currentColor"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{ strokeDashoffset: drawn ? 0 : 1, transition: drawn && !reduced ? `stroke-dashoffset 380ms ${EASE} ${delay}ms` : "none" }}
      />
    </svg>
  );
}

/** The ring that fills with progress, and becomes a check with a small burst when it's full. */
function Ring({ value, complete, reduced }: { value: number; complete: boolean; reduced: boolean }) {
  const c = 2 * Math.PI * 9;
  const burstRef = React.useRef<HTMLSpanElement>(null);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!complete || reduced) return;
    const dots = burstRef.current?.children;
    if (!dots) return;
    Array.from(dots).forEach((dot, i) => {
      const angle = (i / dots.length) * Math.PI * 2;
      const dist = 20 + (i % 2) * 6;
      (dot as HTMLElement).animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 0 },
          { opacity: 1, offset: 0.2 },
          { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0.4)`, opacity: 0 },
        ],
        { duration: 700, easing: EASE, delay: 260 }
      );
    });
  }, [complete, reduced]);
  return (
    <span aria-hidden="true" className="relative flex size-6 shrink-0 items-center justify-center">
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full -rotate-90">
        <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2" className="stroke-border" />
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          className="stroke-primary"
          style={{ strokeDashoffset: c * (1 - value), transition: reduced ? "none" : `stroke-dashoffset 640ms ${EASE}` }}
        />
      </svg>
      <span
        className="absolute inset-0 rounded-full bg-primary text-primary-foreground"
        style={{ transform: complete ? "none" : "scale(0.4)", opacity: complete ? 1 : 0, transition: reduced ? "none" : `transform 460ms ${THROW} 180ms, opacity 260ms ${EASE} 180ms` }}
      >
        <span className="absolute inset-[5px]">
          <Check drawn={complete} reduced={reduced} width={2.4} delay={360} />
        </span>
      </span>
      <span ref={burstRef} className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="absolute size-1 rounded-full bg-primary opacity-0" />
        ))}
      </span>
    </span>
  );
}

export function OnboardingChecklist({
  tasks,
  title = "Get started",
  doneTitle = "You’re all set",
  doneDescription = "Everything’s in place. Here’s to the first busy Saturday.",
  onTaskComplete,
  onDismiss,
  defaultCollapsed = false,
  className = "",
  ...props
}: OnboardingChecklistProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [own, setOwn] = React.useState<Set<string>>(() => new Set());
  const [running, setRunning] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const isDone = (t: OnboardingTask) => t.done ?? own.has(t.id);
  const firstOpen = tasks.find((t) => !isDone(t))?.id ?? null;
  const [picked, setPicked] = React.useState<string | null>(null);
  const openId = picked ?? firstOpen;
  const count = tasks.filter(isDone).length;
  const complete = count === tasks.length && tasks.length > 0;

  // When the open task gets done, the next open one takes over (unless someone picked a row since).
  const lastFirst = React.useRef(firstOpen);
  React.useEffect(() => {
    if (lastFirst.current !== firstOpen) {
      lastFirst.current = firstOpen;
      setPicked(null);
    }
  }, [firstOpen]);

  const run = async (task: OnboardingTask) => {
    if (!task.action || running) return;
    const result = task.action.onClick?.();
    if (task.action.href && !task.action.onClick) {
      window.location.assign(task.action.href);
      return;
    }
    if (result instanceof Promise) {
      setRunning(task.id);
      try {
        await result;
      } catch {
        setRunning(null);
        return;
      }
      setRunning(null);
    }
    if (task.done === undefined) setOwn((s) => new Set(s).add(task.id));
    onTaskComplete?.(task.id);
  };

  return (
    <section aria-labelledby={`${id}-title`} className={`w-full overflow-hidden rounded-[20px] border border-border bg-background ${className}`} {...props}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <Ring value={tasks.length ? count / tasks.length : 0} complete={complete} reduced={reduced} />
        <div className="min-w-0 flex-1">
          <h3 id={`${id}-title`} className="text-[14px] font-medium leading-5 text-foreground">
            <TextMorph>{complete ? doneTitle : title}</TextMorph>
          </h3>
          <p className="flex items-baseline gap-[0.3em] text-[12px] leading-4 text-muted-foreground tabular-nums">
            <NumberRoll value={count} duration={700} /> of {tasks.length} done
          </p>
        </div>
        <span role="status" className="sr-only">
          {complete ? doneTitle : `${count} of ${tasks.length} done`}
        </span>
        {complete && onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className={`cursor-pointer h-8 rounded-full px-3 text-[12.5px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-accent animate-[ui-fade-in_300ms_ease-out_400ms_both] motion-reduce:animate-none ${FOCUS}`}
          >
            Hide
          </button>
        ) : (
          <button
            type="button"
            aria-expanded={!collapsed}
            aria-controls={`${id}-list`}
            aria-label={collapsed ? "Show checklist" : "Fold checklist"}
            onClick={() => setCollapsed((c) => !c)}
            className={`cursor-pointer flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${FOCUS}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className="size-3 transition-transform duration-300 motion-reduce:transition-none"
              style={{ transform: collapsed ? "none" : "rotate(180deg)", transitionTimingFunction: EASE }}
            >
              <path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Done: the list folds away and a line says so. */}
      <div
        aria-hidden={!complete || undefined}
        className="grid"
        style={{ gridTemplateRows: complete ? "1fr" : "0fr", opacity: complete ? 1 : 0, transition: reduced ? "none" : `grid-template-rows 460ms ${EASE} 200ms, opacity 360ms ${EASE} 320ms` }}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground">{doneDescription}</p>
        </div>
      </div>

      <div
        id={`${id}-list`}
        inert={collapsed || complete}
        className="grid"
        style={{
          gridTemplateRows: collapsed || complete ? "0fr" : "1fr",
          opacity: collapsed || complete ? 0 : 1,
          transition: reduced ? "none" : `grid-template-rows 460ms ${EASE}, opacity ${collapsed || complete ? "180ms" : "360ms"} ${EASE}`,
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <ol className="border-t border-border p-1.5">
            {tasks.map((task, i) => {
              const done = isDone(task);
              const open = task.id === openId;
              const busy = running === task.id;
              return (
                <li key={task.id} className={`rounded-[14px] transition-colors duration-300 ${open ? "bg-accent/60" : ""}`}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`${id}-t${i}`}
                    onClick={() => setPicked(open ? (task.id === firstOpen ? "__none__" : null) : task.id)}
                    className={`cursor-pointer flex w-full items-center gap-3 rounded-[14px] px-2.5 py-2.5 text-left ${FOCUS}`}
                  >
                    {/* An open ring that becomes a filled, drawn check. */}
                    <span aria-hidden="true" className="relative flex size-5 shrink-0 items-center justify-center">
                      <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1.5px_var(--border)]" style={swap(!done, reduced)} />
                      <span className="absolute inset-0 rounded-full bg-foreground text-background" style={swap(done, reduced)}>
                        <Check drawn={done} reduced={reduced} />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 text-[13.5px]">
                      {/* The strike draws itself through the label once it's done. */}
                      <span
                        className={`bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat [background-position:0_58%] transition-colors duration-300 ${done ? "text-muted-foreground" : "text-foreground"}`}
                        style={{ backgroundSize: done ? "100% 1px" : "0% 1px", transition: reduced ? "none" : `background-size 480ms ${EASE} 120ms, color 300ms` }}
                      >
                        {task.title}
                      </span>
                      <span className="sr-only">{done ? ", done" : ""}</span>
                    </span>
                  </button>
                  <div
                    id={`${id}-t${i}`}
                    inert={!open}
                    className="grid"
                    style={{
                      gridTemplateRows: open ? "1fr" : "0fr",
                      opacity: open ? 1 : 0,
                      transition: reduced ? "none" : `grid-template-rows 420ms ${EASE}, opacity ${open ? "320ms" : "140ms"} ${EASE}`,
                    }}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="pb-3 pl-[42px] pr-3">
                        {task.description && <p className="text-[12.5px] leading-relaxed text-muted-foreground">{task.description}</p>}
                        {task.action && !done && (
                          <button
                            type="button"
                            onClick={() => run(task)}
                            aria-busy={busy || undefined}
                            className={`cursor-pointer mt-3 inline-flex h-8 items-center rounded-full bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground transition-[background-color,transform] duration-200 hover:bg-primary/90 active:scale-[0.97] ${FOCUS}`}
                          >
                            <span
                              aria-hidden="true"
                              className="flex shrink-0 items-center justify-center overflow-hidden"
                              style={{ width: busy ? 18 : 0, transition: reduced ? "none" : `width 320ms ${EASE}` }}
                            >
                              <span className={`size-3 rounded-full border-[1.5px] border-primary-foreground/40 border-t-primary-foreground motion-reduce:animate-none ${busy ? "animate-spin" : ""}`} />
                            </span>
                            <TextMorph>{busy ? (task.action.pendingLabel ?? "Working on it") : task.action.label}</TextMorph>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
