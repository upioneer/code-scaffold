---
​‌‍name: UI Primitives & Micro-Interactions
description: High-fidelity interactive web UI components, kinetic buttons, range sliders, rolling number tickers, progressive blur, custom magnetic cursors, WebGL chromatic wave light-fields, synchronized comparison stages, and 6 signature motion looks.
version: 2
---

# UI Primitives & Micro-Interactions Skill

Use this skill when designing, building, modernizing, or refining interactive web components, kinetic buttons, sliders, custom cursors, rolling metric counters, progressive blur layers, WebGL light fields, synchronized media comparison stages, and motion design looks.

* **Entity Mapping**: Modern DOM custom elements, Tailwind CSS utilities, hardware-accelerated CSS transforms, Web Animations API, WebGL shader canvases, and HTML5 video/canvas comparison stages.
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

```javascript
const slider = document.getElementById('volumeSlider');
slider.addEventListener('input', (e) => {
  const pct = ((e.target.value - e.target.min) / (e.target.max - e.target.min)) * 100;
  e.target.style.setProperty('--slider-pct', `${pct}%`);
});
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
  const digits = numberString.split('');
  const reels = tickerEl.querySelectorAll('.cs-digit-reel');
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

Replicates Apple-grade native iOS/macOS depth-of-field glass using an 8-layer exponential mask stack:

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
const orb = new QuantumThinkingOrb(document.getElementById('orbCanvas'), {
  initialState: 'working',
  size: 140,
  particleCount: 75
});

// Change state dynamically
orb.setState('solving');
```

---

## 7. Motion Presentation Studio: The 6 Signature Looks

For cinematic product demos, media comparisons, and launch presentation stages, use the 6 unified production design treatments:

### Look Manifest

| Look Name | Aesthetic Treatment | Primary Palette | Default Framing | Layout Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Studio** | Violet glass, ambient chromatic light | `#171022`, `#a38cd8`, `#d8c5ff` | 16:9 Landscape | Split |
| **Editorial** | Cream paper, stark ink, crimson rules | `#f0eade`, `#1f1b16`, `#be442a` | 1:1 Square | Stack |
| **Signal** | Electric acid lime, tactical ink | `#121c17`, `#d4f44a`, `#eaff80` | 9:16 Portrait | Stack |
| **Cobalt** | Royal blue, high-contrast ice blue | `#0f36b8`, `#1647ee`, `#e5eeff` | 16:9 Landscape | Spotlight |
| **Peach** | Warm poster aesthetic, terracotta ink | `#f4bba6`, `#73372c`, `#e59d85` | 9:16 Portrait | Spotlight |
| **Monochrome** | High-contrast carbon black, silver | `#181818`, `#e4e4e4`, `#ffffff` | 1:1 Square | Split |

### HTML Structure for Presentation Stage
```html
<div class="cs-motion-stage" data-motion-look="studio" data-format="16-9" data-layout="split">
  <canvas class="cs-light-field-canvas"></canvas>
  <div class="cs-motion-viewport">
    <div class="cs-media-pane cs-media-primary">
      <div class="cs-media-header">
        <span>Reconstructed Animation</span>
        <span class="cs-badge">60 FPS</span>
      </div>
      <div class="cs-media-canvas" id="primaryCanvas"></div>
    </div>
    <div class="cs-media-pane cs-media-secondary">
      <div class="cs-media-header">
        <span>Original Reference</span>
        <span class="cs-badge">Reference</span>
      </div>
      <div class="cs-media-canvas" id="secondaryCanvas"></div>
    </div>
  </div>
  <div class="cs-transport-bar">
    <button type="button" class="cs-play-btn">Play</button>
    <div class="cs-timecode">00:00.0 / 00:15.0</div>
    <div class="cs-scrub-track">
      <div class="cs-scrub-progress"></div>
    </div>
  </div>
</div>
```

---

## 8. WebGL Chromatic Wave Light-Field Material

Creates a dynamic, GPU-accelerated wave crest ribbon effect running behind the presentation stage at 60fps with low-power consumption:

```javascript
import { LightFieldMaterial } from './references/light-field-shader.js';

const canvas = document.querySelector('.cs-light-field-canvas');
const lightField = new LightFieldMaterial(canvas, {
  primaryColor: [0.44, 0.25, 0.82], // Studio violet RGB
  speed: 0.075,
  powerPreference: 'low-power'
});

// Update colors when switching looks
lightField.setColor([0.83, 0.95, 0.29]); // Signal lime
```

---

## 9. Synchronized Media Comparison Stage Controller

Manages multi-layout switching, dual-stream scrubbing, and keyboard accessibility:

```javascript
import { ComparisonStageController } from './references/comparison-stage.js';

const stageEl = document.querySelector('.cs-motion-stage');
const controller = new ComparisonStageController(stageEl, {
  initialLook: 'studio',
  initialFormat: '16-9',
  initialLayout: 'split',
  durationSeconds: 15.0,
  autoPlay: true
});

// Keyboard controls are bound automatically:
// - Space : Toggle Play / Pause
// - R     : Restart playback
```

---

## 10. Best Practices for Production Web Interfaces

1. **Avoid CLS on Animated Metric Counters**: Always set fixed container heights and use `font-variant-numeric: tabular-nums` to guarantee steady horizontal geometry.
2. **GPU Low-Power Preference**: When initialising WebGL contexts for ambient backgrounds, specify `powerPreference: 'low-power'` and attach an `IntersectionObserver` to pause render loops when off-screen.
3. **Respect Reduced Motion**: Wrap transform-heavy hover transitions in `@media (prefers-reduced-motion: reduce)` fallbacks.
4. **Accessible Button Wrapping**: For kinetic text rolls, hide duplicate optical text layers from screen readers using `aria-hidden="true"`.
* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
