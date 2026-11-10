# Code Scaffold v7.47.0 Release Walkthrough

**Release Version:** `v7.47.0`

**Type:** Minor Release (+0.1.0)

**Date:** November 2026

## Overview
Code Scaffold `v7.47.0` ships CAD Tools v15: part ownership instruction for woodworking plus Real-Time watcher coverage across every supported CAD engine. This is a single skill improvement release with all 71 skills fully compliant and zero keyword drift.

---

## Visual Demonstration

![Code Scaffold v7.47.0 TUI Demo](demo.gif)

### Interactive TUI Visuals
![Code Scaffold v7.47.0 Splash Screen](demo_splash.png)
![Code Scaffold v7.47.0 Deploy Configuration](demo_deploy.png)
![Code Scaffold v7.47.0 Deployment Report](demo_report_full.png)

---

## Key Features and Enhancements

### 1. Part Ownership and Dedicated Spatial Boundaries (Section 23)
* **Ownership Rule**: every board, leg, rail, slat, and sheet good holds a dedicated non-overlapping volume; mating faces coincide exactly, voids belong to their host part, fit allowances are named numbers, and fasteners own their bores.
* **Joinery Patterns**: carcass, face frame, table, slatted, and sheet good construction with seated shoulders, floating tops, reveal gaps, and edge banding as separate solids.
* **Verification Protocol**: union-volume check, interference sweep with joint versus defect disposition, travel check for moving parts, and cut list reconciliation with grain plus banding notes.
* **Backing Directive**: Part Ownership enforced at the same level as the other hard rules.

### 2. Real-Time Watchers and Live Reload (Section 24)
* **Platform Matrix**: FreeCAD document observers, OpenSCAD Automatic Reload and Preview, CQ-editor autoreload for CadQuery plus build123d, AutoCAD database plus object plus editor reactors (ZWCAD and GstarCAD marked unverified), and documented fallback polling for cadcraft, Pali Ijo, PhysCAD, and Zoo.
* **Generic File Watcher** (`scripts/file_watcher.py`): zero dependency polling with mtime plus size fingerprints, debounce coalescing, per-event JSON logging, and one-shot CI mode. Passes 8 built in self test assertions.
* **Agent Patterns**: edit loop discipline with no orphan watchers, debounced writes, full rebuild logging, and headless CI parity.
* **Backing Directive**: Live Reload Discipline preferring native surfaces with the generic watcher as fallback.

---

## Verification and Compliance Summary

* **Keyword Sync:** `sync_skill_keywords.js --check` reports zero drift across 71 skills.
* **SkillForge Compliance:** All 71 skills pass `verify_skills.js` with zero errors.
* **Script Self Tests:** `file_watcher.py` passes 8 of 8 offline assertions.
* **Rust Code Hygiene:** `cargo fmt --check` exits 0, `cargo clippy` passes with 0 warnings, and `cargo test` passes all 55 unit tests.
* **Release Media Capture:** Automated headless VHS capture via WSL generated `demo.gif` and high fidelity TUI snapshots against the `v7.47.0` binary; every frame was visually verified and a byte scan of every artifact confirms zero PII (no usernames, hostnames, or local paths).
* **Typographic Invariants:** Strictly zero en/em dashes and no hyphens used as punctuation across all documentation files.
