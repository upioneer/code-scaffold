// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Pricing calculator (pricing-calculator)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { PricingToggle } from "./pricing-toggle";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * PRICING CALCULATOR: drag to your size, watch the price
 *
 *   drag      the thumb follows your finger; the fill and a
 *             value bubble ride with it and the price rolls as
 *             you go
 *   jump      click the track (or tap a mark) and the thumb is
 *             thrown there with a little give
 *   tiers     crossing a mark morphs the plan's name and lights
 *             the mark; the button's words follow
 *   contact   past the last tier the price folds away and the
 *             line becomes "Let's talk"
 *   yearly    with a discount, a Monthly/Yearly switch rolls every
 *             figure to its yearly price
 *
 * Bring your own formula: price(value) and plan(value). A real
 * slider: arrow keys, Page Up/Down, Home and End.
 * ───────────────────────────────────────────────────────── */

export interface CalculatorMark {
  value: number;
  label: string;
}

export interface PricingCalculatorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  min: number;
  max: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Monthly price for a value, before any yearly discount. */
  price: (value: number) => number;
  /** The plan a value falls in, e.g. "Growth". */
  plan?: (value: number) => string;
  /** Ticks along the track, e.g. where tiers change. */
  marks?: CalculatorMark[];
  /** What's being counted, e.g. "monthly active users". */
  unit?: string;
  /** Intl.NumberFormat options for the value, e.g. { notation: "compact" }. */
  valueFormat?: Intl.NumberFormatOptions;
  currency?: string;
  /** Locale for every figure, e.g. "en-US". Set it when the page is rendered on a server, so both sides format alike. */
  locales?: string | string[];
  /** Evenly spaced orders of magnitude, for ranges like 1,000 to 1,000,000. */
  scale?: "linear" | "log";
  /** At or above this, show "Let's talk" instead of a price. */
  contactFrom?: number;
  /** e.g. 0.2 shows a Monthly/Yearly switch with "Save 20%". */
  yearlyDiscount?: number;
  /** The button under the price; its words follow the plan. */
  cta?: { label: (plan: string) => string; contactLabel?: string; onClick?: (value: number, plan: string, billing: "monthly" | "yearly") => void };
  label?: string;
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

export function PricingCalculator({
  min,
  max,
  step = 1,
  value: valueProp,
  defaultValue,
  onValueChange,
  price,
  plan = () => "",
  marks = [],
  unit = "",
  valueFormat,
  currency = "USD",
  locales,
  scale = "linear",
  contactFrom,
  yearlyDiscount,
  cta,
  label = "Usage",
  className = "",
  ...props
}: PricingCalculatorProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [own, setOwn] = React.useState(defaultValue ?? min);
  const value = valueProp ?? own;
  const [billing, setBilling] = React.useState<"monthly" | "yearly">("monthly");
  const [dragging, setDragging] = React.useState(false);
  const [thrown, setThrown] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);
  const pointer = React.useRef<number | null>(null);

  // Value ↔ position along the track, linear or by orders of magnitude.
  const toRatio = React.useCallback(
    (v: number) => {
      if (scale === "log" && min > 0) return (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
      return (v - min) / (max - min);
    },
    [scale, min, max]
  );
  const fromRatio = React.useCallback(
    (r: number) => {
      const c = Math.min(1, Math.max(0, r));
      const raw = scale === "log" && min > 0 ? Math.exp(Math.log(min) + c * (Math.log(max) - Math.log(min))) : min + c * (max - min);
      // On a log scale, round to a step that suits the size (1,000s near 10k, 10,000s near 100k).
      const s = scale === "log" ? Math.max(step, 10 ** Math.max(0, Math.floor(Math.log10(raw)) - 1)) : step;
      return Math.min(max, Math.max(min, Math.round(raw / s) * s));
    },
    [scale, min, max, step]
  );

  const set = (next: number) => {
    const v = Math.min(max, Math.max(min, next));
    if (valueProp === undefined) setOwn(v);
    onValueChange?.(v);
  };

  const fromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const r = track.getBoundingClientRect();
    return fromRatio((clientX - r.left) / r.width);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    pointer.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    thumbRef.current?.focus({ preventScroll: true });
    // A press away from the thumb throws it there; a press on it starts a drag.
    const onThumb = (e.target as HTMLElement).closest("[data-thumb]");
    setThrown(!onThumb);
    setDragging(Boolean(onThumb));
    set(fromPointer(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    if (!dragging) {
      setThrown(false);
      setDragging(true);
    }
    set(fromPointer(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const r = toRatio(value);
    const nudge = (d: number) => {
      // Each press moves at least one visible step, even where a log scale is coarse.
      const next = fromRatio(r + d);
      return next === value ? value + Math.sign(d) * step : next;
    };
    const moves: Record<string, () => number> = {
      ArrowRight: () => nudge(0.01),
      ArrowUp: () => nudge(0.01),
      ArrowLeft: () => nudge(-0.01),
      ArrowDown: () => nudge(-0.01),
      PageUp: () => nudge(0.1),
      PageDown: () => nudge(-0.1),
      Home: () => min,
      End: () => max,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    setThrown(e.key === "Home" || e.key === "End" || e.key.startsWith("Page"));
    set(moves[e.key]());
  };

  const ratio = Math.min(1, Math.max(0, toRatio(value)));
  const contact = contactFrom !== undefined && value >= contactFrom;
  const planName = plan(value);
  const discount = billing === "yearly" && yearlyDiscount ? yearlyDiscount : 0;
  const monthly = price(value) * (1 - discount);
  const currencyFormat = React.useMemo<Intl.NumberFormatOptions>(() => ({ style: "currency", currency, maximumFractionDigits: 0 }), [currency]);
  const valueText = new Intl.NumberFormat(locales, valueFormat).format(value);
  const moveTransition = reduced || dragging ? "none" : thrown ? `transform 520ms ${THROW}` : `transform 220ms ${EASE}`;
  const fillTransition = reduced || dragging ? "none" : thrown ? `transform 520ms ${THROW}` : `transform 220ms ${EASE}`;

  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {/* The plan's name morphs as you cross a tier. */}
          <p className="h-5 text-[13px] font-medium text-primary">
            <TextMorph>{contact ? "Enterprise" : planName}</TextMorph>
          </p>
          <div className="mt-1 flex h-[60px] items-baseline">
            <span
              className="grid"
              style={{
                gridTemplateColumns: contact ? "0fr" : "1fr",
                opacity: contact ? 0 : 1,
                filter: contact ? "blur(6px)" : "none",
                transition: reduced ? "none" : `grid-template-columns 460ms ${EASE}, opacity 300ms ${EASE}, filter 300ms ${EASE}`,
              }}
            >
              <span className="flex min-w-0 items-baseline gap-1 overflow-hidden whitespace-nowrap">
                <NumberRoll value={Math.round(monthly)} format={currencyFormat} locales={locales} className="text-[52px] font-medium leading-none tracking-[-0.04em] text-foreground" />
                <span className="text-[15px] text-muted-foreground">/mo</span>
              </span>
            </span>
            <span
              className="grid"
              style={{
                gridTemplateColumns: contact ? "1fr" : "0fr",
                opacity: contact ? 1 : 0,
                filter: contact ? "none" : "blur(6px)",
                transition: reduced ? "none" : `grid-template-columns 460ms ${EASE}, opacity 300ms ${EASE} 120ms, filter 300ms ${EASE} 120ms`,
              }}
            >
              <span className="min-w-0 overflow-hidden whitespace-nowrap text-[52px] font-medium leading-none tracking-[-0.04em] text-foreground">Let’s talk</span>
            </span>
          </div>
          <p className="mt-2 min-h-5 text-[13px] leading-5 text-muted-foreground">
            <TextMorph animateWidth={false}>
              {contact
                ? "Volume pricing, SSO and a named contact"
                : discount
                  ? `${new Intl.NumberFormat(locales, currencyFormat).format(Math.round(monthly * 12))} billed yearly`
                  : "Billed monthly, cancel anytime"}
            </TextMorph>
          </p>
        </div>
        {yearlyDiscount ? (
          <PricingToggle
            value={billing}
            onValueChange={(v) => setBilling(v as "monthly" | "yearly")}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly", badge: `Save ${Math.round(yearlyDiscount * 100)}%` },
            ]}
          />
        ) : null}
      </div>

      {/* The slider. */}
      <div className="mt-10 select-none">
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative flex h-10 cursor-pointer touch-none items-center"
        >
          <div className="absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-muted shadow-[inset_0_0_0_1px_var(--border)]">
            <div
              className="h-full origin-left rounded-full bg-primary"
              style={{ transform: `scaleX(${ratio})`, transition: fillTransition }}
            />
          </div>
          {marks.map((m) => {
            const r = toRatio(m.value);
            const passed = value >= m.value;
            return (
              <span
                key={m.value}
                aria-hidden="true"
                className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background-color,transform] duration-300"
                style={{ left: `${r * 100}%`, background: passed ? "var(--primary-foreground)" : "color-mix(in oklab, var(--foreground) 22%, transparent)" }}
              />
            );
          })}
          {/* The thumb, with the value riding above it. The rider ends at the thumb and hangs
              off to the left, so it never widens the page the way a box pushed right would. */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-full"
            style={{ transform: `translateX(${(ratio - 1) * 100}%)`, transition: moveTransition }}
          >
            <div
              ref={thumbRef}
              data-thumb=""
              role="slider"
              tabIndex={0}
              aria-label={label}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={value}
              aria-valuetext={`${valueText}${unit ? ` ${unit}` : ""}${contact ? ", contact sales" : `, ${new Intl.NumberFormat(locales, currencyFormat).format(Math.round(monthly))} a month`}`}
              aria-describedby={`${id}-plan`}
              onKeyDown={onKeyDown}
              className={`pointer-events-auto absolute left-full top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full bg-background shadow-[0_0_0_1px_var(--border)] outline-none transition-[scale] duration-200 focus-visible:ring-2 focus-visible:ring-ring/40 ${
                dragging ? "scale-110 cursor-grabbing" : ""
              }`}
            >
              <span className="size-2 rounded-full bg-primary" />
              {/* Centred over the thumb mid-track, leaning inwards at the ends so it never leaves the track. */}
              <span
                aria-hidden="true"
                className="absolute bottom-full left-1/2 mb-2.5 flex h-7 items-baseline whitespace-nowrap rounded-full bg-background px-2.5 pt-[5px] text-[12.5px] font-medium tabular-nums text-foreground shadow-[inset_0_0_0_1px_var(--border)]"
                style={{ transform: `translateX(${-ratio * 100}%)`, transition: moveTransition }}
              >
                <NumberRoll value={value} format={valueFormat} locales={locales} duration={dragging ? 300 : 600} />
                {unit && <span className="ml-1 font-normal text-muted-foreground">{unit.split(" ").slice(-1)[0]}</span>}
              </span>
            </div>
          </div>
        </div>
        {marks.length > 0 && (
          <div className="relative mt-1 h-5 text-[11.5px]">
            {marks.map((m) => (
              <button
                key={m.value}
                type="button"
                tabIndex={-1}
                onClick={() => {
                  setThrown(true);
                  set(m.value);
                }}
                className={`cursor-pointer absolute -translate-x-1/2 whitespace-nowrap transition-colors duration-300 hover:text-foreground ${value >= m.value ? "text-foreground" : "text-muted-foreground"}`}
                style={{ left: `${toRatio(m.value) * 100}%` }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {cta && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => cta.onClick?.(value, contact ? "Enterprise" : planName, billing)}
            className={`cursor-pointer inline-flex h-10 items-center justify-center rounded-full px-5 text-[13.5px] font-medium transition-[background-color,color,box-shadow,transform] duration-300 active:scale-[0.97] ${FOCUS} ${
              contact ? "text-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:bg-accent" : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <TextMorph>{contact ? (cta.contactLabel ?? "Contact sales") : cta.label(planName)}</TextMorph>
          </button>
        </div>
      )}
      <p id={`${id}-plan`} className="sr-only" aria-live="polite">
        {contact ? "Contact sales for this size" : `${planName} plan`}
      </p>
    </div>
  );
}
