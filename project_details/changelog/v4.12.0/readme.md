# Version 4.12.0

## Features
* **Skills CLI Engine**: Overhauled the core ad-hoc installation logic in `packages/skills-cli/src/installer.js` (bumped to `v1.0.1`). Transitioned the engine from executing naive git clones of standalone skill identifiers to correctly orchestrating `git sparse-checkout` directly from the author's code-scaffold mono-repo.

## Refactors & Enforcements
* **NPM Package Bump**: Bumped the `@code-scaffold/skills-cli` package to version `1.0.1` to prep for NPM publication.
