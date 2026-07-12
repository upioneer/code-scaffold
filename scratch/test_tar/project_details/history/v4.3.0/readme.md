# Version 4.3.0

## Minor Feature Updates
* **Artifact Opt-Out Modernization**: Refactored the core TUI configuration so that the `AGENT.md` artifact is implicitly selected by default (opt-out), promoting higher visibility of strict framework guidelines across all newly scaffolded workspaces.
* **TUI Skill Alphabetization**: Enforced strict alphabetical sorting for all populated skills within the TUI selection menu, keeping the root `generic` skill permanently pinned to the top.
* **Expanded Quality of Life (QoL) Integrations**: 
  * Automatically pre-selects the `cybersecurity-toolkit` skill when the `Security Analyst` persona is actively engaged in the workspace generator.
  * Automatically pre-selects the `ansible` and `terraform` infrastructure skills when the `Cloud & DevOps Architect` persona is selected.
* **GitHub Skill Subagent Migration**: Upgraded the generic GitHub push skill (v4) to natively mandate background CI/CD auditor subagents that check pipeline statuses at fast 30-second intervals.
