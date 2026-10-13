// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Selection actions (selection-actions)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { ArrowUp, Check, ChevronRight, RotateCcw, Square, X } from "lucide-react";

/* ─────────────────────────────────────────────────────────
 * SELECTION ACTIONS: select text, rewrite it in place
 *
 *   open       a pill under the selection: a field for your own
 *              instruction, quick actions, more behind the chevron
 *   typing     the actions fold away and the field takes the room
 *   thinking   a spinner and "Improving…" until the first words
 *   streaming  the rewrite streams into the selection itself
 *   result     Keep, Discard or try again
 *   error      it didn't work; try again
 *
 * Give it the text as value. onAction gets the selection and
 * returns the rewrite: a string, a promise of one, or an async
 * iterable of chunks to stream. Keep calls onValueChange.
 * ───────────────────────────────────────────────────────── */

export interface SelectionAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Shown while it runs, e.g. "Shortening". */
  pendingLabel?: string;
}

export interface SelectionRequest {
  /** The action's id, or "custom" for a typed instruction. */
  id: string;
  /** The selected text. */
  text: string;
  instruction?: string;
  /** The text around the selection, for context. */
  before: string;
  after: string;
  /** Aborted when the person stops or discards. */
  signal: AbortSignal;
}

/** The rewrite, whole or streamed. Return nothing for actions handled elsewhere (e.g. Explain opening a chat). */
export type SelectionResult = string | AsyncIterable<string> | Promise<string | void> | void;

export interface SelectionActionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Always visible. */
  actions: SelectionAction[];
  /** Behind the chevron. */
  more?: SelectionAction[];
  onAction: (request: SelectionRequest) => SelectionResult;
  placeholder?: string;
}

type Mode = "idle" | "thinking" | "streaming" | "result" | "error";
type Edit = { start: number; end: number; original: string; id: string; label: string; instruction?: string };

const EASE = "cubic-bezier(0.23,1,0.32,1)";
const GLIDE = "cubic-bezier(0.77,0,0.175,1)";
const FIELD = 148;
const FIELD_MIN = 72;
const HIGHLIGHT = "ui-selection";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const QUIET = `cursor-pointer inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] text-foreground transition-[background-color,transform] duration-150 hover:bg-accent active:scale-[0.96] [&_svg]:size-3.5 [&_svg]:text-muted-foreground ${FOCUS}`;
const ICON = `cursor-pointer flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-accent hover:text-foreground active:scale-[0.96] [&_svg]:size-3.5 ${FOCUS}`;
const SHIMMER =
  "bg-[linear-gradient(90deg,color-mix(in_oklab,var(--muted-foreground)_55%,transparent)_35%,var(--foreground)_50%,color-mix(in_oklab,var(--muted-foreground)_55%,transparent)_65%)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[ui-shimmer_1.4s_linear_infinite] motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-foreground/70";

// The Highlight API is newer than some TypeScript DOM libs; reach it through guarded casts.
type Registry = { set(name: string, highlight: unknown): void; delete(name: string): void };
const registry = () => (typeof CSS !== "undefined" ? (CSS as unknown as { highlights?: Registry }).highlights : undefined);
const HighlightClass = () => (globalThis as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight;

const isAsyncIterable = (x: unknown): x is AsyncIterable<string> => typeof x === "object" && x !== null && Symbol.asyncIterator in x;

/** Characters from the start of root to (node, offset). */
function offsetIn(root: Node, node: Node, offset: number) {
  const range = document.createRange();
  range.setStart(root, 0);
  range.setEnd(node, offset);
  return range.toString().length;
}

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** A row that folds to zero width. Its natural width is measured so the fold animates exactly. */
function Fold({
  open,
  width,
  onWidth,
  reduced,
  gap = true,
  children,
}: {
  open: boolean;
  width?: number;
  onWidth?: (width: number) => void;
  reduced: boolean;
  gap?: boolean;
  children: React.ReactNode;
}) {
  const inner = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = inner.current;
    if (!el || !onWidth) return;
    const report = () => onWidth(el.offsetWidth);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onWidth]);

  return (
    <div
      inert={!open}
      className="flex shrink-0 items-center overflow-hidden"
      style={{
        maxWidth: open ? width : 0,
        opacity: open ? 1 : 0,
        transform: open ? "none" : "translateX(-6px)",
        transition: reduced ? "none" : `max-width 400ms ${EASE}, opacity 300ms ${EASE}, transform 400ms ${EASE}`,
      }}
    >
      <div ref={inner} className={`flex w-max shrink-0 items-center gap-0.5 ${gap ? "pl-0.5" : ""}`}>
        {children}
      </div>
    </div>
  );
}

const Divider = () => <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-border" />;

export function SelectionActions({
  value,
  onValueChange,
  actions,
  more = [],
  onAction,
  placeholder = "Describe edits",
  className = "",
  ...props
}: SelectionActionsProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [mode, setModeState] = React.useState<Mode>("idle");
  const [edit, setEdit] = React.useState<Edit | null>(null);
  const [chunks, setChunks] = React.useState<string[]>([]);
  const [anchor, setAnchor] = React.useState({ x: 0, y: 0 });
  const [expanded, setExpanded] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [typingWidth, setTypingWidth] = React.useState<number | null>(null);
  const [rootWidth, setRootWidth] = React.useState(0);
  const [widths, setWidths] = React.useState<Record<string, number>>({});

  const rootRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLDivElement>(null);
  const markRef = React.useRef<HTMLSpanElement>(null);
  const barRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const keepRef = React.useRef<HTMLButtonElement>(null);
  const rangeRef = React.useRef<Range | null>(null);
  const selRef = React.useRef<{ start: number; end: number } | null>(null);
  const editRef = React.useRef<Edit | null>(null);
  const modeRef = React.useRef<Mode>("idle");
  const openRef = React.useRef(false);
  const draggingRef = React.useRef(false);
  const streamedRef = React.useRef("");
  const controllerRef = React.useRef<AbortController | null>(null);
  const frameRef = React.useRef(0);
  const valueRef = React.useRef(value);
  const onActionRef = React.useRef(onAction);
  React.useLayoutEffect(() => {
    valueRef.current = value;
    onActionRef.current = onAction;
  });

  const setMode = (next: Mode) => {
    modeRef.current = next;
    setModeState(next);
  };

  const report = React.useMemo(() => {
    const make = (key: string) => (n: number) => setWidths((w) => (w[key] === n ? w : { ...w, [key]: n }));
    return { primary: make("primary"), more: make("more"), tail: make("tail"), send: make("send") };
  }, []);

  const close = React.useCallback(() => {
    controllerRef.current?.abort();
    registry()?.delete(HIGHLIGHT);
    rangeRef.current = null;
    selRef.current = null;
    editRef.current = null;
    streamedRef.current = "";
    openRef.current = false;
    modeRef.current = "idle";
    setOpen(false);
    setModeState("idle");
    setEdit(null);
    setChunks([]);
    setExpanded(false);
    setPrompt("");
    setTypingWidth(null);
  }, []);

  /* Centre on the whole selection, sit under its last line, stay inside the container. */
  const measure = React.useCallback(() => {
    const root = rootRef.current;
    const target: Range | HTMLElement | null = markRef.current ?? rangeRef.current;
    if (!root || !target) return null;
    const rects = target.getClientRects();
    const last = rects[rects.length - 1];
    if (!last) return null;
    const bounds = target.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    const half = (barRef.current?.offsetWidth ?? 0) / 2;
    const x = bounds.left - box.left + bounds.width / 2;
    // A bar wider than the text is centred on it rather than pinned to one side.
    const lo = Math.min(half, box.width / 2);
    const hi = Math.max(box.width - half, box.width / 2);
    return {
      x: Math.round(Math.min(Math.max(x, lo), hi)),
      y: Math.round(last.bottom - box.top + 8),
    };
  }, []);

  const place = React.useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const next = measure();
      if (next) setAnchor((a) => (a.x === next.x && a.y === next.y ? a : next));
    });
  }, [measure]);

  /* Read the selection inside the text. Ignored while an edit runs or the bar has focus. */
  const evaluate = React.useCallback(() => {
    if (editRef.current || barRef.current?.contains(document.activeElement)) return;
    const text = textRef.current;
    const node = text?.firstChild;
    const selection = window.getSelection();
    const range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;
    if (!text || !node || !range || range.collapsed || !text.contains(range.startContainer) || !text.contains(range.endContainer)) {
      if (openRef.current) close();
      return;
    }
    const v = valueRef.current;
    let start = offsetIn(text, range.startContainer, range.startOffset);
    let end = offsetIn(text, range.endContainer, range.endOffset);
    while (start < end && /\s/.test(v[start])) start++;
    while (end > start && /\s/.test(v[end - 1])) end--;
    if (start >= end) {
      if (openRef.current) close();
      return;
    }
    const trimmed = document.createRange();
    trimmed.setStart(node, start);
    trimmed.setEnd(node, end);
    rangeRef.current = trimmed;
    selRef.current = { start, end };
    const Highlight = HighlightClass();
    if (Highlight) registry()?.set(HIGHLIGHT, new Highlight(trimmed));
    const next = measure();
    if (next) setAnchor(next);
    openRef.current = true;
    setOpen(true);
  }, [close, measure]);

  const execute = async (target: Edit) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const v = valueRef.current;
    let out: SelectionResult;
    try {
      out = onActionRef.current({
        id: target.id,
        text: target.original,
        instruction: target.instruction,
        before: v.slice(0, target.start),
        after: v.slice(target.end),
        signal: controller.signal,
      });
    } catch (error) {
      out = Promise.reject(error);
    }
    if (out === undefined) {
      close();
      return;
    }

    window.getSelection()?.removeAllRanges();
    registry()?.delete(HIGHLIGHT);
    editRef.current = target;
    streamedRef.current = "";
    setEdit(target);
    setChunks([]);
    setExpanded(false);
    setPrompt("");
    setTypingWidth(null);
    setMode("thinking");

    try {
      if (isAsyncIterable(out)) {
        for await (const chunk of out) {
          if (controller.signal.aborted) return;
          if (!chunk) continue;
          streamedRef.current += chunk;
          setChunks((c) => [...c, chunk]);
          setMode("streaming");
        }
      } else {
        const whole = await out;
        if (controller.signal.aborted) return;
        if (typeof whole !== "string") {
          close();
          return;
        }
        streamedRef.current = whole;
        setChunks(whole ? [whole] : []);
      }
      if (controller.signal.aborted) return;
      setMode(streamedRef.current.trim() ? "result" : "error");
    } catch {
      if (!controller.signal.aborted) setMode("error");
    }
  };

  const start = (id: string, label: string, instruction?: string) => {
    const sel = selRef.current;
    if (!sel) return;
    execute({ ...sel, original: valueRef.current.slice(sel.start, sel.end), id, label, instruction });
  };

  const keep = () => {
    const target = editRef.current;
    if (!target) return;
    const v = valueRef.current;
    onValueChange(v.slice(0, target.start) + streamedRef.current + v.slice(target.end));
    close();
  };

  /* Stopping keeps what has streamed so far for review; with nothing yet, it's a discard. */
  const stop = () => {
    controllerRef.current?.abort();
    if (streamedRef.current.trim()) setMode("result");
    else close();
  };

  const handlers = React.useRef({ close, stop });
  React.useLayoutEffect(() => {
    handlers.current = { close, stop };
  });

  // Follow the selection: after a drag ends, and as keyboard or touch handles adjust it.
  React.useEffect(() => {
    const onSelection = () => {
      if (!draggingRef.current) evaluate();
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      evaluate();
    };
    document.addEventListener("selectionchange", onSelection);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("selectionchange", onSelection);
      document.removeEventListener("pointerup", onUp);
      controllerRef.current?.abort();
      registry()?.delete(HIGHLIGHT);
    };
  }, [evaluate]);

  // Escape backs out one step; a click outside closes an untouched selection.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const m = modeRef.current;
      if (m === "thinking" || m === "streaming") handlers.current.stop();
      else handlers.current.close();
    };
    const onDown = (e: PointerEvent) => {
      if (!editRef.current && !rootRef.current?.contains(e.target as Node)) handlers.current.close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // Turn on the glide only after the bar has painted in place, so it never flies in from a corner.
  React.useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [open]);

  React.useLayoutEffect(() => {
    if (open) place();
  }, [open, mode, chunks, expanded, typingWidth, place]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => {
      setRootWidth(root.clientWidth);
      if (openRef.current) place();
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [place]);

  /* When the whole content changes (actions, progress, Keep), morph the bar from its last width. */
  const lastWidth = React.useRef(0);
  const previousMode = React.useRef<Mode>("idle");
  const widthAnimation = React.useRef<Animation | null>(null);
  React.useLayoutEffect(() => {
    const bar = barRef.current;
    const content = contentRef.current;
    if (!bar || !content) {
      lastWidth.current = 0;
      previousMode.current = mode;
      return;
    }
    const next = Math.ceil(content.getBoundingClientRect().width) + 8;
    const previous = lastWidth.current;
    // The new content rises out of a light blur as the bar takes its width (progress → Keep, actions → progress…).
    const busyBoth = (m: Mode) => m === "thinking" || m === "streaming";
    if (previousMode.current !== mode && previous && !reduced && !(busyBoth(previousMode.current) && busyBoth(mode))) {
      content.animate(
        [
          { opacity: 0, filter: "blur(4px)" },
          { opacity: 1, filter: "blur(0px)" },
        ],
        { duration: 300, easing: "cubic-bezier(0.16,1,0.3,1)", delay: 60, fill: "backwards" }
      );
    }
    if (previousMode.current !== mode && previous && Math.abs(next - previous) > 1 && !reduced) {
      widthAnimation.current?.cancel();
      const animation = bar.animate([{ width: `${previous}px` }, { width: `${next}px` }], { duration: 320, easing: EASE });
      widthAnimation.current = animation;
      animation.onfinish = () => {
        if (widthAnimation.current === animation) widthAnimation.current = null;
      };
    }
    lastWidth.current = next;
    previousMode.current = mode;
  }, [mode, open, reduced]);

  React.useEffect(() => {
    const content = contentRef.current;
    if (!open || !content) return;
    const observer = new ResizeObserver(() => {
      place(); // re-centre as folds open and close
      if (widthAnimation.current?.playState === "running") return;
      lastWidth.current = Math.ceil(content.getBoundingClientRect().width) + 8;
    });
    observer.observe(content);
    return () => {
      observer.disconnect();
      widthAnimation.current?.cancel();
    };
  }, [open, place]);

  // Hand focus to Keep when the rewrite is ready, unless the person has moved on.
  React.useEffect(() => {
    if (mode !== "result") return;
    const active = document.activeElement;
    if (!active || active === document.body || barRef.current?.contains(active)) keepRef.current?.focus({ preventScroll: true });
  }, [mode]);

  // Arrow keys move between the buttons.
  const onToolbarKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const buttons = Array.from(barRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []).filter(
      (b) => !b.closest("[inert]")
    );
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    buttons[(i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  };

  const typing = prompt.trim().length > 0 && typingWidth !== null;
  const send = widths.send ?? 30;
  const restWidth = rootWidth
    ? Math.max(FIELD_MIN, Math.min(FIELD, rootWidth - 8 - 11 - (widths.primary ?? 0) - (more.length ? widths.tail ?? 0 : 0)))
    : FIELD;
  const fieldWidth = typing && typingWidth ? typingWidth - 8 - send : restWidth;
  const busy = mode === "thinking" || mode === "streaming";
  const label = edit?.label ?? "Editing";

  const action = (item: SelectionAction) => (
    <button key={item.id} type="button" onClick={() => start(item.id, item.pendingLabel ?? item.label)} className={QUIET}>
      {item.icon}
      {item.label}
    </button>
  );

  return (
    <div ref={rootRef} className={`relative ${className}`} {...props}>
      {/* Supply this valid selector directly: Turbopack's CSS parser warns on ::highlight(). */}
      <style>{`::highlight(${HIGHLIGHT}) { background-color: color-mix(in oklab, var(--primary) 18%, transparent); }`}</style>
      <div
        ref={textRef}
        onPointerDown={() => {
          if (editRef.current) return;
          draggingRef.current = true;
          if (openRef.current) close();
        }}
        className="whitespace-pre-wrap"
      >
        {edit ? (
          <>
            {value.slice(0, edit.start)}
            <span ref={markRef} className="rounded-[3px] bg-primary/15 box-decoration-clone">
              {mode === "streaming" || mode === "result" ? (
                chunks.map((chunk, i) => (
                  <span key={i} className="animate-[ui-fade-in_280ms_ease-out_both] motion-reduce:animate-none">
                    {chunk}
                  </span>
                ))
              ) : (
                <span className={`transition-opacity duration-300 ${mode === "thinking" ? "opacity-55" : ""}`}>{edit.original}</span>
              )}
            </span>
            {value.slice(edit.end)}
          </>
        ) : (
          value
        )}
      </div>

      {open && (
        <div
          className="absolute left-0 top-0 z-50"
          style={{
            transform: `translate3d(${anchor.x}px, ${anchor.y}px, 0) translateX(-50%)`,
            transition: ready && !reduced ? `transform 320ms ${GLIDE}` : "none",
          }}
        >
          <div
            ref={barRef}
            role="toolbar"
            aria-label="Edit selection"
            onKeyDown={onToolbarKey}
            // Keep the text selected while clicking the bar (the field still takes focus).
            onPointerDown={(e) => {
              if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
            }}
            className="flex h-9 w-fit max-w-[calc(100vw-32px)] select-none items-center justify-center overflow-hidden rounded-full bg-background p-1 text-foreground shadow-[0_0_0_1px_var(--border)] animate-[ui-pop-in_220ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none"
            style={{ width: mode === "idle" && typing ? typingWidth ?? undefined : undefined }}
          >
            <div
              ref={contentRef}
              className="flex w-max shrink-0 items-center"
              style={{ width: mode === "idle" && typing && typingWidth ? typingWidth - 8 : undefined }}
            >
              {mode === "idle" && (
                <>
                  <Fold open={!expanded} width={fieldWidth} reduced={reduced} gap={false}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (prompt.trim()) start("custom", "Editing", prompt.trim());
                      }}
                      className="flex h-7 items-center"
                      style={{ width: fieldWidth, transition: reduced ? "none" : `width 400ms ${EASE}` }}
                    >
                      <input
                        value={prompt}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (!prompt.trim() && next.trim()) {
                            const now = Math.ceil(barRef.current?.getBoundingClientRect().width ?? 0);
                            setTypingWidth(Math.max(now, 8 + FIELD + send));
                          } else if (!next.trim()) setTypingWidth(null);
                          setPrompt(next);
                        }}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        className="h-7 w-full min-w-0 text-ellipsis bg-transparent pl-3 pr-2 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </form>
                  </Fold>
                  <Fold open={!typing && !expanded} width={9} reduced={reduced} gap={false}>
                    <Divider />
                  </Fold>
                  <Fold open={!typing} width={widths.primary} onWidth={report.primary} reduced={reduced} gap={false}>
                    {actions.map(action)}
                  </Fold>
                  {more.length > 0 && (
                    <>
                      <Fold open={!typing && expanded} width={widths.more} onWidth={report.more} reduced={reduced}>
                        {more.map(action)}
                      </Fold>
                      <Fold open={!typing} width={widths.tail} onWidth={report.tail} reduced={reduced}>
                        <Divider />
                        <button
                          type="button"
                          aria-label={expanded ? "Fewer actions" : "More actions"}
                          aria-expanded={expanded}
                          onClick={() => setExpanded((x) => !x)}
                          className={`cursor-pointer ${ICON} text-foreground`}
                        >
                          <ChevronRight
                            className="transition-transform duration-[400ms]"
                            style={{ transform: expanded ? "rotate(180deg)" : "none", transitionTimingFunction: EASE }}
                          />
                        </button>
                      </Fold>
                    </>
                  )}
                  <Fold open={typing} width={send} onWidth={report.send} reduced={reduced}>
                    <button
                      type="button"
                      aria-label="Send edit"
                      onClick={() => prompt.trim() && start("custom", "Editing", prompt.trim())}
                      className={`cursor-pointer flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 active:scale-[0.94] ${FOCUS}`}
                    >
                      <ArrowUp className="size-4" strokeWidth={2.4} />
                    </button>
                  </Fold>
                </>
              )}

              {busy && (
                <>
                  <span role="status" className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap pl-2.5 pr-1.5 text-[12.5px] text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-border border-t-muted-foreground motion-reduce:animate-none"
                    />
                    {mode === "thinking" ? <span className={SHIMMER}>{label}…</span> : <span>{label}…</span>}
                  </span>
                  <Divider />
                  <button type="button" aria-label="Stop" onClick={stop} className={ICON}>
                    <Square className="!size-2.5" fill="currentColor" />
                  </button>
                </>
              )}

              {mode === "result" && (
                <>
                  <span className="sr-only" role="status">
                    Rewrite ready. Keep or discard it.
                  </span>
                  <button
                    ref={keepRef}
                    type="button"
                    onClick={keep}
                    className={`cursor-pointer inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 text-[12.5px] text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.96] [&_svg]:size-3.5 ${FOCUS}`}
                  >
                    <Check />
                    Keep
                  </button>
                  <button type="button" onClick={close} className={`cursor-pointer ${QUIET} ml-0.5`}>
                    <X />
                    Discard
                  </button>
                  <Divider />
                  <button type="button" aria-label="Try again" onClick={() => editRef.current && execute(editRef.current)} className={ICON}>
                    <RotateCcw />
                  </button>
                </>
              )}

              {mode === "error" && (
                <>
                  <span role="alert" className="whitespace-nowrap pl-2.5 pr-1 text-[12.5px] text-muted-foreground">
                    That didn’t work
                  </span>
                  <button type="button" onClick={() => editRef.current && execute(editRef.current)} className={QUIET}>
                    <RotateCcw />
                    Try again
                  </button>
                  <Divider />
                  <button type="button" aria-label="Discard" onClick={close} className={ICON}>
                    <X />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
