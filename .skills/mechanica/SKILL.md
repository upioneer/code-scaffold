---
​‌‍name: mechanica
description: Trigger when the user requests isometric illustrations, technical diagrams, physical machine metaphors, hardware explainers, cutaway drawings, exploded assemblies, 4-tone shaded vector diagrams, WebGL shader overlays, or interactive engineering graphics.
keywords:
  - mechanica
  - isometric-illustration
  - physical-metaphor
  - technical-diagram
  - hardware-explainer
  - cutaway-diagram
  - exploded-assembly
  - kinematics
  - vector-graphics
  - svg-rendering
  - four-tone-shading
  - painters-algorithm
  - webgl-shaders
  - test-rig
  - dial-gauge
  - interactive-graphics
  - linear-style
  - depth-sorting
  - clearance-audit
---

# Mechanica Physical Metaphor Architecture & Kinematic Engine

Mechanica is an enterprise physical machine metaphor engine, kinematic cutaway illustrator, and interactive hardware explainer. It translates complex software abstractions, distributed systems, and algorithmic workflows into tangible, precision-engineered mechanical apparatuses. Every figure is built from dozens of interlocking, four-tone shaded solid parts rendered in calibrated isometric perspective, optional world-space WebGL shaders, and real-time 3D kinematics.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.

---

## 1. The Core Philosophy: The Machine is the Explanation

Do not draw abstract floating slabs, labeled boxes, or arbitrary connector arrows. Invent a physical, functional machine whose mechanical operation embodies the algorithmic concept itself:

### 1.1 Prescriptive Conceptual Mapping Taxonomy

| Software Concept | Physical Mechanical Metaphor | Mechanical Mechanics |
| :--- | :--- | :--- |
| **Token Bucket Rate Limiter** | Brass Water Cistern with Float Valve | Fluid drips at constant rate into reservoir while tap requests pull measured volume. Overflow spills into waste tray when full. |
| **Cache Key Invalidation** | Pin-Tumbler Lock with Shear Line | Key ridges raise brass driver pins. When every pin aligns with shear line, plug rotates and operation bypasses heavy execution. |
| **Multi-Tenant GPU Context** | Precision Gantry Plotter | A single dual-axis overhead print head moves along cross-rails to service sixteen isolated color wells in time-sliced sequence. |
| **LSM Tree Storage Engine** | Cascading Multi-Tier Sieve Shaker | Eccentric vibrator passes raw granular material through coarse, medium, and ultra-fine mesh trays into compacted bottom drawers. |
| **Thread Pool Execution** | Textile Loom with Bobbin Spindles | Central rotating drive shaft powers a bank of eight reciprocal shuttle arms pulling yarn from independent tensioned spools. |
| **Write-Ahead Log (WAL)** | Continuous Tick-Tape Punch Machine | Solenoid needles punch binary perforations into an advancing paper tape strip before any valve is actuated downstream. |
| **Bloom Filter Membership** | Multi-Pin Physical Keyway Template | Probing fingers drop through drilled perforated hole matrices. If any pin hits solid metal, element is definitively absent. |
| **Raft Consensus Quorum** | Centrifugal Flyball Governor | Paired counter-weights spin on hinged arms. System only engages high-gear clutch once rotational speed balances governor spring. |

---

## 2. Coordinate Spaces, Optics & Isometric Projection Mathematics

Mechanica operates in true three-dimensional world space with millimeter-scale units: `[x, y, z]` where `x` and `y` define the horizontal ground plane and `z` points vertically upward.

```
                  +z (Height)
                   |
                   |
                   |_______ +y (Depth)
                  /
                 /
               +x (Width)
```

### 2.1 Isometric Camera Transformation

A world point `[x, y, z]` maps to screen viewBox coordinates `[sx, sy]` via trigonometric projection:

* **Azimuth Angle (`a`)**: Rotation in horizontal ground plane around vertical axis. Default is 45 degrees (equal view of x and y faces). Use 35 to 60 degrees to showcase the mechanism face.
* **Elevation Angle (`e`)**: Pitch angle above horizontal ground plane. Default is 30 degrees (classic true isometric perspective). Raise to 40 to 45 degrees when looking down into open reservoirs, tanks, or chassis wells.

```javascript
// World to Screen Isometric Transform
function projectIso(x, y, z, originX, originY, scale, azimuthDeg = 45, elevationDeg = 30) {
  const radA = (azimuthDeg * Math.PI) / 180;
  const radE = (elevationDeg * Math.PI) / 180;
  
  const cosA = Math.cos(radA);
  const sinA = Math.sin(radA);
  const cosE = Math.cos(radE);
  const sinE = Math.sin(radE);

  // Screen horizontal: perpendicular to ground line
  const sx = originX + (x * cosA - y * sinA) * scale;
  
  // Screen vertical: elevation foreshortening minus vertical rise
  const sy = originY + ((x * sinA + y * cosA) * sinE - z * cosE) * scale;
  
  return [sx, sy];
}

// Depth calculation for painter ordering (larger means closer to camera)
function depthOf(x, y, z, azimuthDeg = 45, elevationDeg = 30) {
  const radA = (azimuthDeg * Math.PI) / 180;
  const radE = (elevationDeg * Math.PI) / 180;
  return (x * Math.sin(radA) + y * Math.cos(radA)) * Math.cos(radE) + z * Math.sin(radE);
}
```

---

## 3. Four-Tone Volumetric Lighting & Shading Architecture

Real machines convey volume through distinct planar facet lighting rather than flat fills. Mechanica employs a strict four-tone shading system:

```
[Primary Directional Light Source: Top Left, 45 deg elevation]
  Tone 0 (Lo)    : Darkest face, pointing away from light source
  Tone 1 (Mid)   : Moderate face, oblique to light vector
  Tone 2 (Hi)    : Primary lit vertical face, directly facing light
  Tone 3 (Top)   : Horizontal upward face, receives direct overhead downlight
  Lit Accent     : Specular highlight reserved for active mechanism or moving subject
```

### 3.1 CSS Theme Token Calibration

Every stroke and fill references CSS custom properties to allow instant theme inversion between Technical Paper (Light) and Carbon Slate (Dark):

```css
/* Technical Paper Blueprint (Light Mode Default) */
.mechanica-plate {
  --m-paper: #f8f9fa;
  --m-surface: #eef1f4;
  --m-tone-lo: #c8d1dc;
  --m-tone-mid: #dbe2ea;
  --m-tone-hi: #e9eff5;
  --m-tone-top: #f4f7fa;
  --m-edge-stroke: #334155;
  --m-crease-stroke: #94a3b8;
  --m-faint-stroke: #cbd5e1;
  --m-lit-accent: #0284c7;
  --m-halo-shadow: rgba(15, 23, 42, 0.08);
}

/* Carbon Slate (Dark Mode) */
.mechanica-plate[data-theme="dark"] {
  --m-paper: #0b0f17;
  --m-surface: #131b26;
  --m-tone-lo: #1a2433;
  --m-tone-mid: #253346;
  --m-tone-hi: #33445c;
  --m-tone-top: #445977;
  --m-edge-stroke: #94a3b8;
  --m-crease-stroke: #475569;
  --m-faint-stroke: #1e293b;
  --m-lit-accent: #38bdf8;
  --m-halo-shadow: rgba(0, 0, 0, 0.45);
}
```

---

## 4. Prismatic Geometry & Solid Modeling Kit

All solid parts in Mechanica are generated programmatically via parameterized volumetric primitives:

### 4.1 Slabs & Beveled Plates (`slabOf`)
A rounded rectangular extrusion standing on the ground plane or stacked atop another assembly:
* Plan definition: `{ x, y, w, d, r }` (position, width, depth, corner radius).
* Height parameters: `z0` (bottom elevation) and `h` (thickness).
* Bevel edge: Inset highlight line running along top visible perimeter.

### 4.2 Cylinders, Pucks & Shafts (`cylinder`)
Vertical cylinders for drive shafts, dial bezels, bushings, and knurled knobs:
* Parameters: `(cx, cy, r, z0, h, camera, steps, bevel)`.
* Steps: 16 to 24 for minor pins, 48 to 72 for large dial faces.
* Visible seam arcs: Emits front-facing lower arc and top elliptical rim.

### 4.3 Knurling Textures (`knurl`)
Vertical ridges distributed across the visible front half of a cylindrical dial or knob:
* Automatically computes tangent visibility limits so ridges never wrap onto back hidden faces.
* Evenly spaces ridges across visible arc with subtle light-dependent stroke tones.

### 4.4 Coiled Springs (`coil`)
Helical springs split for correct painter order:
* Emits two independent path groups: `{ back, front }`.
* Render order: Back coil halves -> Central sliding shaft -> Front coil halves.
* Dynamic compression: Interpolates coil pitch during kinematic deflection.

### 4.5 Sliding Glands & Telescoping Shafts (`rodOut` and `holdStill`)
Sliding shafts whose visible length varies during mechanical stroke:
* Rendered at full maximum stroke inside a dedicated `<clipPath>` locked to gland face.
* Group transformation moves shaft while inverse translate maintains stationary clip boundary.

---

## 5. Lathe Solids & Smooth Hermite Spline Curvature

For bodies of revolution along arbitrary 3D axes (rocket combustion nozzles, venturi tubes, bell bells, spherical bearings, flanged valves):

```
              Axis Vector [ax, ay, az]
                   |
       +--------- Meridian Profile [s, r] ---------+
       |                                           |
    Origin [ox, oy, oz] ---------------------- Tip [sMax]
```

### 5.1 Monotone Cubic Hermite Splines
When smoothing curved profiles:
* Uses Fritsch Carlson slope evaluation to eliminate artificial spline overshoots.
* Normal interpolation provides continuous tone curvature across band joints, completely eliminating polygonal staircasing.
* Analytic profile slopes: `dr / ds` calculates precise geometric silhouette limits.

### 5.2 Analytic Segment Slicing (`bandsOf`)
Splits tall turned bodies into depth-sortable bands sharing identical surface curvature fields. This enables external pipes, brackets, and harness cables to weave in front of and behind the main body cleanly.

---

## 6. Topological Painter Order & Occlusion Sorting

A mechanical figure consists of dozens of solid parts that must be drawn from back to front without depth buffer artifacts:

### 6.1 The Sorting Protocol
1. **Foundation Level**: Base plate and vibration-dampening feet are drawn first.
2. **Component Depth Sorting**: Parts residing on the same structural layer are sorted by `depthOf(center, camera)` in ascending order.
3. **Compound Part Splitting**: Whenever a part wraps another part (such as a bearing collar around a post or a coil spring around a piston), split the outer part into rear and forward halves.
4. **Reciprocating Kinematic Slots**: Moving parts are rendered within dedicated `<g transform="...">` containers positioned at their physical depth slot.
5. **No Visual Interlocks**: If part A overlaps part B in the foreground while part B overlaps part A in the background, break the geometry into distinct modular sub-assemblies.

---

## 7. Embedded Isometric WebGL FX Pipeline

Mechanica supports hybrid vector plus shader compositions. WebGL fragment shaders render continuous physical phenomena (thermal exhaust plumes, fluid wave caustics, electrical sparks, luminous indicators) directly inside the drawing:

```
[Layer 1: Background SVG] -> Base plate, rear framework, back pipes
             |
[Layer 2: WebGL Canvas]   -> Volumetric plume, steam, fluid ripple caustics
             |
[Layer 3: Foreground SVG] -> Front carriage, dial indicator, front coils, bezel
```

### 7.1 Isometric Camera Registration
The WebGL shader runs in an HTML5 canvas element positioned between back and front SVG layers:
* Shader receives projection origin, scale, azimuth, and elevation uniforms.
* Vertex coordinates match world-space coordinates, ensuring sparks and fluid surfaces stay locked to metal boundaries without parallax drift.

### 7.2 Smooth Envelope Attenuation
Every shader effect must fade smoothly to zero opacity before reaching canvas boundaries:
* Gaussian radial envelopes prevent hard canvas edge clipping.
* Color ramps utilize token-matched RGB values matching CSS variables in both light and dark themes.

---

## 8. Deterministic Geometric Clearance Audit

Before rendering any production figure, Mechanica executes a deterministic geometric audit to ensure physical realism:

1. **Clearance Envelope Check**: No pipe, cable, or solid body may intersect another solid body across any moment of kinematic travel.
2. **Terminal Grounding**: Every pipe, wire, or rod must originate and terminate at an authentic mounting flange, socket, or gland. No loose floating ends.
3. **Zero Line-End Float**: Every visible crease or outline must terminate on a valid silhouette vertex. Lines never terminate in mid-air.
4. **True Geometry Verification**: Recorded collision bounds must match rendered SVG geometry within 5% volume tolerance. Stand-in dummy proxies are forbidden.

---

## 9. Card Framing & Instrument Readout Architecture

Every figure is framed in a precision laboratory instrument card:

```
+--------------------------------------------------------------------------+
| Fig 1. Rate Limiter Rig                                  TOKEN BUCKET V1 |
|                                                                          |
|                                                                          |
|                     [ Isometric Machine Illustration ]                   |
|                                                                          |
|                                                                          |
| [o] Drag valve to meter fluid                 Flow: 42 ml/s | Cap: 85%   |
+--------------------------------------------------------------------------+
```

* **Header Left**: Figure designation and formal apparatus title.
* **Header Right**: Technical classification badge.
* **Footer Left**: Contextual interaction hint (e.g. Drag plunger, Turn dial).
* **Footer Right**: Live digital telemetry readout driven by physical model state.
* **Sub-Card**: Footnote legend and architectural conceptual mapping note.

---

## 10. Enterprise Scaffolding & Multi-Format Export

Mechanica figures export cleanly into three production targets:

### 10.1 Standalone SVG Vector Asset
Embeds all CSS variables, typography, and path geometry into a single `.svg` file with zero runtime dependencies.

### 10.2 Framework-Free HTML5 Bundle
Combines inline SVG, canvas shader layers, and a lightweight `requestAnimationFrame` kinematic physics loop into a self-contained HTML page.

### 10.3 React and Next.js Interactive Component (`.tsx`)
Exports a typed, server-safe React component with `useReadout`, `useSpring`, and `useIsometricCamera` hooks for reactive web applications.
