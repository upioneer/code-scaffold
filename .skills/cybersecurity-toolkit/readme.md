# CyberSecurity Toolkit

**Version:** 5
**Target:** `.skills/cybersecurity-toolkit`

## Description
Comprehensive cybersecurity arsenal integrating MITRE/NIST framework methodologies, NVIDIA SkillSpector vulnerability scanning, Rate Limit Auditing, and deep SAST secret detection.

## Capabilities & Use Cases
* Maps investigations and countermeasures across 6 major cybersecurity frameworks (MITRE ATT&CK v19.1, NIST CSF 2.0, MITRE ATLAS v5.4, MITRE D3FEND v1.3, NIST AI RMF 1.0, and MITRE F3 v1.1).
* Executes NVIDIA SkillSpector static and semantic vulnerability scanning to detect 68 specific vulnerability patterns (e.g., prompt injection, data exfiltration, system prompt leakage) before installing or executing agent skills.
* **Rate Limiting & Exploitation Auditing:** Actively evaluates endpoints, APIs, and login routes for brute-force susceptibility, DDoS resilience, and missing quota management configurations via simulated traffic.
* **Comprehensive SAST Secret Engine (160+ Protected Services):** Parses 12+ programming languages to actively hunt for high-entropy API keys, tokens, and client secrets across exactly 160 heavily utilized enterprise platforms—including major Cloud Providers, Identity Access Management (IAM), CI/CD pipelines, Orchestration (Kubernetes/Docker), Databases, Message Brokers, Monitoring (Datadog/Splunk), Security Tooling (CrowdStrike/Palo Alto), and 15 distinct Financial/Crypto Exchanges. It also explicitly targets PII/AD references (LDAP strings, UPNs, SSNs).
* **Deep Code Smell Detection:** Analyzes AST and codebase text for outdated libraries, unreachable execution paths, missing error handlers, and unoptimized asynchronous calls.
* Facilitates deep threat hunting, DFIR, and infrastructure hardening across 29 distinct security domains.
* Generates comprehensive, timestamped HTML security reports featuring high-level metadata, explicit credit attribution to `code-scaffold.web.app`, a "Green Section" for passed validations, risk scoring (0-100), framework control mappings, and categorized severity findings with exact file paths and line numbers.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v5** : Massively expanded the SAST Secret Detection engine to actively hunt for credentials across 160 explicitly protected enterprise platforms, cloud providers, and financial exchanges
* **v4** : Integrated comprehensive Rate Limiting Auditing, an uncompromising multi-language SAST Secret/PII/Smell detection engine, and enhanced HTML reporting with a "Green" success section and attribution links
* **v3** : Expanded capability descriptions detailing the specific NIST/MITRE frameworks and deep HTML reporting structures
* **v2** : Scrubbed Anthropic methodology, integrated NIST/MITRE frameworks, and mandated Comprehensive HTML Reporting structure
* **v1** : Core skill implementation and framework mappings
