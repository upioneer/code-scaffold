# Version 3.25.0 Walkthrough

## Summary of Changes
This minor release introduces native version embedding into the compiled binaries so users can easily identify which version of the application they are running.

## Features Added
1. **Windows Executable Metadata:** Integrated the `winres` build dependency to compile a `VERSIONINFO` resource into the Windows executable. This securely populates the `FileVersion`, `ProductVersion`, and `FileDescription` properties that appear in the Windows File Explorer "Details" tab when right-clicking the `.exe`.
2. **Cross-Platform CLI Arguments:** Added support for the `--version` (and `-v` / `-V`) argument. Executing `scaffold-tui --version` will now immediately return the version string (e.g., `Code Scaffold TUI v3.25.0`) and exit safely, offering a source-of-truth identifier for macOS and Linux users.
