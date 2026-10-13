// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Radial menu (radial-menu)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

import * as React from 'react';
import { EASE_OUT, EASE_SETTLE, INTERACTION_FOCUS, useInteractionReducedMotion } from './ui-interaction-motion';
import { useRadialMenu } from './use-radial-menu';

export type RadialMenuItem = { id: string; label: string; icon: React.ReactNode; disabled?: boolean };
export interface RadialMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  items: RadialMenuItem[]; label?: string; open?: boolean; defaultOpen?: boolean; disabled?: boolean;
  onOpenChange?: (open: boolean) => void; onSelect: (id: string) => void;
}

/** Commands unfold from their source into a clockwise ring; the closed menu has no focusable hidden items. */
export function RadialMenu({ items, label = 'Insert', open: controlled, defaultOpen = false, disabled = false, onOpenChange, onSelect, className = '', ...props }: RadialMenuProps) {
  const reduced = useInteractionReducedMotion();
  const [own, setOwn] = React.useState(defaultOpen);
  const open = !disabled && (controlled ?? own);
  const change = (next: boolean) => { if (controlled === undefined) setOwn(next); onOpenChange?.(next); };
  const enabled = items.flatMap((item, index) => item.disabled ? [] : [index]);
  const menu = useRadialMenu(items.length, enabled, open, change);
  const id = React.useId();
  return <div {...props} ref={menu.root} className={`relative h-[284px] w-full text-foreground ${className}`}
    onKeyDown={(event) => { if (event.key === 'Escape' && open) { event.preventDefault(); menu.close(); } }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) menu.close(false); }}>
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-border" style={{ width: menu.radius * 2, height: menu.radius * 2, marginLeft: -menu.radius, marginTop: -menu.radius, opacity: open ? 1 : 0, transform: open || reduced ? 'none' : 'scale(0.35)', transition: reduced ? 'none' : `transform 480ms ${EASE_OUT}, opacity 220ms ${EASE_OUT}` }} />
    <div id={id} role="menu" aria-label={label} aria-hidden={!open} inert={!open}>
      {items.map((item, index) => {
        const point = menu.point(index), delay = open ? index * 24 : 0;
        return <React.Fragment key={item.id}>
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-px origin-left bg-border" style={{ width: menu.radius - 22, transform: `rotate(${point.angle}deg) scaleX(${open ? 1 : 0})`, opacity: open ? 1 : 0, transition: reduced ? 'none' : `transform 400ms ${EASE_OUT} ${delay}ms, opacity 160ms ${EASE_OUT}` }} />
          <button ref={(element) => { if (element) menu.buttons.current.set(index, element); else menu.buttons.current.delete(index); }} type="button" role="menuitem" disabled={item.disabled} tabIndex={open && index === enabled[0] ? 0 : -1}
            onFocus={(event) => menu.buttons.current.forEach((button) => { button.tabIndex = button === event.currentTarget ? 0 : -1; })}
            onKeyDown={(event) => menu.navigate(event, index)} onClick={() => { menu.close(); onSelect(item.id); }}
            className={`absolute left-1/2 top-1/2 -ml-5 -mt-5 flex size-10 cursor-pointer items-center justify-center rounded-[14px] border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:cursor-default disabled:opacity-30 [&>svg]:size-[18px] ${INTERACTION_FOCUS}`}
            style={{ opacity: open ? 1 : 0, transform: open ? `translate3d(${point.x}px,${point.y}px,0) scale(1)` : reduced ? 'none' : 'translate3d(0,0,0) scale(0.5)', transition: reduced ? 'none' : `transform 460ms ${EASE_SETTLE} ${delay}ms, opacity ${open ? 240 : 120}ms ${EASE_OUT} ${delay}ms, background-color 180ms, color 180ms`, willChange: open ? 'transform' : undefined }}>
            <span aria-hidden="true" className="flex [&>svg]:size-[18px]">{item.icon}</span>
            <span className="pointer-events-none absolute top-full mt-2 rounded-full bg-background px-1.5 text-[10px] font-medium leading-4 whitespace-nowrap">{item.label}</span>
          </button>
        </React.Fragment>;
      })}
    </div>
    <button ref={menu.trigger} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={id} disabled={disabled || !enabled.length}
      onClick={() => change(!open)} onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); change(true); } }}
      className={`absolute left-1/2 top-1/2 -ml-6 -mt-6 flex size-12 cursor-pointer items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground disabled:cursor-default disabled:opacity-40 ${INTERACTION_FOCUS}`}>
      <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" style={{ transform: open ? 'rotate(135deg)' : 'rotate(0deg)', transition: reduced ? 'none' : `transform 420ms ${EASE_SETTLE}` }}><path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    </button>
  </div>;
}
