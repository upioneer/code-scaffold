# Version 4.13.0

## Features
* **Universal Agent Discovery Engine**: Refactored `packages/skills-cli/src/installer.js` to change the drop-zone to the universal `.skills/` standard. Additionally wired a dynamic post-installation mapping engine that instantly constructs cross-platform pointer files (e.g., Antigravity's `.agents/skills.json` and `.cursorrules` / `.opencode.md` for Cursor, Claude Code, and OpenCode) to effortlessly force AI platforms to auto-discover installed payloads with zero user configuration.

## Refactors & Enforcements
* **Skills CLI Engine Documentation**: Generated the official `README.md` for the `@code-scaffold/skills-cli` package to render natively on the NPM registry page. The documentation aggressively outlines the sparse-checkout integration architecture, promotes the frictionless `npx -y` installation vector, and highlights the universal agent auto-discovery mechanics.
* **NPM Package Bump**: Bumped the `@code-scaffold/skills-cli` package to version `1.0.3` to trigger a clean NPM publication payload that includes the new OpenCode integration and documentation assets.
