// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Error and limit states (chat-notice)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { AlertCircle, ChevronDown, Hourglass, Layers, RotateCcw, WifiOff } from "lucide-react";
import { NumberRoll } from "./number-roll";
import { StatusButton } from "./status-button";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * CHAT NOTICE: the moments an AI app has to say no
 *
 *   error       the answer failed; Retry opens a spinner and
 *               morphs to "Retrying" while it runs
 *   offline     no connection; "Reconnecting" opens in
 *   rate-limit  out of messages; the countdown rolls down to
 *               the reset, then the hourglass blurs into a check
 *               that draws itself and the words morph to "You can
 *               send messages again"
 *   context     the chat is too long; start fresh with a summary
 *
 * Calm, inline and specific: what happened, what happens next,
 * and the one action that helps. Technical details fold away.
 * ───────────────────────────────────────────────────────── */

export type ChatNoticeKind = "error" | "offline" | "rate-limit" | "context";

export interface ChatNoticeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  kind: ChatNoticeKind;
  title?: string;
  description?: string;
  /** Rate limit: when sending is allowed again (ms). Shows a live countdown. */
  resetAt?: number;
  onReset?: () => void;
  onRetry?: () => void;
  /** Shows a spinner on Retry, or "Reconnecting" when offline. */
  retrying?: boolean;
  onUpgrade?: () => void;
  upgradeLabel?: string;
  /** Context: start a new chat carrying a summary of this one. */
  onSummarize?: () => void;
  onNewChat?: () => void;
  /** Technical details, e.g. an error message or request ID. */
  details?: string;
}

const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const BUTTON = `inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-[background-color,color,transform] duration-300 active:scale-[0.97] ${FOCUS}`;
const SECONDARY = `cursor-pointer ${BUTTON} text-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:bg-accent`;
const PRIMARY = `cursor-pointer ${BUTTON} bg-primary text-primary-foreground hover:bg-primary/90`;
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
      className={`inline-grid align-bottom ${className}`}
      style={{
        gridTemplateColumns: show ? "1fr" : "0fr",
        opacity: show ? 1 : 0,
        filter: show ? "none" : "blur(3px)",
        transition: reduced ? "none" : `grid-template-columns 460ms ${MORPH}, opacity ${show ? "320ms" : "160ms"} ${MORPH}, filter 320ms ${MORPH}`,
      }}
    >
      <span className="min-w-0 whitespace-nowrap [clip-path:inset(-4px_-2px)]">{children}</span>
    </span>
  );
}

function useCountdown(resetAt: number | undefined, onReset?: () => void) {
  // Unknown until mounted, so the first paint never claims the limit has already reset.
  const [now, setNow] = React.useState<number | null>(null);
  const fired = React.useRef(false);
  React.useEffect(() => {
    if (resetAt === undefined) return;
    fired.current = false;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= resetAt && !fired.current) {
        fired.current = true;
        onReset?.();
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [resetAt, onReset]);
  return resetAt === undefined || now === null ? undefined : Math.max(0, resetAt - now);
}

/** "4:59" rolling down a second at a time ("1h 05m" when it's over an hour); seconds roll back 00 → 59 like a clock. */
function Countdown({ ms, reduced }: { ms: number; reduced: boolean }) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(s / 3600);
  const minutes = hours ? Math.floor((s % 3600) / 60) : Math.floor(s / 60);
  return (
    <span className="inline-flex items-baseline tabular-nums">
      <Reveal show={hours > 0} reduced={reduced}>
        <NumberRoll value={hours} suffix="h" duration={600} />
        &nbsp;
      </Reveal>
      <NumberRoll value={minutes} suffix={hours ? "m" : ""} format={hours ? TWO_DIGITS : undefined} direction="down" duration={600} />
      <Reveal show={!hours} reduced={reduced}>
        :<NumberRoll value={s % 60} format={TWO_DIGITS} direction="down" duration={600} />
      </Reveal>
    </span>
  );
}

export function ChatNotice({
  kind,
  title,
  description,
  resetAt,
  onReset,
  onRetry,
  retrying = false,
  onUpgrade,
  upgradeLabel = "Upgrade",
  onSummarize,
  onNewChat,
  details,
  className = "",
  ...props
}: ChatNoticeProps) {
  const reduced = useReducedMotion();
  const left = useCountdown(kind === "rate-limit" ? resetAt : undefined, onReset);
  const ready = left === 0;
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const detailsId = React.useId();
  const counting = kind === "rate-limit" && description === undefined && resetAt !== undefined && !ready;

  const preset = {
    error: {
      title: "Something went wrong",
      description: "The answer didn’t finish. Your message is safe.",
    },
    offline: {
      title: "You’re offline",
      description: "We’ll pick up where you left off when your connection is back.",
    },
    "rate-limit": {
      title: ready ? "You can send messages again" : "You’ve reached your limit",
      description: ready ? "Your limit has reset." : resetAt !== undefined ? "It resets in" : "It resets soon.",
    },
    context: {
      title: "This chat is getting long",
      description: "Earlier messages may be forgotten. Start fresh with a summary to keep answers sharp.",
    },
  }[kind];

  const iconKey = kind === "rate-limit" && ready ? "ready" : kind;
  const icons: Record<string, React.ReactNode> = {
    error: <AlertCircle className="size-4 text-red-500" />,
    offline: <WifiOff className="size-4 text-muted-foreground" />,
    "rate-limit": <Hourglass className="size-4 text-amber-500" />,
    ready: (
      <svg viewBox="0 0 16 16" fill="none" className="size-4 text-emerald-600 dark:text-emerald-400">
        <path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          style={{ strokeDashoffset: iconKey === "ready" ? 0 : 1, transition: iconKey === "ready" && !reduced ? `stroke-dashoffset 420ms ${MORPH} 140ms` : "none" }}
        />
      </svg>
    ),
    context: <Layers className="size-4 text-muted-foreground" />,
  };
  const shownIcons = kind === "rate-limit" ? ["rate-limit", "ready"] : [kind];
  const resetsAt = resetAt !== undefined && left !== undefined ? new Date(resetAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : undefined;

  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex flex-col gap-3 rounded-xl border border-border bg-background px-3.5 py-3 animate-[ui-fade-up_320ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none sm:flex-row sm:items-start ${className}`}
      {...props}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <span aria-hidden="true" className="relative mt-0.5 flex size-4 shrink-0">
          {shownIcons.map((k) => (
            <span key={k} className="absolute inset-0 flex items-center justify-center" style={swap(k === iconKey, reduced)}>
              {icons[k]}
            </span>
          ))}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium leading-5 text-foreground">
            <TextMorph animateWidth={false}>{title ?? preset.title}</TextMorph>
          </p>
          <p className="text-[12.5px] leading-5 text-muted-foreground">
            <TextMorph animateWidth={false}>{description ?? preset.description}</TextMorph>
            {kind === "rate-limit" && description === undefined && resetAt !== undefined && (
              // The ticking digits are hidden from screen readers (the notice is a live region); they hear the time it resets instead.
              <Reveal show={counting && left !== undefined} reduced={reduced}>
                <span aria-hidden="true">
                  &nbsp;
                  {left !== undefined && <Countdown ms={left} reduced={reduced} />}.
                </span>
                {resetsAt && counting && <span className="sr-only"> at {resetsAt}</span>}
              </Reveal>
            )}
            {kind === "offline" && (
              <Reveal show={retrying} reduced={reduced}>
                <span className="ml-1.5 inline-flex items-center gap-1.5 text-foreground/70">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full bg-amber-500 motion-reduce:animate-none ${retrying ? "animate-[ui-breathe_1.4s_ease-in-out_infinite]" : ""}`}
                  />
                  Reconnecting
                </span>
              </Reveal>
            )}
          </p>
          {details && (
            <>
              <button
                type="button"
                aria-expanded={detailsOpen}
                aria-controls={detailsId}
                onClick={() => setDetailsOpen((o) => !o)}
                className={`cursor-pointer mt-1.5 flex items-center gap-1 rounded text-[11.5px] text-muted-foreground transition-colors hover:text-foreground ${FOCUS}`}
              >
                <TextMorph>{detailsOpen ? "Hide details" : "Show details"}</TextMorph>
                <ChevronDown
                  aria-hidden="true"
                  className="size-3 transition-transform duration-300 motion-reduce:transition-none"
                  style={{ transform: detailsOpen ? "rotate(180deg)" : "none", transitionTimingFunction: MORPH }}
                />
              </button>
              <div
                id={detailsId}
                inert={!detailsOpen}
                className="grid"
                style={{
                  gridTemplateRows: detailsOpen ? "1fr" : "0fr",
                  opacity: detailsOpen ? 1 : 0,
                  transition: reduced ? "none" : `grid-template-rows 420ms ${MORPH}, opacity ${detailsOpen ? "320ms" : "160ms"} ${MORPH}`,
                }}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="pt-1 break-all font-mono text-[11px] leading-5 text-muted-foreground">{details}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 pl-7 sm:pl-0">
        {(kind === "error" || kind === "offline") && onRetry && (
          <StatusButton
            variant="outline"
            size="sm"
            icon={<RotateCcw />}
            status={retrying ? "pending" : "idle"}
            labels={kind === "offline" ? { idle: "Try now", pending: "Trying" } : { idle: "Retry", pending: "Retrying" }}
            onClick={onRetry}
          />
        )}
        {kind === "rate-limit" && onUpgrade && (
          // Folds away once the limit has reset.
          <Reveal show={!ready} reduced={reduced}>
            <span className="block p-0.5">
              <button type="button" inert={ready} onClick={onUpgrade} className={PRIMARY}>
                {upgradeLabel}
              </button>
            </span>
          </Reveal>
        )}
        {kind === "context" && onNewChat && (
          <button type="button" onClick={onNewChat} className={SECONDARY}>
            New chat
          </button>
        )}
        {kind === "context" && onSummarize && (
          <button type="button" onClick={onSummarize} className={PRIMARY}>
            Continue with summary
          </button>
        )}
      </div>
    </div>
  );
}
