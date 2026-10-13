// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Activity rings (activity-rings)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * ACTIVITY RINGS: three daily goals as concentric rings
 *
 *   arrive    the first time it's on screen the rings sweep
 *             round from the top, outer first, and every figure
 *             rolls up from zero
 *   day       the week sits underneath as seven small rings:
 *             pick a day and the big rings sweep to it, the
 *             day's name morphs and every figure rolls; days
 *             still to come are quiet and can't be picked
 *   past      a goal beaten carries on round for a second lap,
 *             with a dot marking where it's got to
 *   focus     point at a ring or its row and the other two step
 *             back
 *
 * The legend is real text (figure, goal and share), the week is
 * a radio group, and the rings themselves are decoration.
 * ───────────────────────────────────────────────────────── */

export interface RingGoal {
  id: string;
  label: string;
  /** The day's target. */
  goal: number;
  format?: Intl.NumberFormatOptions;
}

export interface RingDay {
  key: string;
  /** Under the small ring, e.g. "F". */
  label: string;
  /** In the title, e.g. "Friday 9 October". */
  title?: string;
  /** One per goal; null for a day still to come. */
  values: (number | null)[];
}

export interface ActivityRingsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Up to three, outermost first. */
  goals: RingGoal[];
  /** The week, oldest first. */
  days: RingDay[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (key: string) => void;
  locales?: string | string[];
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const COLORS = ["var(--chart-1, var(--primary))", "var(--chart-2, #e8743b)", "var(--chart-3, #1baf7a)"];
const BIG = { size: 132, stroke: 12, gap: 3 };
const SMALL = { size: 28, stroke: 3, gap: 1 };

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

const radius = (g: typeof BIG, i: number) => g.size / 2 - g.stroke / 2 - i * (g.stroke + g.gap);

/** One ring: its track, the first lap, and a second lap (with a dot at its lead) when the goal is beaten. */
function Ring({ geo, i, share, color, dim, reduced, delay = 0, tip = true }: { geo: typeof BIG; i: number; share: number; color: string; dim: boolean; reduced: boolean; delay?: number; tip?: boolean }) {
  const r = radius(geo, i);
  const c = 2 * Math.PI * r;
  const lap = Math.min(1, Math.max(0, share));
  const over = Math.min(1, Math.max(0, share - 1));
  const centre = geo.size / 2;
  const angle = over * 2 * Math.PI - Math.PI / 2;
  const sweep = reduced ? "none" : `stroke-dashoffset 1100ms ${EASE} ${delay}ms, opacity 300ms ${EASE}`;
  return (
    <g style={{ opacity: dim ? 0.3 : 1, transition: reduced ? "none" : `opacity 300ms ${EASE}` }}>
      <circle cx={centre} cy={centre} r={r} fill="none" stroke={`color-mix(in oklab, ${color} 16%, var(--background))`} strokeWidth={geo.stroke} />
      <circle
        cx={centre}
        cy={centre}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={geo.stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        transform={`rotate(-90 ${centre} ${centre})`}
        style={{ strokeDashoffset: c * (1 - lap), opacity: lap > 0 ? 1 : 0, transition: sweep }}
      />
      {tip && (
        <>
          <circle
            cx={centre}
            cy={centre}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={geo.stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            transform={`rotate(-90 ${centre} ${centre})`}
            style={{ strokeDashoffset: c * (1 - over), opacity: over > 0 ? 1 : 0, transition: sweep }}
          />
          {/* Where the second lap has got to: a dot ringed in the surface colour, so it reads over the first lap. */}
          <circle
            cx={centre + r * Math.cos(angle)}
            cy={centre + r * Math.sin(angle)}
            r={geo.stroke / 2 - 1}
            fill={color}
            stroke="var(--background)"
            strokeWidth={2}
            style={{ opacity: over > 0.02 ? 1 : 0, transition: reduced ? "none" : `opacity 300ms ${EASE} ${over > 0.02 ? 900 + delay : 0}ms` }}
          />
        </>
      )}
    </g>
  );
}

export function ActivityRings({ goals: allGoals, days, value, defaultValue, onValueChange, locales, className = "", ...props }: ActivityRingsProps) {
  const reduced = useReducedMotion();
  const goals = allGoals.slice(0, 3);
  const lastDay = Math.max(0, days.reduce((last, d, i) => (d.values.some((v) => v !== null) ? i : last), 0));
  const [own, setOwn] = React.useState(defaultValue ?? days[lastDay]?.key);
  const dayKey = value ?? own;
  const index = Math.max(0, days.findIndex((d) => d.key === dayKey));
  const day = days[index];
  const [visible, setVisible] = React.useState(false);
  const [focus, setFocus] = React.useState<number | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const dayRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

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

  const pick = (i: number, moveFocus = false) => {
    const target = days[i];
    if (!target || i > lastDay) return;
    if (value === undefined) setOwn(target.key);
    onValueChange?.(target.key);
    if (moveFocus) dayRefs.current[i]?.focus();
  };

  const share = (g: number, d = day) => (d && d.values[g] != null ? (d.values[g] as number) / (goals[g].goal || 1) : 0);
  const fmt = (n: number, g: RingGoal) => new Intl.NumberFormat(locales, g.format).format(n);

  return (
    <div ref={rootRef} className={`@container w-full rounded-[22px] bg-background shadow-[0_0_0_1px_var(--border)] ${className}`} {...props}>
      <div className="p-4 @md:p-5">
        <p className="text-[12px] text-muted-foreground @md:text-[13px]">
          <TextMorph>{day?.title ?? day?.label ?? ""}</TextMorph>
        </p>

        <div className="mt-3 flex items-center gap-4 @md:gap-6" onPointerLeave={() => setFocus(null)}>
          <svg aria-hidden="true" viewBox={`0 0 ${BIG.size} ${BIG.size}`} className="w-[108px] shrink-0 @md:w-[132px]">
            {goals.map((g, i) => (
              <Ring key={g.id} geo={BIG} i={i} share={visible ? share(i) : 0} color={COLORS[i]} dim={focus !== null && focus !== i} reduced={reduced} delay={visible ? i * 120 : 0} />
            ))}
          </svg>

          <ul className="min-w-0 flex-1 divide-y divide-border">
            {goals.map((g, i) => {
              const v = day?.values[i];
              const s = share(i);
              return (
                <li
                  key={g.id}
                  onPointerEnter={() => setFocus(i)}
                  className="py-1.5 transition-opacity duration-300 first:pt-0 last:pb-0 @md:py-2"
                  style={{ opacity: focus !== null && focus !== i ? 0.45 : 1 }}
                >
                  <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground @md:text-[12px]">
                    <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="truncate">{g.label}</span>
                  </span>
                  <span className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
                    <span className="text-[14px] font-medium tracking-[-0.01em] text-foreground @md:text-[15px]">
                      <NumberRoll value={visible && v != null ? v : 0} format={g.format} locales={locales} duration={900} />
                    </span>
                    <span className="text-[11px] text-muted-foreground @md:text-[11.5px]">/ {fmt(g.goal, g)}</span>
                    <span className={`ml-auto text-[11px] tabular-nums @md:text-[11.5px] ${s >= 1 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      <NumberRoll value={visible ? s : 0} format={{ style: "percent" }} duration={900} />
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* The week: seven small rings; pick one to see that day. */}
        <div
          role="radiogroup"
          aria-label="Day"
          className="mt-4 grid grid-cols-7 gap-0.5 border-t border-border pt-3 @md:mt-5"
          onKeyDown={(e) => {
            const moves: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: lastDay };
            if (!(e.key in moves)) return;
            e.preventDefault();
            pick(Math.min(lastDay, Math.max(0, moves[e.key])), true);
          }}
        >
          {days.map((d, i) => {
            const selected = i === index;
            const future = i > lastDay;
            return (
              <button
                key={d.key}
                ref={(el) => {
                  dayRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-disabled={future || undefined}
                aria-label={`${d.title ?? d.label}${future ? ", still to come" : `: ${goals.map((g, gi) => `${g.label} ${Math.round(share(gi, d) * 100)}%`).join(", ")}`}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => pick(i)}
                className={`flex flex-col items-center gap-1 rounded-[10px] py-1.5 transition-colors duration-300 ${FOCUS} ${selected ? "bg-accent" : future ? "cursor-default" : "hover:bg-accent/60"}`}
              >
                <svg aria-hidden="true" viewBox={`0 0 ${SMALL.size} ${SMALL.size}`} className="w-6 @md:w-7" style={{ opacity: future ? 0.35 : 1 }}>
                  {goals.map((g, gi) => (
                    <Ring key={g.id} geo={SMALL} i={gi} share={visible ? share(gi, d) : 0} color={COLORS[gi]} dim={false} reduced={reduced} delay={visible ? i * 40 : 0} tip={false} />
                  ))}
                </svg>
                <span className={`text-[10.5px] leading-none @md:text-[11px] ${selected ? "font-medium text-foreground" : "text-muted-foreground"}`}>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
