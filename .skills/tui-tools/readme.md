# TUI Tools

**Version:** 6
**Target:** `.skills/tui-tools`

## Description
Architectural playbook and tooling (including VHS integration) for building robust, instant-on, and visually stunning modern terminal splash screens and integrations.

## Capabilities & Use Cases
* Instantly renders the first frame to prevent UI sluggishness during heavy runtime initializations.
* Crafts modern high-resolution text art using Unicode block elements and True Color (24-bit) gradients.
* Enforces strict FIGlet ANSI Shadow font spacing: preserves native character kerning (A, C, G, O, Q, T) while enforcing rectangular `padEnd` normalization and 2-character outer frame margins.
* Implements dynamic layout patterns with collapsible sections and differential cursor updates to prevent flickering.
* Enforces strict terminal hygiene by checking for interactive TTYs, preventing ANSI garbage in piped outputs, and cleaning up the alternate screen buffer on exit.
* Leverages the best modern CLI libraries including Ratatui (Rust), Bubble Tea / Lipgloss (Go), Rich / Textual (Python), and Ink / Clack (Node.js).
* Automates robust, headless TUI recording and screenshotting using VHS tapes (`.tape`), producing pristine `.gif` and `.png` assets for CI/CD pipelines and version history docs.

## Usage
Agents can invoke this skill when a user requests a high-quality CLI application or modern terminal UI that requires a robust, flicker-free splash screen, or when the user requires automated screenshot documentation pipelines via VHS.

## Changelog
* **v6** : Enforced strict native FIGlet character geometry rules and uniform rectangular 2-character frame margins (`'  ' + line.padEnd(maxLen, ' ') + '  '`).
* **v2** : Renamed from "TUI Splash" to "TUI Tools" and injected comprehensive architectural support for `vhs` headless automated documentation captures.
* **v1** : Initial implementation of the modern TUI splash screen architectural playbook.
