---
name: PlayCanvas SuperSplat
description: High-performance tool for editing and optimizing 3D Gaussian Splats.
---

# PlayCanvas SuperSplat Skill

## Overview
This skill provides instructions for using and developing SuperSplat, the industry-standard tool for 3D Gaussian Splat optimization.

## AI Agent Instructions

### 1. Development & Launch
Standard workflow for running the tool locally:
```bash
npm install
npm run develop # Defaults to port 3000
```

### 2. Splat Manipulation
SuperSplat leverages the PlayCanvas Engine and `splat-transform` library. Use these for:
*   **Cleaning:** Removing outlier points from `.ply` or `.splat` files.
*   **Cropping:** Defining bounding boxes to isolate specific captures.
*   **Optimization:** Reducing file size while maintaining visual fidelity.

### 3. Integration Patterns
*   **Localization:** Add or update translations in `static/locales/`.
*   **UI Customization:** Utilize the PCUI framework patterns found in the `src/` directory.
