# Version 3.3.3 Walkthrough

## Overview
This update introduces interactive confirmation prompts when selecting artifacts that already exist in the target directory, preventing silent skips or unintended overwriting.

## Changes
* **Interactive Overwrite Selection**:
    * Pressing Spacebar to select an already-installed artifact now prompts the user with an option to overwrite or cancel.
    * Pressing 'T' to toggle all selections detects if any existing artifacts will be overwritten and prompts once with a unified question.
    * If the user accepts, the target artifact files are successfully replaced and logged as `Overwrote Artifact`.
    * If the user cancels, the selection is aborted or only the non-conflicting new items are selected.
* **Documentation Category Detection Fix**:
    * Fixed a naming mismatch where the Documentation directory scan utilized `Exists` instead of `Installed`, causing the UI to display it as uninstalled even when it existed.
* **Manifest & Versioning**:
    * Incremented the root `manifest.json` version to `3.3.3`.
    * Updated the synchronization timestamp.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
