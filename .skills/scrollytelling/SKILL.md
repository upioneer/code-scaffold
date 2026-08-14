---
name: Scrollytelling
description: Design architecture, workflows, and code implementations for scroll-triggered 3D model manipulation, interactive "production explosion" views, and cinematic WebGL environmental storytelling.
version: 3
---

# Technical Specification: High-Fidelity Scroll-Driven Animations & Cinematic Scrollytelling

This document provides a comprehensive overview of the design architecture, workflows, libraries, and code implementations required to build a modern, high-performance website featuring scroll-triggered 3D model manipulation, interactive "production explosion" views, and continuous cinematic environmental storytelling (e.g., Kage).

---

## 1. Core Architectural Concepts

To build an impressive scrollytelling experience, you must understand the conceptual architecture that separates traditional scroll behavior from animation-driven scroll behavior.

### A. Scrollytelling & Scroll-Driven Animation
In standard web design, scrolling changes the `window.scrollY` position to reveal lower portions of a page. In high-fidelity scrollytelling, scrolling is intercepted or mapped to a global timeline. The scrollbar essentially becomes the scrubbing thumb of a video player or an animation timeline.

### B. Scroll Pinning (Sticky Viewports)
To keep a product or 3D scene centered on the screen while it animates, the container element must be "pinned." This is achieved using CSS `position: sticky; top: 0;` or programmatic pinning via JavaScript. The container locks in the viewport while the user scrolls through a designated track of blank vertical space (e.g., `300vh`). The animation plays over this distance, and once complete, the container unpins.

### C. Exploded Views & Spatial Interpolation
An "exploded view" animation takes a unified 3D object and translates its constituent parts outward along specified axes (typically the Z-axis) relative to the object's origin. 
* **The Math:** Each sub-mesh is assigned a directional vector $V$ and a maximum translation distance $D$. As scroll progress passes from $0.0$ to $1.0$, the component's position is updated: 
    $$\text{Position} = \text{Base Position} + (V \times D \times \text{Progress})$$

---

## 2. Cinematic Environmental Storytelling (The "Kage" Architecture)

Beyond exploding models, scrollytelling can drive a continuous camera path through a live procedural environment. This approach treats the page as an editorial art book moving through a live 3D world.

### A. Procedural Scene Construction & Atmosphere
* **Live Environmental Layer:** Use a fixed full-viewport Three.js canvas (`z-index: 0`) as the foundation.
* **Procedural Assets:** Build terrains, structures (e.g., temples, torii, stairs, lanterns), and atmospheric elements (fog, rain, drifting leaves, embers, large moons) procedurally in WebGL to save bandwidth and maintain a live, reactive world.
* **Cinematic Post-Processing:** Enhance the raw WebGL output with restrained post-processing passes: bloom, film grain, vignette, depth haze, and dramatic lighting contrasts (e.g., warm shoji light against cold moonlight).

### B. Editorial Layering & Alpha-Preserving Cutouts
* **Hybrid DOM/WebGL:** Layer standard DOM elements over the WebGL canvas (`z-index: 10+`).
* **Foreground Collages:** Use alpha-preserving WebP cutouts (e.g., grass, maple branches, ruins, pines) anchored at the bottom of the active viewport to create extreme foreground depth.
* **Editorial Cards:** Frame text content within elegant, constrained grids using oversized left-aligned headings, vertical display typography, and fine rules. Layer generated cinematic stills into these editorial cards.

### C. Continuous Camera Choreography
* **No Hard Cuts:** Drive one continuous camera path using the scroll position. Each DOM section should feel like a newly composed shot along that path rather than a hard scene replacement.
* **Zero-Build Portability:** For standalone cinematic experiences, vendor a single Three.js build (e.g., r149) via CDN in a single `index.html` file, keeping the site portable and free of complex build steps.
* **Constrained Palettes:** Stick to highly evocative, restricted color palettes to maintain a premium feel (e.g., near-black, blue-charcoal, warm amber, bone white, and vermilion).

---

## 3. Technical Implementation Strategies

### Strategy 1: Real-Time WebGL / Three.js (True 3D & Procedural Environments)
The scene is loaded into the browser as a 3D asset or built procedurally. JavaScript manipulates the camera, lighting, and mesh nodes in real time based on scroll data.
* **Pros:** Dynamic lighting, infinite camera angles, particle systems (rain, leaves), native resolution scaling, interactive hover states.
* **Cons:** Highly CPU/GPU intensive, requires asset optimization (Draco compression) and careful draw-call management.

### Strategy 2: High-Fidelity Video/Canvas Scrubbing (Pseudo-3D)
The 3D explosion view is pre-rendered in software like Blender as a high-quality image sequence. JavaScript preloads these frames and draws them to an HTML5 `<canvas>` based on the scroll percentage.
* **Pros:** Runs smoothly on low-end devices, supports cinematic ray-traced lighting that is impossible to render in real time on the web.
* **Cons:** Fixed camera track, large total payload across the frame sequence.

---

## 4. Mandatory Engineering Constraints & Guardrails

### A. Asset Optimization & Polygon Limits
* **Agent Directive:** All imported 3D assets must be run through `gltf-pipeline` utilizing Draco mesh compression. High-poly surfaces must be baked to normal maps. Total aggregate payload size for 3D assets must target sub-5MB limits. Procedural generation should be favored for environmental filler.

### B. GPU Thread Mitigation & DOM Reflow Avoidance
* **Agent Directive:** Never write layout properties (`width`, `height`, `top`, `margin`) dynamically inside scroll loops. Structural updates must be restricted to hardware-accelerated vectors using CSS 3D transforms (`transform: translate3d()`, `opacity`) or direct low-level WebGL matrix mutations.

### C. Frame Rate Synchronization
* **Agent Directive:** Frame updates must be decoupled from the raw scroll event thread. Synchronize scene updates using a custom rendering loop powered exclusively by `requestAnimationFrame`.

---

## 5. Recommended Production Libraries

### A. Animation & Scroll Orchestration
* **GSAP (GreenSock Animation Platform):** The industry standard for high-performance web animations.
* **GSAP ScrollTrigger:** Syncs GSAP timelines directly to viewport scroll position, handling pinning and scrub delays.
* **Lenis (by Studio Freight):** Normalizes scrolling across trackpads, mouse wheels, and touch devices for buttery smooth interpolation.

### B. 3D Rendering
* **Three.js:** The underlying low-level WebGL library used to create scenes, cameras, lights, and loaders.
* **React Three Fiber (R3F):** If building in React, turns Three.js into declarative components with utility hooks like `useScroll`.

---

## 6. Blueprint Structure (Zero-Build Cinematic Scrollytelling)

To build a standalone cinematic scrollytelling page (like Kage), follow this DOM structure:

```html
<body>
  <!-- 1. Environmental WebGL Layer -->
  <div id="gl" style="position: fixed; inset: 0; z-index: 0;"></div>
  
  <!-- 2. Post-Processing Overlays -->
  <div id="vignette" style="position: fixed; inset: 0; z-index: 55; pointer-events: none;"></div>
  <div id="grain" style="position: fixed; inset: -1px; z-index: 60; pointer-events: none; opacity: 0.05;"></div>
  
  <!-- 3. Editorial DOM Sections (Scrollable) -->
  <main class="page" style="position: relative; z-index: 10;">
    <section class="hero">...</section>
    <section class="chapter" data-fg="gate">
      <!-- Editorial Cards & Copy -->
      <div class="editorial-grid">...</div>
      
      <!-- 4. Foreground Alpha-Cutouts (Pin to viewport bottom via CSS/JS) -->
      <div class="fg">
        <div class="fg-el fg-wall"><img src="wall.webp" alt=""></div>
        <div class="fg-el fg-pine"><img src="pine.webp" alt=""></div>
      </div>
  </main>
</body>
```

---

## 7. Bundled Visual Demo (Sandbox)

This skill ships with a working cinematic visual demo proving out the Zero-Build WebGL and GSAP architecture. 
Agents should reference or copy the file located at `.skills/scrollytelling/sandbox/index.html` to provide users with a tangible, ready-to-use starting point for high-fidelity scrollytelling.
