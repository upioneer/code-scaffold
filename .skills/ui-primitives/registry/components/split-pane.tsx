// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Split pane (split-pane)
// Pure React and Web Animations API · Zero External Styling Dependencies

'use client';

/* ─────────────────────────────────────────────────────────
 * SPLIT PANE: desktop-grade resizable dual surface
 *
 *   divider    1px Tactile border with a centered grab pill;
 *              hover expands the line to an active primary accent
 *   drag       zero-lag direct DOM updates; dragging beyond
 *              min/max limits introduces logarithmic rubber-band
 *              resistance
 *   spring     releasing past boundary limits triggers an
 *              analytical WAAPI damped harmonic spring back
 *              to the boundary threshold
 *   snapping   double-clicking the divider smoothly cycles
 *              between 50%, 25%, and 75% preset layouts
 *   collapse   built-in controls fold either pane to 0 width,
 *              docking the Tactile divider flush to the edge
 *
 * Fully accessible separator semantics with keyboard step.
 * ───────────────────────────────────────────────────────── */

import * as React from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { INTERACTION_FOCUS, useInteractionReducedMotion } from './ui-interaction-motion';
import { useSplitPane } from './use-split-pane';

export interface SplitPaneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  first: React.ReactNode;
  second: React.ReactNode;
  split?: number;
  defaultSplit?: number;
  minSize?: number;
  maxSize?: number;
  orientation?: 'horizontal' | 'vertical';
  collapsible?: boolean;
  disabled?: boolean;
  onSplitChange?: (split: number) => void;
  onSplitCommit?: (split: number) => void;
}

export function SplitPane({
  first,
  second,
  split,
  defaultSplit = 50,
  minSize = 15,
  maxSize = 85,
  orientation = 'horizontal',
  collapsible = true,
  disabled = false,
  onSplitChange,
  onSplitCommit,
  className = '',
  ...props
}: SplitPaneProps) {
  const reduced = useInteractionReducedMotion();
  const isHorizontal = orientation !== 'vertical';

  const pane = useSplitPane({
    orientation,
    split,
    defaultSplit,
    minSize,
    maxSize,
    disabled,
    reduced,
    onChange: onSplitChange,
    onCommit: onSplitCommit,
  });

  return (
    <div
      {...props}
      ref={pane.containerRef}
      className={`relative flex select-none overflow-hidden rounded-[14px] border border-border bg-background shadow-[0_0_0_1px_var(--border)] ${
        isHorizontal ? 'flex-row' : 'flex-col'
      } ${className}`}
    >
      {/* First Pane */}
      <div
        ref={pane.firstPaneRef}
        className={`relative min-h-0 min-w-0 overflow-hidden ${
          pane.collapsed === 'first' ? 'pointer-events-none' : ''
        }`}
        style={{ flexBasis: `${defaultSplit}%` }}
      >
        <div className="size-full overflow-auto">{first}</div>
      </div>

      {/* 1px Tactile Divider & Grab Handle */}
      <div className={`relative z-10 shrink-0 ${isHorizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'}`}>
        {/* Full Tactile Line */}
        <div className={`absolute inset-0 bg-border transition-colors ${pane.dragging ? 'bg-primary' : 'hover:bg-primary/70'}`} />

        {/* Focusable and Draggable Touch Target Button */}
        <button
          ref={pane.dividerRef}
          {...pane.dividerProps}
          type="button"
          role="separator"
          disabled={disabled}
          aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
          aria-valuenow={Math.round(split ?? defaultSplit)}
          aria-valuemin={minSize}
          aria-valuemax={maxSize}
          aria-label="Resize split panes"
          className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background p-1 text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground active:scale-95 disabled:cursor-default disabled:opacity-40 ${
            isHorizontal ? 'left-1/2 top-1/2 h-8 w-4' : 'left-1/2 top-1/2 h-4 w-8'
          } ${INTERACTION_FOCUS}`}
        >
          <GripVertical className="size-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
        </button>

        {/* Optional Collapsible Controls */}
        {collapsible && !pane.dragging && (
          <div
            className={`absolute z-20 flex items-center gap-0.5 ${
              isHorizontal ? 'left-1/2 top-3 -translate-x-1/2 flex-col' : 'left-3 top-1/2 -translate-y-1/2 flex-row'
            }`}
          >
            {pane.collapsed === 'first' ? (
              <button
                type="button"
                onClick={pane.expand}
                title="Restore pane"
                className="cursor-pointer rounded-full border border-border bg-surface p-0.5 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <ChevronRight className="size-3" />
              </button>
            ) : pane.collapsed === 'second' ? (
              <button
                type="button"
                onClick={pane.expand}
                title="Restore pane"
                className="cursor-pointer rounded-full border border-border bg-surface p-0.5 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <ChevronLeft className="size-3" />
              </button>
            ) : (
              <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100">
                <button
                  type="button"
                  onClick={() => pane.collapse('first')}
                  title="Collapse left"
                  className="cursor-pointer rounded border border-border bg-surface p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="size-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => pane.collapse('second')}
                  title="Collapse right"
                  className="cursor-pointer rounded border border-border bg-surface p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="size-2.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Second Pane */}
      <div
        className={`relative min-h-0 min-w-0 flex-1 overflow-hidden ${
          pane.collapsed === 'second' ? 'pointer-events-none' : ''
        }`}
      >
        <div className="size-full overflow-auto">{second}</div>
      </div>
    </div>
  );
}
