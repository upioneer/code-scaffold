// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Agent playback (agent-playback)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { Pause, Play } from "lucide-react";
import { PromptComposer, type ComposerStatus } from "./prompt-composer";
import { AnswerActions, StreamingText, type AnswerSegment, type AnswerSource } from "./streaming-answer";
import { ThinkingTrace } from "./thinking-trace";
import { ToolCall, type ToolCallStatus } from "./tool-call";
import { WebResearch, type ResearchSource, type ResearchStatus } from "./web-research";

/* ─────────────────────────────────────────────────────────
 * AGENT PLAYBACK: your product, working, on a loop
 *
 *   typing     the prompt types itself into the composer, with
 *              a person's uneven rhythm
 *   sent       the text lifts out of the composer and glides
 *              into the message bubble; Send becomes a spinner
 *   working    the agent's blocks arrive one by one, each opening
 *              its own room so what's above glides up: a thinking
 *              trace ticking off steps, web research stacking
 *              sources, a tool call filling in its arguments
 *   answering  the answer streams in word by word, citations and
 *              all, then its actions settle in underneath
 *   next       a beat to read it, then the conversation dissolves
 *              and the next prompt starts typing
 *
 * Built from the real components (composer, thinking trace, web
 * research, tool call, streaming answer), so the hero shows
 * exactly what the product does. It pauses off-screen and in a
 * hidden tab, has its own pause button, and with reduced motion
 * shows the finished first conversation, still.
 * ───────────────────────────────────────────────────────── */

export type PlaybackStep =
  | { type: "thinking"; steps: string[]; label?: string; variant?: "steps" | "reasoning" }
  | { type: "search"; queries: { query: string; sources: ResearchSource[] }[] }
  | {
      type: "tool";
      name: string;
      title?: string;
      icon?: React.ReactNode;
      /** Fills in field by field, as a model writes the arguments. */
      input: Record<string, unknown>;
      output?: unknown;
      renderOutput?: (output: unknown) => React.ReactNode;
      /** How long it runs (ms); shown as its run time. */
      duration?: number;
      /** Show the arguments and result. Default true. */
      open?: boolean;
    }
  | { type: "answer"; content: AnswerSegment[] | string; sources?: AnswerSource[] };

export interface PlaybackTurn {
  prompt: string;
  steps: PlaybackStep[];
}

export interface AgentPlaybackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The conversations to play, in order. */
  turns: PlaybackTurn[];
  /** Pace: 2 plays twice as fast. */
  speed?: number;
  /** How long a finished answer stays before the next prompt (ms). */
  hold?: number;
  /** Start again after the last turn. */
  loop?: boolean;
  /** Pause from outside, e.g. while a dialog is open. */
  paused?: boolean;
  placeholder?: string;
  /** Above the conversation, e.g. your product's name. */
  header?: React.ReactNode;
  /** The window's height; it never changes, so the page around it never moves. */
  height?: number;
}

type Block =
  | { id: number; type: "thinking"; labels: string[]; status: "running" | "done"; startedAt: number; label?: string; variant: "steps" | "reasoning" }
  | { id: number; type: "search"; status: ResearchStatus; queries: string[]; sources: ResearchSource[] }
  | { id: number; type: "tool"; step: Extract<PlaybackStep, { type: "tool" }>; status: ToolCallStatus; input: Record<string, unknown> }
  | { id: number; type: "answer"; content: AnswerSegment[]; status: "streaming" | "done"; sources?: AnswerSource[] };

type View = { turn: number; draft: string; sent: string | null; composer: ComposerStatus; blocks: Block[]; leaving: boolean };

const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const EMPTY: View = { turn: 0, draft: "", sent: null, composer: "ready", blocks: [], leaving: false };

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

/** Words and spaces as separate tokens, citations whole, so an answer can stream a few at a time. */
function tokens(content: AnswerSegment[] | string): AnswerSegment[] {
  const parts: AnswerSegment[] = typeof content === "string" ? [content] : content;
  return parts.flatMap((p): AnswerSegment[] => (typeof p === "string" ? p.split(/(\s+)/).filter(Boolean) : [p]));
}

/** The finished state of a turn, for reduced motion. */
function settled(turn: PlaybackTurn, index: number): View {
  let id = 0;
  const blocks: Block[] = turn.steps.map((step) => {
    id += 1;
    if (step.type === "thinking") return { id, type: "thinking", labels: step.steps, status: "done", startedAt: 0, label: step.label, variant: step.variant ?? "steps" };
    if (step.type === "search")
      return { id, type: "search", status: "done", queries: step.queries.map((q) => q.query), sources: step.queries.flatMap((q) => q.sources) };
    if (step.type === "tool") return { id, type: "tool", step, status: "done", input: step.input };
    return { id, type: "answer", content: tokens(step.content), status: "done", sources: step.sources };
  });
  return { turn: index, draft: "", sent: turn.prompt, composer: "ready", blocks, leaving: false };
}

/**
 * A clock whose waits can be paused mid-way and resumed for the time that was left,
 * so going off-screen (or pressing pause) freezes the story exactly where it is.
 */
function createClock() {
  let paused = false;
  let wait: { resolve: () => void; left: number; since: number; timer: number } | null = null;
  const start = () => {
    if (!wait) return;
    wait.since = performance.now();
    wait.timer = window.setTimeout(() => {
      const done = wait?.resolve;
      wait = null;
      done?.();
    }, Math.max(0, wait.left));
  };
  return {
    sleep(ms: number) {
      return new Promise<void>((resolve) => {
        wait = { resolve, left: ms, since: 0, timer: 0 };
        if (!paused) start();
      });
    },
    pause() {
      if (paused) return;
      paused = true;
      if (wait?.timer) {
        window.clearTimeout(wait.timer);
        wait.left -= performance.now() - wait.since;
        wait.timer = 0;
      }
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (wait && !wait.timer) start();
    },
    stop() {
      if (wait?.timer) window.clearTimeout(wait.timer);
      wait = null;
    },
  };
}

/** A block that opens its own room as it arrives, so everything above glides up instead of jumping. */
function Arrive({ reduced, children }: { reduced: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(reduced);
  React.useEffect(() => {
    if (open) return;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return (
    <div
      className="grid"
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        opacity: open ? 1 : 0,
        transform: open ? "none" : "translateY(8px)",
        filter: open ? "none" : "blur(4px)",
        transition: reduced ? "none" : `grid-template-rows 520ms ${MORPH}, opacity 420ms ${MORPH} 80ms, transform 520ms ${MORPH}, filter 420ms ${MORPH} 80ms`,
      }}
    >
      <div className="min-h-0">{children}</div>
    </div>
  );
}

export function AgentPlayback({
  turns,
  speed = 1,
  hold = 4200,
  loop = true,
  paused = false,
  placeholder = "Ask anything",
  header,
  height = 540,
  className = "",
  ...props
}: AgentPlaybackProps) {
  const reduced = useReducedMotion();
  const [view, setView] = React.useState<View>(EMPTY);
  const [userPaused, setUserPaused] = React.useState(false);
  const [offscreen, setOffscreen] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const composerRef = React.useRef<HTMLDivElement>(null);
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  const fromRect = React.useRef<DOMRect | null>(null);
  const clock = React.useMemo(createClock, []);
  const pausedAt = React.useRef<number | null>(null);
  const halted = paused || userPaused || offscreen || hidden;
  // Restart only when the script itself changes, so an inline array in a parent that re-renders is fine.
  const latest = React.useRef(turns);
  React.useLayoutEffect(() => {
    latest.current = turns;
  });
  const scriptKey = turns.map((t) => `${t.prompt}\u0000${t.steps.length}`).join("\u0001");

  // Off-screen or in a background tab, the story waits.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting), { threshold: 0.15 });
    observer.observe(el);
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Pausing freezes the clock; on resume, live timers skip the time they were paused for.
  React.useEffect(() => {
    if (halted) {
      clock.pause();
      pausedAt.current ??= Date.now();
      return;
    }
    const since = pausedAt.current;
    pausedAt.current = null;
    clock.resume();
    if (since !== null) {
      const gap = Date.now() - since;
      setView((v) => ({ ...v, blocks: v.blocks.map((b) => (b.type === "thinking" && b.status === "running" ? { ...b, startedAt: b.startedAt + gap } : b)) }));
    }
  }, [halted, clock]);

  // The script.
  React.useEffect(() => {
    const turns = latest.current;
    if (!turns.length) return;
    if (reduced) {
      setView(settled(turns[0], 0));
      return;
    }
    let alive = true;
    let id = 0;
    const pace = (ms: number) => clock.sleep(ms / Math.max(0.1, speed));
    const update = (fn: (v: View) => View) => alive && setView(fn);
    const patch = (blockId: number, fn: (b: Block) => Block) => update((v) => ({ ...v, blocks: v.blocks.map((b) => (b.id === blockId ? fn(b) : b)) }));

    const play = async () => {
      for (let t = 0; alive; t = (t + 1) % turns.length) {
        const turn = turns[t];
        update(() => ({ ...EMPTY, turn: t }));
        await pace(700);

        // A person typing: quick runs, small pauses after words and punctuation.
        for (let i = 1; i <= turn.prompt.length && alive; i++) {
          update((v) => ({ ...v, draft: turn.prompt.slice(0, i) }));
          const ch = turn.prompt[i - 1];
          await pace(/[,.?!]/.test(ch) ? 180 : ch === " " ? 70 + Math.random() * 60 : 26 + Math.random() * 34);
        }
        if (!alive) return;
        await pace(420);

        // Send: note where the text sits in the composer so the bubble can glide out of it.
        const field = composerRef.current?.querySelector("textarea");
        fromRect.current = field?.getBoundingClientRect() ?? null;
        update((v) => ({ ...v, draft: "", sent: turn.prompt, composer: "submitted" }));
        await pace(650);

        for (const step of turn.steps) {
          if (!alive) return;
          const blockId = ++id;
          if (step.type === "thinking") {
            update((v) => ({
              ...v,
              composer: "streaming",
              blocks: [...v.blocks, { id: blockId, type: "thinking", labels: [], status: "running", startedAt: Date.now(), label: step.label, variant: step.variant ?? "steps" }],
            }));
            for (const label of step.steps) {
              await pace(650 + Math.random() * 350);
              patch(blockId, (b) => (b.type === "thinking" ? { ...b, labels: [...b.labels, label] } : b));
            }
            await pace(900);
            patch(blockId, (b) => (b.type === "thinking" ? { ...b, status: "done" } : b));
            await pace(700);
          } else if (step.type === "search") {
            update((v) => ({ ...v, composer: "streaming", blocks: [...v.blocks, { id: blockId, type: "search", status: "searching", queries: [], sources: [] }] }));
            for (const group of step.queries) {
              patch(blockId, (b) => (b.type === "search" ? { ...b, status: "searching", queries: [...b.queries, group.query] } : b));
              await pace(1150);
              for (const source of group.sources) {
                patch(blockId, (b) => (b.type === "search" ? { ...b, status: "reading", sources: [...b.sources, source] } : b));
                await pace(360 + Math.random() * 160);
              }
              await pace(300);
            }
            patch(blockId, (b) => (b.type === "search" ? { ...b, status: "done" } : b));
            await pace(650);
          } else if (step.type === "tool") {
            update((v) => ({ ...v, composer: "streaming", blocks: [...v.blocks, { id: blockId, type: "tool", step, status: "preparing", input: {} }] }));
            for (const [key, value] of Object.entries(step.input)) {
              await pace(280 + Math.random() * 140);
              patch(blockId, (b) => (b.type === "tool" ? { ...b, input: { ...b.input, [key]: value } } : b));
            }
            await pace(350);
            patch(blockId, (b) => (b.type === "tool" ? { ...b, status: "running" } : b));
            await pace(step.duration ?? 1300);
            patch(blockId, (b) => (b.type === "tool" ? { ...b, status: "done" } : b));
            await pace(800);
          } else {
            const all = tokens(step.content);
            update((v) => ({ ...v, composer: "streaming", blocks: [...v.blocks, { id: blockId, type: "answer", content: [], status: "streaming", sources: step.sources }] }));
            await pace(250);
            for (let i = 0; i < all.length && alive; ) {
              i = Math.min(all.length, i + 1 + Math.floor(Math.random() * 3));
              const shown = all.slice(0, i);
              patch(blockId, (b) => (b.type === "answer" ? { ...b, content: shown } : b));
              await pace(38 + Math.random() * 46);
            }
            patch(blockId, (b) => (b.type === "answer" ? { ...b, status: "done" } : b));
          }
        }
        update((v) => ({ ...v, composer: "ready" }));
        await pace(hold);
        if (!loop && t === turns.length - 1) return;
        // The conversation dissolves before the next one starts.
        update((v) => ({ ...v, leaving: true }));
        await pace(520);
      }
    };
    play();
    return () => {
      alive = false;
      clock.stop();
    };
  }, [scriptKey, speed, hold, loop, reduced, clock]);

  // The sent text glides from where it was typed into its bubble.
  React.useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    const from = fromRect.current;
    fromRect.current = null;
    if (!bubble || !from || reduced) return;
    const to = bubble.getBoundingClientRect();
    const dx = from.left + 14 - (to.left + 16);
    const dy = from.top + 12 - (to.top + 10);
    bubble.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)`, backgroundColor: "transparent" },
        { transform: "none", backgroundColor: getComputedStyle(bubble).backgroundColor },
      ],
      { duration: 620, easing: MORPH }
    );
  }, [view.sent, reduced]);

  const turn = turns[view.turn];

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="demo"
      aria-label="Product demo"
      className={`relative flex flex-col overflow-hidden rounded-[22px] border border-border bg-background ${className}`}
      style={{ height }}
      {...props}
    >
      {/* What the demo shows, for people who can't watch it; the moving copy is hidden from them. */}
      <p className="sr-only">
        {turn ? `A looping demo. Someone asks: “${turn.prompt}”, and the assistant works through it and answers.` : ""}
      </p>

      {header && <div className="flex h-11 shrink-0 items-center border-b border-border px-4 pr-12 text-[13px] font-medium text-foreground">{header}</div>}

      <button
        type="button"
        aria-label={userPaused ? "Play demo" : "Pause demo"}
        aria-pressed={userPaused}
        onClick={() => setUserPaused((p) => !p)}
        className={`cursor-pointer absolute right-2.5 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-background text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:text-foreground ${FOCUS}`}
      >
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(!userPaused, reduced)}>
          <Pause className="size-3" fill="currentColor" strokeWidth={0} />
        </span>
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(userPaused, reduced)}>
          <Play className="size-3 translate-x-px" fill="currentColor" strokeWidth={0} />
        </span>
      </button>

      <div aria-hidden="true" inert className="flex min-h-0 flex-1 flex-col">
        {/* The conversation sits on the composer and grows upwards; older lines fade out at the top. */}
        <div className="relative min-h-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_56px)]">
          <div
            key={view.turn}
            className="absolute inset-x-0 bottom-0 flex flex-col gap-4 px-4 pb-4 sm:px-5"
            style={{
              opacity: view.leaving ? 0 : 1,
              filter: view.leaving ? "blur(6px)" : "none",
              transform: view.leaving ? "translateY(-12px)" : "none",
              transition: reduced ? "none" : `opacity 480ms ${MORPH}, filter 480ms ${MORPH}, transform 520ms ${MORPH}`,
            }}
          >
            {view.sent && (
              // Not wrapped in Arrive: its own glide out of the composer is the entrance.
              <div className="flex justify-end">
                <div ref={bubbleRef} className="max-w-[85%] whitespace-pre-wrap rounded-[20px] bg-muted px-4 py-2.5 text-[14px] leading-relaxed text-foreground">
                  {view.sent}
                </div>
              </div>
            )}
            {view.blocks.map((b) => (
              <Arrive key={b.id} reduced={reduced}>
                {b.type === "thinking" ? (
                  <ThinkingTrace
                    variant={b.variant}
                    status={b.status}
                    label={b.label}
                    startedAt={reduced ? undefined : b.startedAt}
                    steps={b.labels.map((label) => ({ label }))}
                  />
                ) : b.type === "search" ? (
                  <WebResearch status={b.status} queries={b.queries} sources={b.sources} />
                ) : b.type === "tool" ? (
                  <ToolCall
                    name={b.step.name}
                    title={b.step.title}
                    icon={b.step.icon}
                    status={b.status}
                    input={b.input}
                    output={b.status === "done" ? b.step.output : undefined}
                    renderOutput={b.step.renderOutput}
                    duration={b.step.duration ?? 1300}
                    defaultOpen={b.step.open ?? true}
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <StreamingText content={b.content} status={b.status} className="text-[14px]" />
                    <div
                      className="grid"
                      style={{
                        gridTemplateRows: b.status === "done" ? "1fr" : "0fr",
                        opacity: b.status === "done" ? 1 : 0,
                        transition: reduced ? "none" : `grid-template-rows 420ms ${MORPH}, opacity 360ms ${MORPH} 120ms`,
                      }}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <AnswerActions copyText="" sources={b.sources} />
                      </div>
                    </div>
                  </div>
                )}
              </Arrive>
            ))}
          </div>
        </div>

        <div ref={composerRef} className="shrink-0 px-3 pb-3">
          <PromptComposer value={view.draft} status={view.composer} placeholder={placeholder} onSubmit={() => {}} onStop={() => {}} />
        </div>
      </div>
    </div>
  );
}
