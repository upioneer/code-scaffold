// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Edit and resend (message-edit)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Copy, Pencil } from "lucide-react";
import { NumberRoll } from "./number-roll";

/* ─────────────────────────────────────────────────────────
 * EDIT AND RESEND: change a sent message in place
 *
 *   sent      the message, with Copy and Edit on hover; Copy
 *             blurs into a check that draws itself
 *   editing   the bubble grows into an editor where it sits;
 *             Enter sends, Escape cancels
 *   versions  after a resend the pager slides open; "2 / 3"
 *             rolls, and the message slides in from the side
 *             you stepped toward while the bubble eases to fit
 *   disabled  editing waits while an answer is streaming
 *
 * The morph is one surface: it widens from its right edge and
 * grows to fit the field, its contents fade across, and it folds
 * back the same way.
 * ───────────────────────────────────────────────────────── */

export interface MessageEditProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  text: string;
  /** Called with the edited text; replace the message and regenerate from it. */
  onSubmit: (text: string) => void;
  /** Disable editing, e.g. while an answer streams. */
  disabled?: boolean;
  disabledReason?: string;
  /** Branches of this message, shown as "2 / 3". */
  versions?: { index: number; count: number; onIndexChange: (index: number) => void };
  /** How the sent message renders; defaults to the text. */
  children?: React.ReactNode;
}

const EASE = "cubic-bezier(0.23,1,0.32,1)";
const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const ICON = `cursor-pointer disabled:cursor-default flex size-7 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-accent hover:text-foreground active:scale-[0.94] disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-3.5 ${FOCUS}`;

type Outgoing = { key: string; content: React.ReactNode; dir: number; width: number };

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** Icons trade places through a blur: the old one shrinks away as the new one grows in. */
const swap = (on: boolean, reduced: boolean): React.CSSProperties => ({
  opacity: on ? 1 : 0,
  transform: on ? "none" : "scale(0.6)",
  filter: on ? "none" : "blur(3px)",
  transition: reduced ? "none" : `opacity 260ms ${MORPH}, transform 380ms ${MORPH}, filter 260ms ${MORPH}`,
});

function CopyGlyph({ copied, reduced }: { copied: boolean; reduced: boolean }) {
  return (
    <span className="relative flex size-3.5 items-center justify-center">
      <span className="absolute inset-0 flex items-center justify-center" style={swap(!copied, reduced)}>
        <Copy />
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-foreground" style={swap(copied, reduced)}>
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            style={{ strokeDashoffset: copied ? 0 : 1, transition: copied && !reduced ? `stroke-dashoffset 380ms ${MORPH} 100ms` : "none" }}
          />
        </svg>
      </span>
    </span>
  );
}

/** The message you stepped away from: it leaves toward the side you came from. */
function Leaving({ item, onDone }: { item: Outgoing; onDone: (key: string) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const animation = el.animate(
      [
        { opacity: 1, filter: "blur(0px)", transform: "none" },
        { opacity: 0, filter: "blur(6px)", transform: `translateX(${-item.dir * 16}px)` },
      ],
      { duration: 240, easing: MORPH, fill: "forwards" }
    );
    animation.onfinish = () => onDone(item.key);
    return () => animation.cancel();
  }, [item, onDone]);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0 whitespace-pre-wrap px-4 py-2.5 text-[14px] leading-relaxed text-foreground"
      style={{ width: item.width }}
    >
      {item.content}
    </div>
  );
}

export function MessageEdit({
  text,
  onSubmit,
  disabled = false,
  disabledReason = "Wait for the answer to finish",
  versions,
  children,
  className = "",
  ...props
}: MessageEditProps) {
  const reduced = useReducedMotion();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(text);
  const [copied, setCopied] = React.useState(false);
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const fieldRef = React.useRef<HTMLTextAreaElement>(null);
  const editRef = React.useRef<HTMLButtonElement>(null);
  const fromRef = React.useRef<DOMRect | null>(null);
  const returnFocus = React.useRef(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const size = React.useRef<{ width: number; height: number } | null>(null);

  // Stepping between versions: remember what was showing, so it can leave while the new one arrives.
  const content = children ?? text;
  const index = versions?.index ?? 0;
  const [shown, setShown] = React.useState({ text, index, content, editing });
  const [outgoing, setOutgoing] = React.useState<Outgoing[]>([]);
  const [enterDir, setEnterDir] = React.useState(0);
  if (shown.text !== text || shown.editing !== editing) {
    // A resend lands while the editor folds back, which is motion enough; only a step between versions slides.
    const stepped = shown.text !== text && !editing && !shown.editing && !reduced;
    const dir = Math.sign(index - shown.index) || 1;
    setShown({ text, index, content, editing });
    setEnterDir(stepped ? dir : 0);
    if (stepped) setOutgoing((o) => [...o, { key: `${shown.index}-${shown.text}`, content: shown.content, dir, width: size.current?.width ?? 0 }]);
  }
  const doneLeaving = React.useCallback((key: string) => setOutgoing((o) => o.filter((x) => x.key !== key)), []);

  const morph = (next: boolean) => {
    fromRef.current = surfaceRef.current?.getBoundingClientRect() ?? null;
    setEditing(next);
  };

  const start = () => {
    if (disabled) return;
    setDraft(text);
    morph(true);
  };

  const cancel = (refocus = true) => {
    returnFocus.current = refocus;
    morph(false);
  };

  const send = () => {
    const next = draft.trim();
    if (!next || next === text.trim()) return;
    onSubmit(next);
    returnFocus.current = true;
    morph(false);
  };

  // Animate the surface from where it was to where it lands (both directions).
  React.useLayoutEffect(() => {
    const el = surfaceRef.current;
    const from = fromRef.current;
    fromRef.current = null;
    if (editing) {
      const field = fieldRef.current;
      if (field) {
        field.style.height = "auto";
        field.style.height = `${field.scrollHeight}px`;
        field.focus({ preventScroll: true });
        field.setSelectionRange(field.value.length, field.value.length);
      }
    } else if (returnFocus.current) {
      returnFocus.current = false;
      editRef.current?.focus({ preventScroll: true });
    }
    if (!el || !from || reduced) return;
    const to = el.getBoundingClientRect();
    el.animate(
      [
        { width: `${from.width}px`, height: `${from.height}px` },
        { width: `${to.width}px`, height: `${to.height}px` },
      ],
      { duration: 380, easing: EASE }
    );
  }, [editing, reduced]);

  // A new version: the bubble eases from its old size to the new text, which slides in from the side you stepped toward.
  React.useLayoutEffect(() => {
    const el = surfaceRef.current;
    const from = size.current;
    if (!enterDir || !el || !from) return;
    el.animate(
      [
        { width: `${from.width}px`, height: `${from.height}px` },
        { width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px` },
      ],
      { duration: 420, easing: MORPH }
    );
    contentRef.current?.animate(
      [
        { opacity: 0, filter: "blur(6px)", transform: `translateX(${enterDir * 16}px)` },
        { opacity: 1, filter: "blur(0px)", transform: "none" },
      ],
      { duration: 420, easing: MORPH, delay: 60, fill: "backwards" }
    );
  }, [text, enterDir]);

  // The size it settled at, for the next morph.
  React.useLayoutEffect(() => {
    const el = surfaceRef.current;
    if (el) size.current = { width: el.offsetWidth, height: el.offsetHeight };
  });

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard blocked; nothing to show.
    }
  };

  const unchanged = draft.trim() === text.trim() || !draft.trim();

  return (
    <div className={`group/message flex w-full flex-col items-end ${className}`} {...props}>
      <div
        ref={surfaceRef}
        className={`overflow-hidden rounded-[20px] transition-[background-color,box-shadow] duration-300 ${
          editing
            ? "w-full bg-background shadow-[0_0_0_1px_var(--border)]"
            : "w-fit max-w-[85%] bg-muted shadow-[0_0_0_1px_transparent]"
        }`}
      >
        {editing ? (
          <div key="editor" className="p-3 animate-[ui-fade-in_220ms_ease-out_100ms_both] motion-reduce:animate-none">
            <textarea
              ref={fieldRef}
              value={draft}
              rows={1}
              aria-label="Edit message"
              onChange={(e) => {
                setDraft(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancel();
                } else if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="block max-h-60 w-full resize-none bg-transparent px-1 text-[14px] leading-relaxed text-foreground outline-none"
            />
            <div className="mt-2 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => cancel()}
                className={`cursor-pointer h-8 rounded-full px-3 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${FOCUS}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={unchanged}
                className={`cursor-pointer disabled:cursor-default h-8 rounded-full bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground transition-[opacity,transform] duration-150 active:scale-[0.96] disabled:opacity-35 ${FOCUS}`}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div key="message" className="relative animate-[ui-fade-in_220ms_ease-out_100ms_both] motion-reduce:animate-none">
            {outgoing.map((o) => (
              <Leaving key={o.key} item={o} onDone={doneLeaving} />
            ))}
            <div key={text} ref={contentRef} className="whitespace-pre-wrap px-4 py-2.5 text-[14px] leading-relaxed text-foreground">
              {content}
            </div>
          </div>
        )}
      </div>

      <div
        inert={editing}
        className={`mt-1 flex items-center gap-0.5 transition-opacity duration-200 ${
          editing ? "opacity-0" : "opacity-0 focus-within:opacity-100 group-hover/message:opacity-100 [@media(hover:none)]:opacity-100"
        }`}
      >
        {versions && (
          // Slides open the first time there is a second version.
          <span
            inert={versions.count < 2}
            className="grid"
            style={{
              gridTemplateColumns: versions.count > 1 ? "1fr" : "0fr",
              opacity: versions.count > 1 ? 1 : 0,
              transition: reduced ? "none" : `grid-template-columns 420ms ${MORPH}, opacity 300ms ${MORPH}`,
            }}
          >
            <span className="flex min-w-0 items-center overflow-hidden">
              <span className="mr-1 flex shrink-0 items-center">
                <button
                  type="button"
                  aria-label="Previous version"
                  disabled={versions.index <= 0}
                  onClick={() => versions.onIndexChange(versions.index - 1)}
                  className={ICON}
                >
                  <ChevronLeft />
                </button>
                <span aria-live="polite" className="flex min-w-[2.5rem] justify-center gap-[0.5ch] font-mono text-[11px] tabular-nums text-muted-foreground">
                  <span className="sr-only">Version </span>
                  <NumberRoll value={versions.index + 1} duration={700} />
                  <span aria-hidden="true">/</span>
                  <span className="sr-only">of</span>
                  <NumberRoll value={versions.count} duration={700} />
                </span>
                <button
                  type="button"
                  aria-label="Next version"
                  disabled={versions.index >= versions.count - 1}
                  onClick={() => versions.onIndexChange(versions.index + 1)}
                  className={ICON}
                >
                  <ChevronRight />
                </button>
              </span>
            </span>
          </span>
        )}
        <button type="button" aria-label="Copy message" onClick={copy} className={ICON}>
          <CopyGlyph copied={copied} reduced={reduced} />
        </button>
        <button
          ref={editRef}
          type="button"
          aria-label="Edit message"
          title={disabled ? disabledReason : undefined}
          aria-disabled={disabled || undefined}
          onClick={start}
          className={`${ICON} aria-disabled:cursor-not-allowed aria-disabled:opacity-35 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted-foreground`}
        >
          <Pencil />
        </button>
      </div>
      {/* Outside the buttons, so their names stay their labels. */}
      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
