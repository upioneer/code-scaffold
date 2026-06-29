# Version 4.10.0

## Features
* **Markmap Skill**: Scaffolded a highly comprehensive native skill payload for `Markmap`. The skill encompasses deep integration workflows covering CLI usage, programmatic API integrations, core Markdown syntax behavior (such as lists, math formulas, and code blocks), and `jsonOptions` configurations. The folder architecture firmly integrates the ad-hoc CLI distribution manifest and standardized localized readme constraints.
* **TUI Web Dev Auto-Selection**: Implemented QoL logic in the CLI UI state manager to explicitly auto-select the `website-deploy-linux` skill anytime the `Web Dev` persona is selected.

## Refactors & Enforcements
* **Global Capability Standardization**: Executed a massive, parallelized multi-agent sweep across all 35 legacy skills in the `.skills/` repository.
* **Deep Metadata Extraction**: The sweep extracted the granular architectural behaviors mapped deeply within each `SKILL.md` payload and translated them into highly descriptive, impressive `Capabilities & Use Cases` lists inside their respective localized `readme.md` files.
* **Aggressive Version Synchronization**: Unified the whole-number state of every legacy skill, forcefully synchronizing the version property across their respective `meta.json`, `skill-manifest.json`, localized changelogs, and the root `/.skills/readme.md` master table.
