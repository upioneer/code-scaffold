# Release v3.15.0 - Guided Setup Wizard & Dynamic Footprints

## Overview
This feature release dramatically overhauls the deployment pipeline interface. It abstracts the raw logging output out of the frontend and introduces a seamless Modal Wizard layout to ensure configuration integrity.

## Features
* **Modal Setup Wizard:** Upon launch, a transparent modal dynamically steps the user through the `Artifacts -> Agent Skills -> Licensing` pipeline. The deployment hotkey `[Ctrl+X]` and standard NavTree navigation are fully locked until this flow is completed, preventing disjointed or premature deployments.
* **Summary Pane:** Completely ripped out the raw `LoggerPipe` execution output from the footer pane. It has been replaced with a real-time `SummaryPane` that tallies the selected Artifact and Skill footprint, providing the user with a clean overview of their pending architecture.
* **Dynamic `.skills/` Mount:** The Workspace no longer relies on a hardcoded list of available Agent Skills. It directly parses the `.skills/` directory on launch and automatically surfaces every available plugin as a checkbox.
* **Companion Linking:** The GitHub skill (`github`) and Firebase skill (`firebase`) checkboxes are now strictly bound to their respective configuration artifacts (`deploy.yml` and `firebase.md`). Toggling one automatically toggles the other.
