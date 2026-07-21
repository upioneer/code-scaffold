# v3.23.0 Release Notes

## Features
* **In-app Directory Browser Component:** Replaced the OS-native file dialog with a fully integrated Ratatui pop-up for smoother deployment targeting.
* **Payload Artifact Detection:** The workspace proactively scans the selected target deployment folder, automatically highlighting artifacts and bridged skills that are already installed.
* **Skill Version Display:** The Description Pane dynamically extracts and surfaces the `version` property from each skill's `meta.json` file.
* **License Expansion:** Bootstrapped the local `.licenses` payload directory with 6 new industry-standard open-source templates (AGPL, LGPL, BSD 2-Clause, BSD 3-Clause, MPL 2.0, The Unlicense) for a total of 9 ready-to-use choices.

## Chores
* **Skill Indexing Automation:** Enforced rule to regenerate `/.skills/README.md` perfectly matching all `meta.json` payloads, fixing missed documentation for `ratatui` and `trackio`.
* **Agent Guidelines:** Appended `.agents/AGENTS.md` to solidify the mandatory skill indexing rule into persistent memory.
