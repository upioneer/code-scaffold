# Code Scaffold Manufacturing Limits and DFM/DfAM Reference

This document provides definitive engineering rules and threshold limits for physical fabrication processes : additive manufacturing, CNC subtractive machining, sheet metal bending, and injection molding.

---

## 1. Design for Additive Manufacturing (DfAM)

Additive manufacturing builds parts layer by layer. Gravity, thermal contraction, and laser beam width dictate physical constraints.

### Process Specifications Matrix

* **Direct Metal Laser Sintering (DMLS / Metal PBF):**
  * *Minimum Wall Thickness:* 0.50 mm (structural walls: >= 1.0 mm)
  * *Critical Overhang Angle:* 45 degrees from horizontal. Faces under 45 degrees require sacrificial support columns to conduct laser thermal energy to the baseplate and prevent curling.
  * *Minimum Hole Diameter:* 1.0 mm
  * *Powder Evacuation Hole:* Minimum 4.0 mm diameter for internal cavities or hollow voids.
  * *Standard Layer Height:* 0.03 mm to 0.06 mm

* **Selective Laser Sintering (SLS Nylon PA12):**
  * *Minimum Wall Thickness:* 0.80 mm (flexible sections: 0.60 mm)
  * *Support Requirement:* 100% self supporting. The unsintered powder bed supports all geometries.
  * *Minimum Hole Diameter:* 1.5 mm
  * *Depowdering Drainage:* Minimum 5.0 mm escape port for hollow cores.
  * *Clearance Between Moving Parts:* 0.50 mm to 0.80 mm

* **Fused Deposition Modeling (FDM / FFF):**
  * *Minimum Wall Thickness:* 1.20 mm (3 perimeter passes with 0.4 mm nozzle)
  * *Critical Overhang Angle:* 45 degrees from horizontal. Overhangs below 45 degrees require tree or rectilinear supports.
  * *Maximum Unsupported Bridge:* 10.0 mm
  * *Z-Axis Anisotropy:* Inter-layer tensile strength is 40% to 60% lower than XY build plane. Align principal stress vectors parallel to the build plate.

* **Stereolithography / Digital Light Processing (SLA / DLP Resin):**
  * *Minimum Wall Thickness:* 0.60 mm
  * *Suction Cup Mitigation:* Cup structures facing the resin vat must incorporate vent holes to prevent vacuum separation forces during peel cycles.

---

## 2. Design for CNC Subtractive Machining (3-Axis and 5-Axis)

CNC milling utilizes rotating endmills to evacuate material from raw stock billets.

### Geometric Rules for CNC Milling

* **Internal Corner Radii:**
  * Endmills are circular. Square internal 90 degree corners cannot be milled.
  * Always specify an internal fillet radius at least 15% to 20% larger than the cutter radius (e.g. use R3.2 mm or R3.5 mm for a 6.0 mm cutter) to allow smooth toolpath continuous velocity and prevent tool chatter.
* **Aspect Ratio (Length to Diameter L/D):**
  * Recommended depth to tool diameter ratio is <= 3:1.
  * Maximum acceptable aspect ratio is 4:1. Deeper pockets cause significant tool deflection, chatter, surface roughness, and endmill breakage.
* **Standard Stock Envelope Alignment:**
  * Design parts to fit within standard metric or imperial bar stock sizes with at least 2.0 mm machining stock allowance per side.
* **Setup Count Minimization:**
  * Design features to be accessible from a single primary setup or opposing face (2 setups) to avoid expensive 5-axis indexing fixtures.

---

## 3. Sheet Metal Fabrication Rules

Sheet metal parts are stamped, laser-cut, and formed on CNC press brakes.

* **Minimum Bend Radius:**
  * Never set inside bend radius smaller than material thickness ($R \ge T$). Sharp corners lead to tensile cracking along the outer bend flange.
* **Bend Relief Notches:**
  * Corners where a bend meets adjacent flat material require relief notches to prevent metal tearing.
  * Relief notch width should be >= sheet thickness $T$, with depth >= bend radius plus $T$.
* **Hole to Edge Distance:**
  * Minimum distance from edge of any hole or cutout to the sheet edge must be $2 \times T$.
  * Minimum distance from hole edge to bend line must be $2.5 \times T + R$ to prevent hole ovalization during forming.
* **Bend Allowance & K-Factor:**
  * Default K-Factor for cold rolled steel and 5052 aluminum on standard air bending dies: $K = 0.44$.

---

## 4. Plastic Injection Molding Guidelines

* **Uniform Nominal Wall Thickness:**
  * Maintain uniform cross-sectional thickness throughout the part (typically 1.5 mm to 3.0 mm).
  * Thickness variations induce differential cooling rates, causing part warping and internal stresses.
* **Draft Angles:**
  * All vertical core and cavity faces must incorporate at least 1.0 to 2.0 degrees of draft per side to allow part ejection without scuffing.
  * Textured or EDM surfaces require an additional 1.0 degree of draft per 0.025 mm of texture depth.
* **Rib Design (Sink Mark Prevention):**
  * Rib base thickness should be 50% to 60% of the nominal wall thickness.
  * Rib height should not exceed $3 \times$ nominal wall thickness.
