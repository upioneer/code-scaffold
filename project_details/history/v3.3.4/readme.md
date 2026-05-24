# Version 3.3.4 Walkthrough

## Overview
This update introduces interactive focus domain selection for the generated `AGENT.md` artifact. When selecting the agent template, the user is presented with a dynamic sub-menu to choose the role and architecture focus.

## Changes
* **Interactive Domain-Specific Submenu**:
    * Adds an arrow-key-driven interactive submenu for selecting a domain focus (Web Dev, DBA, Docker/DevOps, Mobile, Systems Scripting, or Generic).
    * Highlights active choice with cyan indicators and updates description lines dynamically at the bottom.
    * Uses cursor coordinate repositioning to achieve flicker-free visual rendering.
* **Programmatic Customization of AGENT.md**:
    * Automatically fills in empty headers (`## Role` and `## System Architecture Overview`) in `.templates/agent.md` during the provisioning copy phase based on the selected focus domain.
* **Manifest & Versioning**:
    * Incremented the root `manifest.json` version to `3.3.4`.
    * Updated the synchronization timestamp.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
