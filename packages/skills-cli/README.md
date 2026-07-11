# Code Scaffold Skills CLI

**Version:** 1.0.4
**Repository:** [Code Scaffold](https://github.com/upioneer/code-scaffold)

## Description
The `@code-scaffold/skills-cli` is the official ad-hoc deployment engine for provisioning autonomous agent skills into any local codebase. It orchestrates lightning-fast `git sparse-checkout` routines to extract nested skill payloads from a target GitHub monorepo (such as the Code Scaffold `.skills` architecture) and seamlessly integrates them into your current working directory.

## Usage
You do **not** need to install this package permanently. The recommended usage is via `npx` to ensure you are always executing the latest deployment logic.

To provision a skill natively into your project, simply run:
```bash
npx -y @code-scaffold/skills-cli add <author>/<skill-name>
```

### Example
Deploying the comprehensive Cybersecurity Toolkit:
```bash
npx -y @code-scaffold/skills-cli add upioneer/cybersecurity-toolkit
```

## How It Works
1. **Targeting:** The CLI parses the requested identifier (e.g., `upioneer/cybersecurity-toolkit`).
2. **Extraction:** It connects directly to the target author's GitHub repository and executes a `git sparse-checkout` to pull **only** the requested skill folder.
3. **Integration:** It deposits the payload into a universally neutral `.skills/<skill-name>` directory inside your local project.
4. **Universal Agent Auto-Discovery:** The CLI actively bridges the gap between disparate AI ecosystems by dynamically constructing cross-platform pointer files (e.g., `.agents/skills.json` for Antigravity, `.devin/rules/skills.md` for Devin CLI/Desktop, and `.cursorrules` / `.opencode.md` for Cursor, Claude Code, and OpenCode). This instantly tricks any AI agent into auto-discovering the newly installed capability with absolutely zero configuration required by the developer.
