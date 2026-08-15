# Kinetic Canvas

**Version:** 5
**Target:** `.skills/kinetic-canvas`

## Description
Kinetic Canvas is a heavily optimized, zero-dependency WebGL shader engine uniquely branded and extended for the Code Scaffold ecosystem. It provides AI agents with instant access to ultra-premium canvas effects (like `KineticFluid`, `KineticMesh`, and `CausticDisplacement`), specifically tailored for reactive, motion-driven interfaces. It integrates elements from the SkillForge protocol and Canvas UI, enabling experimental HTML-in-Canvas DOM distortion.

## Capabilities & Use Cases
* **Proprietary Aliasing:** Wraps the entire `@paper-design/shaders-react` library into Code Scaffold's internal taxonomy, ensuring all deployed shaders (`ThermalAura`, `QuantumPlasma`, `RibbedGlassMask`, etc.) maintain a cohesive architectural identity.
* **DOM Distortion:** Leverages experimental HTML-in-Canvas APIs through the SkillForge protocol to allow physics-based destruction and distortion of live DOM elements (`KineticBlaze`, `KineticFrost`, etc.).
* **Logo Animations & Typography:** Provides explicit patterns for clipping `KineticFluid` and `ThermalAura` shaders to massive hero text elements using CSS blend modes.
* **Environmental Effects:** Deploys massive, performant `KineticMesh` and `VolumetricLight` backgrounds that agents are instructed to wrap in GSAP or Web Audio API state bounds.
* **Image Filters & Caustics:** Allows agents to overlay physical material simulations like `CausticDisplacement` (Water) and `OrganicPulp` (Paper Texture) onto standard DOM elements, heavily bound to cursor velocity physics.

## Visual Capabilities Gallery

This skill provides proprietary high-performance shaders, categorized into four distinct domains.

### 1. Logo Animations & Typography
Used to mask massive brutalist text or SVG logos using `mix-blend-mode` or `background-clip`.

| Shader Alias | Visual |
| :--- | :--- |
| **KineticFluid** | ![Kinetic Fluid](assets/kinetic-fluid.png) |
| **ThermalAura** | ![Thermal Aura](assets/thermal-aura.png) |
| **CrystallineVapor** | ![Crystalline Vapor](assets/crystalline-vapor.png) |

### 2. Environmental Effects
Massive, full-bleed backgrounds intended to be bound to GSAP ScrollTriggers or Web Audio APIs for stateful interactivity.

| Shader Alias | Visual |
| :--- | :--- |
| **KineticMesh** | ![Kinetic Mesh](assets/kinetic-mesh.png) |
| **OrbitalParticles** | ![Orbital Particles](assets/orbital-particles.png) |
| **QuantumPlasma** | ![Quantum Plasma](assets/quantum-plasma.png) |
| **VolumetricLight** | ![Volumetric Light](assets/volumetric-light.png) |
| **VaporRing** | ![Vapor Ring](assets/vapor-ring.png) |
| **CellularVoronoi** | ![Cellular Voronoi](assets/cellular-voronoi.png) |

### 3. Image Filters & Caustics
Physical material simulations intended to be overlaid on standard DOM elements (like images or cards) and bound to cursor velocity physics.

| Shader Alias | Visual |
| :--- | :--- |
| **CausticDisplacement** | ![Caustic Displacement](assets/caustic-displacement.png) |
| **RibbedGlassMask** | ![Ribbed Glass Mask](assets/ribbed-glass-mask.png) |
| **RetroHalftone** | ![Retro Halftone](assets/retro-halftone.png) |
| **OrganicPulp** | ![Organic Pulp](assets/organic-pulp.png) |

### 4. DOM Distortion & Overlays
Creative HTML-in-Canvas effects capable of distorting live DOM elements. Uses advanced shaders to render physics over interface elements.

| Shader Alias | Visual |
| :--- | :--- |
| **KineticBlaze** | ![Kinetic Blaze](assets/kinetic-blaze.png) |
| **KineticFrost** | ![Kinetic Frost](assets/kinetic-frost.png) |
| **KineticCipherReveal** | ![Kinetic Cipher Reveal](assets/kinetic-cipher.png) |
| **KineticLiquidGlass** | ![Kinetic Liquid Glass](assets/kinetic-liquid-glass.png) |

## Design Engineering & Advanced Animation
Kinetic Canvas must strictly adhere to our Design Engineering principles to guarantee premium, fluid interactions:
* **Restraint & Purpose:** The best animation is often no animation. Use shaders for purpose (feedback, spatial consistency, state indication), not decoration.
* **Custom Easings:** Never use linear defaults. Always implement custom easing curves (e.g., `power3.out`, `expo.inOut`) for smooth transitions.
* **Spring Physics:** For interactive elements and dragging, utilize spring physics (via GSAP or framer-motion concepts) to respect inertia and gesture velocity.
* **Micro-Interactions:** Buttons and interactive elements should use subtle scale adjustments (e.g., `scale(0.97)` on click). Never scale from 0; always start from a near-final state like `0.95`.
* **GSAP Context:** When using GSAP with React, ALWAYS leverage the `@gsap/react` `useGSAP()` hook for automatic cleanup and context management.

## Usage
Agents should read `SKILL.md` to understand how to bind the shader modules to React state for maximal interactivity using the proprietary `KineticCanvas` component aliases. Below are explicit examples of how this engine should be provisioned:

### Typography Example
Clip the `KineticFluid` shader to massive brutalist text elements using CSS blend modes:
```jsx
import { KineticFluid } from '@/components/kinetic/index';

export function KineticHeroText() {
  return (
    <div style={{ WebkitBackgroundClip: 'text', color: 'transparent' }}>
      <div className="absolute inset-0 z-[-1]" style={{ WebkitMaskImage: 'url(/logo.svg)', WebkitMaskSize: 'contain' }}>
        <KineticFluid speed={0.5} style={{ width: '100%', height: '100%' }} />
      </div>
      <span className="mix-blend-overlay">KINETIC</span>
    </div>
  );
}
```

### Caustics Example
Overlay physical material simulations like `CausticDisplacement` heavily bound to cursor velocity physics:
```jsx
import { CausticDisplacement } from '@/components/kinetic/index';

export function RepellentCaustics({ mouseVelocity }) {
  // mouseVelocity calculates dx/dy over dt
  return (
    <div className="relative w-full h-full overflow-hidden">
      <CausticDisplacement 
        speed={mouseVelocity} 
        style={{ width: '100%', height: '100%', transition: 'none' }} 
      />
    </div>
  );
}
```

## Changelog
* **4** : Introduced Design Engineering & Advanced Animation principles. Migrated components to leverage GSAP's `useGSAP` hook for optimal React context cleanup. Replaced manual requestAnimationFrame loops with GSAP physics and spring easing in `RepellentCaustics` and `ScrollKineticMesh` for superior UX.
* **3** : Integrated Canvas UI components (Blaze, Frost, Cipher Reveal, Liquid Glass) under the SkillForge protocol. Renamed and mapped them into the Code Scaffold taxonomy (`KineticBlaze`, etc.). Added DOM Distortion category to the visual gallery with automated screenshot generation.
* **2** : Full 13-shader visual gallery capabilities mapped out in readme.
* **1** : Initial creation of the Kinetic Canvas skill via the SkillForge protocol. Integrated the proprietary taxonomy (`KineticMesh`, `KineticFluid`, etc.) with Code Scaffold. Added categorical examples for Logo Animations, Environmental Effects, and Image Filters.

* **v5** : Completely stripped the legacy @paper-design dependency. Engineered native replacements for the 10 remaining core shaders using pure WebGL/React. Re-architected the sandbox into 12 dedicated demo HTML pages and integrated a local Node.js/Playwright pipeline to capture mathematically perfect 1:1 headless WebGL screenshots for the Sandbox Hub index cards. Hardcoded this standard pipeline into the SKILL.md.
