// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Thinking indicator (thinking-indicator)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * THINKING INDICATOR: the gap before the first token
 *
 *   orbit  a dot circling a Tactile ring
 *   dots   three dots in a soft wave
 *   pulse  a breathing dot
 *   scan   a bar sweeping a short track
 *
 * A label with a sweep of light and a timer whose seconds roll
 * ("Churning 44s") while running. When it's done the mark
 * blurs into a check that draws itself, the label morphs to
 * "Done in" and the time gains its tenths: "Done in 44.6s".
 * ───────────────────────────────────────────────────────── */

export type IndicatorVariant = "orbit" | "dots" | "pulse" | "scan";

export interface ThinkingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: IndicatorVariant;
  status?: "running" | "done";
  label?: string;
  doneLabel?: string;
  /** Start time (ms); shows a live timer. */
  startedAt?: number;
}

const MORPH = "cubic-bezier(0.16,1,0.3,1)";
// A light that sweeps across the label. A mask, not a text clip, so it reaches letters that are mid-morph.
const SHEEN =
  "text-foreground [mask-image:linear-gradient(90deg,rgb(0_0_0/0.45)_35%,#000_50%,rgb(0_0_0/0.45)_65%)] [mask-size:200%_100%] animate-[ui-sheen_1.4s_linear_infinite] motion-reduce:animate-none motion-reduce:[mask-image:none] motion-reduce:text-foreground/70";
const TENTHS = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
const WHOLE = { maximumFractionDigits: 0 };
const TWO_DIGITS = { minimumIntegerDigits: 2, maximumFractionDigits: 0 };

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

function formatElapsed(ms: number) {
  const s = Math.max(0, ms) / 1000;
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, "0")}s`;
}

/** Seconds that roll up as they pass; minutes slide open at the first minute; tenths join once it's settled. */
function Elapsed({ ms, settled, reduced }: { ms: number; settled: boolean; reduced: boolean }) {
  const total = Math.max(0, ms) / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = minutes ? Math.floor(total % 60) : settled ? Math.floor(total * 10) / 10 : Math.floor(total);
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <span
        className="grid"
        style={{ gridTemplateColumns: minutes ? "1fr" : "0fr", opacity: minutes ? 1 : 0, transition: reduced ? "none" : `grid-template-columns 420ms ${MORPH}, opacity 300ms ${MORPH}` }}
      >
        <span className="min-w-0 [clip-path:inset(-4px_0)]">
          <NumberRoll value={minutes} suffix="m" duration={500} />
          &nbsp;
        </span>
      </span>
      <NumberRoll value={seconds} format={minutes ? TWO_DIGITS : settled ? TENTHS : WHOLE} suffix="s" direction="up" duration={500} />
    </span>
  );
}

function Mark({ variant }: { variant: IndicatorVariant }) {
  if (variant === "dots")
    return (
      <span aria-hidden="true" className="flex h-4 items-center gap-[3px]">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1 rounded-full bg-foreground animate-[ui-bounce_1.2s_ease-in-out_infinite] motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    );
  if (variant === "pulse")
    return (
      <span aria-hidden="true" className="flex size-4 items-center justify-center">
        <span className="size-2.5 rounded-full bg-foreground animate-[ui-breathe_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
      </span>
    );
  if (variant === "scan")
    return (
      <span aria-hidden="true" className="flex h-4 items-center">
        <span className="relative h-[3px] w-6 overflow-hidden rounded-full bg-border">
          <span className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-foreground animate-[ui-scan_1.1s_cubic-bezier(0.45,0,0.55,1)_infinite] motion-reduce:animate-none" />
        </span>
      </span>
    );
  return (
    <span aria-hidden="true" className="relative flex size-4 items-center justify-center">
      <span className="absolute inset-[1.5px] rounded-full border border-border" />
      <span className="absolute inset-0 animate-spin [animation-duration:1.4s] motion-reduce:animate-none">
        <span className="absolute left-1/2 top-0 size-[5px] -translate-x-1/2 rounded-full bg-foreground" />
      </span>
    </span>
  );
}

export function ThinkingIndicator({
  variant = "orbit",
  status = "running",
  label = "Thinking",
  doneLabel,
  startedAt,
  className = "",
  ...props
}: ThinkingIndicatorProps) {
  const reduced = useReducedMotion();
  const running = status === "running";
  const [now, setNow] = React.useState(startedAt ?? 0);
  const [endedAt, setEndedAt] = React.useState<number | undefined>(undefined);

  // Re-render on each whole second of the run (not every frame), and remember when it settled.
  React.useEffect(() => {
    if (!running) {
      setEndedAt((prev) => prev ?? Date.now());
      return;
    }
    setEndedAt(undefined);
    if (startedAt === undefined) return;
    let timer = 0;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      timer = window.setTimeout(tick, 1000 - ((t - startedAt) % 1000) + 5);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [running, startedAt]);

  const elapsed = startedAt === undefined ? undefined : (running ? now : (endedAt ?? now)) - startedAt;
  const showTime = elapsed !== undefined && (running || doneLabel === undefined);
  const text = running ? label : (doneLabel ?? (elapsed !== undefined ? "Done in" : "Done"));

  return (
    <div className={`inline-flex items-center gap-2.5 text-[13px] ${className}`} {...props}>
      <span aria-hidden="true" className="relative flex h-4 min-w-4 items-center justify-center">
        {/* The mark stops moving once it has faded out. */}
        <span className={running ? "" : "[&_*]:[animation-play-state:paused]"} style={swap(running, reduced)}>
          <Mark variant={variant} />
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-muted-foreground" style={swap(!running, reduced)}>
          <svg viewBox="0 0 16 16" fill="none" className="size-4">
            <path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              style={{ strokeDashoffset: running ? 1 : 0, transition: !running && !reduced ? `stroke-dashoffset 420ms ${MORPH} 120ms` : "none" }}
            />
          </svg>
        </span>
      </span>
      <span aria-hidden="true" className="inline-flex items-baseline gap-2">
        <span className={`font-medium transition-colors duration-300 ${running ? SHEEN : "text-foreground/75"}`}>
          <TextMorph>{text}</TextMorph>
        </span>
        {elapsed !== undefined && (
          <span
            className="-ml-2 grid"
            style={{ gridTemplateColumns: showTime ? "1fr" : "0fr", opacity: showTime ? 1 : 0, transition: reduced ? "none" : `grid-template-columns 420ms ${MORPH}, opacity 300ms ${MORPH}` }}
          >
            <span className="min-w-0 pl-2 tabular-nums text-muted-foreground [clip-path:inset(-4px_0)]">
              <Elapsed ms={elapsed} settled={!running} reduced={reduced} />
            </span>
          </span>
        )}
      </span>
      {/* What it's doing, for screen readers: the label while it works, then the outcome. Never the ticking timer. */}
      <span role="status" aria-live="polite" className="sr-only">
        {running ? label : showTime && elapsed !== undefined ? `${text} ${formatElapsed(elapsed)}` : text}
      </span>
    </div>
  );
}
