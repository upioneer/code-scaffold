// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Waitlist field (waitlist-field)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * WAITLIST FIELD: an email field that becomes its own answer
 *
 *   idle     email and "Join the waitlist" in one pill
 *   invalid  the pill gives a small shake, its edge tints and
 *            a hint fades in underneath
 *   joining  the button stretches across the whole field and
 *            a light sweeps through it while the request runs
 *   joined   "You're on the list · #1,248": a check draws
 *            itself and the place number rolls up into view
 *   failed   the button folds back and asks you to try again
 *
 * Give it an onSubmit that returns a promise (resolve with
 * { position } to show the place in line).
 * ───────────────────────────────────────────────────────── */

export interface WaitlistResult {
  position?: number;
}

export interface WaitlistFieldProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  onSubmit: (email: string) => Promise<WaitlistResult | void> | WaitlistResult | void;
  /** Show the joined state straight away, e.g. for someone already on the list. */
  joined?: WaitlistResult | null;
  placeholder?: string;
  labels?: Partial<{ idle: string; pending: string; success: string; error: string; invalid: string }>;
}

type Status = "idle" | "pending" | "success" | "error";

const LABELS = {
  idle: "Join the waitlist",
  pending: "Joining",
  success: "You’re on the list",
  error: "Try again",
  invalid: "Enter a full email address",
};
const EASE = "cubic-bezier(0.16,1,0.3,1)";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

const shake = (el: HTMLElement | null) =>
  el?.animate(
    [{ transform: "none" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-2px)" }, { transform: "none" }],
    { duration: 380, easing: "ease-out" }
  );

export function WaitlistField({ onSubmit, joined, placeholder = "you@company.com", labels, className = "", ...props }: WaitlistFieldProps) {
  const reduced = useReducedMotion();
  const text = { ...LABELS, ...labels };
  const id = React.useId();
  const [status, setStatus] = React.useState<Status>(joined ? "success" : "idle");
  const [position, setPosition] = React.useState<number | undefined>(joined?.position);
  const [email, setEmail] = React.useState("");
  const [invalid, setInvalid] = React.useState(false);
  const [restWidth, setRestWidth] = React.useState(0);
  const pillRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // How wide the button is at rest: measured from its label, so the stretch starts exactly from there.
  const restLabel = status === "error" ? text.error : text.idle;
  React.useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => setRestWidth((w) => (w === el.offsetWidth ? w : el.offsetWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [restLabel]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "pending" || status === "success") return;
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setInvalid(true);
      if (!reduced) shake(pillRef.current);
      inputRef.current?.focus();
      return;
    }
    setInvalid(false);
    setStatus("pending");
    try {
      const result = await onSubmit(value);
      setPosition(result ? result.position : undefined);
      setStatus("success");
    } catch {
      setStatus("error");
      if (!reduced) shake(pillRef.current);
    }
  };

  const covering = status === "pending" || status === "success";
  const transition = reduced ? "none" : `width 560ms ${EASE}, background-color 300ms ${EASE}`;

  return (
    <form noValidate onSubmit={submit} className={`w-full ${className}`} {...props}>
      <div
        ref={pillRef}
        className={`relative flex h-12 items-center rounded-full bg-background p-1 transition-[box-shadow] duration-300 ${
          invalid ? "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-red-500)_55%,transparent)]" : "shadow-[inset_0_0_0_1px_var(--border)] focus-within:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_30%,transparent)]"
        }`}
      >
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input
          ref={inputRef}
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          disabled={covering}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-hint` : undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            if (invalid) setInvalid(false);
          }}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent pl-4 text-[14px] text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-0"
          style={{ paddingRight: restWidth + 12, transition: reduced ? "none" : "opacity 200ms ease-out" }}
        />

        {/* The one surface: rests as a button, stretches over the field, settles as the answer. */}
        <button
          type="submit"
          aria-disabled={covering || undefined}
          className="cursor-pointer disabled:cursor-default aria-disabled:cursor-default absolute bottom-1 right-1 top-1 flex items-center justify-center overflow-hidden rounded-full bg-primary px-4 text-[13px] font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
          style={{ width: covering ? "calc(100% - 8px)" : restWidth || undefined, transition }}
        >
          {status === "pending" && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[ui-scan_1.3s_ease-in-out_infinite] motion-reduce:hidden" />
            </span>
          )}
          <span className="relative flex items-center gap-2 whitespace-nowrap">
            <span
              aria-hidden="true"
              className="flex h-4 items-center justify-center overflow-hidden"
              style={{ width: status === "success" ? 16 : 0, transition: reduced ? "none" : `width 380ms ${EASE}` }}
            >
              <svg viewBox="0 0 16 16" fill="none" className="size-4 shrink-0">
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  style={{ strokeDashoffset: status === "success" ? 0 : 1, transition: status === "success" && !reduced ? `stroke-dashoffset 460ms ${EASE} 260ms` : "none" }}
                />
              </svg>
            </span>
            <TextMorph>{status === "pending" ? text.pending : status === "success" ? text.success : restLabel}</TextMorph>
            {status === "success" && position !== undefined && (
              <span className="flex items-center gap-2 animate-[ui-fade-in_300ms_ease-out_200ms_both] motion-reduce:animate-none">
                <span aria-hidden="true" className="opacity-50">
                  ·
                </span>
                <span className="tabular-nums">
                  #<NumberRoll value={position} from={Math.max(0, position - 36)} duration={1100} />
                </span>
              </span>
            )}
          </span>
        </button>

        {/* Measures the resting button, so its width can animate from an exact number. */}
        <span ref={measureRef} aria-hidden="true" className="invisible absolute whitespace-nowrap px-4 text-[13px] font-medium">
          {restLabel}
        </span>
      </div>

      <p
        id={`${id}-hint`}
        className="mt-2 h-4 pl-4 text-[12px] text-red-600 transition-[opacity,transform] duration-300 dark:text-red-400"
        style={{ opacity: invalid ? 1 : 0, transform: invalid ? "none" : "translateY(-3px)" }}
      >
        {invalid ? text.invalid : ""}
      </p>
      <span role="status" className="sr-only">
        {status === "success" ? `${text.success}${position !== undefined ? `, number ${position}` : ""}` : status === "error" ? "That didn’t go through. Try again." : ""}
      </span>
    </form>
  );
}
