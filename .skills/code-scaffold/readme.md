# Code Scaffold Harness

**Version:** 1
**Target:** `.skills/code-scaffold`

## Description
Agent harness instructions for interacting with the Code Scaffold CLI headlessly.

## Capabilities & Use Cases
* Bypasses the TUI for seamless programmatic deployment integrations
* Parses machine readable JSON payloads outlining all dynamically available artifacts, personas, and skills
* Supports fully headless deployments via isolated command line flags
* Validates absolute target paths and constructs unified manifest payloads without user intervention

## Usage
Agents can interrogate the application natively by running `code-scaffold.exe /help` to retrieve a comprehensive JSON object outlining all available scaffolding assets. Deployments can be triggered programmatically via `code-scaffold.exe --headless --target <DIR>`.

## Changelog
* **v1** : Initial implementation of the headless Code Scaffold harness skill.
