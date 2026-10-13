// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Plan (plan)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { ChevronDown, ListChecks, X } from "lucide-react";
import { NumberRoll } from "./number-roll";

/* ─────────────────────────────────────────────────────────
 * PLAN: an agent's checklist, ticking itself off
 *
 *   pending   not started
 *   running   being worked on now; the ring turns into a spinner
 *   done      finished; the spinner blurs into a check that draws
 *             itself, and a strike-through draws across the label
 *   skipped   no longer needed
 *   failed    couldn't be done; the reason folds open underneath
 *
 * A Tactile under the header fills as tasks finish and the count
 * rolls ("3 of 5"). When every task is settled "done" slides in
 * beside it and the plan folds into that one line.
 * ───────────────────────────────────────────────────────── */

export type PlanTaskStatus = "pending" | "running" | "done" | "skipped" | "failed";

export interface PlanTask {
  id?: string;
  label: string;
  /** A note under the task, e.g. why it failed or what it produced. */
  detail?: string;
  status: PlanTaskStatus;
}

export interface PlanProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tasks: PlanTask[];
  title?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fold into the summary once every task is settled. */
  collapseWhenDone?: boolean;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const STATUS_TEXT: Record<PlanTaskStatus, string> = {
  pending: "Not started",
  running: "In progress",
  done: "Done",
  skipped: "Skipped",
  failed: "Failed",
};

const MORPH = "cubic-bezier(0.16,1,0.3,1)";

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
  transition: reduced ? "none" : `opacity 260ms ${MORPH}, transform 380ms ${MORPH}, filter 260ms ${MORPH}`,
});

/** Every mark is there at once; the one for the task's status shows, and they trade places through a blur. */
function Mark({ status, reduced }: { status: PlanTaskStatus; reduced: boolean }) {
  const layer = "absolute inset-0 flex items-center justify-center";
  return (
    <span aria-hidden="true" className="relative flex size-3.5 shrink-0">
      <span className={layer} style={swap(status === "pending", reduced)}>
        <span className="size-3.5 rounded-full border-[1.5px] border-border" />
      </span>
      <span className={layer} style={swap(status === "running", reduced)}>
        {/* Spins only while it's showing. */}
        <span className={`size-3.5 rounded-full border-[1.5px] border-border border-t-foreground motion-reduce:animate-none ${status === "running" ? "animate-spin" : ""}`} />
      </span>
      <span className={layer} style={swap(status === "done", reduced)}>
        <svg viewBox="0 0 16 16" className="size-3.5">
          <circle cx="8" cy="8" r="8" className="fill-foreground" />
          <path
            d="M4.8 8.3l2.1 2.1 4.3-4.6"
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            className="stroke-background"
            style={{ strokeDashoffset: status === "done" ? 0 : 1, transition: status === "done" && !reduced ? `stroke-dashoffset 420ms ${MORPH} 140ms` : "none" }}
          />
        </svg>
      </span>
      <span className={layer} style={swap(status === "skipped", reduced)}>
        <span className="flex size-3.5 items-center justify-center rounded-full border-[1.5px] border-border">
          <span className="h-[1.5px] w-1.5 rounded-full bg-muted-foreground" />
        </span>
      </span>
      <span className={layer} style={swap(status === "failed", reduced)}>
        <span className="flex size-3.5 items-center justify-center rounded-full bg-red-500 text-white">
          <X className="size-2.5" strokeWidth={3} />
        </span>
      </span>
    </span>
  );
}

/** A note that folds open under its task and folds shut again, keeping its words while it closes. */
function Detail({ text, failed, reduced }: { text?: string; failed: boolean; reduced: boolean }) {
  const [last, setLast] = React.useState(text);
  if (text && text !== last) setLast(text);
  return (
    <span
      aria-hidden={!text || undefined}
      className="grid"
      style={{
        gridTemplateRows: text ? "1fr" : "0fr",
        opacity: text ? 1 : 0,
        transition: reduced ? "none" : `grid-template-rows 420ms ${MORPH}, opacity ${text ? "320ms" : "160ms"} ${MORPH}, color 300ms`,
      }}
    >
      <span className={`min-h-0 overflow-hidden text-[12px] leading-5 transition-colors duration-300 ${failed ? "text-red-500" : "text-muted-foreground"}`}>
        <span className="block pt-0.5">{text ?? last}</span>
      </span>
    </span>
  );
}

export function Plan({
  tasks,
  title = "Plan",
  open,
  defaultOpen = true,
  onOpenChange,
  collapseWhenDone = true,
  className = "",
  ...props
}: PlanProps) {
  const reduced = useReducedMotion();
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen);
  const [touched, setTouched] = React.useState(false);
  const panelId = React.useId();

  const done = tasks.filter((t) => t.status === "done").length;
  const settled = tasks.length > 0 && tasks.every((t) => t.status === "done" || t.status === "skipped" || t.status === "failed");
  const failed = tasks.some((t) => t.status === "failed");
  const expanded = open ?? ownOpen;

  // Fold away once everything is settled, unless the user has taken control or something failed.
  React.useEffect(() => {
    if (!collapseWhenDone || open !== undefined || touched || !settled || failed) return;
    const timer = window.setTimeout(() => setOwnOpen(false), 1200);
    return () => window.clearTimeout(timer);
  }, [collapseWhenDone, open, touched, settled, failed]);

  const toggle = () => {
    const next = !expanded;
    setTouched(true);
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggle}
        className={`cursor-pointer -mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-accent ${FOCUS}`}
      >
        <ListChecks aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-[13px] font-medium text-foreground">{title}</span>
        <span aria-hidden="true" className="ml-auto flex items-baseline font-mono text-[11.5px] tabular-nums text-muted-foreground">
          <NumberRoll value={done} duration={600} />
          &nbsp;of&nbsp;
          <NumberRoll value={tasks.length} duration={600} />
          <span
            className="grid"
            style={{
              gridTemplateColumns: settled ? "1fr" : "0fr",
              opacity: settled ? 1 : 0,
              transition: reduced ? "none" : `grid-template-columns 420ms ${MORPH}, opacity 300ms ${MORPH}`,
            }}
          >
            <span className="min-w-0 overflow-hidden whitespace-nowrap">&nbsp;done</span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {/* Outside the button, so its name stays the title. */}
      <span role="status" aria-live="polite" className="sr-only">
        {settled ? `${done} of ${tasks.length} done` : `${done} of ${tasks.length}`}
      </span>

      <div aria-hidden="true" className="mt-1.5 h-px w-full overflow-hidden bg-border">
        <div
          className="h-full bg-foreground transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
          style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }}
        />
      </div>

      <div
        id={panelId}
        inert={!expanded}
        className={`grid transition-[grid-template-rows,opacity] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ol aria-label={title} className="flex flex-col gap-0.5 pt-2.5">
            {tasks.map((task, i) => {
              const quiet = task.status === "done" || task.status === "skipped";
              return (
                <li key={task.id ?? `${i}-${task.label}`} className="flex gap-2.5 py-1">
                  <span className="mt-[3px] flex">
                    <Mark status={task.status} reduced={reduced} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-5">
                      {/* The strike draws itself across each line of the label, left to right. */}
                      <span
                        className={`bg-[linear-gradient(var(--border),var(--border))] bg-no-repeat [background-position:0_58%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] ${
                          quiet ? "text-muted-foreground" : task.status === "pending" ? "text-foreground/70" : "text-foreground"
                        }`}
                        style={{
                          backgroundSize: quiet ? "100% 1px" : "0% 1px",
                          transition: reduced ? "none" : `background-size 520ms ${MORPH} 120ms, color 300ms`,
                        }}
                      >
                        {task.label}
                      </span>
                      <span className="sr-only">, {STATUS_TEXT[task.status]}</span>
                    </span>
                    <Detail text={task.detail} failed={task.status === "failed"} reduced={reduced} />
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
