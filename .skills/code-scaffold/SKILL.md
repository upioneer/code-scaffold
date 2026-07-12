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
code-scaffold.exe --headless --target "/absolute/path/to/target" --personas "Web Dev,AI Systems Engineer" --artifacts "readme.md,.gitignore" --skills "github,typescript" --license "MIT" --json-output
```

### Argument Details
* `--target` (Required): The absolute path to the directory where you want to scaffold the project.
* `--personas` (Optional): A comma-separated list of persona labels (e.g. `Web Dev`, `DBA`).
* `--artifacts` (Optional): A comma-separated list of core artifacts (e.g. `readme.md`, `apps/`, `packages/`, `.gitignore`).
* `--skills` (Optional): A comma-separated list of agent skills (e.g. `github`, `firebase`).
* `--license` (Optional): An open source license label (e.g. `MIT`).
* `--json-output` (Optional): Outputs execution results in a strictly machine-readable JSON payload, suppressing all standard TUI logs. Perfect for programmatic integration.
* `--dry-run` (Optional): Constructs the deployment manifest and outputs it as JSON (when combined with `--json-output`) without executing any file modifications.
* `--version-json` (Optional): Outputs the current Code Scaffold version as a JSON object (e.g. `{"version": "5.9.0"}`).

### Best Practices for Agents
1. Before deploying, always query `code-scaffold.exe /help` to ingest the absolute list of currently available labels. The labels are matched in a case-insensitive manner.
2. Ensure your `--target` path is fully resolved and absolute.
3. Monitor the stdout of the headless execution for realtime deployment logs and success confirmations.

## Scaffold Connect (OTA Bridging)

Code Scaffold features a zero-trust, ephemeral WebSocket bridge ("Scaffold Connect") that allows you (the agent) to securely tap into a user's local terminal and execute commands remotely. 

If a user prompts you with a connection URI like `scaffold://063238@6rkkIbQqN8In5UjNZ0ugnU4Hs86C3GKCX7zAomXY/H8=`, this represents:
* **PIN**: The 6-digit room code (e.g., `063238`)
* **Key**: The Base64 AES-256-GCM encryption key (e.g., `6rkk...`)

To establish the bridge and execute commands on the user's machine, construct an AES-encrypted WebSocket payload and send it to `wss://code-scaffold-relay.upioneer.deno.net/room/[PIN]`.

1. **Protocol**: JSON-RPC over AES-256-GCM.
2. **Handshake**: First, encrypt and send an `initialize` JSON-RPC method containing `params: { clientInfo: { name: "YourAgentName" } }`.
3. **Execution**: To run terminal commands on the user's machine, encrypt and send an `execute_command` JSON-RPC method containing `params: { command: "cargo build" }`. Code Scaffold will execute the command locally and pipe the stdout/stderr ciphertext back to you over the WebSocket.

**Encryption Standard:**
* Cipher: AES-256-GCM
* Nonce: 12-byte cryptographically secure random bytes
* Payload Format: `[12-byte Nonce] + [Ciphertext] + [Auth Tag]`
