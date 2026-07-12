# PlayCanvas Editor Skill

## Overview
This skill focuses on the visual editor frontend, allowing agents to automate editor tasks and manage local development of the editor itself.

## AI Agent Instructions

### 1. Local Development
To run the editor frontend locally for testing or feature development:
```bash
npm install
npm run develop # Starts local server on port 3487
```
Then, append `?use_local_frontend` to your PlayCanvas project URL.

### 2. Code Standards (Strict)
When modifying the editor codebase, agents MUST follow the rules defined in:
*   `CLAUDE.md`: Implementation rules and standards.
*   `AGENTS.md`: Specific context for AI assistants.

### 3. API Automation
Agents can interact with the global `editor` object to automate repetitive tasks:
*   **Asset Management:** Renaming, moving, or batch-updating asset properties.
*   **Hierarchy Manipulation:** Programmatically building complex entity trees.

### 4. Testing
Use the Playwright-based test suite in `test-suite/` to validate API interactions and UI stability.
