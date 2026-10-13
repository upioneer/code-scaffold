# Mechanica Physical Metaphors

**Version:** 1

**Target:** `.skills/mechanica`

**Category:** Animation & Graphics

**Keywords:** `mechanica`, `isometric-illustration`, `physical-metaphor`, `technical-diagram`, `hardware-explainer`, `cutaway-diagram`, `exploded-assembly`, `kinematics`, `four-tone-shading`, `webgl-shaders`, `clearance-audit`

## Description
Mechanica is a physical machine metaphor engine, kinematic cutaway illustrator, and interactive hardware explainer. It translates abstract technical architectures, algorithms, and distributed systems into tangible, precision-crafted mechanical instruments rendered in four-tone isometric vector graphics, embedded WebGL shaders, and real-time 3D kinematics.

## Capabilities & Use Cases
* **Physical Machine Metaphor Paradigm**: Translates abstract software concepts into working physical mechanisms, including rate limiters as float-valve water cisterns, cache keys as pin-tumbler locks, GPU contexts as gantry plotters, and thread pools as textile spindles.
* **Precision Four-Tone Isometric Shading**: Renders rich volumetric solid prisms, cylinders, and lathed profiles with calibrated four-tone luminance steps, top face highlights, corner bevels, and soft ambient drop halos.
* **Kinematic Assembly Cutaways and Exploded Views**: Generates interactive assemblies supporting smooth continuous exploded inspection sliders (`--apart`), revealing internal bushings, bearings, springs, and linkages.
* **Analytic Lathe Profiling and Hermite Spline Curvature**: Generates complex solids of revolution along arbitrary 3D spatial axes using monotone cubic Hermite interpolation with zero tone-band staircasing.
* **Topological Depth Sorting and Painter Order Engine**: Automates occlusion ordering across complex multi-part assemblies using geometric distance evaluation, split-wrapping half-turns for coil springs, and clipping glands for reciprocating sliding shafts.
* **Embedded Isometric WebGL Shader Pipeline**: Integrates real-time GPU fragment shaders for thermal exhaust plumes, fluid wave caustics, plasma arcs, and optical glow envelopes locked to the exact isometric camera projection matrix.
* **Dynamic 3D Kinematics and Revolute Joint Simulator**: Simulates multi-body mechanics in real time, including sweeping indicator needles, rotating combination dials, articulated robotic linkages, and sliding vernier carriages.
* **Deterministic Geometric Clearance Audit**: Validates complete mechanical integrity across the entire kinematic stroke, guaranteeing zero inter-part collisions, grounded line terminations, and zero floating artifacts.
* **Multi-Format Enterprise Scaffolding**: Exports production-ready assets across standalone SVG vectors, zero-dependency HTML bundles, and responsive React or Next.js components.

## Usage
Activate Mechanica when designing technical illustrations, engineering explainer diagrams, physical system metaphors, documentation hero figures, or interactive isometric canvas components.

```javascript
// Example: Synthesizing an Isometric Rate Limiter Rig with Float Valve
import * as M from "./mechanica-kit";

const camera = M.fitProjection(points, 640, 420, { azimuth: 45, elevation: 30 });
const basePlate = M.slabOf({ x: -120, y: -60, w: 240, d: 120, r: 8 }, 0, 12, camera);
const reservoir = M.cylinder(0, 0, 36, 12, 80, camera, 48);
const floatValve = M.rodOut(frame, 12, 60, 4, camera, { stroke: 20 });
```

## Changelog
* **v1** : Initial release of Mechanica physical metaphor engine, four-tone isometric vector renderer, WebGL shader integration, dynamic kinematic cutaway simulator, and interactive testing sandbox.
