# Artemis Mobile Automation

**Version:** 2

**Target:** `.skills/artemis`

**Category:** AI, MCP & Developer Tools

**Keywords:** `artemis`, `android-automation`, `mcp-server`, `mobile-testing`, `vlm-agent`, `adb-control`, `ui-automator`, `device-state`, `natural-language-ui`, `logcat-telemetry`, `scrcpy-mirror`, `autonomous-qa`, `android-testing`, `natural-language-testing`, `uiautomator-hierarchy`, `ocr-grounding`, `flash-profile`, `pro-profile`

## Description
Natural-language mobile device automation framework and native Model Context Protocol (MCP) server. Orchestrates autonomous Android UI interaction, multimodal VLM screen perception, accessibility hierarchy parsing, and ADB action execution across real and emulated devices.

## Capabilities & Use Cases
* Translates high-level natural language instructions into multi-step interactive workflows on connected Android smartphones, tablets, and emulators.
* Employs multimodal Vision-Language Model (VLM) perception combined with UIAutomator XML accessibility hierarchies and OCR bounding box grounding to eliminate brittle selector rot.
* Native Model Context Protocol (MCP) server architecture exposing five foundational tools: `mobile_run_task`, `mobile_manage_task`, `mobile_get_device_state`, `mobile_inspect_trace`, and `mobile_diagnose`.
* Enables AI coding assistants (such as Antigravity, Cursor, and Windsurf) to control test devices directly from their chat interface, capturing screenshots and streaming Logcat crash telemetry.
* Supports dual operational profiles: a lightweight Flash profile (3-5s per action) for high-speed regression runs, and a deep-reasoning Pro profile (15-40s per action) for complex exploratory navigation.
* Performs full-lifecycle application management including APK installation, permission granting, activity launching, cache clearing, and process termination.
* Executes precise physical input actuation including taps, double-taps, long presses, directional swipes, multi-touch drags, keyboard text entry, and system keyevents.
* Features real-time Android Logcat crash harvesting and post-mortem trace inspection with synchronized before-and-after action screenshots.
* Includes automated environment diagnostics and self-healing routines to detect and repair ADB daemon disconnects, unauthorized USB states, and video streaming bottlenecks.
* Provides an interactive visual sandbox studio featuring a virtual Android device canvas, live gesture visualizer, MCP tool runner, and element hierarchy inspector.

## Usage
This skill is built for the Code Scaffold engine and standalone MCP distribution. Refer to the `SKILL.md` file inside this directory for deep architectural specifications, MCP tool definitions, and command-line execution recipes.

## Changelog
* **v2** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v1** : Initial release of the Artemis Mobile Automation skill, introducing multimodal VLM screen perception, native Model Context Protocol (MCP) server integration, Flash and Pro execution profiles, ADB device actuation primitives, automated Logcat diagnostics, and interactive device sandbox studio
