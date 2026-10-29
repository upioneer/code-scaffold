---
name: Artemis Mobile Automation
description: Natural-language mobile device automation framework and native Model Context Protocol (MCP) server. Orchestrates autonomous Android UI interaction, multimodal VLM screen perception, accessibility hierarchy parsing, and ADB action execution across real and emulated devices.
version: 2
keywords:
  - artemis
  - android-automation
  - mcp-server
  - mobile-testing
  - vlm-agent
  - adb-control
  - ui-automator
  - device-state
  - natural-language-ui
  - logcat-telemetry
  - scrcpy-mirror
  - autonomous-qa
  - android-testing
  - natural-language-testing
  - uiautomator-hierarchy
  - ocr-grounding
  - flash-profile
  - pro-profile
---
​‌‍
# Artemis Mobile Automation Engine

The Artemis Mobile Automation Engine is Code Scaffold's dedicated natural-language mobile automation framework and native Model Context Protocol (MCP) server. Engineered to bridge autonomous AI coding agents with real and emulated Android hardware, Artemis transforms plain conversational instructions into robust, self-healing end-to-end device workflows.

By combining multimodal Vision-Language Model (VLM) screen perception with accessibility hierarchy parsing, optical character recognition (OCR), and ADB actuation primitives, Artemis eliminates brittle coordinate-bound and fragile test scripts.

---

## 1. Architectural Philosophy & Framework Topology

Traditional mobile automation harnesses (such as Appium, Espresso, or raw UIAutomator scripts) suffer from high maintenance overhead, fragile selector rot, and inability to adapt to dynamic UI states or unexpected system dialogues. Artemis shifts the automation paradigm from static imperative scripting to closed-loop cognitive perception.

```
+─────────────────────────────────────────────────────────────────────────+
|               Artemis Mobile Automation Framework Topology              |
|                                                                         |
|   +───────────────────────────────────+                                 |
|   |    AI Coding Agent / Client IDE   |                                 |
|   |    (Antigravity, Cursor, CLI)     |                                 |
|   +─────────────────┬─────────────────+                                 |
|                     │ Transport: stdio or SSE                           |
|                     ▼                                                   |
|   +───────────────────────────────────+                                 |
|   |     Native Artemis MCP Server     |                                 |
|   |                                   |                                 |
|   | • mobile_run_task                 |                                 |
|   | • mobile_manage_task              |                                 |
|   | • mobile_get_device_state         |                                 |
|   | • mobile_inspect_trace            |                                 |
|   | • mobile_diagnose                 |                                 |
|   +─────────────────┬─────────────────+                                 |
|                     │                                                   |
|                     ▼                                                   |
|   +─────────────────────────────────────────────────────────────────+   |
|   |                  Cognitive Execution Engine                     |   |
|   |                                                                 |   |
|   | [Perception Layer]              [Execution Profiles]            |   |
|   | * High-Res Visual Capture       * Flash Profile (3-5s Reactive) |   |
|   | * UIAutomator XML Dump          * Pro Profile (15-40s Deep Plan)|   |
|   | * OCR Bounding Box Grounding    * Token History Compactor       |   |
|   +─────────────────┬───────────────────────────────────────────────+   |
|                     │ Actuation & Diagnostics Bridge                    |
|                     ▼                                                   |
|   +─────────────────────────────────────────────────────────────────+   |
|   |         Hardware Bridge (ADB / scrcpy / Logcat Daemon)          |   |
|   |                                                                 |   |
|   | • Input Actuation: tap | swipe | drag | text | keyevent         |   |
|   | • Logcat Stream: Real-Time Crash & Exception Interception       |   |
|   | • Port Forwarding & Video Mirroring Buffer                      |   |
|   +─────────────────┬───────────────────────────────────────────────+   |
|                     │ Physical USB / Wi-Fi Debugging / TCP:5555         |
|                     ▼                                                   |
|   +─────────────────────────────────────────────────────────────────+   |
|   |               Physical Android Device or Emulator               |   |
|   +─────────────────────────────────────────────────────────────────+   |
+─────────────────────────────────────────────────────────────────────────+
```

### Core Problems Solved

* **Brittle Selector Breakdown**: Eliminates broken tests caused by minor resource ID changes, obfuscated class names, or internationalized string alterations.
* **Complex Custom Canvas Rendering**: Successfully navigates Flutter, Jetpack Compose, React Native, and WebViews by fusing visual VLM bounding boxes with accessibility hierarchies.
* **IDE & Agent Friction**: Enables software engineers to build an APK, install it, trigger full exploratory journeys, and receive Logcat stack traces directly within their chat conversation.
* **Flaky System Dialogues**: Dynamically handles unexpected OS permissions, battery saver alerts, notification shades, and keyboard overlays without script halts.

---

## 2. Multimodal VLM Perception Engine

At every step of an automation cycle, Artemis captures an omnimodal snapshot of the target Android handset to establish spatial awareness and semantic context.

### Tri-Modal Sensory Fusion

1. **Multimodal Visual Stream**: Takes a raw high-resolution screenshot via `screencap` or memory framebuffer stream, converting it to an optimized base64 PNG or WebP buffer.
2. **Accessibility View Hierarchy (XML)**: Dumps the active window hierarchy using UIAutomator, extracting widget types (`android.widget.Button`, `android.widget.EditText`), resource IDs, content descriptions, and hierarchical layout boundaries (`bounds="[left,top][right,bottom]"`).
3. **Optical Character Recognition (OCR) Grid**: Scans the visual surface to locate text rendered on raw Canvas or OpenGL layers where accessibility tags are absent.

### Spatial Coordinate Normalization

Artemis maps target bounding boxes to normalized relative screen coordinates `(x_ratio, y_ratio)` where `0.0 <= x, y <= 1.0`, scaling dynamically across varying device resolutions (e.g. 1080x2400 phones, 1840x2208 foldables, or 2560x1600 tablets):

```
target_x = round(box.center_x * display_width)
target_y = round(box.center_y * display_height)
```

---

## 3. Native Model Context Protocol (MCP) Tool Contract

Artemis exposes 5 primary MCP tools that give any AI coding agent full visibility and physical actuation capabilities on the connected device.

### 1. `mobile_run_task`
Dispatches an asynchronous natural-language goal to the device execution engine.

* **Parameters**:
  * `goal` (string, required): The target instruction (e.g. `"Launch Settings, navigate to Display, and toggle Dark theme"`).
  * `device_id` (string, optional): Serial number of the target device (defaults to single connected device).
  * `execution_profile` (string, optional): `"flash"` (fast reactive) or `"pro"` (deep planning). Defaults to `"flash"`.
  * `timeout_seconds` (number, optional): Maximum runtime before automatic abortion (default: 300).
* **Returns**: Task ID, initial status, and live execution stream URI.

### 2. `mobile_manage_task`
Controls runtime lifecycle and allows live human or agent intervention.

* **Parameters**:
  * `task_id` (string, required): Active task identifier.
  * `action` (string, required): One of `"status"`, `"pause"`, `"resume"`, `"stop"`, `"abort"`, or `"inject_guidance"`.
  * `guidance` (string, optional): Supplementary instruction provided if the agent is stuck on an unexpected screen.
* **Returns**: Current task state (`RUNNING`, `COMPLETED`, `PAUSED`, `FAILED`), step count, and execution progress log.

### 3. `mobile_get_device_state`
Provides instantaneous sensory observation of the screen.

* **Parameters**:
  * `device_id` (string, optional): Target device serial.
  * `include_xml` (boolean, optional): Include accessibility node tree (default: true).
  * `include_ocr` (boolean, optional): Include OCR text extraction (default: true).
  * `compress_image` (boolean, optional): Downscale screenshot for token economy (default: true).
* **Returns**: Multimodal base64 screenshot, foreground package/activity, parsed interactive elements, and display geometry.

### 4. `mobile_inspect_trace`
Retrieves forensic execution telemetry and crash logs.

* **Parameters**:
  * `task_id` (string, required): Identifier of completed or failed task.
  * `include_logcat` (boolean, optional): Include filtered Android Logcat output (default: true).
  * `error_only` (boolean, optional): Filter for FATAL, CRASH, or ANR entries only (default: false).
* **Returns**: Step-by-step action history with before/after screenshots, latency metrics, and crash diagnostics.

### 5. `mobile_diagnose`
Performs an automated environment health check and self-healing verification.

* **Parameters**:
  * `device_id` (string, optional): Target device serial.
  * `attempt_fix` (boolean, optional): Automatically restart ADB daemon or correct USB authorization if degraded (default: false).
* **Returns**: Diagnostic report containing ADB status, battery level, display resolution, required binaries (`adb`, `scrcpy`, `ffmpeg`), and action recommendations.

---

## 4. Dual Execution Profiles: Flash vs. Pro

Artemis incorporates two execution profiles calibrated for different operational scenarios:

| Characteristic | Flash Profile | Pro Profile |
| :--- | :--- | :--- |
| **Pacing** | 3 to 5 seconds per action step | 15 to 40 seconds per action step |
| **Planning Horizon** | Reactive next-step prediction | Hierarchical multi-step test plan |
| **Token Footprint** | Compressed history buffer | Full audit trail and reasoning tree |
| **Verification** | Immediate post-action screen diff | Precondition assertions and recovery |
| **Ideal For** | Linear regression tests, simple UI navigation | Complex exploratory testing, bug replication |

---

## 5. Low-Level Device Actuation Primitives

All high-level cognitive steps are compiled into native Android Debug Bridge (ADB) commands dispatched through non-blocking process pipes:

```bash
# Touch and Gesture Actuation
adb -s <device> shell input tap <x> <y>
adb -s <device> shell input swipe <x1> <y1> <x2> <y2> <duration_ms>
adb -s <device> shell input roll <dx> <dy>

# Text Entry and Keyboard
adb -s <device> shell input text "<escaped_string>"
adb -s <device> shell input keyevent <KEYCODE>

# Application Lifecycle
adb -s <device> install -r -g path/to/app.apk
adb -s <device> shell am start -n <package>/<activity>
adb -s <device> shell am force-stop <package>
adb -s <device> shell pm clear <package>
```

---

## 6. Command-Line Interface & Recipes

### Start Native MCP Server (stdio mode)

```bash
# Start Artemis MCP server for IDE integration (stdio)
code-scaffold skills exec artemis -- --mcp

# Or via Python module directly
python -m artemis.mcp --transport stdio
```

### Run Natural-Language Task via CLI

```bash
# Execute linear task with Flash profile
code-scaffold skills exec artemis -- run "Open Chrome, search for Code Scaffold, and verify homepage title" --profile flash

# Execute exploratory task with Pro profile and automatic Logcat capture
code-scaffold skills exec artemis -- run "Install test APK, log in with demo account, and report any crashes" --profile pro --capture-trace
```

### Run Environment Diagnostics & Self-Healing

```bash
# Check ADB bridge connectivity and auto-heal degraded links
code-scaffold skills exec artemis -- diagnose --fix
```

---

## 7. Compliance & Invariant Checklist

* **Zero External Brand Leakage**: All framework components branded under Code Scaffold identity.
* **Strict Whole-Number Versioning**: Skill version locked to `1`.
* **5-File SkillForge Anatomy**: Complete `meta.json`, `skill-manifest.json`, `SKILL.md`, `readme.md`, and `sandbox/index.html`.
* **Typography Enforcement**: Zero em dashes, zero en dashes, asterisks for lists, colons or spaces for inline separation.
* **Ad-Hoc CLI Distribution**: Discoverable and installable via `npx @code-scaffold/skills-cli add upioneer/artemis`.
