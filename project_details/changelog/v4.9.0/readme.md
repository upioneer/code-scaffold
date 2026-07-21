# Version 4.9.0

## Features
* **Slidev Skill**: Engineered a highly comprehensive standalone skill for `Slidev`. Synthesized over 10 distinct documentation pages (Syntax, UI, Animations, Themes, Deployments, and Customizations) into a single, reliable `SKILL.md` payload. Includes fully validated `meta.json` and CLI distribution manifests.
* **Reveal.js Skill**: Added a native skill payload for the `Reveal.js` framework, covering content markup, layout structures, animations, integrations, customizations, and configurations for generating high-fidelity presentations.

## Refactors & Enforcements
* **Global Skill Standardization**: Added strict architectural constraints to `AGENTS.md` enforcing a unified markdown template layout for every skill's localized `readme.md`. 
* **Stack Refactoring**: Spawned a massive multi-agent parallel sweep across the entire `.skills/` repository (35 standalone payloads) to programmatically rewrite every single `readme.md` to conform to the strict new layout template (incorporating the target schema, changelog persistence, typography sanitation, and capabilities lists).
