# Release v3.14.0 - QoL Hotkeys, UI Cleanup, and Advanced Security Directives

## Overview
This minor release introduces several high-impact Quality-of-Life (QoL) improvements to the TUI interface, along with deep security expansions to the Web Development Agent Persona. 

## Features
* **[T] Theme Hotkey**: Users can now dynamically cycle through the hardcoded design palettes (Default, Plum, Lime, Ocean, Earth, Starburst) by pressing the `T` key at any point in the TUI without restarting.
* **Footer Refactor**: Removed stale navigation hints from the footer pane and explicitly renamed `[Ctrl+X] Deploy` to `[Ctrl+X] Deploy Selected` to better communicate the relationship between the active checklist items and the deployment sequence.
* **Web-Dev Persona Hardening**: Injected strict security constraints directly into the Web Dev agent prompt via `scaffold.ps1`. The Web Dev persona now explicitly requires an overarching Privacy Statement, mandates Argon2/bcrypt password hashing schemas, and enforces API-level rate limiting against DoS strategies.
* **Ratatui Agent Skill**: Officially synthesized the `ratatui` UI builder logic inside `.skills/ratatui/SKILL.md` to equip AI scaffolding agents with immediate context for TUI engineering.
