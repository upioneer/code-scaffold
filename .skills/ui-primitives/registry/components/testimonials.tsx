// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Testimonials (testimonials)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * TESTIMONIALS: one quote, chosen by its people
 *
 *   choose    a row of faces; the chosen one comes forward and
 *             the rest step back
 *   change    the quote's height eases to the new words while
 *             they cross-fade through a soft blur; the name
 *             morphs letter by letter
 *   autoplay  a ring draws itself around the chosen face as the
 *             timer; when it closes, the next person speaks.
 *             Pointing at it pauses
 *
 * The faces are a radio group: arrow keys move between people.
 * ───────────────────────────────────────────────────────── */

export interface Testimonial {
  quote: string;
  name: string;
  role?: string;
  /** A photo URL; without one, tinted initials. */
  avatar?: string;
}

export interface TestimonialsProps extends React.HTMLAttributes<HTMLElement> {
  items: Testimonial[];
  /** Move to the next person every this many ms. */
  autoplay?: number;
  defaultIndex?: number;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const MORPH = 520;
const SIZE = 36;
const RING = 2 * Math.PI * (SIZE / 2 + 4);

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

function hue(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

function Face({ item }: { item: Testimonial }) {
  const [failed, setFailed] = React.useState(false);
  if (item.avatar && !failed) return <img src={item.avatar} alt="" onError={() => setFailed(true)} className="size-full rounded-full object-cover" />;
  const h = hue(item.name);
  const initials = item.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className="flex size-full items-center justify-center rounded-full text-[12px] font-semibold"
      style={{ background: `color-mix(in oklab, oklch(0.62 0.13 ${h}) 18%, var(--background))`, color: `oklch(0.5 0.12 ${h})` }}
    >
      {initials}
    </span>
  );
}

function Quote({ text, leaving, reduced, quoteRef }: { text: string; leaving: boolean; reduced: boolean; quoteRef?: React.Ref<HTMLQuoteElement> }) {
  const ref = React.useRef<HTMLQuoteElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const animation = leaving
      ? el.animate(
          [
            { opacity: 1, filter: "blur(0px)", transform: "none" },
            { opacity: 0, filter: "blur(8px)", transform: "translateY(-8px)" },
          ],
          { duration: MORPH * 0.55, easing: EASE, fill: "forwards" }
        )
      : el.animate(
          [
            { opacity: 0, filter: "blur(8px)", transform: "translateY(10px)" },
            { opacity: 1, filter: "blur(0px)", transform: "none" },
          ],
          { duration: MORPH, easing: EASE, delay: 90, fill: "backwards" }
        );
    return () => animation.cancel();
  }, [leaving, reduced]);
  return (
    <blockquote
      ref={(el) => {
        ref.current = el;
        if (typeof quoteRef === "function") quoteRef(el);
        else if (quoteRef) (quoteRef as React.MutableRefObject<HTMLQuoteElement | null>).current = el;
      }}
      aria-hidden={leaving || undefined}
      className="absolute inset-x-0 top-0 text-balance text-[22px] font-medium leading-[1.35] tracking-[-0.02em] text-foreground"
    >
      <span aria-hidden="true" className="text-muted-foreground/60">
        “
      </span>
      {text}
      <span aria-hidden="true" className="text-muted-foreground/60">
        ”
      </span>
    </blockquote>
  );
}

export function Testimonials({ items, autoplay, defaultIndex = 0, className = "", ...props }: TestimonialsProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = React.useState(defaultIndex);
  const [leaving, setLeaving] = React.useState<{ text: string; key: number }[]>([]);
  const [height, setHeight] = React.useState<number | null>(null);
  const [paused, setPaused] = React.useState(false);
  const [cycle, setCycle] = React.useState(0);
  const quoteRef = React.useRef<HTMLQuoteElement | null>(null);
  const faceRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const counter = React.useRef(0);
  const current = items[index];

  const choose = (next: number, focus = false) => {
    const i = (next + items.length) % items.length;
    setCycle((c) => c + 1);
    if (focus) faceRefs.current[i]?.focus();
    if (i === index) return;
    setLeaving((l) => [...l, { text: items[index].quote, key: ++counter.current }]);
    setIndex(i);
  };

  React.useEffect(() => {
    if (!leaving.length) return;
    const timer = window.setTimeout(() => setLeaving([]), MORPH);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // The quote area takes the height of the words now showing.
  React.useLayoutEffect(() => {
    const el = quoteRef.current;
    if (!el) return;
    const measure = () => setHeight((h) => (h === el.offsetHeight ? h : el.offsetHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    choose(moves[e.key], true);
  };

  const playing = Boolean(autoplay) && !reduced && !paused;
  if (!current) return null;

  return (
    <figure
      className={`w-full ${className}`}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setPaused(false)}
      {...props}
    >
      <div
        className="relative"
        aria-live={autoplay ? "off" : "polite"}
        style={{ height: height ?? undefined, transition: reduced || height === null ? "none" : `height ${MORPH}ms ${EASE}` }}
      >
        {leaving.map((l) => (
          <Quote key={l.key} text={l.text} leaving reduced={reduced} />
        ))}
        <Quote key={`q${index}`} text={current.quote} leaving={false} reduced={reduced || !leaving.length} quoteRef={quoteRef} />
      </div>

      <figcaption className="mt-6 flex items-baseline gap-2 text-[13.5px]">
        <TextMorph className="font-medium text-foreground">{current.name}</TextMorph>
        {current.role && (
          <span key={current.role} className="text-muted-foreground animate-[ui-fade-in_400ms_ease-out_120ms_both] motion-reduce:animate-none">
            {current.role}
          </span>
        )}
      </figcaption>

      <div role="radiogroup" aria-label="Choose a testimonial" onKeyDown={onKeyDown} className="mt-5 flex items-center gap-3">
        {items.map((item, i) => {
          const selected = i === index;
          return (
            <button
              key={item.name}
              ref={(el) => {
                faceRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${item.name}${item.role ? `, ${item.role}` : ""}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => choose(i)}
              className="cursor-pointer relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              style={{ width: SIZE, height: SIZE }}
            >
              <span
                className="block size-full overflow-hidden rounded-full transition-[opacity,transform,filter] duration-500"
                style={{
                  opacity: selected ? 1 : 0.45,
                  transform: selected ? "scale(1)" : "scale(0.88)",
                  filter: selected ? "none" : "grayscale(0.6)",
                  transitionTimingFunction: EASE,
                }}
              >
                <Face item={item} />
              </span>
              {/* The ring: full when chosen, or drawing itself as the autoplay timer. */}
              <svg aria-hidden="true" viewBox={`0 0 ${SIZE + 10} ${SIZE + 10}`} className="pointer-events-none absolute -inset-[5px] -rotate-90" style={{ width: SIZE + 10, height: SIZE + 10 }}>
                <circle
                  key={selected ? `${index}-${cycle}` : "idle"}
                  cx={(SIZE + 10) / 2}
                  cy={(SIZE + 10) / 2}
                  r={SIZE / 2 + 4}
                  fill="none"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  className="stroke-foreground transition-opacity duration-300"
                  strokeDasharray={RING}
                  onAnimationEnd={() => selected && choose(index + 1)}
                  style={{
                    opacity: selected ? 1 : 0,
                    strokeDashoffset: selected && !(autoplay && !reduced) ? 0 : RING,
                    ...(selected && autoplay && !reduced
                      ? ({ "--ui-ring": `${RING}`, animation: `ui-ring-fill ${autoplay}ms linear forwards`, animationPlayState: playing ? "running" : "paused" } as React.CSSProperties)
                      : {}),
                  }}
                />
              </svg>
            </button>
          );
        })}
      </div>
    </figure>
  );
}
