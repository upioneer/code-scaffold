// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Announcement pill (announcement-pill)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";

/* ─────────────────────────────────────────────────────────
 * ANNOUNCEMENT PILL: "New: …" that opens into the news
 *
 *   rest    a badge and one line, in a Tactile pill
 *   hover   the arrow nudges on and a second phrase folds open
 *           ("Read the changelog")
 *   open    the pill itself grows into a card with the details:
 *           its size and corners ease from pill to card while
 *           the line cross-fades into the content
 *   close   the card folds back into the pill
 *
 * Without card content it's simply a link.
 * ───────────────────────────────────────────────────────── */

export interface AnnouncementPillProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  badge?: string;
  children: React.ReactNode;
  /** A second phrase that folds open on hover. */
  more?: string;
  /** Without card, the pill is a link to here. */
  href?: string;
  /** What the pill opens into. */
  card?: React.ReactNode;
  cardWidth?: number;
}

type Phase = "closed" | "opening" | "open" | "closing";

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const DURATION = 420;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 shrink-0 text-muted-foreground transition-[transform,color] duration-300 group-hover/pill:translate-x-0.5 group-hover/pill:text-foreground">
      <path d="M2.5 6h7M6.5 3l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AnnouncementPill({ badge = "New", children, more, href, card, cardWidth = 360, className = "", ...props }: AnnouncementPillProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [phase, setPhase] = React.useState<Phase>("closed");
  const [pill, setPill] = React.useState({ width: 0, height: 32 });
  const [cardSize, setCardSize] = React.useState({ width: cardWidth, height: 0 });
  const [moreWidth, setMoreWidth] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const pillRef = React.useRef<HTMLElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const moreRef = React.useRef<HTMLSpanElement>(null);
  const timer = React.useRef(0);

  const expanded = phase === "open";
  const mounted = phase !== "closed";

  React.useLayoutEffect(() => {
    const el = pillRef.current;
    if (!el) return;
    const measure = () => setPill((p) => (p.width === el.offsetWidth && p.height === el.offsetHeight ? p : { width: el.offsetWidth, height: el.offsetHeight }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useLayoutEffect(() => {
    const el = moreRef.current;
    if (el) setMoreWidth(el.offsetWidth);
  }, [more]);

  React.useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => {
      const width = Math.min(cardWidth, document.documentElement.clientWidth - 32);
      setCardSize((c) => (c.width === width && c.height === el.offsetHeight ? c : { width, height: el.offsetHeight }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, cardWidth]);

  const open = () => {
    window.clearTimeout(timer.current);
    setPhase(reduced ? "open" : "opening");
  };

  const close = React.useCallback(
    (refocus = true) => {
      window.clearTimeout(timer.current);
      if (refocus) pillRef.current?.focus({ preventScroll: true });
      if (reduced) return setPhase("closed");
      setPhase("closing");
      timer.current = window.setTimeout(() => setPhase("closed"), DURATION);
    },
    [reduced]
  );

  // Paint the surface at the pill's size first, then let it grow.
  React.useEffect(() => {
    if (phase !== "opening") return;
    let inner = 0;
    const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(() => setPhase("open"))));
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [phase]);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  React.useEffect(() => {
    if (!expanded) return;
    cardRef.current?.querySelector<HTMLElement>("a[href], button")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => !wrapRef.current?.contains(e.target as Node) && close(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [expanded, close]);

  const line = (
    <>
      <span className="flex h-6 shrink-0 items-center rounded-full bg-primary/10 px-2 text-[11.5px] font-medium text-primary">{badge}</span>
      <span className="whitespace-nowrap text-[13px] text-foreground">{children}</span>
      {more && (
        <span
          className="flex overflow-hidden whitespace-nowrap text-[13px] text-muted-foreground transition-[max-width,opacity] duration-500 group-hover/pill:opacity-100 group-focus-visible/pill:opacity-100 [max-width:0] group-hover/pill:[max-width:var(--more)] group-focus-visible/pill:[max-width:var(--more)] opacity-0"
          style={{ "--more": `${moreWidth}px`, transitionTimingFunction: EASE } as React.CSSProperties}
        >
          <span ref={moreRef} className="flex w-max shrink-0 items-center gap-1.5 pl-0.5">
            <span aria-hidden="true" className="text-border">
              ·
            </span>
            {more}
          </span>
        </span>
      )}
      <Arrow />
    </>
  );

  const pillClass = `group/pill inline-flex h-8 items-center gap-2 rounded-full bg-background pl-1 pr-3 shadow-[inset_0_0_0_1px_var(--border)] transition-[box-shadow] duration-300 hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_22%,transparent)] ${FOCUS}`;

  if (!card) {
    return (
      <div className={`inline-flex ${className}`} {...props}>
        <a ref={(el) => void (pillRef.current = el)} href={href} className={pillClass}>
          {line}
        </a>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={`relative inline-flex ${className}`} {...props}>
      <button
        ref={(el) => void (pillRef.current = el)}
        type="button"
        aria-expanded={expanded}
        aria-controls={mounted ? `${id}-card` : undefined}
        onClick={() => (expanded ? close() : open())}
        className={`cursor-pointer ${pillClass} ${mounted ? "opacity-0" : ""}`}
      >
        {line}
      </button>

      {mounted && (
        <div
          id={`${id}-card`}
          role="dialog"
          aria-label={typeof children === "string" ? children : "Announcement"}
          className="absolute left-1/2 top-0 z-50 overflow-hidden bg-popover text-left text-popover-foreground"
          style={{
            width: expanded ? cardSize.width : pill.width,
            height: expanded ? cardSize.height : pill.height,
            transform: "translateX(-50%)",
            borderRadius: expanded ? 22 : pill.height / 2,
            boxShadow: "inset 0 0 0 1px var(--border)",
            transition: reduced ? "none" : `width ${DURATION}ms ${EASE}, height ${DURATION}ms ${EASE}, border-radius ${DURATION}ms ${EASE}`,
          }}
        >
          {/* The pill's line, fading out as the card grows and back in as it folds. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 flex h-8 -translate-x-1/2 items-center gap-2 pl-1 pr-3"
            style={{ opacity: expanded ? 0 : 1, transition: reduced ? "none" : expanded ? "opacity 120ms ease-out" : "opacity 200ms ease-out 180ms" }}
          >
            {line}
          </span>
          <div
            ref={cardRef}
            inert={!expanded}
            className="absolute left-0 top-0"
            style={{
              width: cardSize.width,
              opacity: expanded ? 1 : 0,
              transform: expanded ? "none" : "translateY(-6px)",
              transition: reduced ? "none" : expanded ? `opacity 260ms ease-out 140ms, transform ${DURATION}ms ${EASE}` : "opacity 100ms ease-out",
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => close()}
              className={`cursor-pointer absolute right-2.5 top-2.5 z-10 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${FOCUS}`}
            >
              <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3">
                <path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {card}
          </div>
        </div>
      )}
    </div>
  );
}
