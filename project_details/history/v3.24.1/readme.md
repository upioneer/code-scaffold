# Version 3.24.1 Walkthrough

## Summary of Changes
This patch establishes an ironclad version synchronization system to completely eliminate mismatch errors between the CLI, the manifest, and the GitHub release tags.

## Core Architectural Updates
1. **Dynamic TUI Engine Versioning:** Refactored the `scaffold-tui` header to pull its version natively from `Cargo.toml` at compile-time using the `env!("CARGO_PKG_VERSION")` macro. This strictly links the visible user interface version to the Rust engine's literal state without hardcoded values.
2. **Automated Bump Synchronization:** Established `bump_version.ps1` at the workspace root to serve as the unified version control script. This utility injects the version integer directly into `Cargo.toml`, updates `manifest.json` parity, and executes `cargo update` to guarantee the lockfile stays perfectly aligned. 
3. **Agent Workflow Governance:** Hardened `.agents/AGENTS.md` and `.templates/agent.md` rules instructing all future agents to exclusively utilize `bump_version.ps1` when elevating application version status instead of modifying `Cargo.toml` manually.

## How to execute a version bump moving forward
To execute a version bump, simply run:
```powershell
.\bump_version.ps1 "x.y.z"
```
The system will handle everything else seamlessly.
