// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Streaming answer (streaming-answer)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { AlertCircle, Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { NumberRoll } from "./number-roll";

/* ─────────────────────────────────────────────────────────
 * STREAMING ANSWER: an AI answer as it arrives
 *
 *   StreamingText   the text so far, with inline citation chips;
 *                   only newly arrived words fade in
 *   AnswerActions   copy (blurs into a check that draws itself),
 *                   regenerate, feedback (the thumb fills with a
 *                   small thrown pop) and a sources stack whose
 *                   count rolls
 *   FollowUps       suggested next questions
 *
 * StreamingText renders whatever you pass it: append to `content`
 * as tokens arrive. Blank lines start new paragraphs, and finished
 * paragraphs don't re-render while the last one grows. For Markdown,
 * pass your renderer as children instead of `content`.
 * ───────────────────────────────────────────────────────── */

export type AnswerCitation = { type: "citation"; label: string; href?: string };
export type AnswerSegment = string | AnswerCitation;
export type AnswerStatus = "streaming" | "done" | "stopped" | "error";
export type AnswerFeedback = "up" | "down" | null;

export interface AnswerSource {
  name: string;
  href?: string;
  /** A favicon or logo, e.g. <img src="…/favicon.ico" alt="" />. */
  icon?: React.ReactNode;
  /** Tailwind background class for the dot when there's no icon. */
  color?: string;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const DOTS = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-violet-500"];
const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";

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

/* ── StreamingText ───────────────────────────────────────── */

export interface StreamingTextProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  /** The answer so far. Append as tokens arrive. */
  content?: AnswerSegment[];
  status?: AnswerStatus;
  /** Shows a retry button when status is "error". */
  onRetry?: () => void;
  /** Your own renderer (e.g. Markdown) instead of `content`. */
  children?: React.ReactNode;
}

type Token = { kind: "word" | "space"; text: string } | { kind: "cite"; citation: AnswerCitation };

function toParagraphs(content: AnswerSegment[]): Token[][] {
  const paragraphs: Token[][] = [[]];
  for (const segment of content) {
    if (typeof segment !== "string") {
      paragraphs[paragraphs.length - 1].push({ kind: "cite", citation: segment });
      continue;
    }
    for (const part of segment.split(/(\n{2,})/)) {
      if (/^\n{2,}$/.test(part)) {
        paragraphs.push([]);
        continue;
      }
      for (const text of part.split(/(\s+)/)) {
        if (text) paragraphs[paragraphs.length - 1].push({ kind: /^\s+$/.test(text) ? "space" : "word", text });
      }
    }
  }
  return paragraphs.filter((p, i) => p.length > 0 || i === paragraphs.length - 1);
}

function CitationChip({ citation }: { citation: AnswerCitation }) {
  const className = `mx-0.5 inline-flex -translate-y-px items-center gap-1 rounded-[5px] border border-border bg-muted px-1.5 py-px align-middle font-mono text-[11px] text-foreground animate-[ui-fade-up_240ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none ${FOCUS}`;
  const inner = (
    <>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
      {citation.label}
    </>
  );
  return citation.href ? (
    <a href={citation.href} target="_blank" rel="noreferrer" className={`${className} transition-colors hover:bg-accent`}>
      {inner}
    </a>
  ) : (
    <span className={className}>{inner}</span>
  );
}

const Caret = () => (
  <span
    aria-hidden="true"
    className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] bg-foreground animate-[ui-blink_1s_steps(2,start)_infinite] motion-reduce:animate-none"
  />
);

// Words keep a stable key by position, so only words that just arrived mount and fade in.
const Paragraph = React.memo(
  function Paragraph({ tokens, caret }: { tokens: Token[]; signature: string; caret: boolean }) {
    return (
      <p>
        {tokens.map((token, i) =>
          token.kind === "cite" ? (
            <CitationChip key={i} citation={token.citation} />
          ) : token.kind === "space" ? (
            token.text
          ) : (
            <span key={i} className="animate-[ui-fade-in_420ms_ease-out_both] motion-reduce:animate-none">
              {token.text}
            </span>
          )
        )}
        {caret && <Caret />}
      </p>
    );
  },
  (a, b) => a.signature === b.signature && a.caret === b.caret
);

export function StreamingText({ content = [], status = "done", onRetry, children, className = "", ...props }: StreamingTextProps) {
  const streaming = status === "streaming";
  const paragraphs = children === undefined ? toParagraphs(content) : [];

  return (
    <div aria-busy={streaming} className={`flex flex-col gap-3 text-[13.5px] leading-relaxed text-foreground ${className}`} {...props}>
      {children ??
        paragraphs.map((tokens, i) => (
          <Paragraph
            key={i}
            tokens={tokens}
            signature={tokens.map((t) => (t.kind === "cite" ? `\u0000${t.citation.label}` : t.text)).join("")}
            caret={streaming && i === paragraphs.length - 1}
          />
        ))}

      {status === "stopped" && <p className="text-xs text-muted-foreground animate-[ui-fade-in_300ms_ease-out_both]">Stopped</p>}

      {status === "error" && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground animate-[ui-fade-in_300ms_ease-out_both]">
          <AlertCircle aria-hidden="true" className="size-3.5 shrink-0 text-red-500" />
          The answer was interrupted.
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`cursor-pointer rounded px-1 font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground ${FOCUS}`}
            >
              Retry
            </button>
          )}
        </p>
      )}
    </div>
  );
}

/* ── AnswerActions ───────────────────────────────────────── */

export interface AnswerActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Text the copy button puts on the clipboard. Hides the button when omitted. */
  copyText?: string;
  onRegenerate?: () => void;
  /** Controlled feedback, e.g. restored from your database. */
  feedback?: AnswerFeedback;
  defaultFeedback?: AnswerFeedback;
  onFeedback?: (value: AnswerFeedback) => void;
  sources?: AnswerSource[];
  onSourcesClick?: () => void;
  /** Disables the buttons, e.g. while the answer is still streaming. */
  disabled?: boolean;
}

function IconButton({ label, pressed, disabled, onClick, children }: { label: string; pressed?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer disabled:cursor-default relative flex size-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 ${
        pressed ? "bg-accent text-foreground" : "text-muted-foreground"
      } ${FOCUS}`}
    >
      {children}
    </button>
  );
}

/** A thumb that fills in with a small thrown pop when chosen, and empties when let go. */
function Thumb({ down, filled, reduced }: { down?: boolean; filled: boolean; reduced: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!filled || reduced) return;
    ref.current?.animate([{ transform: "scale(0.8) rotate(-8deg)" }, { transform: "none" }], { duration: 420, easing: THROW });
  }, [filled, reduced]);
  const Icon = down ? ThumbsDown : ThumbsUp;
  return (
    <span ref={ref} className="flex">
      <Icon className="size-3.5" style={{ fill: filled ? "currentColor" : "transparent", transition: reduced ? "none" : `fill 220ms ${MORPH}` }} />
    </span>
  );
}

export function AnswerActions({
  copyText,
  onRegenerate,
  feedback,
  defaultFeedback = null,
  onFeedback,
  sources,
  onSourcesClick,
  disabled,
  className = "",
  ...props
}: AnswerActionsProps) {
  const reduced = useReducedMotion();
  const [copied, setCopied] = React.useState(false);
  const [ownFeedback, setOwnFeedback] = React.useState<AnswerFeedback>(defaultFeedback);
  const current = feedback !== undefined ? feedback : ownFeedback;

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
    } catch {
      // Clipboard can be blocked by the browser; nothing to undo.
    }
  };

  const rate = (value: "up" | "down") => {
    const next = current === value ? null : value;
    if (feedback === undefined) setOwnFeedback(next);
    onFeedback?.(next);
  };

  const stack = sources && sources.length > 0 && (
    <>
      <span className="flex items-center -space-x-1.5" aria-hidden="true">
        {sources.slice(0, 3).map((s, i) =>
          s.icon ? (
            <span key={s.name} className="flex size-3.5 items-center justify-center overflow-hidden rounded-full bg-background ring-2 ring-background">
              {s.icon}
            </span>
          ) : (
            <span key={s.name} className={`size-3.5 rounded-full ring-2 ring-background ${s.color ?? DOTS[i % DOTS.length]}`} />
          )
        )}
      </span>
      <span className="inline-flex items-baseline gap-[0.3em] tabular-nums">
        <NumberRoll value={sources.length} duration={600} />
        {sources.length === 1 ? "source" : "sources"}
      </span>
    </>
  );

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`} {...props}>
      <div className="flex items-center gap-1">
        {copyText !== undefined && (
          <IconButton label="Copy answer" disabled={disabled} onClick={copy}>
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(!copied, reduced)}>
              <Copy className="size-3.5" />
            </span>
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-emerald-600 dark:text-emerald-400" style={swap(copied, reduced)}>
              <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  style={{ strokeDashoffset: copied ? 0 : 1, transition: copied && !reduced ? `stroke-dashoffset 380ms ${MORPH} 100ms` : "none" }}
                />
              </svg>
            </span>
          </IconButton>
        )}
        {onRegenerate && (
          <IconButton label="Regenerate" disabled={disabled} onClick={onRegenerate}>
            <RotateCcw className="size-3.5" />
          </IconButton>
        )}
        <IconButton label="Helpful" pressed={current === "up"} disabled={disabled} onClick={() => rate("up")}>
          <Thumb filled={current === "up"} reduced={reduced} />
        </IconButton>
        <IconButton label="Not helpful" pressed={current === "down"} disabled={disabled} onClick={() => rate("down")}>
          <Thumb down filled={current === "down"} reduced={reduced} />
        </IconButton>
      </div>
      {/* Outside the buttons, so their names stay their labels. */}
      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>

      {stack &&
        (onSourcesClick ? (
          <button
            type="button"
            onClick={onSourcesClick}
            className={`cursor-pointer flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${FOCUS}`}
          >
            {stack}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">{stack}</span>
        ))}
    </div>
  );
}

/* ── FollowUps ───────────────────────────────────────────── */

export interface FollowUpsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  items: string[];
  onSelect?: (item: string) => void;
  label?: string;
}

export function FollowUps({ items, onSelect, label = "Follow-ups", className = "", ...props }: FollowUpsProps) {
  return (
    <div className={`border-t border-border pt-3 ${className}`} {...props}>
      <p className="mb-1 text-[11.5px] font-medium text-muted-foreground">{label}</p>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item}>
            <button
              type="button"
              onClick={() => onSelect?.(item)}
              className={`cursor-pointer -mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[12.5px] text-foreground transition-colors duration-150 hover:bg-accent ${FOCUS}`}
            >
              <span aria-hidden="true" className="text-muted-foreground">
                ↳
              </span>
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
