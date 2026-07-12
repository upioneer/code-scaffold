# Release v3.11.2 : Release Publishing Permission Fix

## Overview
This patch resolves a final pipeline blockage where the `softprops/action-gh-release` step was failing with a 403 Forbidden error because it lacked explicit write permissions to the repository.

## Major Changes
* **GitHub Actions Access:** Injected explicit `permissions: contents: write` at the root of `.github/workflows/release.yml` so the automated deployment token can legally create the public Release page and attach the target executables.
