# Release v3.13.0 : Installer Wizard Layout Overhaul

## Overview
This feature release fundamentally restructures the layout of the UI to map exactly to the traditional "Installer Wizard" paradigm requested by the user.

## Major Changes
* **Dynamic Category Sub-Items:** The left-hand `NavTree` panel has been completely repurposed from a local filesystem explorer into a static "Category Selection" panel (`Artifacts`, `Agent Skills`, `License`).
* **State Syncing:** The right-hand `Workspace` panel now acts as a dynamic sub-menu. Its state is synchronized to the left panel. Selecting `Agent Skills` on the left dynamically re-renders the right-hand Workspace panel to show only the `[X] Docker / DevOps` or `[ ] Web Dev` checkboxes.
