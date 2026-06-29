# Scrollytelling

**Version:** 1
**Target:** `.skills/scrollytelling`

## Description
Design architecture, workflows, and code implementations for scroll triggered 3D model manipulation and interactive 'production explosion' views.

## Capabilities & Use Cases
* Core Architectural Concepts
* A. Scrollytelling & Scroll Driven Animation
* B. Scroll Pinning (Sticky Viewports)
* C. Exploded Views & Spatial Interpolation
* Technical Implementation Strategies
* Strategy 1: Real Time WebGL / Three.js (True 3D)
* Strategy 2: High Fidelity Video/Canvas Scrubbing (Pseudo 3D)
* Mandatory Engineering Constraints & Guardrails
* A. Asset Optimization & Polygon Limits
* B. GPU Thread Mitigation & DOM Reflow Avoidance
* C. Frame Rate Synchronization
* Recommended Production Libraries
* A. Animation & Scroll Orchestration
* B. 3D Rendering (For Strategy 1)
* Complete Code Template (Vanilla JS + GSAP + Three.js)

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v1** : Add Scrollytelling skill for high fidelity 3D web animations
