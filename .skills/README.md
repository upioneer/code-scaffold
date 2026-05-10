# Agent Skills Library

This directory contains complex code payloads (skills) that the Code Scaffold engine can provision into target projects. Each skill is encapsulated in its own directory and must contain a `meta.json` file defining its properties.

## Available Skills

| Label | Description | Version | Target Path |
| :--- | :--- | :--- | :--- |
| **Excalidraw** | Renders and embeds Excalidraw whiteboards | v1.1.1 | `.skills/excalidraw` |
| **Firebase** | Firebase authentication and database connectivity | v1.1.1 | `.skills/firebase` |
| **GitHub** | GitHub Actions workflows and repository management | v1.2.1 | `.skills/github` |
| **Marp** | Generates Marp presentation slides from Markdown | v1.1.1 | `.skills/marp` |
| **Mermaid** | Mermaid diagram creation and rendering | v1.1.1 | `.skills/mermaid` |
| **Node** | Bootstraps a Node.js runtime environment | v1.1.1 | `.skills/node` |
| **OpenCLI** | Bridge websites and the CLI for structured data extraction and browser automation | v1.0.0 | `.skills/opencli` |
| **Playwright** | Browser automation and end-to-end testing with Playwright | v1.0.0 | `.skills/playwright` |
| **Resend** | Sends emails using the Resend API | v1.1.1 | `.skills/resend` |
| **Supabase** | Supabase database and authentication integration | v1.1.1 | `.skills/supabase` |
| **Telegram** | Telegram Bot API interactions | v1.1.1 | `.skills/telegram` |

## Modifying Skills

When adding or modifying skills, please refer to the `MANDATORY EXECUTION SEQUENCE (STRICT)` in the root `agent.md`. You must update the respective `meta.json` version, sync the project manifest, and update this README file to reflect the current state.
