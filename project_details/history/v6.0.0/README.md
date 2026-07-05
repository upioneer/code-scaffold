# v6.0.0 (OTA Engine Decoupling)

## Overview
This release implements a robust architectural update to the Code Scaffold auto-updater engine, permanently decoupling the internal OTA (Over-The-Air) update mechanism from the marketed binary name. 

## Technical Upgrades
* **Dedicated OTA Payload**: The CI/CD compilation matrix now generates two distinct artifacts for every operating system/architecture target:
  1. A standard artifact (e.g. `code-scaffold-windows-x64.zip`) containing the marketed `code-scaffold` executable for direct human downloads.
  2. A dedicated `ota-payload` artifact (e.g. `ota-payload-windows-x64.zip`) exclusively for the auto-updater engine, internally wrapping the executable into a highly stable `update.exe` (Windows) or `update.bin` (Unix) format.
* **Immunity to Rebranding**: The internal `updater.rs` logic has been patched to strictly target the `ota-payload` assets and blindly ingest the `update.exe` / `update.bin` file structure regardless of how the parent project is branded. This ensures that any future project name changes or binary rebranding will not break the auto-updater for existing users.
