# Version 3.29.0 Walkthrough

## Summary of Changes
This release restores and enriches the missing `apps` category inside the project's payload template directory, allowing the TUI artifacts workspace to effectively select full deployment scaffolding profiles for Mobile, Web, and Docker arrays.

## Features Added
1. **Full-Stack Monorepo Architecture Restoration:**
   - **Apps Framework:** Initialized the `.templates/apps` directory establishing the core client/server environments: `api` (Backend/Microservices), `desktop` (Tauri/Electron), `web` (React/Next), `mobile/ios`, `mobile/android`, `cli` (Command Line Interfaces), and `docker`.
   - **Shared Packages Framework:** Initialized the `.templates/packages` directory adjacent to `apps/` to natively enforce robust enterprise patterns for shared TS types, cross-platform UI components, and internal Rust crates.
   - **TUI Injection Engine:** Refactored `scaffold-tui/src/components/workspace.rs` to inherently detect and index physical directories (not strictly isolated files) nested within the `.templates/` path space.
   - **UX Clarity:** Hard-bound an intelligent set of descriptions explicitly mapping both `apps/` and `packages/` within the Artifacts Workspace panel UI to clearly define their complete cross-platform payloads.
