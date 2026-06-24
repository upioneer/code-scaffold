# Release v3.8.0 : Stateless Scaffolding TUI Architectural Shift

## Overview
This iteration marks the beginning of our migration from a PowerShell-based execution environment to a native Rust/Ratatui architecture. The new engine isolates cross-platform runtime logic into a compiled binary (`project-scaffold-tui`) while offloading resource tracking and definitions to dynamic manifest mapping.

## Major Changes
* **Rust TUI Foundations:** Deployed the initial `ratatui` state loops and message routing actions.
* **Component Splitting:** Built structural UI blocks (`header`, `nav_tree`, `workspace`, `logger_pipe`, and `footer`) using responsive constraint-based layouts.
* **Manifest Engine:** Scaffolded local cache resolution paths to handle online/offline syncing without locking the UI.
* **GitHub Actions Pipeline:** Added `release.yml` defining the matrix builds for Linux, macOS, and Windows binary outputs.

## Execution Requirements
* Testing the Rust setup requires manual compilation via `cargo run` inside the `project-scaffold-tui` subdirectory while we stabilize the binary distribution pipeline.
