# Version 3.4.3 Walkthrough

## Overview
This update refines the console window viewport scroll timing in `scaffold.ps1`. The scroll to top snapping logic is now executed after the user selects the target directory, preventing terminal buffer push out.

## Changes
* **Console Viewport Timing Relocation**:
    * Relocated the `[Console]::WindowTop = 0` execution block from startup try catch to immediately after target directory input is finalized. This snaps the active console viewport to the top of the buffer only after manual path input, preventing the header from being pushed out of frame by the long lists of skills and artifacts.
* **Manifest and Versioning**:
    * Incremented the root `manifest.json` version to `3.4.3`.
    * Updated the synchronization timestamp.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
