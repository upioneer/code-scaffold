# Release v3.16.0 : Native RFD Deployment Target

## Overview
This minor release expands the capabilities of the Modal Wizard by implementing a cross-platform Native OS Folder Picker (`rfd`). 

## Features
* **Native Folder Picker (`[F]`)**: When the user reaches the Deployment Target stage of the wizard, they can press the `[F]` hotkey to launch the native file explorer (Windows Explorer, macOS Finder, or Linux GTK/Zenity) without destroying the terminal layout.
* **Target Sync**: The selected deployment target folder path natively syncs back into the terminal UI and is rendered accurately inside the Summary Pane footprint.
