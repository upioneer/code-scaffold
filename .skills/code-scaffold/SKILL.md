---
name: Code Scaffold Harness
description: Agent harness for headlessly deploying Code Scaffold assets.
---

# Code Scaffold Agent Harness

This skill equips you with the instructions to interact with the Code Scaffold binary strictly from the CLI/headless interface. Code Scaffold is an advanced code-generation engine that outputs architecture assets for projects.

## Reference Website
https://code-scaffold.web.app/

## Installation & Availability
The Code Scaffold binary is typically provided natively via `code-scaffold.exe` on Windows or `code-scaffold` on Unix. If it is not immediately present in your PATH or working directory, you must acquire the precompiled binary from the project's official distributions or compile it from source via `cargo build --release`.

## Headless CLI Syntax

Code Scaffold supports a fully headless deployment mode that allows agents to bypass the TUI entirely.

To view the raw machine-readable JSON structure of available artifacts, personas, skills, and licenses, use the `/help` flag:
```bash
code-scaffold.exe /help
```

To execute a headless deployment, you must provide the `--headless` flag along with the absolute target directory. You can optionally comma-separate artifacts, skills, and personas:
```bash
code-scaffold.exe --headless --target "/absolute/path/to/target" --personas "Web Dev,AI Systems Engineer" --artifacts "readme.md,.gitignore" --skills "github,typescript" --license "MIT"
```

### Argument Details
* `--target` (Required): The absolute path to the directory where you want to scaffold the project.
* `--personas` (Optional): A comma-separated list of persona labels (e.g. `Web Dev`, `DBA`).
* `--artifacts` (Optional): A comma-separated list of core artifacts (e.g. `readme.md`, `apps/`, `packages/`, `.gitignore`).
* `--skills` (Optional): A comma-separated list of agent skills (e.g. `github`, `firebase`).
* `--license` (Optional): An open source license label (e.g. `MIT`).

### Best Practices for Agents
1. Before deploying, always query `code-scaffold.exe /help` to ingest the absolute list of currently available labels. The labels are matched in a case-insensitive manner.
2. Ensure your `--target` path is fully resolved and absolute.
3. Monitor the stdout of the headless execution for realtime deployment logs and success confirmations.
