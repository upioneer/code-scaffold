# Version 4.7.0

## Feature Additions
* **Persistent Theme State**: Implemented persistent application state tracking for the TUI theme index. The TUI now leverages the `directories` crate to safely write and read a custom `prefs.json` payload in the native OS application configuration directory (e.g., `AppData\Roaming\upioneer\code-scaffold\config` on Windows, or `~/.config/code-scaffold/` on Linux). When a user cycles themes (via the `T` key) and closes the application, the app will instantly restore their selected visual theme upon next launch.
