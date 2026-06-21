# Release v3.21.1 - Skill Configuration Patch

## Overview
This patch enforces strict schema adherence for all integrated skill payloads, establishing a firm structure for how `meta.json` files must be formatted going forward.

## Bugfixes & Resolutions
* **Meta Configuration Standardization:** Restructured the `.skills/ratatui/meta.json` file to conform to the explicit schema standard (`label`, `description`, `version`, `target`).
* **Manifest Registration:** Registered the Ratatui TUI Framework explicitly inside `manifest.json`'s dynamic `skills` array.
* **Permanent Memory Update:** Appended a permanent `Skill Meta Configuration Schema` rule to `AGENTS.md` ensuring all subsequent agents strictly adhere to this format when introducing or mutating skills.
