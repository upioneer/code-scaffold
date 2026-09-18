/**
 * GSAP Choreography Engine Reference
 * Code Scaffold :: UI Primitives & Micro-Interactions v4
 * -------------------------------------------------------
 * Full hero intro sequence + scroll reveal composition.
 * Requires: gsap (npm install gsap)
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Hero Intro Sequence ───────────────────────────────────────────────────

export function initHeroIntro() {
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.8 },
      delay: 0.1,
    });

    tl.from(".cs-nav",          { y: -60, opacity: 0, duration: 0.6 })
      .from(".cs-hero-eyebrow", { opacity: 0, x: -24, duration: 0.5 }, "-=0.35")
      .from(".cs-hero-title",   { opacity: 0, y: 48 }, "-=0.4")
      .from(".cs-hero-sub",     { opacity: 0, y: 24, duration: 0.6 }, "-=0.5")
      .from(".cs-hero-cta",     { opacity: 0, scale: 0.92, ease: "back.out(1.4)" }, "-=0.3")
      .from(".cs-hero-visual",  { opacity: 0, scale: 0.96, duration: 1 }, "-=0.5");
  });

  return ctx; // caller calls ctx.revert() on unmount
}

// ─── Staggered Section Reveal ─────────────────────────────────────────────

export function initScrollReveal(selector = "[data-gsap-reveal]") {
  const ctx = gsap.context(() => {
    gsap.utils.toArray(selector).forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 32,
        duration: 0.7,
        ease: "expo.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    });
  });

  return ctx;
}

// ─── Staggered Card Grid Reveal ───────────────────────────────────────────

export function initCardGridReveal(containerSelector = ".cs-card-grid") {
  const ctx = gsap.context(() => {
    document.querySelectorAll(containerSelector).forEach((grid) => {
      gsap.from(grid.querySelectorAll(".cs-card"), {
        opacity: 0,
        y: 24,
        scale: 0.97,
        duration: 0.55,
        stagger: 0.07,
        ease: "expo.out",
        scrollTrigger: {
          trigger: grid,
          start: "top 85%",
        },
      });
    });
  });

  return ctx;
}

// ─── Parallax Image Layer ─────────────────────────────────────────────────

export function initParallax(selector = ".cs-parallax", depth = -120) {
  const ctx = gsap.context(() => {
    gsap.utils.toArray(selector).forEach((el) => {
      gsap.to(el, {
        y: depth,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("section") || el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    });
  });

  return ctx;
}

// ─── Pinned Progress Section ──────────────────────────────────────────────

export function initPinnedSection(triggerSelector = ".cs-sticky-section") {
  const ctx = gsap.context(() => {
    ScrollTrigger.create({
      trigger: triggerSelector,
      start: "top top",
      end: "+=800",
      pin: true,
      onUpdate: (self) => {
        gsap.set(".cs-progress-bar", { scaleX: self.progress });
      },
    });
  });

  return ctx;
}

// ─── Reduced-Motion Safe Guard ────────────────────────────────────────────

export function safeAnimate() {
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    initHeroIntro();
    initScrollReveal();
    initCardGridReveal();
    initParallax();
  });

  // No animation for reduced-motion users — elements remain at final state
  return mm;
}
