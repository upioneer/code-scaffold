# v5.8.0 (Headless Agent Harness)

## Overview
Introduces a robust headless engine and a machine-readable JSON integration harness, completely unlocking programmatic deployments of Code Scaffold for autonomous AI agents and CLI scripting environments.

## Changelog
* **Headless Deployment Engine (`--headless`)**: Bypasses the traditional TUI completely, allowing agents to execute immediate scaffolding operations via isolated CLI flags (e.g., `--target`, `--personas`, `--artifacts`, `--skills`).
* **Machine-Readable Harness (`/help`)**: Calling the `/help` flag now natively queries the filesystem and outputs a richly structured JSON payload. This payload dynamically exposes the complete inventory of available artifacts, personas, skills, and licenses along with their descriptions, acting as a programmatic bridge for agents to parse options and present wizard-like prompts to users.
* **Code Scaffold Harness Skill**: Injected a new native skill (`.skills/code-scaffold`) strictly designed to train AI agents on interacting with the Code Scaffold CLI, including syntax, best practices, and headless execution paths.
