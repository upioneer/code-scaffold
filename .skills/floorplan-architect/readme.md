# Floorplan Architect

**Version:** 1

**Target:** `.skills/floorplan-architect`

**Category:** Animation & Graphics

**Keywords:** `floorplan-architect`, `3d-walkthrough`, `byof-import`, `magicplan`, `roomsketcher`, `live-home-3d`, `floorplanner`, `planner-5d`, `home-design-3d`, `sweet-home-3d`, `walkthrough-video`, `furnished-render`, `interior-styling`, `style-templates`, `blender-rendering`, `camera-path`, `daylight-lighting`, `dxf-floorplan`, `svg-floorplan`, `room-brief`, `orbit-turntable`, `mesh-massing`, `dimension-confirmation`, `golden-hour`, `night-render`, `brief-builder`

## Description
Turn any 2D floorplan into furnished 3D stills and walkthrough video: BYOF import from MagicPlan, RoomSketcher, Live Home 3D, Floorplanner, Planner 5D, Home Design 3D, and Sweet Home 3D, interior style templates, validated room briefs, and headless Blender rendering with camera paths.

## Capabilities & Use Cases
* **BYOF Source Registry:** Imports floorplan exports from seven supported apps (MagicPlan, RoomSketcher, Live Home 3D, Floorplanner, Planner 5D, Home Design 3D, Sweet Home 3D) plus a generic CAD track for pro tools, each with declared formats, fidelity tiers, and tested-against notes.
* **Measured Vector Parsing:** Reads DXF room loops and SVG shapes with shared standard library parsers, reporting skipped entities and bounding assumptions instead of guessing.
* **Dimension Confirmation Protocol:** Raster and PDF sources always produce estimated briefs that block the build until the user confirms every room dimension in chat.
* **Mesh Massing Track:** Imports vendor OBJ, glTF, FBX, USDZ, and COLLADA exports as Blender blockout references, then re furnishes and re lights per the chosen style.
* **Interior Style Templates:** Six data driven styles (midcentury modern, contemporary, farmhouse, bachelor pad, flat pack scandi, luxury penthouse) with palettes, materials, furniture density, and default lighting.
* **Daylight, Golden Hour & Night Rendering:** Three lighting presets with sun, sky, window fill, practical lamp, and moon recipes tuned for home interiors.
* **Validated Room Briefs:** Versioned JSON briefs with dimension ranges, opening references, style and shot validation, plus an offline checker script with self-test fixtures.
* **Headless Blender Pipeline:** One idempotent build script per project with preview and final modes, room extrusions, opening booleans, grounded furniture, and template materials.
* **Camera Paths & Shots:** Exterior orbit turntables, two-angle room stills, and eased interior walkthrough splines at eye height with per-room look targets.
* **H264 Walkthrough Encoding:** Deterministic ffmpeg recipes turning rendered frame sequences into shareable MP4 deliverables.
* **Interactive Brief Builder:** Sandbox canvas app with grid sketching, style cards, shot lists, SVG drop import, and one-click brief JSON export.
* **Fail Loud Guarantees:** Unknown formats, unverified operators, and missing engines produce clear errors with next actions; estimated data is never presented as measured.

## Usage
Activate Floorplan Architect when you need to turn a floorplan into furnished 3D stills or a walkthrough video. Import the source export, validate the brief, confirm dimensions for estimated sources, then run the Blender build and review rounds.

```bash
# Probe the render environment (Blender, ffmpeg)
python .skills/floorplan-architect/scripts/probe_render_env.py

# Import a source export (measured DXF path)
python .skills/floorplan-architect/scripts/byof_import.py --source magicplan --format dxf --input plan.dxf -o tour/brief.json

# Import a raster export (estimated path, needs confirmation)
python .skills/floorplan-architect/scripts/byof_import.py --source roomsketcher --format png --input plan.png -o tour/brief.json --accept-estimated

# Validate before modeling
python .skills/floorplan-architect/scripts/validate_brief.py --brief tour/brief.json

# Sketch-first sessions: open the sandbox brief builder
start .skills/floorplan-architect/sandbox/index.html
```

## Changelog
* **v1** : Initial release: BYOF registry with seven floorplan apps plus generic CAD track, DXF/SVG parsers with fidelity tiers, six style templates with three lighting presets, room brief schema with offline validator, headless Blender pipeline with orbit/stills/walkthrough shots, MP4 encoding, and an interactive brief builder sandbox
