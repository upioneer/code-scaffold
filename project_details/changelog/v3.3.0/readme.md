# Version 3.3.0 Walkthrough

## Overview
This version introduces a suite of PlayCanvas-related skills, enabling AI agents to rapidly bootstrap 3D game engines, visual editors, and Gaussian Splat optimization tools.

## New Features

### PlayCanvas Engine Skill
Provides a modular foundation for 3D/2D graphics on the web.
*   **Capabilities:** Instructions for `npm create playcanvas`, minimal scene setup, and asset loading.
*   **AI Context:** Explicitly points agents to the engine's `AGENTS.md` for specialized guidance.

### PlayCanvas Editor Skill
Focuses on the visual collaboration frontend.
*   **Capabilities:** Local development workflows (`npm run develop`) and API automation patterns for asset and hierarchy management.
*   **Standards:** Mandates adherence to `CLAUDE.md` and `AGENTS.md` rules found in the editor repository.

### PlayCanvas SuperSplat Skill
A specialized tool for 3D Gaussian Splat optimization.
*   **Capabilities:** Workflows for cleaning, cropping, and optimizing `.ply` and `.splat` files.
*   **Integration:** Guidance on using the `splat-transform` library and PCUI framework.

## Maintenance Updates
*   **Manifest Sync:** Root `manifest.json` updated to version 3.3.0.
*   **Documentation:** Updated project `README.md` and `.skills/README.md` with alphabetized PlayCanvas entries.
*   **Protocol:** Followed the strict execution sequence for adding significant payload features.

## Technical Details
The new skills are located in:
*   `.skills/playcanvas-engine`
*   `.skills/playcanvas-editor`
*   `.skills/playcanvas-supersplat`
