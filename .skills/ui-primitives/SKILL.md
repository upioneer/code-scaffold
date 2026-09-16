---
​‌‍name: UI Primitives & Micro-Interactions
description: High-fidelity interactive web UI components, perimeter border beams, liquid gooey physics, spring magnification docks, spotlight bento grids, universal motion transitions, kinetic typography, and atomic tokens.
version: 3
---

# UI Primitives & Micro-Interactions Skill

Use this skill when designing, building, modernizing, or refining interactive web components, kinetic buttons, perimeter border beams, liquid gooey physics, spring magnification docks, spotlight bento grids, universal motion transitions, kinetic typography, and atomic tokens.

* **Entity Mapping**: Modern DOM custom elements, Tailwind CSS utilities, hardware-accelerated CSS transforms, Web Animations API, SVG filter pipelines, WebGL shader canvases, and HTML5 video/canvas comparison stages.
* **Problem Domain**: Eliminating stiff, generic web interfaces by providing production-ready, highly responsive micro-interactions and cinematic motion presentation stages that operate with zero layout shift and accessible semantics.

---

## 1. Architectural Principles for High-Fidelity UI

Great micro-interactions elevate interfaces from functional to memorable without compromising performance or accessibility:

* **Zero Layout Shift (CLS Invariance)**: Animated components (such as rolling numbers or expanding buttons) must reserve their structural dimensions using fixed height bounds, tabular numerals (`font-variant-numeric: tabular-nums`), or flex wrappers to avoid pushing neighboring layout elements.
* **Hardware Acceleration Protocol**: Animate strictly with `transform` (`translate3d`, `scale`, `rotate`) and `opacity`. Avoid animating layout-triggering properties such as `width`, `height`, `top`, `left`, or `margin`.
* **Complete Interaction State Discipline**: Every interactive primitive must explicitly specify states for default, hover, active (press), focus-visible (accessible keyboard outline), and disabled.
* **Reduced Motion Fallbacks**: Always pair motion-heavy animations with `@media (prefers-reduced-motion: reduce)` fallbacks that preserve instant state changes without disorientation.
* **Aspect Ratio Rigidity**: Presentation stages and video comparison viewports must maintain mathematically exact aspect ratios (16:9, 9:16, 1:1) independent of screen scaling.

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

.cs-btn-fill:hover:before {
  transform: scale(0.92);
}

.cs-btn-fill:hover:after {
  transform: translateY(0);
}

.cs-btn-fill:active {
  transform: scale(0.97);
}

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

.cs-btn-fill:hover .cs-btn-fill-text {
  transform: translateY(2em);
}
```

---

## 3. Elastic Range Sliders & Audio Faders

A high-polish range control that dynamically fills its track progress and features tactile knob interaction:

```html
<div class="cs-slider-container">
  <label for="volumeSlider" class="cs-slider-label">Master Output</label>
  <div class="cs-slider-track-wrap">
    <input 
      type="range" 
      id="volumeSlider" 
      min="0" 
      max="100" 
      value="65" 
      class="cs-range-slider"
      style="--slider-pct: 65%;"
    >
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

.cs-range-slider:active::-webkit-slider-thumb {
  transform: scale(1.3);
}

.cs-range-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  border: none;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cs-range-slider:active::-moz-range-thumb {
  transform: scale(1.3);
}
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

```css
.cs-ticker {
  display: inline-flex;
  font-family: var(--font-mono, monospace);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  height: 2rem;
  overflow: hidden;
  font-variant-numeric: tabular-nums;
}

.cs-digit-col {
  height: 2rem;
  overflow: hidden;
  position: relative;
}

.cs-digit-reel {
  display: flex;
  flex-direction: column;
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.cs-digit-reel span {
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
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

Replicates native depth-of-field glass using an 8-layer exponential mask stack:

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
.cs-progressive-blur {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.cs-blur-layer {
  position: absolute;
  inset: 0;
}

.cs-blur-layer.b-1 { backdrop-filter: blur(1px); -webkit-backdrop-filter: blur(1px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 37.5%); }
.cs-blur-layer.b-2 { backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 37.5%, rgba(0,0,0,0) 50%); }
.cs-blur-layer.b-3 { backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 25%, rgba(0,0,0,1) 37.5%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 62.5%); }
.cs-blur-layer.b-4 { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 37.5%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 62.5%, rgba(0,0,0,0) 75%); }
.cs-blur-layer.b-5 { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 62.5%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 87.5%); }
.cs-blur-layer.b-6 { backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 62.5%, rgba(0,0,0,1) 75%, rgba(0,0,0,1) 87.5%, rgba(0,0,0,0) 100%); }
.cs-blur-layer.b-7 { backdrop-filter: blur(64px); -webkit-backdrop-filter: blur(64px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 75%, rgba(0,0,0,1) 87.5%, rgba(0,0,0,1) 100%); }
.cs-blur-layer.b-8 { backdrop-filter: blur(128px); -webkit-backdrop-filter: blur(128px); mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%); }
```

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

// Change state dynamically
orb.setState("solving");
```

---

## 7. Perimeter Border Beam & Photon Tracer Engine

Renders continuous hardware accelerated glowing photon border tracers using CSS conic gradients and `@property --angle` rotation with zero layout shift:

```html
<div class="cs-border-beam-container">
  <div class="cs-border-beam cs-border-beam-glow"></div>
  <div class="p-8">
    <h3 class="text-xl font-bold text-white">Autonomous Agent Matrix</h3>
    <p class="text-slate-400 mt-2">Dynamic perimeter tracer operates on dedicated compositor thread.</p>
  </div>
</div>
```

```css
@property --cs-beam-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes cs-beam-spin {
  0% { --cs-beam-angle: 0deg; }
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
    transparent 0deg,
    transparent 60deg,
    #06b6d4 120deg,
    #3b82f6 150deg,
    #a855f7 180deg,
    transparent 240deg,
    transparent 360deg
  );
  animation: cs-beam-spin 4s linear infinite;
  opacity: 0.85;
}
```

---

## 8. Visceral Liquid Gooey Fluid Engine

Employs an organic SVG filter pipeline (`feGaussianBlur` + `feColorMatrix`) that generates fluid merging, droplet detachment, and coalescing buttons:

```html
<!-- Include the SVG Filter in the document -->
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

```css
.cs-gooey-container {
  filter: url("#cs-gooey-filter");
  display: inline-flex;
  align-items: center;
  gap: 1.5rem;
}

.cs-gooey-bubble {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.cs-gooey-bubble:hover {
  transform: scale(1.2);
}
```

---

## 9. Dynamic Spring Magnification Dock & Spotlight Bento Grid

### Dynamic Spring Dock
Fluid navigation dock with continuous Gaussian distance falloff and spring scaling on pointer proximity:

```html
<nav class="cs-dock-wrapper" id="agentDock">
  <div class="cs-dock-item" data-tooltip="Terminal">
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
    <span class="cs-dock-tooltip">Terminal</span>
  </div>
  <div class="cs-dock-item" data-tooltip="Security">
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
    <span class="cs-dock-tooltip">Security</span>
  </div>
</nav>
```

```javascript
import { initSpringDock, initSpotlightCards } from "./references/dock-bento.js";

// Initialize Spring Magnification on Dock
initSpringDock(document.getElementById("agentDock"));

// Initialize Mouse Coordinate Spotlight on Bento Cards
initSpotlightCards(".cs-bento-card");
```

---

## 10. Universal Motion Transition System

Framework agnostic namespaced transition tokens, timing curves, and micro-state animators:

* `--cs-ease-spring`: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for elastic overshoots.
* `--cs-ease-out-quint`: `cubic-bezier(0.22, 1, 0.36, 1)` for immediate deceleration.
* `--cs-dur-normal`: `250ms` for seamless interaction feedback.

### Micro-State Utilities:
* `.cs-shake-error`: Horizontal shake animation on validation errors.
* `.cs-check-success`: Elastic scale bounce on successful confirmation.
* `.cs-badge-indicator`: Concentric ping radar ring for live notifications.
* `.cs-modal-backdrop` + `.cs-modal-dialog`: Coordinated scale and backdrop blur dialogs.

---

## 11. Kinetic Typography & 3D Perspective Tilt Card

### A. Hacker Glyph Scramble Decoder
Translates random characters into clean legible text with smooth progressive resolution:

```javascript
import { scrambleText, init3DTilt } from "./references/kinetic-text.js";

const textEl = document.querySelector(".cs-scramble-text");
scrambleText(textEl, "SYSTEM ONLINE // VERIFIED", 900);

// Initialize 3D Gyroscopic Perspective Tilt with Dynamic Glare
init3DTilt(document.querySelector(".cs-tilt-card"), 15);
```

### B. 3D Perspective Tilt HTML & CSS
```html
<div class="cs-tilt-card">
  <div class="cs-tilt-card-content">
    <h4 class="text-lg font-bold text-white">Autonomous Scaffolding</h4>
    <p class="text-slate-400 text-sm mt-1">Multi-perspective gyroscopic tracking.</p>
  </div>
</div>
```

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
* `universal-transitions`: Reusable timing curves and micro-states.

---

## 13. Motion Presentation Studio: The 6 Signature Looks

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

## 14. WebGL Chromatic Wave Light-Field Material

Creates a dynamic, GPU-accelerated wave crest ribbon effect running behind the presentation stage at 60fps with low-power consumption:

```javascript
import { LightFieldMaterial } from "./references/light-field-shader.js";

const canvas = document.querySelector(".cs-light-field-canvas");
const lightField = new LightFieldMaterial(canvas, {
  primaryColor: [0.44, 0.25, 0.82], // Studio violet RGB
  speed: 0.075,
  powerPreference: "low-power"
});

// Update colors when switching looks
lightField.setColor([0.83, 0.95, 0.29]); // Signal lime
```

---

## 15. Synchronized Media Comparison Stage Controller

Manages multi-layout switching, dual-stream scrubbing, and keyboard accessibility:

```javascript
import { ComparisonStageController } from "./references/comparison-stage.js";

const stageEl = document.querySelector(".cs-motion-stage");
const controller = new ComparisonStageController(stageEl, {
  initialLook: "studio",
  initialFormat: "16-9",
  initialLayout: "split",
  durationSeconds: 15.0,
  autoPlay: true
});

// Keyboard controls are bound automatically:
// - Space : Toggle Play / Pause
// - R     : Restart playback
```

---

## 16. Best Practices for Production Web Interfaces

1. **Avoid CLS on Animated Metric Counters**: Always set fixed container heights and use `font-variant-numeric: tabular-nums` to guarantee steady horizontal geometry.
2. **GPU Low-Power Preference**: When initialising WebGL contexts for ambient backgrounds, specify `powerPreference: 'low-power'` and attach an `IntersectionObserver` to pause render loops when off-screen.
3. **Respect Reduced Motion**: Wrap transform-heavy hover transitions in `@media (prefers-reduced-motion: reduce)` fallbacks.
4. **Accessible Button Wrapping**: For kinetic text rolls, hide duplicate optical text layers from screen readers using `aria-hidden="true"`.
* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
