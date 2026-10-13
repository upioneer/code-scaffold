// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Approval card (approval-card)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { Ban, Clock, ShieldQuestion } from "lucide-react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * APPROVAL CARD: the agent asks before it acts
 *
 *   pending   what it wants to do, with Approve and Deny; an
 *             optional countdown rolls down second by second
 *   approved  the card folds into one line: the body closes,
 *             "Needs your approval" morphs to "Approved" and a
 *             check draws itself where the shield was
 *   denied    folds the same way into "Denied"
 *   expired   the countdown reaches 0:00 and it folds into
 *             "Expired"
 *
 * One surface throughout: it changes shape instead of being
 * replaced. Works controlled (pass status) or on its own (it
 * remembers the choice). Mark destructive actions so Approve
 * reads as such.
 * ───────────────────────────────────────────────────────── */

export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";

export interface ApprovalDetail {
  label: string;
  value: React.ReactNode;
}

export interface ApprovalCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** What the agent wants to do, e.g. "Send email to 3 people". */
  title: string;
  description?: string;
  /** The specifics worth checking before approving. */
  details?: ApprovalDetail[];
  /** Why approval is needed, e.g. AI SDK's approval.requestReason. */
  reason?: string;
  status?: ApprovalStatus;
  defaultStatus?: ApprovalStatus;
  onApprove?: () => void;
  onDeny?: () => void;
  approveLabel?: string;
  denyLabel?: string;
  /** Styles Approve as a destructive action. */
  destructive?: boolean;
  /** When the request lapses (ms). Shows a countdown, then expires. */
  expiresAt?: number;
  onExpire?: () => void;
}

const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const LABELS: Record<ApprovalStatus, string> = { pending: "Needs your approval", approved: "Approved", denied: "Denied", expired: "Expired" };

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
        style={{ strokeDashoffset: drawn ? 0 : 1, transition: drawn && !reduced ? `stroke-dashoffset 420ms ${MORPH} 160ms` : "none" }}
      />
    </svg>
  );
}

export function ApprovalCard({
  title,
  description,
  details,
  reason,
  status,
  defaultStatus = "pending",
  onApprove,
  onDeny,
  approveLabel = "Approve",
  denyLabel = "Deny",
  destructive = false,
  expiresAt,
  onExpire,
  className = "",
  ...props
}: ApprovalCardProps) {
  const reduced = useReducedMotion();
  const [ownStatus, setOwnStatus] = React.useState<ApprovalStatus>(defaultStatus);
  const current = status ?? ownStatus;
  const decided = current !== "pending";
  const [now, setNow] = React.useState(expiresAt ?? 0);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Count down while pending; expire on time.
  React.useEffect(() => {
    if (current !== "pending" || expiresAt === undefined) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= expiresAt) {
        if (status === undefined) setOwnStatus("expired");
        onExpire?.();
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [current, expiresAt, status, onExpire]);

  const decide = (next: "approved" | "denied") => {
    // The buttons are about to fold away: keep focus on the card instead of dropping it on the page.
    if (cardRef.current?.contains(document.activeElement)) cardRef.current.focus({ preventScroll: true });
    if (status === undefined) setOwnStatus(next);
    if (next === "approved") onApprove?.();
    else onDeny?.();
  };

  const left = expiresAt === undefined ? 0 : Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const icons: Record<ApprovalStatus, React.ReactNode> = {
    pending: <ShieldQuestion className="size-3.5" />,
    approved: (
      <span className="text-emerald-600 dark:text-emerald-400">
        <DrawnCheck drawn={current === "approved"} reduced={reduced} />
      </span>
    ),
    denied: <Ban className="size-3.5" />,
    expired: <Clock className="size-3.5" />,
  };
  const fold = (open: boolean): React.CSSProperties => ({
    gridTemplateRows: open ? "1fr" : "0fr",
    transition: reduced ? "none" : `grid-template-rows 480ms ${MORPH}`,
  });
  const fade = (on: boolean): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    filter: on ? "none" : "blur(4px)",
    transition: reduced ? "none" : on ? `opacity 380ms ${MORPH} 120ms, filter 380ms ${MORPH} 120ms` : `opacity 160ms ease-out, filter 160ms ease-out`,
  });

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      role="group"
      aria-label={decided ? `${LABELS[current]}: ${title}` : `Approval needed: ${title}`}
      className={`rounded-xl border border-border bg-background outline-none animate-[ui-fade-up_320ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none ${className}`}
      style={{
        padding: decided ? "10px 12px" : 16,
        transition: reduced ? "none" : `padding 480ms ${MORPH}`,
      }}
      {...props}
    >
      {/* The header is also the folded line: it keeps its place while everything under it closes. */}
      <div className="flex min-w-0 items-center gap-2 text-[12.5px] font-medium">
        <span aria-hidden="true" className={`relative flex size-3.5 shrink-0 items-center justify-center transition-colors duration-300 ${decided ? "text-foreground/70" : "text-muted-foreground"}`}>
          {(Object.keys(icons) as ApprovalStatus[]).map((s) => (
            <span key={s} className="absolute inset-0 flex items-center justify-center" style={swap(s === current, reduced)}>
              {icons[s]}
            </span>
          ))}
        </span>
        <span className={`shrink-0 transition-colors duration-300 ${decided ? "text-foreground" : "text-muted-foreground"}`}>
          <TextMorph>{LABELS[current]}</TextMorph>
        </span>
        {/* The action slides into the line as the card folds. */}
        <span
          aria-hidden={!decided || undefined}
          className="grid min-w-0 flex-1"
          style={{
            gridTemplateColumns: decided ? "1fr" : "0fr",
            ...fade(decided),
            transition: reduced ? "none" : `grid-template-columns 480ms ${MORPH}, ${decided ? `opacity 380ms ${MORPH} 160ms, filter 380ms ${MORPH} 160ms` : "opacity 160ms ease-out, filter 160ms ease-out"}`,
          }}
        >
          <span className="min-w-0 truncate font-normal text-muted-foreground">{title}</span>
        </span>
        {expiresAt !== undefined && (
          <span
            aria-hidden={decided || undefined}
            className="ml-auto grid shrink-0"
            style={{ gridTemplateColumns: decided ? "0fr" : "1fr", ...fade(!decided), transition: reduced ? "none" : `grid-template-columns 480ms ${MORPH}, opacity 160ms ease-out, filter 160ms ease-out` }}
          >
            <span className="flex min-w-0 overflow-hidden font-mono font-normal tabular-nums text-muted-foreground">
              <span className="sr-only">Time left: </span>
              <NumberRoll value={Math.floor(left / 60)} duration={600} />
              <span aria-hidden="true">:</span>
              <NumberRoll value={left % 60} format={{ minimumIntegerDigits: 2 }} direction="down" duration={600} />
            </span>
          </span>
        )}
      </div>

      {/* Everything else folds shut once it's answered. */}
      <div inert={decided} aria-hidden={decided || undefined} className="grid" style={fold(!decided)}>
        <div className="min-h-0 overflow-hidden">
          <div style={fade(!decided)}>
            <p className="pt-2 text-[14px] font-medium leading-snug text-foreground">{title}</p>
            {description && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>}

            {details && details.length > 0 && (
              <dl className="mt-3 grid grid-cols-[minmax(0,auto)_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-muted px-3 py-2.5 text-[12.5px]">
                {details.map((d) => (
                  <React.Fragment key={d.label}>
                    <dt className="text-muted-foreground">{d.label}</dt>
                    <dd className="min-w-0 break-words text-foreground">{d.value}</dd>
                  </React.Fragment>
                ))}
              </dl>
            )}

            {reason && <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground">{reason}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => decide("denied")}
                className={`cursor-pointer h-8 rounded-lg border border-border px-3 text-[12.5px] font-medium text-foreground transition-colors hover:bg-accent ${FOCUS}`}
              >
                {denyLabel}
              </button>
              <button
                type="button"
                onClick={() => decide("approved")}
                className={`cursor-pointer h-8 rounded-lg px-3.5 text-[12.5px] font-medium transition-[background-color,transform] active:scale-[0.98] ${FOCUS} ${
                  destructive ? "bg-red-600 text-white hover:bg-red-700" : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {approveLabel}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Announces the answer; outside the buttons so their names stay their labels. */}
      <span role="status" className="sr-only">
        {decided ? `${LABELS[current]}: ${title}` : ""}
      </span>
    </div>
  );
}
