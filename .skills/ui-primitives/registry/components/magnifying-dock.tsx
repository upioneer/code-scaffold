// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Magnifying dock (magnifying-dock)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

/* ─────────────────────────────────────────────────────────
 * MAGNIFYING DOCK: a dock that opens its tools in place
 *
 *   lens     tools near the pointer grow and the row parts around
 *            them; the tray widens with them. Transforms only,
 *            eased in one frame loop that sleeps when it settles
 *   label    one name rides above the tool under the pointer,
 *            gliding from tool to tool while its letters morph
 *   select   a soft pad glides to the chosen tool and keeps
 *            riding its magnification
 *   open     a tool with content grows the dock itself up into
 *            its panel: the tray widens and rises, the title
 *            morphs, and switching tools slides the new panel in
 *            from the side you moved toward
 *   close    choose the open tool again, press Escape or click
 *            away, and the panel folds back into the tray
 *
 * Every tool is a real button in a toolbar: arrow keys move
 * between them, and keyboard focus magnifies like the pointer.
 * ───────────────────────────────────────────────────────── */

import * as React from 'react';
import { NumberRoll } from './number-roll';
import { TextMorph } from './text-morph';
import { EASE_OUT, INTERACTION_FOCUS, useInteractionReducedMotion } from './ui-interaction-motion';
import { useDockLens } from './use-dock-lens';

export interface DockItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** What the dock opens into when this tool is chosen. Without it, the tool only selects. */
  content?: React.ReactNode;
  /** The open panel's heading; defaults to label. */
  title?: string;
  /** A count on the icon, e.g. unread messages; 0 folds it away. */
  badge?: number;
  disabled?: boolean;
}

export interface MagnifyingDockProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: DockItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  label?: string;
  /** Rest size of a tool in px, 32–56. */
  size?: number;
  /** Peak scale under the pointer, 1–2. */
  magnification?: number;
  /** Width of the open panel in px; it never exceeds the space available. */
  panelWidth?: number;
}

const GAP = 6;
const INSET = 8;
const LABEL_ROOM = 34;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

function Pane({ dir, reduced, leaving, onDone, children }: { dir: number; reduced: boolean; leaving?: boolean; onDone?: () => void; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced || !dir) {
      if (leaving) onDone?.();
      return;
    }
    const frames = leaving
      ? [{ opacity: 1, transform: 'none', filter: 'blur(0px)' }, { opacity: 0, transform: `translateX(${-dir * 24}px)`, filter: 'blur(4px)' }]
      : [{ opacity: 0, transform: `translateX(${dir * 24}px)`, filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }];
    const animation = el.animate(frames, { duration: leaving ? 220 : 360, delay: leaving ? 0 : 40, easing: EASE_OUT, fill: leaving ? 'forwards' : 'backwards' });
    if (leaving) animation.onfinish = () => onDone?.();
    return () => animation.cancel();
    // Runs once per pane: each pane is keyed by its tool.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} inert={leaving} aria-hidden={leaving || undefined} className={leaving ? 'pointer-events-none absolute inset-x-0 top-0' : 'relative'}>
      {children}
    </div>
  );
}

export function MagnifyingDock({
  items,
  value,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = 'Tools',
  size = 40,
  magnification = 1.6,
  panelWidth = 340,
  className = '',
  ...props
}: MagnifyingDockProps) {
  const reduced = useInteractionReducedMotion();
  const S = clamp(size, 32, 56);
  const M = clamp(magnification, 1, 2);
  const id = React.useId();

  const [ownValue, setOwnValue] = React.useState(defaultValue ?? items.find((item) => !item.disabled)?.id);
  const selectedId = value ?? ownValue;
  const selected = Math.max(0, items.findIndex((item) => item.id === selectedId));
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen);
  const open = (openProp ?? ownOpen) && Boolean(items[selected]?.content);

  const [hovered, setHovered] = React.useState<number | null>(null);
  const lens = useDockLens({ count: items.length, size: S, gap: GAP, inset: INSET, magnification: M, reduced, onHover: setHovered });

  const root = React.useRef<HTMLDivElement>(null);
  const content = React.useRef<HTMLDivElement>(null);
  const [rootWidth, setRootWidth] = React.useState(0);
  const panelW = Math.max(200, Math.min(panelWidth, rootWidth ? rootWidth - 16 : panelWidth));

  // The panel shows the open tool; while folding away it keeps the last one.
  const [shown, setShown] = React.useState(selected);
  const [leaving, setLeaving] = React.useState<{ key: number; index: number; dir: number }[]>([]);
  const dir = React.useRef(0);
  const leaveKey = React.useRef(0);
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) setWasOpen(open);
  if (open && shown !== selected) {
    // Switching inside an open panel slides; opening on a different tool just shows it.
    dir.current = wasOpen ? Math.sign(selected - shown) : 0;
    if (wasOpen && !reduced) setLeaving((l) => [...l, { key: ++leaveKey.current, index: shown, dir: dir.current }]);
    setShown(selected);
  }

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  const choose = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    if (item.id !== selectedId) {
      if (value === undefined) setOwnValue(item.id);
      onValueChange?.(item.id);
    }
    if (!item.content) {
      if (open) setOpen(false);
      return;
    }
    if (!open) dir.current = 0;
    setOpen(!(open && item.id === selectedId));
  };

  React.useLayoutEffect(() => {
    lens.set({ selected, open, panelWidth: panelW });
  });

  // Sizes the open panel from its content, and the panel width from the space the dock has.
  React.useLayoutEffect(() => {
    const el = content.current;
    const box = root.current;
    if (!el || !box) return;
    const measure = () => {
      lens.set({ panelHeight: el.offsetHeight });
      setRootWidth((w) => (w === box.clientWidth ? w : box.clientWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(box);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click away to fold the panel.
  React.useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const enabled = items.map((item, index) => ({ item, index })).filter(({ item }) => !item.disabled);
  const onToolKey = (event: React.KeyboardEvent, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const at = enabled.findIndex((entry) => entry.index === index);
    const next = event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1) : enabled[(at + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length];
    if (next) lens.icons.current[next.index]?.focus({ preventScroll: true });
  };

  const band = S + 2 * INSET;
  const headroom = Math.ceil(S * (M - 1)) + LABEL_ROOM;
  const restWidth = items.length * S + Math.max(0, items.length - 1) * GAP + 2 * INSET;
  const shownItem = items[shown] ?? items[selected];
  const hoverItem = hovered !== null ? items[hovered] : undefined;

  return (
    <div
      ref={root}
      {...props}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          setOpen(false);
          lens.icons.current[selected]?.focus({ preventScroll: true });
        }
      }}
      className={`relative w-full text-foreground ${className}`}
      style={{ height: band + headroom, ...props.style }}
    >
      {/* The tray: one surface that widens with the lens and rises into the panel. */}
      <div
        ref={lens.surface}
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 border border-border bg-background"
        style={{ width: restWidth, height: band, borderRadius: band / 2 }}
      />

      <div
        ref={lens.row}
        role="toolbar"
        aria-label={label}
        onPointerMove={lens.pointer}
        onPointerLeave={lens.leave}
        className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 items-end"
        style={{ padding: INSET, paddingTop: INSET + (open ? 0 : Math.ceil(S * (M - 1))), gap: GAP }}
      >
        <div ref={lens.pad} aria-hidden="true" className="absolute left-0 origin-bottom rounded-[12px] bg-muted" style={{ bottom: INSET, width: S, height: S }} />

        {items.map((item, index) => {
          const isSelected = index === selected;
          const badge = Math.max(0, Math.round(item.badge ?? 0));
          return (
            <div key={item.id} className="relative shrink-0" style={{ width: S, height: S }}>
              <button
                ref={(el) => {
                  lens.icons.current[index] = el;
                }}
                type="button"
                aria-label={item.label}
                {...(item.content ? { 'aria-expanded': open && isSelected, 'aria-controls': `${id}-panel` } : { 'aria-pressed': isSelected })}
                disabled={item.disabled}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => choose(index)}
                onFocus={() => lens.set({ focus: index })}
                onBlur={() => lens.set({ focus: null })}
                onKeyDown={(event) => onToolKey(event, index)}
                className={`cursor-pointer disabled:cursor-default absolute inset-0 flex origin-bottom items-center justify-center rounded-[12px] transition-colors duration-200 disabled:opacity-35 ${
                  isSelected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                } ${INTERACTION_FOCUS}`}
              >
                <span aria-hidden="true" className="flex size-[50%] items-center justify-center [&>svg]:size-full [&>svg]:stroke-[1.75]">
                  {item.icon}
                </span>
                {item.badge !== undefined && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-medium tabular-nums text-primary-foreground"
                    style={{
                      opacity: badge ? 1 : 0,
                      transform: badge ? 'none' : 'scale(0.4)',
                      transition: reduced ? 'none' : `opacity 220ms ${EASE_OUT}, transform 380ms ${EASE_OUT}`,
                    }}
                  >
                    <NumberRoll value={badge} duration={700} />
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* One label, gliding between tools; its words morph as it moves. */}
        <div
          ref={lens.label}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 whitespace-nowrap rounded-full border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium text-foreground"
          style={{ bottom: band + 6, opacity: 0 }}
        >
          <TextMorph>{hoverItem?.label ?? ''}</TextMorph>
        </div>
      </div>

      <div
        ref={lens.panel}
        id={`${id}-panel`}
        role="region"
        aria-label={shownItem?.title ?? shownItem?.label}
        inert={!open}
        className="absolute left-1/2 -translate-x-1/2 overflow-hidden"
        style={{ bottom: band - 1, width: panelW, height: 0, opacity: 0, visibility: 'hidden' }}
      >
        <div ref={content} className="absolute bottom-0 left-1/2 -translate-x-1/2 px-4 pb-3.5 pt-4" style={{ width: panelW }}>
          <p className="text-[13px] font-medium text-foreground">
            <TextMorph>{shownItem?.title ?? shownItem?.label ?? ''}</TextMorph>
          </p>
          <div className="relative mt-3">
            {leaving.map((l) => (
              <Pane key={`out-${l.key}`} dir={l.dir} reduced={reduced} leaving onDone={() => setLeaving((all) => all.filter((x) => x.key !== l.key))}>
                {items[l.index]?.content}
              </Pane>
            ))}
            <Pane key={shownItem?.id} dir={dir.current} reduced={reduced}>
              {shownItem?.content}
            </Pane>
          </div>
        </div>
      </div>
    </div>
  );
}
