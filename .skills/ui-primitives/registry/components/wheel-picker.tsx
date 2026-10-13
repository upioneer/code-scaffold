// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Wheel picker (wheel-picker)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

/* ─────────────────────────────────────────────────────────
 * WHEEL PICKER: drums you can fling
 *
 *   drum      every column is a real cylinder: options sit on
 *             its faces and tip away into the dark as they
 *             leave the middle, one transform a frame
 *   lens      the middle row is a separate copy of the drum,
 *             clipped to the band, in full colour; a letter
 *             crossing the band's edge is half one, half the
 *             other, like glass over the wheel
 *   fling     drag and let go: the release speed is projected
 *             forward and the wheel decays onto a row, with a
 *             tick on phones for each row it passes; past the
 *             ends of a wheel that doesn't loop it stretches
 *   settle    the value is committed once the wheel rests, and
 *             a unit beside the lens morphs with it (1 hour,
 *             2 hours). Options that can't be chosen are dimmed
 *             and the wheel turns on past them
 *
 * Each wheel is a spinbutton: arrows step, Page Up and Down
 * jump five, Home and End go to the ends; a mouse notch moves
 * one row and taps on a row bring it to the middle.
 * ───────────────────────────────────────────────────────── */

import * as React from 'react';
import { TextMorph } from './text-morph';
import { useInteractionReducedMotion } from './ui-interaction-motion';
import { SLOTS, STEP, useWheelDrum } from './use-wheel-drum';

export type WheelValue = string | number;
export type WheelOption<T extends WheelValue = WheelValue> = T | { value: T; label?: string; disabled?: boolean };

export interface WheelPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Row height in px; the drum's radius follows from it. */
  itemHeight?: number;
  /** Ticks on phones that can vibrate, one per row. */
  haptics?: boolean;
  children: React.ReactNode;
}

export interface WheelProps<T extends WheelValue = WheelValue> {
  options: readonly WheelOption<T>[];
  value?: NoInfer<T>;
  defaultValue?: NoInfer<T>;
  onValueChange?: (value: NoInfer<T>) => void;
  /** Turn past the end back to the start, like minutes. */
  loop?: boolean;
  /** What the wheel sets, for screen readers: "Hours". */
  label: string;
  /** Fixed beside the lens: "min", or a function for "1 hour" / "2 hours". */
  unit?: string | ((value: NoInfer<T>) => string);
  /** Where the options sit in their column. */
  align?: 'start' | 'center' | 'end';
  className?: string;
  style?: React.CSSProperties;
}

const Ctx = React.createContext({ itemHeight: 36, haptics: true });
const PERSPECTIVE = 1000;

const valueOf = <T extends WheelValue>(o: WheelOption<T>) => (typeof o === 'object' ? o.value : o);
const labelOf = <T extends WheelValue>(o: WheelOption<T>) => (typeof o === 'object' ? (o.label ?? String(o.value)) : String(o));
const offOf = <T extends WheelValue>(o: WheelOption<T>) => typeof o === 'object' && Boolean(o.disabled);

export function WheelPicker({ itemHeight = 36, haptics = true, className = '', style, children, ...props }: WheelPickerProps) {
  const H = Math.max(28, Math.min(56, itemHeight));
  const radius = H / (2 * Math.tan((STEP / 2) * (Math.PI / 180)));
  const ctx = React.useMemo(() => ({ itemHeight: H, haptics }), [H, haptics]);
  return (
    <Ctx.Provider value={ctx}>
      <div role="group" className={`relative flex w-full select-none justify-center px-2 ${className}`} style={{ height: Math.round(radius * 2), ...style }} {...props}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-[11px] bg-muted" style={{ height: H }} />
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function Wheel<T extends WheelValue = WheelValue>({
  options,
  value,
  defaultValue,
  onValueChange,
  loop = false,
  label,
  unit,
  align = 'center',
  className = '',
  style,
}: WheelProps<T>) {
  const { itemHeight: H, haptics } = React.useContext(Ctx);
  const reduced = useInteractionReducedMotion();
  const count = options.length;
  const indexOf = (v: T | undefined) => Math.max(0, options.findIndex((o) => valueOf(o) === v));
  const [own, setOwn] = React.useState<T | undefined>(defaultValue ?? (count ? valueOf(options[0]) : undefined));
  const current = value !== undefined ? value : own;
  const index = indexOf(current);

  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  const report = React.useRef(onValueChange);
  report.current = onValueChange;
  const controlled = value !== undefined;
  const committed = React.useRef(index);

  const drum = useWheelDrum(index, {
    count,
    loop,
    itemHeight: H,
    reduced,
    haptics,
    label: (i) => labelOf(optionsRef.current[i]),
    disabled: (i) => offOf(optionsRef.current[i]),
    onRest: (i) => {
      if (i === committed.current) return;
      committed.current = i;
      const next = valueOf(optionsRef.current[i]);
      if (!controlled) setOwn(next);
      report.current?.(next);
    },
  });

  // The value changed from outside (another wheel clamped it, or the app set it): turn to it.
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (index === committed.current) return;
    committed.current = index;
    drum.turnTo(index, !reduced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Labels or disabled options changed: relabel the faces in place.
  const labels = options.map((o) => `${labelOf(o)}${offOf(o) ? '·' : ''}`).join('|');
  React.useEffect(() => { drum.repaint(); }, [labels]); // eslint-disable-line react-hooks/exhaustive-deps

  // Faces are labelled once here; the drum relabels them directly as it turns.
  const [faceText] = React.useState(() =>
    Array.from({ length: SLOTS }, (_, k) => {
      const i = k + SLOTS * Math.round((index - k) / SLOTS);
      const real = loop ? ((i % count) + count) % count : i;
      return count && (loop || (i >= 0 && i < count)) ? labelOf(options[real]) : '';
    }),
  );

  const unitOf = (v: T) => (typeof unit === 'function' ? unit(v) : (unit ?? ''));
  const unitText = current !== undefined && unit ? unitOf(current) : '';
  const widest = unit ? options.map((o) => unitOf(valueOf(o))).reduce((a, b) => (b.length > a.length ? b : a), '') : '';

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 };
    if (e.key in moves) {
      e.preventDefault();
      drum.nudge(moves[e.key]);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const to = e.key === 'Home' ? 0 : count - 1;
      drum.turnTo(to, !reduced);
    }
  };

  const justify = align === 'start' ? 'justify-start' : align === 'end' ? 'justify-end' : 'justify-center';
  const faceClass = `absolute inset-x-0 flex items-center whitespace-nowrap px-2.5 tabular-nums [backface-visibility:hidden] data-[off]:opacity-35 ${justify}`;
  const face = (k: number) => ({ top: -H / 2, height: H, transform: `rotateX(${-k * STEP}deg) translateZ(${drum.radius}px)` });
  const edge = `calc(50% - ${H / 2}px)`, edge2 = `calc(50% + ${H / 2}px)`;
  // The drum fades toward its rim and leaves a hole where the lens copy sits.
  const mask = `linear-gradient(to bottom, transparent 8%, #000 36%, #000 ${edge}, transparent ${edge}, transparent ${edge2}, #000 ${edge2}, #000 64%, transparent 92%)`;
  // The first frame's rotation; after that the drum writes its own transform, so React must never touch it.
  const [current3d] = React.useState(() => ({ transformStyle: 'preserve-3d' as const, transform: `translateZ(${-drum.radius}px) rotateX(${index * STEP}deg)` }));

  return (
    <div
      ref={drum.column}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={index}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, count - 1)}
      aria-valuetext={`${count ? labelOf(options[index]) : ''}${unitText ? ` ${unitText}` : ''}`}
      onKeyDown={onKeyDown}
      className={`group relative flex h-full min-w-0 flex-1 cursor-grab touch-none items-center outline-none active:cursor-grabbing ${className}`}
      style={style}
    >
      <div className="relative h-full min-w-0 flex-1 tracking-[-0.01em]" style={{ fontSize: Math.round(H * 0.56) }}>
        <div aria-hidden="true" className="absolute inset-0 text-muted-foreground" style={{ perspective: PERSPECTIVE, maskImage: mask, WebkitMaskImage: mask }}>
          <div ref={drum.drum} className="absolute inset-x-0 top-1/2 h-0 will-change-transform" style={current3d}>
            {faceText.map((t, k) => (
              <span key={k} ref={(el) => { drum.faces.current[k] = el; }} className={faceClass} style={face(k)}>{t}</span>
            ))}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden rounded-[11px] text-foreground group-focus-visible:ring-2 group-focus-visible:ring-ring/50"
          style={{ height: H, perspective: PERSPECTIVE }}
        >
          <div ref={drum.lens} className="absolute inset-x-0 top-1/2 h-0 will-change-transform" style={current3d}>
            {faceText.map((t, k) => (
              <span key={k} ref={(el) => { drum.lensFaces.current[k] = el; }} className={faceClass} style={face(k)}>{t}</span>
            ))}
          </div>
        </div>
      </div>
      {unit && (
        <span aria-hidden="true" className="relative grid shrink-0 pr-2.5 text-[14px] font-medium text-foreground">
          <span className="invisible col-start-1 row-start-1 whitespace-nowrap">{widest}</span>
          <span className="col-start-1 row-start-1 whitespace-nowrap"><TextMorph animateWidth={false}>{unitText}</TextMorph></span>
        </span>
      )}
    </div>
  );
}
