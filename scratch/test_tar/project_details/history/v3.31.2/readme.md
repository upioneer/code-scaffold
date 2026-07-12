# Version 3.31.2 Walkthrough

## Summary of Changes
This release strictly enforces typographical and structural requirements across all project documentation.

## Formatting & Generative Updates
1. **Typography Normalization:**
   * Prohibited the use of em dashes (` `) and en dashes (` `) across all `readme.md` files project-wide.
   * Standardized list markers to use asterisks (`*`) exclusively rather than hyphens.
   * Executed a recursive patching script across 105 history documents and core readmes to conform to the new typographical baseline without disrupting code block functionality.
2. **Dynamic Skill Capabilities Parsing:**
   * Enhanced the automated `readme.md` generator to actively parse capability and use-case hierarchies directly from underlying `SKILL.md` payloads.
   * Retroactively injected `## Capabilities & Use Cases` sections into all **31** embedded skills to greatly enhance discoverability prior to execution.
