# Trackio ML Tracking

**Version:** 2
**Target:** `.skills/trackio`

## Description
Integration with Trackio for ML experiment tracking, dashboard deployments, and Hugging Face Spaces sync.

## Capabilities & Use Cases
* Integrates `trackio` as a drop-in API replacement for Weights & Biases (`import trackio as wandb`)
* Automatically caches runs and model metrics locally by default via `trackio.init()`
* Automatically launches robust visualization dashboards locally via `trackio show`
* Seamlessly synchronizes local data with remote Hugging Face Spaces using `trackio sync --project "my-project" --space-id "org/space_id"`
* Facilitates ML experiment tracking, dashboard deployments, and Hugging Face infrastructure syncing

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v2** : Expanded capability descriptions
* **v1** : Introduce Trackio ML Tracking Skill
