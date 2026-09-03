---
name: PlayCanvas Engine
description: Modular 3D/2D game engine for the web supporting WebGL and WebGPU.
---

# PlayCanvas Engine Skill

## Overview
This skill provides guidance and boilerplate for working with the PlayCanvas Engine, a high-performance 3D/2D graphics engine for the web.

## AI Agent Instructions
When an agent sees this skill, it should prioritize the following patterns:

### 1. Project Initialization
Use the official CLI to scaffold new engine-only projects:
```bash
npm create playcanvas@latest
```

### 2. Scene Setup Boilerplate
A minimal scene requires an `Application`, a `Camera`, and a `Light`:
```javascript
import * as pc from 'playcanvas';

const canvas = document.getElementById('application-canvas');
const app = new pc.Application(canvas);

// Create camera entity
const camera = new pc.Entity('camera');
camera.addComponent('camera', { clearColor: new pc.Color(0.1, 0.1, 0.1) });
app.root.addChild(camera);
camera.setPosition(0, 0, 3);

// Create light entity
const light = new pc.Entity('light');
light.addComponent('light');
app.root.addChild(light);
light.setEulerAngles(45, 0, 0);

app.start();
```

### 3. Contextual Awareness
*   **AGENTS.md:** Always look for and adhere to the `AGENTS.md` file in the engine repository for specific LLM instructions.
*   **Types:** Utilize `playcanvas.d.ts` for full API discovery.

### 4. Common Tasks
*   **Asset Loading:** Use `app.assets.load(asset)` for async asset management.
*   **Scripting:** Attach logic via `app.systems.script.addComponent(entity, { scripts: [...] })`.
