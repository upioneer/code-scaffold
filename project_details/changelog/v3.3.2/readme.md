# Version 3.3.2 Walkthrough

## Overview
This update refines the project's security and distribution policy by formalizing the exclusion of temporary application builds from version control.

## Changes
* **Gitignore Policy Update**:
    * Added `/apps/` to the root `.gitignore` file to ensure local test applications are not accidentally committed to the repository.
    * Updated the dynamic `.gitignore` generation logic in `scaffold.ps1`. New projects scaffolded with this engine will now automatically include `apps/` in their exclusion list, preventing clutter in their respective repositories.
* **Manifest & Versioning**:
    * Incremented the root `manifest.json` version to `3.3.2`.
    * Updated the synchronization timestamp.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
