// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Tool call (tool-call)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { AlertCircle, Ban, ChevronDown, RotateCcw, Wrench } from "lucide-react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * TOOL CALL: one tool invocation, from arguments to result
 *
 *   preparing  the model is still writing the arguments; the
 *              panel eases taller as each one arrives
 *   running    a spinner opens in and the label morphs to
 *              "Running"
 *   done       the spinner blurs into a check that draws itself
 *              and the run time rolls up from zero; the output
 *              rises in as the panel eases to fit it
 *   error      the label morphs to "Failed" in red, with the
 *              message and a retry
 *   denied     the user said no
 *
 * One status pill throughout: its icon slot opens and closes,
 * icons swap through a blur and the label morphs, so it never
 * swaps out. Arguments render as readable fields; nested
 * values as JSON.
 * Pass renderOutput to show a result your own way.
 * ───────────────────────────────────────────────────────── */

export type ToolCallStatus = "preparing" | "running" | "done" | "error" | "denied";

export interface ToolCallProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** The tool's name as the model calls it, e.g. "search_flights". */
  name: string;
  /** A human label, e.g. "Search flights". */
  title?: string;
  status: ToolCallStatus;
  /** Arguments, possibly partial while preparing. */
  input?: unknown;
  /** The result, once done. */
  output?: unknown;
  /** Render the result yourself, e.g. as a small card. */
  renderOutput?: (output: unknown) => React.ReactNode;
  errorText?: string;
  onRetry?: () => void;
  /** How long it ran (ms). */
  duration?: number;
  icon?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const MORPH = "cubic-bezier(0.16,1,0.3,1)";
// A light that sweeps across the label. A mask, not a text clip, so it reaches letters that are mid-morph.
const SHEEN =
  "text-foreground [mask-image:linear-gradient(90deg,rgb(0_0_0/0.45)_35%,#000_50%,rgb(0_0_0/0.45)_65%)] [mask-size:200%_100%] animate-[ui-sheen_1.4s_linear_infinite] motion-reduce:animate-none motion-reduce:[mask-image:none] motion-reduce:text-foreground/70";
const LABELS: Record<ToolCallStatus, string> = { preparing: "Preparing", running: "Running", done: "Done", error: "Failed", denied: "Denied" };

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

function DrawnCheck({ drawn, reduced }: { drawn: boolean; reduced: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{ strokeDashoffset: drawn ? 0 : 1, transition: drawn && !reduced ? `stroke-dashoffset 420ms ${MORPH} 120ms` : "none" }}
      />
    </svg>
  );
}

/** The run time, in the unit that reads best; it rolls up from zero when the call has just finished. */
function Duration({ ms, rollIn }: { ms: number; rollIn: boolean }) {
  const from = rollIn ? 0 : undefined;
  if (ms < 1000) return <NumberRoll value={Math.round(ms)} suffix="ms" from={from} />;
  if (ms < 60000) return <NumberRoll value={Math.round(ms / 100) / 10} format={ONE_DECIMAL} suffix="s" from={from} />;
  return (
    <>
      <NumberRoll value={Math.floor(ms / 60000)} suffix="m" from={from} />
      &nbsp;
      <NumberRoll value={Math.round((ms % 60000) / 1000)} suffix="s" from={from} />
    </>
  );
}
const ONE_DECIMAL = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function Value({ value }: { value: unknown }) {
  if (typeof value === "string") return <span className="break-words text-foreground">{value}</span>;
  if (typeof value === "number" || typeof value === "boolean" || value === null)
    return <span className="font-mono text-[12px] text-foreground">{String(value)}</span>;
  return <span className="break-all font-mono text-[11.5px] text-muted-foreground">{JSON.stringify(value)}</span>;
}

function Fields({ value }: { value: unknown }) {
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return <p className="text-[12.5px] text-muted-foreground">No arguments</p>;
    return (
      <dl className="grid grid-cols-[minmax(0,auto)_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
        {entries.map(([key, v]) => (
          <React.Fragment key={key}>
            <dt className="truncate font-mono text-[11.5px] leading-5 text-muted-foreground">{key}</dt>
            <dd className="min-w-0 leading-5">
              <Value value={v} />
            </dd>
          </React.Fragment>
        ))}
      </dl>
    );
  }
  if (typeof value === "string") return <p className="whitespace-pre-wrap text-[12.5px] text-foreground">{value}</p>;
  return (
    <pre className="max-h-56 overflow-auto rounded-md bg-muted px-3 py-2 font-mono text-[11.5px] leading-5 text-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{children}</p>;
}

export function ToolCall({
  name,
  title,
  status,
  input,
  output,
  renderOutput,
  errorText,
  onRetry,
  duration,
  icon,
  open,
  defaultOpen = false,
  onOpenChange,
  className = "",
  ...props
}: ToolCallProps) {
  const reduced = useReducedMotion();
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen);
  const [errorSeen, setErrorSeen] = React.useState(false);
  const panelId = React.useId();
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = React.useState<number | null>(null);

  // Each time it finishes while you watch, the run time rolls up from zero (a finished call in history just sits).
  const [prevStatus, setPrevStatus] = React.useState(status);
  const [finishes, setFinishes] = React.useState(0);
  if (prevStatus !== status) {
    setPrevStatus(status);
    if (status === "done") setFinishes((n) => n + 1);
  }

  // The panel takes the height of what's in it, so arguments and output arriving ease it taller instead of jumping.
  React.useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setBodyHeight((h) => (h === el.offsetHeight ? h : el.offsetHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Failures open themselves once, so the reason is visible without a click.
  React.useEffect(() => {
    if (status === "error" && !errorSeen) {
      setErrorSeen(true);
      if (open === undefined) setOwnOpen(true);
    }
  }, [status, errorSeen, open]);

  const expanded = open ?? ownOpen;
  const toggle = () => {
    const next = !expanded;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  const showTime = status === "done" && duration !== undefined;
  const icons: Partial<Record<ToolCallStatus, React.ReactNode>> = {
    // Spins only while running, so a hidden spinner never keeps the page busy.
    running: (
      <span className={`size-3 rounded-full border-[1.5px] border-border border-t-foreground/70 motion-reduce:animate-none ${status === "running" ? "animate-spin" : ""}`} />
    ),
    done: (
      <span className="text-emerald-600 dark:text-emerald-400">
        <DrawnCheck drawn={status === "done"} reduced={reduced} />
      </span>
    ),
    error: <AlertCircle className="size-3.5" />,
    denied: <Ban className="size-3.5" />,
  };
  const badge = (
    <span
      className={`flex items-center text-[12px] transition-colors duration-300 ${status === "error" ? "font-medium text-red-500" : status === "preparing" ? "font-medium" : "text-muted-foreground"}`}
    >
      <span
        aria-hidden="true"
        className="relative flex h-3.5 shrink-0 items-center justify-center"
        style={{
          width: status === "preparing" ? 0 : 14,
          marginRight: status === "preparing" ? 0 : 5,
          transition: reduced ? "none" : `width 380ms ${MORPH}, margin 380ms ${MORPH}`,
        }}
      >
        {(Object.keys(icons) as ToolCallStatus[]).map((s) => (
          <span key={s} className="absolute inset-0 flex items-center justify-center" style={swap(s === status, reduced)}>
            {icons[s]}
          </span>
        ))}
      </span>
      <span className={status === "preparing" ? SHEEN : ""}>
        <TextMorph>{showTime ? "" : LABELS[status]}</TextMorph>
      </span>
      {duration !== undefined && (
        <span
          aria-hidden={!showTime || undefined}
          className="grid"
          style={{
            gridTemplateColumns: showTime ? "1fr" : "0fr",
            opacity: showTime ? 1 : 0,
            transition: reduced ? "none" : `grid-template-columns 420ms ${MORPH}, opacity 300ms ${MORPH}`,
          }}
        >
          <span className="flex min-w-0 whitespace-nowrap tabular-nums [clip-path:inset(-4px_0)]">
            <Duration key={finishes} ms={duration} rollIn={finishes > 0 && !reduced} />
          </span>
        </span>
      )}
    </span>
  );

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-background ${className}`} {...props}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggle}
        className={`cursor-pointer flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/60 ${FOCUS}`}
      >
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon ?? <Wrench className="size-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-foreground">{title ?? name}</span>
          {title && <span className="block truncate font-mono text-[11px] text-muted-foreground">{name}</span>}
        </span>
        <span role="status" aria-live="polite" className="shrink-0">
          {badge}
        </span>
        <ChevronDown aria-hidden="true" className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
      </button>

      <div
        id={panelId}
        inert={!expanded}
        className="overflow-hidden"
        style={{
          height: expanded ? (bodyHeight ?? "auto") : 0,
          opacity: expanded ? 1 : 0,
          transition: reduced || bodyHeight === null ? "none" : `height 420ms ${MORPH}, opacity 300ms ${MORPH}`,
        }}
      >
        <div ref={bodyRef}>
          <div className="flex flex-col gap-4 border-t border-border px-3 py-3">
            {input !== undefined && (
              <section>
                <Label>Input</Label>
                <Fields value={input} />
              </section>
            )}

            {status === "done" && output !== undefined && (
              <section className="animate-[ui-fade-up_300ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none">
                <Label>Output</Label>
                {renderOutput ? renderOutput(output) : <Fields value={output} />}
              </section>
            )}

            {status === "error" && (
              <section className="flex items-start justify-between gap-3 animate-[ui-fade-up_300ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none">
                <p className="text-[12.5px] leading-5 text-red-500">{errorText ?? "The tool failed."}</p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className={`cursor-pointer flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-accent ${FOCUS}`}
                  >
                    <RotateCcw aria-hidden="true" className="size-3" />
                    Retry
                  </button>
                )}
              </section>
            )}

            {status === "denied" && <p className="text-[12.5px] text-muted-foreground">You declined this action, so it didn’t run.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
