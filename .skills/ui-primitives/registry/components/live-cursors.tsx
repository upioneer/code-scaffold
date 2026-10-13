// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Live cursors (live-cursors)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";

/* ─────────────────────────────────────────────────────────
 * LIVE CURSORS: other people, moving in the same place
 *
 *   move      positions arrive whenever your realtime layer sends
 *             them (ten a second is plenty); each cursor eases
 *             toward the latest on a spring, so it glides instead
 *             of stepping
 *   name      a pill hangs off each cursor with its colour; near
 *             the right or bottom edge it swings to the other side
 *             so it stays inside
 *   say       a message grows the pill into a bubble (one surface,
 *             size and corners easing together) and folds it back
 *             when it's cleared
 *   click     a Tactile ring ripples out from the tip
 *   select    the box someone is working on gets a 1px outline in
 *             their colour that glides to whatever they pick next
 *   idle      after a while without moving, the name folds into
 *             the dot and the cursor dims; it comes back the moment
 *             they move
 *   you       with onMessage, press / and a bubble opens at your
 *             own pointer; Enter sends it, Escape closes it
 * ───────────────────────────────────────────────────────── */

export interface LiveCursorBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LiveCursor {
  id: string;
  name: string;
  /** Position from 0 to 1 across and down the area. */
  x: number;
  y: number;
  /** Any CSS colour; people take the chart colours in order by default. */
  color?: string;
  /** What they're saying right now; clear it to fold the bubble. */
  message?: string;
  /** Raise it by one for each click to show a ripple. */
  clicks?: number;
  /** The box they're working on, in the same 0–1 units. */
  selection?: LiveCursorBox | null;
}

export interface LiveCursorsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  cursors: LiveCursor[];
  children?: React.ReactNode;
  /** Milliseconds without moving before a cursor folds its name away. */
  idleAfter?: number;
  /** Your pointer over the area, 0–1, or null when it leaves; send it to the others. */
  onCursorMove?: (point: { x: number; y: number } | null) => void;
  /** Turns on "/" to say something at your pointer; called with what you send. */
  onMessage?: (text: string) => void;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

const finePointer = "(pointer: fine)";
const subscribeFine = (onChange: () => void) => {
  const query = window.matchMedia(finePointer);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useFinePointer = () => React.useSyncExternalStore(subscribeFine, () => window.matchMedia(finePointer).matches, () => false);

const editable = (el: Element | null) =>
  !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement).isContentEditable);

/** A box that eases to the size of what's inside it, so a pill can grow into a bubble. */
function Shape({ children, className, style, reduced }: { children: React.ReactNode; className: string; style?: React.CSSProperties; reduced: boolean }) {
  const inner = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);
  React.useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        ...style,
        width: size?.w,
        height: size?.h,
        transition: reduced || !size ? "none" : `width 360ms ${EASE}, height 360ms ${EASE}, opacity 240ms`,
      }}
    >
      <div ref={inner} className="w-max">
        {children}
      </div>
    </div>
  );
}

/** A Tactile ring rippling out from a cursor's tip; it removes itself when done. */
function Ripple({ color, onDone }: { color: string; onDone: () => void }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const done = React.useRef(onDone);
  done.current = onDone;
  React.useEffect(() => {
    const animation = ref.current?.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0.9 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
      ],
      { duration: 620, easing: EASE, fill: "forwards" },
    );
    if (!animation) return done.current();
    animation.onfinish = () => done.current();
    return () => animation.cancel();
  }, []);
  return <span ref={ref} className="absolute left-0 top-0 size-9 rounded-full border" style={{ borderColor: color }} />;
}

/** A message that blurs in when it changes. */
function Said({ text }: { text: string }) {
  const ref = React.useRef<HTMLParagraphElement>(null);
  React.useEffect(() => {
    ref.current?.animate([{ opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0px)" }], { duration: 300, delay: 120, easing: EASE, fill: "backwards" });
  }, [text]);
  return (
    <p ref={ref} className="mt-0.5 max-w-[200px] whitespace-normal text-[12px] leading-snug text-foreground">
      {text}
    </p>
  );
}

export function LiveCursors({
  cursors,
  children,
  idleAfter = 8000,
  onCursorMove,
  onMessage,
  className = "",
  ...props
}: LiveCursorsProps) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const els = React.useRef(new Map<string, HTMLDivElement>());
  const sim = React.useRef(new Map<string, { x: number; y: number; vx: number; vy: number }>());
  const targets = React.useRef(new Map<string, { x: number; y: number }>());
  const area = React.useRef({ w: 0, h: 0 });
  const frame = React.useRef(0);
  const reducedRef = React.useRef(reduced);
  reducedRef.current = reduced;

  // Colour follows the person: each new id takes the next colour and keeps it.
  const slots = React.useRef(new Map<string, number>());
  const colorOf = (c: LiveCursor) => {
    if (c.color) return c.color;
    if (!slots.current.has(c.id)) slots.current.set(c.id, slots.current.size);
    return PALETTE[slots.current.get(c.id)! % PALETTE.length];
  };

  // People who just left stay a moment to fade out.
  const [leaving, setLeaving] = React.useState<LiveCursor[]>([]);
  const previous = React.useRef<LiveCursor[]>([]);
  const timers = React.useRef(new Set<number>());
  React.useEffect(() => {
    const now = new Set(cursors.map((c) => c.id));
    const gone = previous.current.filter((c) => !now.has(c.id));
    previous.current = cursors;
    if (!gone.length) return;
    setLeaving((l) => [...l.filter((c) => !now.has(c.id)), ...gone]);
    // Not cleared when cursors update again (they do, ten times a second); only on unmount.
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      setLeaving((l) => l.filter((c) => !gone.some((g) => g.id === c.id)));
      gone.forEach((g) => {
        if (previous.current.some((c) => c.id === g.id)) return; // they came back
        sim.current.delete(g.id);
        targets.current.delete(g.id);
      });
    }, 320);
    timers.current.add(timer);
  }, [cursors]);
  React.useEffect(() => {
    const all = timers.current;
    return () => all.forEach((t) => window.clearTimeout(t));
  }, []);

  // One loop moves every cursor toward its target on a spring, writing transforms directly.
  const kick = React.useCallback(() => {
    if (frame.current) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let busy = false;
      for (const [id, t] of targets.current) {
        const tx = t.x * area.current.w;
        const ty = t.y * area.current.h;
        let s = sim.current.get(id);
        if (!s) sim.current.set(id, (s = { x: tx, y: ty, vx: 0, vy: 0 }));
        if (reducedRef.current) Object.assign(s, { x: tx, y: ty, vx: 0, vy: 0 });
        else {
          s.vx += (150 * (tx - s.x) - 24 * s.vx) * dt;
          s.vy += (150 * (ty - s.y) - 24 * s.vy) * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          if (Math.abs(tx - s.x) + Math.abs(ty - s.y) > 0.3 || Math.abs(s.vx) + Math.abs(s.vy) > 2) busy = true;
          else Object.assign(s, { x: tx, y: ty, vx: 0, vy: 0 });
        }
        const el = els.current.get(id);
        if (el) el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      }
      frame.current = busy ? requestAnimationFrame(loop) : 0;
    };
    frame.current = requestAnimationFrame(loop);
  }, []);
  React.useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0; // so a remount can start the loop again
    },
    [],
  );

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      area.current = { w: root.clientWidth, h: root.clientHeight };
      kick();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [kick]);

  // New targets; somebody new appears where they are rather than flying in from a corner.
  const moved = React.useRef(new Map<string, number>());
  React.useLayoutEffect(() => {
    const now = Date.now();
    for (const c of cursors) {
      const t = targets.current.get(c.id);
      if (!t || t.x !== c.x || t.y !== c.y) moved.current.set(c.id, now);
      targets.current.set(c.id, { x: c.x, y: c.y });
      if (!sim.current.has(c.id)) {
        const s = { x: c.x * area.current.w, y: c.y * area.current.h, vx: 0, vy: 0 };
        sim.current.set(c.id, s);
        const el = els.current.get(c.id);
        if (el) el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      }
    }
    kick();
  }, [cursors, kick]);

  // Idle: fold the name away after a while without moving.
  const [away, setAway] = React.useState<Set<string>>(() => new Set());
  React.useEffect(() => {
    const check = () => {
      const now = Date.now();
      const next = new Set(cursors.filter((c) => now - (moved.current.get(c.id) ?? now) > idleAfter && !c.message).map((c) => c.id));
      setAway((a) => (a.size === next.size && [...next].every((id) => a.has(id)) ? a : next));
    };
    check();
    const timer = window.setInterval(check, 1000);
    return () => window.clearInterval(timer);
  }, [cursors, idleAfter]);

  // Clicks ripple from the tip.
  const [ripples, setRipples] = React.useState<{ id: string; key: number }[]>([]);
  const clicks = React.useRef(new Map<string, number>());
  React.useEffect(() => {
    const fresh: { id: string; key: number }[] = [];
    for (const c of cursors) {
      const seen = clicks.current.get(c.id);
      if (seen !== undefined && (c.clicks ?? 0) > seen) fresh.push({ id: c.id, key: Math.random() });
      clicks.current.set(c.id, c.clicks ?? 0);
    }
    if (fresh.length && !reduced) setRipples((r) => [...r, ...fresh]);
  }, [cursors, reduced]);

  // Messages are announced politely, once each.
  const [announce, setAnnounce] = React.useState("");
  const said = React.useRef(new Map<string, string>());
  React.useEffect(() => {
    for (const c of cursors) {
      if (c.message && said.current.get(c.id) !== c.message) setAnnounce(`${c.name}: ${c.message}`);
      said.current.set(c.id, c.message ?? "");
    }
  }, [cursors]);

  // You: your pointer goes out through onCursorMove, and "/" opens a bubble that follows it.
  const pointer = React.useRef<{ x: number; y: number } | null>(null);
  const selfRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [chat, setChat] = React.useState<{ open: boolean; text: string; sent: string }>({ open: false, text: "", sent: "" });
  const chatting = chat.open || Boolean(chat.sent);
  const place = () => {
    const p = pointer.current;
    if (p && selfRef.current) selfRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
  };
  React.useEffect(() => {
    if (!onMessage || !fine) return;
    // Caught on the way down, and only while the pointer is over the area, so a page's own "/" shortcut
    // (search, usually) still works everywhere else.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || !pointer.current || chat.open || editable(document.activeElement)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setChat({ open: true, text: "", sent: "" });
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onMessage, fine, chat.open]);
  React.useLayoutEffect(() => {
    place();
    if (chat.open) inputRef.current?.focus({ preventScroll: true });
  }, [chat.open]);
  React.useEffect(() => {
    if (!chat.sent) return;
    const timer = window.setTimeout(() => setChat((c) => ({ ...c, sent: "" })), 4000);
    return () => window.clearTimeout(timer);
  }, [chat.sent]);

  const all = [...cursors.map((c) => ({ c, gone: false })), ...leaving.filter((l) => !cursors.some((c) => c.id === l.id)).map((c) => ({ c, gone: true }))];

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top };
        place();
        onCursorMove?.({ x: pointer.current.x / r.width, y: pointer.current.y / r.height });
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        pointer.current = null;
        onCursorMove?.(null);
      }}
      {...props}
    >
      {children}

      {/* What others have selected: a Tactile box that glides to their next pick. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {all.map(({ c, gone }) =>
          c.selection ? (
            <div
              key={`sel-${c.id}`}
              className="absolute rounded-[6px] border"
              style={{
                left: `${c.selection.x * 100}%`,
                top: `${c.selection.y * 100}%`,
                width: `${c.selection.width * 100}%`,
                height: `${c.selection.height * 100}%`,
                borderColor: colorOf(c),
                opacity: gone ? 0 : 1,
                transition: reduced ? "none" : `left 420ms ${EASE}, top 420ms ${EASE}, width 420ms ${EASE}, height 420ms ${EASE}, opacity 240ms`,
              }}
            >
              <span
                className="absolute left-2 top-0 flex -translate-y-1/2 items-center gap-1 rounded-full border bg-popover px-1.5 text-[10.5px] font-medium leading-4 text-foreground"
                style={{ borderColor: colorOf(c) }}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: colorOf(c) }} />
                {c.name}
              </span>
            </div>
          ) : null,
        )}
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {all.map(({ c, gone }) => {
          const color = colorOf(c);
          const left = c.x > 0.72;
          const up = c.y > 0.82;
          const folded = away.has(c.id) && !gone;
          return (
            <div
              key={c.id}
              ref={(el) => {
                if (!el) return void els.current.delete(c.id);
                els.current.set(c.id, el);
                const s = sim.current.get(c.id);
                if (s) el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
              }}
              className="absolute left-0 top-0 will-change-transform"
            >
              <div
                style={{
                  opacity: gone ? 0 : folded ? 0.55 : 1,
                  transform: gone ? "scale(0.6)" : "none",
                  transformOrigin: "0 0",
                  transition: reduced ? "none" : `opacity 260ms ${EASE}, transform 260ms ${EASE}`,
                }}
              >
                {ripples
                  .filter((r) => r.id === c.id)
                  .map((r) => (
                    <Ripple key={r.key} color={color} onDone={() => setRipples((all) => all.filter((x) => x.key !== r.key))} />
                  ))}
                <svg width="18" height="18" viewBox="0 0 18 18" className="absolute -left-px -top-px overflow-visible">
                  <path d="M1.5 1.5 L15 7.6 L8.9 9.3 L6.4 15.6 Z" fill={color} stroke="var(--background)" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                {/* The name pill: swings to the other side near an edge, grows into a bubble to say something. */}
                <div
                  className="absolute"
                  style={{
                    left: left ? -4 : 12,
                    top: up ? -8 : 18,
                    transform: `translate(${left ? "-100%" : "0"}, ${up ? "-100%" : "0"})`,
                    transition: reduced ? "none" : `left 300ms ${EASE}, top 300ms ${EASE}, transform 300ms ${EASE}`,
                  }}
                >
                  <Shape
                    reduced={reduced}
                    className="border bg-popover"
                    style={{ borderColor: color, borderRadius: 12 }}
                  >
                    <div className={c.message ? "px-2.5 py-1.5" : "px-1.5 py-[3px]"}>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        {!folded && <span className="pr-0.5 text-[11.5px] font-medium leading-4 text-foreground">{c.name}</span>}
                      </div>
                      {c.message && !gone && <Said text={c.message} />}
                    </div>
                  </Shape>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {onMessage && fine && (
        <div ref={selfRef} className="pointer-events-none absolute left-0 top-0 z-10" aria-hidden={!chatting}>
          <div
            className="absolute left-4 top-5"
            style={{
              opacity: chatting ? 1 : 0,
              transform: chatting ? "none" : "scale(0.8)",
              transformOrigin: "0 0",
              transition: reduced ? "none" : `opacity 200ms ${EASE}, transform 260ms ${EASE}`,
            }}
          >
            <Shape reduced={reduced} className="rounded-[12px] border border-border bg-popover">
              <div className="px-2.5 py-1.5">
                {chat.open ? (
                  <input
                    ref={inputRef}
                    value={chat.text}
                    aria-label="Say something"
                    placeholder="Say something"
                    maxLength={120}
                    onChange={(e) => setChat((c) => ({ ...c, text: e.target.value }))}
                    onBlur={() => setChat((c) => (c.open ? { open: false, text: "", sent: "" } : c))}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setChat({ open: false, text: "", sent: "" });
                      if (e.key !== "Enter") return;
                      const text = chat.text.trim();
                      setChat({ open: false, text: "", sent: text });
                      if (text) onMessage(text);
                    }}
                    className="pointer-events-auto bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
                    style={{ width: `${Math.min(28, Math.max(12, chat.text.length + 1))}ch` }}
                  />
                ) : (
                  <p className="max-w-[220px] text-[12.5px] leading-snug text-foreground">{chat.sent}</p>
                )}
              </div>
            </Shape>
          </div>
        </div>
      )}

      <p className="sr-only" role="status">
        {announce}
      </p>
    </div>
  );
}
