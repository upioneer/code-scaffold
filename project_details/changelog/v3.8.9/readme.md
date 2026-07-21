# Release v3.8.9 : Ratatui Import Fix

## Overview
This patch resolves the final compiler type error that halted the build matrix.

## Major Changes
* **Direct Crossterm Imports:** `ratatui 0.26` does not actually re-export the `crossterm` crate interface natively. Removed `ratatui::crossterm` routing and replaced it with direct `crossterm::event` module imports in `src/tui.rs`. This successfully resolves the `E0433` and `E0599` compiler failures.
