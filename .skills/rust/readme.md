# Rust

**Version:** 2

**Target:** `.skills/rust`

**Category:** AI, MCP & Developer Tools

**Keywords:** `rust`, `cargo`, `cargo-clippy`, `cargo-fmt`, `rust-workspaces`, `systems-programming`, `wasm`, `rust-toolchain`, `rustfmt`, `clippy-lints`, `release-profile`, `cross-compilation`, `rust-ci`, `cargo-test`, `build-optimization`

## Description
Orchestrates Rust workspace topologies, optimized compilation profiles, and local automation scripts.

## Capabilities & Use Cases
* Enforces strict architectural separation between library logic and binary execution entry points to maximize modularity.
* Injects and regulates Cargo profile optimizations, manipulating debug symbols, linker configurations, and multi-threaded codegen units for extreme performance.
* Provisions localized shell automation scripts (Toolchain Verifier, Optimized Builder, Quality Gatekeeper, Testing Coordinator) to ensure reproducible dev workflows.
* Operates a strict CI/CD pre-commit gatekeeper encompassing `rustfmt`, `clippy` denial thresholds, and deep dependency license auditing.
* Synthesizes Criterion benchmark suites for rigorous regression tracking across deployment intervals.

## Usage
Simply inherit this skill payload in the agent context. The agent will autonomously read the directives and enforce the compilation guidelines, automation scripts, and workspace topologies when managing Rust project structures.

## Changelog
* **v2** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v1** : Initial release of the Rust foundational infrastructure payload.
