# Scrollytelling

**Version:** 3
**Target:** `.skills/scrollytelling`

## Description
Design architecture, workflows, and code implementations for scroll-triggered 3D model manipulation, interactive 'production explosion' views, and cinematic WebGL environmental storytelling.

## Capabilities & Use Cases
* **High-Fidelity Scrollytelling Architecture**: Provides deep conceptual frameworks for intercepting standard web scrolling to orchestrate global animation timelines instead of traditional viewport movements.
* **Cinematic Environmental Storytelling**: Implements architecture for treating the page as an editorial art book moving through a live procedural 3D world (inspired by projects like Kage).
* **Continuous Camera Choreography**: Directs continuous camera paths driven by scroll position, ensuring each section feels like a newly composed shot along a single path rather than hard scene replacements.
* **Procedural Scene Construction**: Details the use of WebGL to build environments and atmospheric effects (fog, rain, embers, drifting leaves) procedurally, minimizing payload sizes.
* **Editorial Layering & Alpha Cutouts**: Outlines techniques for layering standard DOM elements, generated cinematic stills, and alpha-preserving WebP foreground cutouts over a live WebGL canvas to create extreme depth and parallax.
* **Cinematic Post-Processing**: Includes constrained post-processing guidelines for WebGL (restrained bloom, film grain, vignette, depth haze, and dramatic lighting contrasts).
* **Scroll Pinning & Spatial Interpolation**: Outlines exact methodologies for using `position: sticky` and programmatic pinning to lock viewports, while mathematically calculating spatial interpolation for 3D components based on scroll progression.
* **Real-Time WebGL vs. Pre-Rendered Sequences**: Evaluates and implements two distinct strategies: True 3D (Three.js/WebGL) versus Pseudo-3D (canvas scrubbing of pre-rendered frame sequences).
* **Strict Performance Guardrails**: Enforces critical rendering rules to prevent DOM reflow jank, including mandated Draco mesh compression, strict avoidance of CSS layout mutations within scroll loops, and custom `requestAnimationFrame` loops.
* **Production Library Integration**: Integrates the industry-standard triad of tools: GSAP, GSAP ScrollTrigger, and Lenis for smooth scrolling and touch normalization.
* **Complete Template Code & Blueprints**: Includes structural DOM blueprints for zero-build standalone cinematic experiences using vendored Three.js.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v3** : Massive expansion incorporating cinematic WebGL environmental storytelling patterns derived from the Kage project (procedural scenes, continuous camera paths, alpha-preserving WebP foregrounds, and editorial layering).
* **v2** : Expanded capability descriptions
* **v1** : Add Scrollytelling skill for high fidelity 3D web animations
