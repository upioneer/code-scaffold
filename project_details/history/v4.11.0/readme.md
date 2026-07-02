# Version 4.11.0

## Features
* **Playwright Auto-Selection**: Updated the CLI UI state manager (`workspace.rs`) to seamlessly auto-select the `playwright` skill anytime the `Web Dev` persona is toggled.
* **Stealth Browser MCP Skill**: Scaffolded a highly comprehensive native skill payload for configuring and operating the Stealth Browser MCP. The payload is wired with proactive verification logic to aggressively query the installation state and prompt the user if absent, alongside deep mapping of its 97-tool arsenal and network-hook mechanics.

## Refactors & Enforcements
* **Automated Screenshot Artifacts**: Modified the strict `AGENTS.md` ruleset to explicitly enforce automated screenshot capturing for all web-app-related version releases. Going forward, if the workspace contains the Playwright skill (or equivalent), agents MUST proactively boot a browser, capture visual evidence of their UI updates, and seamlessly embed the images directly into the `project_details/history` documentation before executing their commit sequence.
