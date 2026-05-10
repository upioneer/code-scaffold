# Agent Skills Library

This directory contains complex code payloads (skills) that the Code Scaffold engine can provision into target projects. Each skill is encapsulated in its own directory and must contain a `meta.json` file defining its properties.

## Available Skills

| Label | Description | Version | Target Path |
| :--- | :--- | :--- | :--- |
| **Excalidraw** | Provides functions for rendering and embedding Excalidraw whiteboards | v1.1.0 | `.skills/excalidraw` |
| **Firebase** | Provides functions for Firebase authentication and database connectivity | v1.1.0 | `.skills/firebase` |
| **GitHub** | Provides functions for GitHub Actions workflows and repository management | v1.2.0 | `.skills/github` |
| **Marp** | Provides functions for generating Marp presentation slides from Markdown | v1.1.0 | `.skills/marp` |
| **Mermaid** | Provides functions for creating and rendering Mermaid diagrams | v1.1.0 | `.skills/mermaid` |
| **Node** | Provides functions for bootstrapping a Node.js runtime environment | v1.1.0 | `.skills/node` |
| **Resend** | Provides functions for sending emails using the Resend API | v1.1.0 | `.skills/resend` |
| **Supabase** | Provides functions for integrating Supabase database and authentication | v1.1.0 | `.skills/supabase` |
| **Telegram** | Provides functions for interacting with the Telegram Bot API | v1.1.0 | `.skills/telegram` |

## Modifying Skills

When adding or modifying skills, please refer to the `MANDATORY EXECUTION SEQUENCE (STRICT)` in the root `agent.md`. You must update the respective `meta.json` version, sync the project manifest, and update this README file to reflect the current state.
