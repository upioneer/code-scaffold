# v5.9.0 (Agent Automation Harness Upgrades)

## Overview
This release implements direct recommendations from field tests with autonomous agent harnesses (e.g., Hermes), greatly expanding the Code Scaffold headless CLI capabilities to support strict machine-readable automation pipelines.

## Changelog
* **JSON Output Mode (`--json-output`)**: Introduced a flag that suppresses standard TUI and execution stdout, emitting the final deployment result exclusively as a machine-readable JSON object (e.g. `{"status": "success", "message": "..."}`).
* **Dry-Run Previews (`--dry-run`)**: Introduced a flag that constructs and compiles the full deployment manifest without executing the file operations. When combined with `--json-output`, it dumps the exact manifest payload that would be processed.
* **Version Queries (`--version-json`)**: Added a structured version query flag for agents to validate binary dependencies programmatically.
* **Skill Bump (Code Scaffold Harness v2)**: Updated the `.skills/code-scaffold` payload to natively train agents on using the new `--json-output` and `--dry-run` capabilities.
