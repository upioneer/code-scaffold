# PlayCanvas SuperSplat

**Version:** 4

**Target:** `.skills/playcanvas-supersplat`

**Category:** Animation & Graphics

**Keywords:** `playcanvas-supersplat`, `gaussian-splats`, `3d-splatting`, `point-cloud`, `photogrammetry`, `radiance-fields`, `ply-optimizer`, `supersplat`, `gaussian-splatting`, `splat-editing`, `3dgs`, `splat-cleanup`, `ply-compression`, `3d-scanning`, `point-cloud-editing`, `web-viewer`

## Description
High performance tool for editing and optimizing 3D Gaussian Splats.

## Capabilities & Use Cases
* **Local Environment Scaffolding**: Effortlessly boots local development servers (Port 3000) for custom tool iteration and rapid visual testing.
* **Gaussian Splat Diagnostics & Cleaning**: Harnesses the PlayCanvas Engine and `splat-transform` library to programmatically scrub `.ply` or `.splat` files of outlier points and artifacting.
* **Precision Volumetric Cropping**: Enables defining strict 3D bounding boxes to accurately isolate, cut, and extract specific environmental or object captures.
* **Deep File Optimization**: Automatically compresses and downsizes raw 3D splat datasets, drastically reducing transmission payload sizes while protecting critical visual fidelity.
* **PCUI Framework Integration**: Fully integrates with the underlying `PCUI` system in the `src/` directory for extending or building entirely new user interface panels.
* **Localization Pipeline**: Direct hooks for managing and injecting robust internationalization strings into the `static/locales/` directory.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v4** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v3** : Standardized ASCII art logo to uniform 6-line ANSI Shadow format.
* **v2** : Expanded capability descriptions
* **v1** : Core skill implementation
