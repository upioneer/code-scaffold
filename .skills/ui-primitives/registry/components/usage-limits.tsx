// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Usage limits (usage-limits)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { NumberRoll } from "./number-roll";

/* ─────────────────────────────────────────────────────────
 * USAGE LIMITS: what an agent has left, at a glance
 *
 *   context   one bar for the context window, split by what's
 *             in it (system, tools, files, conversation); the
 *             chevron folds the breakdown open underneath, and
 *             pointing at a part steps the others back
 *   limits    each plan limit as a bar with its share and when
 *             it resets; under a day away it counts down, the
 *             minutes rolling down like a clock
 *   status    a bar turns amber past 80% and red at its limit,
 *             where "Limit reached" folds open beside the share
 *   arrive    the bars grow from the left the first time they're
 *             seen and every figure rolls up from zero
 *
 * All of it is real text; the bars are decoration.
 * ───────────────────────────────────────────────────────── */

export interface ContextPart {
  id: string;
  label: string;
  tokens: number;
}

export interface PlanLimit {
  id: string;
  label: string;
  used: number;
  limit: number;
  /** When it resets (ms or Date). */
  resetsAt?: number | Date;
}

export interface UsageLimitsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The context window, split into what fills it. */
  context?: { limit: number; parts: ContextPart[] };
  /** The plan's name, e.g. "Max". */
  plan?: string;
  limits: PlanLimit[];
  /** Makes the plan heading a link, e.g. to billing. */
  onPlanClick?: () => void;
  defaultOpen?: boolean;
  locales?: string | string[];
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const COLORS = ["var(--chart-1, var(--primary))", "var(--chart-4, #8b6fe8)", "var(--chart-3, #1baf7a)", "var(--chart-2, #e8743b)", "var(--chart-5, #e0a21b)"];
const compact = (n: number, locales?: string | string[]) => new Intl.NumberFormat(locales, { notation: "compact", maximumFractionDigits: 1 }).format(n);

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

const tone = (share: number) => (share >= 1 ? "bg-red-500" : share >= 0.8 ? "bg-amber-500" : "");

/** "Resets in 2 h 46 min" under a day away, the minutes rolling down; "Resets Tue 3:00 pm" further out. */
function Resets({ at, now, locales }: { at: number; now: number | null; locales?: string | string[] }) {
  if (now === null) return <span className="invisible">Resets</span>;
  const left = Math.max(0, at - now);
  if (left > 86_400_000) {
    const d = new Date(at);
    return <span>Resets {d.toLocaleString(locales ?? "en-GB", { weekday: "short", hour: "numeric", minute: "2-digit" })}</span>;
  }
  const hours = Math.floor(left / 3_600_000);
  const minutes = Math.ceil((left % 3_600_000) / 60_000);
  return (
    <span className="flex items-baseline gap-[0.25em] whitespace-nowrap">
      Resets in
      {hours > 0 && (
        <>
          <NumberRoll value={hours} direction="down" duration={700} />h
        </>
      )}
      <NumberRoll value={minutes} direction="down" duration={700} />
      min
    </span>
  );
}

export function UsageLimits({ context, plan, limits, onPlanClick, defaultOpen = false, locales, className = "", ...props }: UsageLimitsProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [open, setOpen] = React.useState(defaultOpen);
  const [visible, setVisible] = React.useState(false);
  const [focus, setFocus] = React.useState<string | null>(null);
  const [now, setNow] = React.useState<number | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // A clock that ticks on each whole minute, only once mounted (so a server render never reads as "reset").
  React.useEffect(() => {
    let timer = 0;
    const tick = () => {
      setNow(Date.now());
      timer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);

  const used = context ? context.parts.reduce((s, p) => s + p.tokens, 0) : 0;
  const contextShare = context?.limit ? used / context.limit : 0;

  return (
    <div ref={rootRef} className={`@container w-full rounded-[22px] bg-background shadow-[0_0_0_1px_var(--border)] ${className}`} {...props}>
      <div className="p-4 @md:p-5">
        {context && (
          <section aria-labelledby={`${id}-context`}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`${id}-parts`}
              onClick={() => setOpen((o) => !o)}
              className={`cursor-pointer -mx-1.5 flex w-[calc(100%+12px)] items-baseline justify-between gap-3 rounded-lg px-1.5 py-0.5 text-left ${FOCUS}`}
            >
              <span id={`${id}-context`} className="text-[12.5px] text-muted-foreground @md:text-[13px]">
                Context window
              </span>
              <span className="flex items-baseline gap-1.5 whitespace-nowrap text-[12px] tabular-nums text-muted-foreground @md:text-[12.5px]">
                <span>
                  <NumberRoll value={visible ? used : 0} format={{ notation: "compact", maximumFractionDigits: 1 }} locales={locales} duration={900} /> /{" "}
                  {compact(context.limit, locales)}
                </span>
                <span className={`font-medium ${contextShare >= 1 ? "text-red-600 dark:text-red-400" : contextShare >= 0.8 ? "text-amber-600" : "text-foreground"}`}>
                  <NumberRoll value={visible ? contextShare : 0} format={{ style: "percent" }} duration={900} />
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-3.5 self-center"
                  style={{ transform: open ? "rotate(180deg)" : "none", transition: reduced ? "none" : `transform 320ms ${EASE}` }}
                />
              </span>
            </button>

            {/* What fills the window: one segment per part, a 2px gap between them. */}
            <div aria-hidden="true" className="mt-2 flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-muted" onPointerLeave={() => setFocus(null)}>
              {context.parts.map((p, i) => (
                <span
                  key={p.id}
                  onPointerEnter={() => setFocus(p.id)}
                  className="h-full first:rounded-l-full"
                  style={{
                    width: `${visible ? (p.tokens / context.limit) * 100 : 0}%`,
                    background: COLORS[i % COLORS.length],
                    opacity: focus && focus !== p.id ? 0.3 : 1,
                    transition: reduced ? "none" : `width 900ms ${EASE} ${i * 70}ms, opacity 240ms ${EASE}`,
                  }}
                />
              ))}
            </div>

            <div
              id={`${id}-parts`}
              inert={!open}
              className="grid"
              style={{
                gridTemplateRows: open ? "1fr" : "0fr",
                opacity: open ? 1 : 0,
                transition: reduced ? "none" : `grid-template-rows 420ms ${EASE}, opacity ${open ? "320ms" : "140ms"} ${EASE}`,
              }}
            >
              <ul className="min-h-0 overflow-hidden" onPointerLeave={() => setFocus(null)}>
                {context.parts.map((p, i) => (
                  <li
                    key={p.id}
                    onPointerEnter={() => setFocus(p.id)}
                    className="flex items-center gap-2 pt-2 text-[12px] transition-opacity duration-200 @md:text-[12.5px]"
                    style={{ opacity: focus && focus !== p.id ? 0.45 : 1 }}
                  >
                    <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.label}</span>
                    <span className="tabular-nums text-foreground">{compact(p.tokens, locales)}</span>
                    <span className="w-9 text-right tabular-nums text-muted-foreground">{Math.round((p.tokens / context.limit) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section aria-labelledby={`${id}-plan`} className={context ? "mt-3.5 border-t border-border pt-3 @md:mt-4 @md:pt-3.5" : ""}>
          <h3 id={`${id}-plan`} className="text-[12.5px] font-normal text-muted-foreground @md:text-[13px]">
            {onPlanClick ? (
              <button type="button" onClick={onPlanClick} className={`cursor-pointer -mx-1.5 flex w-[calc(100%+12px)] items-center justify-between rounded-lg px-1.5 py-0.5 text-left hover:text-foreground ${FOCUS}`}>
                <span>Plan limits{plan ? ` · ${plan}` : ""}</span>
                <ChevronRight aria-hidden="true" className="size-3.5" />
              </button>
            ) : (
              <span>Plan limits{plan ? ` · ${plan}` : ""}</span>
            )}
          </h3>
          <ul className="mt-1">
            {limits.map((l, i) => {
              const share = l.limit ? l.used / l.limit : 0;
              const reached = share >= 1;
              return (
                <li key={l.id} className="pt-2.5 first:pt-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-[12.5px] @md:text-[13px]">
                    <span className="min-w-0 truncate text-foreground">{l.label}</span>
                    <span className="flex shrink-0 items-baseline gap-2.5 text-[11.5px] text-muted-foreground @md:text-[12px]">
                      {l.resetsAt !== undefined && <Resets at={+new Date(l.resetsAt)} now={now} locales={locales} />}
                      {/* "Limit reached" folds open beside the share rather than replacing it. */}
                      <span className="flex items-baseline">
                        <span
                          className="grid"
                          style={{
                            gridTemplateColumns: reached ? "1fr" : "0fr",
                            opacity: reached ? 1 : 0,
                            transition: reduced ? "none" : `grid-template-columns 420ms ${EASE}, opacity 260ms ${EASE}`,
                          }}
                        >
                          <span className="min-w-0 overflow-hidden whitespace-nowrap pr-1.5 font-medium text-red-600 dark:text-red-400 [clip-path:inset(-4px_0)]">Limit reached</span>
                        </span>
                        <span className={`min-w-[2.6em] text-right font-medium tabular-nums ${reached ? "text-red-600 dark:text-red-400" : share >= 0.8 ? "text-amber-600" : "text-foreground"}`}>
                          <NumberRoll value={visible ? Math.min(share, 1) : 0} format={{ style: "percent" }} duration={900} />
                        </span>
                      </span>
                    </span>
                  </div>
                  <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-colors duration-300 ${tone(share)}`}
                      style={{
                        width: `${visible ? Math.max(share > 0 ? 1.5 : 0, Math.min(share, 1) * 100) : 0}%`,
                        background: tone(share) ? undefined : "var(--chart-1, var(--primary))",
                        transition: reduced ? "none" : `width 900ms ${EASE} ${i * 90}ms, background-color 300ms ${EASE}`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
