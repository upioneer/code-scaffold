# Release v3.8.12 - Component Models and Dynamic Structure Loaders

## Overview
This patch establishes the foundational data layer for the frontend scaffolding interface.

## Major Changes
* **Dynamic Tree Expansion:** Implemented a new recursive `FileNode` model that acts as an in-memory replica of the local filesystem. Bypassed default terminal limitations by hooking into the `NavTree` component so that Up/Down navigation correctly updates the list selection while Enter/Left/Right explicitly mutate the expansion states of the node branches.
* **Deserialization Payload:** Built out the strongly-typed `Manifest` structures within `src/models/manifest.rs`. Hooked the deserialization engine directly into the `Workspace` component so that it instantly parses the local `manifest.json` on boot, proving correct layout loading metrics onto the screen.
