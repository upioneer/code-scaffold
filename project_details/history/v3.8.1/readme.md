# Release v3.8.1 : CI/CD Hotfix

## Overview
This patch release addresses a failure in the continuous integration pipeline triggered during the v3.8.0 architectural shift. 

## Major Changes
* **GitHub Actions Fix:** Updated `.github/workflows/release.yml` to set the `working-directory` explicitly to `project-scaffold-tui` for all `cargo` commands, preventing root-directory execution failures.
* **Consolidation Target Fix:** Renamed the expected target binary path from `scaffold-tui` to match the Cargo package name `project-scaffold-tui`.
