# Code Scaffold Skills CLI

**Version:** 1.0.13
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
4. **Universal Agent Auto-Discovery:** The CLI actively bridges the gap between disparate AI ecosystems by dynamically constructing cross-platform pointer files across 12 leading agent environments (Google Antigravity `.agents/skills.json`, Devin CLI & Desktop `.devin/rules/skills.md`, Cursor `.cursor/rules/skills.mdc`, Claude Code `CLAUDE.md`, OpenCode `.opencode.md`, OpenAI Codex & ChatGPT `CODEX.md`, Meta Muse `MUSE.md`, Kimi Code `KIMI.md`, Qwen Code `QWEN.md`, GitHub Copilot `.github/copilot-instructions.md`, Windsurf `.windsurfrules`, and Cline & Roo Code `.clinerules`). This automatically binds skill blueprints into each agent's contextual awareness upon boot with zero manual configuration required.
