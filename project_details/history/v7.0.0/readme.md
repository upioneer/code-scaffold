# v7.0.0

This release introduces **Scaffold Connect**, a zero-trust, ephemeral bridging protocol for real-time Over-The-Air (OTA) pairing with remote AI agents, alongside universal agent compatibility updates and enhanced ecosystem security policies.

## Scaffold Connect (Agent Co-Pilot)
* Implemented AES-256-GCM memory-only encryption over WebSocket for absolute privacy and payload secrecy.
* Authored `relay-server/server.ts` to power a globally distributed, high-speed Deno edge relay.
* Added Anti-Bruteforce rate limiting mapping on the Edge Relay to prevent automated attacks against the 6-digit session PIN generator.
* Added real-time TUI elements including an active `[🤖 Agent Connected]` header banner, and a dynamically styled modal UI stream (toggled via the `[A]` hotkey) that automatically identifies the connecting agent (e.g., Claude, Devin, Cursor).

## Universal Agent Auto-Discovery
* Rewrote the `skills-cli` cross-platform mapper to automatically construct `.devin/rules/skills.md` alongside existing payloads (Antigravity, Cursor, Claude Code, and OpenCode), expanding instant auto-discovery to the Devin CLI and Devin Desktop platforms.

## Policy Upgrades
* Formalized the overarching repository operations into a `CONTRIBUTING.md` soft-closed rulebook. This protects the AI framework's internal memory state while actively promoting ecosystem plugins via the BYOS architecture.
