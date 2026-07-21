# Version 2.6.0

## Release Summary
This version refines the metadata schema rules and implements concise documentation standards across the payload library.

## Key Changes
* **Agent Metadata Protocol Update**: 
    * Updated the `agent.md` JSON schema instructions to mandate concise phrasing for the `description` field.
    * Explicitly forbade the verbose prefix "Provides functions for " or similar fluff to ensure high-density readability in the UI and README.
* **Payload Library Refactoring**:
    * Cleaned up the `description` fields in all 9 `meta.json` files (Excalidraw, Firebase, GitHub, Marp, Mermaid, Node, Resend, Supabase, Telegram).
    * Incremented minor patch versions for all skills to reflect the schema adherence update.
* **Documentation Sync**:
    * Updated the unified `.skills/README.md` table to surface the newly concise skill descriptions and bumped versions.
    * Incremented the root `manifest.json` version to `2.6.0`.

## Artifacts Snapshot
All architectural documents and the `scaffold.ps1` source as of this version are preserved in this immutable history folder.
