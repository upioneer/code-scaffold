# Version 3.29.2 Walkthrough

## Summary of Changes
This release resolves a pathing issue where the full-stack monorepo scaffolding artifacts (`apps/` and `packages/`) were incorrectly deploying into `project_details/` rather than the root directory.

## Bug Fixes
1. **Scaffold Scripts Fix:**
   - Updated `scaffold.ps1` array compilation block to detect `apps` and `packages` directory architectures during dynamic template load.
   - Updated `scaffold.ps1` copy pipeline to explicitly include recursive flags for directory ingestion.
2. **TUI Application Fix:**
   - Adjusted `scaffold-tui/src/app.rs` target serialization payload generator to explicitly route `apps/` and `packages/` directly to root boundaries.
   - Adjusted `scaffold-tui/src/components/workspace.rs` artifact parsing boundaries to safely validate installation checks at root contexts for `apps/` and `packages/`.
