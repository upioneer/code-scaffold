# Release v3.22.1 - TUI Visual Polish & Workflow Improvements

## Overview
This minor patch addresses a few visual UI components, fixes a native OS dialog bug, and improves the UX fluidity of the deployment configuration workflow.

## Bugfixes & Resolutions
* **Native Folder Picker:** Patched the `WizardState::DeploymentTarget` logic in `app.rs` to temporarily suspend `crossterm::terminal` Raw Mode and drop out of the Alternate Screen during a folder query. This guarantees the `rfd` OS file explorer dialog correctly receives window foreground focus instead of being hidden behind the terminal.
* **Component Restyling:** Replaced the misleading block indicator `⬛` with a standardized hyperlink emoji `🔗` in the `DescriptionPane` to properly convey the QR domain.
* **Title Realignment:** Renamed the primary header banner from "Stateless Scaffolding TUI" to "Code Scaffold TUI".
* **Pane Toggling:** Modified `[Tab]` and `[Shift+Tab]` navigation so it now exclusively cycles focus between the Category Tree and the Item Workspace. The Summary pane was removed from this loop to eliminate unnecessary steps.
* **Dynamic Descriptions:** Removed a strict state condition that wiped the Description Pane text when the Workspace lost focus. The Description Pane now continuously polls the Workspace, ensuring dynamic real-time updates as you scroll through categories in the NavTree.
