# Version 4.15.0

## Features
* **Windows Dev Server Port Clearance Protocol**: Aggressively updated the native `node` development skill (`.skills/node/SKILL.md`) to instruct agents on strictly circumventing orphaned Node.js child processes on Windows hosts. Agents are now hardwired to extract PIDs via `netstat` and explicitly wipe the bound dev-server ports using `taskkill` when shutting down Vite, Next, or Express environments.

## Refactors & Enforcements
* **Skill Version Sync**: Bumped the Node.js development skill bundle to `v3` across `meta.json`, the deployment manifest, local readme architectures, and the global skill registry.
