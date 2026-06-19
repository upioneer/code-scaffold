# Release v3.8.2 - Project Renaming

## Overview
This patch renames the internal Rust TUI workspace from `project-scaffold-tui` to simply `scaffold-tui` for brevity and alignment with the binary release names.

## Major Changes
* **Directory Rename:** The Rust engine root is now located at `scaffold-tui`.
* **Cargo Definition:** Updated `Cargo.toml` package name to `scaffold-tui`.
* **GitHub Actions Sync:** Updated `.github/workflows/release.yml` to execute cargo commands in the new `scaffold-tui` working directory and fixed the post-build artifact consolidation paths.
