// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Attachment chip (attachment-chip)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { AlertCircle, File, FileCode, FileText, Image as ImageIcon, X } from "lucide-react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * ATTACHMENT CHIP: a file on its way into a prompt
 *
 *   uploading   a progress ring fills around the file icon and
 *               "Uploading 42%" rolls
 *   processing  the ring fades; the line morphs to "Reading"
 *               under a sweep of light
 *   ready       it morphs again into type and size; can be removed
 *   error       the icon blurs into an alert, the line morphs to
 *               what went wrong, and Retry opens in
 *
 * Images show a thumbnail. The remove button appears on hover or
 * focus, and is always visible on touch screens.
 * ───────────────────────────────────────────────────────── */

export type AttachmentStatus = "uploading" | "processing" | "ready" | "error";

export interface AttachmentChipProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  /** Size in bytes. */
  size?: number;
  /** MIME type, e.g. "application/pdf". Picks the icon. */
  type?: string;
  /** Thumbnail URL for images, e.g. from URL.createObjectURL(file). */
  previewUrl?: string;
  status?: AttachmentStatus;
  /** Upload progress, 0 to 1. */
  progress?: number;
  error?: string;
  onRemove?: () => void;
  onRetry?: () => void;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const MORPH = "cubic-bezier(0.16,1,0.3,1)";
// A light that sweeps across the label. A mask, not a text clip, so it reaches letters that are mid-morph.
const SHEEN =
  "text-foreground [mask-image:linear-gradient(90deg,rgb(0_0_0/0.45)_35%,#000_50%,rgb(0_0_0/0.45)_65%)] [mask-size:200%_100%] animate-[ui-sheen_1.4s_linear_infinite] motion-reduce:animate-none motion-reduce:[mask-image:none] motion-reduce:text-foreground/70";

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

/** A piece of a line that opens out of nothing and folds back into it. */
function Reveal({ show, reduced, children }: { show: boolean; reduced: boolean; children: React.ReactNode }) {
  return (
    <span
      aria-hidden={!show || undefined}
      className="grid shrink-0"
      style={{
        gridTemplateColumns: show ? "1fr" : "0fr",
        opacity: show ? 1 : 0,
        transition: reduced ? "none" : `grid-template-columns 420ms ${MORPH}, opacity ${show ? "300ms" : "160ms"} ${MORPH}`,
      }}
    >
      <span className="flex min-w-0 items-baseline whitespace-nowrap [clip-path:inset(-4px_-2px)]">{children}</span>
    </span>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toUpperCase() : "FILE";
}

function TypeIcon({ type, name }: { type?: string; name: string }) {
  const t = type ?? "";
  if (t.startsWith("image/")) return <ImageIcon className="size-4" />;
  if (t === "application/pdf" || t.startsWith("text/") || /\.(pdf|txt|md|docx?)$/i.test(name)) return <FileText className="size-4" />;
  if (/\.(tsx?|jsx?|py|go|rs|json|css|html)$/i.test(name)) return <FileCode className="size-4" />;
  return <File className="size-4" />;
}

export function AttachmentChip({
  name,
  size,
  type,
  previewUrl,
  status = "ready",
  progress = 0,
  error,
  onRemove,
  onRetry,
  className = "",
  ...props
}: AttachmentChipProps) {
  const reduced = useReducedMotion();
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const circumference = 2 * Math.PI * 16;
  const failed = status === "error";

  // One line for the whole journey: it morphs from "Uploading" to "Reading" to "PDF · 2.4 MB" (or the error).
  const line =
    status === "uploading" ? "Uploading" : status === "processing" ? "Reading" : failed ? (error ?? "Upload failed") : `${extension(name)}${size !== undefined ? ` · ${formatBytes(size)}` : ""}`;
  const spoken = status === "uploading" ? `Uploading ${name}` : status === "processing" ? `Reading ${name}` : failed ? `${name}: ${error ?? "Upload failed"}` : `${name} is ready`;

  return (
    <div
      className={`group relative inline-flex h-12 max-w-[260px] items-center gap-2.5 rounded-xl border bg-background pl-1.5 pr-3 animate-[ui-fade-up_260ms_cubic-bezier(0.23,1,0.32,1)_both] motion-reduce:animate-none ${
        failed ? "border-red-500/40" : "border-border"
      } ${className}`}
      {...props}
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
        <span className="absolute inset-0 flex items-center justify-center" style={swap(!failed, reduced)}>
          {previewUrl ? (
            <img src={previewUrl} alt="" className={`size-full object-cover transition-opacity duration-300 ${status === "ready" ? "opacity-100" : "opacity-50"}`} />
          ) : (
            <TypeIcon type={type} name={name} />
          )}
        </span>
        <span className="absolute inset-0 flex items-center justify-center" style={swap(failed, reduced)}>
          <AlertCircle className="size-4 text-red-500" />
        </span>
        {/* The ring fills while it uploads, then fades rather than vanishing. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 36 36"
          className="absolute inset-0 size-full -rotate-90"
          style={{ opacity: status === "uploading" ? 1 : 0, transition: reduced ? "none" : `opacity 360ms ${MORPH}` }}
        >
          <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2" className="stroke-border" />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - (status === "uploading" ? pct : 100) / 100)}
            className="stroke-foreground transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none"
          />
        </svg>
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-medium leading-4 text-foreground">{name}</span>
        <span className={`mt-0.5 flex min-w-0 items-baseline text-[11.5px] leading-4 transition-colors duration-300 ${failed ? "text-red-500" : "text-muted-foreground"}`}>
          <span aria-hidden="true" className={`min-w-0 truncate ${status === "processing" ? SHEEN : ""}`}>
            <TextMorph>{line}</TextMorph>
          </span>
          <Reveal show={status === "uploading"} reduced={reduced}>
            &nbsp;
            <span aria-hidden="true" className="tabular-nums">
              <NumberRoll value={pct} suffix="%" duration={400} />
            </span>
          </Reveal>
          {onRetry && (
            <Reveal show={failed} reduced={reduced}>
              <span aria-hidden="true">&nbsp;·&nbsp;</span>
              <button
                type="button"
                inert={!failed}
                onClick={onRetry}
                className={`cursor-pointer rounded font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground ${FOCUS}`}
              >
                Retry
              </button>
            </Reveal>
          )}
        </span>
        {/* Announces each step, never every percent. */}
        <span role="status" aria-live="polite" className="sr-only">
          {spoken}
        </span>
      </span>

      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
          className={`cursor-pointer absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100 ${FOCUS}`}
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
