// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Usage meter (usage-meter)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * USAGE METER: how much is left, before it runs out
 *
 *   normal  quiet: "1,240 of 2,000 left"; the numbers roll as
 *           they're spent and the bar eases to match
 *   low     amber once a fifth is left; the way to upgrade
 *           opens in beside the reset date
 *   out     red; the numbers fold away as the words morph to
 *           "No credits left", and "Resets Oct 12" becomes
 *           "You're out until Oct 12."
 *
 * A bar for settings and menus, or a ring small enough for a
 * composer toolbar (context windows, daily limits).
 * ───────────────────────────────────────────────────────── */

export interface UsageMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  used: number;
  limit: number;
  /** What's being counted, e.g. "credits" or "messages". */
  unit?: string;
  label?: string;
  /** When it resets (ms or Date). */
  resetAt?: number | Date;
  variant?: "bar" | "ring";
  /** Share left at which it turns amber. */
  lowAt?: number;
  onUpgrade?: () => void;
  upgradeLabel?: string;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const number = new Intl.NumberFormat("en-US");
const GROUPED = { useGrouping: true };

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
        transition: reduced ? "none" : `grid-template-columns 460ms ${MORPH}, opacity ${show ? "320ms" : "160ms"} ${MORPH}, filter 320ms ${MORPH}`,
      }}
    >
      <span className="min-w-0 whitespace-nowrap [clip-path:inset(-4px_-2px)]">{children}</span>
    </span>
  );
}

export function UsageMeter({
  used,
  limit,
  unit = "credits",
  label = "Usage",
  resetAt,
  variant = "bar",
  lowAt = 0.2,
  onUpgrade,
  upgradeLabel = "Upgrade",
  className = "",
  ...props
}: UsageMeterProps) {
  const reduced = useReducedMotion();
  const left = Math.max(0, limit - used);
  const share = limit > 0 ? Math.min(1, used / limit) : 1;
  const out = left <= 0;
  const low = !out && limit > 0 && left / limit <= lowAt;
  const tone = out ? "bg-red-500" : low ? "bg-amber-500" : "bg-foreground";
  const stroke = out ? "stroke-red-500" : low ? "stroke-amber-500" : "stroke-foreground";
  const resets =
    resetAt !== undefined ? new Date(resetAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : undefined;
  const summary = out ? `No ${unit} left` : `${number.format(left)} of ${number.format(limit)} ${unit} left`;

  if (variant === "ring") {
    const c = 2 * Math.PI * 8;
    return (
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-valuetext={summary}
        title={`${summary}${resets ? ` · resets ${resets}` : ""}`}
        className={`inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground ${className}`}
        {...props}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 -rotate-90">
          <circle cx="10" cy="10" r="8" fill="none" strokeWidth="2.5" className="stroke-border" />
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - share)}
            className={`${stroke} transition-[stroke-dashoffset,stroke] duration-500 motion-reduce:transition-none`}
          />
        </svg>
        <span aria-hidden="true" className={`font-mono tabular-nums transition-colors duration-300 ${out ? "text-red-500" : ""}`}>
          <NumberRoll value={Math.round(share * 100)} suffix="%" duration={700} />
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="flex items-baseline justify-between gap-4 text-[12.5px]">
        <span className="font-medium text-foreground">{label}</span>
        {/* The numbers fold away when it runs out; the words that stay glide into "No credits left". */}
        <span aria-hidden="true" className={`flex items-baseline font-mono text-[12px] tabular-nums transition-colors duration-300 ${out ? "text-red-500" : "text-muted-foreground"}`}>
          <Reveal show={!out} reduced={reduced}>
            <span className="inline-flex items-baseline">
              <NumberRoll value={left} format={GROUPED} locales="en-US" duration={700} />
              &nbsp;of&nbsp;
              <NumberRoll value={limit} format={GROUPED} locales="en-US" duration={700} />
              &nbsp;
            </span>
          </Reveal>
          <TextMorph>{out ? `No ${unit} left` : `${unit} left`}</TextMorph>
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-valuetext={summary}
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full rounded-full ${tone} transition-[width,background-color] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none`}
          style={{ width: `${share * 100}%` }}
        />
      </div>
      {(resets || onUpgrade) && (
        <div className="mt-2 flex min-h-[18px] items-center justify-between gap-4 text-[12px] text-muted-foreground">
          <span className="min-w-0">
            <TextMorph>{out ? `You’re out until ${resets ?? "the next reset"}.` : resets ? `Resets ${resets}` : ""}</TextMorph>
          </span>
          {onUpgrade && (
            // Opens in once it matters: when it's low or out.
            <Reveal show={low || out} reduced={reduced} className="shrink-0">
              <span className="block px-0.5">
                <button
                  type="button"
                  inert={!(low || out)}
                  onClick={onUpgrade}
                  className={`cursor-pointer rounded font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground ${FOCUS}`}
                >
                  {upgradeLabel}
                </button>
              </span>
            </Reveal>
          )}
        </div>
      )}
    </div>
  );
}
