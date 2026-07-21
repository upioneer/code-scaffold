# v5.9.1 (Legacy Updater Patch)

## Overview
This hotfix resolves a critical bug in the auto-updater payload that caused legacy binaries (such as v5.5) to fail when attempting to automatically upgrade to the latest versions.

## Bug Fixes
* **Auto-Updater Naming Patch**: Prior to this patch, the internal `updater.rs` logic was strictly hardcoded to search for the `scaffold-tui` executable inside the GitHub release archives, whereas the CI/CD compilation matrix packages the asset as `code-scaffold`. This discrepancy caused the OTA update pipeline to silently fail for existing users.
  - Resolved by synchronizing the internal `updater.rs` logic to exclusively search for `code-scaffold` for all future upgrade paths.
  - **Note:** Due to the nature of this bug existing in older binary source code (e.g. v5.5), legacy users must manually download the new `v5.9.1` binary from the release page to restore auto-update functionality going forward.
