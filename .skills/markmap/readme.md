# Markmap

**Version:** 1
**Target:** `.skills/markmap`

## Description
A highly robust standalone skill for Markmap, enabling the transformation of standard markdown into interactive, hierarchical mindmaps.

## Capabilities & Use Cases
* Parses standard Markdown structures, including headings and lists, into scalable, hierarchical tree data
* Supports rich content nodes containing inline code, code blocks, hyperlinks, text formatting, emojis, and tables
* Integrates native LaTeX and KaTeX mathematical notation directly into mindmap branches
* Configures appearance, initial node expansion, and dynamic branch colors using embedded YAML frontmatter (`jsonOptions`)
* Generates interactive, standalone HTML payloads directly from the terminal via the `markmap-cli` utility
* Automates real-time preview workflows using the `--watch` flag for hot-reloading browser views
* Empowers programmatic integration within web architectures using decoupled `markmap-lib` and `markmap-view` libraries
* Extends capabilities to IDEs and editors with official plugins for VS Code, Vim, and Emacs

## Usage
AI agents and developers can utilize this skill to rapidly scaffold Markmap files, configure jsonOptions frontmatter, or orchestrate CLI commands to export interactive HTML mindmaps.

## Changelog
* **v1** : Initial implementation of the Markmap skill payload
