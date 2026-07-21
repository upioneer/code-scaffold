# Version 5.2.0

## Core UX Enhancements
* **OTA Auto-Updater Guardrails:** Added an explicit blocking prompt (`std::io::stdin().read_line`) to the `self_update` success state on all platforms. This prevents the terminal window from abruptly snapping closed upon a successful binary swap, explicitly asking the user to acknowledge the update (e.g. `Update successful (v5.2.0). Press [Enter] to exit.`) before gracefully yielding control.
* **Step 1 - Deployment Target Polish:** 
  * Refactored the core target logic to strictly default to the current user's literal home directory (e.g. `C:\Users\Username` on Windows, `~` on Linux/Mac) rather than the rigid `C:\` root default.
  * Added the explicit `[C]` keybinding instruction as an alias to trigger the Directory Browser.
  * Injected a dynamic state check that evaluates if the current target deviates from the system's home directory. If it does, a new contextual `Press [R] to reset default directory` hint dynamically renders in the footer, which atomically flushes the target back to the home path and rapidly re-evaluates the workspace footprint.

* **Directory Browser Type-to-Search:** Engineered a rapid-jump keyboard buffer for the file/folder picker. Rapidly typing folder names (e.g. `temp`) will dynamically capture keystrokes and instantly scroll the selection cursor to the first matching folder prefix. The buffer automatically flushes after 1 second of inactivity.
