---
name: CAD Tools
description: Comprehensive CAD/CAM engineering skill for AI agents: orchestrating generative design, topology optimization with the Alien Meter slider, FreeCAD socket and headless automation, parametric 3D modeling, additive manufacturing (DMLS/SLS), and multi-format conversion. Trigger when the user requests parametric 3D CAD modeling, generative design, topology optimization, organic skeletal geometry, FreeCAD automation, PartDesign sketches, extrusion or pocketing, B-Rep solid generation, STEP/STL export, or CAD format conversion. Activate when interacting with FreeCAD via Streamable HTTP/SSE MCP socket or headless CLI, evaluating the Alien Meter tradeoff between rigidity and bio-morphology, script-based geometry with build123d/OpenCASCADE, desktop CAD via COM, or 3D print/CNC manufacturing validation.
version: 8
target: .skills/cad-tools
---
​‌‍# CAD Tools Skill

A power-user engineering skill that equips AI agents with deep CAD/CAM capabilities across the full design-to-manufacture pipeline. Featuring generative design and topology optimization with the Alien Meter slider, native FreeCAD socket and headless automation, parametric Python scripting with `build123d` and OpenCASCADE, cloud-based generative B-Rep generation via the Zoo API, desktop COM automation for AutoCAD/ZWCAD, and a multi-format export pipeline (STEP, STL, DXF, 3MF, glTF, native FCStd), this skill is a complete engineering companion for autonomous technical workflows.

---

## Conceptual Architecture

```
User Prompt / Engineering Specification
    │
    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CAD Tools Skill Router                          │
│                                                                        │
│  ┌──────────────────────────────┐  ┌────────────────────────────────┐  │
│  │  Generative Topo & Alien     │  │   FreeCAD AI Connector         │  │
│  │  Meter Engine (SIMP / FEA)   │  │   (Streamable HTTP / SSE /     │  │
│  │  (scripts/topo_engine.py)    │  │    Headless STDIO Bridge)      │  │
│  └──────────────┬───────────────┘  └───────────────┬────────────────┘  │
│                 │                                  │                   │
│  ┌──────────────▼───────────────┐  ┌───────────────▼────────────────┐  │
│  │   Interactive 3D WebGL       │  │   PartDesign B-Rep Engine      │  │
│  │   Sandbox (sandbox/index)    │  │   (Bodies, Sketches, Pads,     │  │
│  │   (Real-time Mesh Morphing)  │  │    Pockets, Lofts, Revolve)    │  │
│  └──────────────┬───────────────┘  └───────────────┬────────────────┘  │
│                 │                                  │                   │
│  ┌──────────────▼───────────────┐  ┌───────────────▼────────────────┐  │
│  │   Code-as-CAD Modeling       │  │   Cloud Generative CAD         │  │
│  │   (build123d / OpenCASCADE)  │  │   (Zoo / KittyCAD Text-to-CAD) │  │
│  └──────────────┬───────────────┘  └───────────────┬────────────────┘  │
│                 │                                  │                   │
│  ┌──────────────▼───────────────┐  ┌───────────────▼────────────────┐  │
│  │   Desktop COM Automation     │  │   JSON Interoperability Engine │  │
│  │   (AutoCAD / ZWCAD / GS)     │  │   (Parametric JSON Schemas)    │  │
│  └──────────────┬───────────────┘  └───────────────┬────────────────┘  │
│                 │                                  │                   │
│  ┌──────────────▼──────────────────────────────────▼────────────────┐  │
│  │                    Multi-Format Export Pipeline                  │  │
│  │         STEP ↔ STL ↔ DXF ↔ 3MF ↔ glTF ↔ OBJ ↔ FCStd              │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │       Quality Assurance & Additive Manufacturing Verification    │  │
│  │    (trimesh Watertightness, DMLS Overhangs, Depowdering Voids)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
    │
    ▼
 Deliverables: Engineering STEP + DMLS/SLS 3MF + CNC DXF + Visual Renders + BOM
```

---

## Section 1: Generative Design, Topology Optimization & The Alien Meter

Generative design and Topology Optimization (Topo) represent the frontier of AI and algorithmic mechanical engineering. Rather than modeling geometry manually, an engineer or agent defines load boundaries, keep-out zones, mounting points, and manufacturing constraints. The solver then iteratively optimizes the distribution of material using Finite Element Analysis (FEA) to minimize structural compliance (maximize stiffness) for a targeted mass fraction.

### The Mathematics: SIMP Topology Optimization
The skill employs the Solid Isotropic Material with Penalization (SIMP) framework. In SIMP, each finite voxel in the design domain has a continuous relative density $\rho_e \in [0, 1]$. Young's modulus $E_e$ of each element is penalized:

$$E_e(\rho_e) = E_{min} + \rho_e^p (E_0 - E_{min})$$

Where:
* $E_0$ is the solid material modulus (e.g. 70 GPa for Aluminum, 114 GPa for Titanium).
* $E_{min}$ is a tiny stiffness assigned to void elements ($10^{-9} E_0$) to prevent FEA singularity.
* $p$ is the penalization power (typically $p = 3.0$), which forces intermediate densities toward 0 (void) or 1 (solid).

The optimization objective minimizes compliance subject to a volume constraint:

$$\min_{\boldsymbol{\rho}} \quad c(\boldsymbol{\rho}) = \mathbf{U}^T \mathbf{K} \mathbf{U} = \sum_{e=1}^N \left(E_{min} + \rho_e^p (E_0 - E_{min})\right) \mathbf{u}_e^T \mathbf{k}_0 \mathbf{u}_e$$

$$\text{subject to} \quad \frac{V(\boldsymbol{\rho})}{V_0} \le V_f, \quad \mathbf{K}(\boldsymbol{\rho}) \mathbf{U} = \mathbf{F}, \quad 0 \le \rho_e \le 1$$

Because natural load paths curve, branch, and split along principal stress trajectories, the resulting structures exhibit bone-like, organic, or biomechanical morphology.

---

### The "Alien Meter" Spectrum (0% to 100%)

The **Alien Meter** provides an intuitive, calibrated dial that controls how aggressively the model deviates from classical prismatic geometry toward organic bio-morphology, balancing structural stiffness against visual drama:

```
[0% Prismatic] ────────── [50% Aerospace Topo] ────────── [100% Biomechanical Art]
  High Stiffness               Balanced Rigidity                  Hyper-Organic
  Traditional CNC               DMLS/SLS Additive                  Sculptural / Porous
  FS >= 3.0                     FS 1.5 - 2.0                       FS < 1.0 (Art Only)
```

#### 1. Level 0 to 25% : Classical Prismatic CAD (Low Alien)
* **Design Philosophy:** Maximum stiffness, deterministic safety, conventional subtractive manufacturing (3-axis CNC milling, turning) or basic FDM printing.
* **Geometric Attributes:** Flat orthogonal datum faces, uniform wall thickness, standard circular fillets and chamfers.
* **Structural Metrics:** Factor of Safety ($FS \ge 3.0$). Negligible elastic deflection under rated operational loads.

#### 2. Level 26 to 60% : Aerospace Topology Optimization (Balanced Alien)
* **Design Philosophy:** Weight reduction for aerospace, motorsports, and robotics via metal powder bed fusion (DMLS, SLS).
* **Geometric Attributes:** FEA-governed branching load struts, parabolic arch ribbing, stress-guided webs, smooth organic fillets around bolt bosses.
* **Structural Metrics:** Factor of Safety ($FS \approx 1.5 - 2.0$). Optimized compliance. Material is removed strictly from dead-weight zones experiencing near-zero stress.

#### 3. Level 61 to 85% : Aggressive Biomimicry (High Alien)
* **Design Philosophy:** Advanced generative brackets, skeletal drone arms, organic heat sinks.
* **Geometric Attributes:** Thin tendon-like tension members, bone-like cortical channels, high-curvature surfaces, porous internal web networks.
* **Structural Metrics:** Reduced Factor of Safety ($FS \approx 1.1 - 1.4$). Noticeable elastic deflection under peak transient forces. Requires engineer approval.

#### 4. Level 86 to 100% : Biomechanical & Generative Art (Maximum Alien)
* **Design Philosophy:** Sci-fi props, wearable tech, kinetic sculptures, generative architecture.
* **Geometric Attributes:** Triply Periodic Minimal Surfaces (TPMS : Gyroids, Schwarz D, Neovius), cellular Voronoi degradation, skeletal tendril webs.
* **Structural Metrics:** Factor of Safety drops below structural threshold ($FS < 1.0$ under rated loads). Clearly classified as **Decorative / Art-Only**.

---

### The Engineering Compromise Card

Whenever an agent or user invokes generative design or topology optimization, the skill computes and reports a standardized **Engineering Compromise Card** via `scripts/topo_engine.py`:

```
======================================================================
  Code Scaffold Generative Telemetry : Engineering Compromise Card
======================================================================
* Alien Meter Setting     : 50% (AEROSPACE TOPO OPTIMIZATION (DMLS/SLS))
* Material Selected       : AlSi10Mg Aluminum [Direct Metal Laser Sintering (DMLS)]
* Mass Reduction          : -37.2% (934.5g -> 586.4g)
* Factor of Safety (FS)   : 1.63 [AEROSPACE COMPLIANT]
* Max Von Mises Stress    : 165.2 MPa (Yield: 270.0 MPa)
* Max Peak Deflection     : 0.472 mm
* Additive Printability   : 92% Self-Supporting (Additive DMLS)
* Structural Verdict      : PASSED: Verified compliance with industrial Factor of Safety (FS >= 1.5).
* Fabrication Advice      : Optimized for Direct Metal Laser Sintering (DMLS) or SLS Nylon. Overhang angles remain under 45 degrees. Safe for critical flight envelopes.
======================================================================
```

CLI Command to generate telemetry:
```bash
python .skills/cad-tools/scripts/topo_engine.py --alien-meter 50 --material al10 --load 2500
```
Or emit as programmatic JSON:
```bash
python .skills/cad-tools/scripts/topo_engine.py --alien-meter 75 --material ti64 --json
```

---

### Additive Manufacturing Design Rules (DMLS / SLS / FDM)

Organic generative geometries require specific additive manufacturing considerations:

* **Self-Supporting Overhang Rule (45-Degree Threshold):** Surfaces oriented at angles greater than 45 degrees relative to the vertical build axis require sacrificial support structures in DMLS metal printing. The Topo engine favors self-supporting arch trajectories.
* **Depowdering Escape Channels:** Hollow interior chambers (such as internal bone cores) must include at least two escape ports (minimum diameter 3.0mm) to evacuate unsintered metal powder during post-processing.
* **Minimum Feature Thickness:** Thin struts must maintain a minimum diameter of 1.2mm for DMLS (aluminum/titanium) and 0.8mm for SLS (nylon) to prevent thermal distortion and recoater blade collision during printing.
* **Thermal Residual Stress Relief:** Massive solid blocks adjacent to thin organic struts experience thermal gradient stress during laser sintering. Smooth transition fillets (radius $\ge 2.0\text{mm}$) must be applied to all structural junctions.

---

## Section 2: Interactive 3D WebGL Generative Sandbox

The skill bundles an interactive browser-native 3D WebGL canvas located at `.skills/cad-tools/sandbox/index.html`. It serves as a visual showroom and real-time simulator for generative topology optimization.

* **Real-Time Procedural Mesh Morphing:** Dragging the master **Alien Meter (0% to 100%)** slider dynamically re-solves and deforms the 3D geometry in real time.
* **Four Engineering Presets:**
  * **Aerospace Cantilever Bracket:** Transitioning from solid CNC block to dual-spar branching truss with bolt boss keep-out zones.
  * **Drone Cantilever Arm:** Upper tension spar and lower compression spar connected by biomimetic web struts.
  * **Carapace Heat Sink:** Straight rectangular cooling fins morphing into generative branching convective coral spines.
  * **TPMS Gyroid Core:** Infill minimal surface lattice cell array showcasing cellular porosity.
* **Render Modes:**
  * *Shaded Solid:* PBR metallic shading with material presets (Titanium Ti-6Al-4V, AlSi10Mg Aluminum, Inconel 718, PA12 Nylon).
  * *FEA Stress Heatmap:* Jet/Rainbow gradient mapping simulated Von Mises stress (Blue = 0 MPa low stress, Green/Yellow = nominal stress, Red = peak stress concentration).
  * *X-Ray Voids:* Semitransparent transmission mode to inspect internal hollow channels and depowdering passages.
  * *Wireframe:* Visualizing underlying mesh facet density.
* **Launch Instructions:** Open `.skills/cad-tools/sandbox/index.html` directly in any modern web browser or embed via the Code Scaffold web platform iframe.

---

## Section 3: The FreeCAD AI Connector and Socket Automation Bridge

The FreeCAD AI Connector bridges AI coding agents and automated pipelines directly to FreeCAD across three primary paradigms: interactive GUI socket control, headless CLI batch execution, and desktop AI host bridging.

### Paradigm A: Interactive GUI Socket Mode (Streamable HTTP & SSE)
In interactive GUI mode, FreeCAD runs with its visual graphical interface visible while exposing an internal socket server over port 3000. When the agent calls tools, geometry updates in real time inside the FreeCAD viewport, allowing immediate visual inspection by users or vision-capable models.

* **Streamable HTTP Endpoint (`POST /mcp`):** Modern Model Context Protocol standard. Responses stream back inline as JSON or server-sent event blocks. The server issues an `Mcp-Session-Id` header during the initial handshake, which the client echoes on subsequent requests.
* **Legacy HTTP+SSE Endpoint (`GET /sse` + `POST /messages`):** Backwards compatibility for clients requiring dedicated SSE push channels.
* **Network & Security Configuration:**
  * `MCP_HOST` : Listen address (defaults to `127.0.0.1`). Plaintext HTTP is strictly restricted to loopback addresses (`127.0.0.1`, `localhost`, `::1`).
  * `MCP_PORT` : Listen port (defaults to `3000`).
  * `MCP_AUTH_TOKEN` : Optional bearer token. When set, every incoming HTTP request must include `Authorization: Bearer <token>`.
  * `MCP_ALLOWED_HOSTS` : Comma-separated list of trusted Host headers. Refuses wildcard `*` to prevent DNS rebinding attacks.

Starting the socket server inside an already-running FreeCAD instance via Python console:
```python
import os
import FreeCAD

if not FreeCAD.ActiveDocument:
    FreeCAD.newDocument("Unnamed")

from freecad_ai.mcp.gui_server import get_server_controller
controller = get_server_controller()
url = controller.start(host="127.0.0.1", port=3000)
print(f"FreeCAD AI Socket running at: {url}")
```

### Paradigm B: Headless CLI Mode (STDIO JSON-RPC 2.0)
For continuous integration, Docker containers, or background automation without a display server, FreeCAD executes in console mode via `FreeCADCmd` or `FreeCAD -c`.

* **File Descriptor 3 (FD3) Banner Workaround:** FreeCAD's C++ core prints an unconfigurable startup banner to standard output (`fd 1`) before Python initializes. This banner corrupts standard JSON-RPC streams. The headless bridge wraps execution by saving pristine stdout on file descriptor 3 and redirecting file descriptor 1 to standard error:
  ```bash
  exec 3>&1 1>&2 && FreeCAD -c /path/to/mcp_server_entry.py
  ```
  The Python entry point detects `fd 3` via `os.fstat(3)` and restores stdout:
  ```python
  import os, sys
  if _have_saved_fd:
      os.dup2(3, 1)
      os.close(3)
      sys.stdout = os.fdopen(1, "w")
  ```
* **AppImage Environment Cleanup:** When running inside FreeCAD AppImages, the runtime prepends bundled binary paths and sets `PYTHONHOME`. Subprocesses invoked by the agent must scrub `PYTHONHOME` and `PYTHONPATH` from their environment to prevent `ModuleNotFoundError: No module named 'encodings'` crashes.

### Paradigm C: Desktop AI Host Bridge (ChatGPT / Claude / Cursor via `uvx`)
For developers utilizing desktop AI environments (ChatGPT Desktop, Claude Desktop, Cursor, or Devin) on Windows, macOS, or Linux, the connection operates through an on-demand runner:

1. **Install Tool Runner (`uvx`):**
   Install the zero-dependency Python runner via PowerShell as administrator:
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```
   Restart your terminal after installation to refresh the system PATH.
2. **Install FreeCAD Addon:**
   Copy the `FreeCADMCP` addon folder into FreeCAD's user Mod directory while FreeCAD is fully closed:
   * FreeCAD 1.1+: `%APPDATA%\FreeCAD\v1-1\Mod\FreeCADMCP`
   * FreeCAD 1.0 (legacy): `%APPDATA%\FreeCAD\Mod\FreeCADMCP`
3. **Activate RPC Server in FreeCAD:**
   Launch FreeCAD, select the MCP Addon workbench from the workbench dropdown, and click **Start RPC Server**. Check the **Auto Start Server** option so FreeCAD automatically initializes the bridge on every future boot.
4. **Register Custom MCP in Desktop AI:**
   Add a custom MCP server within your desktop client configuration:
   * **Name:** `freecad`
   * **Type:** `STDIO`
   * **Command to launch:** `uvx`
   * **Arguments:** `freecad-mcp`
   * **Token Optimization (Optional):** To eliminate image token overhead during long text sessions, add `--only-text-feedback` as a second argument.
5. **The Active Agentic Feedback Loop:**
   * `execute_code` : The model sends parametric Python commands across the bridge to build or adjust geometry.
   * `get_view` : The bridge captures an offscreen or viewport snapshot and returns it to the model, closing the visual loop for immediate multimodal validation.

### Transactional Safety and Error Rollback
Every atomic operation executed through the connector is encapsulated within a transactional boundary:
```python
doc = App.ActiveDocument
doc.openTransaction("CreateFeature")
try:
    doc.recompute()
    doc.commitTransaction()
except Exception as err:
    doc.abortTransaction()
    raise RuntimeError(f"CAD Operation failed, rolled back cleanly: {err}")
```
If an operation fails, the transaction is immediately aborted, restoring the CAD tree to its previous valid state. The failure traceback is returned to the agent, triggering an automated self-correction loop (up to 3 retries) with adjusted parameters.

---

## Section 4: Structured PartDesign Modeling Toolkit

The connector exposes over 50 structured operations. Agents should invoke these operations directly for deterministic geometry synthesis.

### 1. `create_body`
Creates a `PartDesign::Body` container. All PartDesign features (sketches, pads, pockets, fillets) must live inside a body.
```json
{
  "label": "ChassisBody"
}
```

### 2. `create_sketch`
Creates a 2D constrained profile. Supports attachment to standard planes (`XY`, `XZ`, `YZ`), offset datum planes, or existing planar solid faces.
* **Parameters:** `plane`, `body_name`, `offset`, `support`, `face`, `geometries`, `constraints`.
* **Geometries:** `line`, `rectangle`, `circle`, `arc`.
* **Constraints:** `Coincident`, `Horizontal`, `Vertical`, `Parallel`, `Perpendicular`, `Tangent`, `Distance`, `DistanceX`, `DistanceY`, `Radius`, `Angle`.

### 3. `edit_sketch`
Modifies an existing sketch. When resizing or repositioning profiles, ALWAYS pass `clear_all: true` with the complete set of new geometries in `add_geometries` to avoid over-constraint solver conflicts.

### 4. `pad_sketch` & `pocket_sketch`
* `pad_sketch` : Extrudes a sketch profile along its normal into a solid feature.
* `pocket_sketch` : Cuts material out of a solid using a sketch profile with auto-directional depth analysis.

### 5. `revolve_sketch`, `loft_sketches`, and `sweep_sketch`
* `revolve_sketch` : Revolves a sketch profile around an axis (additive Revolution or subtractive Groove).
* `loft_sketches` : Transitions smoothly across 2 or more cross-sectional sketches placed on offset planes.
* `sweep_sketch` : Sweeps a cross-section profile sketch along a 3D trajectory spine sketch.

### 6. `boolean_operation`
Executes parametric `PartDesign::Boolean` operations between bodies, preserving internal feature tree history.

---

## Section 5: Interactive Cognitive Modeling Workflows

* **Workflow 1: Measure and Propose (Approval First):** Opening a reference model (e.g. PCB/microcontroller), extracting dimensional constraints, presenting an annotated concept render for human approval, and modeling a matching enclosure.
* **Workflow 2: Industrial Styling & Concept Refinement:** Adding chunky corner chamfers, wall stiffening ribs, and ventilation slot/grille patterns over heat sources.
* **Workflow 3: Multi-Part Assemblies & Mechanical Clearances:** Enforcing sliding tolerances (0.3mm - 0.5mm) and snap-fit lip clearances (0.2mm for friction fit, 1.0mm for snap tabs).
* **Workflow 4: Targeted Face & Sub-Element Edits:** Querying `Gui.Selection.getSelectionEx()` to apply knurling, holes, or fillets directly to user-selected faces in the 3D viewport.
* **Workflow 5: Drawing and Image-to-CAD:** Step-by-step feature synthesis from dimensioned engineering drawings or reference photos.

---

## Section 6: Prompt Library & Troubleshooting Matrix

### Verification Prompt Library
* **Generative Topo Cantilever:**
  `"Run topology optimization on an aerospace mounting bracket with an Alien Meter setting of 50%. Material is AlSi10Mg. Target factor of safety 1.6."`
* **Biomechanical Sculpture:**
  `"Generate an organic biomechanical drone arm with an Alien Meter setting of 85%. Emit the Engineering Compromise Card."`
* **Connection Baseline:**
  `"Create a new document in FreeCAD called 'Test Part'. Add a box 50 mm long, 30 mm wide and 20 mm high. Fit the view so I can see it."`
* **Bolt Flange with PCD Holes:**
  `"Design a flange in FreeCAD with a base diameter of 100mm, thickness 10mm, and a center hole of 20mm diameter, with 4 bolt holes of 8mm diameter equally spaced at 70mm PCD."`
* **Additive Export:**
  `"Export the part as a 3mf file."`

### Troubleshooting Matrix
| Problem | Root Cause | Solution |
| :--- | :--- | :--- |
| `uvx` returns command not found | Terminal session not restarted after installation | Reopen PowerShell as administrator to refresh PATH |
| Addon missing from FreeCAD workbench dropdown | Files copied while FreeCAD was running or placed in incorrect directory | Fully close FreeCAD, verify folder sits at `%APPDATA%\FreeCAD\v1-1\Mod\FreeCADMCP`, and reopen |
| Cannot connect to FreeCAD socket | RPC server is not active in running FreeCAD instance | Switch to MCP Addon workbench, click **Start RPC Server**, and enable **Auto Start Server** |
| Windows Security Firewall prompt | Inbound socket connection blocked by Windows Defender | Navigate to Windows Security -> Firewall -> Allow an app -> check FreeCAD |
| High LLM token consumption | Large image blocks returned on every viewport turn | Add `--only-text-feedback` argument to `uvx freecad-mcp` launch command |
| Topo mesh non-manifold error | Isosurface threshold too low, creating zero-thickness facets | Increase minimum filter radius ($r_{min} \ge 1.5\text{mm}$) and verify watertightness via trimesh |

---

## Section 7: Code-as-CAD with build123d and OpenCASCADE

For pure Python script-driven modeling without FreeCAD dependencies, `build123d` provides deterministic B-Rep solid generation:

### Canonical Model Scaffold (`cad/models/<model_name>.py`)
```python
"""
Model: Chassis Bracket
Engineer: AI Agent (CAD Tools Skill)
Version: 1.0
Parameters in millimeters.
"""

from build123d import *

# ── Parameters ────────────────────────────────────────────────────────────────
WIDTH    = 60.0
DEPTH    = 40.0
HEIGHT   = 25.0
THICK    = 4.0
HOLE_DIA = 5.2  # M5 clearance

# ── Geometry ──────────────────────────────────────────────────────────────────
with BuildPart() as part:
    # L-bracket base extrusion
    with BuildSketch(Plane.XY):
        Rectangle(WIDTH, DEPTH)
    extrude(amount=THICK)

    # Upright flange
    with BuildSketch(Plane.XZ.offset(DEPTH / 2)):
        Rectangle(WIDTH, HEIGHT)
    extrude(amount=-THICK)

    # Fillet interior junction
    fillet(part.edges().filter_by(Axis.X), radius=3.0)

    # Mounting holes
    with Locations([(WIDTH / 4, 0, 0), (-WIDTH / 4, 0, 0)]):
        Hole(radius=HOLE_DIA / 2, depth=THICK)

# ── Export ────────────────────────────────────────────────────────────────────
part.part.export_step("cad/output/chassis_bracket.step")
part.part.export_stl("cad/output/chassis_bracket.stl")
```

---

## Section 8: Quality Assurance and Manufacturing Verification

Before delivering production files, run strict manufacturing validation:

### FDM & Additive Mesh Validation
```python
import trimesh
import numpy as np

def audit_mesh_quality(stl_path: str) -> dict:
    mesh = trimesh.load(stl_path)
    issues = []

    if not mesh.is_watertight:
        issues.append("CRITICAL: Mesh is non-manifold (not watertight)")

    if not mesh.is_winding_consistent:
        issues.append("WARNING: Inconsistent face normal winding")

    down_vector = np.array([0, 0, -1])
    angles = np.degrees(np.arccos(np.clip(mesh.face_normals @ down_vector, -1, 1)))
    steep_overhangs = np.sum(angles < 45.0)
    if steep_overhangs > 0:
        issues.append(f"INFO: {steep_overhangs} faces have overhangs > 45 degrees requiring support")

    return {
      "watertight": mesh.is_watertight,
      "volume_cm3": float(mesh.volume / 1000.0),
      "surface_area_cm2": float(mesh.area / 100.0),
      "issues": issues
    }
```

---

## Section 9: Project Structure Convention & Workflows

All CAD work must adhere to this standardized project layout:

```
cad/
├── models/              # Parametric Python scripts (FreeCAD / build123d)
│   ├── enclosure.py
│   └── bracket.py
├── output/              # Compiled build artifacts (gitignored)
│   ├── *.step           # Primary B-Rep engineering solids
│   ├── *.stl            # Meshes for 3D printing
│   ├── *.dxf            # 2D drawings for laser / CNC
│   ├── *.fcstd          # Native FreeCAD document packages
│   └── renders/         # Multi-angle PNG inspection snapshots
├── bom/                 # Bill of Materials manifests
│   └── bom.csv          # Quantities, materials, costs, supplier SKUs
└── docs/                # Engineering specifications
    └── manufacturing_notes.md
```

### Declarative Execution Workflow
To orchestrate end-to-end modeling headlessly, execute the declarative pipeline defined in `workflows/parametric_pipeline.yaml`.

---

## Section 10: Real-Time Interactive Workbench Architecture & Evolution Roadmap

To transform the 3D visual sandbox (`sandbox/index.html`) from a standalone procedural simulation into an integrated, live CAD companion application, the skill defines a four-phase closed-loop architecture connecting the user, the AI agent, and the 3D viewport.

### Architectural Phasing
* **Phase 1: Live Artifact Synchronization (Agent -> Viewport):**
  * When prompting for a new part or adjusting geometry headlessly, the agent writes the compiled display mesh to `.cad_runtime/current_part.glb` and telemetry to `.cad_runtime/current_part.json`.
  * The Three.js canvas dynamically hot-reloads the scene upon filesystem changes without requiring manual imports.
* **Phase 2: In-Page Conversational Chat Drawer (UI Component):**
  * Integrates an expandable dark-slate glass chat drawer directly on the left flank of the 3D canvas.
  * Captures user instructions in natural language while automatically bundling the live 3D viewport state (camera pose, active alloy, Alien Meter percentage, and bounding envelope) as contextual system metadata.
* **Phase 3: Bidirectional WebSocket & IPC Daemon (Full Synchrony):**
  * Runs a lightweight local socket daemon (`scripts/freecad_bridge.py --daemon --port 8765`) on `127.0.0.1`.
  * When the user scrubs the Alien Meter or modifies boundary constraints in the browser, the daemon executes rapid parametric rebuilds in FreeCAD and streams binary glTF buffers back to the viewport.
* **Phase 4: Real-Time FEA Stream & Multi-Agent Co-Design:**
  * Interactive finite element analysis updates principal stress tensors dynamically as load vectors move.
  * Multi-agent collaboration allows structural, thermal, and manufacturing agent personas to inspect and annotate 3D geometry concurrently.

For the exhaustive protocol schemas, event specifications, and socket lifecycles, refer to `references/WORKBENCH_ROADMAP.md`.

---

## Directives

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
* **Deterministic Parameter Naming**: All physical dimensions must be named constants defined at the head of the model file : magic numbers are strictly forbidden.
* **Alien Meter Governance**: When topology optimization is requested, evaluate the Alien Meter tradeoff and output the Engineering Compromise Card. Explicitly warn the user if Factor of Safety falls below 1.5.
* **Transactional Hygiene**: In FreeCAD scripts, always wrap feature generation in `openTransaction` and `commitTransaction`, with explicit `abortTransaction` calls in exception blocks.
* **Format Decision Protocol**:
  * Use **STEP** for mechanical engineering exchange and CNC machining.
  * Use **STL / 3MF** for additive manufacturing and mesh slicing.
  * Use **DXF** for laser cutting, waterjet profiling, and 2D drafting.
  * Use **glTF/GLB** for Three.js web embedding and AR visualization.
