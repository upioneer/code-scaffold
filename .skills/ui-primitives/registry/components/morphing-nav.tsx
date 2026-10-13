// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Morphing nav (morphing-nav)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";

/* ─────────────────────────────────────────────────────────
 * MORPHING NAV: one dropdown that follows you along the menu
 *
 *   hover    a soft highlight slides under the item you point at
 *   open     a single panel drops in under the item, sized to its
 *            content
 *   move     going to another item, the same panel glides over
 *            and resizes to the new content while the content
 *            slides in from the side you moved toward
 *   close    leave the menu (or press Escape) and it fades away
 *
 * Items with content open the panel; items with only an href
 * are plain links. Arrow keys move between items; Enter or Down
 * opens one and moves into it.
 * ───────────────────────────────────────────────────────── */

export interface NavItem {
  id: string;
  label: string;
  /** A plain link. */
  href?: string;
  /** What the panel shows for this item; give it its own width. */
  content?: React.ReactNode;
}

export interface MorphingNavProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[];
  /** Space to keep from the screen edges. */
  collisionPadding?: number;
}

type Shown = { id: string; dir: number; key: number };

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const MORPH = 380;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/** A panel's content, sliding in from one side and out to the other. */
function Slide({ children, dir, leaving, reduced, measureRef }: { children: React.ReactNode; dir: number; leaving: boolean; reduced: boolean; measureRef?: React.Ref<HTMLDivElement> }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced || dir === 0) return;
    const shift = 28 * dir;
    const animation = leaving
      ? el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-shift}px)` }], { duration: MORPH * 0.7, easing: EASE, fill: "forwards" })
      : el.animate([{ opacity: 0, transform: `translateX(${shift}px)` }, { opacity: 1, transform: "none" }], { duration: MORPH, easing: EASE });
    return () => animation.cancel();
  }, [dir, leaving, reduced]);
  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (typeof measureRef === "function") measureRef(el);
        else if (measureRef) (measureRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      aria-hidden={leaving || undefined}
      inert={leaving}
      className={`absolute left-0 top-0 w-max max-w-[calc(100vw-32px)] ${leaving ? "pointer-events-none" : ""}`}
    >
      {children}
    </div>
  );
}

export function MorphingNav({ items, collisionPadding = 16, className = "", ...props }: MorphingNavProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const rootRef = React.useRef<HTMLElement>(null);
  const triggerRefs = React.useRef(new Map<string, HTMLElement>());
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef(0);
  const keyCounter = React.useRef(0);
  const viaKeyboard = React.useRef(false);

  const [open, setOpen] = React.useState<string | null>(null);
  const [shown, setShown] = React.useState<Shown | null>(null);
  const [leaving, setLeaving] = React.useState<Shown[]>([]);
  const [visible, setVisible] = React.useState(false);
  const [box, setBox] = React.useState({ left: 0, width: 0, height: 0, ready: false });
  const [hover, setHover] = React.useState<{ left: number; width: number } | null>(null);

  const index = (itemId: string | null) => items.findIndex((i) => i.id === itemId);

  const show = (itemId: string) => {
    window.clearTimeout(closeTimer.current);
    const item = items.find((i) => i.id === itemId);
    if (!item?.content) return;
    if (open === itemId) return;
    const dir = open ? Math.sign(index(itemId) - index(open)) : 0;
    if (shown && open) setLeaving((l) => [...l, { ...shown, dir }]);
    setShown({ id: itemId, dir, key: ++keyCounter.current });
    setOpen(itemId);
    setVisible(true);
  };

  const close = React.useCallback((delay = 0) => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpen(null);
      setVisible(false);
      setHover(null);
    }, delay);
  }, []);

  React.useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Once it has faded, forget the panel so the next open starts fresh.
  React.useEffect(() => {
    if (visible) return;
    const timer = window.setTimeout(
      () => {
        setShown(null);
        setLeaving([]);
        setBox((b) => ({ ...b, ready: false }));
      },
      reduced ? 0 : 220
    );
    return () => window.clearTimeout(timer);
  }, [visible, reduced]);

  React.useEffect(() => {
    if (!leaving.length) return;
    const timer = window.setTimeout(() => setLeaving([]), MORPH);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // Size and place the panel for the content now showing: under its item, inside the screen.
  React.useLayoutEffect(() => {
    const content = contentRef.current;
    const root = rootRef.current;
    const trigger = open ? triggerRefs.current.get(open) : null;
    if (!content || !root || !trigger) return;
    const measure = () => {
      const r = root.getBoundingClientRect();
      const t = trigger.getBoundingClientRect();
      const width = content.offsetWidth;
      const height = content.offsetHeight;
      const viewport = document.documentElement.clientWidth;
      const center = t.left + t.width / 2;
      const left = Math.min(Math.max(center - width / 2, collisionPadding), viewport - collisionPadding - width) - r.left;
      setBox((b) => (b.left === left && b.width === width && b.height === height && b.ready ? b : { left, width, height, ready: b.width > 0 }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [open, shown?.key, collisionPadding]);

  // Opened from the keyboard: move focus into the panel.
  React.useEffect(() => {
    if (!open || !viaKeyboard.current) return;
    viaKeyboard.current = false;
    const first = panelRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])");
    first?.focus();
  }, [open, shown?.key]);

  // Escape closes and hands focus back; clicking elsewhere closes.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      triggerRefs.current.get(open)?.focus();
      close();
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, close]);

  const point = (itemId: string) => {
    const el = triggerRefs.current.get(itemId);
    if (el) setHover({ left: el.offsetLeft, width: el.offsetWidth });
  };

  const onTriggerKey = (e: React.KeyboardEvent, item: NavItem) => {
    const i = index(item.id);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = items[(i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length];
      triggerRefs.current.get(next.id)?.focus();
      if (open && next.content) show(next.id);
    } else if (item.content && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      viaKeyboard.current = true;
      if (open === item.id) {
        const first = panelRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled])");
        first?.focus();
      } else show(item.id);
    }
  };

  const content = shown ? items.find((i) => i.id === shown.id)?.content : null;
  const size = reduced || !box.ready ? "none" : `left ${MORPH}ms ${EASE}, width ${MORPH}ms ${EASE}, height ${MORPH}ms ${EASE}`;

  return (
    <nav
      ref={rootRef}
      aria-label="Main"
      className={`relative ${className}`}
      onPointerEnter={() => window.clearTimeout(closeTimer.current)}
      onPointerLeave={(e) => e.pointerType === "mouse" && close(140)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) close();
      }}
      {...props}
    >
      <ul className="relative flex items-center gap-0.5">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{
            width: hover?.width ?? 0,
            transform: `translateX(${hover?.left ?? 0}px)`,
            opacity: hover ? 1 : 0,
            transition: reduced ? "none" : `transform 300ms ${EASE}, width 300ms ${EASE}, opacity 200ms ease-out`,
          }}
        />
        {items.map((item) => {
          const isOpen = open === item.id;
          const common = {
            ref: (el: HTMLElement | null) => {
              if (el) triggerRefs.current.set(item.id, el);
              else triggerRefs.current.delete(item.id);
            },
            onPointerEnter: (e: React.PointerEvent) => {
              point(item.id);
              if (e.pointerType === "mouse") {
                if (item.content) show(item.id);
                else if (open) close(140);
              }
            },
            onFocus: () => point(item.id),
            className: `relative flex h-9 cursor-pointer items-center gap-1 rounded-full px-3.5 text-[13.5px] transition-colors duration-200 ${FOCUS} ${
              isOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`,
          };
          return (
            <li key={item.id}>
              {item.content ? (
                <button
                  {...common}
                  ref={common.ref}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? `${id}-panel` : undefined}
                  onClick={() => (isOpen ? close() : show(item.id))}
                  onKeyDown={(e) => onTriggerKey(e, item)}
                >
                  {item.label}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 12 12"
                    className="size-3 opacity-60"
                    style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: reduced ? "none" : `transform 300ms ${EASE}` }}
                  >
                    <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <a {...common} ref={common.ref} href={item.href} onKeyDown={(e) => onTriggerKey(e, item)}>
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ul>

      {shown && (
        <div
          ref={panelRef}
          id={`${id}-panel`}
          className="absolute top-full z-50 mt-2 overflow-hidden rounded-[20px] border border-border bg-popover text-popover-foreground animate-[ui-pop-in_240ms_cubic-bezier(0.16,1,0.3,1)_backwards] motion-reduce:animate-none"
          style={{
            left: box.left,
            width: box.width + 2,
            height: box.height + 2,
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(-4px) scale(0.98)",
            transformOrigin: "top center",
            transition: reduced ? "none" : `${size === "none" ? "" : `${size}, `}opacity 200ms ease-out, transform 260ms ${EASE}`,
          }}
        >
          {leaving.map((l) => (
            <Slide key={l.key} dir={l.dir} leaving reduced={reduced}>
              {items.find((i) => i.id === l.id)?.content}
            </Slide>
          ))}
          <Slide key={shown.key} dir={shown.dir} leaving={false} reduced={reduced} measureRef={contentRef}>
            {content}
          </Slide>
        </div>
      )}
    </nav>
  );
}
