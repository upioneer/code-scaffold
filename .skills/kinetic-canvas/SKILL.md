---
name: Kinetic Canvas
description: Advanced WebGL shaders and interactive HTML canvases wrapped as proprietary native React components for Code Scaffold.
version: 4
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

### 5. Agent Automation Rules
When instructed to use Kinetic Canvas, automatically scaffold the required dependencies, create a dedicated `/components/kinetic` folder in the user's project containing the `index.ts` alias wrapper (and the standalone DOM distortion files), and deploy 1-3 highly-interactive stateful wrappers (like `ScrollKineticMesh` or `AudioKineticMesh`) immediately so the user has interactive building blocks. Ensure all wrappers follow the Design Engineering principles above.
