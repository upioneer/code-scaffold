// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Model picker (model-picker)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * MODEL PICKER: the pill grows into the menu
 *
 *   closed   a quiet pill in the composer toolbar: model and
 *            thinking effort; both morph when they change, and
 *            the model's icon trades places through a blur
 *   open     a copy of the pill lifts clear of the composer and
 *            unfolds into the list: each model with a line on
 *            what it's for, speed and smarts
 *   effort   models that reason get a Thinking control; the
 *            panel's height follows
 *   locked   paid models show "Pro" and call onLockedSelect
 *
 * One surface: opening grows the pill's size and radius into the
 * panel while the label cross-fades into the list, and closing
 * folds it back into the pill. It never covers the composer:
 * pass anchorRef and it opens above it, lined up with its edge.
 * ───────────────────────────────────────────────────────── */

export interface ModelOption {
  id: string;
  name: string;
  /** What it's for, e.g. "Fast, everyday questions". */
  description?: string;
  icon?: React.ReactNode;
  /** 1 to 3. */
  speed?: number;
  /** 1 to 3. */
  intelligence?: number;
  /** Supports a thinking-effort setting. */
  reasoning?: boolean;
  /** Needs an upgrade; shows "Pro". */
  locked?: boolean;
}

export interface ModelPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  models: ModelOption[];
  value: string;
  onValueChange: (id: string) => void;
  /** Thinking effort for reasoning models; shown when onEffortChange is set. */
  effort?: string;
  onEffortChange?: (effort: string) => void;
  efforts?: string[];
  /** Called instead of selecting a locked model, e.g. to open pricing. */
  onLockedSelect?: (model: ModelOption) => void;
  /** Grow upward (composers at the bottom) or downward. */
  side?: "top" | "bottom";
  /** Grow from the pill's left edge or its right edge. */
  align?: "start" | "end";
  /** Space to keep from the viewport edges on narrow screens. */
  collisionPadding?: number;
  /** Open clear of this element (e.g. your composer) and line up with its edge, instead of over it. */
  anchorRef?: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
  /** What the choice is, for screen readers: "Model" by default, e.g. "Permission" for a permissions picker. */
  label?: string;
}

type Phase = "closed" | "opening" | "open" | "closing";

const EFFORTS = ["Low", "Medium", "High"];
const EASE = "cubic-bezier(0.23,1,0.32,1)";
const DURATION = 380;
const PANEL_WIDTH = 340;
const GAP = 8;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

function Meter({ value = 0, label }: { value?: number; label: string }) {
  return (
    <span className="flex w-[38px] shrink-0 items-center justify-center gap-[3px]" title={`${label}: ${value} of 3`}>
      {[1, 2, 3].map((n) => (
        <span key={n} aria-hidden="true" className={`h-[5px] w-[7px] rounded-full ${n <= value ? "bg-foreground/70" : "bg-border"}`} />
      ))}
      <span className="sr-only">
        {label} {value} of 3
      </span>
    </span>
  );
}

const MORPH = "cubic-bezier(0.16,1,0.3,1)";

/** The model's icon: a new one rises out of a blur while the old one shrinks away. */
function ModelIcon({ id, icon, reduced }: { id: string; icon: React.ReactNode; reduced: boolean }) {
  const [items, setItems] = React.useState([{ id, icon }]);
  if (items[items.length - 1].id !== id) setItems([...items.slice(-1), { id, icon }]);
  const first = React.useRef(true);
  React.useEffect(() => {
    first.current = false;
  }, []);
  return (
    <span aria-hidden="true" className="relative flex size-4 items-center justify-center text-muted-foreground [&_svg]:size-4 [&_svg]:stroke-[1.8]">
      {items.map((item) => (
        <IconLayer key={item.id} on={item.id === id} enter={!first.current && !reduced} reduced={reduced}>
          {item.icon}
        </IconLayer>
      ))}
    </span>
  );
}

function IconLayer({ on, enter, reduced, children }: { on: boolean; enter: boolean; reduced: boolean; children: React.ReactNode }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [entering] = React.useState(enter);
  React.useLayoutEffect(() => {
    if (!entering) return;
    ref.current?.animate(
      [
        { opacity: 0, transform: "scale(0.6)", filter: "blur(3px)" },
        { opacity: 1, transform: "none", filter: "blur(0px)" },
      ],
      { duration: 380, easing: MORPH, fill: "backwards" }
    );
  }, [entering]);
  return (
    <span
      ref={ref}
      className="absolute inset-0 flex items-center justify-center"
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "scale(0.6)",
        filter: on ? "none" : "blur(3px)",
        transition: reduced ? "none" : `opacity 200ms ${MORPH}, transform 380ms ${MORPH}, filter 200ms ${MORPH}`,
      }}
    >
      {children}
    </span>
  );
}

function PillLabel({ model, effort, reduced }: { model?: ModelOption; effort?: string; reduced: boolean }) {
  // The effort opens beside the name for models that reason, and folds away (keeping its word) for those that don't.
  const showEffort = Boolean(model?.reasoning && effort);
  const [lastEffort, setLastEffort] = React.useState(effort);
  if (effort && effort !== lastEffort) setLastEffort(effort);
  return (
    <>
      {model?.icon && <ModelIcon id={model.id} icon={model.icon} reduced={reduced} />}
      <span className="whitespace-nowrap text-foreground">
        <TextMorph>{model?.name ?? "Choose a model"}</TextMorph>
      </span>
      <span
        className="-ml-1.5 grid"
        style={{
          gridTemplateColumns: showEffort ? "1fr" : "0fr",
          opacity: showEffort ? 1 : 0,
          transition: reduced ? "none" : `grid-template-columns 380ms ${MORPH}, opacity ${showEffort ? "280ms" : "140ms"} ${MORPH}`,
        }}
      >
        <span className="min-w-0 overflow-hidden whitespace-nowrap pl-1.5 text-muted-foreground">
          <TextMorph>{effort ?? lastEffort ?? ""}</TextMorph>
        </span>
      </span>
    </>
  );
}

export function ModelPicker({
  models,
  value,
  onValueChange,
  effort,
  onEffortChange,
  efforts = EFFORTS,
  onLockedSelect,
  side = "top",
  align = "start",
  collisionPadding = 16,
  anchorRef,
  disabled = false,
  label = "Model",
  className = "",
  ...props
}: ModelPickerProps) {
  const id = React.useId();
  const reduced = useReducedMotion();
  const selected = models.find((m) => m.id === value);
  const [phase, setPhase] = React.useState<Phase>("closed");
  const [active, setActive] = React.useState(0);
  const [pill, setPill] = React.useState({ width: 0, height: 32 });
  const [panelHeight, setPanelHeight] = React.useState(0);
  // The panel's width and sideways shift, so it always fits the screen.
  const [fit, setFit] = React.useState({ width: PANEL_WIDTH, shift: 0, lift: 0 });
  const [highlight, setHighlight] = React.useState({ top: 0, ready: false });
  const [segment, setSegment] = React.useState({ left: 0, width: 0, ready: false });
  // After a mouse choice, focus returns to the pill without a keyboard focus ring.
  const [quietFocus, setQuietFocus] = React.useState(false);

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const rowRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const segmentRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const timer = React.useRef(0);

  const expanded = phase === "open";
  const mounted = phase !== "closed";
  const showEffort = Boolean(onEffortChange && selected?.reasoning);

  /* Where the open panel sits: lifted clear of the anchor (the pill itself by default), lined up
   * with the anchor's edge, and narrowed or shifted so it never leaves the screen. */
  const measureFit = React.useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const edge = (anchorRef?.current ?? wrap).getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    const width = Math.min(PANEL_WIDTH, viewport - collisionPadding * 2);
    const lift = side === "top" ? rect.bottom - edge.top + GAP : edge.bottom - rect.top + GAP;
    let shift: number;
    if (align === "start") {
      const left = Math.min(Math.max(edge.left, collisionPadding), viewport - collisionPadding - width);
      shift = left - rect.left;
    } else {
      const right = Math.max(Math.min(edge.right, viewport - collisionPadding), collisionPadding + width);
      shift = right - rect.right;
    }
    setFit((f) => (f.width === width && f.shift === shift && f.lift === lift ? f : { width, shift, lift }));
  }, [align, side, collisionPadding, anchorRef]);

  const open = () => {
    if (disabled || phase === "open" || phase === "opening") return;
    window.clearTimeout(timer.current);
    measureFit();
    setActive(Math.max(0, models.findIndex((m) => m.id === value)));
    setPhase(reduced ? "open" : "opening");
  };

  const close = React.useCallback(
    (refocus = true) => {
      window.clearTimeout(timer.current);
      if (refocus) triggerRef.current?.focus({ preventScroll: true });
      if (reduced) {
        setPhase("closed");
        return;
      }
      setPhase("closing");
      timer.current = window.setTimeout(() => setPhase("closed"), DURATION);
    },
    [reduced]
  );

  // Opening: paint the surface at the pill's size first, then let it grow.
  React.useEffect(() => {
    if (phase !== "opening") return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setPhase("open"));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [phase]);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  React.useEffect(() => {
    if (!mounted) return;
    window.addEventListener("resize", measureFit);
    return () => window.removeEventListener("resize", measureFit);
  }, [mounted, measureFit]);

  React.useEffect(() => {
    if (expanded) listRef.current?.focus({ preventScroll: true });
  }, [expanded]);

  // Measure the pill and the panel; both can change with the model, effort or font loading.
  React.useLayoutEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const measure = () => {
      const width = trigger.offsetWidth;
      const height = trigger.offsetHeight;
      setPill((p) => (p.width === width && p.height === height ? p : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(trigger);
    return () => observer.disconnect();
  }, []);

  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => setPanelHeight(panel.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [mounted]);

  // The row highlight and the effort pill slide to where they belong.
  React.useLayoutEffect(() => {
    const row = rowRefs.current[active];
    if (!row) return;
    const top = row.offsetTop;
    setHighlight((h) => (h.top === top && h.ready === (h.ready || expanded) ? h : { top, ready: h.ready || expanded }));
  }, [active, expanded, mounted]);

  React.useLayoutEffect(() => {
    const i = efforts.indexOf(effort ?? "");
    const button = segmentRefs.current[i];
    if (!button) return;
    const left = button.offsetLeft;
    const width = button.offsetWidth;
    setSegment((s) => (s.left === left && s.width === width && s.ready === (s.ready || expanded) ? s : { left, width, ready: s.ready || expanded }));
  }, [effort, efforts, expanded, mounted, showEffort]);

  React.useEffect(() => {
    if (!mounted) setHighlight({ top: 0, ready: false });
  }, [mounted]);

  // Close on a click outside, or when focus leaves.
  React.useEffect(() => {
    if (!expanded) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [expanded, close]);

  const choose = (model: ModelOption) => {
    if (model.locked) {
      onLockedSelect?.(model);
      if (onLockedSelect) close();
      return;
    }
    onValueChange(model.id);
    close();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const last = models.length - 1;
    const move = (to: number) => {
      e.preventDefault();
      setActive(Math.max(0, Math.min(last, to)));
    };
    if (e.key === "ArrowDown") move(active === last ? 0 : active + 1);
    else if (e.key === "ArrowUp") move(active === 0 ? last : active - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(last);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (models[active]) choose(models[active]);
    }
  };

  const onEffortKey = (e: React.KeyboardEvent) => {
    if (!onEffortChange || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
    e.preventDefault();
    const i = efforts.indexOf(effort ?? "");
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + efforts.length) % efforts.length;
    onEffortChange(efforts[next]);
    segmentRefs.current[next]?.focus();
  };

  const width = expanded ? fit.width : pill.width;
  const height = expanded ? panelHeight : pill.height;
  const listId = `${id}-list`;

  return (
    <div
      ref={wrapRef}
      className={`relative inline-flex ${className}`}
      onKeyDown={(e) => {
        setQuietFocus(false);
        if (e.key === "Escape" && expanded) {
          e.preventDefault();
          close();
        }
      }}
      onBlur={(e) => {
        if (expanded && !wrapRef.current?.contains(e.relatedTarget as Node)) close(false);
      }}
      {...props}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={mounted ? listId : undefined}
        aria-label={`${label}: ${selected?.name ?? "none"}${selected?.reasoning && effort ? `, ${effort} thinking` : ""}`}
        disabled={disabled}
        onClick={() => (expanded ? close() : open())}
        onPointerDown={() => setQuietFocus(true)}
        onKeyDown={() => setQuietFocus(false)}
        onBlur={() => setQuietFocus(false)}
        className={`cursor-pointer disabled:cursor-default inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors duration-150 hover:bg-accent disabled:pointer-events-none disabled:opacity-50 ${quietFocus ? "outline-none" : FOCUS} ${expanded ? "bg-accent" : ""}`}
      >
        <PillLabel model={selected} effort={effort} reduced={reduced} />
        {/* Points up while the panel is open; the panel's copy of the pill turns in step. */}
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 text-muted-foreground"
          style={{ transform: expanded ? "rotate(180deg)" : "none", transition: reduced ? "none" : `transform 320ms ${EASE}` }}
        />
      </button>

      {mounted && (
        <div
          // Clicks inside keep focus where it is, so the panel only closes when you leave it.
          onPointerDown={(e) => {
            e.preventDefault();
            setQuietFocus(true);
          }}
          className="absolute z-50 overflow-hidden bg-popover text-popover-foreground"
          style={{
            [side === "top" ? "bottom" : "top"]: expanded ? fit.lift : 0,
            [align === "start" ? "left" : "right"]: expanded ? (align === "start" ? fit.shift : -fit.shift) : 0,
            width,
            height,
            borderRadius: expanded ? 20 : pill.height / 2,
            boxShadow: expanded ? "0 0 0 1px var(--border)" : "0 0 0 1px transparent",
            transition: reduced
              ? "none"
              : `width ${DURATION}ms ${EASE}, height ${DURATION}ms ${EASE}, left ${DURATION}ms ${EASE}, right ${DURATION}ms ${EASE}, top ${DURATION}ms ${EASE}, bottom ${DURATION}ms ${EASE}, border-radius ${DURATION}ms ${EASE}, box-shadow 240ms ${EASE}`,
          }}
        >
          {/* The pill's label, fading out as the surface grows (and back in as it folds). */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inline-flex h-8 items-center gap-1.5 px-3 text-[12.5px] font-medium ${side === "top" ? "bottom-0" : "top-0"} ${align === "start" ? "left-0" : "right-0"}`}
            style={{
              opacity: expanded ? 0 : 1,
              transition: reduced ? "none" : expanded ? "opacity 120ms ease-out" : "opacity 200ms ease-out 140ms",
            }}
          >
            <PillLabel model={selected} effort={effort} reduced={reduced} />
            {/* Turns with the surface: up as it opens, back down as it folds, so the hand-off to the pill never flips. */}
            <ChevronDown
              className="size-3.5 text-muted-foreground"
              style={{ transform: expanded ? "rotate(180deg)" : "none", transition: reduced ? "none" : `transform 320ms ${EASE}` }}
            />
          </span>

          <div
            ref={panelRef}
            inert={!expanded}
            className={`absolute p-1.5 ${side === "top" ? "bottom-0" : "top-0"} ${align === "start" ? "left-0" : "right-0"}`}
            style={{
              width: fit.width,
              opacity: expanded ? 1 : 0,
              transform: expanded ? "none" : `translateY(${side === "top" ? 6 : -6}px)`,
              transition: reduced
                ? "none"
                : expanded
                  ? `opacity 240ms ease-out 110ms, transform ${DURATION}ms ${EASE}`
                  : "opacity 100ms ease-out, transform 200ms ease-out",
            }}
          >
            <div className="flex h-7 items-center gap-3 px-2.5 text-[11px] text-muted-foreground">
              <span className="flex-1">{label}</span>
              {models.some((m) => m.speed != null || m.intelligence != null) && (
                <>
                  <span className="w-[38px] text-center">Speed</span>
                  <span className="w-[38px] text-center">Smarts</span>
                </>
              )}
              <span className="w-7" />
            </div>

            <div
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={0}
              aria-label={`${label}s`}
              aria-activedescendant={`${id}-model-${active}`}
              onKeyDown={onListKey}
              className="relative rounded-[14px] outline-none"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-12 rounded-[14px] bg-accent"
                style={{ transform: `translateY(${highlight.top}px)`, transition: highlight.ready && !reduced ? `transform 200ms ${EASE}` : "none" }}
              />
              {models.map((model, i) => {
                const isSelected = model.id === value;
                return (
                  <div
                    key={model.id}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    id={`${id}-model-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={model.locked && !onLockedSelect ? true : undefined}
                    onPointerMove={() => i !== active && setActive(i)}
                    onClick={() => choose(model)}
                    className={`relative flex h-12 cursor-pointer items-center gap-3 rounded-[14px] px-2.5 ${model.locked && !onLockedSelect ? "cursor-default opacity-50" : ""}`}
                  >
                    {model.icon && (
                      <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4 [&_svg]:stroke-[1.8]">
                        {model.icon}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">{model.name}</span>
                      {model.description && <span className="block truncate text-[11.5px] text-muted-foreground">{model.description}</span>}
                    </span>
                    {/* Speed and smarts only for options that have them (a permissions list doesn't). */}
                    {(model.speed != null || model.intelligence != null) && (
                      <>
                        <Meter value={model.speed} label="Speed" />
                        <Meter value={model.intelligence} label="Smarts" />
                      </>
                    )}
                    <span className="flex w-7 shrink-0 justify-end">
                      {model.locked ? (
                        <span className="rounded-full bg-muted px-1.5 py-px text-[10.5px] font-medium text-muted-foreground">Pro</span>
                      ) : isSelected ? (
                        <Check aria-hidden="true" className="size-3.5 text-foreground" strokeWidth={2.2} />
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>

            {showEffort && (
              <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-border/70 px-2.5 pb-1 pt-2.5 animate-[ui-fade-in_200ms_ease-out_both]">
                <span id={`${id}-effort`} className="text-[12px] text-muted-foreground">
                  Thinking
                </span>
                <div role="radiogroup" aria-labelledby={`${id}-effort`} onKeyDown={onEffortKey} className="relative flex rounded-full bg-muted p-0.5">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0.5 left-0 rounded-full bg-background shadow-[0_0_0_1px_var(--border)]"
                    style={{
                      width: segment.width,
                      transform: `translateX(${segment.left}px)`,
                      transition: segment.ready && !reduced ? `transform 240ms ${EASE}, width 240ms ${EASE}` : "none",
                    }}
                  />
                  {efforts.map((level, i) => (
                    <button
                      key={level}
                      ref={(el) => {
                        segmentRefs.current[i] = el;
                      }}
                      type="button"
                      role="radio"
                      aria-checked={level === effort}
                      tabIndex={level === effort ? 0 : -1}
                      onClick={() => onEffortChange?.(level)}
                      className={`cursor-pointer relative h-6 rounded-full px-2.5 text-[11.5px] font-medium transition-colors ${FOCUS} ${level === effort ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
