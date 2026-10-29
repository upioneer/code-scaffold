# Excalidraw

**Version:** 5

**Target:** `.skills/excalidraw`

**Category:** Publishing & Documentation

**Keywords:** `excalidraw`, `virtual-whiteboard`, `hand-drawn-diagrams`, `architecture-diagram`, `canvas`, `visuals`, `whiteboard-embed`, `sketch-diagrams`, `excalidraw-json`, `svg-export`, `png-export`, `system-design-diagrams`, `react-embed`, `flowchart-sketch`, `diagram-automation`

## Description
Renders and embeds Excalidraw whiteboards

## Capabilities & Use Cases
* Grants the agent the ability to design, generate, and edit professional visual diagrams using the Excalidraw JSON format.
* Focuses on diagramming conceptual architectures, flowcharts, and mental models utilizing real code snippets and data structures as evidence artifacts.
* Performs depth assessments to output Abstract (high level), Technical (detailed), or Comprehensive (full documentation) visualizations.
* Enforces strict visual pattern libraries including Fan-out, Convergence, and Assembly Line workflows.
* Ensures brand consistency by rigidly applying project-specific color palettes.
* Intelligently segments large architecture diagrams to remain within token limits during generation.
* Operates on constraints enforcing high opacity, font-based hierarchy, strict absence of emojis, and structured readable JSON components.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v5** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v4** : Standardized hasSandbox to false to mount the clean Architectural Contract card on code-scaffold.com.
* **v3** : Deployed custom interactive visual sandbox
* **v2** : Expanded capability descriptions
* **v1** : Core skill implementation
