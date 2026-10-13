// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Changelog timeline (changelog-timeline)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * CHANGELOG TIMELINE: what shipped, drawn as you read
 *
 *   read      a Tactile rail runs down the page and fills as you
 *             scroll; each entry's dot fills as the line reaches it
 *   arrive    entries rise out of a light blur the first time they
 *             come into view
 *   filter    All, New, Improved, Fixed: a pill is thrown to the
 *             choice, entries that don't match fold away and the
 *             count rolls
 *   older     "Show 6 older" folds the rest open and morphs to
 *             "Show fewer"
 *
 * Every entry has an anchor, so a release can be linked to.
 * ───────────────────────────────────────────────────────── */

export interface ChangelogEntry {
  id: string;
  date: string | Date;
  title: string;
  version?: string;
  /** e.g. ["new"], ["improved", "fixed"]. */
  tags?: string[];
  body?: React.ReactNode;
  /** An image or video under the text. */
  media?: React.ReactNode;
}

export interface ChangelogTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  entries: ChangelogEntry[];
  /** How many show before "Show older". */
  initialCount?: number;
  /** Filter chips, by tag; defaults to the tags in the entries. */
  filters?: { tag: string; label: string }[];
  locales?: string | string[];
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const TAG_LABEL: Record<string, string> = { new: "New", improved: "Improved", fixed: "Fixed" };
const TAG_TONE: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  improved: "bg-muted text-foreground/80",
  fixed: "bg-muted text-muted-foreground",
};

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** Rises out of a light blur the first time it scrolls into view. */
function Arrive({ reduced, children }: { reduced: boolean; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [seen, setSeen] = React.useState(reduced);
  React.useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen]);
  return (
    <div
      ref={ref}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : "translateY(14px)",
        filter: seen ? "none" : "blur(4px)",
        transition: reduced ? "none" : `opacity 560ms ${EASE}, transform 700ms ${EASE}, filter 560ms ${EASE}`,
      }}
    >
      {children}
    </div>
  );
}

export function ChangelogTimeline({ entries, initialCount = 4, filters: filtersProp, locales, className = "", ...props }: ChangelogTimelineProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const [filter, setFilter] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [passed, setPassed] = React.useState<Set<string>>(() => new Set());
  const rootRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLDivElement>(null);
  const dotRefs = React.useRef(new Map<string, HTMLSpanElement>());
  const chipRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = React.useState({ left: 0, width: 0, ready: false });

  const filters = React.useMemo(() => {
    if (filtersProp) return filtersProp;
    const tags = Array.from(new Set(entries.flatMap((e) => e.tags ?? [])));
    return tags.map((tag) => ({ tag, label: TAG_LABEL[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1) }));
  }, [entries, filtersProp]);
  const chips = [{ tag: null as string | null, label: "All" }, ...filters];

  const matches = entries.filter((e) => !filter || e.tags?.includes(filter));
  const limit = showAll ? Infinity : initialCount;
  const shownIds = new Set(matches.slice(0, limit).map((e) => e.id));
  const hiddenOlder = Math.max(0, matches.length - initialCount);

  // The rail fills to the middle of the screen as you read; dots fill as the line reaches them.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    let visible = false;
    const update = () => {
      frame = 0;
      const rail = railRef.current?.getBoundingClientRect();
      if (!rail) return;
      const anchor = window.innerHeight * 0.55;
      const p = Math.min(1, Math.max(0, (anchor - rail.top) / Math.max(1, rail.height)));
      setProgress((x) => (Math.abs(x - p) < 0.002 ? x : p));
      const now = new Set<string>();
      dotRefs.current.forEach((dot, key) => {
        if (dot.getBoundingClientRect().top + 5 <= anchor) now.add(key);
      });
      setPassed((s) => (s.size === now.size && [...now].every((k) => s.has(k)) ? s : now));
    };
    const onScroll = () => {
      if (visible && !frame) frame = requestAnimationFrame(update);
    };
    // Only listen while the timeline is on screen.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) update();
    });
    observer.observe(root);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Folding entries move the dots: re-check once the folds have settled.
  React.useEffect(() => {
    const t = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 520);
    return () => window.clearTimeout(t);
  }, [filter, showAll]);

  React.useLayoutEffect(() => {
    const el = chipRefs.current[chips.findIndex((c) => c.tag === filter)];
    if (!el) return;
    setPill((p) => (p.left === el.offsetLeft && p.width === el.offsetWidth ? p : { left: el.offsetLeft, width: el.offsetWidth, ready: p.width > 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, filters.length]);

  const dateText = (d: string | Date) => new Date(d).toLocaleDateString(locales ?? "en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fold = (open: boolean): React.CSSProperties => ({
    gridTemplateRows: open ? "1fr" : "0fr",
    opacity: open ? 1 : 0,
    transition: reduced ? "none" : `grid-template-rows 480ms ${EASE}, opacity ${open ? "380ms" : "160ms"} ${EASE}`,
  });

  return (
    <div ref={rootRef} className={`w-full ${className}`} {...props}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Show" className="relative inline-flex rounded-full bg-muted p-0.5">
          <span
            aria-hidden="true"
            className="absolute inset-y-0.5 left-0 rounded-full bg-background shadow-[0_0_0_1px_var(--border)]"
            style={{ width: pill.width, transform: `translateX(${pill.left}px)`, transition: pill.ready && !reduced ? `transform 460ms ${THROW}, width 380ms ${EASE}` : "none" }}
          />
          {chips.map((c, i) => {
            const selected = c.tag === filter;
            return (
              <button
                key={c.label}
                ref={(el) => {
                  chipRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setFilter(c.tag)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const next = (i + (e.key === "ArrowRight" ? 1 : -1) + chips.length) % chips.length;
                  setFilter(chips[next].tag);
                  chipRefs.current[next]?.focus();
                }}
                className={`cursor-pointer relative h-8 rounded-full px-3.5 text-[12.5px] font-medium transition-colors duration-300 ${FOCUS} ${selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <p className="flex items-baseline gap-[0.3em] text-[12.5px] tabular-nums text-muted-foreground">
          <NumberRoll value={matches.length} duration={600} />
          <TextMorph>{matches.length === 1 ? "update" : "updates"}</TextMorph>
        </p>
      </div>

      <div className="relative">
        {/* The rail, and the line that fills it as you read. */}
        <div ref={railRef} aria-hidden="true" className="absolute bottom-2 top-2 left-[5px] w-px bg-border sm:left-[133px]">
          <div className="absolute inset-0 origin-top bg-foreground/70" style={{ transform: `scaleY(${progress})` }} />
        </div>

        <ol className="relative">
          {entries.map((e) => {
            const shown = shownIds.has(e.id);
            const lit = passed.has(e.id);
            return (
              <li key={e.id} id={e.id} inert={!shown} aria-hidden={!shown || undefined} className="grid scroll-mt-24" style={fold(shown)}>
                <div className="min-h-0 overflow-hidden">
                  <Arrive reduced={reduced}>
                    <article className="grid grid-cols-[11px_1fr] gap-x-5 pb-12 sm:grid-cols-[110px_11px_1fr] sm:gap-x-[17px]">
                      <div className="hidden pt-0.5 text-right sm:block">
                        <time dateTime={new Date(e.date).toISOString()} className="text-[12.5px] text-muted-foreground">
                          {dateText(e.date)}
                        </time>
                        {e.version && <p className="mt-1 font-mono text-[11.5px] text-muted-foreground/80">{e.version}</p>}
                      </div>
                      {/* The dot fills when the line reaches it. */}
                      <span
                        ref={(el) => {
                          if (el) dotRefs.current.set(e.id, el);
                          else dotRefs.current.delete(e.id);
                        }}
                        aria-hidden="true"
                        className="relative mt-[5px] flex size-[11px] items-center justify-center rounded-full bg-background shadow-[inset_0_0_0_1px_var(--border)] transition-[box-shadow] duration-500"
                        style={{ boxShadow: lit ? "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 70%, transparent)" : undefined }}
                      >
                        <span
                          className="size-[5px] rounded-full bg-foreground/70"
                          style={{ transform: lit ? "scale(1)" : "scale(0)", transition: reduced ? "none" : `transform 420ms ${THROW}` }}
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2 sm:hidden">
                          <time dateTime={new Date(e.date).toISOString()} className="text-[12px] text-muted-foreground">
                            {dateText(e.date)}
                          </time>
                          {e.version && <span className="font-mono text-[11px] text-muted-foreground/80">{e.version}</span>}
                        </div>
                        {e.tags && e.tags.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {e.tags.map((t) => (
                              <span key={t} className={`rounded-full px-2 py-px text-[11px] font-medium ${TAG_TONE[t] ?? "bg-muted text-foreground/80"}`}>
                                {TAG_LABEL[t] ?? t}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="text-[17px] font-medium leading-snug tracking-[-0.015em] text-foreground">
                          <a href={`#${e.id}`} className={`rounded hover:underline hover:decoration-border hover:underline-offset-4 ${FOCUS}`}>
                            {e.title}
                          </a>
                        </h3>
                        {e.body && <div className="mt-2 text-[14px] leading-relaxed text-muted-foreground [&_li]:mt-1 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">{e.body}</div>}
                        {e.media && <div className="mt-4 overflow-hidden rounded-[16px] border border-border">{e.media}</div>}
                      </div>
                    </article>
                  </Arrive>
                </div>
              </li>
            );
          })}
        </ol>

        {hiddenOlder > 0 && (
          <div className="pl-[31px] sm:pl-[155px]">
            <button
              type="button"
              aria-expanded={showAll}
              onClick={() => setShowAll((s) => !s)}
              className={`cursor-pointer inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-accent ${FOCUS}`}
            >
              <TextMorph>{showAll ? "Show fewer" : `Show ${hiddenOlder} older`}</TextMorph>
            </button>
          </div>
        )}
      </div>
      <p id={`${id}-status`} role="status" className="sr-only">
        {`${matches.length} ${matches.length === 1 ? "update" : "updates"}`}
      </p>
    </div>
  );
}
