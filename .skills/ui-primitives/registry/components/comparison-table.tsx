// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Comparison table (comparison-table)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { Price, PricingToggle } from "./pricing-toggle";

/* ─────────────────────────────────────────────────────────
 * COMPARISON TABLE: plans side by side, and one that stands out
 *
 *   rest      the recommended plan sits in a Tactile column that
 *             runs the height of the table
 *   point     move across the table and the column glides to the
 *             plan under you with a little give, then settles
 *             back when you leave
 *   billing   Monthly/Yearly is thrown to the choice and every
 *             price rolls; the note under it slides the same way
 *   groups    each section folds open and shut to its height
 *   phone     one plan at a time: a switch is thrown to the plan
 *             and its column slides in from the side you went
 *
 * Header stays at the top while the features scroll past.
 * ───────────────────────────────────────────────────────── */

export interface ComparisonPlan {
  id: string;
  name: string;
  /** Monthly price, or { monthly, yearly } per month; null for "Custom". */
  price: number | { monthly: number; yearly: number } | null;
  description?: string;
  /** The column that's highlighted at rest. */
  featured?: boolean;
  badge?: string;
  cta?: { label: string; href?: string; onClick?: () => void };
}

export type ComparisonValue = boolean | string | number | null | undefined;

export interface ComparisonRow {
  label: string;
  hint?: string;
  values: Record<string, ComparisonValue>;
}

export interface ComparisonGroup {
  title: string;
  rows: ComparisonRow[];
  /** Start folded. */
  collapsed?: boolean;
}

export interface ComparisonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  plans: ComparisonPlan[];
  groups: ComparisonGroup[];
  currency?: string;
  /** Shows a Monthly/Yearly switch, e.g. "Save 20%". */
  yearlyBadge?: string;
  /** How far from the top the header sticks (e.g. under a fixed navbar). */
  stickyTop?: number;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

function Cell({ value }: { value: ComparisonValue }) {
  if (value === true)
    return (
      <svg role="img" aria-label="Included" viewBox="0 0 16 16" fill="none" className="size-4 text-foreground">
        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (value === false || value === null || value === undefined)
    return (
      <svg role="img" aria-label="Not included" viewBox="0 0 16 16" fill="none" className="size-4 text-muted-foreground/45">
        <path d="M4.5 8h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  return <span className="text-[13px] text-foreground">{value}</span>;
}

export function ComparisonTable({ plans, groups, currency = "USD", yearlyBadge, stickyTop = 0, className = "", ...props }: ComparisonTableProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [billing, setBilling] = React.useState("monthly");
  const [billingDir, setBillingDir] = React.useState(1);
  const [hover, setHover] = React.useState<number | null>(null);
  const [selected, setSelected] = React.useState(() => Math.max(0, plans.findIndex((p) => p.featured)));
  const [dir, setDir] = React.useState(1);
  const [open, setOpen] = React.useState(() => groups.map((g) => !g.collapsed));
  const [cols, setCols] = React.useState<{ left: number; width: number }[]>([]);
  const [ready, setReady] = React.useState(false);
  const headRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = React.useState(0);
  const switchRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = React.useState({ left: 0, width: 0 });

  const featured = plans.findIndex((p) => p.featured);
  const lit = hover ?? (featured >= 0 ? featured : null);
  const template = `minmax(9.5rem,1.35fr) repeat(${plans.length}, minmax(0,1fr))`;

  // Where each plan's column is, so the highlight can glide between them.
  React.useLayoutEffect(() => {
    const measure = () => {
      const next = headRefs.current.map((el) => ({ left: el?.offsetLeft ?? 0, width: el?.offsetWidth ?? 0 }));
      setCols((c) => (c.length === next.length && c.every((x, i) => x.left === next[i].left && x.width === next[i].width) ? c : next));
      setHeaderHeight((h) => (h === headerRef.current?.offsetHeight ? h : (headerRef.current?.offsetHeight ?? 0)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    headRefs.current.forEach((el) => el && observer.observe(el));
    if (headerRef.current) observer.observe(headerRef.current);
    const frame = requestAnimationFrame(() => setReady(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [plans.length]);

  // The phone switch's thumb.
  React.useLayoutEffect(() => {
    const el = switchRefs.current[selected];
    if (el) setThumb((t) => (t.left === el.offsetLeft && t.width === el.offsetWidth ? t : { left: el.offsetLeft, width: el.offsetWidth }));
  }, [selected, plans.length]);

  const pick = (i: number) => {
    setDir(i >= selected ? 1 : -1);
    setSelected(i);
  };

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const x = e.clientX - (e.currentTarget as HTMLElement).getBoundingClientRect().left;
    const i = cols.findIndex((c) => x >= c.left - 6 && x <= c.left + c.width + 6);
    setHover(i >= 0 ? i : null);
  };

  const column = lit !== null ? cols[lit] : undefined;
  const glide = ready && !reduced ? `transform 520ms ${THROW}, width 420ms ${EASE}, opacity 300ms ${EASE}` : "none";
  // On a phone only the chosen plan shows; it slides in from the side you went.
  const phone = (i: number) => (i === selected ? `max-sm:block ${dir > 0 ? "max-sm:animate-[ui-slide-from-right_360ms_cubic-bezier(0.16,1,0.3,1)_both]" : "max-sm:animate-[ui-slide-from-left_360ms_cubic-bezier(0.16,1,0.3,1)_both]"} motion-reduce:animate-none` : "max-sm:hidden");

  const priceOf = (plan: ComparisonPlan) => (plan.price === null ? null : typeof plan.price === "number" ? plan.price : billing === "yearly" ? plan.price.yearly : plan.price.monthly);

  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {yearlyBadge && (
          <PricingToggle
            value={billing}
            onValueChange={(v) => {
              setBillingDir(v === "yearly" ? 1 : -1);
              setBilling(v);
            }}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly", badge: yearlyBadge },
            ]}
          />
        )}
        {/* Phones: one plan at a time. */}
        <div role="tablist" aria-label="Plan" className="relative inline-flex rounded-full bg-muted p-0.5 sm:hidden">
          <span
            aria-hidden="true"
            className="absolute inset-y-0.5 left-0 rounded-full bg-background shadow-[0_0_0_1px_var(--border)]"
            style={{ width: thumb.width, transform: `translateX(${thumb.left}px)`, transition: thumb.width && !reduced ? `transform 460ms ${THROW}, width 380ms ${EASE}` : "none" }}
          />
          {plans.map((p, i) => (
            <button
              key={p.id}
              ref={(el) => {
                switchRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={i === selected}
              onClick={() => pick(i)}
              className={`cursor-pointer relative h-8 rounded-full px-3.5 text-[12.5px] font-medium transition-colors duration-300 ${FOCUS} ${i === selected ? "text-foreground" : "text-muted-foreground"}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div role="table" aria-label="Plan comparison" className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {/* The column that runs the height of the table and glides between plans: this part under the header… */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 hidden rounded-b-[18px] bg-accent/60 shadow-[inset_1px_0_0_0_var(--border),inset_-1px_0_0_0_var(--border),inset_0_-1px_0_0_var(--border)] sm:block"
          style={{ top: headerHeight, width: column?.width ?? 0, transform: `translateX(${column?.left ?? 0}px)`, opacity: column ? 1 : 0, transition: glide }}
        />

        {/* Plan headers, kept in view while the features scroll by. */}
        <div ref={headerRef} role="rowgroup" className="sticky z-10 bg-background" style={{ top: stickyTop }}>
          {/* …and this part in the header, gliding in step, so the column reads as one even while the header sticks. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 hidden rounded-t-[18px] bg-accent/60 shadow-[inset_1px_0_0_0_var(--border),inset_-1px_0_0_0_var(--border),inset_0_1px_0_0_var(--border)] sm:block"
            style={{ width: column?.width ?? 0, transform: `translateX(${column?.left ?? 0}px)`, opacity: column ? 1 : 0, transition: glide }}
          />
          <div role="row" className="grid max-sm:!grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" style={{ gridTemplateColumns: template }}>
            <div role="columnheader" className="flex items-end pb-5 pr-4 text-[12px] text-muted-foreground max-sm:hidden">
              <span className="sr-only">Feature</span>
            </div>
            {plans.map((plan, i) => {
              const amount = priceOf(plan);
              return (
                <div
                  key={plan.id}
                  ref={(el) => {
                    headRefs.current[i] = el;
                  }}
                  role="columnheader"
                  aria-label={plan.name}
                  className={`relative px-4 pb-5 pt-5 max-sm:col-span-2 max-sm:px-0 ${phone(i)}`}
                >
                  <div className="relative flex items-center gap-2">
                    <span className="text-[14px] font-medium text-foreground">{plan.name}</span>
                    {plan.badge && <span className="rounded-full bg-primary/10 px-2 py-px text-[11px] font-medium text-primary">{plan.badge}</span>}
                  </div>
                  {plan.description && <p className="relative mt-1 min-h-8 text-[12px] leading-4 text-muted-foreground">{plan.description}</p>}
                  <div className="relative mt-3">
                    {amount === null ? (
                      <p className="text-[28px] font-medium leading-[1.15] tracking-[-0.03em] text-foreground">Custom</p>
                    ) : (
                      <Price
                        amount={amount}
                        currency={currency}
                        direction={billingDir}
                        numberClassName="text-[28px] font-medium leading-[1.15] tracking-[-0.03em] text-foreground"
                      />
                    )}
                  </div>
                  {plan.cta && (
                    <a
                      href={plan.cta.href ?? "#"}
                      onClick={(e) => {
                        if (plan.cta?.onClick) {
                          e.preventDefault();
                          plan.cta.onClick();
                        }
                      }}
                      className={`relative mt-4 flex h-9 items-center justify-center rounded-full text-[13px] font-medium transition-[background-color,color,box-shadow] duration-300 ${FOCUS} ${
                        plan.featured ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:bg-accent"
                      }`}
                    >
                      {plan.cta.label}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {groups.map((group, g) => {
          const isOpen = open[g];
          const groupId = `${id}-g${g}`;
          return (
            <div key={group.title} role="rowgroup">
              <div role="row" className="relative">
                <div role="rowheader" className="border-t border-border">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={groupId}
                    onClick={() => setOpen((o) => o.map((v, i) => (i === g ? !v : v)))}
                    className={`cursor-pointer flex w-full items-center gap-2 rounded-md py-3.5 text-left text-[12.5px] font-medium text-foreground ${FOCUS}`}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 12"
                      className="size-3 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none"
                      style={{ transform: isOpen ? "rotate(90deg)" : "none", transitionTimingFunction: EASE }}
                    >
                      <path d="m4.5 2.5 3.5 3.5-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {group.title}
                  </button>
                </div>
              </div>
              <div
                id={groupId}
                inert={!isOpen}
                className="grid"
                style={{
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  opacity: isOpen ? 1 : 0,
                  transition: reduced ? "none" : `grid-template-rows 460ms ${EASE}, opacity ${isOpen ? "360ms" : "160ms"} ${EASE}`,
                }}
              >
                <div className="min-h-0 overflow-hidden">
                  {group.rows.map((row) => (
                    <div
                      key={row.label}
                      role="row"
                      className="grid border-t border-border/70 max-sm:!grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
                      style={{ gridTemplateColumns: template }}
                    >
                      <div role="rowheader" className="py-3 pr-4">
                        <span className="text-[13px] text-foreground/85">{row.label}</span>
                        {row.hint && <span className="mt-0.5 block text-[11.5px] leading-4 text-muted-foreground">{row.hint}</span>}
                      </div>
                      {plans.map((plan, i) => (
                        <div key={plan.id} role="cell" className={`relative flex items-center px-4 py-3 ${phone(i)}`}>
                          <Cell value={row.values[plan.id]} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {/* Closes the column at the bottom. */}
        <div aria-hidden="true" className="h-4 border-t border-border" />
      </div>
    </div>
  );
}
