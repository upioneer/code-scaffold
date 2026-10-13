// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Response versions (response-versions)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { NumberRoll } from "./number-roll";

/* ─────────────────────────────────────────────────────────
 * RESPONSE VERSIONS: "2 / 3" between regenerated answers
 *
 *   browsing      the arrows step between versions: the answer
 *                 you leave slides out one way through a blur, the
 *                 next comes in from the other side, the height
 *                 eases between them and "2 / 3" rolls
 *   regenerating  the regenerate arrow blurs into a spinner until
 *                 the new version arrives; the count rolls up
 *
 * Wrap the current version's content.
 * ───────────────────────────────────────────────────────── */

export interface ResponseVersionsProps extends React.HTMLAttributes<HTMLDivElement> {
  count: number;
  /** Zero-based index of the version shown. */
  index: number;
  onIndexChange: (index: number) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  /** The current version's content. */
  children: React.ReactNode;
}

type Leaving = { key: string; node: React.ReactNode; dir: number };

const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const ICON = `cursor-pointer disabled:cursor-default relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-35 ${FOCUS}`;

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

/** The version you stepped away from: it leaves toward the side you came from, then removes itself. */
function LeavingPane({ item, onDone }: { item: Leaving; onDone: (key: string) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const animation = el.animate(
      [
        { opacity: 1, filter: "blur(0px)", transform: "none" },
        { opacity: 0, filter: "blur(6px)", transform: `translateX(${-item.dir * 24}px)` },
      ],
      { duration: 260, easing: MORPH, fill: "forwards" }
    );
    animation.onfinish = () => onDone(item.key);
    return () => animation.cancel();
  }, [item, onDone]);
  return (
    <div ref={ref} inert aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0">
      {item.node}
    </div>
  );
}

export function ResponseVersions({ count, index, onIndexChange, onRegenerate, regenerating = false, children, className = "", ...props }: ResponseVersionsProps) {
  const reduced = useReducedMotion();
  const boxRef = React.useRef<HTMLDivElement>(null);
  const paneRef = React.useRef<HTMLDivElement>(null);
  const latest = React.useRef<React.ReactNode>(children);
  const height = React.useRef(0);

  // A step: what was showing (as it last rendered) leaves, and the new version comes in from the side you stepped toward.
  const [shownIndex, setShownIndex] = React.useState(index);
  const [leaving, setLeaving] = React.useState<Leaving[]>([]);
  const [dir, setDir] = React.useState(0);
  if (shownIndex !== index) {
    const d = index > shownIndex ? 1 : -1;
    setShownIndex(index);
    setDir(reduced ? 0 : d);
    if (!reduced) setLeaving((l) => [...l, { key: `${shownIndex}>${index}`, node: latest.current, dir: d }]);
  }
  const done = React.useCallback((key: string) => setLeaving((l) => l.filter((x) => x.key !== key)), []);

  React.useLayoutEffect(() => {
    if (!dir) return;
    const pane = paneRef.current;
    const box = boxRef.current;
    pane?.animate(
      [
        { opacity: 0, filter: "blur(6px)", transform: `translateX(${dir * 24}px)` },
        { opacity: 1, filter: "blur(0px)", transform: "none" },
      ],
      { duration: 420, easing: MORPH, delay: 60, fill: "backwards" }
    );
    // The box eases from the old answer's height to the new one's.
    if (box && height.current && Math.abs(box.offsetHeight - height.current) > 1) {
      box.style.overflow = "hidden";
      const resize = box.animate([{ height: `${height.current}px` }, { height: `${box.offsetHeight}px` }], { duration: 420, easing: MORPH });
      resize.onfinish = resize.oncancel = () => {
        box.style.overflow = "";
      };
    }
  }, [index, dir]);

  // Remember what this render showed and how tall it was, for the next step.
  React.useLayoutEffect(() => {
    latest.current = children;
    if (boxRef.current) height.current = boxRef.current.offsetHeight;
  });

  return (
    <div className={className} {...props}>
      <div ref={boxRef} className={`relative ${leaving.length ? "overflow-hidden" : ""}`}>
        {leaving.map((l) => (
          <LeavingPane key={l.key} item={l} onDone={done} />
        ))}
        <div key={index} ref={paneRef}>
          {children}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1">
        <button type="button" aria-label="Previous version" disabled={index <= 0} onClick={() => onIndexChange(index - 1)} className={ICON}>
          <ChevronLeft className="size-4" />
        </button>
        <span aria-live="polite" className="flex min-w-[3.25rem] justify-center gap-[0.5ch] font-mono text-[11.5px] tabular-nums text-muted-foreground">
          <span className="sr-only">Version </span>
          <NumberRoll value={index + 1} duration={600} />
          <span aria-hidden="true">/</span>
          <span className="sr-only">of</span>
          <NumberRoll value={count} duration={600} />
        </span>
        <button type="button" aria-label="Next version" disabled={index >= count - 1} onClick={() => onIndexChange(index + 1)} className={ICON}>
          <ChevronRight className="size-4" />
        </button>
        {onRegenerate && (
          <button type="button" aria-label={regenerating ? "Regenerating" : "Regenerate"} disabled={regenerating} onClick={onRegenerate} className={`cursor-pointer disabled:cursor-default ${ICON} ml-1`}>
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(!regenerating, reduced)}>
              <RotateCcw className="size-3.5" />
            </span>
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(regenerating, reduced)}>
              <span className={`size-3.5 rounded-full border-[1.5px] border-border border-t-foreground/70 motion-reduce:animate-none ${regenerating ? "animate-spin" : ""}`} />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
