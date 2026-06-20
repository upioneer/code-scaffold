# Release v3.13.1 - Dynamic Header Versioning Bugfix

## Overview
This patch release resolves an issue where the TUI header was hardcoded to `v3.9.0` despite the underlying binaries advancing independently.

## Resolutions
* The `Header` component inside `scaffold-tui/src/components/header.rs` was refactored to dynamically parse and read the true `metadata.version` value from `manifest.json` on application launch.
* This explicitly creates a data-driven UI and prevents version discrepancies going forward.
