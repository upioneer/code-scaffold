// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Scroll story (scroll-story)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";

/* ─────────────────────────────────────────────────────────
 * SCROLL STORY: a how-it-works that tells itself as you scroll
 *
 *   steps     the words scroll past a picture that stays put; the
 *             step crossing the middle of the view lights up and
 *             the others wait at a third of their strength
 *   rail      a Tactile down the steps fills with the scroll,
 *             continuously, and each step's dot fills as the line
 *             reaches it
 *   picture   one card that reshapes to each step's picture: its
 *             size eases from one to the next while the old
 *             picture blurs out and the new one rises in (and
 *             plays whatever it plays when it arrives). "02 / 04"
 *             rolls above it
 *   narrow    the picture sticks to the top and the steps slide
 *             underneath it
 *   jump      tapping a step scrolls it to the middle
 *
 * Works with the page's scroll or inside any scrolling box.
 * ───────────────────────────────────────────────────────── */

export interface ScrollStoryStep {
  title: string;
  body?: React.ReactNode;
  /** Mounted when its step arrives, so any animation in it plays then. */
  visual: React.ReactNode;
}

export interface ScrollStoryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  steps: ScrollStoryStep[];
  /** Where the picture sits when there's room for two columns. */
  side?: "start" | "end";
  onStepChange?: (index: number) => void;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const WIDE = 520;

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** The nearest box that scrolls vertically, or null for the page. */
function scrollParent(el: HTMLElement | null) {
  for (let p = el?.parentElement; p && p !== document.body; p = p.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p;
  }
  return null;
}

/** The card that changes shape between pictures. */
function Stage({ index, children, reduced }: { index: number; children: React.ReactNode; reduced: boolean }) {
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);
  const [ghost, setGhost] = React.useState<{ key: number; node: React.ReactNode } | null>(null);
  const last = React.useRef({ index, node: children });

  React.useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  // A new picture: keep the old one a moment to blur out underneath, raise the new one.
  React.useLayoutEffect(() => {
    if (index === last.current.index) {
      last.current.node = children;
      return;
    }
    if (!reduced) setGhost({ key: last.current.index, node: last.current.node });
    last.current = { index, node: children };
    if (reduced) return;
    innerRef.current?.animate(
      [
        { opacity: 0, transform: "translateY(10px) scale(0.98)", filter: "blur(4px)" },
        { opacity: 1, transform: "none", filter: "blur(0px)" },
      ],
      { duration: 420, delay: 90, easing: EASE, fill: "backwards" },
    );
  }, [index, children, reduced]);

  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-border bg-card"
      style={{ width: size?.w, height: size?.h, transition: reduced || !size ? "none" : `width 460ms ${EASE}, height 460ms ${EASE}` }}
    >
      {ghost && (
        <div
          key={`ghost-${ghost.key}`}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 w-max"
          ref={(el) => {
            if (!el || el.dataset.out) return;
            el.dataset.out = "1";
            const a = el.animate(
              [
                { opacity: 1, filter: "blur(0px)", transform: "none" },
                { opacity: 0, filter: "blur(4px)", transform: "scale(0.97)" },
              ],
              { duration: 240, easing: EASE, fill: "forwards" },
            );
            a.onfinish = () => setGhost((g) => (g?.key === ghost.key ? null : g));
          }}
        >
          {ghost.node}
        </div>
      )}
      <div key={index} ref={innerRef} className="w-max">
        {children}
      </div>
    </div>
  );
}

export function ScrollStory({ steps, side = "end", onStepChange, className = "", style, ...props }: ScrollStoryProps) {
  const reduced = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLSpanElement>(null);
  const fillRef = React.useRef<HTMLSpanElement>(null);
  const stepRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const scroller = React.useRef<HTMLElement | null>(null);
  const [active, setActive] = React.useState(0);
  const [viewport, setViewport] = React.useState(0);
  const activeRef = React.useRef(0);
  const changed = React.useRef(onStepChange);
  changed.current = onStepChange;

  // Where the reading line is: the middle of the view, or the middle of what the sticky picture leaves.
  const line = () => {
    const box = scroller.current?.getBoundingClientRect();
    const top = box ? box.top : 0;
    const height = scroller.current ? scroller.current.clientHeight : window.innerHeight;
    const wide = (rootRef.current?.clientWidth ?? 0) >= WIDE;
    const stuck = wide ? 0 : (stickyRef.current?.offsetHeight ?? 0);
    return top + stuck + (height - stuck) * (wide ? 0.5 : 0.42);
  };

  // On scroll: the rail fills to the line (written straight to the DOM), and the step at the line becomes active.
  const update = React.useCallback(() => {
    const list = listRef.current;
    const first = dotRefs.current[0];
    const last = dotRefs.current[steps.length - 1];
    if (!list || !first || !last) return;
    const y = line();
    const origin = list.getBoundingClientRect().top;
    const a = first.getBoundingClientRect().top + first.offsetHeight / 2 - origin;
    const b = last.getBoundingClientRect().top + last.offsetHeight / 2 - origin;
    if (trackRef.current) Object.assign(trackRef.current.style, { top: `${a}px`, height: `${b - a}px` });
    if (fillRef.current) Object.assign(fillRef.current.style, { top: `${a}px`, height: `${Math.min(b - a, Math.max(0, y - origin - a))}px` });
    let next = 0;
    stepRefs.current.forEach((el, i) => {
      if (el && el.getBoundingClientRect().top <= y) next = i;
    });
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActive(next);
      changed.current?.(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    scroller.current = scrollParent(root);
    const target: HTMLElement | Window = scroller.current ?? window;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    const measure = () => {
      setViewport(scroller.current ? scroller.current.clientHeight : window.innerHeight);
      onScroll();
    };
    measure();
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    if (scroller.current) observer.observe(scroller.current);
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [update]);

  const jump = (i: number) => {
    const el = stepRefs.current[i];
    if (!el) return;
    const delta = el.getBoundingClientRect().top - line() + 2;
    const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
    if (scroller.current) scroller.current.scrollBy({ top: delta, behavior });
    else window.scrollBy({ top: delta, behavior });
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      ref={rootRef}
      className={`@container ${className}`}
      style={{ ...style, ["--story-h" as string]: `${viewport || 600}px` }}
      {...props}
    >
      <div className="grid @min-[520px]:grid-cols-2 @min-[520px]:gap-10">
        {/* The picture: beside the steps when there's room, stuck to the top when there isn't. */}
        <div
          ref={stickyRef}
          className={`sticky top-0 z-10 -mx-2 flex h-[calc(var(--story-h)*0.46)] flex-col items-center justify-center gap-3 border-b border-border bg-background px-2 @min-[520px]:mx-0 @min-[520px]:h-[var(--story-h)] @min-[520px]:border-b-0 @min-[520px]:bg-transparent @min-[520px]:px-0 ${
            side === "end" ? "@min-[520px]:order-last" : ""
          }`}
        >
          <p className="text-[11.5px] tabular-nums text-muted-foreground" aria-hidden="true">
            <NumberRoll value={active + 1} format={{ minimumIntegerDigits: 2 }} duration={500} /> / {pad(steps.length)}
          </p>
          <Stage index={active} reduced={reduced}>
            {steps[active]?.visual}
          </Stage>
        </div>

        <div
          ref={listRef}
          className="relative pb-[calc(var(--story-h)*0.12)] pt-8 @min-[520px]:pt-[calc(var(--story-h)*0.38)]"
        >
          <span ref={trackRef} aria-hidden="true" className="absolute left-[5px] w-px bg-border" />
          <span ref={fillRef} aria-hidden="true" className="absolute left-[5px] w-px bg-foreground" />
          {steps.map((s, i) => {
            const on = i === active;
            const reached = i <= active;
            return (
              <div
                key={i}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                aria-current={on ? "step" : undefined}
                className="relative min-h-[calc(var(--story-h)*0.42)] pl-7 @min-[520px]:min-h-[calc(var(--story-h)*0.55)]"
              >
                <span
                  ref={(el) => {
                    dotRefs.current[i] = el;
                  }}
                  aria-hidden="true"
                  className="absolute left-0 top-[3px] size-[11px] rounded-full border"
                  style={{
                    borderColor: reached ? "var(--foreground)" : "var(--border)",
                    backgroundColor: reached ? "var(--foreground)" : "var(--background)",
                    transform: on ? "scale(1.15)" : "scale(1)",
                    transition: reduced ? "none" : `background-color 240ms ${EASE}, border-color 240ms ${EASE}, transform 320ms cubic-bezier(0.34,1.36,0.64,1)`,
                  }}
                />
                <div style={{ opacity: on ? 1 : 0.35, transition: reduced ? "none" : `opacity 400ms ${EASE}` }}>
                  <p className="text-[11.5px] leading-4 tabular-nums text-muted-foreground">{pad(i + 1)}</p>
                  <h3 className="mt-1.5 text-[18px] font-semibold leading-tight tracking-tight text-foreground @min-[520px]:text-[20px]">
                    <button type="button" onClick={() => jump(i)} className="cursor-pointer rounded-[4px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                      {s.title}
                    </button>
                  </h3>
                  {s.body && <div className="mt-2 max-w-[36ch] text-[13.5px] leading-relaxed text-muted-foreground">{s.body}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
