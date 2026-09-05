---
​‌‍name: CAD Tools
description: Comprehensive CAD/CAM engineering skill for AI agents: orchestrating parametric 3D modeling, multi-format conversion, mass property analysis, desktop CAD automation, and AI-generative geometry workflows using open-source and cloud toolchains.
version: 1
target: .skills/cad-tools
---

# CAD Tools Skill

A power-user engineering skill that equips AI agents with deep CAD/CAM
capabilities across the full design-to-manufacture pipeline. From parametric
Python scripting with `build123d` / OpenCASCADE to cloud-based B-Rep generation
via the Zoo/KittyCAD API, desktop COM automation for AutoCAD/ZWCAD, and
multi-format export (STEP, STL, DXF, 3MF, glTF), this skill is a complete
engineering companion for technical projects.

---

## Conceptual Architecture

```
User Prompt
    │
    ▼
┌────────────────────────────────────────────────────────┐
│               CAD Tools Skill Router                   │
│                                                        │
│  ┌──────────────┐  ┌──────────────────────────┐        │
│  │  Code-as-CAD │  │   Cloud Generative CAD   │        │
│  │  (build123d) │  │   (Zoo.dev / KittyCAD)   │        │
│  └──────┬───────┘  └───────────┬──────────────┘        │
│         │                      │                       │
│  ┌──────▼───────┐  ┌───────────▼──────────────┐        │
│  │  Local OCCT  │  │  Desktop COM Automation  │        │
│  │  B-Rep Kernel│  │  (AutoCAD / ZWCAD / GS)  │        │
│  └──────┬───────┘  └──────────────────────────┘        │
│         │                                              │
│  ┌──────▼──────────────────────────────────────┐       │
│  │         JSON Interoperability Engine        │       │
│  │   (Cross-platform Parametric JSON Schema)   │       │
│  └──────┬──────────────────────────────────────┘       │
│         │                                              │
│  ┌──────▼──────────────────────────────────────┐       │
│  │           Format Conversion Layer           │       │
│  │   STEP ↔ STL ↔ DXF ↔ 3MF ↔ glTF ↔ OBJ       │       │
│  └─────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘
    │
    ▼
 Deliverable: STEP + STL + DXF + Renders + BOM
```

---

## Core Toolchain: Code-as-CAD with build123d

### Why Code-as-CAD?

Pure binary geometry generation from LLMs is prone to hallucinations and
produces non-manifold meshes. Representing geometry as **Python code** using
`build123d` gives us:
- **Version-controllable** models (diff, blame, PR review)
- **Parametric** designs (change wall thickness = change one variable)
- **Deterministic** compilation via the OpenCASCADE kernel
- **Self-correctable** iteration (the agent can re-run, measure, adjust)

### Setup

```bash
# Install the CAD toolchain in your project environment
pip install build123d
pip install ocp-tessellate  # For fast tessellation / mesh export
pip install vtk             # For off-screen rendering / snapshots (optional)
pip install cadquery         # Alternative parametric CAD library
pip install openscad-py      # For OpenSCAD bridge (optional)
```

### Canonical Model Scaffold

Every model the agent creates MUST follow this scaffold in
`cad/models/<model_name>.py`:

```python
"""
Model: <Component Name>
Engineer: AI Agent (CAD Tools Skill)
Version: 1.0
Description: <One-sentence purpose>

Parameters
----------
All units are millimeters unless otherwise noted.
"""

from build123d import *
from ocp_vscode import show  # optional: for interactive preview

# ── Parameters ────────────────────────────────────────────────────────────────
WIDTH      = 50.0   # mm
HEIGHT     = 30.0   # mm
DEPTH      = 20.0   # mm
WALL       = 2.5    # mm  shell thickness
FILLET_R   = 1.5    # mm  edge fillet radius
HOLE_DIA   = 3.2    # mm  M3 clearance hole

# ── Geometry ──────────────────────────────────────────────────────────────────
with BuildPart() as part:
    Box(WIDTH, DEPTH, HEIGHT)
    shell = Shell(openings=[part.faces().sort_by(Axis.Z)[-1]], thickness=-WALL)
    fillet(part.edges(), radius=FILLET_R)

    # M3 mounting bosses (4x corners)
    with Locations(
        [(WIDTH / 2 - 5, DEPTH / 2 - 5, 0),
         (-WIDTH / 2 + 5, DEPTH / 2 - 5, 0),
         (WIDTH / 2 - 5, -DEPTH / 2 + 5, 0),
         (-WIDTH / 2 + 5, -DEPTH / 2 + 5, 0)]
    ):
        Cylinder(radius=HOLE_DIA / 2, height=HEIGHT, mode=Mode.SUBTRACT)

# ── Export ────────────────────────────────────────────────────────────────────
part.part.export_step("cad/output/<model_name>.step")
part.part.export_stl("cad/output/<model_name>.stl")
```

---

## Workflow: End-to-End Design Pipeline

### Step 1 :  Requirements Elicitation

Before writing any geometry, the agent MUST clarify:

1. **Form Factor**: What is the approximate bounding box? (W × D × H in mm)
2. **Material**: PLA, PETG, Aluminum 6061, Steel 4140, etc.?
3. **Manufacturing Process**: FDM printing, SLA resin, CNC milling, sheet metal?
4. **Functional Requirements**: Loads, mating parts, tolerance classes?
5. **Output Formats**: STEP (engineering), STL (printing), DXF (CNC), glTF (web)?

### Step 2 :  Parametric Code Generation

Generate the `build123d` Python model:
- All dimensions are **named constants** at the top :  never magic numbers
- Include docstring with parameter table
- Use `Mode.SUBTRACT` for holes, pockets, reliefs
- Apply fillets/chamfers for manufacturability
- Validate geometric operations don't fail (catch `OCC_Error`)

### Step 3 :  Compile and Validate

```bash
python cad/models/<model_name>.py
```

If the script exits with error, read the traceback and fix:
- `NullShapeError`: Boolean operation failed :  check intersecting/zero-thickness geometry
- `StdFail_NotDone`: Fillet radius too large :  reduce `FILLET_R`
- `TopologicalError`: Non-manifold geometry :  check face normals and closes

### Step 4 :  Measurement & Self-Validation

After successful compilation, the agent MUST verify key measurements:

```python
from build123d import *

part = import_step("cad/output/<model_name>.step")

# Bounding box check
bb = part.bounding_box()
print(f"BBox: {bb.size.X:.2f} × {bb.size.Y:.2f} × {bb.size.Z:.2f} mm")

# Volume / mass (for print time / material cost estimates)
volume_mm3 = part.volume
density_g_per_mm3 = 0.00124  # PLA
mass_g = volume_mm3 * density_g_per_mm3
print(f"Volume: {volume_mm3:.1f} mm³ | Est. Mass: {mass_g:.1f} g (PLA)")

# Surface area
print(f"Surface Area: {part.area:.1f} mm²")
```

### Step 5 :  Multi-Format Export

```python
# STEP :  Engineering / interoperability (always produce this)
part.export_step("cad/output/<model>.step")

# STL :  FDM/SLA 3D printing
part.export_stl("cad/output/<model>.stl", tolerance=0.01, angular_tolerance=0.1)

# DXF :  CNC, laser cutting, 2D drawings (export a face projection)
with BuildSketch() as sketch:
    face_projection = part.faces().sort_by(Axis.Z)[-1]
    Add(face_projection)
sketch.sketch.export_dxf("cad/output/<model>_top.dxf")

# 3MF :  Modern print format (via external tool)
# meshlabserver -i output.stl -o output.3mf  (if meshlab available)

# glTF :  Web visualization (via trimesh)
import trimesh
mesh = trimesh.load("cad/output/<model>.stl")
mesh.export("cad/output/<model>.glb")
```

---

## JSON-to-CAD Interoperability (GhostPoly-inspired)

To ensure seamless interoperability between different frontends (like web CAD interfaces) and the local B-Rep kernel, the agent can use a cross-platform structured JSON schema.

### The JSON Parametric Schema

This schema abstracts complex python code into an agnostic representation that can be ported or stored in a database.

```json
{
  "version": "1.0",
  "parameters": {
    "width": 50,
    "depth": 30,
    "height": 20
  },
  "operations": [
    {
      "id": "base",
      "type": "box",
      "width": "width",
      "depth": "depth",
      "height": "height"
    },
    {
      "id": "hole",
      "type": "cylinder",
      "radius": 3.2,
      "height": "height",
      "position": [10, 10, 0]
    },
    {
      "id": "final",
      "type": "boolean",
      "operation": "subtract",
      "tool": "hole",
      "target": "base"
    }
  ]
}
```

### JSON Execution Engine

A local script `scripts/json_engine.py` is provided to compile this JSON into a `build123d` model and export it.

```bash
python .skills/cad-tools/scripts/json_engine.py model_spec.json --export output.step
```

Agents should use this engine when passing geometric specifications to or from external services and UIs that cannot natively execute Python code.

---

## Cloud Generative CAD :  Zoo.dev / KittyCAD API

When local `build123d` code is insufficient or the user prefers cloud AI
geometry generation, use the Zoo.dev text-to-CAD API.

### Setup

```bash
pip install zoo-py
# OR use the CLI
npm install -g @zoo/cli
zoo auth login
```

### Text-to-CAD Generation

```python
import os
import httpx
import base64
import time

ZOO_API_KEY = os.environ["ZOO_API_KEY"]
BASE_URL = "https://api.zoo.dev"

def text_to_cad(prompt: str, output_format: str = "step") -> bytes:
    """
    Generate a CAD model from a natural language prompt via Zoo.dev API.
    Returns raw bytes of the requested format.
    """
    headers = {"Authorization": f"Bearer {ZOO_API_KEY}"}

    # Submit async job
    resp = httpx.post(
        f"{BASE_URL}/ai/text-to-cad/{output_format}",
        headers=headers,
        json={"prompt": prompt},
        timeout=30.0,
    )
    resp.raise_for_status()
    job = resp.json()
    job_id = job["id"]

    # Poll until complete (max 120s)
    for _ in range(60):
        time.sleep(2)
        status_resp = httpx.get(
            f"{BASE_URL}/user/text-to-cad/{job_id}",
            headers=headers
        )
        data = status_resp.json()
        if data["status"] == "completed":
            # Decode the base64-encoded output file
            encoded = data["outputs"][f"source.{output_format}"]
            return base64.b64decode(encoded)
        elif data["status"] == "failed":
            raise RuntimeError(f"Zoo CAD generation failed: {data.get('error')}")

    raise TimeoutError("Zoo CAD generation timed out after 120 seconds")

# Usage
step_bytes = text_to_cad("An enclosure for a Raspberry Pi 4 with ventilation slots")
with open("cad/output/rpi4_enclosure.step", "wb") as f:
    f.write(step_bytes)
```

### Format Conversion via Zoo API

```python
def convert_cad_format(
    input_path: str,
    output_format: str,
    output_path: str
) -> None:
    """
    Convert CAD files between formats using the Zoo file conversion API.
    Supports: step, stl, obj, gltf, glb, fbx, ply, dxf, 3mf
    """
    headers = {"Authorization": f"Bearer {ZOO_API_KEY}"}
    input_format = input_path.rsplit(".", 1)[-1].lower()

    with open(input_path, "rb") as f:
        file_bytes = f.read()

    resp = httpx.post(
        f"{BASE_URL}/file/conversion/{input_format}/{output_format}",
        headers=headers,
        content=file_bytes,
        headers={**headers, "Content-Type": "application/octet-stream"},
        timeout=60.0,
    )
    resp.raise_for_status()

    with open(output_path, "wb") as f:
        f.write(resp.content)
```

### Mass Properties via Zoo API

```python
def get_mass_properties(model_path: str, material_density: float = 1.24) -> dict:
    """
    Calculate geometric mass properties using Zoo's engine.
    material_density: g/cm³ (PLA=1.24, PETG=1.27, ABS=1.04, Al6061=2.70)
    """
    headers = {"Authorization": f"Bearer {ZOO_API_KEY}"}
    input_format = model_path.rsplit(".", 1)[-1].lower()

    with open(model_path, "rb") as f:
        file_bytes = f.read()

    resp = httpx.post(
        f"{BASE_URL}/file/mass-properties",
        params={"material_density": material_density, "src_format": input_format},
        headers={**headers, "Content-Type": "application/octet-stream"},
        content=file_bytes,
        timeout=60.0,
    )
    resp.raise_for_status()
    return resp.json()

# Example output:
# { "mass": 47.3, "volume": 38145.2, "center_of_mass": [0, 0, 12.4],
#   "inertia": [[...], [...], [...]] }
```

---

## Desktop CAD Automation :  AutoCAD / ZWCAD / GstarCAD (Windows)

For projects requiring native `.dwg`/`.dxf` output or operating within an
enterprise desktop CAD environment, use Windows COM automation.

### Setup

```bash
pip install pywin32
pip install comtypes
# AutoCAD, ZWCAD, or GstarCAD must be installed and licensed on the machine
```

### COM Bridge Utilities

```python
import win32com.client
from typing import Literal

CADApp = Literal["AutoCAD.Application", "ZWCAD.Application", "GstarCAD.Application"]

def get_cad_app(app_prog_id: CADApp = "AutoCAD.Application"):
    """Get or launch the desktop CAD application via COM."""
    try:
        return win32com.client.GetActiveObject(app_prog_id)
    except Exception:
        return win32com.client.Dispatch(app_prog_id)

def draw_line(doc, x1, y1, x2, y2):
    start = win32com.client.VARIANT(pythoncom.VT_ARRAY | pythoncom.VT_R8, [x1, y1, 0.0])
    end   = win32com.client.VARIANT(pythoncom.VT_ARRAY | pythoncom.VT_R8, [x2, y2, 0.0])
    return doc.ModelSpace.AddLine(start, end)

def draw_circle(doc, cx, cy, radius):
    center = win32com.client.VARIANT(pythoncom.VT_ARRAY | pythoncom.VT_R8, [cx, cy, 0.0])
    return doc.ModelSpace.AddCircle(center, radius)

def save_dwg(doc, path: str):
    doc.SaveAs(path, 12)  # 12 = DWG 2018 format

def export_dxf(doc, path: str):
    doc.SaveAs(path, 61)  # 61 = DXF 2018 ASCII format
```

### Workflow for COM-based 2D Drafting

```python
app = get_cad_app()
app.Visible = True
doc = app.ActiveDocument

# Create a new layer
layers = doc.Layers
layer = layers.Add("DIMENSIONS")
layer.Color = 3  # Green

# Draw floor plan outline (example)
draw_line(doc, 0, 0, 6000, 0)    # bottom wall  (6m)
draw_line(doc, 6000, 0, 6000, 4000)  # right wall
draw_line(doc, 6000, 4000, 0, 4000)  # top wall
draw_line(doc, 0, 4000, 0, 0)    # left wall

save_dwg(doc, "cad/output/floorplan.dwg")
```

---

## Rendering & Visual Inspection

Visual feedback is critical for multi-modal AI agents verifying geometry.

### Off-Screen VTK Rendering

```python
import vtk

def render_step_to_png(step_path: str, output_png: str, camera_angle: str = "iso") -> str:
    """
    Render a STEP file to a PNG image for agent visual inspection.
    camera_angle: 'iso', 'front', 'top', 'right'
    """
    from OCC.Core.STEPControl import STEPControl_Reader
    from OCC.Core.BRep import BRep_Builder
    from OCC.Extend.DataExchange import read_step_file

    shape = read_step_file(step_path)

    renderer = vtk.vtkRenderer()
    renderer.SetBackground(0.1, 0.1, 0.15)

    render_window = vtk.vtkRenderWindow()
    render_window.SetOffScreenRendering(1)
    render_window.SetSize(1280, 720)
    render_window.AddRenderer(renderer)

    # Camera presets
    camera = renderer.GetActiveCamera()
    if camera_angle == "iso":
        camera.SetPosition(100, 100, 100)
    elif camera_angle == "front":
        camera.SetPosition(0, -100, 0)
    elif camera_angle == "top":
        camera.SetPosition(0, 0, 100)

    render_window.Render()

    writer = vtk.vtkPNGWriter()
    writer.SetFileName(output_png)
    w2if = vtk.vtkWindowToImageFilter()
    w2if.SetInput(render_window)
    w2if.Update()
    writer.SetInputConnection(w2if.GetOutputPort())
    writer.Write()

    return output_png
```

### Three.js / Web Preview (via Headless Browser)

For agents with Playwright access (use the `playwright` skill):

```python
# Use the playwright skill to load a Three.js STL viewer and screenshot
# Reference: .skills/playwright/SKILL.md
```

---

## Manufacturing Readiness Checks

Before delivering final files, the agent MUST run manufacturability validation:

### FDM 3D Printing Checks

```python
import trimesh
import numpy as np

def check_print_ready(stl_path: str) -> dict:
    mesh = trimesh.load(stl_path)
    issues = []

    if not mesh.is_watertight:
        issues.append("CRITICAL: Mesh is not watertight :  non-manifold geometry")

    if not mesh.is_winding_consistent:
        issues.append("WARNING: Inconsistent face winding :  potential normal flip")

    # Overhang angle check (FDM typically needs supports for > 45°)
    face_normals = mesh.face_normals
    down_vec = np.array([0, 0, -1])
    angles = np.degrees(np.arccos(np.clip(face_normals @ down_vec, -1, 1)))
    overhang_faces = np.sum(angles < 45)
    if overhang_faces > 0:
        issues.append(f"INFO: {overhang_faces} faces with overhangs > 45° :  supports may be needed")

    # Minimum wall thickness (rough estimate via convex hull deviation)
    vol_ratio = mesh.volume / mesh.convex_hull.volume
    if vol_ratio < 0.3:
        issues.append("WARNING: Very thin geometry detected :  check wall thickness")

    return {
        "watertight": mesh.is_watertight,
        "volume_mm3": float(mesh.volume),
        "surface_area_mm2": float(mesh.area),
        "face_count": len(mesh.faces),
        "issues": issues,
    }
```

### CNC Machinability Checks

```python
from build123d import *

def check_cnc_ready(part: Part, tool_dia: float = 6.0) -> list[str]:
    """
    Basic CNC machinability validation.
    tool_dia: minimum end-mill diameter in mm (default 6mm)
    """
    issues = []

    # Check for internal pockets narrower than tool diameter
    for face in part.faces():
        bb = face.bounding_box()
        min_dim = min(bb.size.X, bb.size.Y)
        if min_dim < tool_dia and face.normal_direction != Axis.Z.direction:
            issues.append(
                f"Pocket/feature width {min_dim:.1f}mm < tool diameter {tool_dia}mm"
            )

    # Check for undercuts (features invisible from spindle axis)
    # (simplified: check for downward-facing non-bottom faces)
    for face in part.faces():
        if face.normal_direction.Z < -0.1:
            bb = face.bounding_box()
            if bb.min.Z > part.bounding_box().min.Z + 0.5:
                issues.append(f"Potential undercut detected at Z={bb.min.Z:.1f}mm")

    return issues
```

---

## Project Structure Convention

All CAD work MUST follow this directory convention within the project:

```
cad/
├── models/              # Source-of-truth Python build123d scripts
│   ├── <component>.py   # One file per distinct component
│   └── assembly.py      # Top-level assembly (if needed)
├── output/              # Generated output files (gitignored!)
│   ├── *.step           # STEP files (primary engineering format)
│   ├── *.stl            # Mesh for 3D printing
│   ├── *.dxf            # 2D drawings / CNC
│   ├── *.glb            # glTF binary for web/AR
│   └── renders/         # PNG snapshot renders for inspection
├── bom/                 # Bill of Materials
│   └── bom.csv          # Component list with quantities and specs
└── docs/                # Engineering documentation
    ├── specifications.md
    └── manufacturing_notes.md
```

**CRITICAL :  `.gitignore` rules for CAD projects:**

```gitignore
# CAD binary outputs :  never commit these, they are build artifacts
cad/output/*.step
cad/output/*.stl
cad/output/*.stl
cad/output/*.3mf
cad/output/*.obj
cad/output/*.glb
cad/output/*.gltf
cad/output/*.fbx
cad/output/renders/

# Keep source models and BOMs under version control
!cad/models/
!cad/bom/
!cad/docs/
```

---

## Bill of Materials (BOM) Management

Always maintain a `cad/bom/bom.csv` alongside models:

```csv
item_no,part_number,description,quantity,material,unit_weight_g,unit_cost_usd,supplier,notes
1,ENCL-001,Main enclosure shell,1,PLA 1.75mm,47.3,0.94,Local print,0.02 USD/g @ 20% infill
2,M3-HEAT-4,M3×4mm heat-set insert,4,Brass,0.4,0.08,Amazon B08BHBL7V9,
3,M3-BTN-10,M3×10mm button head screw,4,Stainless A2,0.5,0.06,Amazon,
4,PCB-MAIN,Main control PCB,1,FR4,18.0,24.99,OSHPark,Custom order
```

---

## Environment Variables

Add to `.env` / `.env.local`:

```env
# Zoo.dev / KittyCAD API (cloud generative CAD)
ZOO_API_KEY=your_zoo_api_key_here

# Desktop CAD COM target (Windows only)
CAD_COM_APP=AutoCAD.Application   # or ZWCAD.Application / GstarCAD.Application

# Output paths
CAD_OUTPUT_DIR=./cad/output
CAD_MODELS_DIR=./cad/models
```

---

## Quick Reference :  Format Decision Matrix

| Format | Use Case | Produces | Toolchain |
|--------|----------|----------|-----------|
| **STEP** | Engineering data exchange, import to CAD tools | B-Rep solid | `build123d`, Zoo API |
| **STL** | FDM/SLA 3D printing, mesh analysis | Triangular mesh | `build123d`, trimesh |
| **DXF** | CNC laser/plasma cutting, 2D drawings | Vector paths | `build123d`, ezdxf |
| **3MF** | Modern print format, color/material metadata | Zipped XML+mesh | trimesh, Zoo API |
| **glTF/GLB** | Web visualization, AR/VR, Blender import | Optimized mesh | trimesh, Zoo API |
| **OBJ** | Legacy mesh interchange, renderer inputs | Polygon mesh | trimesh, Zoo API |
| **DWG** | Enterprise desktop CAD (AutoCAD) | Native format | COM automation |
| **KCL** | Zoo parametric source code | Code | Zoo API |

---

## Example Prompts

The following prompt patterns activate this skill effectively:

- *"Design an enclosure for a Raspberry Pi 4 with ventilation slots and M3 mounting points. Export as STEP and STL."*
- *"Convert my `model.step` file to glTF for embedding in a web app."*
- *"Calculate the mass and volume of `bracket.step` assuming it's machined from 6061 aluminum."*
- *"Generate a 2D floor plan of a 6m × 4m room with a 900mm door opening and export as DXF."*
- *"Check my `part.stl` for 3D printing readiness and report any overhangs or non-manifold issues."*
- *"Use the Zoo API to generate a CAD model of a right-angle bracket, 50mm × 50mm × 3mm thick."*
- *"Draw a mounting bracket in AutoCAD using COM automation and save as DWG."*

---

## Changelog

- **v1**: Initial release. Covers build123d parametric modeling, Zoo.dev API integration, Windows COM desktop CAD automation (AutoCAD/ZWCAD/GstarCAD), multi-format export pipeline (STEP/STL/DXF/3MF/glTF), off-screen VTK rendering, trimesh manufacturing validation, BOM management, and project structure conventions.
- **v2**: Added JSON-to-CAD interoperability engine (GhostPoly-inspired) for translating parametric JSON schemas directly to build123d B-Rep solids, ensuring cross-platform agent UI/database integration.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
