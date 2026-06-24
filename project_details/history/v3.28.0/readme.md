# Version 3.28.0 Walkthrough

## Summary of Changes
This release introduces a powerful new architectural skill targeted at advanced web environments: **Scrollytelling**.

## Features Added
1. **Scrollytelling Agent Skill:**
   * Designed a comprehensive agent-focused payload at `.skills/scrollytelling` to provide technical specifications, constraints, and complete code blueprints for building scroll-triggered 3D model manipulations and "production explosion" views.
   * Bootstrapped the core architecture documentation using GSAP (GreenSock Animation Platform) and Three.js as the cornerstone web technologies.
   * Enforced hard constraints regarding asset polygon limits (sub-5MB Draco compressed `.glb`), decoupled rendering using `requestAnimationFrame`, and pure hardware-accelerated vectors to guarantee 60fps+ cross-browser performance.
   * Correctly initialized the skill with strict `meta.json` standards and updated the master `.skills/readme.md` library manifest.
