// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Web research (web-research)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * WEB RESEARCH: watch the agent search and read
 *
 *   searching  "Searching" shimmers; the live query types in
 *   reading    the label morphs to "Reading" and "7 sites"
 *              rolls up; each page drops its icon into the
 *              stack (the oldest folds away) while its title
 *              rises in underneath as the last one lifts off
 *   done       the line morphs into "3 searches · 9 sources":
 *              counts roll, words morph, the title row folds
 *              shut and a chevron opens in; open it for the list
 *   error      "Search failed", keeping whatever was found
 *   cancelled  "Stopped after 2 searches"
 *   trail      opened, each search is a row on a Tactile trail
 *              with its count; a search on one site wears that
 *              site's mark, and the pages it found sit under it
 *              as overlapping marks that fold open into links
 *
 * Feed it the queries and sources as they arrive (tool calls
 * and source parts from the AI SDK); it animates the rest.
 * ───────────────────────────────────────────────────────── */

export type ResearchStatus = "searching" | "reading" | "done" | "error" | "cancelled";

export interface ResearchSource {
  url: string;
  title?: string;
  /** An icon URL; without one, a tinted monogram of the site. */
  favicon?: string;
  /** Which search found it (its index in queries), so the trail can group pages under their search. */
  query?: number;
}

export interface ResearchQuery {
  text: string;
  /** A search on one site, e.g. "threadly.com": the row wears that site's mark and reads "Searched Threadly for ...". */
  site?: string;
  /** An icon URL for that site. */
  siteIcon?: string;
  /** How many it found. */
  results?: number;
  /** The word after the count, e.g. "posts". Defaults to "results". */
  resultLabel?: string;
}

export interface WebResearchProps extends React.HTMLAttributes<HTMLDivElement> {
  status: ResearchStatus;
  /** Queries so far, as text or with their site and count; the last one is live while searching. */
  queries: (string | ResearchQuery)[];
  /** Pages read so far, in order. */
  sources: ResearchSource[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const EASE = "cubic-bezier(0.23,1,0.32,1)";
const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const STACK = 4;
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
  React.useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(reducedQuery).matches,
    () => false,
  );

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function hue(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

const asQuery = (q: string | ResearchQuery): ResearchQuery => (typeof q === "string" ? { text: q } : q);
const siteName = (site: string) => {
  const parts = hostname(`https://${site}`).split(".");
  const name = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return name.length <= 2 ? name.toUpperCase() : name.charAt(0).toUpperCase() + name.slice(1);
};

const plural = (n: number, word: string) => `${word}${n === 1 ? "" : /(s|sh|ch|x)$/.test(word) ? "es" : "s"}`;

function Favicon({ source, className = "" }: { source: ResearchSource; className?: string }) {
  const host = hostname(source.url);
  const [failed, setFailed] = React.useState(false);
  if (source.favicon && !failed) {
    return <img src={source.favicon} alt="" onError={() => setFailed(true)} className={`rounded-full bg-background object-cover ${className}`} />;
  }
  const h = hue(host);
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-full text-[9.5px] font-semibold leading-none ${className}`}
      style={{
        background: `color-mix(in oklab, oklch(0.62 0.13 ${h}) 20%, var(--background))`,
        color: `oklch(0.5 0.12 ${h})`,
      }}
    >
      {host.charAt(0).toUpperCase()}
    </span>
  );
}

/** Types the newest query in, a few characters a frame; earlier text never re-types. */
function useTyped(text: string, active: boolean, reduced: boolean) {
  const [shown, setShown] = React.useState(text);
  React.useEffect(() => {
    if (!active || reduced) {
      setShown(text);
      return;
    }
    let i = 0;
    let frame = 0;
    const step = () => {
      i = Math.min(text.length, i + 2);
      setShown(text.slice(0, i));
      if (i < text.length) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [text, active, reduced]);
  return shown;
}

/** A piece of the line that opens out of nothing and folds back into it (width eases, content blurs in). */
function Reveal({ show, reduced, className = "", children }: { show: boolean; reduced: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span
      aria-hidden={!show || undefined}
      className={`grid min-w-0 ${className}`}
      style={{
        gridTemplateColumns: show ? "1fr" : "0fr",
        opacity: show ? 1 : 0,
        filter: show ? "none" : "blur(4px)",
        transition: reduced ? "none" : `grid-template-columns 460ms ${MORPH}, opacity ${show ? "320ms" : "180ms"} ${MORPH}, filter 320ms ${MORPH}`,
      }}
    >
      <span className="min-w-0 whitespace-nowrap [clip-path:inset(-4px_-2px)]">{children}</span>
    </span>
  );
}

/** One icon in the stack: drops in when it's new, folds away when it's pushed out by a newer one. */
function StackIcon({ shown, first, enter, reduced, z, children }: { shown: boolean; first: boolean; enter: boolean; reduced: boolean; z: number; children: React.ReactNode }) {
  const [entering] = React.useState(enter);
  return (
    <span
      aria-hidden={!shown || undefined}
      className={`relative flex h-5 shrink-0 ${entering && !reduced ? "animate-[ui-drop-in_420ms_cubic-bezier(0.23,1,0.32,1)_backwards]" : ""}`}
      style={{
        zIndex: z,
        width: shown ? 20 : 0,
        marginLeft: shown && !first ? -6 : 0,
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "scale(0.6)",
        transition: reduced ? "none" : `width 420ms ${MORPH}, margin 420ms ${MORPH}, opacity 260ms ${MORPH}, transform 420ms ${MORPH}`,
      }}
    >
      <span className="flex size-5 shrink-0 overflow-hidden rounded-full ring-2 ring-background">{children}</span>
    </span>
  );
}

/** A one-line ticker: the new text rises in out of a blur while the last one lifts away. */
function Ticker({ id, reduced, children }: { id: string; reduced: boolean; children: React.ReactNode }) {
  const [current, setCurrent] = React.useState<{ id: string; node: React.ReactNode }>({ id, node: children });
  const [leaving, setLeaving] = React.useState<{ id: string; node: React.ReactNode }[]>([]);
  if (current.id !== id) {
    if (!reduced) setLeaving((l) => (l.some((x) => x.id === current.id) ? l : [...l, current]));
    setCurrent({ id, node: children });
  }
  const done = React.useCallback((leftId: string) => setLeaving((l) => l.filter((x) => x.id !== leftId)), []);
  const first = React.useRef(true);
  React.useEffect(() => {
    first.current = false;
  }, []);

  return (
    <span className="relative block h-4">
      {leaving.map((l) => (
        <Tick key={`out-${l.id}`} id={l.id} out onDone={done}>
          {l.node}
        </Tick>
      ))}
      <Tick key={id} id={id} enter={!first.current && !reduced}>
        {children}
      </Tick>
    </span>
  );
}

function Tick({ id, out = false, enter = false, onDone, children }: { id: string; out?: boolean; enter?: boolean; onDone?: (id: string) => void; children: React.ReactNode }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [entering] = React.useState(enter);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (out) {
      const animation = el.animate(
        [
          { opacity: 1, filter: "blur(0px)", transform: "none" },
          { opacity: 0, filter: "blur(4px)", transform: "translateY(-6px)" },
        ],
        { duration: 220, easing: MORPH, fill: "forwards" }
      );
      animation.onfinish = () => onDone?.(id);
      return () => animation.cancel();
    }
    if (!entering) return;
    const animation = el.animate(
      [
        { opacity: 0, filter: "blur(4px)", transform: "translateY(6px)" },
        { opacity: 1, filter: "blur(0px)", transform: "none" },
      ],
      { duration: 380, easing: MORPH, delay: 60, fill: "backwards" }
    );
    return () => animation.cancel();
  }, [id, out, entering, onDone]);
  return (
    <span ref={ref} aria-hidden={out || undefined} className="absolute inset-0 truncate text-[11.5px] text-muted-foreground/80">
      {children}
    </span>
  );
}

function SourceLink({ source }: { source: ResearchSource }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="flex h-7 items-center gap-2.5 rounded-lg px-1.5 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
    >
      <Favicon source={source} className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground">{source.title ?? hostname(source.url)}</span>
      <span className="shrink-0 text-[11.5px] text-muted-foreground">{hostname(source.url)}</span>
    </a>
  );
}

/** The pages one search found: overlapping marks on a branch of the trail, folding open into links. */
function SourceGroup({ sources, reduced }: { sources: ResearchSource[]; reduced: boolean }) {
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();
  const shown = sources.slice(0, 5);
  return (
    <div className="relative mb-1 ml-6">
      <span aria-hidden="true" className="absolute -left-3.5 -top-1 h-[13px] w-2.5 rounded-bl-[5px] border-b border-l border-border" />
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer group flex h-6 items-center gap-2 rounded-md text-[12px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        Sources
        <span className="flex items-center">
          {shown.map((src, i) => (
            <span key={src.url} className="flex size-4 overflow-hidden rounded-full ring-2 ring-background" style={{ marginLeft: i ? -5 : 0, zIndex: shown.length - i }}>
              <Favicon source={src} className="size-full" />
            </span>
          ))}
          {sources.length > shown.length && <span className="ml-1 font-mono text-[10px]">+{sources.length - shown.length}</span>}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-3.5"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: reduced ? "none" : `transform 320ms ${EASE}` }}
        />
        <span className="sr-only">({sources.length})</span>
      </button>
      <div
        id={listId}
        inert={!open}
        className="grid"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0, transition: reduced ? "none" : `grid-template-rows 380ms ${EASE}, opacity ${open ? "280ms" : "140ms"} ${EASE}` }}
      >
        <ul className="-mx-1.5 min-h-0 overflow-hidden">
          {sources.map((src) => (
            <li key={src.url}>
              <SourceLink source={src} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function WebResearch({ status, queries, sources, open: openProp, defaultOpen = false, onOpenChange, className = "", ...props }: WebResearchProps) {
  const reduced = useReducedMotion();
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen);
  const open = openProp ?? ownOpen;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  const working = status === "searching" || status === "reading";
  const query = queries.length ? asQuery(queries[queries.length - 1]).text : "";
  const typed = useTyped(query, status === "searching", reduced);
  const latest = sources[sources.length - 1];
  const extra = Math.max(0, sources.length - STACK);
  // Pages that don't say which search found them are listed after the trail.
  const ungrouped = sources.filter((src) => src.query === undefined || src.query < 0 || src.query >= queries.length);
  const listId = React.useId();

  // Icons that arrive after the first paint drop in; the ones already there just sit.
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
  }, []);

  // One line that rearranges itself: a label, then whichever counts this state needs.
  const label = { searching: "Searching", reading: "Reading", error: "Search failed", cancelled: "Stopped after", done: "" }[status];
  const showSearches = status === "done" || status === "cancelled";
  const showSources = sources.length > 0 && (status === "reading" || status === "done" || status === "error");
  const showDot = showSources && (status === "done" || status === "error");
  const sourceWord = status === "reading" ? plural(sources.length, "site") : plural(sources.length, "source");

  const summary =
    status === "searching"
      ? `Searching for ${query}`
      : status === "reading"
        ? `Read ${sources.length} ${sourceWord}`
        : status === "error"
          ? `Search failed${sources.length ? `, ${sources.length} ${sourceWord}` : ""}`
          : status === "cancelled"
            ? `Stopped after ${queries.length} ${plural(queries.length, "search")}`
            : `Done: ${queries.length} ${plural(queries.length, "search")}, ${sources.length} ${sourceWord}`;

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* The same row from first search to final summary, so every piece of it can morph; it becomes a button once there's a list to open. */}
      <button
        type="button"
        disabled={working}
        aria-expanded={working ? undefined : open}
        aria-controls={working ? undefined : listId}
        onClick={() => setOpen(!open)}
        className="group flex min-h-9 w-full items-center gap-2.5 rounded-lg py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default"
      >
        <span aria-hidden="true" className="relative flex h-5 shrink-0 items-center">
          <StackIcon shown={sources.length === 0} first enter={false} reduced={reduced} z={0}>
            <span className="flex size-full items-center justify-center bg-muted text-muted-foreground">
              <Search className={`size-3 ${working ? "animate-[ui-breathe_1.6s_ease-in-out_infinite] motion-reduce:animate-none" : ""}`} strokeWidth={2.2} />
            </span>
          </StackIcon>
          {sources.map((s, i) => (
            <StackIcon key={s.url} shown={i >= sources.length - STACK} first={i === Math.max(0, sources.length - STACK)} enter={mounted.current && working} reduced={reduced} z={i + 1}>
              <Favicon source={s} className="size-full" />
            </StackIcon>
          ))}
          <Reveal show={extra > 0} reduced={reduced} className="relative z-[999]">
            <span className="ml-[-6px] flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 font-mono text-[9.5px] text-muted-foreground ring-2 ring-background">
              <NumberRoll value={extra} prefix="+" duration={600} />
            </span>
          </Reveal>
        </span>

        <span className="min-w-0 flex-1 text-left">
          <span
            className={`flex min-w-0 items-center text-[13px] leading-5 transition-colors duration-300 ${status === "error" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
          >
            <span className={`shrink-0 font-medium transition-colors duration-300 ${working ? SHEEN : ""}`}>
              <TextMorph>{label}</TextMorph>
            </span>
            <Reveal show={showSearches} reduced={reduced} className="shrink-0">
              <span className="inline-flex items-baseline transition-[padding] duration-500" style={{ paddingLeft: label ? 5 : 0, transitionTimingFunction: MORPH }}>
                <NumberRoll value={queries.length} duration={700} />
                &nbsp;
                <TextMorph>{plural(queries.length, "search")}</TextMorph>
              </span>
            </Reveal>
            <Reveal show={showDot} reduced={reduced} className="shrink-0">
              <span className="px-1.5 opacity-60">·</span>
            </Reveal>
            <Reveal show={showSources} reduced={reduced} className="shrink-0">
              <span className="inline-flex items-baseline transition-[padding] duration-500" style={{ paddingLeft: showDot ? 0 : 5, transitionTimingFunction: MORPH }}>
                <NumberRoll value={sources.length} duration={700} />
                &nbsp;
                <TextMorph>{sourceWord}</TextMorph>
              </span>
            </Reveal>
            <Reveal show={status === "searching" && Boolean(query)} reduced={reduced} className="shrink">
              <span className="block truncate pl-1.5">“{typed}”</span>
            </Reveal>
          </span>
          {/* The page being read; the row folds shut when the work is done. */}
          <span
            aria-hidden={!working || undefined}
            className="grid"
            style={{
              gridTemplateRows: working && latest ? "1fr" : "0fr",
              opacity: working && latest ? 1 : 0,
              transition: reduced ? "none" : `grid-template-rows 420ms ${MORPH}, opacity 260ms ${MORPH}`,
            }}
          >
            <span className="min-h-0 overflow-hidden">
              <span className="block pt-0.5">
                {latest && (
                  <Ticker id={latest.url} reduced={reduced}>
                    {latest.title ?? hostname(latest.url)} <span className="text-muted-foreground/60">· {hostname(latest.url)}</span>
                  </Ticker>
                )}
              </span>
            </span>
          </span>
        </span>

        <Reveal show={!working} reduced={reduced} className="shrink-0">
          <ChevronRight
            aria-hidden="true"
            className="size-3.5 text-muted-foreground transition-transform duration-300 group-hover:text-foreground motion-reduce:transition-none"
            style={{
              transform: open ? "rotate(90deg)" : "none",
              transitionTimingFunction: EASE,
            }}
          />
        </Reveal>
      </button>
      {/* Outside the button, so the button's name stays its visible text. */}
      <span role="status" aria-live="polite" className="sr-only">
        {summary}
      </span>

      <div
        id={listId}
        inert={!open || working}
        className="grid"
        style={{
          gridTemplateRows: open && !working ? "1fr" : "0fr",
          transition: reduced ? "none" : `grid-template-rows 380ms ${EASE}`,
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="ml-[9px] mt-1 pl-[19px]">
            {queries.length > 0 && (
              <ul className="pb-1">
                {queries.map((raw, i) => {
                  const q = asQuery(raw);
                  const found = sources.filter((src) => src.query === i);
                  const last = i === queries.length - 1 && ungrouped.length === 0;
                  return (
                    <li key={i} className="relative">
                      {/* The trail: a Tactile down the left, a short branch to each search. */}
                      <span aria-hidden="true" className="absolute -left-[19px] top-0 w-px bg-border" style={last ? { height: 15 } : { bottom: 0 }} />
                      <span aria-hidden="true" className="absolute -left-[19px] top-[15px] h-px w-3 bg-border" />
                      <div className="flex items-start gap-2 py-1.5 text-[12.5px] leading-[18px] text-muted-foreground">
                        <span className="mt-px flex size-4 shrink-0 items-center justify-center">
                          {q.site ? (
                            <Favicon source={{ url: `https://${q.site}`, favicon: q.siteIcon }} className="size-4" />
                          ) : (
                            <Search aria-hidden="true" className="size-3.5" strokeWidth={2.1} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-foreground/85">
                          {q.site ? (
                            <>
                              Searched {siteName(q.site)} for <span className="font-mono text-[11.5px] text-muted-foreground">{q.text}</span>
                            </>
                          ) : (
                            q.text
                          )}
                        </span>
                        {q.results != null && (
                          <span className="shrink-0 whitespace-nowrap tabular-nums">
                            {q.results} {q.resultLabel ?? plural(q.results, "result")}
                          </span>
                        )}
                      </div>
                      {found.length > 0 && <SourceGroup sources={found} reduced={reduced} />}
                    </li>
                  );
                })}
              </ul>
            )}
            {ungrouped.length > 0 && (
              <div className={queries.length ? "border-t border-border/60 pb-1 pt-1.5" : "pb-1"}>
                <ul className="-mx-1.5 max-h-80 overflow-y-auto overflow-x-hidden px-1.5 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
                  {ungrouped.map((src) => (
                    <li key={src.url}>
                      <SourceLink source={src} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
