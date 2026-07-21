# Release v3.11.0 : ARM Windows Architecture Targeting

## Overview
This feature release officially deprecates the legacy Intel Mac compilation target (`x86_64-apple-darwin`) in favor of native ARM64 Windows compilation support.

## Major Changes
* **Compiler Matrix Overhaul:** Swapped the legacy Intel MacOS runner in `.github/workflows/release.yml` for the `aarch64-pc-windows-msvc` target, unlocking native execution for Snapdragon X Elite and modern Windows ARM hardware.
* **Documentation Synchronization:** Updated the `PLAN.md` technical constraints to permanently reflect the new `aarch64-pc-windows-msvc` architecture map.
