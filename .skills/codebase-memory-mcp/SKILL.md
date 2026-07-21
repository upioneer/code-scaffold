---
name: Codebase Memory MCP
description: High-performance code intelligence MCP server. Indexes codebases into a persistent knowledge graph — average repo in milliseconds.
version: 1
---

# Codebase Memory MCP

Codebase Memory MCP is an ultra-fast code intelligence engine designed specifically for AI agents. Rather than dumping raw files into context, it builds a persistent structural knowledge graph (AST + Hybrid LSP) and provides tools to query it.

## Installation & Orchestration

Because this tool ships as a single static binary with zero dependencies, AI agents can effortlessly bootstrap it in any workspace.

### Windows (PowerShell)
```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.ps1 -OutFile install.ps1
Unblock-File .\install.ps1
.\install.ps1 --skip-config
```

### macOS / Linux
```bash
curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh | bash -s -- --skip-config
```

*Note: The `--skip-config` flag is recommended for headless agent bootstrapping if you intend to launch the server directly via standard MCP stdio pipes rather than relying on global IDE configs.*

## Headless AI Value-Add

To maximize efficiency during autonomous tasks, leverage this tool to perform structural analysis *before* reading files:

1. **Impact Analysis:** When tasked with refactoring a core utility function, use the MCP query tool to fetch all downstream callers in a single sub-millisecond request. This avoids massive `grep` operations and token bloat.
2. **Infrastructure Topologies:** The tool indexes Dockerfiles and Kubernetes manifests as native graph nodes. You can query cross-references between Kustomize overlays and referenced resources directly.
3. **Dead Code Elimination:** Run targeted graph queries to identify isolated nodes (functions/classes with zero incoming call edges) to safely prune technical debt without relying on imprecise text searches.
