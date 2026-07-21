# Version 2.7.0

## Release Summary
This version introduces a comprehensive Playwright Browser Automation skill and optimizes the repository by scrubbing internal design documents from the remote history.

## Key Changes
* **New Skill: Playwright**:
    * Integrated a general-purpose browser automation skill including a universal executor (`run.js`).
    * Added auto-detection for local dev servers and smart test script management in `/tmp`.
    * Included a complete API reference and helper library for robust E2E testing.
* **Repository Optimization**:
    * Scrubbed `design.md` from the GitHub remote history to ensure architectural privacy.
    * Updated `.gitignore` to strictly exclude local design and configuration artifacts.
* **Manifest & Documentation**:
    * Incremented the root `manifest.json` version to `2.7.0`.
    * Updated the root `README.md` and `.templates/skills.md` to reflect the new capabilities.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
