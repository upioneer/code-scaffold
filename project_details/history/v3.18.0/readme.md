# Release v3.18.0 - Inline Setup Wizard & UX Improvements

## Overview
This feature release heavily refines the Modal Setup Wizard by dissolving the hard popup blocker and resolving pathing issues for dynamic directory mounting.

## Features
* **Inline Wizard Routing:** Stripped out the `Clear` widget popup that was occluding the Workspace. All Setup Wizard instructional text is now seamlessly rendered inside the `SummaryPane` at the bottom of the screen.
* **Blank Slate Launch:** Changed all default boolean values in `workspace.rs` so that absolutely zero Artifacts or Licenses are pre-selected on launch.
* **Recursive Path Resolution:** Re-wrote the `std::fs::read_dir()` logic for the `.skills` directory. The application will now recursively scan upwards `../` to locate the folder, preventing "Failed to load skills directory" errors when running the CLI from detached execution contexts.
