// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Task log (task-log)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { AlertCircle, ChevronDown, FileCode2, RotateCcw } from "lucide-react";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * TASK LOG: what the agent did, task by task, as it does it
 *
 *   running   the task's title carries a sweep of light; its
 *             steps arrive one at a time on a Tactile trail,
 *             each opening to its height and rising out of a
 *             light blur, the newest one shimmering
 *   done      the title morphs into the past tense ("Finding
 *             project files" becomes "Found project files") and
 *             the sweep stops; the steps can fold away
 *   error     the title turns red behind an alert, keeping the
 *             steps that ran
 *   rerun     once every task is settled, "Run again" folds in
 *
 * Files in a step sit in small chips; counts and outcomes trail
 * after in a quieter grey. Feed it the tasks you have so far.
 * ───────────────────────────────────────────────────────── */

export type TaskLogStatus = "running" | "done" | "error";

export interface TaskLogStep {
  id: string;
  /** What happened, e.g. "Read" or "Searching \"app/page.tsx\"". */
  text: string;
  /** A file it touched, shown as a chip after the text. */
  file?: string;
  /** A quieter outcome after it, e.g. "0 errors". */
  detail?: string;
}

export interface TaskLogTask {
  id: string;
  /** While it runs, e.g. "Finding project files". */
  title: string;
  /** Once it's done, e.g. "Found project files". Defaults to title. */
  doneTitle?: string;
  icon?: React.ReactNode;
  status: TaskLogStatus;
  steps: TaskLogStep[];
}

export interface TaskLogProps extends React.HTMLAttributes<HTMLDivElement> {
  tasks: TaskLogTask[];
  /** Shows "Run again" once every task is settled. */
  onRerun?: () => void;
  rerunLabel?: string;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
// A light that sweeps across the label: a moving mask, so it also reaches letters that are mid-morph.
const SHEEN =
  "text-foreground [mask-image:linear-gradient(90deg,rgb(0_0_0/0.45)_35%,#000_50%,rgb(0_0_0/0.45)_65%)] [mask-size:200%_100%] animate-[ui-sheen_1.4s_linear_infinite] motion-reduce:animate-none motion-reduce:[mask-image:none]";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** Opens to its height and rises out of a blur the first time it appears (not when the log first renders). */
function Arrive({ animate, reduced, children }: { animate: boolean; reduced: boolean; children: React.ReactNode }) {
  const [shown, setShown] = React.useState(!animate || reduced);
  React.useEffect(() => {
    if (shown) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(() => setShown(true))));
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [shown]);
  return (
    <div
      className="grid"
      style={{
        gridTemplateRows: shown ? "1fr" : "0fr",
        opacity: shown ? 1 : 0,
        filter: shown ? "none" : "blur(4px)",
        transform: shown ? "none" : "translateY(4px)",
        transition: reduced ? "none" : `grid-template-rows 380ms ${EASE}, opacity 320ms ${EASE} 60ms, filter 320ms ${EASE} 60ms, transform 380ms ${EASE}`,
      }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function FileChip({ name }: { name: string }) {
  return (
    <span className="inline-flex h-5 max-w-full items-center gap-1 rounded-md bg-muted px-1.5 font-mono text-[11px] text-foreground/80">
      <FileCode2 aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{name}</span>
    </span>
  );
}

function Task({ task, animate, mounted, reduced }: { task: TaskLogTask; animate: boolean; mounted: boolean; reduced: boolean }) {
  const [open, setOpen] = React.useState(true);
  const listId = React.useId();
  const running = task.status === "running";
  const failed = task.status === "error";
  const title = running ? task.title : task.doneTitle ?? task.title;
  return (
    <li>
      <Arrive animate={animate} reduced={reduced}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
          className={`cursor-pointer group flex min-h-7 w-full items-center gap-2 rounded-md py-0.5 text-left text-[13px] ${FOCUS}`}
        >
          <span aria-hidden="true" className={`flex size-4 shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:stroke-[1.8] ${failed ? "text-red-500" : "text-muted-foreground"}`}>
            {failed ? <AlertCircle /> : task.icon}
          </span>
          <span className={`min-w-0 font-medium transition-colors duration-300 ${failed ? "text-red-600 dark:text-red-400" : running ? SHEEN : "text-foreground/80"}`}>
            <TextMorph>{title}</TextMorph>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="ml-auto size-3.5 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: reduced ? "none" : `transform 320ms ${EASE}, opacity 200ms` }}
          />
        </button>
      </Arrive>
      <div
        id={listId}
        inert={!open}
        className="grid"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0, transition: reduced ? "none" : `grid-template-rows 380ms ${EASE}, opacity ${open ? "280ms" : "140ms"} ${EASE}` }}
      >
        <ul className="min-h-0 overflow-hidden pb-1 pl-[24px]">
          {task.steps.map((step, i) => {
            const last = i === task.steps.length - 1;
            const live = running && last;
            return (
              <li key={step.id} className="relative">
                <Arrive animate={mounted} reduced={reduced}>
                  {/* The trail: a Tactile down from the task, branching to each step, the last one turning the corner. */}
                  <span aria-hidden="true" className="absolute -left-[16px] top-0 w-px bg-border" style={last ? { height: 10 } : { bottom: 0 }} />
                  <span aria-hidden="true" className={`absolute -left-[16px] top-[3px] h-[8px] w-[9px] border-b border-border ${last ? "rounded-bl-[5px] border-l" : ""}`} />
                  <div className="flex min-h-[26px] flex-wrap items-center gap-x-1.5 gap-y-1 py-[3px] text-[12.5px] leading-5 text-muted-foreground">
                    <span className={live ? SHEEN : ""}>{step.text}</span>
                    {step.file && <FileChip name={step.file} />}
                    {step.detail && <span className="text-muted-foreground/70">{step.detail}</span>}
                  </div>
                </Arrive>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}

export function TaskLog({ tasks, onRerun, rerunLabel = "Run again", className = "", ...props }: TaskLogProps) {
  const reduced = useReducedMotion();
  // Tasks and steps that exist on the first render just sit there; later ones arrive.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const settled = tasks.length > 0 && tasks.every((t) => t.status !== "running");
  const live = tasks.find((t) => t.status === "running");
  const lastStep = live?.steps[live.steps.length - 1];

  return (
    <div className={`w-full ${className}`} {...props}>
      <ol className="space-y-1">
        {tasks.map((t) => (
          <Task key={t.id} task={t} animate={mounted} mounted={mounted} reduced={reduced} />
        ))}
      </ol>

      {onRerun && (
        <div
          className="grid"
          style={{ gridTemplateRows: settled ? "1fr" : "0fr", opacity: settled ? 1 : 0, transition: reduced ? "none" : `grid-template-rows 380ms ${EASE}, opacity 300ms ${EASE}` }}
        >
          <div className="min-h-0 overflow-hidden">
            <button
              type="button"
              inert={!settled}
              onClick={onRerun}
              className={`cursor-pointer mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-accent ${FOCUS}`}
            >
              <RotateCcw aria-hidden="true" className="size-3.5 text-muted-foreground" />
              {rerunLabel}
            </button>
          </div>
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {live ? `${live.title}${lastStep ? `: ${lastStep.text}${lastStep.file ? ` ${lastStep.file}` : ""}` : ""}` : settled ? "All tasks finished" : ""}
      </p>
    </div>
  );
}
