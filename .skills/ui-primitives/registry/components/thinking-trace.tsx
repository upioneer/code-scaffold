// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Thinking trace (thinking-trace)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { AlertCircle, ChevronDown, CircleSlash, Globe, Search, Sparkle, X } from "lucide-react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * THINKING TRACE: an expandable record of what an agent did
 *
 *   steps      a checklist: spinner on the live step, which blurs
 *              into a check that draws itself when it's done
 *   reasoning  sentences of reasoning
 *   search     the query, then the sources read
 *   tools      tool calls: reads, edits with +/− counts, commands
 *
 * The header never swaps: "Thinking 6s" morphs into "Thought for
 * 6s" (the seconds roll as they pass), "Searching the web" into
 * "Searched the web", the sparkle into an alert on error. The
 * list eases taller as steps arrive.
 *
 * Drive it from your stream: pass the steps you have so far and a
 * status. It opens while running, folds away once done (stays open
 * on error so the failure is visible), and can always be reopened.
 * ───────────────────────────────────────────────────────── */

export type ThinkingVariant = "steps" | "reasoning" | "search" | "tools";
export type ThinkingStatus = "running" | "done" | "error" | "cancelled";
export type ThinkingStepStatus = "pending" | "running" | "done" | "error";

export interface ThinkingStep {
  /** A step, a sentence of reasoning, a source title or a tool name. */
  label: string;
  /** Supporting text: a count, a domain or a file path. */
  detail?: string;
  /** Makes the row a link, e.g. a search source. */
  href?: string;
  /** Replaces the row's default mark, e.g. a site favicon. */
  icon?: React.ReactNode;
  /** Defaults to "running" for the last step while running, "done" otherwise. */
  status?: ThinkingStepStatus;
  /** Lines added and removed, for edit tool calls. */
  additions?: number;
  deletions?: number;
}

export interface ThinkingTraceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  steps: ThinkingStep[];
  variant?: ThinkingVariant;
  status?: ThinkingStatus;
  /** Header while running. Defaults per variant, e.g. "Searching the web". */
  label?: string;
  /** Header once settled. Defaults to e.g. "Thought for 6s" when timing is known. */
  doneLabel?: string;
  /** When the work started (ms). Shows a live timer and times the done label. */
  startedAt?: number;
  /** How long it took (ms), if your stream reports it. */
  duration?: number;
  /** The search query, shown above the sources. */
  query?: string;
  /** Items not listed, shown as "+N more". */
  more?: number;
  /** Replaces the sparkle in the header. */
  icon?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Makes rows without an href clickable, e.g. to show a tool's output. */
  onStepClick?: (step: ThinkingStep, index: number) => void;
}

const RUNNING_LABEL: Record<ThinkingVariant, string> = {
  steps: "Thinking",
  reasoning: "Thinking",
  search: "Searching the web",
  tools: "Running tools",
};

const SOURCE_TONES = ["bg-blue-600", "bg-orange-500", "bg-emerald-600", "bg-violet-600"];
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const ROW = "flex min-h-7 w-full gap-2 rounded-md px-1.5 py-0.5 text-left";
const MORPH = "cubic-bezier(0.16,1,0.3,1)";
// A light that sweeps across the label. A mask, not a text clip, so it reaches letters that are mid-morph.
const SHEEN =
  "text-foreground [mask-image:linear-gradient(90deg,rgb(0_0_0/0.45)_35%,#000_50%,rgb(0_0_0/0.45)_65%)] [mask-size:200%_100%] animate-[ui-sheen_1.4s_linear_infinite] motion-reduce:animate-none motion-reduce:[mask-image:none] motion-reduce:text-foreground/70";
const TWO_DIGITS = { minimumIntegerDigits: 2 };

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
      <span className="min-w-0 whitespace-nowrap [clip-path:inset(-4px_0)]">{children}</span>
    </span>
  );
}

/** Seconds that roll up as they pass; minutes slide open at the first minute. */
function Elapsed({ ms, reduced }: { ms: number; reduced: boolean }) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  return (
    <span className="inline-flex items-baseline">
      <Reveal show={minutes > 0} reduced={reduced}>
        <NumberRoll value={minutes} suffix="m" duration={500} />
        &nbsp;
      </Reveal>
      <NumberRoll value={minutes ? total % 60 : total} format={minutes ? TWO_DIGITS : undefined} suffix="s" direction="up" duration={500} />
    </span>
  );
}

function StepCheck({ drawn, reduced }: { drawn: boolean; reduced: boolean }) {
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
        style={{ strokeDashoffset: drawn ? 0 : 1, transition: drawn && !reduced ? `stroke-dashoffset 380ms ${MORPH} 100ms` : "none" }}
      />
    </svg>
  );
}

function toneFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return SOURCE_TONES[Math.abs(hash) % SOURCE_TONES.length];
}

function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

/** Spins only while it's showing, so a faded-out spinner never keeps the page busy. */
function Spinner({ spinning = true }: { spinning?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`size-3 shrink-0 rounded-full border-[1.5px] border-border border-t-foreground/70 motion-reduce:animate-none ${spinning ? "animate-spin" : ""}`}
    />
  );
}

export function ThinkingTrace({
  steps,
  variant = "steps",
  status = "done",
  label,
  doneLabel,
  startedAt,
  duration,
  query,
  more,
  icon,
  open,
  defaultOpen,
  onOpenChange,
  onStepClick,
  className = "",
  ...props
}: ThinkingTraceProps) {
  const reduced = useReducedMotion();
  const running = status === "running";
  const [autoOpen, setAutoOpen] = React.useState(running);
  const [userOpen, setUserOpen] = React.useState<boolean | undefined>(defaultOpen);
  const expanded = open ?? userOpen ?? autoOpen;
  const panelId = React.useId();
  // Rows present on first render stagger in; rows streamed in later appear as they arrive.
  const initialCount = React.useRef(steps.length);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = React.useState<number | null>(null);

  // The panel takes the height of its list, so each new step eases it taller instead of jumping.
  React.useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => setListHeight((h) => (h === el.offsetHeight ? h : el.offsetHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Live timer while running; remember when it settled so the done label can say how long it took.
  const [now, setNow] = React.useState(startedAt ?? 0);
  const [endedAt, setEndedAt] = React.useState<number | undefined>(undefined);
  React.useEffect(() => {
    if (!running) {
      setEndedAt((prev) => prev ?? Date.now());
      return;
    }
    setEndedAt(undefined);
    if (startedAt === undefined) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running, startedAt]);

  // Open while working; fold away after it settles, except on error so the failure stays visible.
  React.useEffect(() => {
    if (running || status === "error") {
      setAutoOpen(true);
      return;
    }
    const timer = window.setTimeout(() => setAutoOpen(false), 900);
    return () => window.clearTimeout(timer);
  }, [running, status]);

  const toggle = () => {
    const next = !expanded;
    if (open === undefined) setUserOpen(next);
    onOpenChange?.(next);
  };

  const took = duration ?? (startedAt !== undefined && endedAt !== undefined ? endedAt - startedAt : undefined);
  // "Thought for" keeps the timer beside it, so the seconds that ran become the answer.
  const timed = status === "done" && !doneLabel && (variant === "steps" || variant === "reasoning") && took !== undefined;
  const settledLabel =
    status === "error"
      ? "Couldn’t finish"
      : status === "cancelled"
        ? "Stopped"
        : variant === "search"
          ? "Searched the web"
          : variant === "tools"
            ? `Ran ${steps.length} ${steps.length === 1 ? "tool" : "tools"}`
            : timed
              ? "Thought for"
              : "Thought it through";
  const text = running ? (label ?? RUNNING_LABEL[variant]) : (doneLabel ?? settledLabel);
  const showTime = (running && startedAt !== undefined) || timed;
  const time = running ? now - (startedAt ?? now) : (took ?? 0);
  const spoken = running ? text : timed ? `${text} ${formatDuration(time)}` : text;

  const headerIcons: Record<"sparkle" | "error" | "cancelled", React.ReactNode> = {
    sparkle: <Sparkle className="size-4" fill="currentColor" strokeWidth={0} />,
    error: <AlertCircle className="size-4 text-red-500" />,
    cancelled: <CircleSlash className="size-4" />,
  };
  const headerKey = status === "error" ? "error" : status === "cancelled" ? "cancelled" : "sparkle";

  return (
    <div className={`flex w-full flex-col ${className}`} {...props}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={toggle}
        className={`cursor-pointer -mx-1.5 flex w-fit max-w-full items-center gap-2 rounded-lg px-1.5 py-1 text-[13px] font-medium transition-colors duration-100 hover:bg-accent ${FOCUS}`}
      >
        <span aria-hidden="true" className={`relative flex size-4 shrink-0 transition-colors duration-200 ${running ? "text-foreground/70" : "text-muted-foreground"}`}>
          {icon ??
            (Object.keys(headerIcons) as (keyof typeof headerIcons)[]).map((k) => (
              <span key={k} className="absolute inset-0 flex items-center justify-center" style={swap(k === headerKey, reduced)}>
                {headerIcons[k]}
              </span>
            ))}
        </span>
        <span className="flex min-w-0 items-baseline">
          <span className={`min-w-0 truncate transition-colors duration-300 ${running ? SHEEN : "text-foreground/75"}`}>
            <TextMorph>{text}</TextMorph>
          </span>
          {(startedAt !== undefined || duration !== undefined) && (
            <Reveal show={showTime} reduced={reduced} className="shrink-0">
              <span className="pl-1.5 text-[12.5px] font-normal tabular-nums text-muted-foreground">
                <Elapsed ms={time} reduced={reduced} />
              </span>
            </Reveal>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {/* Outside the button, so its name stays its label. Never the ticking timer. */}
      <span role="status" aria-live="polite" className="sr-only">
        {spoken}
      </span>

      <div
        id={panelId}
        inert={!expanded}
        className="overflow-hidden"
        style={{
          height: expanded ? (listHeight ?? "auto") : 0,
          opacity: expanded ? 1 : 0,
          transition: reduced || listHeight === null ? "none" : `height 420ms ${MORPH}, opacity 320ms ${MORPH}`,
        }}
      >
        <div ref={listRef}>
          <div className="relative ml-[5px] mt-1 pl-4">
            <span aria-hidden="true" className="absolute bottom-1.5 left-[3px] top-0 w-px bg-border" />
            <ul className="flex flex-col gap-0.5 py-1">
              {query && (
                <li className="flex h-7 items-center gap-2 px-1.5 text-[12.5px] text-muted-foreground animate-[ui-fade-up_300ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none">
                  <Search className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{query}</span>
                </li>
              )}

              {steps.map((step, i) => {
                const last = i === steps.length - 1;
                const stepStatus: ThinkingStepStatus =
                  step.status ?? (last && running ? "running" : last && status === "error" ? "error" : "done");
                const failed = stepStatus === "error";
                const pending = stepStatus === "pending";
                const align = variant === "reasoning" ? "items-start" : "items-center";

                const mark =
                  variant === "steps" ? (
                    // Every mark is there at once; the one for this step's status shows, and they trade places through a blur.
                    <span aria-hidden="true" className={`relative flex size-3.5 shrink-0 items-center justify-center ${align === "items-start" ? "mt-px" : ""}`}>
                      <span className="absolute inset-0 flex items-center justify-center" style={swap(pending, reduced)}>
                        <span className="size-3 rounded-full border-[1.5px] border-border" />
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center" style={swap(stepStatus === "running", reduced)}>
                        <Spinner spinning={stepStatus === "running"} />
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center text-muted-foreground" style={swap(stepStatus === "done", reduced)}>
                        <StepCheck drawn={stepStatus === "done"} reduced={reduced} />
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center text-red-500" style={swap(failed, reduced)}>
                        <X className="size-3.5" strokeWidth={2.5} />
                      </span>
                    </span>
                  ) : variant === "search" ? (
                    step.icon ? (
                      <span aria-hidden="true" className="flex size-3.5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                        {step.icon}
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className={`flex size-3.5 shrink-0 items-center justify-center rounded-full text-white ${failed ? "bg-muted-foreground/40" : toneFor(step.detail ?? step.label)}`}
                      >
                        <Globe className="size-[9px]" strokeWidth={2.5} />
                      </span>
                    )
                  ) : null;

                const trailing =
                  variant === "search" || variant === "tools" ? (
                    <span className="ml-auto flex shrink-0 items-center pl-2">
                      <span
                        className="flex justify-end overflow-hidden"
                        style={{ width: stepStatus === "running" ? 12 : 0, ...swap(stepStatus === "running", reduced), transition: reduced ? "none" : `width 380ms ${MORPH}, opacity 260ms ${MORPH}, transform 380ms ${MORPH}, filter 260ms ${MORPH}` }}
                      >
                        <Spinner spinning={stepStatus === "running"} />
                      </span>
                      <Reveal show={failed} reduced={reduced}>
                        <span className="text-[11.5px] font-medium text-red-500">Failed</span>
                      </Reveal>
                    </span>
                  ) : null;

                const content = (
                  <>
                    {mark}
                    {variant === "tools" ? (
                      <>
                        <span className={`shrink-0 text-[12.5px] font-medium ${pending ? "text-muted-foreground" : "text-foreground"}`}>{step.label}</span>
                        {step.detail && <span className="min-w-0 truncate font-mono text-[11.5px] text-muted-foreground">{step.detail}</span>}
                      </>
                    ) : (
                      <>
                        <span
                          className={
                            variant === "reasoning"
                              ? "text-[12.5px] leading-relaxed text-muted-foreground"
                              : `min-w-0 truncate text-[12.5px] font-medium ${pending ? "text-muted-foreground" : "text-foreground"}`
                          }
                        >
                          {step.label}
                        </span>
                        {step.detail && <span className="shrink-0 text-[11.5px] text-muted-foreground">{step.detail}</span>}
                      </>
                    )}
                    {step.additions !== undefined && (
                      <span className="shrink-0 font-mono text-[11px] tabular-nums">
                        <span className="text-emerald-600">+{step.additions}</span> <span className="text-red-500">−{step.deletions ?? 0}</span>
                      </span>
                    )}
                    {trailing}
                  </>
                );
                const delay = i < initialCount.current ? i * 90 : 0;

                return (
                  <li
                    key={`${i}-${step.label}`}
                    className="animate-[ui-fade-up_320ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    {step.href ? (
                      <a href={step.href} target="_blank" rel="noreferrer" className={`${ROW} ${align} transition-colors duration-150 hover:bg-accent ${FOCUS}`}>
                        {content}
                      </a>
                    ) : onStepClick ? (
                      <button
                        type="button"
                        onClick={() => onStepClick(step, i)}
                        className={`${ROW} ${align} cursor-pointer transition-colors duration-150 hover:bg-accent ${FOCUS}`}
                      >
                        {content}
                      </button>
                    ) : (
                      <div className={`${ROW} ${align}`}>{content}</div>
                    )}
                  </li>
                );
              })}

              {more ? (
                <li className="px-1.5 pt-0.5 text-xs text-muted-foreground animate-[ui-fade-in_300ms_ease-out_both] motion-reduce:animate-none">+{more} more</li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
