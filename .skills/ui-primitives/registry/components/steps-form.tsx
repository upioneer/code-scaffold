// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Steps form (steps-form)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { NumberRoll } from "./number-roll";
import { StatusButton, type ActionStatus } from "./status-button";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * STEPS FORM: one card that walks you through, and changes shape
 *
 *   header    a bar of segments fills as you go; the step's name
 *             and title morph letter by letter and "2 / 4" rolls
 *   step      the next step slides in from the side you're going
 *             (and back from the other side), out of a blur, while
 *             the card eases to its height
 *   check     Continue runs the step's check: a message shakes the
 *             step and folds open under it; an async check shows
 *             "Checking" in the button first
 *   back      Back folds out of the footer on the first step
 *   submit    on the last step Continue morphs into your action;
 *             it spins, draws a check, and the whole card turns into
 *             what comes next
 *
 * It's a real form: Enter continues, and focus moves to the new
 * step's first field.
 * ───────────────────────────────────────────────────────── */

export interface FormStep {
  id: string;
  /** Short name for the header, e.g. "Plan". */
  label: string;
  title: string;
  description?: React.ReactNode;
  content: React.ReactNode;
  /** Return a message to stop on this step, or nothing to go on. */
  validate?: () => string | null | undefined | void | Promise<string | null | undefined | void>;
}

export interface StepsFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "children"> {
  steps: FormStep[];
  /** Runs after the last step's check; throw (with a message) to stay. */
  onSubmit: () => void | Promise<void>;
  /** The last button's labels: idle, while it runs, and when it's done. */
  submitLabels?: Partial<Record<"idle" | "pending" | "success", string>>;
  /** What the card becomes once it's submitted. */
  done?: React.ReactNode;
  onStepChange?: (index: number) => void;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** The part that changes: eases to each step's height, slides the new one in over the old one leaving. */
function Panel({ id, dir, children, reduced }: { id: string; dir: number; children: React.ReactNode; reduced: boolean }) {
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | null>(null);
  const [ghost, setGhost] = React.useState<{ id: string; node: React.ReactNode; dir: number } | null>(null);
  const last = React.useRef({ id, node: children });

  React.useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [id]);

  React.useLayoutEffect(() => {
    if (id === last.current.id) {
      last.current.node = children;
      return;
    }
    if (!reduced) setGhost({ id: last.current.id, node: last.current.node, dir });
    last.current = { id, node: children };
    if (reduced) return;
    innerRef.current?.animate(
      [
        { opacity: 0, transform: `translateX(${dir * 28}px)`, filter: "blur(4px)" },
        { opacity: 1, transform: "none", filter: "blur(0px)" },
      ],
      { duration: 420, delay: 60, easing: EASE, fill: "backwards" },
    );
  }, [id, children, dir, reduced]);

  return (
    <div className="relative overflow-hidden" style={{ height: height ?? undefined, transition: reduced || height === null ? "none" : `height 440ms ${EASE}` }}>
      {ghost && (
        <div
          key={`ghost-${ghost.id}`}
          aria-hidden="true"
          inert
          className="pointer-events-none absolute inset-x-0 top-0"
          ref={(el) => {
            if (!el || el.dataset.out) return;
            el.dataset.out = "1";
            const a = el.animate(
              [
                { opacity: 1, transform: "none", filter: "blur(0px)" },
                { opacity: 0, transform: `translateX(${ghost.dir * -28}px)`, filter: "blur(4px)" },
              ],
              { duration: 260, easing: EASE, fill: "forwards" },
            );
            a.onfinish = () => setGhost((g) => (g?.id === ghost.id ? null : g));
          }}
        >
          {ghost.node}
        </div>
      )}
      <div key={id} ref={innerRef}>
        {children}
      </div>
    </div>
  );
}

export function StepsForm({
  steps,
  onSubmit,
  submitLabels,
  done,
  onStepChange,
  className = "",
  ...props
}: StepsFormProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const formRef = React.useRef<HTMLFormElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [status, setStatus] = React.useState<ActionStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [finished, setFinished] = React.useState(false);
  const [moved, setMoved] = React.useState(false);
  const step = steps[index];
  const last = index === steps.length - 1;
  const working = status === "pending" || status === "success";

  const go = (next: number) => {
    setDir(next > index ? 1 : -1);
    setIndex(next);
    setError(null);
    setStatus("idle");
    setMoved(true);
    onStepChange?.(next);
  };

  // A new step: put the cursor in its first field (not on first load, which shouldn't steal focus).
  React.useEffect(() => {
    if (!moved) return;
    const field = bodyRef.current?.querySelector<HTMLElement>("[data-autofocus], input:not([type=hidden]), select, textarea");
    field?.focus({ preventScroll: true });
  }, [index, moved]);

  const shake = () => {
    if (reduced) return;
    bodyRef.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
      { duration: 380, easing: "ease-out" },
    );
  };

  const next = async () => {
    if (working) return;
    setError(null);
    const check = step.validate?.();
    if (check instanceof Promise) setStatus("pending");
    const message = await check;
    if (message) {
      setStatus("idle");
      setError(message);
      shake();
      return;
    }
    if (!last) return go(index + 1);
    setStatus("pending");
    try {
      await onSubmit();
      setStatus("success");
      window.setTimeout(() => setFinished(true), reduced ? 0 : 750);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error && e.message ? e.message : "That didn’t work. Try again.");
      shake();
    }
  };

  const labels = last
    ? { idle: submitLabels?.idle ?? "Create", pending: submitLabels?.pending ?? "Creating", success: submitLabels?.success ?? "Created", error: "Try again" }
    : { idle: "Continue", pending: "Checking", success: "Continue", error: "Continue" };

  return (
    <form
      ref={formRef}
      noValidate
      aria-labelledby={`${id}-title`}
      onSubmit={(e) => {
        e.preventDefault();
        void next();
      }}
      // Once they start fixing it, the message folds away.
      onInput={() => error && status !== "error" && setError(null)}
      onChange={() => error && status !== "error" && setError(null)}
      className={`@container w-full rounded-[20px] border border-border bg-card text-card-foreground ${className}`}
      {...props}
    >
      {/* Header: folds away once it's done. */}
      <div className="grid" style={{ gridTemplateRows: finished ? "0fr" : "1fr", transition: reduced ? "none" : `grid-template-rows 420ms ${EASE}` }}>
        <div className="overflow-hidden">
          <div className="px-4 pt-4 @md:px-5 @md:pt-5">
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <TextMorph>{step.label}</TextMorph>
              <span className="tabular-nums" aria-hidden="true">
                <NumberRoll value={index + 1} duration={450} /> / {steps.length}
              </span>
            </div>
            <div className="mt-2 flex gap-1" aria-hidden="true">
              {steps.map((s, i) => (
                <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full origin-left rounded-full bg-primary"
                    style={{
                      transform: `scaleX(${i <= index || finished ? 1 : 0})`,
                      transition: reduced ? "none" : `transform 520ms ${EASE} ${i === index && dir > 0 ? 80 : 0}ms`,
                    }}
                  />
                </span>
              ))}
            </div>
            <h2 id={`${id}-title`} className="mt-4 text-[18px] font-semibold leading-tight tracking-tight text-foreground @md:text-[20px]">
              <TextMorph>{step.title}</TextMorph>
            </h2>
          </div>
        </div>
      </div>

      <div ref={bodyRef} className="px-4 @md:px-5">
        <Panel id={finished ? "done" : step.id} dir={finished ? 1 : dir} reduced={reduced}>
          {finished ? (
            <div className="py-5">{done}</div>
          ) : (
            <div className="pb-1 pt-1.5">
              {step.description && <div className="mb-4 text-[13px] leading-relaxed text-muted-foreground">{step.description}</div>}
              {step.content}
            </div>
          )}
        </Panel>
        {/* What stopped you, folding open under the step. */}
        <div className="grid" style={{ gridTemplateRows: error && !finished ? "1fr" : "0fr", transition: reduced ? "none" : `grid-template-rows 300ms ${EASE}` }}>
          <div className="overflow-hidden">
            <p role="alert" className="flex items-start gap-1.5 pt-2.5 text-[12.5px] leading-snug text-red-600 dark:text-red-400">
              {error && <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />}
              {error}
            </p>
          </div>
        </div>
      </div>

      {/* Footer: Back folds away on the first step, everything folds away once it's done. */}
      <div className="grid" style={{ gridTemplateRows: finished ? "0fr" : "1fr", transition: reduced ? "none" : `grid-template-rows 420ms ${EASE}` }}>
        <div className="overflow-hidden">
          <div className="flex items-center gap-2 p-4 pt-5 @md:p-5">
            <div className="grid" style={{ gridTemplateColumns: index > 0 ? "1fr" : "0fr", transition: reduced ? "none" : `grid-template-columns 360ms ${EASE}` }}>
              <div className="overflow-hidden">
                <button
                  type="button"
                  tabIndex={index > 0 ? 0 : -1}
                  aria-hidden={index === 0}
                  disabled={working}
                  onClick={() => go(index - 1)}
                  className={`cursor-pointer disabled:cursor-default h-9 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 ${FOCUS}`}
                >
                  Back
                </button>
              </div>
            </div>
            <StatusButton type="submit" status={status} labels={labels} className="ml-auto" />
          </div>
        </div>
      </div>
    </form>
  );
}
