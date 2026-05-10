# Version 2.3.0

## Release Summary
This version implements critical updates to the metadata handling and TUI rendering engine, ensuring the Code Scaffold is more flexible and resilient for both local development and remote deployment.

## Key Changes
* **Metadata Schema Update**: Added the `target` field to all skill `meta.json` files, allowing individual payloads to specify their exact deployment subdirectory.
* **TUI Enhancements**: 
    * Implemented a new ASCII splash screen with staggered animation for a more premium experience.
    * Refined the UI layout with adaptive window sizing and clean foreground/background separation.
    * Added the `[T]` shortcut to toggle all/none selections.
* **Local Development Safety**: Implemented a local dev check to prevent the script from self-destructing when running within the core repository.
* **Provisioning Logic**: Updated the copy method to automatically create parent directories for nested targets and respect the `Agent Skills` category.
* **Encoding**: Forced UTF-8 output encoding to ensure consistent cross-platform rendering of special characters.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
