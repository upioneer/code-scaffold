# Version 4.2.0

## Features & Additions
* **Privacy Policy Generator**: Introduced a new skill to automatically scaffold privacy policy documentation. Includes interactive LLM prompting for platform types, business/individual entities, and Google Analytics clauses with native opt-out extension blurbs.
* **MCP Generator**: Introduced a robust Model Context Protocol (MCP) tool generator. Includes interactive scaffolding prompts and comprehensive embedded reference documentation covering standard specs, transports, security guidelines, and 10+ language implementations (TypeScript, Python, Java, Kotlin, C#, Go, PHP, Ruby, Rust, Swift).
* **TUI Automation**: The Rust TUI automatically associates the new Privacy Policy skill when a `Web Dev` or `Mobile (iOS/And)` persona is selected.

## Technical Tasks Completed
* Updated `manifest.json` and `.skills/README.md` to register the new skills.
* Recompiled and tested `scaffold-tui` to ensure strict CI/CD hygiene.
