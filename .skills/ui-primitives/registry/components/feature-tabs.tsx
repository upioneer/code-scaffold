// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Feature tabs (feature-tabs)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";

/* ─────────────────────────────────────────────────────────
 * FEATURE TABS: one panel, many features
 *
 *   tabs      the line under the chosen tab slides over with a
 *             little give
 *   autoplay  that line fills like a progress bar; when it's
 *             full the next tab takes over. Pointing at it pauses
 *   panel     its height eases to the new content while the
 *             content slides in from the side you went, through
 *             a light blur
 *
 * A real tablist: arrow keys, Home and End move between tabs.
 * ───────────────────────────────────────────────────────── */

export interface FeatureTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface FeatureTabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: FeatureTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Move to the next tab every this many ms. Pointing at the tabs pauses it. */
  autoplay?: number;
}

type Leaving = { id: string; dir: number; key: number };

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const MORPH = 460;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

function Pane({ children, dir, leaving, reduced, paneRef }: { children: React.ReactNode; dir: number; leaving: boolean; reduced: boolean; paneRef?: React.Ref<HTMLDivElement> }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced || dir === 0) return;
    const shift = 32 * dir;
    const animation = leaving
      ? el.animate(
          [
            { opacity: 1, filter: "blur(0px)", transform: "none" },
            { opacity: 0, filter: "blur(6px)", transform: `translateX(${-shift}px)` },
          ],
          { duration: MORPH * 0.6, easing: EASE, fill: "forwards" }
        )
      : el.animate(
          [
            { opacity: 0, filter: "blur(6px)", transform: `translateX(${shift}px)` },
            { opacity: 1, filter: "blur(0px)", transform: "none" },
          ],
          { duration: MORPH, easing: EASE, delay: 60, fill: "backwards" }
        );
    return () => animation.cancel();
  }, [dir, leaving, reduced]);
  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (typeof paneRef === "function") paneRef(el);
        else if (paneRef) (paneRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      inert={leaving}
      aria-hidden={leaving || undefined}
      className="absolute inset-x-0 top-0"
    >
      {children}
    </div>
  );
}

export function FeatureTabs({ tabs, value, defaultValue, onValueChange, autoplay, className = "", ...props }: FeatureTabsProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [own, setOwn] = React.useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? own;
  const index = Math.max(0, tabs.findIndex((t) => t.id === active));

  const [leaving, setLeaving] = React.useState<Leaving[]>([]);
  const [dir, setDir] = React.useState(0);
  const [cycle, setCycle] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [line, setLine] = React.useState({ left: 0, width: 0, ready: false });
  const [height, setHeight] = React.useState<number | null>(null);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const paneRef = React.useRef<HTMLDivElement | null>(null);
  const keyCounter = React.useRef(0);

  const select = (next: number, focus = false) => {
    const tab = tabs[(next + tabs.length) % tabs.length];
    if (!tab) return;
    setCycle((c) => c + 1);
    if (tab.id === active) return;
    const nextIndex = tabs.indexOf(tab);
    setDir(Math.sign(nextIndex - index) || 1);
    setLeaving((l) => [...l, { id: active, dir: Math.sign(nextIndex - index) || 1, key: ++keyCounter.current }]);
    if (value === undefined) setOwn(tab.id);
    onValueChange?.(tab.id);
    if (focus) tabRefs.current[nextIndex]?.focus();
  };

  React.useEffect(() => {
    if (!leaving.length) return;
    const timer = window.setTimeout(() => setLeaving([]), MORPH);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // The line sits under the chosen tab.
  React.useLayoutEffect(() => {
    const measure = () => {
      const tab = tabRefs.current[index];
      if (!tab) return;
      const left = tab.offsetLeft;
      const width = tab.offsetWidth;
      setLine((l) => (l.left === left && l.width === width ? l : { left, width, ready: l.width > 0 }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    tabRefs.current.forEach((t) => t && observer.observe(t));
    return () => observer.disconnect();
  }, [index, tabs]);

  // The panel takes the height of what it's showing.
  React.useLayoutEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const measure = () => setHeight((h) => (h === pane.offsetHeight ? h : pane.offsetHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    return () => observer.disconnect();
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    select(moves[e.key], true);
  };

  const playing = Boolean(autoplay) && !reduced && !paused;
  const current = tabs[index];

  return (
    <div
      className={`w-full ${className}`}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setPaused(false)}
      {...props}
    >
      <div role="tablist" aria-label="Features" onKeyDown={onKeyDown} className="relative flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab, i) => {
          const selected = i === index;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              className={`cursor-pointer relative shrink-0 whitespace-nowrap px-3 pb-3 pt-1 text-[13.5px] transition-colors duration-300 ${FOCUS} ${
                selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        {/* The Tactile under the row, then the line: it slides to the chosen tab and, with autoplay, fills as its time runs. */}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-border" />
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-px overflow-hidden"
          style={{
            width: line.width,
            transform: `translateX(${line.left}px)`,
            transition: line.ready && !reduced ? `transform 520ms ${THROW}, width 420ms ${EASE}` : "none",
          }}
        >
          <span className="absolute inset-0 bg-border" />
          <span
            key={`${active}-${cycle}`}
            className="absolute inset-0 origin-left bg-foreground"
            onAnimationEnd={() => select(index + 1)}
            style={
              autoplay && !reduced
                ? { animation: `ui-progress ${autoplay}ms linear forwards`, animationPlayState: playing ? "running" : "paused" }
                : undefined
            }
          />
        </span>
      </div>

      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        className="relative mt-5 overflow-hidden"
        style={{ height: height ?? undefined, transition: reduced || height === null ? "none" : `height ${MORPH}ms ${EASE}` }}
      >
        {leaving.map((l) => (
          <Pane key={l.key} dir={l.dir} leaving reduced={reduced}>
            {tabs.find((t) => t.id === l.id)?.content}
          </Pane>
        ))}
        {current && (
          <Pane key={current.id} dir={leaving.length ? dir : 0} leaving={false} reduced={reduced} paneRef={paneRef}>
            {current.content}
          </Pane>
        )}
      </div>
    </div>
  );
}
