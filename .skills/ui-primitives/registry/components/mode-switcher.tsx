// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Mode switcher (mode-switcher)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * MODE SWITCHER: Fast, Thinking, Research…
 *
 * A segmented radio group with a pill that is thrown to the chosen
 * mode, with a little give. The description underneath morphs
 * into the new mode's line, keeping the words they share. Locked
 * modes stay visible with a lock, so people see what an upgrade
 * unlocks; choosing one calls onLockedSelect instead. Arrow keys
 * move between modes, like any radio group.
 * ───────────────────────────────────────────────────────── */

export interface Mode {
  value: string;
  label: string;
  /** One line shown under the switcher for the chosen mode. */
  description?: string;
  icon?: React.ReactNode;
  /** Visible but not selectable, e.g. a paid mode. */
  locked?: boolean;
}

export interface ModeSwitcherProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  modes: Mode[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called when someone picks a locked mode, e.g. to open pricing. */
  onLockedSelect?: (mode: Mode) => void;
  /** Show the chosen mode's description underneath. */
  showDescription?: boolean;
  label?: string;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

export function ModeSwitcher({
  modes,
  value,
  defaultValue,
  onValueChange,
  onLockedSelect,
  showDescription = false,
  label = "Mode",
  className = "",
  ...props
}: ModeSwitcherProps) {
  const reduced = useReducedMotion();
  const [own, setOwn] = React.useState(defaultValue ?? modes.find((m) => !m.locked)?.value);
  const current = value ?? own;
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = React.useState<{ left: number; width: number; ready: boolean } | null>(null);
  const index = modes.findIndex((m) => m.value === current);
  const active = modes[index];

  // Measure the chosen button so the pill can slide to it; re-measure when the container resizes.
  React.useLayoutEffect(() => {
    const el = refs.current[index];
    if (!el) return;
    // The first placement doesn't animate; every move after that does.
    const measure = () =>
      setPill((p) => (p && p.left === el.offsetLeft && p.width === el.offsetWidth ? p : { left: el.offsetLeft, width: el.offsetWidth, ready: p !== null }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  const choose = (mode: Mode) => {
    if (mode.locked) {
      onLockedSelect?.(mode);
      return;
    }
    if (value === undefined) setOwn(mode.value);
    onValueChange?.(mode.value);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const open = modes.map((m, i) => ({ m, i })).filter(({ m }) => !m.locked);
    const at = open.findIndex(({ i }) => i === index);
    const next = open[(at + dir + open.length) % open.length];
    if (!next) return;
    choose(next.m);
    refs.current[next.i]?.focus();
  };

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`} {...props}>
      <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="relative inline-flex w-fit items-center rounded-full bg-muted p-0.5">
        {pill && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0.5 left-0 rounded-full bg-background shadow-[0_0_0_1px_var(--border)]"
            style={{
              width: pill.width,
              transform: `translateX(${pill.left}px)`,
              transition: pill.ready && !reduced ? `transform 460ms ${THROW}, width 380ms ${EASE}` : "none",
            }}
          />
        )}
        {modes.map((mode, i) => {
          const selected = mode.value === current;
          return (
            <button
              key={mode.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={mode.locked || undefined}
              tabIndex={selected ? 0 : -1}
              title={mode.locked ? `${mode.label} isn’t available on your plan` : mode.description}
              onClick={() => choose(mode)}
              className={`cursor-pointer disabled:cursor-default aria-disabled:cursor-default relative z-10 flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors ${FOCUS} ${
                selected ? "text-foreground" : mode.locked ? "text-muted-foreground/70" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode.icon && (
                <span aria-hidden="true" className="flex [&>svg]:size-3.5">
                  {mode.icon}
                </span>
              )}
              {mode.label}
              {mode.locked && <Lock aria-hidden="true" className="size-3" />}
            </button>
          );
        })}
      </div>
      {showDescription && (
        // One line that morphs from mode to mode, rather than being swapped.
        <p className="min-h-[18px] px-1 text-[12px] leading-[18px] text-muted-foreground">
          <TextMorph animateWidth={false}>{active?.description ?? ""}</TextMorph>
        </p>
      )}
    </div>
  );
}
