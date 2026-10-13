// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Agent composer (agent-composer)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { ArrowUp, Folder, Gauge, GitBranch, Hand, ListChecks, Mic, Plus, ShieldAlert, Square } from "lucide-react";
import { ModelPicker, type ModelOption } from "./model-picker";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * AGENT COMPOSER: the taller composer for agent surfaces
 *
 *   status      a tab hangs off the card's top edge with the
 *               branch, the project folder and how full the
 *               context is; each morphs when it changes, and the
 *               context ring fills, turning amber past 80%
 *   prompt      type; Enter sends, Shift+Enter adds a line, and
 *               the field grows with the text
 *   permission  the pill under the prompt says how much the agent
 *               may do on its own (Auto, Ask first, Plan only,
 *               Full access) and grows into a list with a line on
 *               each, clear of the composer
 *   model       the model pill on the right grows into its own
 *               list, with thinking effort for models that reason
 *   send        the arrow blurs into a spinner, then into Stop;
 *               the mic beside it breathes while it listens
 *   files       + opens the file picker, and paste and drop work
 *               too; chips fold open above the prompt
 *
 * status takes useChat's status as is.
 * ───────────────────────────────────────────────────────── */

export type AgentComposerStatus = "ready" | "submitted" | "streaming" | "error";

export interface AgentComposerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit: (value: string) => void;
  onStop?: () => void;
  /** Pass useChat's status straight through. */
  status?: AgentComposerStatus;
  placeholder?: string;
  /** The tab on top. Leave all three out and there's no tab. */
  branch?: string;
  folder?: string;
  context?: { used: number; limit: number };
  /** The permission modes; defaults to Auto, Ask first, Plan only and Full access. */
  permissions?: ModelOption[];
  permission?: string;
  defaultPermission?: string;
  onPermissionChange?: (id: string) => void;
  models: ModelOption[];
  model: string;
  onModelChange: (id: string) => void;
  effort?: string;
  onEffortChange?: (effort: string) => void;
  /** Enables +, paste and drop. */
  onFilesSelected?: (files: File[]) => void;
  accept?: string;
  /** Attachment chips, shown above the prompt. */
  attachments?: React.ReactNode;
  /** Shows the mic. */
  onVoice?: () => void;
  listening?: boolean;
}

export const AGENT_PERMISSIONS: ModelOption[] = [
  { id: "auto", name: "Auto", description: "Decides for itself, asks when it's unsure", icon: <Gauge /> },
  { id: "ask", name: "Ask first", description: "Checks with you before every change", icon: <Hand /> },
  { id: "plan", name: "Plan only", description: "Reads and plans, changes nothing", icon: <ListChecks /> },
  { id: "full", name: "Full access", description: "Runs everything without asking", icon: <ShieldAlert /> },
];

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const MORPH = "cubic-bezier(0.16,1,0.3,1)";
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

const swap = (on: boolean, reduced: boolean): React.CSSProperties => ({
  opacity: on ? 1 : 0,
  transform: on ? "none" : "scale(0.6)",
  filter: on ? "none" : "blur(3px)",
  transition: reduced ? "none" : `opacity 260ms ${MORPH}, transform 380ms ${MORPH}, filter 260ms ${MORPH}`,
});

function Fold({ show, reduced, children }: { show: boolean; reduced: boolean; children: React.ReactNode }) {
  const [last, setLast] = React.useState(children);
  if (show && children !== last) setLast(children);
  return (
    <div
      aria-hidden={!show || undefined}
      inert={!show}
      className="grid"
      style={{
        gridTemplateRows: show ? "1fr" : "0fr",
        opacity: show ? 1 : 0,
        transition: reduced ? "none" : `grid-template-rows 380ms ${MORPH}, opacity ${show ? "280ms" : "140ms"} ${MORPH}`,
      }}
    >
      <div className="min-h-0 overflow-hidden">{show ? children : last}</div>
    </div>
  );
}

/** How full the context is: a small ring that fills, amber past 80% and red past 95%, with the share rolling beside it. */
function ContextMeter({ used, limit, reduced }: { used: number; limit: number; reduced: boolean }) {
  const share = limit ? Math.min(1, used / limit) : 0;
  const c = 2 * Math.PI * 5;
  const tone = share >= 0.95 ? "text-red-500" : share >= 0.8 ? "text-amber-500" : "text-foreground/60";
  return (
    <span className="flex items-center gap-1.5" title={`${compactNumber.format(used)} of ${compactNumber.format(limit)} tokens`}>
      <svg viewBox="0 0 14 14" aria-hidden="true" className={`size-3.5 -rotate-90 transition-colors duration-300 ${tone}`}>
        <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
        <circle
          cx="7"
          cy="7"
          r="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: c * (1 - share), transition: reduced ? "none" : `stroke-dashoffset 600ms ${MORPH}` }}
        />
      </svg>
      <span className="tabular-nums">
        <NumberRoll value={share} format={{ style: "percent" }} duration={600} />
      </span>
      <span className="sr-only">of the context used</span>
    </span>
  );
}

export function AgentComposer({
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  onStop,
  status = "ready",
  placeholder = "What should we build?",
  branch,
  folder,
  context,
  permissions = AGENT_PERMISSIONS,
  permission,
  defaultPermission,
  onPermissionChange,
  models,
  model,
  onModelChange,
  effort,
  onEffortChange,
  onFilesSelected,
  accept,
  attachments,
  onVoice,
  listening = false,
  className = "",
  ...props
}: AgentComposerProps) {
  const reduced = useReducedMotion();
  const [own, setOwn] = React.useState(defaultValue);
  const [ownPermission, setOwnPermission] = React.useState(defaultPermission ?? permissions[0]?.id ?? "");
  const [dragging, setDragging] = React.useState(false);
  const text = value ?? own;
  const chosenPermission = permission ?? ownPermission;
  const cardRef = React.useRef<HTMLFormElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const canSend = !busy && text.trim().length > 0;
  const hasTab = Boolean(branch || folder || context);

  const setText = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  React.useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);

  const submit = () => {
    if (!canSend) return;
    onSubmit(text);
    if (value === undefined) setOwn("");
  };

  const takeFiles = (list: FileList | null) => {
    if (!list || list.length === 0 || !onFilesSelected) return false;
    onFilesSelected(Array.from(list));
    return true;
  };

  const action = busy ? (status === "streaming" && onStop ? "stop" : "wait") : "send";

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* The tab: where the agent is working, and how full its context is. */}
      {hasTab && (
        <div className="mx-3.5 flex h-7 items-center gap-3 rounded-t-[12px] bg-muted px-3 text-[11.5px] text-muted-foreground">
          {branch && (
            <span className="flex min-w-0 items-center gap-1.5">
              <GitBranch aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="sr-only">Branch</span>
              <span className="truncate">
                <TextMorph>{branch}</TextMorph>
              </span>
            </span>
          )}
          {folder && (
            <span className="flex min-w-0 items-center gap-1.5">
              <Folder aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="sr-only">Project</span>
              <span className="truncate">
                <TextMorph>{folder}</TextMorph>
              </span>
            </span>
          )}
          {context && (
            <span className="ml-auto shrink-0">
              <ContextMeter used={context.used} limit={context.limit} reduced={reduced} />
            </span>
          )}
        </div>
      )}

      <form
        ref={cardRef}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onDragOver={(e) => {
          if (!onFilesSelected || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={(e) => {
          if (!onFilesSelected) return;
          e.preventDefault();
          setDragging(false);
          takeFiles(e.dataTransfer.files);
        }}
        className={`@container relative rounded-[20px] bg-background p-1.5 transition-shadow duration-200 ${
          dragging ? "shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_40%,transparent)]" : "shadow-[0_0_0_1px_var(--border)] focus-within:shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_22%,transparent)]"
        }`}
      >
        <Fold show={Boolean(attachments)} reduced={reduced}>
          <div className="flex flex-wrap gap-2 px-2 pt-2">{attachments}</div>
        </Fold>

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          onPaste={(e) => {
            if (takeFiles(e.clipboardData.files) && !e.clipboardData.getData("text")) e.preventDefault();
          }}
          className="block max-h-[220px] w-full resize-none overflow-y-auto bg-transparent px-2.5 pb-2 pt-2 text-[14px] leading-6 text-foreground outline-none placeholder:text-muted-foreground"
        />

        <div className="flex items-center gap-0.5">
          {onFilesSelected && (
            <>
              <button
                type="button"
                aria-label="Add files"
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent @min-[26rem]:size-8 ${FOCUS}`}
              >
                <Plus className="size-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept={accept}
                className="hidden"
                onChange={(e) => {
                  takeFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </>
          )}
          <ModelPicker
            label="Permission"
            models={permissions}
            value={chosenPermission}
            onValueChange={(id) => {
              if (permission === undefined) setOwnPermission(id);
              onPermissionChange?.(id);
            }}
            anchorRef={cardRef}
            side="top"
            align="start"
          />

          <div className="ml-auto flex items-center gap-0.5 @min-[26rem]:gap-1">
            <ModelPicker label="Model" models={models} value={model} onValueChange={onModelChange} effort={effort} onEffortChange={onEffortChange} anchorRef={cardRef} side="top" align="end" />
            {onVoice && (
              <button
                type="button"
                aria-label={listening ? "Stop listening" : "Speak"}
                aria-pressed={listening}
                onClick={onVoice}
                // On the narrowest composers the mic steps aside so Send always fits.
                className={`cursor-pointer relative hidden size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200 @min-[22rem]:flex @min-[26rem]:size-8 ${FOCUS} ${
                  listening ? "text-primary" : "text-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:bg-accent"
                }`}
              >
                {/* Breathes only while it listens. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-primary/12"
                  style={{ opacity: listening ? 1 : 0, animation: listening && !reduced ? "ui-breathe 1.6s ease-in-out infinite" : "none", transition: `opacity 200ms ${MORPH}` }}
                />
                <Mic className="relative size-4" />
              </button>
            )}
            <button
              type={action === "send" ? "submit" : "button"}
              aria-label={action === "stop" ? "Stop" : action === "wait" ? "Sending" : "Send"}
              disabled={action === "send" ? !canSend : action === "wait"}
              onClick={action === "stop" ? onStop : undefined}
              className={`cursor-pointer disabled:cursor-default relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-[opacity,transform] duration-200 active:scale-95 disabled:opacity-35 ${FOCUS}`}
            >
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(action === "send", reduced)}>
                <ArrowUp className="size-4" />
              </span>
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(action === "stop", reduced)}>
                <Square fill="currentColor" className="size-3" />
              </span>
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={swap(action === "wait", reduced)}>
                <span className={`size-3.5 rounded-full border-[1.5px] border-current/35 border-t-current motion-reduce:animate-none ${action === "wait" ? "animate-spin" : ""}`} />
              </span>
            </button>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[20px] bg-background/85 text-[13px] font-medium text-foreground"
          style={{ opacity: dragging ? 1 : 0, transition: reduced ? "none" : `opacity 200ms ${MORPH}` }}
        >
          Drop files to attach
        </div>
      </form>
    </div>
  );
}
