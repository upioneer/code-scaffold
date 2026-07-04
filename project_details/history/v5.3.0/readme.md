# Version 5.3.0

## Core UX Enhancements
* **BYOS Skill Formatting:** Enhanced the "[+] Bring Your Own Skill" feature to automatically detect, parse, and format imported custom skills. External URL repositories now automatically strip prefix boilerplate (e.g. `skills-`) and pin themselves to the top of the Skill selection view using the `(BYOS) <skill_name>` naming convention.
* **Dynamic Skill Deletion:** Integrated native deletion management directly into the TUI. When a `(BYOS)` custom skill is highlighted in the selector, a dynamic hint is injected into the bottom horizontal section (`Press [Shift+D] to delete custom skill`). Striking the key instantly removes the skill from the persistent `.prefs` cache and flushes it from the live UI without requiring a reboot.
* **Native Paragraph Word-Wrapping:** Completely overhauled the `DescriptionPane` rendering architecture. Replaced manual arbitrary string splitters (`split_whitespace()`) with Ratatui's native boundary wrapping engines (`Wrap { trim: true }`). This preserves explicitly authored newline breaks (`\n`) for perfectly formatted bulleted lists and multi-line descriptions across the UI payload.
