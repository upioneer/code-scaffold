# Release v3.8.7 : Explicit Frame Lifetimes

## Overview
This patch resolves a hard compiler error inside the TUI components rendering logic.

## Major Changes
* **Generics Enforcement:** Rust 2021 strictly errors on omitted generic lifetime parameters. The `ratatui 0.26` upgrade transitioned `Frame` into `Frame<'a>`. Explicitly added `Frame<'_>` to the `Component::draw` signatures across all 5 user interface elements to bypass `E0107: missing generics`.
