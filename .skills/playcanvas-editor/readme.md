# PlayCanvas Editor

**Version:** 4

**Target:** `.skills/playcanvas-editor`

**Category:** Animation & Graphics

**Keywords:** `playcanvas-editor`, `3d-engine`, `webgl`, `webgpu`, `scene-editor`, `gltf`, `spatial-dev`, `scene-hierarchy`, `entity-component-system`, `collaborative-editing`, `browser-3d-editor`, `asset-pipeline`, `script-components`, `publish-builds`, `realtime-collaboration`, `web-3d`

## Description
Visual development environment for real time 3D collaboration.

## Capabilities & Use Cases
* **Local Architecture Development**: Streamlined workflows for bootstrapping and running the core editor frontend locally via `npm run develop` (Port 3487) with `?use_local_frontend` URL injection.
* **Strict Code Compliance Engine**: Deeply integrates with internal repository constraints (`CLAUDE.md`, `AGENTS.md`) to guarantee strict stylistic and structural adherence during codebase modification.
* **Headless API Automation**: Provides direct programmatic hooks into the global `editor` object for hyper-efficient asset management, automated renaming, and batch-updating properties.
* **Procedural Hierarchy Generation**: Enables dynamic, programmatic construction and manipulation of complex entity trees directly through the editor's headless API layer.
* **E2E Playwright Testing**: Seamless integration with the internal Playwright testing suite (`test-suite/`) to continuously validate API integrity, UI interactions, and systemic editor stability.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v4** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v3** : Standardized ASCII art logo to uniform 6-line ANSI Shadow format.
* **v2** : Expanded capability descriptions
* **v1** : Core skill implementation
