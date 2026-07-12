# Code Scaffold Harness

**Version:** 6
**Target:** `.skills/code-scaffold`

## Description
Agent harness instructions for interacting with the Code Scaffold CLI headlessly.

## Capabilities & Use Cases
* Bypasses the TUI for seamless programmatic deployment integrations
* Parses machine readable JSON payloads outlining all dynamically available artifacts, personas, and skills
* Supports fully headless deployments via isolated command line flags
* Validates absolute target paths and constructs unified manifest payloads without user intervention
* Features `--json-output` flag for suppressing standard stdout and emitting strictly machine-readable results
* Supports `--dry-run` testing and direct `--version-json` queries
* Outlines the protocol mapping and integration instructions for the Scaffold Connect zero-trust OTA bridging
* Instructs agents on parsing `scaffold://` URIs and executing native local commands remotely over AES-256-GCM WebSocket channels

## Usage
Agents can interrogate the application natively by running `code-scaffold.exe /help` to retrieve a comprehensive JSON object outlining all available scaffolding assets. Deployments can be triggered programmatically via `code-scaffold.exe --headless --target <DIR> --json-output`.

## Changelog
* **v6** : Extracted the Python websocket client out of the markdown instructions and natively embedded it into the skill's scripts directory for frictionless agent execution.
* **v5** : Added explicit warnings against executing non-existent scaffold-connect binaries to resolve agent failure states.
* **v4** : Hardcoded a robust, drop-in Python websocket client script for Scaffold Connect to significantly improve execution efficiency and accuracy for open-weight agent models.
* **v3** : Integrated Scaffold Connect OTA bridge schema and protocol mapping instructions for zero-trust remote execution.
* **v2** : Added support for `--json-output`, `--dry-run`, and `--version-json` flags.
* **v1** : Initial implementation of the headless Code Scaffold harness skill.
