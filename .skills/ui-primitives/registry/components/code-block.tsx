// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Code block (code-block)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { ChevronDown, Copy, CornerDownLeft, WrapText } from "lucide-react";
import { StatusButton, type ActionStatus } from "./status-button";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * CODE BLOCK: code in an answer, as it streams and after
 *
 *   streaming  lines arrive with a caret, already highlighted
 *   complete   language and file name, Copy and wrap; wrapping
 *              eases the block to its new height
 *   copied     the copy icon blurs into a check that draws
 *              itself while "Copy" morphs to "Copied"
 *   folded     long code shows its start and "Show 42 more
 *              lines"; it opens smoothly, the fade dissolves and
 *              the label morphs to "Show less"
 *   apply      optional: Apply → Applying → Applied, one button
 *              that settles into a quiet receipt
 *
 * A light highlighter is built in (keywords, strings, comments,
 * numbers, calls) so it works mid-stream with no dependencies.
 * ───────────────────────────────────────────────────────── */

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  /** e.g. "ts", "python", "bash"; shown in the header and used for comments. */
  language?: string;
  filename?: string;
  /** True while the code is still arriving. */
  streaming?: boolean;
  lineNumbers?: boolean;
  /** Fold code longer than this many lines (0 never folds). */
  collapseAfter?: number;
  /** Shows Apply; return a promise to show progress. */
  onApply?: () => void | Promise<void>;
  applyLabel?: string;
  /** Turn the built-in highlighting off, e.g. for plain output. */
  highlight?: boolean;
}

const LINE = 21;
const PAD = 12;
const EASE = "cubic-bezier(0.23,1,0.32,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const COPY_LABELS = { idle: "Copy", success: "Copied", error: "Couldn’t copy" };
const ACTION = `cursor-pointer inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-3.5 ${FOCUS}`;

// A GitHub-like palette for light and dark themes.
const TONE = {
  keyword: "text-[#cf222e] dark:text-[#ff7b72]",
  string: "text-[#0a3069] dark:text-[#a5d6ff]",
  comment: "italic text-[#6e7781] dark:text-[#8b949e]",
  number: "text-[#0550ae] dark:text-[#79c0ff]",
  call: "text-[#8250df] dark:text-[#d2a8ff]",
};

const KEYWORDS =
  "const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|from|export|default|async|await|new|class|extends|implements|type|interface|enum|true|false|null|undefined|this|try|catch|finally|throw|yield|in|of|typeof|instanceof|as|def|elif|lambda|None|True|False|pass|with|raise|except|and|or|not|is|self|fn|pub|use|mut|impl|struct|match|func|package|go|echo|then|fi|done|esac|local|public|private|protected|static|void|int|string|bool|select|where|insert|update|delete|create|table";
const HASH_COMMENTS = /^(py|python|sh|bash|shell|zsh|yaml|yml|rb|ruby|toml|dockerfile|r|perl)$/i;

function tokenize(line: string, hashComments: boolean): React.ReactNode[] {
  const comment = hashComments ? String.raw`#.*$|\/\/.*$` : String.raw`\/\/.*$|\/\*.*?\*\/|<!--.*?-->`;
  const re = new RegExp(
    String.raw`(${comment})|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|` + "`(?:[^`\\\\]|\\\\.)*`?" + String.raw`)|(\b\d[\d_]*(?:\.\d+)?\b)|\b(${KEYWORDS})\b|([A-Za-z_$][\w$]*)(?=\()`,
    "g"
  );
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const tone = m[1] ? TONE.comment : m[2] ? TONE.string : m[3] ? TONE.number : m[4] ? TONE.keyword : TONE.call;
    out.push(
      <span key={m.index} className={tone}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

export function CodeBlock({
  code,
  language,
  filename,
  streaming = false,
  lineNumbers = true,
  collapseAfter = 18,
  onApply,
  applyLabel = "Apply",
  highlight = true,
  className = "",
  ...props
}: CodeBlockProps) {
  const reduced = useReducedMotion();
  const [copy, setCopy] = React.useState<ActionStatus>("idle");
  const [wrap, setWrap] = React.useState(false);
  // Code you watched stream in stays open; only code that arrives complete (e.g. history) starts folded.
  const [expanded, setExpanded] = React.useState(streaming);
  const [apply, setApply] = React.useState<ActionStatus>("idle");
  // New code (a regenerated answer) can be applied again: "Applied" or "Try again" goes back to Apply.
  const [appliedCode, setAppliedCode] = React.useState(code);
  if (appliedCode !== code) {
    setAppliedCode(code);
    if (apply === "success" || apply === "error") setApply("idle");
  }
  const [fullHeight, setFullHeight] = React.useState(0);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const wrapFrom = React.useRef<number | null>(null);

  const lines = React.useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);
  const hash = HASH_COMMENTS.test(language ?? "");
  const rendered = React.useMemo(
    () => lines.map((line) => (highlight ? tokenize(line, hash) : [line])),
    [lines, highlight, hash]
  );

  const foldable = !streaming && collapseAfter > 0 && lines.length > collapseAfter + 3;
  const folded = foldable && !expanded;
  const hidden = lines.length - collapseAfter;

  React.useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => setFullHeight((h) => (h === body.scrollHeight ? h : body.scrollHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body.firstElementChild as Element);
    return () => observer.disconnect();
  }, [wrap]);

  // Wrapping changes how tall the code is: ease the block there instead of jumping. (Folded code has its own transition.)
  React.useLayoutEffect(() => {
    const body = bodyRef.current;
    const from = wrapFrom.current;
    wrapFrom.current = null;
    if (!body || from === null || reduced || foldable) return;
    const to = body.offsetHeight;
    if (Math.abs(to - from) > 1) body.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 460, easing: EASE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrap, reduced]);

  // A blocked clipboard says so, then quietly goes back to Copy.
  React.useEffect(() => {
    if (copy !== "error") return;
    const timer = window.setTimeout(() => setCopy("idle"), 2400);
    return () => window.clearTimeout(timer);
  }, [copy]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopy("success");
    } catch {
      setCopy("error");
    }
  };

  const runApply = async () => {
    if (!onApply || apply === "pending" || apply === "success") return;
    setApply("pending");
    try {
      await onApply();
      setApply("success");
    } catch {
      setApply("error");
    }
  };

  const gutter = String(lines.length).length;

  return (
    <div className={`w-full overflow-hidden rounded-[16px] border border-border bg-background ${className}`} {...props}>
      <div className="flex h-10 items-center gap-2 border-b border-border/70 pl-3.5 pr-1.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-muted-foreground">
          {filename ? (
            <>
              <span className="text-foreground/80">{filename}</span>
              {language && <span className="ml-2 opacity-70">{language}</span>}
            </>
          ) : (
            language ?? "code"
          )}
        </span>
        <button
          type="button"
          aria-label="Wrap lines"
          aria-pressed={wrap}
          onClick={() => {
            wrapFrom.current = bodyRef.current?.offsetHeight ?? null;
            setWrap((w) => !w);
          }}
          className={`cursor-pointer ${ACTION} ${wrap ? "bg-accent text-foreground" : ""} w-7 justify-center px-0`}
        >
          <WrapText />
        </button>
        <StatusButton
          variant="ghost"
          size="sm"
          icon={<Copy />}
          status={copy}
          labels={COPY_LABELS}
          aria-label="Copy code"
          onClick={copyCode}
          onReset={() => setCopy("idle")}
          resetAfter={1600}
        />
        {onApply && (
          // Waits, faded, until the code has finished arriving.
          <span className="inline-flex transition-opacity duration-300" style={{ opacity: streaming ? 0.4 : 1 }}>
            <StatusButton
              size="sm"
              // Once applied it settles from a call to action into a quiet receipt.
              variant={apply === "success" ? "ghost" : "primary"}
              icon={<CornerDownLeft />}
              status={apply}
              labels={{ idle: applyLabel, pending: "Applying", success: "Applied", error: "Try again" }}
              disabled={streaming}
              onClick={runApply}
              className="disabled:pointer-events-none"
            />
          </span>
        )}
      </div>

      <div className="relative">
        <div
          ref={bodyRef}
          className="overflow-hidden"
          style={{
            // Only foldable code gets a height cap (animated between its start and its full height).
            maxHeight: foldable ? (folded ? PAD + collapseAfter * LINE : fullHeight || undefined) : undefined,
            transition: reduced ? "none" : `max-height 460ms ${EASE}`,
          }}
        >
          <pre
            className={`py-3 font-mono text-[12.5px] leading-[21px] text-foreground/90 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] ${wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto"}`}
            tabIndex={wrap ? undefined : 0}
            aria-label={`${language ?? "Code"}${filename ? `, ${filename}` : ""}`}
          >
            <code className="block min-w-fit">
              {rendered.map((tokens, i) => (
                <span key={i} className="flex">
                  {lineNumbers && (
                    <span
                      aria-hidden="true"
                      className="sticky left-0 shrink-0 select-none bg-background pl-3.5 pr-4 text-right tabular-nums text-muted-foreground/50"
                      style={{ width: `calc(${gutter}ch + 2.25rem)` }}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span className={`min-w-0 ${lineNumbers ? "pr-4" : "px-4"} ${wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"}`}>
                    {tokens.length ? tokens : " "}
                    {streaming && i === rendered.length - 1 && (
                      <span aria-hidden="true" className="ml-px inline-block h-[15px] w-[7px] translate-y-[3px] bg-foreground/60 animate-[ui-blink_1s_steps(1)_infinite]" />
                    )}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        </div>

        {/* The fade over folded code dissolves as it opens; the bar under it never moves. */}
        {foldable && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent"
            style={{ opacity: folded ? 1 : 0, transition: reduced ? "none" : `opacity 360ms ${EASE}` }}
          />
        )}
      </div>

      {foldable && (
        <div className="flex justify-center border-t border-border/60 py-1.5">
          <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className={ACTION}>
            <ChevronDown className="transition-transform duration-300 motion-reduce:transition-none" style={{ transform: expanded ? "rotate(180deg)" : "none", transitionTimingFunction: EASE }} />
            <TextMorph>{expanded ? "Show less" : `Show ${hidden} more line${hidden === 1 ? "" : "s"}`}</TextMorph>
          </button>
        </div>
      )}
    </div>
  );
}
