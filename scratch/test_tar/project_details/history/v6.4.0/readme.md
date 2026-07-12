# Version 6.4.0

* **UI Wizard Redesign**: Renamed "Categories" to "Steps" and added a dedicated terminal "Deploy" step.
* **Contributing Templates**: Added the `.contributions/` payload with `strict-ownership.md` and `open-source.md` policies, and wired up the dynamic `ContributingTemplate` wizard flow with single-select enforcement.
* **Agent Client Protocol (ACP)**: Integrated official ACP compatibility documentation, detailing dual-mode (Agent/Client) engagement models and submission readiness for the ACP Registry.
* **Headless Server Engine**: Fully implemented the Agent Client Protocol (ACP) server over Stdio transport. Exposed `list_skills`, `scaffold_project`, and `inject_persona` primitives via an MCP session integration that constructs stateless deployable manifests in memory, streaming `manifest_engine` output directly to Agents via stderr.

## TUI Demo
![TUI Demo GIF](demo.gif)

### Splash Screen
![Splash Screen](demo_splash.png)

### Main Selection
![Main Selection](demo_main.png)

### Final Summary
![Final Summary](demo_final.png)
