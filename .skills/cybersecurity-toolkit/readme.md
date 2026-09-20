# CyberSecurity Toolkit

**Version:** 8

**Target:** `.skills/cybersecurity-toolkit`

**Category:** DevOps & Infrastructure

**Keywords:** `cybersecurity`, `security-audit`, `vulnerability-scan`, `owasp`, `penetration-testing`, `hardening`, `agentic-security`, `sentinel-mesh`

## Description
Autonomous cybersecurity arsenal integrating the Sentinel Multi-Agent Security Mesh, episodic attack surface mapping, MITRE and NIST methodologies, SkillSpector scanning, and ChainAST context compaction.

## Capabilities & Use Cases
* Mapped directly to industry frameworks: MITRE ATT&CK v19.1, NIST CSF 2.0, MITRE ATLAS v5.4, MITRE D3FEND v1.3, NIST AI RMF 1.0, and MITRE F3 v1.1.
* Deploys the Sentinel Autonomous Security Engine (SASE) with a decoupled multi-agent mesh featuring Orchestrator, Reconnaissance Specialist, Strategy Planner, and Sandboxed Execution Agent.
* Leverages a Tripartite Memory Architecture combining long-term threat intelligence, working context surface graphs, and persistent episodic experience logs.
* Employs the Sentinel ChainAST Context Compactor to convert high-volume network traces and scanning outputs into semantic abstract syntax trees that prevent context saturation.
* Executes SkillSpector static vulnerability scanning across 68 specific vulnerability patterns to enforce execution safety for scripts and agent skills.
* Enforces mandatory user verification before executing any agent skill scoring MEDIUM, HIGH, or CRITICAL on vulnerability scans.
* Deploys bundled scripts (`invoke-volumetric-audit`) to evaluate endpoints, APIs, and login routes for brute force susceptibility and denial of service resilience.
* Leverages advanced Static Application Security Testing via the `invoke-pii-hunter` script to actively hunt for credentials across 160+ protected enterprise services and platforms.
* Enforces strict data sanitization and credential redaction (`AKIA[REDACTED]`) before evidence logging and report compilation.
* Generates comprehensive, timestamped HTML security reports via the `compile-html-report` script within sandboxed execution environments.

## Usage
Execute the autonomous orchestrator script (`invoke-sentinel-orchestrator`) or invoke component scripts (`skillspector`, `invoke-volumetric-audit`, `invoke-pii-hunter`, `get-secret-context`, `init-audit-workspace`, `compile-html-report`) in alignment with the operational workflows defined in `SKILL.md` to conduct robust security audits and generate sanitized HTML artifacts.

## Changelog
* **v8** : Standardized ASCII art logo to uniform 6-line ANSI Shadow format.
* **v7** : Integrated the Sentinel Autonomous Security Engine (SASE) multi-agent orchestration mesh, tripartite memory architecture (long-term, working, episodic), and Sentinel ChainAST context compaction for autonomous security auditing
* **v6** : Integrated strict execution guardrails, script delegation (`invoke-pii-hunter`, `invoke-volumetric-audit`), and data sanitization workflows
* **v5** : Massively expanded the SAST Secret Detection engine to actively hunt for credentials across 160 explicitly protected enterprise platforms, cloud providers, and financial exchanges
* **v4** : Integrated comprehensive Rate Limiting Auditing, an uncompromising multi-language SAST Secret/PII/Smell detection engine, and enhanced HTML reporting with a "Green" success section and attribution links
* **v3** : Expanded capability descriptions detailing the specific NIST/MITRE frameworks and deep HTML reporting structures
* **v2** : Scrubbed Anthropic methodology, integrated NIST/MITRE frameworks, and mandated Comprehensive HTML Reporting structure
* **v1** : Core skill implementation and framework mappings
