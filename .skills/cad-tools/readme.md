# CAD Tools

**Version:** 8

**Target:** `.skills/cad-tools`

**Category:** Animation & Graphics

**Keywords:** `cad`, `generative-design`, `topology-optimization`, `alien-meter`, `fea-stress`, `additive-manufacturing`, `dmls`, `sls`, `3d-modeling`, `step-files`, `stl`, `parametric-design`, `freecad`, `partdesign`, `b-rep`, `opencascade`, `sketcher`, `boolean-operations`, `streamable-http`, `headless-cad`, `offscreen-rendering`, `undo-transactions`, `3mf`

## Description

A comprehensive CAD/CAM engineering skill that equips AI agents with the full design-to-manufacture pipeline: generative design and topology optimization with the Alien Meter slider, native FreeCAD socket and headless automation, parametric 3D modeling, additive manufacturing validation, and an interactive 3D WebGL Three.js visual workbench.

## Capabilities & Use Cases

* **Real-Time Interactive Workbench Architecture & Evolution Roadmap:** A phased closed-loop architecture integrating live Three.js 3D viewport synchronization, in-page conversational agent chat drawer, bidirectional WebSocket IPC, and real-time SIMP/FEA telemetry recalculation
* **Generative Design and Topology Optimization (Topo):** AI and algorithm-driven material redistribution via SIMP (Solid Isotropic Material with Penalization) and FEA compliance minimization, automatically channeling loads along branching stress paths while evacuating dead-weight material
* **The "Alien Meter" Slider and Structural Tradeoff Engine:** Parameterizes the organic bio-morphology spectrum from 0% (prismatic CNC geometry, maximum rigidity, FS >= 3.0) through 50% (aerospace structural TopOpt for DMLS/SLS, FS 1.5 - 2.0) up to 100% (hyper-organic biomechanical art and TPMS minimal surfaces, FS < 1.0, decorative only)
* **Live Engineering Compromise Card:** Deterministic telemetry reporting mass reduction percentage, active component mass, Factor of Safety (FS), peak Von Mises stress relative to yield strength, max elastic deflection, and additive printability ratings
* **Interactive 3D WebGL Generative Workbench Sandbox:** Full-screen browser-native canvas with real-time procedural geometry deformation across four engineering presets (Aerospace Cantilever Bracket, Drone Arm, Carapace Heat Sink, and TPMS Gyroid Core), FEA stress heatmap shader, X-ray void inspection, and multi-format asset exports
* **Additive Manufacturing Engineering (DMLS, SLS, FDM):** Built-in orientation rules, 45-degree self-supporting overhang constraints, depowdering channels for metal powder bed fusion, and minimum wall thickness thresholds
* **FreeCAD AI Connector and Socket Automation Bridge:** Connects external agents directly to a running FreeCAD GUI session via Streamable HTTP (endpoint `POST /mcp`) or legacy SSE (endpoint `GET /sse` and `POST /messages`) on port 3000, allowing real-time viewport updates and interactive model manipulation
* **Desktop AI Model Context Protocol Bridge:** Seamless configuration with ChatGPT Desktop, Claude Desktop, Cursor, and Devin via on-demand Python tool runner (`uvx freecad-mcp`), featuring dual code execution (`execute_code`) and viewport screenshot verification (`get_view`) with optional token saving mode (`--only-text-feedback`)
* **Interactive Cognitive Modeling Workflows:** Standardized interaction routines for Measure and Propose against reference CAD parts, concept refinement with industrial chamfers and cooling grilles, multi-part assembly tolerances, and targeted face selection edits
* **Headless FreeCAD Execution Engine:** Programmatic execution of Python modeling scripts via `FreeCADCmd` or `FreeCAD -c` for background compilation, CI/CD matrices, and batch conversions with automated file-descriptor banner redirection
* **Transactional Safety and Error Self-Correction:** Wraps all atomic CAD modifications in native FreeCAD undo transactions (`openTransaction` and `commitTransaction`), automatically executing `abortTransaction` upon geometry failure and feeding tracebacks back to the agent for self-corrective retry loops
* **Structured PartDesign Workbench Operations:** Comprehensive library of over 50 structured CAD tools including `create_body`, `create_sketch`, `pad_sketch`, `pocket_sketch`, `revolve_sketch`, `groove_sketch`, `loft_sketches`, `sweep_sketch`, and parametric `PartDesign::Boolean` operations that preserve full feature tree history
* **Parametric Sketcher Constraints:** Automated generation and validation of 2D profile constraints on standard planes (XY, XZ, YZ), parallel offset datum planes, or planar solid faces with Coincident, Horizontal, Vertical, Distance, Radius, and Angle rules
* **Auto-Directional Cavity and Pocketing Analysis:** Intelligent pocketing routines that test forward and reversed cut trajectories to maximize material removal when hollowing enclosures while guaranteeing bottom floor thickness
* **Multimodal Offscreen Rendering and Telemetry:** High-resolution PNG viewport snapshot capture via FreeCAD `ActiveView.saveImage` or off-screen VTK rendering, generating multi-angle views (isometric, front, top, side) for multimodal visual feedback
* **Code-as-CAD Parametric Modeling:** Native parametric scripting with `build123d` and the OpenCASCADE geometric kernel, producing version-controlled, diffable Python scripts that compile deterministically to solid B-Rep models
* **JSON-to-CAD Interoperability Engine:** Translates structured JSON schemas directly into compiled B-Rep solid geometry for web UI, database, and cross-platform agent integrations
* **Solid B-Rep Geometry Generation:** Produces engineering-grade STEP files from natural language or structured parameter tables, supporting complex shells, draft angles, fillets, and chamfers
* **Multi-Format Export Pipeline:** STEP (engineering interchange), STL (FDM/SLA 3D printing), DXF (CNC laser/waterjet cutting), 3MF (additive manufacturing metadata), glTF/GLB (web and AR visualization), OBJ (mesh interchange), DWG (desktop CAD), and native `.FCStd` archives
* **Cloud Generative CAD APIs:** Submit natural language prompts to Zoo REST APIs to synthesize STEP and KCL parametric source code, poll asynchronous generation status, and retrieve compiled CAD models
* **Windows COM Desktop CAD Automation:** Direct COM IPC bridge to AutoCAD, ZWCAD, and GstarCAD via `pywin32` or `comtypes`, supporting automated 2D drafting, layer provisioning, and DWG/DXF persistence
* **Manufacturing Readiness and Mesh Auditing:** Automated trimesh analysis verifying watertight manifoldness, face normal consistency, 45-degree overhang thresholds for FDM printing, and minimum wall thickness
* **CNC Machinability Validation:** Validates internal pocket radii against standard end-mill tooling diameters and flags potential undercuts along spindle axes
* **Bill of Materials (BOM) Management:** Generates structured CSV BOM manifests tracking part numbers, quantities, material densities, estimated costs, and fabrication specifications
* **Project Structure Convention:** Enforces canonical `cad/models/`, `cad/output/`, `cad/bom/`, and `cad/docs/` directory layouts with gitignore protections for binary build artifacts

## Usage

Activate this skill for any task involving:
* Simulating topology optimization and evaluating the Alien Meter tradeoff between stiffness and bio-morphology
* Validating structural Factor of Safety and peak Von Mises stresses for additive manufacturing (DMLS, SLS)
* Interacting with the 3D WebGL generative workbench sandbox to preview generative organic geometries
* Automating FreeCAD via Streamable HTTP/SSE sockets or headless CLI execution
* Designing parametric 3D parts, enclosures, brackets, or mechanical assemblies
* Generating 2D constrained sketches, extrusions, pockets, revolves, and lofts
* Translating JSON geometric schemas into compiled CAD files
* Converting CAD files across engineering formats (STEP, STL, DXF, 3MF, glTF)
* Validating 3D print readiness, overhangs, watertightness, or CNC machinability
* Generating AI-driven 3D geometry from natural language specifications
* Maintaining structured BOM documentation and inspection renders alongside CAD models

## Changelog
* **v8** : Established Real-Time Workbench Architecture & Interactive In-Page Chat Roadmap, defining the multi-tier bridge (Live Mesh Sync, In-Page Chat Drawer, Bidirectional WebSocket IPC, and Real-Time FEA Stream) linking user, agent, and 3D viewport.
* **v7** : Integrated Generative Design and Topology Optimization (Topo) suite featuring the Alien Meter slider, Engineering Compromise Card telemetry, DMLS/SLS additive manufacturing constraints, and interactive 3D WebGL Three.js workbench sandbox.
* **v6** : Integrated FreeCAD AI Connector and Parametric Engine Socket Bridge supporting GUI HTTP/SSE streamable socket control, headless STDIO JSON-RPC execution, PartDesign workbench automation, transactional rollbacks, and multimodal offscreen rendering.
* **v5** : Standardized ASCII art logo to uniform 6-line ANSI Shadow format.
* **v4** : Standardized hasSandbox to false to mount the clean Architectural Contract card on code-scaffold.com.
* **v3** : Integrated interactive CAD Tools Parametric 3D CAD Workbench sandbox and updated manifest flags
* **v2** : Added JSON-to-CAD interoperability engine.
* **v1** : Initial release covering build123d parametric modeling, Zoo.dev cloud API (text-to-CAD, format conversion, mass properties), Windows COM desktop automation (AutoCAD/ZWCAD/GstarCAD), VTK off-screen rendering, trimesh validation, CNC machinability checks, BOM management, and project structure conventions.
