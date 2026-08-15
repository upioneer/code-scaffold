---
name: Kinetic Canvas
description: Advanced WebGL shaders and interactive HTML canvases wrapped as proprietary native React components for Code Scaffold.
version: 5
---

# Kinetic Canvas

**Kinetic Canvas** is the designated zero-dependency shader engine for the Code Scaffold ecosystem. It allows agents to effortlessly inject ultra-fast, visually stunning WebGL shaders directly into React frontends. 

To maintain our proprietary styling methodologies and Code Scaffold branding, we do not directly import third-party shader names. Instead, we alias them through our internal `.skills/kinetic-canvas/components/index.ts` wrapper. It leverages the SkillForge protocol and Canvas UI integrations for bleeding-edge HTML-in-Canvas effects.

## Core Directives

### 1. Installation
```bash
npm i @paper-design/shaders-react
# For DOM distortion effects, the components are standalone and distributed in .skills/kinetic-canvas/components.
```

### 2. The Proprietary Capability Matrix
Kinetic Canvas gives you access to four primary WebGL domains. You must ALWAYS use our proprietary aliases when scaffolding components.

#### A. Logo Animations & Typography
Use these to mask massive brutalist text or SVG logos using `mix-blend-mode` or `background-clip`.
* **`KineticFluid`** - High-contrast metallic reflections.
* **`ThermalAura`** - Thermal gradient topologies.
* **`CrystallineVapor`** - Volumetric crystalline vapor.

*Example - Text Masking with KineticFluid:*
```jsx
import { KineticFluid } from '@/components/kinetic/index';

<div style={{ WebkitBackgroundClip: 'text', color: 'transparent' }}>
  <div className="absolute inset-0 z-[-1]" style={{ WebkitMaskImage: 'url(...)', WebkitMaskSize: 'contain' }}>
    <KineticFluid speed={0.5} style={{ width: '100%', height: '100%' }} />
  </div>
  <span className="mix-blend-overlay">KINETIC</span>
</div>
```

#### B. Environmental Effects
Use these for high-performance, full-bleed interactive backgrounds.
* **`KineticMesh`** - Lush, multi-color organic blobs.
* **`OrbitalParticles`** - Orbital particle systems.
* **`QuantumPlasma`** - Organic merging fluid spheres.
* **`VolumetricLight`** - Light scattering effects.
* **`VaporRing`** - Expanding vapor distortions.
* **`CellularVoronoi`** - Cellular geometric fractures.

*Example - GSAP Scroll-Bound Environmental Effect:*
```jsx
import { KineticMesh } from '@/components/kinetic/index';
// Bind `distortion` and `swirl` props to GSAP ScrollTrigger proxy objects
<KineticMesh colors={['#FF0055', '#000']} distortion={scrollProxy.distortion} speed={0.1} />
```

#### C. Image Filters & Caustics
Use these to overlay physical material simulations on top of DOM elements.
* **`CausticDisplacement`** - Liquid surface tension and rippling.
* **`RibbedGlassMask`** - Refractive fluted glass filtering.
* **`OrganicPulp`** - Analog paper grain.
* **`RetroHalftone`** - Vintage printing press stippling.

*Example - Cursor-Repellent Caustics:*
```jsx
import { CausticDisplacement } from '@/components/kinetic/index';
// Calculate cursor velocity dx/dy over dt to manually spike the `speed` prop on mouseMove
<div onMouseMove={handleVelocity}>
  <CausticDisplacement speed={mouseVelocity} style={{ width: '100%', height: '100%' }} />
</div>
```

#### D. DOM Distortion & Overlays
Use these HTML-in-Canvas effects to destruct, melt, burn, or decrypt LIVE DOM elements underneath the cursor.
* **`KineticBlaze`** - Ignites child components with fire, smoke, and heat distortion.
* **`KineticFrost`** - Freezes live HTML under ice that melts with cursor movement.
* **`KineticCipherReveal`** - Obfuscates UI as cipher text that decrypts around the cursor.
* **`KineticLiquidGlass`** - Renders 3D models or SVGs in liquid glass.

*Example - Distorting a Card with Blaze:*
```jsx
import { KineticBlaze } from '@/components/kinetic/index';

<KineticBlaze speed={1} distortion={0.6} sparks={0.5} style={{width:'100%', height:'100%'}}>
  <div className="card">This HTML is rendered into the canvas and distorted by fire!</div>
</KineticBlaze>
```

#### E. The Luminescence & Geometric Series
These ultra-premium standalone WebGL components simulate the fluid, high-contrast, geometric light topologies characteristic of elite modern motion design.
* **`KineticCrystalline`** - Refracting chromatic glass shards using sharp geometric voronoi bounces.
* **`KineticFluidAura`** - A high-viscosity, gradient-mapped SDF fluid simulation that creates mesmerizing optical loops.
* **`GeometricHalftone`** - An optical illusion filter that converts underlying elements into expanding geometric ripples (dots, diamonds).
* **`ChromatographicPrism`** - Splits light into vibrant spectral bands that warp across the DOM surface depending on cursor velocity.
* **`AbyssalWireframe`** - A hypnotic, looping 3D topological wireframe that dynamically morphs, glowing with high-contrast neon lines.

*Example - Using Fluid Aura:*
```jsx
import { KineticFluidAura } from '@/components/kinetic/index';

<div className="w-full h-screen bg-black">
  <KineticFluidAura colors={['#FF0055', '#4599FF', '#9360F7']} viscosity={0.8} />
</div>
```

### 4. Design Engineering & Advanced Animation
Kinetic Canvas must strictly adhere to our Design Engineering principles to guarantee premium, fluid interactions:
* **Restraint & Purpose:** The best animation is often no animation. Use shaders for purpose (feedback, spatial consistency, state indication), not decoration. Avoid animating frequent actions like typing.
* **Custom Easings:** Never use linear defaults. Always implement custom easing curves (e.g., `power3.out`, `expo.inOut`) for smooth transitions.
* **Spring Physics:** For interactive elements and dragging, utilize spring physics (via GSAP or framer-motion concepts) to respect inertia and gesture velocity.
* **Micro-Interactions:** Buttons and interactive elements should use subtle scale adjustments (e.g., `scale(0.97)` on click). Never scale from 0; always start from a near-final state like `0.95`.
* **GSAP Context:** When using GSAP with React, ALWAYS leverage the `@gsap/react` `useGSAP()` hook for automatic cleanup and context management, avoiding memory leaks.

*Example - GSAP Hook Integration:*
```jsx
import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { KineticMesh } from '@/components/kinetic/index';

export function SmoothKineticMesh() {
  const container = useRef();
  
  useGSAP(() => {
    // Context is automatically cleaned up
    gsap.from(container.current, { 
      opacity: 0, 
      scale: 0.95, 
      duration: 1.2, 
      ease: "power4.out" 
    });
  }, { scope: container });

  return (
    <div ref={container} className="relative w-full h-full">
      <KineticMesh speed={0.1} />
    </div>
  );
}
```

### 5. Pipeline Standard for Creating New Effects
Whenever generating or adding new WebGL shaders/effects to this skill, you MUST strictly adhere to the following architectural pipeline:
1. **Zero-Dependency Native Ownership:** Do NOT bundle or import shaders from third-party libraries (e.g., `@paper-design`). All new effects must be engineered natively from scratch as standalone raw WebGL/React components within the `.skills/kinetic-canvas/components/` directory.
2. **Dedicated Sandbox Demos:** Every new effect MUST receive its own dedicated, full-screen interactive HTML demo page (e.g., `demo-[name].html`) within the `.skills/kinetic-canvas/sandbox/` directory. Never bundle multiple effects into a single legacy viewer.
3. **1:1 Playwright Screenshot Pipeline:** To maintain the premium aesthetic of the Hub without sacrificing performance, you must NEVER use simulated CSS gradients or `generate_image` for preview thumbnails. Instead, you MUST spin up a headless Playwright instance (`npx playwright screenshot` or a custom Node script), inject CSS to hide the UI overlays, wait exactly 1000ms for the shader to compile and bloom, and capture a mathematically perfect 1:1 `.jpg` screenshot into the `/assets/` directory.
4. **Hub Integration:** Map the resulting 1:1 screenshot path to the `--bg` CSS variable for the new effect's card in `sandbox/index.html` to enable the fade-in hover preview.

### 6. Agent Automation Rules
When instructed to use Kinetic Canvas, automatically scaffold the required dependencies, create a dedicated `/components/kinetic` folder in the user's project containing the `index.ts` alias wrapper (and the standalone DOM distortion files), and deploy 1-3 highly-interactive stateful wrappers (like `ScrollKineticMesh` or `AudioKineticMesh`) immediately so the user has interactive building blocks. Ensure all wrappers follow the Design Engineering principles above.
