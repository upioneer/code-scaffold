# Code Scaffold v7.50.0 Release Walkthrough

**Release Version:** `v7.50.0`

**Type:** Minor Release (+0.1.0)

**Date:** November 2026

## Overview
Code Scaffold `v7.50.0` wires the app to the personas library: field sync now
delivers `personas/` and the Agent Persona picker loads every pack
dynamically, so Music Producer and the other 15 specialists finally appear in
field installs. This is a single feature release with all 71 skills fully
compliant and zero keyword drift.

---

## Visual Demonstration

![Code Scaffold v7.50.0 TUI Demo](demo.gif)

### Interactive TUI Visuals
![Code Scaffold v7.50.0 Splash Screen](demo_splash.png)
![Code Scaffold v7.50.0 Deploy Configuration](demo_deploy.png)
![Code Scaffold v7.50.0 Deployment Report](demo_report_full.png)

---

## Key Features and Enhancements

### 1. Personas Library Reaches the Field
* **Root Cause**: the picker was a hardcoded row list and field sync never
fetched `personas/`, so no library pack could ever appear in the app.
* **Sync**: `sync.rs` now extracts `personas/` from the repo payload and
requires it for cache completeness; existing installs re sync on upgrade.
* **Picker**: `workspace.rs` appends one row per pack after the built in
rows, parsed from frontmatter, with colliding names skipped defensively.

### 2. Frontmatter Driven Companions
* **New Module**: `personas.rs` parses `name`, `description`, `version`, and
`auto_skills` keys with no new dependencies.
* **Auto Select**: selecting a library persona selects its routed skills
(e.g. Music Producer selects manim, mermaid, officecli, quarto).
* **Docs**: `personas/SCHEMA.md` records the keys the app consumes.

---

## Verification and Compliance Summary

* **Keyword Sync:** `sync_skill_keywords.js --check` reports zero drift across 71 skills.
* **SkillForge Compliance:** All 71 skills pass `verify_skills.js` with zero errors.
* **Rust Code Hygiene:** `cargo fmt --check` exits 0, `cargo clippy` passes with 0 warnings, and `cargo test` passes all 63 unit tests (8 new persona tests).
* **Release Media Capture:** Automated headless VHS capture via WSL generated `demo.gif` and high fidelity TUI snapshots against the `v7.50.0` binary; a byte scan of every artifact confirms zero PII (no usernames, hostnames, or local paths).
* **Typographic Invariants:** Strictly zero en/em dashes and no hyphens used as punctuation across all documentation files.
