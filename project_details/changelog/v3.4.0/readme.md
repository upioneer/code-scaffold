# Version 3.4.0 Walkthrough

## Overview
This update introduces a new `firecrawl` web crawling and scraping skill, implements smart Playwright auto-selection for Web Dev focus domains, and dynamically injects walkthrough screenshot instructions into `AGENT.md`.

## Changes
* **New Skill Available: Firecrawl**:
    * Created `.skills/firecrawl/meta.json` and `.skills/firecrawl/SKILL.md` to manage website crawling and structured data extraction instructions.
    * Registered the `firecrawl` skill alphabetically in `manifest.json`.
* **Playwright Auto-Selection (QoL)**:
    * Choosing the "Web Dev" domain focus automatically sets the `playwright` skill to selected, displaying a cyan alert call-out.
* **Dynamic Screenshot Integration**:
    * If Playwright is selected/installed, the generated `AGENT.md` is updated to instruct the agent to save UI/UX screenshots directly in the active walkthrough history folder (`project_details/history/v[VERSION]/`).
* **Manifest & Versioning**:
    * Incremented the root `manifest.json` version to `3.4.0`.
    * Updated the synchronization timestamp.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
