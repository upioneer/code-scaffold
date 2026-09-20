# Changelog Plus

**Version:** 3
**Target:** `.skills/changelog-plus`
**Category:** Publishing & Documentation
**Keywords:** `changelog-plus`, `release-notes`, `version-history`, `immutable-history`, `terminal-capture`, `tape-recorder`, `release-automation`, `web-capture`, `viewport-matrix`, `route-manifest`

## Description
Automated immutable release history pipeline that authors versioned changelog folders, captures headless terminal and web application media with mandatory failure gates, and synchronizes the root README for every release.

## Capabilities & Use Cases
* Authors self contained versioned history folders (`readme.md` plus `demo.gif` and splash, main, and final screenshots) under a configurable changelog root that defaults to `project_details/changelog`.
* Prompts once at initialization for output directory preference and persists the choice, with parameter, environment, file, and default resolution on every run.
* Enforces release order of operations: fresh compile, tape capture, harvest, verify, single deployment commit, root README sync.
* Runs headless terminal capture through a WSL POSIX PTY bridge on Windows, with path translation, ephemeral bridge scripts, and static binary dependency guidance.
* Fails releases loudly on capture failure: zero assets means non zero exit, never a silent skip or an uncommitted media gap.
* Diagnoses agent sandbox identity limits (no host WSL access) and routes capture through the user identity or escalated approval.
* Provides tape authoring patterns (`Require`, `Hide`/`Show`, explicit `Sleep`, `Output`, `Screenshot`) plus a starter template and a generalized cross platform runner.
* Captures web applications through declarative route manifests (`splash`, `main`, `final` slots with click, fill, and wait actions), reusing the Playwright skill module and helpers with zero new browser dependencies.
* Converts run recordings to `demo.gif` with ffmpeg, adds mobile viewport proof shots, and supports authenticated routes via browser state files.
* Defines honest fallbacks: still slideshow for `demo.gif` when no recording is produced, explicit user waiver when media is skipped.
* Ships a declarative capture workflow template that runs the slot contract through the Playwright Plus dispatcher for fully replayable releases.

## Usage
Agents can invoke this skill when cutting a release that needs immutable, media backed version history, when wiring automated terminal or web capture into a version bump routine, or when a user asks where release history should live and how it stays tamper evident.

## Changelog
* **v3** : Added the declarative capture workflow template backed by the Playwright Plus dispatcher.
* **v2** : Added first class web application capture with route manifests, run recording to gif conversion, viewport matrix proof, and a maintained selftest.
* **v1** : Initial implementation of the immutable release history pipeline with headless capture, failure gates, and directory preference init.
