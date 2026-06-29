# CyberSecurity Toolkit

**Version:** 3
**Target:** `.skills/cybersecurity-toolkit`

## Description
Comprehensive cybersecurity arsenal integrating MITRE/NIST framework methodologies and NVIDIA SkillSpector vulnerability scanning.

## Capabilities & Use Cases
* Maps investigations and countermeasures across 6 major cybersecurity frameworks (MITRE ATT&CK v19.1, NIST CSF 2.0, MITRE ATLAS v5.4, MITRE D3FEND v1.3, NIST AI RMF 1.0, and MITRE F3 v1.1).
* Executes NVIDIA SkillSpector static and semantic vulnerability scanning to detect 68 specific vulnerability patterns (e.g., prompt injection, data exfiltration, system prompt leakage) before installing or executing agent skills.
* Facilitates deep threat hunting, DFIR, and infrastructure hardening across 29 distinct security domains.
* Generates comprehensive, timestamped HTML security reports featuring high-level metadata, risk scoring (0-100), framework control mappings (e.g., MITRE T1566), and categorized severity findings (CRITICAL to LOW) with explicit remediation paths and verification methodologies.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v3** : Expanded capability descriptions detailing the specific NIST/MITRE frameworks and deep HTML reporting structures
* **v2** : Scrubbed Anthropic methodology, integrated NIST/MITRE frameworks, and mandated Comprehensive HTML Reporting structure
* **v1** : Core skill implementation and framework mappings
