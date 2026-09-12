---
​‌‍name: UI Primitives & Micro-Interactions
description: High-fidelity interactive web UI components, kinetic buttons, range sliders, rolling number tickers, progressive blur, custom magnetic cursors, and stateful physics-driven micro-interactions.
version: 1
---

# UI Primitives & Micro-Interactions Skill

Use this skill when designing, building, modernizing, or refining interactive web components, kinetic buttons, sliders, custom cursors, rolling metric counters, progressive blur layers, and physics-driven micro-interactions.

* **Entity Mapping**: Modern DOM custom elements, Tailwind CSS utilities, hardware-accelerated CSS transforms, Web Animations API, and HTML5 canvas visualizers.
* **Problem Domain**: Eliminating stiff, generic web interfaces by providing production-ready, highly responsive micro-interactions that operate with zero layout shift and accessible semantics.

---

## 1. Architectural Principles for High-Fidelity UI

Great micro-interactions elevate interfaces from functional to memorable without compromising performance or accessibility:

* **Zero Layout Shift (CLS Invariance)**: Animated components (such as rolling numbers or expanding buttons) must reserve their structural dimensions using fixed height bounds, tabular numerals (`font-variant-numeric: tabular-nums`), or flex wrappers to avoid pushing neighboring layout elements.
* **Hardware Acceleration Protocol**: Animate strictly with `transform` (`translate3d`, `scale`, `rotate`) and `opacity`. Avoid animating layout-triggering properties such as `width`, `height`, `top`, `left`, or `margin`.
* **Complete Interaction State Discipline**: Every interactive primitive must explicitly specify states for default, hover, active (press), focus-visible (accessible keyboard outline), and disabled.
* **Reduced Motion Fallbacks**: Always pair motion-heavy animations with `@media (prefers-reduced-motion: reduce)` fallbacks that preserve instant state changes without disorientation.

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
  background-color: #0f172a; /* Slate 900 base */
  border-radius: 9999px;
  transform-origin: 50% 90%;
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  z-index: -2;
}

.cs-btn-fill:after {
  content: "";
  position: absolute;
  inset: 0;
  background-color: #0284c7; /* Sky 600 fill */
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

Standard HTML range inputs suffer from inconsistent styling across browsers. This recipe normalizes WebKit and Gecko engines while driving an active progress track fill through dynamic CSS custom variables:

```html
<div class="cs-slider-container">
  <div class="cs-slider-header">
    <label for="volume-slider" class="cs-slider-label">Master Output</label>
    <span id="volume-readout" class="cs-slider-val">74%</span>
  </div>
  <input 
    id="volume-slider" 
    type="range" 
    min="0" 
    max="100" 
    value="74" 
    class="cs-range-slider"
    style="--slider-pct: 74%;"
    aria-label="Master output level"
  />
</div>
```

```css
.cs-slider-container {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cs-slider-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #94a3b8;
}

.cs-slider-val {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #f8fafc;
}

.cs-range-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 24px;
  background: transparent;
  cursor: pointer;
}

/* Track: WebKit */
.cs-range-slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 9999px;
  background: linear-gradient(to right, #38bdf8 var(--slider-pct), #334155 var(--slider-pct));
  transition: background 0.1s ease;
}

/* Thumb: WebKit */
.cs-range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #0284c7;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-top: -7px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.cs-range-slider:hover::-webkit-slider-thumb {
  transform: scale(1.15);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
}

.cs-range-slider:active::-webkit-slider-thumb {
  transform: scale(0.95);
}
```

```javascript
const slider = document.getElementById("volume-slider");
const readout = document.getElementById("volume-readout");

slider.addEventListener("input", (e) => {
  const val = e.target.value;
  slider.style.setProperty("--slider-pct", `${val}%`);
  readout.textContent = `${val}%`;
});
```

---

## 4. Rolling Number Flow & Live Metric Tickers

Instead of jarring number updates, rolling tickers display animated vertical reels where single digits slide into place with zero horizontal layout shift:

```html
<div class="cs-ticker" data-val="1248" aria-live="polite">
  <div class="cs-digit-col" data-col="0"><div class="cs-digit-reel">0123456789</div></div>
  <div class="cs-digit-col" data-col="1"><div class="cs-digit-reel">0123456789</div></div>
  <div class="cs-digit-col" data-col="2"><div class="cs-digit-reel">0123456789</div></div>
  <div class="cs-digit-col" data-col="3"><div class="cs-digit-reel">0123456789</div></div>
</div>
```

```css
.cs-ticker {
  display: inline-flex;
  font-size: 64px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  overflow: hidden;
  height: 1em;
  color: #f8fafc;
}

.cs-digit-col {
  height: 1em;
  overflow: hidden;
  position: relative;
}

.cs-digit-reel {
  display: flex;
  flex-direction: column;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.cs-digit-reel span {
  height: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

```javascript
function updateTicker(tickerElement, targetValue) {
  const str = String(targetValue).padStart(4, "0");
  const cols = tickerElement.querySelectorAll(".cs-digit-col");
  cols.forEach((col, idx) => {
    const digit = parseInt(str[idx], 10);
    const reel = col.querySelector(".cs-digit-reel");
    reel.style.transform = `translateY(-${digit * 10}%)`;
  });
}
```

---

## 5. Multi-Layer Progressive Optical Blur

A single CSS `backdrop-filter: blur(20px)` creates an unnatural harsh edge. Progressive optical blur stacks 8 layered elements with exponential blur factors and overlapping gradient masks to emulate optical camera depth:

```html
<div class="cs-progressive-blur cs-blur-bottom" aria-hidden="true">
  <div class="cs-blur-layer layer-1"></div>
  <div class="cs-blur-layer layer-2"></div>
  <div class="cs-blur-layer layer-3"></div>
  <div class="cs-blur-layer layer-4"></div>
  <div class="cs-blur-layer layer-5"></div>
  <div class="cs-blur-layer layer-6"></div>
  <div class="cs-blur-layer layer-7"></div>
  <div class="cs-blur-layer layer-8"></div>
</div>
```

```css
.cs-progressive-blur {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 180px;
  pointer-events: none;
  z-index: 50;
  --direction: to top;
}

.cs-blur-layer {
  position: absolute;
  inset: 0;
}

.layer-1 { z-index: 1; backdrop-filter: blur(0.08px); -webkit-mask-image: linear-gradient(var(--direction), transparent 87.5%, #000 100%); }
.layer-2 { z-index: 2; backdrop-filter: blur(0.16px); -webkit-mask-image: linear-gradient(var(--direction), transparent 75%, #000 87.5%, #000 100%); }
.layer-3 { z-index: 3; backdrop-filter: blur(0.31px); -webkit-mask-image: linear-gradient(var(--direction), transparent 62.5%, #000 75%, #000 87.5%, transparent 100%); }
.layer-4 { z-index: 4; backdrop-filter: blur(0.63px); -webkit-mask-image: linear-gradient(var(--direction), transparent 50%, #000 62.5%, #000 75%, transparent 87.5%); }
.layer-5 { z-index: 5; backdrop-filter: blur(1.25px); -webkit-mask-image: linear-gradient(var(--direction), transparent 37.5%, #000 50%, #000 62.5%, transparent 75%); }
.layer-6 { z-index: 6; backdrop-filter: blur(2.5px);  -webkit-mask-image: linear-gradient(var(--direction), transparent 25%, #000 37.5%, #000 50%, transparent 62.5%); }
.layer-7 { z-index: 7; backdrop-filter: blur(5.0px);  -webkit-mask-image: linear-gradient(var(--direction), transparent 12.5%, #000 25%, #000 37.5%, transparent 50%); }
.layer-8 { z-index: 8; backdrop-filter: blur(10.0px); -webkit-mask-image: linear-gradient(var(--direction), transparent 0%, #000 12.5%, #000 25%, transparent 37.5%); }
```

---

## 6. Quantum Thinking Orbs & Ambient Canvas Visualizers

The Quantum Thinking Orb renders a fluid multi-color ambient sphere reflecting agent computational states:

* **Listening State**: Calm pulsing sapphire and violet waves.
* **Working / Searching State**: Fast rotating radiant amber and cyan orbits.
* **Solving / Shaping State**: High-velocity energetic emerald and prismatic plasma bursts.

```html
<div class="cs-orb-stage">
  <canvas id="thinking-orb-canvas" width="120" height="120" role="img" aria-label="Agent reasoning orb"></canvas>
  <span class="cs-orb-label" id="orb-label">Agent Listening...</span>
</div>
```

```css
.cs-orb-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.cs-orb-label {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.05em;
  background: linear-gradient(90deg, #94a3b8 0%, #ffffff 50%, #94a3b8 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: cs-shimmer 2.5s infinite linear;
}

@keyframes cs-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 7. Custom Magnetic Pointer & Cursor Dynamics

Magnetic cursors elevate user experience on desktop screens by tracking cursor position and pulling toward nearby clickable elements:

```javascript
class MagneticCursor {
  constructor() {
    // Disable on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    this.cursor = document.createElement("div");
    this.cursor.className = "cs-magnetic-cursor";
    document.body.appendChild(this.cursor);

    this.pos = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };

    window.addEventListener("mousemove", (e) => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
    });

    this.render();
    this.bindMagneticElements();
  }

  bindMagneticElements() {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.3;
        const deltaY = (e.clientY - centerY) * 0.3;
        el.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate3d(0, 0, 0)";
        el.style.transition = "transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)";
      });
    });
  }

  render() {
    this.pos.x += (this.target.x - this.pos.x) * 0.2;
    this.pos.y += (this.target.y - this.pos.y) * 0.2;
    this.cursor.style.transform = `translate3d(${this.pos.x - 12}px, ${this.pos.y - 12}px, 0)`;
    requestAnimationFrame(() => this.render());
  }
}
```

---

## 8. Segmented Pill Controls & Toggle Switches

Replaces traditional tab bars with sliding pill surfaces using single active bounding box transitions:

```html
<div class="cs-pill-group" role="radiogroup" aria-label="Plan billing cycle">
  <div class="cs-pill-highlight"></div>
  <button type="button" class="cs-pill-btn active" role="radio" aria-checked="true" data-index="0">Monthly</button>
  <button type="button" class="cs-pill-btn" role="radio" aria-checked="false" data-index="1">Annual (Save 20%)</button>
</div>
```

```css
.cs-pill-group {
  display: inline-flex;
  position: relative;
  background-color: #1e293b;
  padding: 4px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.cs-pill-btn {
  position: relative;
  z-index: 2;
  background: transparent;
  border: 0;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 18px;
  border-radius: 9999px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.cs-pill-btn.active {
  color: #ffffff;
}

.cs-pill-highlight {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  background-color: #0284c7;
  border-radius: 9999px;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  z-index: 1;
}
```

---

## 9. Interactive Sandbox & Testing Workspace

A full interactive demo showcasing all components live is available in `sandbox/index.html`. It includes:

* **Live Interactive Controls**: Tweak sliders, press kinetic buttons, cycle orb reasoning states, and observe ticker animations in real time.
* **Copy-to-Clipboard Code Drawers**: Direct one-click code copying for each element (HTML, CSS, and JS).
* **Dark & Light Mode Toggle**: Inspect rendering across high contrast and dark surfaces.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
