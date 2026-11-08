---
​‌‍name: floorplan-architect
description: Trigger when the user wants to turn a 2D floorplan into furnished 3D stills or a walkthrough video, furnish a virtual home, import plans from MagicPlan, RoomSketcher, Live Home 3D, Floorplanner, Planner 5D, Home Design 3D, or Sweet Home 3D, or needs interior style templates, room briefs, camera paths, daylight or night lighting, or headless Blender home rendering.
version: 1
category: Animation & Graphics
keywords:
  - floorplan-architect
  - 3d-walkthrough
  - byof-import
  - magicplan
  - roomsketcher
  - live-home-3d
  - floorplanner
  - planner-5d
  - home-design-3d
  - sweet-home-3d
  - walkthrough-video
  - furnished-render
  - interior-styling
  - style-templates
  - blender-rendering
  - camera-path
  - daylight-lighting
  - dxf-floorplan
  - svg-floorplan
  - room-brief
  - orbit-turntable
  - mesh-massing
  - dimension-confirmation
  - golden-hour
  - night-render
  - brief-builder
---
# Floorplan Architect Skill

Turn any 2D floorplan into furnished 3D stills and a walkthrough video. The user brings a plan from a popular home app (or a sketch), picks a style direction (or defers to defaults), and the agent runs a reproducible pipeline: import, brief, confirm, build, review, render, encode.

```
[App Export / Sketch] --> [byof_import] --> [brief.json] --> [validate_brief]
                                                              |
                                                     [User Confirmation]
                                                              |
[Stills + MP4 + .blend] <-- [Review Rounds] <-- [Blender build.py] <--+
```

## 1. Pipeline Overview

* Every engagement produces one `tour/` folder: `brief.json`, `build.py`, `stills/`, `walkthrough.mp4`, `scene.blend`.
* The brief is the single source of truth. Nothing is modeled until `validate_brief.py` passes and the user confirms dimensions for estimated sources.
* Silent user defaults: contemporary style, daylight lighting, orbit clip plus room stills plus full walkthrough. User direction always overrides.
* All work is offline. No step requires network access.

## 2. Room Brief Schema

`brief.json` (v1, single level, metres):

```json
{
  "version": 1,
  "units": "m",
  "wallHeight": 2.7,
  "wallThickness": 0.15,
  "style": "contemporary",
  "lighting": "daylight",
  "rooms": [
    { "id": "living", "name": "Living Room", "rect": [0, 0, 5.2, 4.1], "floor": "oak" }
  ],
  "openings": [
    { "room": "living", "wall": "north", "type": "window", "center": 2.6, "width": 1.8, "sill": 0.9, "height": 1.4 }
  ],
  "shots": ["orbit", "stills", "walkthrough"],
  "estimated": false,
  "source": { "app": "magicplan", "format": "dxf", "file": "plan.dxf" }
}
```

* `rect` is `[x, y, width, depth]` in metres from the plan origin. Room width and depth must fall between 0.5 and 40.
* `wallHeight` must fall between 2.2 and 6. Openings must reference a known room and fit inside the wall span.
* `style` must exist in `templates.json`. `shots` may repeat and order freely among `orbit`, `stills`, `walkthrough`.
* `estimated: true` (raster sources) blocks the build until the user confirms every room dimension in chat.

## 3. Style Catalog & Defaults

Styles live in `templates.json` (palette, materials, furniture density, default lighting):

* **midcentury-modern**: Teak and walnut woods, mustard and olive accents, tapered legs, low profiles, starburst and globe lighting.
* **contemporary**: Neutral greys and warm whites, black metal accents, boucle fabrics, balanced density, soft layered light. The default style.
* **farmhouse**: Shiplap whites, reclaimed wood beams, apron sink kitchen cues, linen fabrics, lantern pendants.
* **bachelor-pad**: Dark walls, leather chesterfield cues, glass and steel bar zone, neon accent strip, moody spots.
* **flat-pack-scandi**: Pale birch and white laminates, compact modular modules, pastel textiles, bright even daylight.
* **luxury-penthouse**: Marble and brass, velvet upholstery, rich density, chandelier focals, city glow night option.

Lighting presets: **daylight** (sun plus sky, area fills at glazing), **golden-hour** (low warm sun, long shadows), **night-render** (practical lamps on, dim cool world, emissive fixtures). Camera lens for interiors: 20 to 35 mm.

## 4. BYOF Source Registry

Each app declares export formats in preference order, a fidelity tier, and a tested-against note. Adapters fail loudly on unknown formats.

### 4.1 MagicPlan (measured first choice)
* Exports include PDF, JPG, PNG, SVG, CSV, DXF, OBJ, and USDZ. Prefer DXF (measured CAD), then SVG (measured vector).
* CSV measurement import is experimental-gated: the importer refuses unknown columns and asks the user to confirm values.
* OBJ/USDZ 3D exports feed the mesh massing track (Section 4.8), not the brief.

### 4.2 RoomSketcher (confirmation path)
* Exports JPG, PNG, and PDF only; no CAD-compatible formats exist. Raster path always.
* Agent drafts the brief from the image plus stated dimensions, then the user confirms every room before the build. Never present traced dimensions as measured.

### 4.3 Live Home 3D (raster plus mesh)
* 2D plans export as PDF, JPEG, BMP, TIFF, or PNG. 3D designs export as OBJ, FBX, glTF, USDZ, COLLADA, VRML, or X3D. No DXF or DWG export exists.
* Plan path is raster with dimension confirmation; mesh exports feed the massing track. The app records its own walkthroughs; this skill produces the styled, furnished cut.

### 4.4 Floorplanner (file first)
* File exports cover JPG, PNG, PDF, DXF, and SVG. Prefer DXF, then SVG, then raster with confirmation.
* The vendor API (with FML XML and GLB mesh export) and FML parsing are stretches; v1 stays file based with no accounts or keys.

### 4.5 Planner 5D (CAD export)
* One-click DWG/DXF export exists; tier gating is confirmed at execution (the user verifies their plan includes it).
* Prefer DXF for the brief; raster exports fall back to the confirmation path.

### 4.6 Home Design 3D (confirm installed build)
* Vendor store copy advertises blueprint JPEG/PDF plus DXF 2D and 3D export. On first use with this app, confirm the export menu against the installed build and record the result in `tour/source-notes.md`.
* Prefer DXF, then raster with confirmation.

### 4.7 Sweet Home 3D (open, vector friendly)
* Plan exports to SVG, 3D scenes to OBJ, plus PDF and PNG stills. Prefer SVG (measured vector), then raster with confirmation; OBJ feeds the massing track.

### 4.8 Mesh Massing Track
* Apps exporting OBJ, glTF, FBX, USDZ, or COLLADA can supply massing: the vendor mesh imports into Blender as a blockout reference, then the agent re furnishes, re lights, and re shoots per the style template. Headless import-operator availability is probed at execution; if an operator needs a UI context, the agent documents a desktop import fallback instead of failing silently.

### 4.9 Generic CAD Track
* Pro tools (Revit, ArchiCAD, Chief Architect, SketchUp, AutoCAD) feed the generic DXF/DWG/PDF path with no per-app code: DXF parses measured, PDF needs an image companion. First use with any pro tool records the tested export in `tour/source-notes.md`.

### 4.10 Fidelity Tiers & Confirmation Protocol
* **Measured** (DXF/SVG vector): builds directly after `validate_brief.py` passes.
* **Estimated** (raster, PDF, unconfirmed): the brief carries `estimated: true` and the build is blocked until the user confirms dimensions. The agent states each room dimension back and waits.
* PDF is never machine parsed in v1; it must arrive with a PNG or JPG companion for the visual flow.

## 5. Blender Build Rules

* **One idempotent script** (`tour/build.py`). `P = {...}` tunables at the top (brief path, style, lighting, output dir). Rerunning reproduces the scene exactly; seeded randomness only.
* **Preview and final modes** in the same script. Preview: EEVEE or low-sample Cycles at 50 percent. Final: Cycles at full 1920x1080 with denoising when the build supports it.
* **Conventions**: metres, Z up, walls extruded to `wallHeight`, openings cut as booleans, floors per room material, ceilings plus cove or fixture mounts.
* **Furniture**: place from the style density (sparse/balanced/rich) using the procedural starter kit plus user supplied GLB packs; every placed piece grounds at floor level (`ground_contacts` equivalent check) and stays inside its room rect.
* **Materials**: template palettes as Principled setups; add grain and roughness variation so large surfaces never read flat.
* **Lights**: per the lighting preset section; practical fixtures get emissive shades; exposures checked against clipped whites and crushed blacks.
* Run headless as `blender -b --factory-startup --python-exit-code 1 -P tour/build.py -- --brief tour/brief.json [--final]`.

## 6. Camera Paths & Shots

* **orbit**: Exterior massing turntable, 8 seconds, 24 fps, eye level slightly above eaves, full 360 degrees.
* **stills**: Two angles per room (wide corner plus focal detail) at 1920x1080 PNG into `tour/stills/`.
* **walkthrough**: Interior spline through doorways at 1.6 m eye height with look targets per room, eased moves, 2 to 3 seconds per room plus 1 second transitions; 30 fps H264 MP4.
* Every shot renders a contact sheet first; the agent views frames and fixes the single most visible defect per round (missing parts, proportions, framing, light, materials, details, in that order).

## 7. Encode & Deliverables

```bash
# Stills (from Blender directly)
blender -b --factory-startup --python-exit-code 1 -P tour/build.py -- --brief tour/brief.json --final --only-stills

# Walkthrough frames to MP4
ffmpeg -y -framerate 30 -i tour/frames/walk_%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p tour/walkthrough.mp4
```

* Deliverables: `tour/brief.json`, `tour/build.py`, `tour/stills/*.png`, `tour/walkthrough.mp4`, `tour/scene.blend`.
* `build.py` must rerun cleanly before handoff; frames or MP4 outputs are spot checked, never assumed.

## 8. CLI Workflows

```bash
# Environment probe (Blender, ffmpeg, versions)
python .skills/floorplan-architect/scripts/probe_render_env.py

# Import a source export into a brief (+ fidelity report)
python .skills/floorplan-architect/scripts/byof_import.py --source magicplan --format dxf --input plan.dxf -o tour/brief.json
python .skills/floorplan-architect/scripts/byof_import.py --source roomsketcher --format png --input plan.png -o tour/brief.json --accept-estimated
python .skills/floorplan-architect/scripts/byof_import.py --list-sources

# Validate the brief (blocks bad dimensions, unknown styles, dangling openings)
python .skills/floorplan-architect/scripts/validate_brief.py --brief tour/brief.json

# Open the sandbox brief builder for sketch-first sessions
start .skills/floorplan-architect/sandbox/index.html
```

## Directives

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
* **Brief Before Build**: Never model before `validate_brief.py` passes and estimated dimensions are user confirmed.
* **Defaults With Override**: Silent users get contemporary style, daylight lighting, and the full shot list; any user direction overrides without argument.
* **Offline Only**: No step may require network access; fetch nothing at runtime.
* **Fail Loudly**: Unknown formats, unverified operators, and missing engines produce clear errors with the next action, never silent degradation or guessed dimensions.
