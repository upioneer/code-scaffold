# Smart Home

**Version:** 3
**Target:** `.skills/smart-home`
**Category:** Smart Home & IoT Automation
**Keywords:** `smart-home`, `home-assistant`, `homekit`, `matter`, `thread`, `alexa-smart-home`, `google-home`, `iot-automation`, `zigbee`, `zwave`, `hass-rest-api`, `hass-websocket`

## Description
Unified smart home and IoT automation orchestrator bridging Home Assistant, Apple HomeKit, Amazon Alexa, Google Home, and Matter ecosystems into a cohesive agentic control plane.

## Capabilities & Use Cases
* Dispatches high-fidelity REST API and WebSocket calls to Home Assistant instances for real-time entity inspection, state polling, and service executions.
* Executes atomic device control commands across multiple device classes: lights, switches, thermostats, climate systems, covers, media players, locks, and sensors.
* Evaluates dynamic Jinja2 template expressions against live Home Assistant state graphs via the template evaluation endpoint.
* Parses and generates declarative Home Assistant automation blueprints, scripts, and scene configurations with safety preconditions.
* Implements the HomeKit Accessory Protocol (HAP) bridging architecture, configuring accessory definitions, characteristics, and room assignments.
* Integrates native Apple HomeKit data models (HMHomeManager, HMHome, HMRoom, HMAccessory, HMService, HMCharacteristic) for Swift and iOS application environments.
* Translates natural language directives into Amazon Alexa Smart Home Skill API directives (Discovery, PowerController, BrightnessController, ThermostatController, LockController) and AWS Lambda payloads.
* Maps device states to Google Home Graph traits (OnOff, Brightness, ColorSetting, TemperatureSetting, LockUnlock, OpenClose) with local fulfillment capabilities.
* Orchestrates Matter and Thread commissioning, handling pairing codes, QR payloads, Node IDs, cluster commands, and multi-admin ecosystem fabric sharing.
* Enforces strict physical safety invariants and human-in-the-loop policies before mutating perimeter security devices such as door locks, garage doors, and alarm panels.
* Bundles a standalone, zero-dependency Python controller script for immediate CLI diagnostics, schema dumping, entity queries, and service dispatches.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for deep integration guidelines, environment variable setups, and agentic workflows.

* **v2** : Standardized hasSandbox to false to mount the clean Architectural Contract card on code-scaffold.com.
* **v1** : Initial release of the unified Smart Home automation orchestrator bridging Home Assistant, HomeKit, Alexa, Google Home, and Matter

## Changelog
* **v3** : Standardized ASCII art logo to uniform 6-line ANSI Shadow format.
