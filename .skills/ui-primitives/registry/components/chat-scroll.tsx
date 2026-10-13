// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Jump to latest (chat-scroll)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { ArrowDown } from "lucide-react";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * JUMP TO LATEST: a chat that follows the answer, until you
 * scroll away
 *
 *   following  pinned to the bottom while text streams in
 *   away       you scrolled up: it lets go at once, and a round
 *              ↓ button appears
 *   new below  text arrived while you were away: the button
 *              widens into "● Writing"; when the answer ends the
 *              label morphs to "New reply"
 *   back       a click glides down, chasing the moving bottom,
 *              and it follows again
 *
 * Wrap your messages. Give it a height (or flex-1) and change
 * followKey when someone sends, to bring them back down.
 * ───────────────────────────────────────────────────────── */

export interface ChatScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** True while an answer streams; the button says "Writing". */
  streaming?: boolean;
  /** Change it (e.g. to the latest message id) to jump to the bottom, e.g. after sending. */
  followKey?: React.Key;
  /** How close to the bottom (px) still counts as at the bottom. */
  threshold?: number;
  /** Classes for the inner content column. */
  contentClassName?: string;
}

const EASE = "cubic-bezier(0.23,1,0.32,1)";
// A light that sweeps across the label. A mask, not a text clip, so it reaches letters that are mid-morph.
const SHEEN =
  "text-foreground [mask-image:linear-gradient(90deg,rgb(0_0_0/0.45)_35%,#000_50%,rgb(0_0_0/0.45)_65%)] [mask-size:200%_100%] animate-[ui-sheen_1.4s_linear_infinite] motion-reduce:animate-none motion-reduce:[mask-image:none] motion-reduce:text-foreground/70";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

export function ChatScroll({
  children,
  streaming = false,
  followKey,
  threshold = 48,
  className = "",
  contentClassName = "",
  ...props
}: ChatScrollProps) {
  const reduced = useReducedMotion();
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const stuck = React.useRef(true);
  const lastTop = React.useRef(0);
  const touchY = React.useRef(0);
  const frame = React.useRef(0);
  const gliding = React.useRef(false);
  // When the person last reached for the scroll; only their own scrolling lets go of the bottom.
  const intent = React.useRef(0);
  const [away, setAway] = React.useState(false);
  const [unread, setUnread] = React.useState(false);

  const distance = () => {
    const el = scrollerRef.current;
    return el ? el.scrollHeight - el.clientHeight - el.scrollTop : 0;
  };

  const release = () => {
    cancelAnimationFrame(frame.current);
    gliding.current = false;
    stuck.current = false;
  };

  /* Glide to the bottom, re-reading it every frame because it moves while text streams in. */
  const toBottom = React.useCallback(
    (smooth: boolean) => {
      const el = scrollerRef.current;
      if (!el) return;
      cancelAnimationFrame(frame.current);
      stuck.current = true;
      setAway(false);
      setUnread(false);
      if (!smooth || reduced) {
        el.scrollTop = el.scrollHeight;
        return;
      }
      gliding.current = true;
      const from = el.scrollTop;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 520);
        const eased = 1 - Math.pow(1 - t, 4);
        el.scrollTop = from + (el.scrollHeight - el.clientHeight - from) * eased;
        if (t < 1) frame.current = requestAnimationFrame(step);
        else gliding.current = false;
      };
      frame.current = requestAnimationFrame(step);
    },
    [reduced]
  );

  // Start at the latest message.
  React.useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // While following, every bit of new content keeps the bottom in view; while away, it's unread.
  React.useEffect(() => {
    const content = contentRef.current;
    const el = scrollerRef.current;
    if (!content || !el) return;
    const observer = new ResizeObserver(() => {
      if (stuck.current) {
        if (!gliding.current) el.scrollTop = el.scrollHeight;
      } else if (distance() > threshold) {
        setUnread(true);
        setAway(true);
      }
    });
    observer.observe(content);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [threshold]);

  // A new message from the person brings them back down.
  const firstKey = React.useRef(followKey);
  React.useEffect(() => {
    if (followKey === firstKey.current) return;
    firstKey.current = followKey;
    toBottom(true);
  }, [followKey, toBottom]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const top = el.scrollTop;
    const d = distance();
    // Upward movement counts only if the person caused it, not when content shrinks and the browser clamps.
    const userUp = top < lastTop.current - 1 && !gliding.current && performance.now() - intent.current < 800;
    lastTop.current = top;
    if (userUp) {
      release();
      setAway(d > threshold);
    } else if (!stuck.current && d <= threshold) {
      // Back at the bottom: follow again.
      stuck.current = true;
      setAway(false);
      setUnread(false);
    } else if (!stuck.current) setAway(d > threshold);
  };

  const reach = () => (intent.current = performance.now());

  return (
    <div className={`relative min-h-0 ${className}`} {...props}>
      <div
        ref={scrollerRef}
        tabIndex={0}
        aria-label="Conversation"
        onScroll={onScroll}
        // Let go the moment someone reaches for the scroll, before the next frame of text pulls them down.
        onWheel={(e) => {
          reach();
          if (e.deltaY < 0) release();
        }}
        onTouchStart={(e) => {
          reach();
          touchY.current = e.touches[0]?.clientY ?? 0;
        }}
        onTouchMove={(e) => {
          reach();
          if ((e.touches[0]?.clientY ?? 0) > touchY.current) release();
        }}
        onKeyDown={(e) => {
          reach();
          if (["ArrowUp", "PageUp", "Home"].includes(e.key)) release();
        }}
        // Dragging the scrollbar.
        onPointerDown={reach}
        className="h-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30"
      >
        <div ref={contentRef} className={contentClassName}>
          {children}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <button
          type="button"
          inert={!away}
          onClick={() => toBottom(true)}
          aria-label={unread ? `${streaming ? "Still writing" : "New reply"} below. Jump to latest` : "Jump to latest"}
          className="cursor-pointer pointer-events-auto flex h-8 items-center rounded-full border border-border bg-background px-2 text-[12.5px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.96]"
          style={{
            opacity: away ? 1 : 0,
            transform: away ? "none" : "translateY(8px) scale(0.92)",
            transition: reduced ? "none" : `opacity 220ms ${EASE}, transform 320ms ${EASE}`,
          }}
        >
          {/* The label opens out of the round button; its words morph from "Writing" to "New reply" and the pill follows. */}
          <span
            aria-hidden="true"
            className="grid"
            style={{
              gridTemplateColumns: unread ? "1fr" : "0fr",
              opacity: unread ? 1 : 0,
              transition: reduced ? "none" : `grid-template-columns 380ms ${EASE}, opacity 260ms ${EASE}`,
            }}
          >
            <span className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
              <span className="flex shrink-0 items-center gap-1.5 pl-1 pr-1.5">
                <span className="relative flex size-1.5">
                  <span className={`absolute inset-0 rounded-full bg-primary motion-reduce:animate-none ${streaming ? "animate-[ui-ping_1.4s_cubic-bezier(0,0,0.2,1)_infinite]" : "opacity-0"}`} />
                  <span className="relative size-1.5 rounded-full bg-primary" />
                </span>
                <span className={`transition-colors duration-300 ${streaming ? SHEEN : ""}`}>
                  <TextMorph>{streaming ? "Writing" : "New reply"}</TextMorph>
                </span>
              </span>
            </span>
          </span>
          <ArrowDown aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
