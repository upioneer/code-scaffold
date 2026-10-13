// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Action receipts (action-receipt)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { Check, ChevronRight, RotateCcw, X } from "lucide-react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * ACTION RECEIPTS: what the agent did, and the way back
 *
 *   done      a quiet line per action: what happened, where;
 *             Undo with a ring that drains while you still can,
 *             folding away when the window closes
 *   undoing   the ring blurs into a spinner; "Undo" morphs to
 *             "Undoing"
 *   undone    a strike draws itself across the line; "Undone"
 *   failed    why it failed, and Retry
 *   stacked   three or more fold into "3 actions · Undo all",
 *             which opens into the list; the counts roll
 *
 * Undo is one button from first to last: its icon slot and label
 * change, it never gets swapped for another element.
 *
 * Feed it the actions your tools performed; it keeps the timing.
 * ───────────────────────────────────────────────────────── */

export type ReceiptStatus = "done" | "undoing" | "undone" | "failed";

export interface Receipt {
  id: string;
  /** What happened, e.g. "Added “Soft launch” to Saturday". */
  title: string;
  /** Where or when, e.g. "Calendar · 9:00 am". */
  detail?: string;
  icon?: React.ReactNode;
  status?: ReceiptStatus;
  error?: string;
  /** Until when it can be undone (ms timestamp). Without it, no Undo. */
  undoUntil?: number;
}

export interface ActionReceiptsProps extends React.HTMLAttributes<HTMLDivElement> {
  actions: Receipt[];
  onUndo?: (id: string) => void | Promise<void>;
  /** Defaults to undoing each undoable action. */
  onUndoAll?: () => void | Promise<void>;
  onRetry?: (id: string) => void;
  /** Fold into a summary from this many actions (0 never folds). */
  stackFrom?: number;
  /** How long the undo window is, for the ring (ms). */
  undoWindow?: number;
}

const EASE = "cubic-bezier(0.23,1,0.32,1)";
const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const LINK = `inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent ${FOCUS}`;

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

/** A piece of a line that opens out of nothing and folds back into it. */
function Reveal({ show, reduced, className = "", children }: { show: boolean; reduced: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span
      aria-hidden={!show || undefined}
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: show ? "1fr" : "0fr",
        opacity: show ? 1 : 0,
        filter: show ? "none" : "blur(3px)",
        transition: reduced ? "none" : `grid-template-columns 420ms ${MORPH}, opacity ${show ? "300ms" : "160ms"} ${MORPH}, filter 300ms ${MORPH}`,
      }}
    >
      <span className="flex min-w-0 items-center whitespace-nowrap [clip-path:inset(-4px_-2px)]">{children}</span>
    </span>
  );
}

/** Re-renders when the next undo window closes, so Undo disappears on time. */
function useUndoClock(actions: Receipt[]) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const next = actions.map((a) => a.undoUntil ?? 0).filter((t) => t > now).sort((a, b) => a - b)[0];
    if (!next) return;
    const timer = window.setTimeout(() => setNow(Date.now()), next - now + 20);
    return () => window.clearTimeout(timer);
  }, [actions, now]);
  return now;
}

/** A ring that drains from full to empty over the time left, with CSS only. */
function DrainRing({ until, window: total, reduced }: { until: number; window: number; reduced: boolean }) {
  const [start] = React.useState(() => Date.now());
  const left = Math.max(0, until - start);
  const elapsed = Math.max(0, total - left);
  const c = 2 * Math.PI * 5.5;
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5 -rotate-90">
      <circle cx="7" cy="7" r="5.5" fill="none" strokeWidth="1.5" className="stroke-border" />
      <circle
        cx="7"
        cy="7"
        r="5.5"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={c}
        className="stroke-foreground/70"
        style={
          reduced
            ? { strokeDashoffset: c * (elapsed / total) }
            : ({
                "--ui-ring": `${c}`,
                animation: `ui-drain ${total}ms linear -${elapsed}ms forwards`,
              } as React.CSSProperties)
        }
      />
    </svg>
  );
}

function Line({
  action,
  now,
  pending,
  undoWindow,
  reduced,
  onUndo,
  onRetry,
}: {
  action: Receipt;
  now: number;
  pending: boolean;
  undoWindow: number;
  reduced: boolean;
  onUndo?: (id: string) => void;
  onRetry?: (id: string) => void;
}) {
  const status = pending ? "undoing" : action.status ?? "done";
  const canUndo = status === "done" && Boolean(onUndo) && (action.undoUntil ?? 0) > now;
  const undone = status === "undone";
  const failed = status === "failed";

  // The one button's state: what it says and whether it does anything.
  const mode = status === "undoing" ? "undoing" : undone ? "undone" : failed && onRetry ? "retry" : canUndo ? "undo" : null;
  const [lastMode, setLastMode] = React.useState(mode);
  if (mode && mode !== lastMode) setLastMode(mode);
  const shown = mode ?? lastMode;
  const actionable = mode === "undo" || mode === "retry";
  const label = { undo: "Undo", undoing: "Undoing", undone: "Undone", retry: "Retry" };
  const layer = "absolute inset-0 flex items-center justify-center";

  return (
    <li className="flex min-h-10 items-center gap-2.5 py-1 animate-[ui-fade-up_320ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none">
      <span
        aria-hidden="true"
        className={`relative flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 [&_svg]:size-3.5 [&_svg]:stroke-[1.8] ${
          failed ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-muted text-muted-foreground"
        }`}
      >
        <span className={layer} style={swap(!failed, reduced)}>
          {action.icon ?? <Check />}
        </span>
        <span className={layer} style={swap(failed, reduced)}>
          <X />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px]">
          {/* The strike draws itself across the title, left to right. */}
          <span
            className={`bg-[linear-gradient(color-mix(in_oklab,currentColor_55%,transparent),color-mix(in_oklab,currentColor_55%,transparent))] bg-no-repeat [background-position:0_58%] ${undone ? "text-muted-foreground" : "text-foreground"}`}
            style={{ backgroundSize: undone ? "100% 1px" : "0% 1px", transition: reduced ? "none" : `background-size 480ms ${MORPH} 80ms, color 300ms` }}
          >
            {action.title}
          </span>
        </span>
        {(failed ? action.error : action.detail) && (
          <span className={`block truncate text-[11.5px] transition-colors duration-300 ${failed ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
            {failed ? action.error : action.detail}
          </span>
        )}
      </span>

      <span role="status" className="sr-only">
        {status === "undoing" ? `Undoing ${action.title}` : undone ? `Undone: ${action.title}` : failed ? `Failed: ${action.error ?? action.title}` : ""}
      </span>
      {shown && (
        <Reveal show={Boolean(mode)} reduced={reduced} className="shrink-0">
          <span className="block p-0.5">
            <button
              type="button"
              inert={!mode}
              aria-disabled={!actionable || undefined}
              aria-label={mode === "undo" ? `Undo: ${action.title}` : undefined}
              onClick={() => (mode === "undo" ? onUndo?.(action.id) : mode === "retry" ? onRetry?.(action.id) : undefined)}
              className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-colors ${FOCUS} ${
                actionable ? "text-foreground hover:bg-accent" : "cursor-default text-muted-foreground"
              }`}
            >
              <span aria-hidden="true" className="relative flex size-3.5 shrink-0 items-center justify-center">
                {/* Keyed by the window, so a fresh window drains from full; paused once it has faded out. */}
                <span className={`${layer} ${shown === "undo" ? "" : "[&_*]:[animation-play-state:paused]"}`} style={swap(shown === "undo", reduced)}>
                  <DrainRing key={action.undoUntil} until={action.undoUntil ?? 0} window={undoWindow} reduced={reduced} />
                </span>
                <span className={layer} style={swap(shown === "undoing", reduced)}>
                  <span className={`size-3 rounded-full border-[1.5px] border-border border-t-foreground/70 motion-reduce:animate-none ${shown === "undoing" ? "animate-spin" : ""}`} />
                </span>
                <span className={layer} style={swap(shown === "undone" || shown === "retry", reduced)}>
                  <RotateCcw className="size-3" />
                </span>
              </span>
              <TextMorph>{label[shown]}</TextMorph>
            </button>
          </span>
        </Reveal>
      )}
    </li>
  );
}

export function ActionReceipts({
  actions,
  onUndo,
  onUndoAll,
  onRetry,
  stackFrom = 3,
  undoWindow = 10_000,
  className = "",
  ...props
}: ActionReceiptsProps) {
  const reduced = useReducedMotion();
  const now = useUndoClock(actions);
  const [pending, setPending] = React.useState<Set<string>>(() => new Set());
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();

  const undo = async (id: string) => {
    if (!onUndo) return;
    setPending((p) => new Set(p).add(id));
    try {
      await onUndo(id);
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
    }
  };

  const undoable = actions.filter((a) => (a.status ?? "done") === "done" && (a.undoUntil ?? 0) > now && !pending.has(a.id));
  const undoAll = async () => {
    if (onUndoAll) {
      setPending(new Set(undoable.map((a) => a.id)));
      try {
        await onUndoAll();
      } finally {
        setPending(new Set());
      }
    } else await Promise.all(undoable.map((a) => undo(a.id)));
  };

  const stacked = stackFrom > 0 && actions.length >= stackFrom;
  const failed = actions.filter((a) => a.status === "failed").length;
  const undone = actions.filter((a) => a.status === "undone").length;
  const busy = pending.size > 0;

  const lines = (
    <ul aria-label="Actions taken">
      {actions.map((a) => (
        <Line key={a.id} action={a} now={now} pending={pending.has(a.id)} undoWindow={undoWindow} reduced={reduced} onUndo={onUndo ? undo : undefined} onRetry={onRetry} />
      ))}
    </ul>
  );

  if (!stacked) {
    return (
      <div className={`w-full ${className}`} {...props}>
        {lines}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="flex min-h-10 items-center gap-2.5">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
          className="cursor-pointer group flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span aria-hidden="true" className="flex shrink-0 items-center">
            {actions.slice(0, 3).map((a, i) => (
              <span
                key={a.id}
                className={`flex size-6 items-center justify-center rounded-full ring-2 ring-background [&_svg]:size-3.5 [&_svg]:stroke-[1.8] ${i ? "-ml-2" : ""} ${
                  a.status === "failed" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-muted text-muted-foreground"
                }`}
                style={{ zIndex: 3 - i }}
              >
                {a.status === "failed" ? <X /> : a.icon ?? <Check />}
              </span>
            ))}
          </span>
          {/* "4 actions · 1 failed · 2 undone": counts roll, and the extra parts open in as they apply. */}
          <span className="flex min-w-0 items-baseline truncate text-[13px] text-foreground">
            <NumberRoll value={actions.length} duration={600} />
            &nbsp;
            <TextMorph>{actions.length === 1 ? "action" : "actions"}</TextMorph>
            <Reveal show={failed > 0} reduced={reduced}>
              &nbsp;·&nbsp;
              <NumberRoll value={failed} duration={600} />
              &nbsp;failed
            </Reveal>
            <Reveal show={undone > 0} reduced={reduced}>
              &nbsp;·&nbsp;
              <NumberRoll value={undone} duration={600} />
              &nbsp;undone
            </Reveal>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:text-foreground motion-reduce:transition-none"
            style={{ transform: open ? "rotate(90deg)" : "none", transitionTimingFunction: EASE }}
          />
        </button>
        {onUndo && (
          // Opens while there's more than one thing to undo; says what it's doing while it does it.
          <Reveal show={undoable.length > 1 || busy} reduced={reduced} className="shrink-0">
            <span className="block p-0.5">
              <button
                type="button"
                inert={!(undoable.length > 1 || busy)}
                onClick={() => !busy && undoAll()}
                aria-disabled={busy || undefined}
                className={`${LINK} ${busy ? "cursor-default text-muted-foreground hover:bg-transparent" : ""}`}
              >
                <span aria-hidden="true" className="relative flex size-3 shrink-0 items-center justify-center">
                  <span className="absolute inset-0 flex items-center justify-center" style={swap(!busy, reduced)}>
                    <RotateCcw className="size-3" />
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center" style={swap(busy, reduced)}>
                    <span className={`size-3 rounded-full border-[1.5px] border-border border-t-foreground/70 motion-reduce:animate-none ${busy ? "animate-spin" : ""}`} />
                  </span>
                </span>
                <TextMorph>{busy ? "Undoing all" : "Undo all"}</TextMorph>
              </button>
            </span>
          </Reveal>
        )}
      </div>
      <div
        id={listId}
        inert={!open}
        className="grid"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", transition: reduced ? "none" : `grid-template-rows 380ms ${EASE}` }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="ml-3 border-l border-border pl-[18px]">{lines}</div>
        </div>
      </div>
    </div>
  );
}
