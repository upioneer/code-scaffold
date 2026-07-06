# TUI Splash

**Version:** 1
**Target:** `.skills/tui-splash`

## Description
Architectural playbook and best practices for building robust, instant-on, and visually stunning modern terminal splash screens.

## Capabilities & Use Cases
* Instantly renders the first frame to prevent UI sluggishness during heavy runtime initializations.
* Crafts modern high-resolution text art using Unicode block elements and True Color (24-bit) gradients.
* Implements dynamic layout patterns with collapsible sections and differential cursor updates to prevent flickering.
* Enforces strict terminal hygiene by checking for interactive TTYs, preventing ANSI garbage in piped outputs, and cleaning up the alternate screen buffer on exit.
* Leverages the best modern CLI libraries including Ratatui (Rust), Bubble Tea / Lipgloss (Go), Rich / Textual (Python), and Ink / Clack (Node.js).

## Usage
Agents can invoke this skill when a user requests a high-quality CLI application or modern terminal UI that requires a robust, flicker-free, and visually stunning initialization splash screen.

## Changelog
* **v1** : Initial implementation of the modern TUI splash screen architectural playbook.
