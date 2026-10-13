// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Newsletter footer (newsletter-footer)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { NumberRoll } from "./number-roll";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * NEWSLETTER FOOTER: the last thing on the page, still alive
 *
 *   signup     an email field with its button inside; a likely
 *              typo ("gmial.com") is caught as you type and
 *              fixed in one click
 *   sending    the button opens a spinner, "Subscribing"
 *   sent       the field blurs into "Check your inbox" with a
 *              check drawing itself; the button becomes
 *              "Resend in 0:30", the seconds rolling down;
 *              "Wrong address?" morphs it back, email selected
 *   links      columns whose underlines draw in from the left
 *              and leave to the right
 *   wordmark   your name across the full width in 1px outline;
 *              letters rise in, and fill where the pointer
 *              passes, fading out behind it
 * ───────────────────────────────────────────────────────── */

export interface FooterLink {
  label: string;
  href?: string;
  onClick?: () => void;
  /** A small tag beside the link, e.g. "New" or "Hiring". */
  badge?: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterSocial {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface FooterNewsletter {
  title?: string;
  description?: string;
  placeholder?: string;
  buttonLabel?: string;
  /** Subscribe the address; throw an Error to show its message. */
  onSubscribe: (email: string) => Promise<unknown> | unknown;
  /** Seconds before the email can be sent again. */
  resendAfter?: number;
}

export interface NewsletterFooterProps extends React.HTMLAttributes<HTMLElement> {
  brand: { name: string; logo?: React.ReactNode; href?: string; tagline?: string };
  columns?: FooterColumn[];
  newsletter?: FooterNewsletter;
  socials?: FooterSocial[];
  /** Small links in the bottom row: privacy, terms, cookie settings. */
  legal?: FooterLink[];
  copyright?: React.ReactNode;
  /** A link to your status page, with a live dot. */
  status?: { state: "operational" | "degraded" | "outage"; label?: string; href?: string };
  /** The name in outline across the full width; a string to use other words. */
  wordmark?: boolean | string;
}

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const LINK = `rounded-sm text-muted-foreground transition-[color,background-size] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [background:linear-gradient(currentColor,currentColor)_no-repeat_100%_100%/0%_1px] hover:text-foreground hover:[background-position:0_100%] hover:[background-size:100%_1px] motion-reduce:transition-none ${FOCUS}`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STATUS = {
  operational: { label: "All systems normal", dot: "bg-emerald-500" },
  degraded: { label: "Some systems slow", dot: "bg-amber-500" },
  outage: { label: "Outage in progress", dot: "bg-red-500" },
};

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

/* Common mail domains, to catch "gmial.com" before it bounces. */
const DOMAINS = ["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "me.com", "mac.com", "proton.me", "protonmail.com", "aol.com", "mail.com", "gmx.com", "fastmail.com", "hey.com", "yandex.com"];

function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

function suggest(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.slice(at + 1).toLowerCase();
  if (!/\.[a-z]{2,}$/.test(domain) || DOMAINS.includes(domain)) return null;
  let best = "";
  let score = Infinity;
  for (const known of DOMAINS) {
    const s = distance(domain, known);
    if (s < score) [best, score] = [known, s];
  }
  return score <= (domain.length > 6 ? 2 : 1) ? email.slice(0, at + 1) + best : null;
}

function FooterAnchor({ link, className = "" }: { link: FooterLink; className?: string }) {
  const content = (
    <>
      {link.label}
      {link.badge && <span className="ml-2 rounded-full px-1.5 py-px text-[10.5px] font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)]">{link.badge}</span>}
    </>
  );
  // The badge sits outside the drawn underline.
  return link.href ? (
    <a href={link.href} onClick={link.onClick} className={`${LINK} ${className}`}>
      {content}
    </a>
  ) : (
    <button type="button" onClick={link.onClick} className={`cursor-pointer ${LINK} ${className}`}>
      {content}
    </button>
  );
}

function Signup({ title = "Get the changelog by email", description = "One email a month, when something ships. No spam.", placeholder = "you@company.com", buttonLabel = "Subscribe", onSubscribe, resendAfter = 30, reduced }: FooterNewsletter & { reduced: boolean }) {
  const id = React.useId();
  const [email, setEmail] = React.useState("");
  const [phase, setPhase] = React.useState<"idle" | "sending" | "sent" | "resending">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState("");
  const [seconds, setSeconds] = React.useState(0);
  const [resent, setResent] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const flash = React.useRef(0);

  const sent = phase === "sent" || phase === "resending";
  const busy = phase === "sending" || phase === "resending";
  const counting = phase === "sent" && seconds > 0 && !resent;
  const fix = phase === "idle" && !error ? suggest(email.trim()) : null;

  // The resend countdown.
  React.useEffect(() => {
    if (!sent || seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [sent, seconds]);
  React.useEffect(() => () => window.clearTimeout(flash.current), []);

  // The helper's action keeps its label while it folds away.
  const action = sent ? { kind: "wrong", label: "Wrong address?" } : fix ? { kind: "fix", label: `${fix}?` } : null;
  const [kept, setKept] = React.useState(action);
  if (action && (action.kind !== kept?.kind || action.label !== kept?.label)) setKept(action);

  const reason = (err: unknown) => (err instanceof Error && err.message ? err.message : "That didn’t go through. Try again?");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || sent) return;
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setError(value ? "That doesn’t look like an email address." : "Add your email address first.");
      if (!reduced)
        boxRef.current?.animate(
          [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
          { duration: 380, easing: "ease-out" },
        );
      inputRef.current?.focus();
      return;
    }
    const typed = document.activeElement === inputRef.current;
    setError(null);
    setPhase("sending");
    try {
      await onSubscribe(value);
      setSentTo(value);
      setSeconds(resendAfter);
      setPhase("sent");
      if (typed) requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
    } catch (err) {
      setError(reason(err));
      setPhase("idle");
    }
  };

  const resend = async () => {
    if (phase !== "sent" || seconds > 0) return;
    setError(null);
    setPhase("resending");
    try {
      await onSubscribe(sentTo);
      setResent(true);
      window.clearTimeout(flash.current);
      flash.current = window.setTimeout(() => setResent(false), 2200);
      setSeconds(resendAfter);
    } catch (err) {
      setError(reason(err));
    }
    setPhase("sent");
  };

  const wrong = () => {
    setPhase("idle");
    setError(null);
    setResent(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const helper = sent
    ? error ?? (resent ? `Sent again to ${sentTo}.` : `We sent a link to ${sentTo}.`)
    : error ?? (fix ? "Did you mean" : description);
  const label = phase === "sending" ? "Subscribing" : phase === "resending" ? "Sending" : sent ? (resent ? "Sent" : seconds > 0 ? "Resend in" : "Resend") : buttonLabel;
  const swap = (on: boolean, delay = 0) =>
    reduced
      ? { opacity: on ? 1 : 0 }
      : {
          opacity: on ? 1 : 0,
          filter: on ? "none" : "blur(4px)",
          transform: on ? "none" : "translateY(5px)",
          transition: `opacity 320ms ${EASE} ${on ? delay : 0}ms, filter 320ms ${EASE} ${on ? delay : 0}ms, transform 420ms ${EASE} ${on ? delay : 0}ms`,
        };

  return (
    <form onSubmit={submit} noValidate className="w-full max-w-[420px]">
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      <label htmlFor={`${id}-email`} className="sr-only">
        Email address
      </label>
      {/* One surface: the field, then the confirmation, in the same box. */}
      <div
        ref={boxRef}
        className="mt-3 flex h-12 items-center rounded-full bg-background p-1.5 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring/30"
        style={{ boxShadow: `inset 0 0 0 1px ${error && !sent ? "rgb(239 68 68 / 0.6)" : "var(--border)"}`, transition: "box-shadow 200ms" }}
      >
        <div className="relative min-w-0 flex-1 self-stretch">
          <input
            ref={inputRef}
            id={`${id}-email`}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder={placeholder}
            value={email}
            readOnly={busy}
            inert={sent}
            aria-invalid={(error !== null && !sent) || undefined}
            aria-describedby={`${id}-help`}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            className="absolute inset-0 w-full bg-transparent pl-3 pr-2 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            style={swap(!sent, 120)}
          />
          <div aria-hidden={!sent || undefined} className="pointer-events-none absolute inset-0 flex items-center gap-2 pl-2.5 text-[14px] font-medium text-foreground" style={swap(sent, 160)}>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-[18px] shrink-0 text-emerald-600 dark:text-emerald-400">
              <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
              <path
                d="M6.5 10.4 8.8 12.7 13.6 7.6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                style={{ strokeDashoffset: sent ? 0 : 1, transition: sent && !reduced ? `stroke-dashoffset 420ms ${EASE} 320ms` : "none" }}
              />
            </svg>
            <span className="truncate">Check your inbox</span>
          </div>
        </div>
        <button
          ref={buttonRef}
          type={sent ? "button" : "submit"}
          onClick={sent ? resend : undefined}
          aria-disabled={busy || counting || undefined}
          aria-busy={busy || undefined}
          className={`cursor-pointer disabled:cursor-default aria-disabled:cursor-default inline-flex h-9 shrink-0 items-center rounded-full text-[13px] font-medium ${sent ? "px-3.5" : "px-4"} transition-[background-color,color,box-shadow] duration-300 ${FOCUS} ${
            sent
              ? `bg-transparent shadow-[inset_0_0_0_1px_var(--border)] ${counting || busy ? "text-muted-foreground" : "text-foreground hover:bg-accent"}`
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <span
            aria-hidden="true"
            className="relative flex h-3.5 shrink-0 items-center justify-center"
            style={{ width: busy || resent ? 14 : 0, marginRight: busy || resent ? 6 : 0, transition: reduced ? "none" : `width 320ms ${EASE}, margin 320ms ${EASE}` }}
          >
            <span
              className={`absolute size-3 rounded-full border-[1.5px] border-current/30 border-t-current motion-reduce:animate-none ${busy ? "animate-spin" : ""}`}
              style={{ opacity: busy ? 1 : 0, transition: reduced ? "none" : "opacity 200ms" }}
            />
            <svg viewBox="0 0 16 16" fill="none" className="absolute size-3.5" style={{ opacity: resent ? 1 : 0 }}>
              <path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                style={{ strokeDashoffset: resent ? 0 : 1, transition: resent && !reduced ? `stroke-dashoffset 380ms ${EASE} 120ms` : "none" }}
              />
            </svg>
          </span>
          <TextMorph>{label}</TextMorph>
          {/* The countdown opens after "Resend in", the seconds rolling down. */}
          <span
            aria-hidden={!counting || undefined}
            className="inline-grid"
            style={{ gridTemplateColumns: counting ? "1fr" : "0fr", opacity: counting ? 1 : 0, transition: reduced ? "none" : `grid-template-columns 420ms ${EASE}, opacity 300ms ${EASE}` }}
          >
            <span className="min-w-0 overflow-hidden">
              <span className="inline-flex whitespace-nowrap pl-1 tabular-nums">
                <NumberRoll value={Math.floor(seconds / 60)} direction="down" />:
                <NumberRoll value={seconds % 60} format={{ minimumIntegerDigits: 2 }} direction="down" />
              </span>
            </span>
          </span>
        </button>
      </div>
      <p id={`${id}-help`} aria-live="polite" className={`mt-2.5 min-h-5 px-1 text-[12.5px] leading-5 transition-colors duration-200 ${error ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
        <TextMorph animateWidth={false}>{helper}</TextMorph>
        <span
          className="inline-grid align-top"
          style={{ gridTemplateColumns: action ? "1fr" : "0fr", opacity: action ? 1 : 0, transition: reduced ? "none" : `grid-template-columns 420ms ${EASE}, opacity 260ms ${EASE}` }}
        >
          <span className="min-w-0">
            <button
              type="button"
              inert={!action}
              onClick={() => (kept?.kind === "wrong" ? wrong() : fix && setEmail(fix))}
              className={`cursor-pointer ml-1 whitespace-nowrap rounded-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-current ${FOCUS}`}
            >
              <TextMorph>{kept?.label ?? ""}</TextMorph>
            </button>
          </span>
        </span>
      </p>
    </form>
  );
}

/**
 * Your name across the full width in 1px outline, sitting on the footer's bottom edge so
 * descenders sink into it; letters rise out of that edge and fill where the pointer passes.
 */
function Wordmark({ text, reduced }: { text: string; reduced: boolean }) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const wordRef = React.useRef<HTMLSpanElement>(null);
  const probeRef = React.useRef<HTMLSpanElement>(null);
  const [size, setSize] = React.useState(120);
  const [baseline, setBaseline] = React.useState(0.86);
  const [shown, setShown] = React.useState(false);

  // Sized so the word spans the footer exactly, at any width and in any font.
  React.useLayoutEffect(() => {
    const box = boxRef.current;
    const word = wordRef.current;
    if (!box || !word) return;
    const fit = () => {
      const current = parseFloat(getComputedStyle(word).fontSize);
      if (!box.clientWidth || !word.offsetWidth || !current) return;
      const next = (current * box.clientWidth) / word.offsetWidth;
      setSize((s) => (Math.abs(s - next) < 0.5 ? s : next));
      // Where the baseline falls, as a share of the font size, so the box can end just below it.
      const probe = probeRef.current;
      if (probe) setBaseline((probe.getBoundingClientRect().top - word.getBoundingClientRect().top) / current);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [text]);

  React.useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} aria-hidden="true" className="mt-10 select-none overflow-hidden" style={{ fontSize: size, height: "0.83em" }}>
      {/* The right padding gives back the last letter's negative tracking, so it isn't clipped. */}
      <span ref={wordRef} className="block w-max whitespace-nowrap pr-[0.06em] font-medium leading-none tracking-[-0.055em]" style={{ marginTop: `${0.8 - baseline}em` }}>
        {[...text].map((ch, i) => (
          <span
            key={i}
            className="inline-block"
            style={{ transform: shown || reduced ? "none" : "translateY(115%)", transition: reduced ? "none" : `transform 1000ms ${EASE} ${i * 60}ms` }}
          >
            <span className="inline-block text-transparent transition-colors duration-[1600ms] ease-out [-webkit-text-stroke:1px_color-mix(in_oklab,var(--foreground)_30%,transparent)] hover:text-foreground hover:duration-0">
              {ch === " " ? " " : ch}
            </span>
          </span>
        ))}
        <span ref={probeRef} className="inline-block h-0 w-0" />
      </span>
    </div>
  );
}

export function NewsletterFooter({ brand, columns = [], newsletter, socials = [], legal = [], copyright, status, wordmark = true, className = "", ...props }: NewsletterFooterProps) {
  const reduced = useReducedMotion();
  const word = wordmark === true ? brand.name : wordmark || null;
  const live = status ? STATUS[status.state] : null;
  const year = new Date().getFullYear();

  return (
    <footer className={`w-full border-t border-border bg-background text-foreground ${className}`} {...props}>
      <div className="mx-auto w-full max-w-6xl px-6 pt-14 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div>
            <a href={brand.href ?? "/"} className={`inline-flex items-center gap-2.5 rounded-md text-[15px] font-medium tracking-[-0.01em] ${FOCUS}`}>
              {brand.logo}
              {brand.name}
            </a>
            {brand.tagline && <p className="mt-2 max-w-[36ch] text-[13px] leading-relaxed text-muted-foreground">{brand.tagline}</p>}
            {newsletter && (
              <div className="mt-8">
                <Signup {...newsletter} reduced={reduced} />
              </div>
            )}
          </div>
          {columns.length > 0 && (
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
              {columns.map((column) => (
                <div key={column.title}>
                  <p className="text-[12.5px] font-medium text-foreground">{column.title}</p>
                  <ul className="mt-4 space-y-2.5 text-[13px]">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <FooterAnchor link={link} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          )}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-border pt-6 text-[12.5px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>{copyright ?? `© ${year} ${brand.name}`}</span>
            {legal.map((link) => (
              <FooterAnchor key={link.label} link={link} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {live && status && (
              <a
                href={status.href}
                className={`inline-flex h-7 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-accent ${FOCUS}`}
              >
                <span aria-hidden="true" className={`size-2 rounded-full transition-colors duration-500 motion-safe:animate-[ui-breathe_2.4s_ease-in-out_infinite] ${live.dot}`} />
                <TextMorph>{status.label ?? live.label}</TextMorph>
              </a>
            )}
            {socials.length > 0 && (
              <ul className="flex items-center gap-0.5">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      aria-label={social.label}
                      className={`group grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${FOCUS} [&_svg]:size-4`}
                    >
                      <span className="transition-transform duration-300 ease-[cubic-bezier(0.34,1.36,0.64,1)] group-hover:-translate-y-0.5 motion-reduce:transition-none">{social.icon}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {word ? <Wordmark text={word} reduced={reduced} /> : <div className="h-8" />}
      </div>
    </footer>
  );
}
