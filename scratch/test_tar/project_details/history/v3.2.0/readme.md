# Walkthrough : v3.2.0

## Overview
This update introduces the **Hyperframes** skill to the Code Scaffold engine. Hyperframes is an open-source video rendering framework that allows users to create videos using standard web technologies (HTML, CSS, and JavaScript).

## Changes
* **Added Hyperframes Skill**: A new modular payload in `.skills/hyperframes` containing:
    * `SKILL.md`: Comprehensive instructions for AI agents.
    * `meta.json`: Metadata for engine discovery.
    * `references/api_reference.md`: Detailed technical documentation.
* **Manifest Update**: Bumped project version to `3.2.0` and registered the new skill.
* **Documentation Update**: Updated the root `README.md` and `.skills/README.md` to include Hyperframes in the available payloads.

## Hyperframes Features
* **HTML-Native**: Define video compositions with familiar HTML tags.
* **Data Attributes**: Control timing and duration using `data-*` attributes.
* **Deterministic Rendering**: Ensures consistent output for automated pipelines.
* **Animation Support**: Compatible with GSAP, Lottie, and CSS animations.

## Usage
Users can now select "Hyperframes Video" from the module selection menu in the TUI. When selected, the engine will provision the `.skills/hyperframes` directory into the target project.
