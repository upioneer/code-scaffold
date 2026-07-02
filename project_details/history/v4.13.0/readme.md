# Version 4.13.0

## Features
* **Universal Agent Discovery Engine**: Refactored `packages/skills-cli/src/installer.js` to change the drop-zone to the universal `.skills/` standard. Additionally wired a dynamic post-installation mapping engine that instantly constructs cross-platform pointer files (e.g., Antigravity's `.agents/skills.json` and `.cursorrules` for Claude Code/Cursor) to effortlessly force AI platforms to auto-discover installed payloads with zero user configuration.
