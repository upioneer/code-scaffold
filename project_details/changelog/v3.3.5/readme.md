# Version 3.3.5 Walkthrough

## Overview
This hotfix addresses an invalid ConsoleColor parameter binding exception when drawing the focus domain submenu line separator in `scaffold.ps1`.

## Changes
* **ConsoleColor Binding Hotfix**:
    * Replaced `-ForegroundColor Gold` with the truecolor ANSI sequence `$fgGold` (paired with `$resetColor`) when drawing the submenu divider line. This avoids a `ParentContainsErrorRecordException` when PowerShell fails to bind "Gold" to the standard `System.ConsoleColor` enumeration.
* **Manifest & Versioning**:
    * Incremented the root `manifest.json` version to `3.3.5`.
    * Updated the synchronization timestamp.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
