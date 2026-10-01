# CAD Tools: Real-Time Interactive Workbench & In-Page Chat Roadmap

This document outlines the architectural blueprint and progressive evolution roadmap for transforming the CAD Tools 3D visual sandbox into a live, bidirectional companion application. By establishing continuous, low-latency communication between the user, the AI agent, and the 3D viewport, this architecture eliminates traditional window switching and creates a unified, real-time computer-aided design environment.

---

## 1. Vision: The Closed-Loop Generative CAD Paradigm

In conventional CAD modeling workflows with AI assistants, the interaction loop is fragmented across multiple disparate interfaces:
* The user prompts the agent in a terminal or separate chat window.
* The agent synthesizes Python or FreeCAD scripts headlessly.
* The user must launch an external viewer or desktop GUI to inspect the resulting geometry.
* The user evaluates mechanical tolerances or structural defects visually, switches back to the terminal, and manually describes iterative adjustments.

The **Real-Time Interactive Workbench** closes this loop:
* The user operates inside a single unified 3D canvas with an integrated conversational chat drawer.
* User prompts stream directly to the agent runtime alongside the live geometric context (active bounding box, material selections, and Alien Meter settings).
* The agent commands the headless FreeCAD engine and topology optimization solver in the background.
* Updated B-Rep geometry and recalculated FEA stress tensors stream directly back into the Three.js viewport in real time.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Interactive 3D WebGL Workbench                       │
│                                                                        │
│  ┌───────────────────────────┐      ┌───────────────────────────────┐  │
│  │   In-Page Chat Drawer     │      │   3D Viewport Stage           │  │
│  │   (Natural Language Loop) │      │   (Three.js PBR Engine)       │  │
│  └─────────────┬─────────────┘      └───────────────▲───────────────┘  │
│                │                                    │                  │
│                │ Natural Prompt + 3D Context        │ Live Mesh & FEA  │
└────────────────┼────────────────────────────────────┼──────────────────┘
                 │                                    │
                 ▼                                    │
┌─────────────────────────────────────────────────────┼──────────────────┐
│             Localhost IPC Bridge & WebSocket Daemon │                  │
│             (scripts/freecad_bridge.py --daemon)    │                  │
└────────────────┬────────────────────────────────────┼──────────────────┘
                 │                                    │
                 ▼                                    │
┌─────────────────────────────────────────────────────┴──────────────────┐
│                   CAD Tools Execution Kernel                           │
│                                                                        │
│  ┌───────────────────────────┐      ┌───────────────────────────────┐  │
│  │  Agent Cognitive Loop     │      │   FreeCAD & SIMP Topo Engine  │  │
│  │  (Parametric Synthesis)   │◄────►│   (B-Rep Solids / FEA Solvers)│  │
│  └───────────────────────────┘      └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Current State: Phase 0 Baseline

The skill currently provides a solid foundation of modular components:
* **Interactive 3D Sandbox (`sandbox/index.html`):** Client-side WebGL Three.js canvas featuring the Alien Meter continuum slider, dark slate styling, four engineering presets, FEA stress shader, PBR alloy materials, and multi-format export buttons.
* **FreeCAD Socket Bridge (`scripts/freecad_bridge.py`):** Python socket client capable of talking to running FreeCAD GUI instances via Streamable HTTP (`POST /mcp`), legacy SSE (`GET /sse`), or running batch scripts headlessly via `FreeCADCmd`.
* **Topology Engine (`scripts/topo_engine.py`):** SIMP power-law optimization math ($E_e = \rho_e^p E_0$), mass reduction calculators, and Engineering Compromise Card generation.
* **Declarative Pipeline (`workflows/parametric_pipeline.yaml`):** Structured task orchestration file mapping input parameters to compiled STEP and STL deliverables.

---

## 3. The Four-Phase Evolution Roadmap

### Phase 1: Live Artifact Synchronization (Agent -> Viewport)
* **Goal:** Enable parts generated during normal agent CLI prompting to automatically render inside the 3D sandbox without manual file opening.
* **Mechanics:**
  * When the agent synthesizes a part or runs `topo_engine.py`, the build pipeline saves a display mesh to `.cad_runtime/current_part.glb` alongside a telemetry manifest `.cad_runtime/current_part.json`.
  * The sandbox implements a lightweight polling listener (or `BroadcastChannel` API) that detects timestamp changes in `.cad_runtime/current_part.json`.
  * Upon detection, the Three.js scene dynamically transitions the existing model, loading the new geometry and populating the Engineering Compromise Card with real solver outputs.
* **Deliverables:**
  * Local runtime state folder structure (`.cad_runtime/`).
  * Sandbox auto-reload toggle button in HUD.
  * Fast binary glTF/GLB exporter added to `scripts/freecad_bridge.py`.

---

### Phase 2: In-Page Conversational Chat Drawer (UI Component)
* **Goal:** Embed a native conversational chat interface directly inside `sandbox/index.html` so users never need to leave the 3D viewport.
* **Mechanics:**
  * A sliding glass drawer anchored to the left flank of the sandbox interface, styled to match the dark slate and cyan Code Scaffold theme.
  * Message thread showing user prompts, agent progress tokens, and structured engineering cards (e.g. proposed dimension changes, FEA warnings).
  * State Context Injection: Every outgoing chat message automatically attaches a JSON metadata block summarizing active scene properties:
    * `alien_meter_value` (0 to 100).
    * `active_material` (e.g. AlSi10Mg Aluminum, Ti-6Al-4V Titanium).
    * `bounding_box` dimensions.
    * `selected_features` or face IDs.
* **Deliverables:**
  * HTML/CSS chat drawer component with collapsible toggle.
  * Message history management with local storage persistence.
  * Context packaging engine serializing 3D viewport state into chat payloads.

---

### Phase 3: Bidirectional WebSocket & IPC Daemon (Full Synchrony)
* **Goal:** Real-time two-way communication where UI controls trigger FreeCAD parametric rebuilds and agent actions manipulate the 3D canvas live.
* **Mechanics:**
  * A lightweight background Python WebSocket server running via `scripts/freecad_bridge.py --daemon --port 8765`.
  * The sandbox opens a persistent socket connection (`ws://localhost:8765`).
  * When the user adjusts the Alien Meter slider in the browser:
    1. Browser emits `param_scrub` event with new alien percentage and target mass fraction.
    2. Daemon executes a fast parametric update in FreeCAD or runs a SIMP density pass.
    3. Daemon streams the re-meshed geometry buffer directly back over the socket.
    4. Viewport morphs the mesh seamlessly without a full page refresh.
  * When the user submits a chat message:
    1. Browser emits `chat_message` over the socket to the agent listener.
    2. Agent receives prompt with current 3D context, generates code, and streams status back.
* **Deliverables:**
  * Async WebSocket server module in `scripts/freecad_bridge.py`.
  * Structured JSON-RPC event router.
  * Low-latency binary mesh streaming protocol.

---

### Phase 4: Real-Time FEA Stream & Multi-Agent Co-Design
* **Goal:** High-fidelity finite element stress streaming and collaborative multi-agent engineering.
* **Mechanics:**
  * Continuous solver updates: As the user drags mounting points or load vectors in 3D, the solver computes principal stress tensors and vertex colors dynamically.
  * Multi-agent conversation threads: Specialized agent personas (Structural Engineer, Thermal Specialist, Additive Manufacturing Slicer) collaborate within the in-page chat drawer, annotating 3D geometry with colored inspection markers.
* **Deliverables:**
  * Dynamic vertex color shader for interactive FEA stress mapping.
  * Multi-persona agent routing hooks.
  * Interactive 3D measurement and dimension annotation tools.

---

## 4. WebSocket Event Specification

```json
// Event: Client submits natural language prompt
{
  "event": "chat_message",
  "data": {
    "prompt": "Increase the mounting boss thickness to 8mm and recalculate safety factor",
    "context": {
      "model_type": "bracket",
      "alien_level": 45,
      "material": "al10",
      "active_mass_g": 210.5,
      "camera": { "x": 12.5, "y": 8.2, "z": 15.0 }
    }
  }
}

// Event: Daemon streams agent status
{
  "event": "agent_status",
  "data": {
    "state": "SOLVING_FEA",
    "message": "Evaluating principal stress tensors under 500N load..."
  }
}

// Event: Daemon pushes compiled geometry and telemetry
{
  "event": "geometry_update",
  "data": {
    "mesh_url": "/cad_runtime/updated_bracket.glb",
    "telemetry": {
      "mass_reduction_pct": 42.1,
      "active_mass_g": 185.3,
      "max_von_mises_mpa": 138.2,
      "factor_of_safety": 1.95,
      "max_deflection_mm": 0.28,
      "printability_pct": 94.0
    }
  }
}
```

---

## 5. Security & Isolation Guarantees

* **Localhost-Only Binding:** All socket and HTTP listeners must bind strictly to `127.0.0.1` to prevent external network exposure.
* **No Cloud Geometry Leakage:** All 3D meshes, B-Rep solids, and proprietary structural data remain strictly on the local machine.
* **Graceful Offline Fallback:** If the WebSocket bridge or daemon is offline, the sandbox degrades gracefully to offline client-side procedural simulation mode with clear connection status badges.
