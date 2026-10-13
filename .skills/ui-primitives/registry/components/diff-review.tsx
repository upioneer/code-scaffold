// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Diff review (diff-review)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { X } from "lucide-react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * DIFF REVIEW: accept or reject what the AI changed
 *
 *   pending   the change inline: removed words struck in red,
 *             added words in green; Reject and Accept
 *   accepted  the text resolves in place: removed words shrink
 *             out of the sentence and added ones lose their
 *             green; Accept morphs to "Accepted" as its check
 *             draws itself, Reject folds away, Undo opens in
 *   rejected  the same in reverse: the added words shrink away
 *             and the struck ones come back as plain text
 *
 * The header count rolls ("3 to review" → "2 of 3 accepted").
 * Give it before and after; it works out the difference by word
 * (prose) or by line (code). Accept or reject one at a time, or
 * all at once. Works controlled or on its own; onComplete fires
 * when nothing is left to review.
 * ───────────────────────────────────────────────────────── */

export type ChangeDecision = "pending" | "accepted" | "rejected";

export interface DiffChange {
  id: string;
  before: string;
  after: string;
  /** Where it is, e.g. "Paragraph 2" or a file name. */
  label?: string;
}

export interface DiffReviewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  changes: DiffChange[];
  /** Compare word by word (prose) or line by line (code). */
  mode?: "words" | "lines";
  decisions?: Record<string, ChangeDecision>;
  defaultDecisions?: Record<string, ChangeDecision>;
  /** Every decision after a change (one call for Accept all). */
  onDecisionsChange?: (decisions: Record<string, ChangeDecision>) => void;
  onDecisionChange?: (id: string, decision: ChangeDecision) => void;
  /** Called when the last pending change gets a decision. */
  onComplete?: (decisions: Record<string, ChangeDecision>) => void;
  /** Show the decisions without Undo, e.g. once they've been sent. */
  readOnly?: boolean;
  title?: string;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const SMALL = `inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition-colors ${FOCUS}`;
const MORPH = "cubic-bezier(0.16,1,0.3,1)";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

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
      <span className="flex min-w-0 items-center whitespace-nowrap [clip-path:inset(-4px)]">{children}</span>
    </span>
  );
}

function DrawnCheck({ drawn, reduced }: { drawn: boolean; reduced: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{ strokeDashoffset: drawn ? 0 : 1, transition: drawn && !reduced ? `stroke-dashoffset 420ms ${MORPH} 120ms` : "none" }}
      />
    </svg>
  );
}

type Op = { kind: "same" | "add" | "remove"; text: string };

/** Longest-common-subsequence diff over tokens; falls back to a full replace for very large inputs. */
function diff(a: string[], b: string[]): Op[] {
  if (a.length * b.length > 250_000) {
    return [...a.map((text) => ({ kind: "remove" as const, text })), ...b.map((text) => ({ kind: "add" as const, text }))];
  }
  const dp = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ kind: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ kind: "remove", text: a[i++] });
    else ops.push({ kind: "add", text: b[j++] });
  }
  while (i < a.length) ops.push({ kind: "remove", text: a[i++] });
  while (j < b.length) ops.push({ kind: "add", text: b[j++] });
  return ops;
}

type Run = { kind: "same"; tokens: string[] } | { kind: "change"; removed: string[]; added: string[] };

/** Group ops into unchanged runs and change runs (everything removed, then everything added). */
function toRuns(ops: Op[]): Run[] {
  const runs: Run[] = [];
  for (const op of ops) {
    const last = runs[runs.length - 1];
    if (op.kind === "same") {
      if (last?.kind === "same") last.tokens.push(op.text);
      else runs.push({ kind: "same", tokens: [op.text] });
    } else {
      let run = last;
      if (run?.kind !== "change") {
        run = { kind: "change", removed: [], added: [] };
        runs.push(run);
      }
      (op.kind === "remove" ? run.removed : run.added).push(op.text);
    }
  }
  return runs;
}

/** Fold short unchanged bits ("to", a space) between two changes into them, so a rewrite reads as one phrase. */
function absorbSmall(runs: Run[]): Run[] {
  const out: Run[] = [];
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const prev = out[out.length - 1];
    const next = runs[i + 1];
    if (run.kind === "same" && prev?.kind === "change" && next?.kind === "change" && run.tokens.join("").trim().length <= 3) {
      prev.removed.push(...run.tokens, ...next.removed);
      prev.added.push(...run.tokens, ...next.added);
      i++;
    } else if (run.kind === "change" && prev?.kind === "change") {
      prev.removed.push(...run.removed);
      prev.added.push(...run.added);
    } else out.push(run.kind === "same" ? { kind: "same", tokens: [...run.tokens] } : { kind: "change", removed: [...run.removed], added: [...run.added] });
  }
  return out;
}

const words = (s: string) => s.split(/(\s+|[.,;:!?()"“”])/).filter(Boolean);
const lines = (s: string) => s.split("\n");

/** Words that leave shrink out of the sentence (their font size eases to nothing, so the line closes up around them). */
const gone = (out: boolean, reduced: boolean): React.CSSProperties => ({
  fontSize: out ? 0 : undefined,
  opacity: out ? 0 : 1,
  transition: reduced ? "none" : `font-size 460ms ${MORPH}, opacity 220ms ${MORPH}, background-color 300ms, color 300ms, text-decoration-color 300ms, margin 460ms ${MORPH}`,
});

function InlineDiff({ before, after, decision, reduced }: { before: string; after: string; decision: ChangeDecision; reduced: boolean }) {
  const runs = React.useMemo(() => absorbSmall(toRuns(diff(words(before), words(after)))), [before, after]);
  const pending = decision === "pending";
  return (
    <p className={`text-[13.5px] leading-relaxed transition-colors duration-300 ${decision === "rejected" ? "text-muted-foreground" : "text-foreground"}`}>
      {runs.map((run, i) =>
        run.kind === "same" ? (
          <React.Fragment key={i}>{run.tokens.join("")}</React.Fragment>
        ) : (
          <React.Fragment key={i}>
            {run.removed.length > 0 && (
              <del
                aria-hidden={decision === "accepted" || undefined}
                className={`rounded-[3px] ${pending ? "bg-red-500/10 text-red-600 decoration-red-500/50 dark:text-red-400" : "bg-transparent text-inherit decoration-transparent no-underline"}`}
                style={gone(decision === "accepted", reduced)}
              >
                {run.removed.join("")}
              </del>
            )}
            {run.added.length > 0 && (
              <ins
                aria-hidden={decision === "rejected" || undefined}
                className={`rounded-[3px] no-underline ${pending ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-transparent text-inherit"}`}
                style={{ ...gone(decision === "rejected", reduced), marginLeft: pending && run.removed.length > 0 ? 2 : 0 }}
              >
                {run.added.join("")}
              </ins>
            )}
          </React.Fragment>
        )
      )}
    </p>
  );
}

function LineDiff({ before, after, decision, reduced }: { before: string; after: string; decision: ChangeDecision; reduced: boolean }) {
  const ops = React.useMemo(
    () =>
      toRuns(diff(lines(before), lines(after))).flatMap((run): Op[] =>
        run.kind === "same"
          ? run.tokens.map((text) => ({ kind: "same", text }))
          : [...run.removed.map((text) => ({ kind: "remove" as const, text })), ...run.added.map((text) => ({ kind: "add" as const, text }))]
      ),
    [before, after]
  );
  const pending = decision === "pending";
  return (
    <pre className={`overflow-x-auto font-mono text-[12px] leading-5 transition-colors duration-300 ${decision === "rejected" ? "text-muted-foreground" : "text-foreground"}`}>
      {ops.map((op, i) => {
        // Lines that don't survive the decision fold shut; the ones that do lose their tint and gutter.
        const out = (op.kind === "remove" && decision === "accepted") || (op.kind === "add" && decision === "rejected");
        const tint = pending && op.kind !== "same";
        return (
          <span
            key={i}
            aria-hidden={out || undefined}
            className="grid"
            style={{ gridTemplateRows: out ? "0fr" : "1fr", opacity: out ? 0 : 1, transition: reduced ? "none" : `grid-template-rows 420ms ${MORPH}, opacity 200ms ${MORPH}` }}
          >
            <span
              className={`flex min-h-0 overflow-hidden transition-colors duration-300 ${
                tint ? (op.kind === "add" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400") : ""
              }`}
            >
              <span aria-hidden="true" className="w-5 shrink-0 select-none pl-1.5 text-muted-foreground transition-opacity duration-300" style={{ opacity: tint ? 1 : 0 }}>
                {op.kind === "add" ? "+" : op.kind === "remove" ? "−" : " "}
              </span>
              <span className="pr-3">{op.text || " "}</span>
              {pending && <span className="sr-only">{op.kind === "add" ? " (added)" : op.kind === "remove" ? " (removed)" : ""}</span>}
            </span>
          </span>
        );
      })}
    </pre>
  );
}

export function DiffReview({
  changes,
  mode = "words",
  decisions,
  defaultDecisions = {},
  onDecisionsChange,
  onDecisionChange,
  onComplete,
  readOnly = false,
  title = "Suggested changes",
  className = "",
  ...props
}: DiffReviewProps) {
  const reduced = useReducedMotion();
  const [own, setOwn] = React.useState<Record<string, ChangeDecision>>(defaultDecisions);
  const current = decisions ?? own;
  // Where focus goes after a decision: the button that just folded away hands it to the one that took its place.
  const buttons = React.useRef(new Map<string, HTMLButtonElement | null>());
  const focusNext = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    if (!focusNext.current) return;
    buttons.current.get(focusNext.current)?.focus({ preventScroll: true });
    focusNext.current = null;
  });
  const decisionOf = (id: string) => current[id] ?? "pending";

  const commit = (ids: string[], decision: ChangeDecision) => {
    const next = { ...current, ...Object.fromEntries(ids.map((id) => [id, decision])) };
    if (decisions === undefined) setOwn(next);
    onDecisionsChange?.(next);
    ids.forEach((id) => onDecisionChange?.(id, decision));
    if (decision !== "pending" && changes.every((c) => (next[c.id] ?? "pending") !== "pending")) onComplete?.(next);
  };
  const decide = (id: string, decision: ChangeDecision) => {
    const hadFocus = [...buttons.current.entries()].some(([key, el]) => key.startsWith(`${id}:`) && el === document.activeElement);
    if (hadFocus) focusNext.current = decision === "pending" ? `${id}:${decisionOf(id) === "rejected" ? "reject" : "accept"}` : `${id}:undo`;
    commit([id], decision);
  };
  const decideAll = (decision: ChangeDecision) =>
    commit(changes.filter((c) => decisionOf(c.id) === "pending").map((c) => c.id), decision);

  const pending = changes.filter((c) => decisionOf(c.id) === "pending").length;
  const accepted = changes.filter((c) => decisionOf(c.id) === "accepted").length;

  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="mb-3 flex min-h-7 flex-wrap items-center justify-between gap-2">
        <p className="flex items-baseline gap-[0.3em] text-[13px] font-medium text-foreground">
          {title}
          {/* "3 to review" → "2 of 3 accepted": the count rolls and the words morph. */}
          <span aria-hidden="true" className="inline-flex items-baseline font-normal tabular-nums text-muted-foreground">
            <NumberRoll value={pending > 0 ? pending : accepted} duration={600} />
            <Reveal show={pending === 0} reduced={reduced}>
              &nbsp;of&nbsp;
              <NumberRoll value={changes.length} duration={600} />
            </Reveal>
            &nbsp;
            <TextMorph>{pending > 0 ? "to review" : "accepted"}</TextMorph>
          </span>
          <span role="status" aria-live="polite" className="sr-only">
            {pending > 0 ? `${pending} to review` : `${accepted} of ${changes.length} accepted`}
          </span>
        </p>
        {!readOnly && (
          <Reveal show={pending > 1} reduced={reduced}>
            <span className="flex gap-1 p-0.5">
              <button type="button" inert={pending < 2} onClick={() => decideAll("rejected")} className={`cursor-pointer ${SMALL} text-muted-foreground hover:bg-accent hover:text-foreground`}>
                Reject all
              </button>
              <button type="button" inert={pending < 2} onClick={() => decideAll("accepted")} className={`cursor-pointer ${SMALL} bg-primary text-primary-foreground hover:bg-primary/90`}>
                Accept all
              </button>
            </span>
          </Reveal>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {changes.map((change) => {
          const decision = decisionOf(change.id);
          const open = decision === "pending" && !readOnly;
          const name = change.label ?? "change";
          const ref = (key: string) => (el: HTMLButtonElement | null) => {
            buttons.current.set(`${change.id}:${key}`, el);
          };
          return (
            <li key={change.id} className={`overflow-hidden rounded-xl border transition-colors duration-300 ${decision === "pending" ? "border-border" : "border-border/60"}`}>
              <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border/60 py-1 pl-3 pr-1.5">
                <span className="truncate text-[11.5px] text-muted-foreground">{change.label ?? "Change"}</span>
                {/* The button you press becomes the answer: "Accept" morphs to "Accepted" while the other folds away. */}
                <span className="flex shrink-0 items-center">
                  <Reveal show={decision === "rejected" || open} reduced={reduced}>
                    <span className="block p-0.5">
                      <button
                        ref={ref("reject")}
                        type="button"
                        inert={!open}
                        aria-label={`Reject ${name}`}
                        onClick={() => decide(change.id, "rejected")}
                        className={`cursor-pointer ${SMALL} ${open ? "text-muted-foreground hover:bg-accent hover:text-foreground" : "text-muted-foreground"}`}
                      >
                        <X aria-hidden="true" className="size-3.5" />
                        <TextMorph>{decision === "rejected" ? "Rejected" : "Reject"}</TextMorph>
                      </button>
                    </span>
                  </Reveal>
                  <Reveal show={decision === "accepted" || open} reduced={reduced}>
                    <span className="block p-0.5">
                      <button
                        ref={ref("accept")}
                        type="button"
                        inert={!open}
                        aria-label={`Accept ${name}`}
                        onClick={() => decide(change.id, "accepted")}
                        className={`cursor-pointer ${SMALL} ${open ? "text-foreground hover:bg-accent" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        <span aria-hidden="true" className="relative flex size-3.5 items-center justify-center">
                          {/* The plain check fades as a green one draws itself over it. */}
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            className="absolute size-3.5"
                            style={{ opacity: open ? 1 : 0, transition: reduced ? "none" : `opacity 200ms ${MORPH}` }}
                          >
                            <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center">
                            <DrawnCheck drawn={decision === "accepted"} reduced={reduced} />
                          </span>
                        </span>
                        <TextMorph>{decision === "accepted" ? "Accepted" : "Accept"}</TextMorph>
                      </button>
                    </span>
                  </Reveal>
                  {!readOnly && (
                    <Reveal show={decision !== "pending"} reduced={reduced}>
                      <span className="block p-0.5 pl-1.5">
                        <button
                          ref={ref("undo")}
                          type="button"
                          inert={decision === "pending"}
                          onClick={() => decide(change.id, "pending")}
                          className={`cursor-pointer rounded px-1 text-[12px] font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground ${FOCUS}`}
                        >
                          Undo
                        </button>
                      </span>
                    </Reveal>
                  )}
                </span>
              </div>
              <div className={mode === "lines" ? "py-2" : "px-3 py-2.5"}>
                {mode === "lines" ? (
                  <LineDiff before={change.before} after={change.after} decision={decision} reduced={reduced} />
                ) : (
                  <InlineDiff before={change.before} after={change.after} decision={decision} reduced={reduced} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
