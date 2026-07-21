# Release v3.21.0 : Wizard UX & Details Pane

## Overview
This release prioritizes the deployment path selection to early-bound the wizard process, allowing for predictive artifact diffing. It also introduces a dynamic Details pane for configuration elements.

## Features
* **Prioritized Deployment Target:** Moved the Deployment Target selection to Step 1 of the wizard. This early execution unlocks capabilities to inspect the target directory for pre-existing artifacts and skills.
* **Dynamic Description Pane:** Added a third vertical layout column (`description_pane.rs`) to the `Workspace` view. It dynamically responds to the currently highlighted module to display full descriptions and guidance.
* **QR Code Rendering:** The new description pane generates and displays an inline unicode QR code linking to the Code Scaffold web app.
