// Code Scaffold · UI Primitives · Tactile Kinetic Matrix
// Component: Cookie banner (cookie-banner)
// Pure React and Web Animations API · Zero External Styling Dependencies

"use client";

import * as React from "react";
import { TextMorph } from "./text-morph";

/* ─────────────────────────────────────────────────────────
 * COOKIE BANNER: ask once, plainly, then get out of the way
 *
 *   ask        a Tactile card in the corner: one sentence,
 *              Customise, and Reject all beside Accept all,
 *              equally easy
 *   customise  the same card grows into the preferences: each
 *              kind of cookie with a switch thrown to its side;
 *              what's necessary says it's always on, and why
 *   save       a check draws itself on the button you pressed,
 *              its label morphs to "Accepted", and the card
 *              shrinks into a small cookie button in the corner
 *   revisit    that button grows back into the preferences, with
 *              the choices as they were
 *
 * The choice is remembered and handed to you, so you only load
 * what people allowed. Global Privacy Control is respected; new
 * kinds of cookie, or a year passing, ask again.
 * ───────────────────────────────────────────────────────── */

export interface CookieCategory {
  id: string;
  label: string;
  description: string;
  /** Always on, e.g. what keeps people signed in. */
  required?: boolean;
  /** Ads or cross-site tracking: stays off for browsers that send Global Privacy Control, unless switched on here. */
  tracking?: boolean;
}

export type CookieConsent = Record<string, boolean>;

export interface CookieBannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  categories?: CookieCategory[];
  /** The one sentence on the banner. */
  message?: React.ReactNode;
  /** Link to your cookie policy. */
  policyHref?: string;
  /**
   * Called with the remembered choice on load ("load") and with every new one ("save"),
   * so you can start what people allowed. Return a promise to record consent on your
   * server; the button waits for it.
   */
  onConsentChange?: (consent: CookieConsent, reason: "load" | "save") => void | Promise<unknown>;
  storageKey?: string;
  /** Days before asking again. */
  expiresAfter?: number;
  position?: "bottom-left" | "bottom-right" | "bottom-center";
  /** "absolute" keeps it inside a positioned parent instead of the window. */
  strategy?: "fixed" | "absolute";
  /** Keep the small cookie button after a choice, so people can change their mind. */
  showReopen?: boolean;
}

type Phase = "hidden" | "ask" | "prefs" | "folded";
type Action = "accept" | "reject" | "save";
type Work = { action: Action; stage: "busy" | "done" };
type Saved = { choices: CookieConsent; savedAt: number };

const OPEN_EVENT = "cookie-preferences:open";

/** Opens the preferences from anywhere, e.g. a "Cookie settings" link in your footer. */
export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** The saved choice, or null if people haven't chosen yet. */
export function getCookieConsent(storageKey = "cookie-consent"): CookieConsent | null {
  try {
    return (JSON.parse(localStorage.getItem(storageKey) ?? "null") as Saved | null)?.choices ?? null;
  } catch {
    return null;
  }
}

const DEFAULT_CATEGORIES: CookieCategory[] = [
  { id: "necessary", label: "Necessary", description: "Keeps you signed in and your basket full.", required: true },
  { id: "analytics", label: "Analytics", description: "Counts visits and what gets used, so we can make it better. Never sold." },
  { id: "marketing", label: "Marketing", description: "Shows you our ads on other sites and tells us if they worked.", tracking: true },
];

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const THROW = "cubic-bezier(0.34,1.36,0.64,1)";
const DURATION = 480;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-popover";
const TONES = {
  solid: "bg-primary text-primary-foreground hover:bg-primary/90",
  line: "text-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:bg-accent",
  ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
};

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);

function CookieIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M17.5 10.2A7.5 7.5 0 1 1 9.8 2.5a2.6 2.6 0 0 0 3.1 3 2.6 2.6 0 0 0 3.5 3.5 2.4 2.4 0 0 0 1.1 1.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7.3" cy="8.6" r="1" fill="currentColor" />
      <circle cx="12.2" cy="13" r="1" fill="currentColor" />
      <circle cx="7.8" cy="13.4" r="0.9" fill="currentColor" />
    </svg>
  );
}

/** A button that confirms itself: a spinner while your server records it, then a drawn check and a new label. */
function ActionButton({
  label,
  doneLabel,
  stage,
  locked,
  tone,
  reduced,
  onClick,
  className = "",
}: {
  label: string;
  doneLabel: string;
  stage: "idle" | Work["stage"];
  locked: boolean;
  tone: keyof typeof TONES;
  reduced: boolean;
  onClick: () => void;
  className?: string;
}) {
  const on = stage !== "idle";
  return (
    <button
      type="button"
      onClick={() => !locked && onClick()}
      aria-disabled={(locked && !on) || undefined}
      aria-busy={stage === "busy" || undefined}
      className={`cursor-pointer disabled:cursor-default aria-disabled:cursor-default inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3.5 text-[12.5px] font-medium transition-colors ${FOCUS} ${TONES[tone]} ${className}`}
    >
      <span
        aria-hidden="true"
        className="relative flex h-3.5 shrink-0 items-center justify-center"
        style={{ width: on ? 14 : 0, marginRight: on ? 6 : 0, transition: reduced ? "none" : `width 320ms ${EASE}, margin 320ms ${EASE}` }}
      >
        <span
          className={`absolute size-3 rounded-full border-[1.5px] border-current/30 border-t-current motion-reduce:animate-none ${stage === "busy" ? "animate-spin" : ""}`}
          style={{ opacity: stage === "busy" ? 1 : 0, transition: reduced ? "none" : "opacity 200ms" }}
        />
        <svg viewBox="0 0 16 16" fill="none" className="absolute size-3.5" style={{ opacity: stage === "done" ? 1 : 0 }}>
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            style={{ strokeDashoffset: stage === "done" ? 0 : 1, transition: stage === "done" && !reduced ? `stroke-dashoffset 380ms ${EASE} 120ms` : "none" }}
          />
        </svg>
      </span>
      <TextMorph>{stage === "done" ? doneLabel : label}</TextMorph>
    </button>
  );
}

function Switch({ id, checked, describedBy, reduced, onChange }: { id: string; checked: boolean; describedBy: string; reduced: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className={`cursor-pointer relative mt-0.5 h-6 w-10 shrink-0 rounded-full ${FOCUS} ${checked ? "bg-primary" : "bg-muted shadow-[inset_0_0_0_1px_var(--border)]"}`}
      style={{ transition: reduced ? "none" : `background-color 300ms ${EASE}` }}
    >
      <span
        aria-hidden="true"
        className="absolute left-0.5 top-0.5 size-5 rounded-full bg-background shadow-[0_0_0_1px_var(--border)]"
        style={{ transform: checked ? "translateX(16px)" : "none", transition: reduced ? "none" : `transform 400ms ${THROW}` }}
      />
    </button>
  );
}

export function CookieBanner({
  categories = DEFAULT_CATEGORIES,
  message = "We use cookies to keep the site working and, if you agree, to see how it’s used.",
  policyHref,
  onConsentChange,
  storageKey = "cookie-consent",
  expiresAfter = 365,
  position = "bottom-left",
  strategy = "fixed",
  showReopen = true,
  className = "",
  ...props
}: CookieBannerProps) {
  const reduced = useReducedMotion();
  const id = React.useId();
  const required = React.useCallback(() => Object.fromEntries(categories.map((c) => [c.id, Boolean(c.required)])), [categories]);
  const [phase, setPhase] = React.useState<Phase>("hidden");
  const [work, setWork] = React.useState<Work | null>(null);
  const [choice, setChoice] = React.useState<CookieConsent>(required);
  const [gpc, setGpc] = React.useState(false);
  const [size, setSize] = React.useState({ ask: { w: 0, h: 0 }, prefs: { w: 0, h: 0 } });
  const [room, setRoom] = React.useState(432);
  const regionRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const askRef = React.useRef<HTMLDivElement>(null);
  const prefsRef = React.useRef<HTMLDivElement>(null);
  const customiseRef = React.useRef<HTMLButtonElement>(null);
  const cornerRef = React.useRef<HTMLButtonElement>(null);
  const live = React.useRef({ phase, locked: false });
  const back = React.useRef<Phase>("ask");
  const saved = React.useRef<CookieConsent | null>(null);
  const focusTo = React.useRef<"prefs" | "ask" | "corner" | null>(null);
  const timers = React.useRef<number[]>([]);
  const change = React.useRef(onConsentChange);

  React.useEffect(() => {
    live.current.phase = phase;
    change.current = onConsentChange;
  });

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  // On load: a remembered, current choice goes straight to the corner button; otherwise ask.
  React.useEffect(() => {
    setGpc(Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl));
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null") as Saved | null;
      if (stored?.choices) {
        setChoice({ ...required(), ...stored.choices });
        const fresh = Date.now() - stored.savedAt < expiresAfter * 864e5;
        const complete = categories.every((c) => c.required || c.id in stored.choices);
        if (fresh && complete) {
          saved.current = stored.choices;
          change.current?.(stored.choices, "load");
          setPhase("folded");
          return;
        }
      }
    } catch {}
    setPhase("ask");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const visible = phase !== "hidden" && (phase !== "folded" || showReopen);

  // How much room there is: the window, or the parent when it's positioned inside one.
  React.useLayoutEffect(() => {
    if (!visible) return;
    const parent = strategy === "absolute" ? regionRef.current?.offsetParent : null;
    const fit = () => setRoom(parent instanceof HTMLElement ? parent.clientWidth : document.documentElement.clientWidth);
    fit();
    window.addEventListener("resize", fit);
    const observer = parent instanceof HTMLElement ? new ResizeObserver(fit) : null;
    if (parent instanceof HTMLElement) observer?.observe(parent);
    return () => {
      window.removeEventListener("resize", fit);
      observer?.disconnect();
    };
  }, [visible, strategy]);

  // The card's two open shapes, measured, so it can grow from one to the other.
  React.useLayoutEffect(() => {
    if (!visible) return;
    const measure = () => {
      const a = askRef.current;
      const p = prefsRef.current;
      setSize((s) => {
        const next = { ask: { w: a?.offsetWidth ?? 0, h: a?.offsetHeight ?? 0 }, prefs: { w: p?.offsetWidth ?? 0, h: p?.offsetHeight ?? 0 } };
        return s.ask.w === next.ask.w && s.ask.h === next.ask.h && s.prefs.w === next.prefs.w && s.prefs.h === next.prefs.h ? s : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (askRef.current) observer.observe(askRef.current);
    if (prefsRef.current) observer.observe(prefsRef.current);
    return () => observer.disconnect();
  }, [visible]);

  // Arrives by rising out of the corner, a beat after the page.
  React.useLayoutEffect(() => {
    if (!visible || reduced) return;
    cardRef.current?.animate([{ transform: "translateY(20px) scale(0.97)", opacity: 0 }, { transform: "none", opacity: 1 }], {
      duration: 640,
      delay: phase === "ask" ? 400 : 0,
      easing: EASE,
      fill: "backwards",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Focus follows the surface, so keyboard people never land on something that just faded.
  React.useEffect(() => {
    const target = focusTo.current;
    if (!target) return;
    focusTo.current = null;
    if (target === "prefs") prefsRef.current?.querySelector<HTMLElement>('[role="switch"]')?.focus({ preventScroll: true });
    if (target === "ask") customiseRef.current?.focus({ preventScroll: true });
    if (target === "corner") cornerRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const openPrefs = () => {
    const p = live.current.phase;
    if (live.current.locked || p === "hidden" || p === "prefs") return;
    back.current = p;
    focusTo.current = "prefs";
    setPhase("prefs");
  };

  React.useEffect(() => {
    window.addEventListener(OPEN_EVENT, openPrefs);
    return () => window.removeEventListener(OPEN_EVENT, openPrefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (live.current.locked) return;
    const to = back.current === "folded" ? "folded" : "ask";
    if (to === "folded" && saved.current) setChoice({ ...required(), ...saved.current });
    focusTo.current = to === "folded" ? "corner" : "ask";
    setPhase(to);
  };

  const commit = async (action: Action, consent: CookieConsent) => {
    if (live.current.locked) return;
    live.current.locked = true;
    const final = Object.fromEntries(categories.map((c) => [c.id, Boolean(c.required || consent[c.id])]));
    setChoice(final);
    saved.current = final;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ choices: final, savedAt: Date.now() } satisfies Saved));
    } catch {}
    const pending = change.current?.(final, "save");
    if (pending && typeof pending.then === "function") {
      setWork({ action, stage: "busy" });
      await pending.then(undefined, () => {});
    }
    setWork({ action, stage: "done" });
    later(() => {
      if (cardRef.current?.contains(document.activeElement)) focusTo.current = "corner";
      setPhase("folded");
      later(() => {
        setWork(null);
        live.current.locked = false;
      }, 500);
    }, 950);
  };

  const all = (on: boolean) => Object.fromEntries(categories.map((c) => [c.id, Boolean(c.required || (on && !(gpc && c.tracking)))]));
  const stageOf = (action: Action) => (work?.action === action ? work.stage : "idle");
  const locked = work !== null;
  const prefs = phase === "prefs";
  const folded = phase === "folded";
  const shape = folded ? { w: 44, h: 44 } : prefs ? size.prefs : size.ask;
  const place = position === "bottom-right" ? "right-4" : position === "bottom-center" ? "left-1/2 -translate-x-1/2" : "left-4";
  const fadeIn = (delay: number) => (reduced ? "none" : `opacity 320ms ${EASE} ${delay}ms, filter 320ms ${EASE} ${delay}ms`);
  const fadeOut = reduced ? "none" : "opacity 120ms ease-out, filter 120ms ease-out";

  if (!visible) return null;

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label="Cookie consent"
      className={`${strategy} bottom-4 z-[80] ${place} ${className}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && prefs) close();
      }}
      {...props}
    >
      {/* One surface: the banner, the preferences and the corner button are three sizes of it. */}
      <div
        ref={cardRef}
        className="relative overflow-hidden bg-popover text-popover-foreground"
        style={{
          width: shape.w || undefined,
          height: shape.h || undefined,
          borderRadius: folded ? 22 : 20,
          boxShadow: "inset 0 0 0 1px var(--border)",
          transition: reduced ? "none" : `width ${DURATION}ms ${EASE}, height ${DURATION}ms ${EASE}, border-radius ${DURATION}ms ${EASE}`,
        }}
      >
        {/* The ask. */}
        <div
          ref={askRef}
          inert={phase !== "ask"}
          aria-hidden={phase !== "ask" || undefined}
          className="absolute bottom-0 left-0 p-4"
          style={{ width: Math.min(400, room - 32), opacity: phase === "ask" ? 1 : 0, filter: phase === "ask" ? "none" : "blur(4px)", transition: phase === "ask" ? fadeIn(160) : fadeOut }}
        >
          <div className="flex gap-3">
            <span className="mt-[3px] text-muted-foreground">
              <CookieIcon />
            </span>
            <p className="text-[13px] leading-relaxed text-foreground">
              {message}
              {policyHref && (
                <>
                  {" "}
                  <a href={policyHref} className={`rounded-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-current ${FOCUS}`}>
                    Cookie policy
                  </a>
                </>
              )}
            </p>
          </div>
          {/* Reject all and Accept all share the width equally; in a narrow card they take their own row. */}
          <div className="mt-4 flex flex-wrap-reverse items-center gap-2">
            <button
              ref={customiseRef}
              type="button"
              onClick={openPrefs}
              aria-disabled={locked || undefined}
              className={`cursor-pointer disabled:cursor-default aria-disabled:cursor-default -ml-1.5 h-8 shrink-0 rounded-full px-2.5 text-[12.5px] font-medium ${FOCUS} ${TONES.ghost}`}
            >
              Customise
            </button>
            <div className="ml-auto flex min-w-[200px] max-w-[248px] flex-1 gap-2">
              <ActionButton label="Reject all" doneLabel="Rejected" stage={stageOf("reject")} locked={locked} tone="line" reduced={reduced} onClick={() => commit("reject", all(false))} className="flex-1" />
              <ActionButton label="Accept all" doneLabel="Accepted" stage={stageOf("accept")} locked={locked} tone="solid" reduced={reduced} onClick={() => commit("accept", all(true))} className="flex-1" />
            </div>
          </div>
        </div>

        {/* The preferences. */}
        <div
          ref={prefsRef}
          role="group"
          aria-labelledby={`${id}-title`}
          inert={!prefs}
          aria-hidden={!prefs || undefined}
          className="absolute bottom-0 left-0 p-4"
          style={{ width: Math.min(420, room - 32), opacity: prefs ? 1 : 0, filter: prefs ? "none" : "blur(4px)", transition: prefs ? fadeIn(180) : fadeOut }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p id={`${id}-title`} className="text-[14px] font-medium text-foreground">
                Choose your cookies
              </p>
              {gpc && <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Your browser asks sites not to track you, so tracking stays off unless you switch it on.</p>}
            </div>
            <button type="button" aria-label="Close" onClick={close} className={`cursor-pointer -mr-1.5 -mt-1 grid size-7 shrink-0 place-items-center rounded-full ${FOCUS} ${TONES.ghost}`}>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5">
                <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <ul className="mt-3 max-h-[min(55vh,360px)] divide-y divide-border overflow-y-auto overscroll-contain border-y border-border">
            {categories.map((c) => (
              <li key={c.id} className="flex items-start gap-4 py-3 pr-1">
                <div className="min-w-0 flex-1">
                  {c.required ? (
                    <p className="text-[13px] font-medium text-foreground">{c.label}</p>
                  ) : (
                    <label htmlFor={`${id}-${c.id}`} className="cursor-pointer text-[13px] font-medium text-foreground">
                      {c.label}
                    </label>
                  )}
                  <p id={`${id}-${c.id}-about`} className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>
                </div>
                {c.required ? (
                  <span className="mt-0.5 shrink-0 text-[12px] font-medium text-muted-foreground">Always on</span>
                ) : (
                  <Switch
                    id={`${id}-${c.id}`}
                    checked={Boolean(choice[c.id])}
                    describedBy={`${id}-${c.id}-about`}
                    reduced={reduced}
                    onChange={(on) => !locked && setChoice((x) => ({ ...x, [c.id]: on }))}
                  />
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-end gap-2">
            <ActionButton label="Reject all" doneLabel="Rejected" stage={stageOf("reject")} locked={locked} tone="line" reduced={reduced} onClick={() => commit("reject", all(false))} />
            <ActionButton label="Save choices" doneLabel="Saved" stage={stageOf("save")} locked={locked} tone="solid" reduced={reduced} onClick={() => commit("save", choice)} />
          </div>
        </div>

        {/* The corner button it shrinks into; it grows back into the preferences. */}
        <button
          ref={cornerRef}
          type="button"
          inert={!folded}
          aria-hidden={!folded || undefined}
          aria-label="Cookie preferences"
          onClick={openPrefs}
          className="cursor-pointer group absolute inset-0 flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
          style={{
            opacity: folded ? 1 : 0,
            transform: folded ? "none" : "scale(0.5) rotate(-40deg)",
            transition: reduced ? "none" : folded ? `opacity 260ms ${EASE} 280ms, transform 520ms ${THROW} 240ms` : "opacity 100ms ease-out, transform 200ms ease-out",
          }}
        >
          <span className="transition-transform duration-300 group-hover:-rotate-[18deg] motion-reduce:transition-none">
            <CookieIcon className="size-5" />
          </span>
        </button>
      </div>
      <span role="status" className="sr-only">
        {work?.stage === "done" ? "Cookie choices saved" : ""}
      </span>
    </div>
  );
}
