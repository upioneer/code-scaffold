# Version 3.3.6 Walkthrough

## Overview
This update resolves the `SetCursorPosition` coordinate out-of-bounds exception in `scaffold.ps1` and implements an automated internal testing suite to verify template generation across all 6 focus domains.

## Changes
* **Cursor Position Coordinate Fix**:
    * Added `Clear-Host` immediately at the start of `Show-AgentDomainSubmenu` to reset the active cursor baseline to the top of the terminal screen. This guarantees that top coordinate lines never exceed the console buffer height.
* **Automated Internal Test Suite**:
    * Created `scratch\test_scaffold.ps1` to programmatically verify role description generation, system architecture populating, and regex substitutions across all 6 focus domains.
* **Manifest & Versioning**:
    * Incremented the root `manifest.json` version to `3.3.6`.
    * Updated the synchronization timestamp.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
