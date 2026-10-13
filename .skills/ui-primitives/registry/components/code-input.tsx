// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Code input (code-input)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { StatusButton, type ActionStatus } from "./status-button";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * CODE INPUT: the six boxes, done properly
 *
 *   typing     each digit rises into its box out of a blur; the
 *              box you're on carries a blinking caret; deleting
 *              lifts a digit away rather than blinking it out
 *   paste      a pasted or autofilled code drops in one box after
 *              another
 *   checking   with every box full, the row carries a sweep of
 *              light while onComplete runs
 *   wrong      the row shakes, the boxes turn red, the label
 *              says so, and the digits clear from the right
 *   right      the digits stay where they are while the boxes'
 *              own outlines melt into one pill around them; a
 *              check draws itself at its end, "Verified"
 *   resend     "Resend in 0:28", the seconds rolling down, then
 *              a Resend button that spins, ticks and starts the
 *              clock again
 *
 * One real input sits over the boxes (one-time-code autofill,
 * paste and the numeric keyboard all just work); the boxes are
 * only what you see.
 * ───────────────────────────────────────────────────────── */

export interface CodeInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Runs when every box is filled. Resolve (or return true) to accept; throw or return false to reject. */
  onComplete?: (code: string) => Promise<boolean | void> | boolean | void;
  /** Shows the resend line; the clock starts on mount and after each resend. */
  onResend?: () => Promise<unknown> | void;
  /** Seconds before a code can be resent. */
  resendAfter?: number;
  label?: string;
  /** Box groups, e.g. [3, 3] puts a dash between two threes. */
  groups?: number[];
  /** Letters as well as digits. */
  alphanumeric?: boolean;
  autoFocus?: boolean;
}

type Phase = "idle" | "checking" | "wrong" | "right";

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const SHEEN =
  "[mask-image:linear-gradient(90deg,rgb(0_0_0/0.4)_35%,#000_50%,rgb(0_0_0/0.4)_65%)] [mask-size:200%_100%] animate-[ui-sheen_1.4s_linear_infinite] motion-reduce:animate-none motion-reduce:[mask-image:none]";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** One character: rises in out of a blur when it arrives, lifts away when it goes. */
function Glyph({ char, delay, animate, reduced }: { char: string | undefined; delay: number; animate: boolean; reduced: boolean }) {
  const [shown, setShown] = React.useState(char);
  const [leaving, setLeaving] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  if (char !== undefined && (char !== shown || leaving)) {
    setShown(char);
    setLeaving(false);
  } else if (char === undefined && shown !== undefined && !leaving) {
    setLeaving(true);
  }

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (leaving) {
      const a = el.animate(
        [
          { opacity: 1, transform: "none", filter: "blur(0px)" },
          { opacity: 0, transform: "translateY(-35%)", filter: "blur(4px)" },
        ],
        { duration: 200, delay, easing: EASE, fill: "forwards" },
      );
      a.onfinish = () => setShown(undefined);
      return () => a.cancel();
    }
    if (!animate || shown === undefined) return;
    const a = el.animate(
      [
        { opacity: 0, transform: "translateY(45%)", filter: "blur(4px)" },
        { opacity: 1, transform: "none", filter: "blur(0px)" },
      ],
      { duration: 300, delay, easing: EASE, fill: "backwards" },
    );
    return () => a.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, leaving]);

  React.useEffect(() => {
    if (leaving && reduced) setShown(undefined);
  }, [leaving, reduced]);

  if (shown === undefined) return null;
  return (
    <span ref={ref} className="inline-block">
      {shown}
    </span>
  );
}

export function CodeInput({
  length = 6,
  value,
  defaultValue = "",
  onValueChange,
  onComplete,
  onResend,
  resendAfter = 30,
  label = `Enter the ${length}-digit code`,
  groups,
  alphanumeric = false,
  autoFocus,
  className = "",
  ...props
}: CodeInputProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [own, setOwn] = React.useState(defaultValue.slice(0, length));
  const code = (value ?? own).slice(0, length);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [focused, setFocused] = React.useState(false);
  const [arrival, setArrival] = React.useState({ length: code.length, from: code.length });
  const [clearing, setClearing] = React.useState(false);
  const [left, setLeft] = React.useState<number | null>(null);
  const [resend, setResend] = React.useState<ActionStatus>("idle");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rowRef = React.useRef<HTMLDivElement>(null);
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
  }, []);

  // How the new characters arrived: one typed, or several at once (paste, autofill) to cascade in.
  if (arrival.length !== code.length) setArrival({ length: code.length, from: arrival.length });
  const arrivedFrom = arrival.from;

  const setCode = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  // Resend clock: whole seconds, started on mount and after each resend.
  const startClock = React.useCallback(() => setLeft(resendAfter), [resendAfter]);
  React.useEffect(() => {
    if (onResend) startClock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    if (left === null || left <= 0) return;
    const timer = window.setTimeout(() => setLeft((s) => (s === null ? s : s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);

  const check = async (full: string) => {
    if (!onComplete) return;
    setPhase("checking");
    let ok = true;
    try {
      ok = (await onComplete(full)) !== false;
    } catch {
      ok = false;
    }
    if (ok) {
      setPhase("right");
      inputRef.current?.blur();
      return;
    }
    setPhase("wrong");
    if (!reduced) {
      rowRef.current?.animate(
        [{ transform: "none" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "none" }],
        { duration: 380, easing: "ease-out" },
      );
    }
    // Let the shake land, then clear from the right and start again at the first box.
    window.setTimeout(() => {
      setClearing(true);
      setCode("");
      inputRef.current?.focus();
      window.setTimeout(() => setClearing(false), 400);
    }, reduced ? 0 : 650);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (phase === "checking" || phase === "right") return;
    const raw = e.target.value;
    const clean = (alphanumeric ? raw.replace(/[^a-z0-9]/gi, "").toUpperCase() : raw.replace(/\D/g, "")).slice(0, length);
    if (phase === "wrong") setPhase("idle");
    setCode(clean);
  };

  // A full code, however it arrived (typed, pasted, autofilled or set from outside), gets checked once.
  const lastLength = React.useRef(code.length);
  React.useEffect(() => {
    if (code.length === length && lastLength.current < length && (phase === "idle" || phase === "wrong")) check(code);
    lastLength.current = code.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const doResend = async () => {
    if (!onResend || resend === "pending") return;
    setResend("pending");
    try {
      await onResend();
      setResend("success");
      window.setTimeout(() => {
        setResend("idle");
        startClock();
      }, reduced ? 0 : 1100);
    } catch {
      setResend("error");
    }
  };

  // Where the dashes go between groups.
  const breaks = new Set<number>();
  if (groups) groups.reduce((at, size) => (breaks.add(at + size), at + size), 0);
  const right = phase === "right";
  const wrong = phase === "wrong";
  const active = focused && phase !== "checking" && !right ? Math.min(code.length, length - 1) : -1;
  const labelText = right ? "Verified" : wrong ? "That code didn't work" : phase === "checking" ? "Checking the code" : label;

  return (
    <div className={`@container w-full ${className}`} {...props}>
      <label htmlFor={id} className={`block text-[12.5px] transition-colors duration-300 ${wrong ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
        <TextMorph>{labelText}</TextMorph>
      </label>

      <div className="relative mt-2 w-fit">
        <input
          ref={inputRef}
          id={id}
          value={code}
          onChange={onChange}
          onFocus={(e) => {
            setFocused(true);
            const end = e.currentTarget.value.length;
            e.currentTarget.setSelectionRange(end, end);
          }}
          onBlur={() => setFocused(false)}
          onSelect={(e) => {
            // The caret always sits at the end; the boxes show where you are.
            const el = e.currentTarget;
            if (el.selectionStart !== el.value.length) el.setSelectionRange(el.value.length, el.value.length);
          }}
          readOnly={phase === "checking" || right}
          autoFocus={autoFocus}
          autoComplete="one-time-code"
          inputMode={alphanumeric ? "text" : "numeric"}
          pattern={alphanumeric ? "[A-Za-z0-9]*" : "[0-9]*"}
          maxLength={length}
          spellCheck={false}
          aria-invalid={wrong || undefined}
          className="absolute inset-0 z-10 h-full w-full cursor-text bg-transparent text-[16px] text-transparent caret-transparent opacity-0 outline-none [&::selection]:bg-transparent"
        />

        {/* The boxes, and the one pill they become when the code is right. */}
        <div
          ref={rowRef}
          aria-hidden="true"
          className={`relative flex items-center gap-[var(--code-gap,8px)] rounded-[12px] @max-[19rem]:gap-[var(--code-gap,4px)] transition-[box-shadow,background-color] duration-500 ${phase === "checking" ? SHEEN : ""}`}
          style={{
            boxShadow: right ? "0 0 0 1px color-mix(in oklab, #10b981 55%, transparent)" : "0 0 0 1px transparent",
            background: right ? "color-mix(in oklab, #10b981 6%, var(--background))" : "transparent",
            transitionTimingFunction: EASE,
          }}
        >
          {Array.from({ length }, (_, i) => {
            const char = code[i];
            const isActive = i === active;
            const cascade = !clearing && code.length - arrivedFrom > 1 && i >= arrivedFrom ? (i - arrivedFrom) * 45 : 0;
            const exitDelay = clearing ? (length - 1 - i) * 30 : 0;
            return (
              <React.Fragment key={i}>
                {/* The dash fades but keeps its place, so no digit moves when the code is right. */}
                {breaks.has(i) && i > 0 && (
                  <span className="mx-0.5 block h-px w-2 bg-muted-foreground/40 transition-opacity duration-300" style={{ opacity: right ? 0 : 1 }} />
                )}
                <span
                  className="relative flex h-10 w-[34px] shrink-0 items-center justify-center text-[18px] font-medium tabular-nums text-foreground transition-[box-shadow,background-color] duration-300 @max-[19rem]:w-[30px] @min-[22rem]:h-11 @min-[22rem]:w-9 @min-[22rem]:text-[19px]"
                  style={{
                    borderRadius: 10,
                    boxShadow: right
                      ? "inset 0 0 0 1px transparent"
                      : wrong
                        ? "inset 0 0 0 1px color-mix(in oklab, #ef4444 60%, transparent)"
                        : isActive
                          ? "inset 0 0 0 1.5px color-mix(in oklab, var(--ring) 70%, transparent)"
                          : "inset 0 0 0 1px var(--border)",
                    background: right ? "transparent" : "var(--background)",
                  }}
                >
                  <Glyph char={char} delay={char !== undefined ? cascade : exitDelay} animate={mounted.current} reduced={reduced} />
                  {/* The caret, blinking only in the box you're on. */}
                  {isActive && char === undefined && (
                    <span className="absolute h-5 w-px bg-foreground animate-[ui-blink_1s_steps(1)_infinite] motion-reduce:animate-none" />
                  )}
                </span>
              </React.Fragment>
            );
          })}

          {/* The check at the end of the pill: the pill grows to the right for it, the digits stay put. */}
          <span
            className="grid transition-[grid-template-columns,opacity] duration-500"
            style={{ gridTemplateColumns: right ? "1fr" : "0fr", opacity: right ? 1 : 0, transitionTimingFunction: EASE }}
          >
            <span className="flex min-w-0 items-center overflow-hidden">
              <svg viewBox="0 0 16 16" className="ml-1 mr-3 size-4 shrink-0 text-emerald-600" fill="none">
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  style={{ strokeDashoffset: right ? 0 : 1, transition: reduced ? "none" : `stroke-dashoffset 420ms ${EASE} 260ms` }}
                />
              </svg>
            </span>
          </span>
        </div>
      </div>

      {onResend && !right && (
        <div className="mt-3 flex h-7 items-center gap-1.5 text-[12px] text-muted-foreground">
          <span>Didn’t get it?</span>
          {/* The countdown and the button share one place; each fades through a blur into the other. */}
          <span className="grid items-center">
            {/* The ticking digits stay out of screen readers; they hear that a resend is coming instead. */}
            <span className="sr-only">{left && left > 0 ? "You can resend the code shortly." : ""}</span>
            <span
              className="col-start-1 row-start-1 flex items-baseline whitespace-nowrap tabular-nums"
              aria-hidden="true"
              style={{
                opacity: left && left > 0 ? 1 : 0,
                filter: left && left > 0 ? "none" : "blur(3px)",
                transition: reduced ? "none" : `opacity 260ms ${EASE}, filter 260ms ${EASE}`,
              }}
            >
              Resend in 0:
              <NumberRoll value={left ?? resendAfter} format={{ minimumIntegerDigits: 2 }} direction="down" duration={700} />
            </span>
            <span
              className="col-start-1 row-start-1"
              inert={!!(left && left > 0)}
              style={{
                opacity: left && left > 0 ? 0 : 1,
                filter: left && left > 0 ? "blur(3px)" : "none",
                transition: reduced ? "none" : `opacity 260ms ${EASE}, filter 260ms ${EASE}`,
              }}
            >
              <StatusButton
                variant="ghost"
                size="sm"
                status={resend}
                labels={{ idle: "Resend code", pending: "Sending", success: "Sent", error: "Try again" }}
                onClick={doResend}
                className="-ml-2"
              />
            </span>
          </span>
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {right ? "Code verified" : wrong ? "That code didn't work. Enter it again." : phase === "checking" ? "Checking the code" : ""}
      </p>
    </div>
  );
}
