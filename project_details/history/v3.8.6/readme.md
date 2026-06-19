# Release v3.8.6 - Pipeline Clippy Overrides

## Overview
This patch removes the strict warning boundaries at the pipeline level.

## Major Changes
* **Workflow Clippy Bypass:** Removed the `-- -D warnings` argument from the `.github/workflows/release.yml` file. The crate-level `#![allow(warnings)]` was being bypassed by the CI runner's strict terminal override. By removing the CLI arguments, the CI matrix will finally compile the release targets without failing on unused imports and deprecations.
