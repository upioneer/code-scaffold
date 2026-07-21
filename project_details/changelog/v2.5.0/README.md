# Version 2.5.0

## Release Summary
This version introduces a unified skills directory manifest, updates TUI aesthetics, and streamlines the selection logic in the Code Scaffold engine.

## Key Changes
* **Skills Library Documentation**: 
    * Established a dynamic `.skills/README.md` that comprehensively lists all available agent skills by parsing their respective `meta.json` payloads.
    * Added Step 5 to the `MANDATORY EXECUTION SEQUENCE (STRICT)` in `agent.md` to ensure this manifest is continuously updated alongside skill development.
* **TUI Aesthetic Overhaul (`scaffold.ps1`)**:
    * Implemented distinct terminal colors (White and Gold) for the ASCII splash screen.
    * Reduced the animation staggered delay from 300ms to 200ms to provide a snappier launch experience.
* **Selection Logic Enhancements (`scaffold.ps1`)**:
    * Improved the "Toggle All/None" logic via the `[T]` shortcut, now checking if any unselected items exist and appropriately toggling the entire list state.
* **Deployment Updates**:
    * Streamlined the self-destruct mechanism during production deployments by combining conditions (`$PSCommandPath -and -not $isLocalDev`).

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
