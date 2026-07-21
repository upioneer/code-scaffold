# Version 4.8.0

## Features
* **Bring Your Own Skill (BYOS)**: Added full support for programmatically ingesting custom skills from 6 approved external platform ecosystems (GitHub, AgentSkills.io, AgentSkill.sh, Skills.sh, Microsoft Skills, MCPServers.org).
* **CLI Ingestion Guardrails**: The TUI modal has been enhanced to actively intercept and parse direct terminal installation strings (e.g. `npx skills add <url>`, `/learn <skill>`, `uvx`, `git clone`), extracting the correct payload URIs and injecting them cleanly into the execution manifest.
* **Intelligent Title Parsing**: Real-time parsing of URL routes to extract clean, human-readable labels for the UI list rather than rendering raw CLI strings.
* **State Persistence**: The BYOS subsystem saves imported custom skills to the OS-native `prefs.json` and perfectly re-hydrates the application state and URL parameters on subsequent boot sequences.

## Analysis
* Completed a full payload analysis on 6 major Agent Skill registries/platforms (documented in `project_details/skill_registry_analysis.md`).

## TUI Improvements
* Increased the size and vertical dimensions of the `CustomSkillInput` popup modal to elegantly handle long payload strings.
* Added boundary text wrapping to the modal paragraph component to dynamically format overflowing CLI installation strings.
* Cleaned up the description pane for the BYOS feature into an alphabetized, bulleted list.
