# IDE Integration & Extension Architecture Plan

This document outlines the architectural strategy for integrating Code Scaffold seamlessly with IDEs (like VS Code and Antigravity) to provide a premium, native developer experience. It addresses the handling of multiple local executables and the orchestration of auto-updates when running inside an integrated terminal environment.

## 1. The "Multiple Executables" Problem

If a user has `code-scaffold.exe` in multiple locations (Downloads, Desktop, project roots), relying on the system `PATH` introduces instability and versioning confusion.

**The Solution: Extension-Managed Isolated Binaries**
* **Isolation**: The IDE extension completely ignores local user binaries. It manages its own canonical source of truth in a dedicated global storage directory (e.g., `~/.vscode/extensions/upioneer.code-scaffold/bin/`).
* **Auto-Provisioning**: On first activation, the extension checks this directory. If the binary is missing or outdated, it fetches the latest release directly from GitHub, places it in the isolated folder, and makes it executable.
* **Benefit**: Guarantees the extension always runs a clean, official payload, eliminating executable resolution conflicts.

## 2. Auto-Update Architecture (Inside the IDE)

Running a self-updating binary inside an IDE terminal (especially on Windows) can lead to file lock crashes when the binary tries to replace itself.

**The Solution: Extension Orchestration (Native Approach)**
* **Handoff Flag**: When the IDE extension launches the TUI, it sets a hidden environment variable (e.g., `SCAFFOLD_MANAGED_BY=vscode`).
* **TUI Autonomy Disabled**: In `updater.rs`, if the TUI detects `SCAFFOLD_MANAGED_BY`, it disables its internal update polling and hides the `[U]` keybind, acknowledging the IDE is managing updates.
* **IDE Takes Over**: The IDE extension handles background API polling. When an update is detected, it triggers a native IDE Toast Notification (e.g., *"Code Scaffold vX.Y.Z is available. [Update & Relaunch]"*).
* **Safe Replacement**: Upon clicking the update button, the extension gracefully kills the terminal tab (releasing the file lock), downloads the new binary, replaces the isolated binary safely, and respawns the TUI tab.

## 3. The "Handoff" Hotkey (CLI Approach)

For developers launching Code Scaffold from a standard terminal, we need a frictionless way to jump immediately into their editor after scaffolding is complete.

**The Solution: Immediate Editor Execution**
* **The Trigger**: On the deployment success screen (where the user normally hits `[Enter]` to exit), a new option is presented: `Press [O] to open workspace in VS Code`.
* **Execution**: If `[O]` is pressed, the TUI executes `std::process::Command::new("code").arg(&self.target_folder).spawn()` (or `agy .`) and immediately exits.
* **Benefit**: Provides an instantaneous handoff from architecture generation directly into coding, bridging the gap between CLI tools and the GUI editor workflow.
