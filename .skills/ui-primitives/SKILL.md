---
​‌‍name: UI Primitives & Micro-Interactions
description: High-fidelity interactive web UI components, perimeter border beams, liquid gooey physics, spring magnification docks, spotlight bento grids, universal motion transitions, kinetic typography, staggered blur reveals, typewriter, circular text, atomic tokens, GSAP choreography timelines, ScrollTrigger scroll-driven animation, WebGL Three.js 3D scenes, WebGPU halftone cursor shader trails, premium surface gradient borders, design-first constraint prompting, and high-conversion landing page architecture.
version: 6
---

# UI Primitives & Micro-Interactions Skill

Use this skill when designing, building, modernizing, or refining interactive web components, GSAP animation timelines, Three.js 3D scenes, WebGPU cursor trails, premium border gradients, perimeter border beams, liquid gooey physics, spring magnification docks, spotlight bento grids, universal motion transitions, kinetic typography, atomic tokens, scroll-driven storytelling, and high-conversion landing pages.

* **Entity Mapping**: Modern DOM custom elements, Tailwind CSS utilities, hardware-accelerated CSS transforms, Web Animations API, SVG filter pipelines, WebGL and WebGPU shader canvases, GSAP timeline orchestration, Three.js scene graphs, HTML5 video/canvas comparison stages, and conversion-optimized landing page section architectures.
* **Problem Domain**: Eliminating stiff, generic web interfaces by providing production-ready, highly responsive micro-interactions, cinematic motion presentation stages, scroll-driven storytelling, immersive 3D hero scenes, and cursor-interactive shader effects that operate with zero layout shift and accessible semantics.

---

## 1. Architectural Principles for High-Fidelity UI

Great micro-interactions elevate interfaces from functional to memorable without compromising performance or accessibility:

* **Zero Layout Shift (CLS Invariance)**: Animated components (such as rolling numbers or expanding buttons) must reserve their structural dimensions using fixed height bounds, tabular numerals (`font-variant-numeric: tabular-nums`), or flex wrappers to avoid pushing neighboring layout elements.
* **Hardware Acceleration Protocol**: Animate strictly with `transform` (`translate3d`, `scale`, `rotate`) and `opacity`. Avoid animating layout-triggering properties such as `width`, `height`, `top`, `left`, or `margin`.
* **Complete Interaction State Discipline**: Every interactive primitive must explicitly specify states for default, hover, active (press), focus-visible (accessible keyboard outline), and disabled.
* **Reduced Motion Fallbacks**: Always pair motion-heavy animations with `@media (prefers-reduced-motion: reduce)` fallbacks that preserve instant state changes without disorientation.
* **Aspect Ratio Rigidity**: Presentation stages and video comparison viewports must maintain mathematically exact aspect ratios (16:9, 9:16, 1:1) independent of screen scaling.
* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.

---

## 2. Kinetic Buttons & Rolling Text Shadow Effects

### Color Fill Button with Vertical Text Roll
This button creates an optical fill effect using layered pseudo-elements while rolling duplicate text via vertical text-shadow displacement:

```html
<a class="cs-btn-fill" href="javascript:void(0)">
  <div class="cs-btn-fill-wrapper">
    <span class="cs-btn-fill-text">Discover More</span>
  </div>
</a>
```

```css
.cs-btn-fill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 12px 28px;
  font-weight: 500;
  color: #ffffff;
  border-radius: 9999px;
  overflow: hidden;
  text-decoration: none;
  z-index: 1;
}

.cs-btn-fill:before {
  content: "";
  position: absolute;
  inset: 0;
  background-color: #0f172a;
  border-radius: 9999px;
  transform-origin: 50% 90%;
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  z-index: -2;
}

.cs-btn-fill:after {
  content: "";
  position: absolute;
  inset: 0;
  background-color: #0284c7;
  border-radius: 9999px;
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  z-index: -1;
}

.cs-btn-fill:hover:before { transform: scale(0.92); }
.cs-btn-fill:hover:after  { transform: translateY(0); }
.cs-btn-fill:active       { transform: scale(0.97); }

.cs-btn-fill-wrapper {
  overflow: hidden;
  white-space: nowrap;
  line-height: 1.2;
}

.cs-btn-fill-text {
  display: inline-block;
  position: relative;
  text-shadow: 0 -2em 0 currentColor;
  transition: transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.cs-btn-fill:hover .cs-btn-fill-text { transform: translateY(2em); }
```

---

## 3. Elastic Range Sliders & Audio Faders

A high-polish range control that dynamically fills its track progress and features tactile knob interaction:

```html
<div class="cs-slider-container">
  <label for="volumeSlider" class="cs-slider-label">Master Output</label>
  <div class="cs-slider-track-wrap">
    <input type="range" id="volumeSlider" min="0" max="100" value="65"
      class="cs-range-slider" style="--slider-pct: 65%;">
  </div>
</div>
```

```css
.cs-range-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  outline: none;
  background: linear-gradient(to right, #38bdf8 0%, #38bdf8 var(--slider-pct), #334155 var(--slider-pct), #334155 100%);
  cursor: pointer;
  transition: background 0.05s linear;
}

.cs-range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cs-range-slider:active::-webkit-slider-thumb { transform: scale(1.3); }
```

---

## 4. Rolling Number Flow & Metric Tickers

Avoid jarring numerical jumps on dashboards or pricing cards. This ticker rolls vertical reels of digits 0 through 9:

```html
<div class="cs-ticker" data-value="1250">
  <div class="cs-digit-col"><div class="cs-digit-reel"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span></div></div>
  <div class="cs-digit-col"><div class="cs-digit-reel"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span></div></div>
  <div class="cs-digit-col"><div class="cs-digit-reel"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span></div></div>
  <div class="cs-digit-col"><div class="cs-digit-reel"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span></div></div>
</div>
```

```javascript
function setTickerValue(tickerEl, numberString) {
  const digits = numberString.split("");
  const reels = tickerEl.querySelectorAll(".cs-digit-reel");
  digits.forEach((digit, index) => {
    if (reels[index]) {
      const val = parseInt(digit, 10) || 0;
      reels[index].style.transform = `translateY(-${val * 2}rem)`;
    }
  });
}
```

---

## 5. Multi-Layer Progressive Optical Blur

Replicates native depth-of-field glass using an 8-layer exponential mask stack. Direction can be `top` or `bottom`:

```html
<div class="cs-progressive-blur">
  <div class="cs-blur-layer b-1"></div>
  <div class="cs-blur-layer b-2"></div>
  <div class="cs-blur-layer b-3"></div>
  <div class="cs-blur-layer b-4"></div>
  <div class="cs-blur-layer b-5"></div>
  <div class="cs-blur-layer b-6"></div>
  <div class="cs-blur-layer b-7"></div>
  <div class="cs-blur-layer b-8"></div>
</div>
```

```css
.cs-progressive-blur { position: absolute; inset: 0; pointer-events: none; z-index: 10; }
.cs-blur-layer       { position: absolute; inset: 0; }

.cs-blur-layer.b-1 { backdrop-filter: blur(1px);   mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%,    rgba(0,0,0,1) 12.5%, rgba(0,0,0,1) 25%,   rgba(0,0,0,0) 37.5%); }
.cs-blur-layer.b-2 { backdrop-filter: blur(2px);   mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 12.5%, rgba(0,0,0,1) 25%,   rgba(0,0,0,1) 37.5%, rgba(0,0,0,0) 50%);   }
.cs-blur-layer.b-3 { backdrop-filter: blur(4px);   mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 25%,   rgba(0,0,0,1) 37.5%, rgba(0,0,0,1) 50%,   rgba(0,0,0,0) 62.5%); }
.cs-blur-layer.b-4 { backdrop-filter: blur(8px);   mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 37.5%, rgba(0,0,0,1) 50%,   rgba(0,0,0,1) 62.5%, rgba(0,0,0,0) 75%);   }
.cs-blur-layer.b-5 { backdrop-filter: blur(16px);  mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 50%,   rgba(0,0,0,1) 62.5%, rgba(0,0,0,1) 75%,   rgba(0,0,0,0) 87.5%); }
.cs-blur-layer.b-6 { backdrop-filter: blur(32px);  mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 62.5%, rgba(0,0,0,1) 75%,   rgba(0,0,0,1) 87.5%, rgba(0,0,0,0) 100%);  }
.cs-blur-layer.b-7 { backdrop-filter: blur(64px);  mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 75%,   rgba(0,0,0,1) 87.5%, rgba(0,0,0,1) 100%); }
.cs-blur-layer.b-8 { backdrop-filter: blur(128px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%); }
```

**Minimal 6-layer shorthand** (from `references/progressive-blur.css`):
* Insert the `.gradient-blur` div inside `<body>`.
* Keep it near the top of the DOM so stacking contexts remain correct.
* Adjust `z-index` to sit above content but below modals.

---

## 6. Quantum Thinking Orbs (Canvas Particle Visualizer)

A fluid canvas particle system that visually conveys AI agent thought cycles across 6 distinct states:

* **States**: `listening` (cyan, slow pulse), `working` (indigo orbit), `searching` (magenta rapid spin), `solving` (emerald convergence), `composing` (amber wave), `shaping` (rose expansion).

```javascript
// Refer to references/thinking-orb.js for complete standalone canvas implementation
const orb = new QuantumThinkingOrb(document.getElementById("orbCanvas"), {
  initialState: "working",
  size: 140,
  particleCount: 75
});
orb.setState("solving");
```

---

## 7. Perimeter Border Beam & Photon Tracer Engine

Renders continuous hardware-accelerated glowing photon border tracers using CSS conic gradients and `@property --angle` rotation with zero layout shift:

```css
@property --cs-beam-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes cs-beam-spin {
  0%   { --cs-beam-angle: 0deg; }
  100% { --cs-beam-angle: 360deg; }
}

.cs-border-beam-container {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.cs-border-beam {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 2px solid transparent;
  -webkit-mask: linear-gradient(transparent, transparent), linear-gradient(#fff, #fff);
  -webkit-mask-composite: source-in, xor;
  mask-composite: exclude;
  background: conic-gradient(
    from var(--cs-beam-angle) at 50% 50%,
    transparent 0deg, transparent 60deg,
    #06b6d4 120deg, #3b82f6 150deg, #a855f7 180deg,
    transparent 240deg, transparent 360deg
  );
  animation: cs-beam-spin 4s linear infinite;
  opacity: 0.85;
}
```

See `references/border-beam.css` for extended customization tokens.

---

## 8. Visceral Liquid Gooey Fluid Engine

Employs an organic SVG filter pipeline (`feGaussianBlur` + `feColorMatrix`) that generates fluid merging, droplet detachment, and coalescing buttons:

```html
<svg xmlns="http://www.w3.org/2000/svg" style="display:none;">
  <defs>
    <filter id="cs-gooey-filter">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="gooey" />
      <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
    </filter>
  </defs>
</svg>

<div class="cs-gooey-container">
  <div class="cs-gooey-bubble">A</div>
  <div class="cs-gooey-bubble">B</div>
  <button class="cs-gooey-btn">Execute Action</button>
</div>
```

See `references/gooey-fluid.css` and `references/gooey-fluid.svg` for standalone implementations.

---

## 9. Dynamic Spring Magnification Dock & Spotlight Bento Grid

### Dynamic Spring Dock
Fluid navigation dock with continuous Gaussian distance falloff and spring scaling on pointer proximity:

```javascript
import { initSpringDock, initSpotlightCards } from "./references/dock-bento.js";

initSpringDock(document.getElementById("agentDock"));
initSpotlightCards(".cs-bento-card");
```

### Premium Surface Border Gradients
Apply subtle gradient-border treatments for dark glass, pricing panels, nav bars, modals, and feature cards without a loud glow:

```css
.cs-gradient-border {
  --surface: rgba(10, 14, 24, 0.72);
  --border-a: rgba(255, 255, 255, 0.34);
  --border-b: rgba(125, 92, 255, 0.36);
  --border-c: rgba(255, 255, 255, 0.08);

  border: 1px solid transparent;
  border-radius: 20px;
  background:
    linear-gradient(var(--surface), var(--surface)) padding-box,
    linear-gradient(135deg, var(--border-a), var(--border-b), var(--border-c)) border-box;
}
```

**Defaults**: `1px` width (use `2px` only for large hero cards or active states); angle `135deg` or `160deg`; keep stops below `0.4` opacity. Subtle always beats shiny.

See `references/gradient-borders.css` for masked pattern variant (for surfaces with complex fills).

### Pixel-Dissolve Card Reveal
A grid veil over the card face dissolves cell by cell along the diagonal on viewport entry:

```javascript
import { pixelDissolve } from "./references/component-motion.js";

pixelDissolve(document.querySelector(".cs-feature-card"), { cellPx: 14, staggerMs: 12 });
```

### Fanned Card Stack
Click-to-focus fan with rotation plus lateral spread driven by custom properties:

```javascript
import { cardStack } from "./references/component-motion.js";

cardStack(document.querySelector(".cs-card-fan"), { fanDeg: 7, spreadPx: 26, activeIndex: 1 });
```

### Staggered Masonry Entrance
Per-item rise with index stagger, unobserved after play so scrolled grids never replay:

```javascript
import { masonryReveal } from "./references/component-motion.js";

masonryReveal(document.querySelector(".cs-masonry"), { staggerMs: 60, risePx: 24 });
```

See `references/component-motion.js` and `references/component-motion.css`.

---

## 10. Universal Motion Transition System

Framework-agnostic namespaced transition tokens, timing curves, and micro-state animators:

* `--cs-ease-spring`: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for elastic overshoots.
* `--cs-ease-out-quint`: `cubic-bezier(0.22, 1, 0.36, 1)` for immediate deceleration.
* `--cs-dur-normal`: `250ms` for seamless interaction feedback.

### Micro-State Utilities
* `.cs-shake-error`: Horizontal shake animation on validation errors.
* `.cs-check-success`: Elastic scale bounce on successful confirmation.
* `.cs-badge-indicator`: Concentric ping radar ring for live notifications.
* `.cs-modal-backdrop` + `.cs-modal-dialog`: Coordinated scale and backdrop blur dialogs.

See `references/universal-transitions.css` for all token definitions and keyframes.

### Micro Spring Kit
Press bounce, spring toggle, fade tooltip, announced toast queue, and pointer bursts:

```javascript
import { toastQueue, pointerBurst } from "./references/micro-springs.js";

const toasts = toastQueue(document.querySelector(".cs-toast-region"));
toasts.show("Workspace saved");
pointerBurst(document.querySelector(".cs-like-button"), { particles: 10 });
```

```html
<input type="checkbox" class="cs-toggle" aria-label="Enable notifications">
<button class="cs-press cs-tip" data-tip="Save workspace">Save</button>
```

Toasts announce through `aria-live`. Bursts are pointer-driven decoration and stay `aria-hidden`.

See `references/micro-springs.js` and `references/micro-springs.css`.

---

## 11. Kinetic Typography & 3D Perspective Tilt Card

### A. Hacker Glyph Scramble Decoder
Translates random characters into clean legible text with smooth progressive resolution:

```javascript
import { scrambleText, init3DTilt } from "./references/kinetic-text.js";

scrambleText(document.querySelector(".cs-scramble-text"), "SYSTEM ONLINE // VERIFIED", 900);
init3DTilt(document.querySelector(".cs-tilt-card"), 15);
```

### B. CSS Alpha Channel Masking
Reveals or conceals elements with crisp hard-cut edges using `mask-image` or `-webkit-mask-image`. Use for text-over-video revealer effects, image-clipped typography, or shaped hero overlays:

```css
.cs-mask-text-reveal {
  -webkit-mask-image: linear-gradient(to right, black 0%, black 60%, transparent 100%);
  mask-image:         linear-gradient(to right, black 0%, black 60%, transparent 100%);
}

/* Shaped mask using inline SVG */
.cs-mask-shape {
  -webkit-mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50'/></svg>");
  mask-image:         url("data:image/svg+xml,...");
  -webkit-mask-size: cover;
  mask-size: cover;
}
```

See `references/kinetic-text.css` for scramble and tilt CSS, `references/css-masking.css` for masking patterns.

### C. Staggered Blur Reveal (Words or Characters)
Progressive disclosure where each segment travels blur plus rise with a midpoint overshoot, gated on viewport entry:

```javascript
import { staggerReveal } from "./references/kinetic-text-reveal.js";

staggerReveal(document.querySelector(".cs-hero-line"), {
  by: "words", blurPx: 10, risePx: 28, staggerMs: 45, durationMs: 550, overshootPx: 5
});
```

Structural bounds are intrinsic (segments occupy final layout before paint). Reduced motion renders the final state instantly.

### D. Split-Letter Rise
Same engine at character granularity (`by: "chars"`, smaller `risePx`, tighter `staggerMs` around 18ms). Reserve character splits for short display strings under 60 characters; longer copy staggers by words to protect readability.

### E. Shine Sweep Display Treatment
A restrained light band crossing display type, one element per viewport maximum:

```html
<span class="cs-shine-text">Launch Sequence</span>
```

### F. Gradient Display Line
Single hero-line treatment in cyan tones with a usage restraint: never body copy, never stacked with shine on the same element. See `references/kinetic-text-reveal.css` (`.cs-text-gradient`).

### G. Typewriter With Layout Reserve
Character output at a fixed rate with a reserved minimum height so surrounding layout never shifts, plus an auto-dismissing caret:

```javascript
import { typewriter } from "./references/kinetic-text-reveal.js";

typewriter(document.querySelector(".cs-terminal-line"), { charsPerSecond: 28, minLines: 2 });
```

### H. Circular Rotating Text
SVG `textPath` on a circular path with rAF rotation, viewport-paused offscreen:

```javascript
import { circularText } from "./references/kinetic-text-reveal.js";

circularText(document.querySelector(".cs-orbit-badge"), { text: "SCROLL FOR MORE ", radius: 90, degreesPerSecond: 12 });
```

See `references/kinetic-text-reveal.js` and `references/kinetic-text-reveal.css` for the full engine.

---

## 12. Atomic Design Token Architecture & Agent Registry Protocol

StyleX-grade type-safe tokens and accessible component contracts:

* `--cs-color-surface-base`: Dark substrate base (`#030712`).
* `--cs-color-surface-card`: Glass panel card background (`#0f172a`).
* `--cs-color-accent-primary`: Brand cyan spotlight (`#06b6d4`).
* `--cs-focus-ring`: WAI-ARIA accessible dual-ring focus outline (`0 0 0 2px #030712, 0 0 0 4px #06b6d4`).

### Agent Component Discovery Protocol (`r/registry.json`)
When building client interfaces, autonomous agents can query component recipes directly from the bundled references:
* `border-beam`: Perimeter conic-gradient border tracer.
* `gooey-fluid`: SVG filter fluid droplet merger.
* `dock-bento`: Spring dock and spotlight card.
* `kinetic-text`: Scramble typography and 3D card tilt.
* `kinetic-text-reveal`: Staggered blur/rise reveals, split-letter rise, shine sweep, gradient display line, typewriter with layout reserve, circular rotating text.
* `component-motion`: Pixel-dissolve card reveal, fanned card stack, staggered masonry entrance.
* `micro-springs`: Press bounce, spring toggle, fade tooltip, announced toast queue, pointer bursts.
* `ambient-drift`: Aurora backdrop bands plus canvas particle drift field.
* `universal-transitions`: Reusable timing curves and micro-states.
* `gradient-borders`: Premium surface padding-box/border-box patterns.
* `progressive-blur`: Multi-layer backdrop-filter depth glass.
* `css-masking`: Alpha channel reveal and shape mask patterns.
* `gsap-choreography`: Timeline, ScrollTrigger, and stagger playbook.
* `threejs-scene`: WebGL 3D scene architecture and GLTF pipeline.
* `cursor-shader`: WebGPU halftone cursor trail with fallback chain.

---

## 13. GSAP Choreography Engine

Use when implementing professional web animations: cinematic hero intros, scroll-driven storytelling, micro-interaction orchestration, and timeline-based stagger sequences.

### Core Tween API

```javascript
// Animate FROM initial values TO current
gsap.from(".cs-hero-title", { opacity: 0, y: 40, duration: 0.9, ease: "power3.out" });

// Staggered reveal sequence
gsap.from(".cs-feature-card", {
  opacity: 0,
  y: 24,
  duration: 0.6,
  stagger: 0.08,
  ease: "expo.out",
  delay: 0.3
});
```

### Timeline Composition

```javascript
const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.7 } });

tl.from(".cs-nav",       { y: -60, opacity: 0 })
  .from(".cs-hero-eyebrow", { opacity: 0, x: -20 }, "-=0.4")
  .from(".cs-hero-title",   { opacity: 0, y: 40 },  "-=0.5")
  .from(".cs-hero-cta",     { opacity: 0, scale: 0.95 }, "-=0.3");
```

### ScrollTrigger Scrub

```javascript
gsap.registerPlugin(ScrollTrigger);

gsap.to(".cs-parallax-image", {
  y: -120,
  ease: "none",
  scrollTrigger: {
    trigger: ".cs-parallax-section",
    start: "top bottom",
    end: "bottom top",
    scrub: 1.5
  }
});

// Pin a section while animating content inside it
ScrollTrigger.create({
  trigger: ".cs-sticky-section",
  start: "top top",
  end: "+=800",
  pin: true,
  onUpdate: (self) => {
    gsap.set(".cs-progress-bar", { scaleX: self.progress });
  }
});
```

### Critical Pitfalls
* Never animate `top`, `left`, `width`, or `height`: use `x`, `y`, `scale` exclusively.
* Always call `ScrollTrigger.refresh()` after dynamic content loads.
* In SPAs, call `ctx.revert()` from a GSAP context on component unmount to prevent memory leaks.
* Wrap all motion in `ScrollTrigger.matchMedia` or `gsap.matchMedia` for reduced-motion respect.

See `references/gsap-choreography.js` for a full hero intro + scroll reveal composition.

---

## 14. WebGL 3D Scene Architecture

Use when implementing real 3D product spins, interactive hero scenes, shader material effects, or 3D data visualization.

### Scene Bootstrap

```javascript
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(width, height, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
camera.position.set(0, 1.5, 4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
});

// Render loop
(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
})();
```

### GLTF Model Loading

```javascript
const loader = new GLTFLoader();
loader.load("/models/product.glb", (gltf) => {
  scene.add(gltf.scene);
}, undefined, console.error);
```

### SPA Cleanup (Critical)

```javascript
// On component unmount, prevent GPU memory leaks
scene.traverse((obj) => {
  if (obj.isMesh) {
    obj.geometry.dispose();
    (Array.isArray(obj.material) ? obj.material : [obj.material])
      .forEach(m => { Object.values(m).forEach(v => v && v.dispose && v.dispose()); m.dispose(); });
  }
});
renderer.dispose();
controls.dispose();
cancelAnimationFrame(rafId);
```

### Critical Pitfalls
* Always set `renderer.setPixelRatio` to at most `2` to prevent GPU overload on high-DPI displays.
* Handle window resize or the scene will appear stretched or cropped.
* Use `powerPreference: "low-power"` for ambient/background scenes.
* Attach `IntersectionObserver` to pause RAF when the canvas is off-screen.

See `references/threejs-scene.js` for a complete bootstrapped 3D scene with GLTF loading and disposal.

---

## 15. WebGPU Halftone Cursor Shader Trail

Implements an interactive WebGPU white twinkling halftone cursor trail with chromatic ripples and film grain, masked through a dot grid. Designed as progressive enhancement with static first-frame fallback.

### Installation & Integration

```bash
npm install shaders
```

```javascript
// React / Next.js
import { ShaderTrail } from "shaders/react";

// Vue
import { ShaderTrail } from "shaders/vue";

// Plain web
import { ShaderTrail } from "shaders";
```

### Node graph (keep all six nodes in order)

```
ChromaFlow -> DotGrid -> ChromaticRipple -> FilmGrain -> Composite -> Output
```

### Progressive Enhancement Gating

```javascript
// Capability gate: load heavy shader module only for eligible visitors
const canUseShaders = navigator.gpu !== undefined && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canUseShaders) {
  const { ShaderTrail } = await import("shaders/react");
  // mount dynamically
}
```

### Fallback Chain (in priority order)
1. WebGPU path: full halftone trail with chromatic ripples.
2. WebGL fallback: simplified pointer glow without halftone.
3. CSS `mix-blend-mode: difference` radial gradient follower for no-WebGL environments.
4. No-JS: static decorative dot grid background.

**Constraints**: preserve the host section's semantic content and static first frame. Do not add another smooth-scroll engine or replace section content. Keep accessibility: all interactive controls remain keyboard-accessible, pointer effects are purely decorative.

See `references/cursor-shader.js` for the complete capability gate + fallback implementation.

---

## 16. Design-First Constraint Specification Skeleton

Use this skeleton when prompting any AI agent for UI generation. Fill all blanks before submitting. Produces consistent, spec-driven output by constraining the parameter space to a single coherent design language:

```text
GOAL
- What are we making? (e.g., landing page hero, onboarding, dashboard, carousel slide)
- Who is it for? (persona)
- What is the success criteria? (clarity, conversion, vibe)

FORMAT
- Size/aspect: (e.g., 1080x1350, 16:9)
- Safe margins: (e.g., 90px)

LAYOUT
- Grid: (e.g., Swiss 6-col, asymmetric 2-col)
- Placement: (e.g., type-left / image-right)
- Hierarchy: H1 -> subhead -> body -> CTA

TYPE SYSTEM
- Font vibe: (e.g., Soehne, Neue Haas, SF Pro)
- Weights: (H1 700, body 400)
- Leading: (tight for H1, readable for body)
- Tracking: (micro labels wider)

COLOR + MATERIAL
- Background: (hex or description)
- Text: (white/ivory/charcoal)
- One accent only: (cyan/lime/purple)
- Texture: (subtle grain, no plastic HDR)

IMAGERY / UI STYLE
- UI style: (minimal / glass / editorial / playful 3D)
- If photo: lighting + crop + texture rules
- If 3D: materials + lighting + softness

COPY (render EXACTLY)
- Line 1:
- Line 2:

CONSTRAINTS (change 1-2 things only per iteration)
- FONT:
- STYLE:
- MODE:

NEGATIVE PROMPT
- No logos, no watermarks
- No extra text beyond provided lines
- No gibberish typography
```

**Iteration rule**: change at most 1 to 2 constraint fields between rounds. Specs beat vibes; references (screenshots, examples) beat paragraphs.

---

## 17. High-Conversion Landing Page Architecture

A landing page is not a homepage. A homepage serves multiple intents. A landing page wins one intent: one offer, one audience, one primary action.

### Pre-Design Checklist
Before designing or writing, gather:
1. **Primary action**: trial, demo, purchase, waitlist, or download.
2. **Audience**: ICP persona, top 3 objections, traffic source (ads, SEO, email, social), and prior knowledge level.
3. **Proof assets**: logo strips, testimonials with photos, numbers, case studies, guarantees.
4. **Constraints**: brand voice (casual vs. professional), design direction (minimal editorial / glass / playful 3D), mobile priority.

### Section Architecture (in order)

| Zone | Sections | Purpose |
| :--- | :--- | :--- |
| **Above fold** | Headline + subheadline, primary CTA, one proof signal, hero visual | Communicate offer and trigger action |
| **Argument** | Problem to solution, benefits (3 to 5 outcome-driven), how it works (3 steps), social proof | Build belief |
| **Objection handling** | FAQ (6 to 12 Q/A), risk reversal (trial, cancel anytime, guarantee), final CTA | Remove friction |

### Layout Archetypes

* **Classic hero + sections**: product is understandable from a hero screenshot, most common.
* **Long-form story**: high-education product, overcoming strong skepticism.
* **Minimal conversion page**: high-intent traffic (email list, known users), short offer.
* **Comparison page**: search intent includes alternatives ("X vs Y", "best for..."), usually paired with SEO.

### Message-Source Matching
Traffic from ads: mirror the ad headline exactly in the hero. Traffic from SEO: lead with the search query keyword. Traffic from email: reference the email subject line in the first sentence.

### Conversion Pitfalls
* Multiple primary CTAs compete and reduce clicks. Use one per section.
* Generic hero imagery erodes trust. Use product screenshots or generated scenes with narrative role.
* Missing risk reversal (no trial, no guarantee language) adds invisible friction above the fold.
* Navigation links leak traffic. Use a minimal nav or no nav on pure conversion pages.

---

## 18. Scroll-Driven Animation & Viewport Reveal Patterns

### Intersection Observer Viewport Reveal

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("cs-in-view");
      observer.unobserve(entry.target); // fire once
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll("[data-reveal]").forEach(el => observer.observe(el));
```

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s var(--cs-ease-out-quint), transform 0.6s var(--cs-ease-out-quint);
}

[data-reveal].cs-in-view {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal] { opacity: 1; transform: none; transition: none; }
}
```

### GSAP ScrollTrigger Scrub (advanced, requires GSAP)
See Section 13. For horizontal scroll sequences, image parallax, and pinned sticky sections, GSAP ScrollTrigger is the correct tool. For simple one-shot viewport reveals, the Intersection Observer approach above is lighter and dependency-free.

---

## 19. Motion Presentation Studio: The 6 Signature Looks

For cinematic product demos, media comparisons, and launch presentation stages, use the 6 unified production design treatments:

| Look Name | Aesthetic Treatment | Primary Palette | Default Framing | Layout Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Studio** | Violet glass, ambient chromatic light | `#171022`, `#a38cd8`, `#d8c5ff` | 16:9 Landscape | Split |
| **Editorial** | Cream paper, stark ink, crimson rules | `#f0eade`, `#1f1b16`, `#be442a` | 1:1 Square | Stack |
| **Signal** | Electric acid lime, tactical ink | `#121c17`, `#d4f44a`, `#eaff80` | 9:16 Portrait | Stack |
| **Cobalt** | Royal blue, high-contrast ice blue | `#0f36b8`, `#1647ee`, `#e5eeff` | 16:9 Landscape | Spotlight |
| **Peach** | Warm poster aesthetic, terracotta ink | `#f4bba6`, `#73372c`, `#e59d85` | 9:16 Portrait | Spotlight |
| **Monochrome** | High-contrast carbon black, silver | `#181818`, `#e4e4e4`, `#ffffff` | 1:1 Square | Split |

---

## 20. WebGL Chromatic Wave Light-Field Material

Creates a dynamic, GPU-accelerated wave crest ribbon effect running behind the presentation stage at 60fps with low-power consumption:

```javascript
import { LightFieldMaterial } from "./references/light-field-shader.js";

const lightField = new LightFieldMaterial(document.querySelector(".cs-light-field-canvas"), {
  primaryColor: [0.44, 0.25, 0.82],
  speed: 0.075,
  powerPreference: "low-power"
});

lightField.setColor([0.83, 0.95, 0.29]); // Switch to Signal lime
```

### Lightweight Ambient Alternative
When WebGL is unavailable or overkill, layer the CSS aurora backdrop with the canvas drift field. Both are decorative, density-capped, and pause offscreen:

```html
<section class="cs-aurora" aria-label="Product highlights">
  <canvas class="cs-drift-canvas" aria-hidden="true"></canvas>
  <!-- content above -->
</section>
```

```javascript
import { driftField } from "./references/ambient-drift.js";

driftField(document.querySelector(".cs-drift-canvas"), { density: 1 / 16000, maxParticles: 90 });
```

See `references/ambient-drift.js` and `references/ambient-drift.css`.

---

## 21. Synchronized Media Comparison Stage Controller

Manages multi-layout switching, dual-stream scrubbing, and keyboard accessibility:

```javascript
import { ComparisonStageController } from "./references/comparison-stage.js";

const controller = new ComparisonStageController(document.querySelector(".cs-motion-stage"), {
  initialLook: "studio",
  initialFormat: "16-9",
  initialLayout: "split",
  durationSeconds: 15.0,
  autoPlay: true
});

// Keyboard: Space = Play/Pause, R = Restart
```

---

## 22. Best Practices for Production Web Interfaces

1. **Avoid CLS on Animated Metric Counters**: Always set fixed container heights and use `font-variant-numeric: tabular-nums` to guarantee steady horizontal geometry.
2. **GPU Low-Power Preference**: When initialising WebGL contexts for ambient backgrounds, specify `powerPreference: 'low-power'` and attach an `IntersectionObserver` to pause render loops when off-screen.
3. **Respect Reduced Motion**: Wrap transform-heavy hover transitions in `@media (prefers-reduced-motion: reduce)` fallbacks. In GSAP, use `gsap.matchMedia` blocks.
4. **Accessible Button Wrapping**: For kinetic text rolls, hide duplicate optical text layers from screen readers using `aria-hidden="true"`.
5. **SPA Memory Hygiene**: Dispose of Three.js geometries, materials, textures, and renderers on component unmount. Cancel `requestAnimationFrame` loops. Revert GSAP contexts with `ctx.revert()`.
6. **Landing Page CTA Discipline**: Never present more than one primary CTA per fold. Competing calls to action statistically reduce conversions.
* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
