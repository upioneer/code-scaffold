# Version 3.4.2 Walkthrough

## Overview
This update introduces automatic console window viewport scrolling to the absolute top of the buffer at startup in `scaffold.ps1`.

## Changes
* **Console Viewport Auto-Scroll**:
    * Added `[Console]::WindowTop = 0` immediately after configuring console buffer and window width/height dimensions. This automatically pulls the active viewport to the top of the buffer when the script initializes, preventing cropped headers or scroll offset layouts.
* **Manifest & Versioning**:
    * Incremented the root `manifest.json` version to `3.4.2`.
    * Updated the synchronization timestamp.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
