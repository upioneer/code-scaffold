# Release v3.12.0 : Semantic Layout Alignment

## Overview
This feature release realigns the Workspace User Interface with the exact structural components presented in the legacy `scaffold.ps1` application architecture.

## Major Changes
* **Logical Deployment Selections:** Rebuilt `workspace.rs` from an arbitrary text-input mapping into an interactive boolean checkbox selection. Users now natively select between: `Deploy Base Artifacts`, `Deploy Core Agent Skills`, and `Include Open Source License`.
* **Deployment Rebranding:** Remapped the `Ctrl+X` trigger label in `footer.rs` and the internal dispatch mechanism in `app.rs` from `Execute` to `Deploy` to better clarify architectural intent for public users.
