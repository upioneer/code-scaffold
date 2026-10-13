// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Drop zone (drop-zone)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

/* ─────────────────────────────────────────────────────────
 * DROP ZONE: the border reaches for the file
 *
 *   armed     drag files anywhere over the page and the line
 *             breathes out a pixel and takes the accent
 *   reach     bring them near and the nearest stretch of line
 *             bends out to meet them; the arrow turns to watch.
 *             Close to the edge the bulge reaches past the
 *             file, so it is held before it crosses
 *   over      inside, the line lets go with a wobble, the zone
 *             swells, and the label says what you're holding
 *   drop      the border gulps and rings out from the drop
 *             point; each file leaves as a chip, drags the line
 *             with it until it slips off, and lands as its row
 *   upload    the row's own Tactile fills with progress, the
 *             percent rolls, a ring closes and draws a check
 *   refuse    a type the zone can't take makes the line recoil
 *             and turns it red; a refused drop is pushed back
 *             out where it landed, and the label says why
 *
 * The zone is a real button: Enter or Space browses, paste
 * works while it has focus, and every result is announced.
 * Your own drags (a file from a sidebar, say) drive it too,
 * through the handle: drag, cancel, drop.
 * ───────────────────────────────────────────────────────── */

import * as React from 'react';
import { ArrowUp, CircleAlert, File as FileIcon, FileImage, FileText, RotateCcw, X } from 'lucide-react';
import { NumberRoll } from './number-roll';
import { TextMorph } from './text-morph';
import { EASE_OUT, INTERACTION_FOCUS, interactionIcon, useInteractionReducedMotion } from './ui-interaction-motion';
import { useMembrane } from './use-membrane';

export type DropZoneStatus = 'uploading' | 'done' | 'error';

export interface DropZoneFile {
  id: string;
  file: File;
  status: DropZoneStatus;
  /** 0 to 1. */
  progress: number;
  error?: string;
}

export type DropZoneUpload = (file: File, context: { progress: (fraction: number) => void; signal: AbortSignal }) => void | Promise<void>;

export interface DropZoneHandle {
  /** Something your app is dragging (not a file from the system) is at these client coordinates. Returns whether a drop there would land. */
  drag: (clientX: number, clientY: number, types?: string[]) => boolean;
  /** Your drag ended without a drop. */
  cancel: () => void;
  /** Drop files as if from the system, at client coordinates or the zone's centre. */
  drop: (files: File[], at?: { x: number; y: number }) => void;
  /** Open the file picker. */
  browse: () => void;
}

export interface DropZoneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop' | 'title'> {
  /** Uploads one file: report progress, honour the signal, resolve when done or throw to show an error with Retry. */
  onUpload?: DropZoneUpload;
  /** The files currently in the list, after every add and remove. */
  onFilesChange?: (files: File[]) => void;
  /** Like an input's accept: MIME types, wildcards and extensions, e.g. "image/*,.pdf". */
  accept?: string;
  /** Largest file in bytes. */
  maxSize?: number;
  maxFiles?: number;
  /** One file at a time: a new drop replaces it. */
  multiple?: boolean;
  /** The resting label. */
  title?: string;
  /** Under the label, e.g. "PNG, JPG or PDF, up to 10 MB". */
  hint?: string;
  disabled?: boolean;
  ref?: React.Ref<DropZoneHandle>;
}

type Row = DropZoneFile & { landed: boolean; closing: boolean };
type Flight = { id: string; name: string; type: string; x: number; y: number; delay: number };
type Drag = { count: number; ok: boolean; held: boolean };

const RADIUS = 18;
const HOLD = 16; // a file this close outside the zone is already held by the bulge, and drops into it
const FLIGHT = 640;

const matchRule = (rule: string, type: string, name: string) =>
  rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule;
const rulesOf = (accept?: string) => (accept ?? '').split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
const EXTENSIONS: Record<string, string> = {
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.avif': 'image/avif', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.csv': 'text/csv', '.md': 'text/markdown', '.json': 'application/json',
  '.zip': 'application/zip', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
};
/** During a drag only the type is known, and sometimes not even that: refuse only what surely can't match. */
const mightAccept = (rules: string[], type: string) => {
  if (!rules.length || !type) return true;
  const t = type.toLowerCase();
  return rules.some((r) => (r.startsWith('.') ? !EXTENSIONS[r] || EXTENSIONS[r] === t : matchRule(r, t, '')));
};
const accepts = (rules: string[], file: File) => !rules.length || rules.some((r) => matchRule(r, file.type.toLowerCase(), file.name.toLowerCase()));

export const formatBytes = (n: number) =>
  n < 1000 ? `${n} B` : n < 1e6 ? `${Math.round(n / 1000)} KB` : `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)} MB`;

const onlyLabel = (hint?: string) => (hint ? `Only ${/^.[a-z]/.test(hint) ? hint[0].toLowerCase() + hint.slice(1) : hint}` : undefined);
const iconFor = (type: string) => (type.startsWith('image/') ? FileImage : type === 'application/pdf' || type.startsWith('text/') ? FileText : FileIcon);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
let counter = 0;

export function DropZone({
  onUpload,
  onFilesChange,
  accept,
  maxSize,
  maxFiles,
  multiple = true,
  title = 'Drop files here',
  hint,
  disabled = false,
  ref,
  className = '',
  ...props
}: DropZoneProps) {
  const reduced = useInteractionReducedMotion();
  const hintId = React.useId();
  const membrane = useMembrane({ radius: RADIUS, reduced });
  const rules = React.useMemo(() => rulesOf(accept), [accept]);
  const root = React.useRef<HTMLDivElement>(null);
  const zone = React.useRef<HTMLButtonElement | null>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const [drag, setDrag] = React.useState<Drag | null>(null);
  const [notice, setNotice] = React.useState<{ text: string; error: boolean } | null>(null);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [flights, setFlights] = React.useState<Flight[]>([]);
  const [said, setSaid] = React.useState('');
  const held = React.useRef(false);
  const rowsRef = React.useRef(rows);
  rowsRef.current = rows;
  const controllers = React.useRef(new Map<string, AbortController>());
  const timers = React.useRef(new Set<ReturnType<typeof setTimeout>>());
  const noticeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const upload = React.useRef(onUpload);
  upload.current = onUpload;

  const later = React.useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn(); }, ms);
    timers.current.add(t);
  }, []);
  React.useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    controllers.current.forEach((c) => c.abort());
  }, []);

  const tell = React.useCallback((text: string, error: boolean) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ text, error });
    noticeTimer.current = setTimeout(() => setNotice(null), error ? 2800 : 1800);
  }, []);

  const local = (clientX: number, clientY: number) => {
    const r = zone.current?.getBoundingClientRect();
    return r ? { x: clientX - r.left, y: clientY - r.top, w: r.width, h: r.height } : { x: 0, y: 0, w: 0, h: 0 };
  };

  // Follow a drag: bend the line, decide whether the file is held, and update the label only when that changes.
  const track = React.useCallback((clientX: number, clientY: number, types: string[]) => {
    if (disabled) return false;
    const p = local(clientX, clientY);
    const outside = Math.hypot(Math.max(-p.x, 0, p.x - p.w), Math.max(-p.y, 0, p.y - p.h));
    const ok = !types.length || types.some((t) => mightAccept(rules, t));
    const isHeld = outside < HOLD;
    held.current = isHeld;
    membrane.set('pointer', { x: p.x, y: p.y, kind: ok ? 'reach' : 'recoil' });
    membrane.swell(isHeld ? (ok ? 3 : -2) : 1.5);
    setDrag((d) => (d && d.count === types.length && d.ok === ok && d.held === isHeld ? d : { count: types.length, ok, held: isHeld }));
    return isHeld;
  }, [disabled, rules, membrane]);

  const release = React.useCallback(() => {
    held.current = false;
    membrane.set('pointer', null);
    membrane.swell(0);
    setDrag(null);
  }, [membrane]);

  const start = React.useCallback((id: string, file: File) => {
    const run = upload.current;
    const patch = (next: Partial<Row>) => setRows((list) => list.map((r) => (r.id === id ? { ...r, ...next } : r)));
    if (!run) return patch({ status: 'done', progress: 1 });
    const controller = new AbortController();
    controllers.current.set(id, controller);
    patch({ status: 'uploading', progress: 0, error: undefined });
    let last = 0;
    const progress = (f: number) => {
      const v = Math.max(0, Math.min(1, Number.isFinite(f) ? f : 0));
      if (controller.signal.aborted || Math.abs(v - last) < 0.005) return;
      last = v;
      patch({ progress: v });
    };
    Promise.resolve()
      .then(() => run(file, { progress, signal: controller.signal }))
      .then(
        () => {
          if (controller.signal.aborted) return;
          patch({ status: 'done', progress: 1 });
          setSaid(`${file.name} uploaded`);
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          const message = error instanceof Error && error.message ? error.message : 'Upload failed';
          patch({ status: 'error', error: message });
          setSaid(`${file.name} failed to upload. ${message}`);
        },
      )
      .finally(() => controllers.current.delete(id));
  }, []);

  const remove = React.useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    setRows((list) => list.map((r) => (r.id === id ? { ...r, closing: true } : r)));
    later(() => setRows((list) => list.filter((r) => r.id !== id)), reduced ? 0 : 420);
  }, [later, reduced]);

  // Files arrive at a point in the zone's coordinates: the accepted ones leave as chips toward their rows.
  const take = React.useCallback((files: File[], at: { x: number; y: number }) => {
    if (disabled || !files.length) return;
    const current = rowsRef.current.filter((r) => !r.closing);
    const room = multiple ? (maxFiles ?? Infinity) - current.length : 1;
    const accepted: File[] = [];
    const refused: string[] = [];
    for (const file of multiple ? files : files.slice(0, 1)) {
      if (!accepts(rules, file)) refused.push(onlyLabel(hint) ?? `${file.name} isn't accepted`);
      else if (maxSize !== undefined && file.size > maxSize) refused.push(`${file.name} is over ${formatBytes(maxSize)}`);
      else if (accepted.length >= room) refused.push(`Up to ${maxFiles} files`);
      else accepted.push(file);
    }
    if (!multiple && files.length > 1) refused.push('One file at a time');
    if (!accepted.length) {
      membrane.spit(at.x, at.y);
      tell(refused[0] ?? 'Nothing to add', true);
      setSaid(refused.join('. '));
      return;
    }
    membrane.gulp(at.x, at.y);
    if (!multiple) current.forEach((r) => remove(r.id));
    const zr = zone.current?.getBoundingClientRect(), rr = root.current?.getBoundingClientRect();
    const ox = zr && rr ? zr.left - rr.left : 0, oy = zr && rr ? zr.top - rr.top : 0;
    const added: Row[] = accepted.map((file) => ({ id: `f${++counter}`, file, status: 'uploading', progress: 0, landed: reduced, closing: false }));
    setRows((list) => [...list, ...added]);
    if (!reduced) setFlights((list) => [...list, ...added.map((r, i) => ({ id: r.id, name: r.file.name, type: r.file.type, x: at.x + ox, y: at.y + oy, delay: i * 80 }))]);
    added.forEach((r) => start(r.id, r.file));
    const summary = accepted.length === 1 ? `Added ${accepted[0].name}` : `Added ${accepted.length} files`;
    tell(refused.length ? (refused.length === 1 ? refused[0] : `${refused.length} files skipped`) : summary, refused.length > 0);
    setSaid([summary, ...refused].join('. '));
  }, [disabled, multiple, maxFiles, maxSize, rules, hint, membrane, tell, remove, start, reduced]);

  const centre = () => {
    const el = zone.current;
    return { x: (el?.offsetWidth ?? 0) / 2, y: (el?.offsetHeight ?? 0) / 2 };
  };

  // Files dragged in from the system: watch the whole window so the line can reach out before the file arrives.
  React.useEffect(() => {
    if (disabled) return;
    let quiet: ReturnType<typeof setTimeout> | null = null;
    const end = () => {
      if (quiet) clearTimeout(quiet);
      release();
    };
    const over = (e: DragEvent) => {
      const data = e.dataTransfer;
      if (!data || !Array.from(data.types).includes('Files')) return;
      // dragover repeats while a drag is over the page; silence means it left.
      if (quiet) clearTimeout(quiet);
      quiet = setTimeout(end, 400);
      const types = Array.from(data.items).filter((i) => i.kind === 'file').map((i) => i.type);
      if (track(e.clientX, e.clientY, types)) {
        e.preventDefault();
        data.dropEffect = 'copy';
      }
    };
    const leave = (e: DragEvent) => {
      if (!e.relatedTarget && (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) end();
    };
    const drop = (e: DragEvent) => {
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (held.current && files.length) {
        e.preventDefault();
        const p = local(e.clientX, e.clientY);
        take(files, { x: Math.max(0, Math.min(p.w, p.x)), y: Math.max(0, Math.min(p.h, p.y)) });
      }
      end();
    };
    window.addEventListener('dragenter', over);
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    window.addEventListener('dragend', end);
    return () => {
      if (quiet) clearTimeout(quiet);
      window.removeEventListener('dragenter', over);
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
      window.removeEventListener('dragend', end);
    };
  }, [disabled, track, release, take]);

  React.useImperativeHandle(ref, () => ({
    drag: (x, y, types = []) => track(x, y, types),
    cancel: release,
    drop: (files, at) => {
      const p = at ? local(at.x, at.y) : { ...centre(), w: 0, h: 0 };
      release();
      take(files, { x: p.x, y: p.y });
    },
    browse: () => input.current?.click(),
  }), [track, release, take]);

  const live = rows.filter((r) => !r.closing);
  const liveKey = live.map((r) => r.id).join();
  const report = React.useRef(onFilesChange);
  report.current = onFilesChange;
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    report.current?.(rowsRef.current.filter((r) => !r.closing).map((r) => r.file));
  }, [liveKey]);

  const land = React.useCallback((id: string) => {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, landed: true } : r)));
    later(() => setFlights((list) => list.filter((f) => f.id !== id)), 200);
  }, [later]);

  const refusing = drag ? !drag.ok : notice?.error ?? false;
  const label = drag
    ? !drag.ok
      ? onlyLabel(hint) ?? "This type can't be added"
      : drag.held
        ? drag.count > 1 ? `Release to add ${drag.count}` : 'Release to add'
        : drag.count > 1 ? `Drop ${drag.count} files here` : 'Drop it here'
    : notice?.text ?? title;
  const icon: 'arrow' | 'refuse' | 'added' = refusing ? 'refuse' : notice && !notice.error ? 'added' : 'arrow';
  const tone = refusing ? 'refuse' : drag?.held ? 'over' : drag ? 'armed' : 'rest';
  const colors = {
    rest: { stroke: 'var(--border)', fill: 'color-mix(in oklab, var(--muted) 45%, transparent)' },
    armed: { stroke: 'color-mix(in oklab, var(--primary) 55%, var(--border))', fill: 'color-mix(in oklab, var(--primary) 3%, var(--background))' },
    over: { stroke: 'var(--primary)', fill: 'color-mix(in oklab, var(--primary) 7%, var(--background))' },
    refuse: { stroke: 'var(--destructive, #dc2626)', fill: 'color-mix(in oklab, var(--destructive, #dc2626) 5%, var(--background))' },
  }[tone];

  return (
    <div ref={root} className={`@container relative w-full text-foreground ${className}`} {...props}>
      <button
        ref={(el) => { zone.current = el; membrane.attach(el); }}
        type="button"
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        onClick={() => input.current?.click()}
        onPaste={(e) => {
          const files = Array.from(e.clipboardData.files);
          if (!files.length) return;
          e.preventDefault();
          take(files, centre());
        }}
        className={`relative flex h-[152px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] px-5 text-center disabled:cursor-default disabled:opacity-55 @md:h-[176px] ${INTERACTION_FOCUS}`}
      >
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <path ref={membrane.path} strokeWidth={1} style={{ ...colors, transition: reduced ? 'none' : `stroke 280ms ${EASE_OUT}, fill 360ms ${EASE_OUT}` }} />
        </svg>
        <span
          aria-hidden="true"
          className="relative flex size-9 items-center justify-center rounded-full border bg-background transition-colors duration-300"
          style={{ borderColor: tone === 'rest' ? 'var(--border)' : colors.stroke, color: tone === 'refuse' ? colors.stroke : tone === 'rest' ? 'var(--muted-foreground)' : 'var(--primary)' }}
        >
          <span ref={membrane.arrow} className="absolute inset-0 flex items-center justify-center will-change-transform" style={interactionIcon(icon === 'arrow', reduced)}>
            <ArrowUp className="size-4" strokeWidth={1.75} />
          </span>
          <span className="absolute inset-0 flex items-center justify-center" style={interactionIcon(icon === 'refuse', reduced)}>
            <X className="size-4" strokeWidth={1.75} />
          </span>
          <span className="absolute inset-0 flex items-center justify-center" style={interactionIcon(icon === 'added', reduced)}>
            <DrawnCheck on={icon === 'added'} reduced={reduced} />
          </span>
        </span>
        <span className="relative flex flex-col items-center gap-1">
          <span className={`whitespace-nowrap text-[13.5px] font-medium tracking-[-0.01em] transition-colors duration-300 ${refusing ? 'text-red-600 dark:text-red-400' : ''}`}>
            <TextMorph>{label}</TextMorph>
          </span>
          {hint && (
            <span id={hintId} className="text-balance text-[12px] text-muted-foreground">
              <span className="whitespace-nowrap"><span className="text-foreground underline decoration-border underline-offset-[3px]">Browse</span> or paste ·</span> {hint}
            </span>
          )}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        hidden
        multiple={multiple}
        accept={accept}
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = '';
          take(files, centre());
        }}
      />

      {rows.length > 0 && (
        <ul aria-label="Files" className="mt-3">
          {rows.map((r) => (
            <FileRow key={r.id} row={r} reduced={reduced} onRemove={() => remove(r.id)} onRetry={() => start(r.id, r.file)} />
          ))}
        </ul>
      )}

      {flights.map((f) => (
        <Chip key={f.id} flight={f} root={root} zone={zone} membrane={membrane} onLand={land} landed={rows.find((r) => r.id === f.id)?.landed ?? true} />
      ))}

      <p role="status" className="sr-only">{said}</p>
    </div>
  );
}

/** A file in flight: from where it was dropped, down through the border, onto its row. */
function Chip({ flight, root, zone, membrane, onLand, landed }: {
  flight: Flight;
  root: React.RefObject<HTMLDivElement | null>;
  zone: React.RefObject<HTMLButtonElement | null>;
  membrane: ReturnType<typeof useMembrane>;
  onLand: (id: string) => void;
  landed: boolean;
}) {
  const el = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const chip = el.current, base = root.current;
    if (!chip || !base) return;
    const w = chip.offsetWidth, h = chip.offsetHeight;
    const begin = performance.now() + flight.delay;
    let frame = 0;
    const step = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - begin) / FLIGHT));
      const lead = base.querySelector<HTMLElement>(`[data-file="${flight.id}"] [data-lead]`);
      const br = base.getBoundingClientRect();
      const lr = lead?.getBoundingClientRect();
      const tx = lr ? lr.left - br.left - 10 : flight.x - w / 2;
      const ty = lr ? lr.top - br.top + lr.height / 2 - h / 2 : flight.y - h / 2;
      const sx = flight.x - w / 2, sy = flight.y - h / 2;
      const e = ease(t);
      const x = sx + (tx - sx) * e, y = sy + (ty - sy) * e;
      chip.style.transform = `translate3d(${x}px,${y}px,0)`;
      const zr = zone.current?.getBoundingClientRect();
      if (zr) membrane.set(flight.id, { x: x + w / 2 - (zr.left - br.left), y: y + h / 2 - (zr.top - br.top), kind: 'carry', spread: w / 3 });
      if (t < 1) frame = requestAnimationFrame(step);
      else {
        membrane.set(flight.id, null);
        onLand(flight.id);
      }
    };
    chip.style.transform = `translate3d(${flight.x - w / 2}px,${flight.y - h / 2}px,0)`;
    chip.animate([{ opacity: 0, scale: '0.9' }, { opacity: 1, scale: '1' }], { duration: 180, easing: EASE_OUT });
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      membrane.set(flight.id, null);
    };
    // One flight per chip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const Icon = iconFor(flight.type);
  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-10 flex h-8 max-w-[220px] items-center gap-2.5 rounded-full px-2.5 text-[13px] will-change-transform"
      style={{
        opacity: landed ? 0 : 1,
        background: landed ? 'transparent' : 'var(--background)',
        boxShadow: landed ? 'inset 0 0 0 1px transparent' : 'inset 0 0 0 1px var(--border)',
        transition: `opacity 200ms ${EASE_OUT}, background-color 160ms ${EASE_OUT}, box-shadow 160ms ${EASE_OUT}`,
      }}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      <span className="truncate">{flight.name}</span>
    </div>
  );
}

function FileRow({ row, reduced, onRemove, onRetry }: { row: Row; reduced: boolean; onRemove: () => void; onRetry: () => void }) {
  const [open, setOpen] = React.useState(reduced);
  React.useEffect(() => {
    if (open) return;
    let b = 0;
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setOpen(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [open]);
  const shown = open && !row.closing;
  const Icon = iconFor(row.file.type);
  const pct = Math.round(row.progress * 100);
  const { status } = row;
  const swap = reduced ? 'none' : `opacity 200ms ${EASE_OUT}`;
  return (
    <li
      data-file={row.id}
      className="grid"
      style={{
        gridTemplateRows: shown ? '1fr' : '0fr',
        opacity: shown ? 1 : 0,
        transition: reduced ? 'none' : `grid-template-rows 420ms ${EASE_OUT}, opacity ${row.closing ? 180 : 320}ms ${EASE_OUT}`,
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="relative flex h-11 items-center gap-3">
          <span data-lead className="flex min-w-0 items-center gap-2.5 text-[13px]" style={{ opacity: row.landed ? 1 : 0, transition: swap }}>
            <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{row.file.name}</span>
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-2 text-[12px] tabular-nums text-muted-foreground" style={{ opacity: row.landed ? 1 : 0, transition: swap }}>
            <span className={`whitespace-nowrap ${status === 'error' ? 'text-red-600 dark:text-red-400' : ''}`}>
              {status === 'error' ? (
                <TextMorph>Failed</TextMorph>
              ) : (
                <>
                  {formatBytes(row.file.size)}
                  <span className="inline-grid transition-[grid-template-columns,opacity] duration-300" style={{ gridTemplateColumns: status === 'uploading' ? '1fr' : '0fr', opacity: status === 'uploading' ? 1 : 0 }}>
                    <span className="min-w-0 overflow-hidden whitespace-nowrap [clip-path:inset(-4px_-2px)]">
                      <span className="px-1">·</span>
                      <NumberRoll value={pct} suffix="%" duration={600} />
                    </span>
                  </span>
                </>
              )}
            </span>
            <StatusMark status={status} progress={row.progress} reduced={reduced} />
            {status === 'error' && (
              <button type="button" onClick={onRetry} aria-label={`Retry ${row.file.name}`} className={`flex size-6 cursor-pointer items-center justify-center rounded-full text-foreground hover:bg-muted ${INTERACTION_FOCUS}`}>
                <RotateCcw className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            )}
            <button type="button" onClick={onRemove} aria-label={status === 'uploading' ? `Cancel ${row.file.name}` : `Remove ${row.file.name}`} className={`flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-muted hover:text-foreground ${INTERACTION_FOCUS}`}>
              <X className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </span>
          {/* The row's own Tactile is its progress bar. */}
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-border" />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px origin-left"
            style={{
              background: status === 'error' ? 'var(--destructive, #dc2626)' : 'var(--primary)',
              transform: `scaleX(${status === 'error' ? 1 : row.progress})`,
              opacity: status === 'done' ? 0 : row.landed ? 1 : 0,
              transition: reduced ? 'none' : `transform 520ms ${EASE_OUT}, opacity ${status === 'done' ? 700 : 200}ms ${EASE_OUT} ${status === 'done' ? 300 : 0}ms, background-color 200ms`,
            }}
          />
        </div>
      </div>
    </li>
  );
}

/** A ring that closes with progress, then gives way to a check that draws itself; an alert for errors. */
function StatusMark({ status, progress, reduced }: { status: DropZoneStatus; progress: number; reduced: boolean }) {
  return (
    <span aria-hidden="true" className="relative size-4 shrink-0">
      <svg viewBox="0 0 16 16" className="absolute inset-0 size-4 -rotate-90" style={interactionIcon(status === 'uploading', reduced)}>
        <circle cx="8" cy="8" r="6" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <circle
          cx="8" cy="8" r="6" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" pathLength={1}
          strokeDasharray="1" strokeDashoffset={1 - progress}
          style={{ transition: reduced ? 'none' : `stroke-dashoffset 520ms ${EASE_OUT}` }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-primary" style={interactionIcon(status === 'done', reduced)}>
        <DrawnCheck on={status === 'done'} reduced={reduced} />
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-red-600 dark:text-red-400" style={interactionIcon(status === 'error', reduced)}>
        <CircleAlert className="size-4" strokeWidth={1.75} />
      </span>
    </span>
  );
}

function DrawnCheck({ on, reduced }: { on: boolean; reduced: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M3.5 8.5l3 3 6-7"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={on ? 0 : 1}
        style={{ transition: reduced ? 'none' : `stroke-dashoffset ${on ? 420 : 0}ms ${EASE_OUT} ${on ? 120 : 0}ms` }}
      />
    </svg>
  );
}
