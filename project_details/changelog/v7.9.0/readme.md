# Version 7.9.0

## Changelog
* **feat(tui):** Restored qrcode dependency and implemented dynamic QR rendering for the 'Agent Copilot' tool in `DescriptionPane`. 
* **refactor(tui):** Silenced the QR code display for standard skills/artifacts to keep the UI clean until future expansion.
* **fix(skills):** Patched logo generation script to strip anomalous blank bands and re-generated all `.skills` metadata logos for flawless multi-word vertical stacking in the TUI.
* **fix(tui):** Removed global `.wrap()` constraint on the description paragraph to allow ASCII art to correctly stretch and truncate without introducing phantom vertical line breaks.
