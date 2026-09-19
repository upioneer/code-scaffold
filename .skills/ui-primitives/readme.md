# UI Primitives & Micro-Interactions

**Version:** 5
**Target:** `.skills/ui-primitives`
**Category:** Frontend & UI Design
**Keywords:** `ui-primitives`, `micro-interactions`, `gsap`, `scroll-trigger`, `threejs`, `webgpu-shader`, `cursor-trail`, `gradient-borders`, `css-alpha-masking`, `design-first-prompting`, `landing-page-architecture`, `border-beam`, `gooey-fluid`, `spring-dock`, `bento-grid`, `kinetic-typography`, `atomic-tokens`

## Description

The UI Primitives & Micro-Interactions skill is the complete high-fidelity web interface production engine for Code Scaffold agents: from atomic CSS tokens and kinetic component primitives through GSAP choreography timelines, WebGL Three.js 3D scene architecture, WebGPU halftone cursor shader trails, and structured landing page conversion frameworks.

## Capabilities & Use Cases

* **GSAP Choreography Engine**: Professional hero intro timeline composition, scroll-reveal stagger sequences, parallax depth layers, pinned scroll sections, and reduced-motion safe guards using `gsap.matchMedia`. Covers `gsap.to/from/fromTo`, timeline position parameter syntax (absolute, relative, overlap, label), `ease` catalogue (`power`, `expo`, `elastic`, `back`), and stagger patterns (`from: "start|center|end|random"`, `grid`).
* **ScrollTrigger Scrub Architecture**: Scroll-driven storytelling with `trigger`, `start/end`, `scrub`, `pin`, `snap`, and `onUpdate` callbacks. Horizontal scroll sequences, image parallax depth, and `ScrollTrigger.refresh()` for dynamic content. SPA cleanup via `ctx.revert()`.
* **WebGL Three.js 3D Scene Controller**: Full `SceneController` class with bootstrapped renderer, perspective camera, `OrbitControls` with damping, ambient and key lighting, GLTF/Draco model loading, `IntersectionObserver`-based off-screen render pause, pixel ratio clamping at `2`, and complete SPA memory disposal (geometry, material, texture, renderer, controls, RAF).
* **WebGPU Halftone Cursor Shader Trail**: Progressive enhancement cursor effect with four-tier fallback chain: WebGPU halftone (ChromaFlow, DotGrid, ChromaticRipple, FilmGrain, Composite node graph) -> WebGL radial pointer glow -> CSS `mix-blend-mode` radial follower -> static decorative dot grid. Capability gated by `navigator.gpu` and `prefers-reduced-motion`.
* **Premium Surface Gradient Borders**: `padding-box` / `border-box` linear-gradient pattern for dark glass, pricing panels, nav bars, modals, hero cards, and feature cards without loud glow. Masked `::before` pseudo-element variant for complex fills. Hero card variant with 2px width and multi-stop glow.
* **CSS Alpha Channel Masking**: `mask-image` patterns for linear fade reveals, vignettes, circle crops, diamond SVG shapes, gradient text clipping, and animated wipe-reveal transitions. Reduced-motion override included.
* **Perimeter Border Beam Engine**: Hardware-accelerated luminescent border tracers using CSS `@property --cs-beam-angle` and `conic-gradient` rotation on the compositor thread. Configurable velocity, color stops, and glow intensity with zero layout interference.
* **Visceral Liquid Gooey Fluid Engine**: SVG filter pipeline (`feGaussianBlur` + `feColorMatrix`) enabling organic droplet detachment, bubble coalescence, and coalescing morphing tabs. Bubble cluster and liquid coalescing button included.
* **Spring Magnification Dynamic Dock**: Gaussian distance falloff physics for pointer-proximity icon magnification, matching native application dock elasticity.
* **Spotlight Bento Grid**: Responsive bento card layouts with CSS variable mouse-coordinate tracking (`--mouse-x`, `--mouse-y`) powering radial gradient ambient highlight borders.
* **Universal Motion Transition System**: Framework-agnostic namespaced CSS timing tokens (`--cs-ease-spring`, `--cs-ease-out-quint`, `--cs-dur-normal`), error shake, success pop, notification badge ping, and modal spring reveal micro-state animators. FLIP-safe card resize included.
* **Kinetic Typography & 3D Perspective Tilt**: Hacker glyph scramble decoder with configurable duration, and 3D gyroscopic tilt card with dynamic specular glare tracking via `perspective(1000px)` + `rotateX/Y`.
* **Atomic Design Token Architecture**: StyleX-grade type-safe CSS token system covering surface layers, brand accents, border tiers, text hierarchy, elevation shadows, and WAI-ARIA dual-ring keyboard focus contracts.
* **Design-First Constraint Specification Skeleton**: Typed GOAL, FORMAT, LAYOUT, TYPE SYSTEM, COLOR + MATERIAL, IMAGERY, COPY, CONSTRAINTS, and NEGATIVE PROMPT prompt template for consistent AI UI generation. Iteration rule: change at most 1 to 2 fields per round.
* **High-Conversion Landing Page Architecture**: Pre-design checklist (primary action, ICP, proof, constraints), section architecture (above fold, argument, objection handling), layout archetypes (classic hero, long-form story, minimal conversion, comparison), message-source matching (ads, SEO, email), and conversion pitfalls (multiple CTAs, generic imagery, missing risk reversal, navigation leakage).
* **Scroll-Driven Viewport Reveal**: Lightweight dependency-free `IntersectionObserver` pattern for one-shot `[data-reveal]` animations, with CSS-only fallback for reduced-motion.
* **Multi-Layer Progressive Optical Blur**: 8-layer exponential `backdrop-filter` mask stack replicating native depth-of-field glass (top or bottom direction, configurable height and step count).
* **Quantum Thinking Orbs**: Canvas particle system with 6 named AI agent states (listening, working, searching, solving, composing, shaping).
* **Motion Presentation Studio**: 6 signature production design treatments (Studio, Editorial, Signal, Cobalt, Peach, Monochrome) with fixed palettes, default framings, and layout modes for cinematic product demo stages.
* **WebGL Chromatic Wave Light-Field**: GPU-accelerated wave crest ribbon ambient background at 60fps with `low-power` preference and off-screen pause.
* **Synchronized Media Comparison Stage**: Multi-layout switching (split, stack, spotlight), dual-stream scrubbing, keyboard controls (Space, R), and aspect ratio rigidity (16:9, 9:16, 1:1).
* **Agent Component Discovery Protocol**: Bundled `references/` registry with 13 copy-paste modules (gsap-choreography, threejs-scene, cursor-shader, gradient-borders, css-masking, border-beam, gooey-fluid, dock-bento, kinetic-text, universal-transitions, atomic-tokens, progressive-blur, comparison-stage).

## Usage

Invoke this skill when an agent is asked to:
* Implement motion-rich hero sections, animated page intros, or scroll-driven storytelling
* Build 3D product showcases, interactive hero scenes, or GLTF model viewers
* Add cursor-reactive shader effects or WebGPU interactive backgrounds
* Apply premium border gradients, glass card surfaces, or CSS mask reveal effects
* Prompt an AI agent for UI generation using a consistent design-first spec skeleton
* Design or critique a high-conversion SaaS, app, or service landing page
* Implement any kinetic button, counter ticker, elastic slider, progress indicator, or notification ping
* Build a motion presentation stage for product demos or marketing collateral

## Changelog
* **v5** : Standardized ASCII art logo to uniform 6-line ANSI Shadow format.

* **v4**: Added GSAP Choreography Engine (Section 13), WebGL Three.js Scene Architecture (Section 14), WebGPU Halftone Cursor Shader Trail (Section 15), Design-First Constraint Specification Skeleton (Section 16), High-Conversion Landing Page Architecture (Section 17), Scroll-Driven Viewport Reveal (Section 18), Premium Surface Gradient Borders (Section 9 expansion), CSS Alpha Channel Masking (Section 11 expansion). Four new reference files bundled: `gsap-choreography.js`, `threejs-scene.js`, `cursor-shader.js`, `gradient-borders.css`, `css-masking.css`. Skill now covers 22 sections and 13 reference files.
* **v3**: Added Perimeter Border Beam Engine, Visceral Liquid Gooey Fluid Engine, Spring Magnification Dock, Spotlight Bento Grid, Universal Motion Transition System, Kinetic Typography and 3D Perspective Tilt, Atomic Token Architecture. Nine reference files bundled.
* **v2**: Added Motion Presentation Studio (6 signature looks), WebGL Chromatic Wave Light-Field, Synchronized Media Comparison Stage.
* **v1**: Initial release with Kinetic Buttons, Elastic Range Sliders, Rolling Number Tickers, Progressive Optical Blur, Quantum Thinking Orbs.
