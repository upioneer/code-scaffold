# Release v3.17.1 : CI/CD Hotfix

## Overview
This patch resolves a strictly isolated unit testing failure that was preventing successful GitHub Action matrix compilations.

## Fixes
* **Dynamic Versioning Assertion:** Ripped out a hardcoded string assertion (`v3.13.1`) inside `header.rs` that was immediately failing `cargo test` every time the `manifest.json` version was legitimately bumped. The test now correctly relies exclusively on the dynamic `assert_ne` check.
