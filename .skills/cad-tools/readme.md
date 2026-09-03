# CAD Tools

**Version:** 2
**Target:** `.skills/cad-tools`
**Category:** Animation & Graphics
**Keywords:** `cad`, `3d-modeling`, `step-files`, `stl`, `parametric-design`, `manufacturing`, `engineering`

## Description

A comprehensive CAD/CAM engineering skill that equips AI agents with the full design-to-manufacture pipeline: parametric 3D modeling, multi-format conversion, AI-generative geometry, desktop CAD automation, and manufacturing readiness validation.

## Capabilities & Use Cases

* **Code-as-CAD Parametric Modeling** using `build123d` (Python) and the OpenCASCADE geometric kernel: agents write version-controlled, fully parametric Python scripts instead of generating opaque binary files, enabling exact edits, diffs, and reproducible compilation
* **JSON-to-CAD Interoperability Engine:** Translates GhostPoly-inspired JSON schemas directly into B-Rep solid geometry for cross-platform and web UI database integrations
* **Solid B-Rep geometry generation** producing engineering-grade STEP files from natural language or structured specs, with support for shells, fillets, chamfers, Boolean operations, and named-parameter architectures
* **Multi-Format Export Pipeline:** STEP (engineering), STL (FDM/SLA printing), DXF (CNC/laser cutting), 3MF (modern print format), glTF/GLB (web/AR visualization), OBJ (legacy mesh interchange), DWG (AutoCAD native)
* **Zoo.dev / KittyCAD Cloud AI Generation:** Submit natural language prompts to the Zoo REST API to generate STEP + KCL parametric code from cloud GPU-accelerated ML models; poll async job status and decode base64-encoded output files
* **Zoo File Format Conversion API:** Programmatic format conversion across 10+ CAD formats via the Zoo cloud endpoint with a single Python function call
* **Zoo Mass Properties API:** Remote calculation of exact volume, surface area, center of mass, and inertia tensors for engineering analysis
* **Windows COM Desktop CAD Automation:** Direct COM IPC bridge to AutoCAD, ZWCAD, and GstarCAD via `pywin32`/`comtypes`; supports drawing lines, polylines, circles, arcs, hatches, text, layer creation, and DWG/DXF save operations
* **Off-Screen VTK Rendering:** Generate PNG snapshots of STEP/STL models from configurable camera angles (isometric, front, top, right) for multimodal AI visual inspection and client-ready renders
* **trimesh Manufacturing Validation:** Automated watertightness checks, winding consistency, overhang angle analysis (45-degree FDM rule), thin-wall detection, volume/surface area measurement
* **CNC Machinability Checks:** Pocket width vs. end-mill diameter validation, undercut detection on non-bottom faces, and spindle axis visibility analysis
* **Geometric Measurement & Self-Validation:** Bounding box extraction, volume-to-weight conversion (PLA, PETG, Al6061, Steel), surface area reporting, and automatic anomaly alerts before file delivery
* **Bill of Materials (BOM) Generation:** Structured CSV BOM output including part numbers, descriptions, quantities, materials, unit weights, unit costs, supplier references, and fabrication notes
* **Project Structure Convention Enforcement:** Canonical `cad/models/`, `cad/output/`, `cad/bom/`, `cad/docs/` directory layouts with enforced `.gitignore` rules excluding binary CAD output files from version control
* **Robotics Model Support:** URDF, SRDF, and SDF format output for ROS/robotics integration via `build123d` extensions
* **Format Decision Guidance:** Decision matrix mapping use cases (printing, CNC, web, enterprise CAD) to optimal output formats with toolchain recommendations

## Usage

Activate this skill for any task involving:
- Designing 3D enclosures, brackets, mechanical parts, or assemblies
- Translating JSON geometric schemas into compiled CAD files
- Converting CAD files between engineering formats
- Generating AI-driven 3D geometry from natural language descriptions
- Automating drawing workflows in AutoCAD/ZWCAD via COM
- Validating 3D print readiness or CNC machinability
- Computing geometric mass properties for engineering analysis
- Maintaining structured BOM documentation alongside CAD models

## Changelog

* **v1** : Initial release covering build123d parametric modeling, Zoo.dev cloud API (text-to-CAD, format conversion, mass properties), Windows COM desktop automation (AutoCAD/ZWCAD/GstarCAD), VTK off-screen rendering, trimesh validation, CNC machinability checks, BOM management, and project structure conventions.
* **v2** : Added JSON-to-CAD interoperability engine.
