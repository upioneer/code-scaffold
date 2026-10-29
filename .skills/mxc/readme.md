# MXC Policy Containment

**Version:** 2

**Target:** `.skills/mxc`

**Category:** Security & Cryptography

**Keywords:** `mxc`, `agent-sandboxing`, `execution-containers`, `policy-driven-containment`, `process-container`, `appcontainer`, `wslc`, `bubblewrap`, `seatbelt`, `least-privilege`, `prompt-injection-defense`, `airgap-isolation`, `wxc-exec`, `default-deny`, `sandbox-policy`, `windows-sandbox`, `ai-agent-isolation`, `secret-exfiltration-defense`

## Description
Policy-driven execution sandboxing and container isolation framework for AI agents, model-generated code, and untrusted tools. Enforces default-deny filesystem, network, and desktop boundaries across Windows ProcessContainers, Linux Bubblewrap, and macOS Seatbelt.

## Capabilities & Use Cases
* Enforces OS-level default-deny security boundaries that isolate AI agent executions, untrusted repositories, and model-generated scripts from host operating system files and networks.
* Externalizes security policies into versioned, declarative JSON configurations that cannot be tampered with or modified by the executing agent.
* Supports fine-grained filesystem isolation with granular read-only, read-write, and prioritized denied path lists to guard SSH keys, cloud profiles, and environment secrets.
* Restricts network egress through strict domain and port whitelisting, preventing covert data exfiltration, reverse shells, and unauthorized telemetry while supporting corporate proxies.
* Eliminates desktop and clipboard manipulation by disabling graphical window rendering and locking clipboard interaction to prevent focus hijacking and keystroke snooping.
* Operates seamlessly across platforms by dynamically dispatching to native containment backends: ProcessContainers (AppContainer) and WSLc on Windows, Bubblewrap on Linux, and Seatbelt on macOS.
* Provides full container lifecycle management supporting both ephemeral one-shot task execution and state-aware multi-step provisioning pipelines (provision, start, exec, stop, deprovision).
* Features dedicated diagnostic and audit modes with structured line-delimited JSON logging to troubleshoot permission denials and baseline trusted tool requirements.
* Includes an interactive visual sandbox canvas for real-time policy modeling, threat simulation, and containment telemetry analysis.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for deep integration guidelines, CLI commands, and standard policy recipes.

## Changelog
* **v2** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v1** : Initial release of the MXC Policy Containment Engine skill, establishing default-deny policy specifications, cross-platform containment backends (Windows ProcessContainer, Linux Bubblewrap, macOS Seatbelt), lifecycle management CLI protocols, and interactive agent sandbox simulation
