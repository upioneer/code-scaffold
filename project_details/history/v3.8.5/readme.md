# Release v3.8.5 - Module Resolution Fix

## Overview
This patch resolves a critical build halt in the GitHub Actions `cargo fmt` phase.

## Major Changes
* **Removed Redundant Module File:** Deleted `scaffold-tui/src/components.rs` to resolve a module collision with `scaffold-tui/src/components/mod.rs`. The dual module paths were causing the rust formatter and AST parsers to crash and completely halt the continuous integration pipeline before compilation could even begin.
