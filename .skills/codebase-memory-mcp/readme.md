# Codebase Memory MCP

**Version:** 1
**Target:** `.skills/codebase-memory-mcp`
**Category:** AI, MCP & Developer Tools
**Keywords:** `codebase-memory`, `mcp-server`, `vector-embeddings`, `ast-index`, `semantic-search`, `rag`

## Description
High-performance code intelligence MCP server that indexes codebases into a persistent knowledge graph. It handles 158 languages and enables sub-ms structural queries.

## Capabilities & Use Cases
* **Extreme Indexing Speed:** Indexes entire repositories in milliseconds using LZ4 compression and in-memory SQLite.
* **Hybrid LSP Semantic Resolution:** Type-aware cross-file definition registry for major languages (Python, TS/JS, C#, Go, Java, Rust).
* **Cypher Graph Queries:** Exposes an MCP tool for deep structural inquiries (e.g. tracking inheritance, impact analysis, or unused code).
* **Headless Integration:** Single static binary (no dependencies, no Docker) natively compatible with automated environments.

## Usage
Agents can install the binary dynamically, hook it into their local MCP configuration, and immediately dispatch queries against the local repository graph to dramatically reduce context window usage (99% fewer tokens compared to file-by-file grepping).

## Changelog
* **v1** : Initial creation via the SkillForge Protocol.
