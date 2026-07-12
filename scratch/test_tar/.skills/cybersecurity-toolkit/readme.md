# CyberSecurity Toolkit

**Version:** 6
**Target:** `.skills/cybersecurity-toolkit`

## Description
Comprehensive cybersecurity arsenal integrating MITRE and NIST framework methodologies, NVIDIA SkillSpector vulnerability scanning, and deep SAST secret detection.

## Capabilities & Use Cases
* Mapped directly to industry frameworks: MITRE ATT&CK v19.1, NIST CSF 2.0, MITRE ATLAS v5.4, MITRE D3FEND v1.3, NIST AI RMF 1.0, and MITRE F3 v1.1.
* Executes NVIDIA SkillSpector static vulnerability scanning to enforce execution safety and detect 68 specific vulnerability patterns.
* Enforces explicit user verification before executing any agent skill scoring MEDIUM, HIGH, or CRITICAL on vulnerability scans.
* Deploys bundled scripts (`invoke-volumetric-audit`) to evaluate endpoints, APIs, and login routes for brute force susceptibility and DDoS resilience.
* Leverages advanced Static Application Security Testing via the `invoke-pii-hunter` script to actively hunt for 160+ protected services, AD strings, and PII.
* Enforces strict data sanitization and redaction (`AKIA[REDACTED]`) before report compilation.
* Generates comprehensive, timestamped HTML security reports via the `compile-html-report` script within sandboxed execution environments.

## Usage
Execute the bundled scripts (`skillspector`, `invoke-volumetric-audit`, `invoke-pii-hunter`, `get-secret-context`, `init-audit-workspace`, `compile-html-report`) in alignment with the operational workflows defined in `SKILL.md` to conduct robust security audits and generate sanitized HTML artifacts.

## Changelog
* **v6** : Integrated strict execution guardrails, script delegation (`invoke-pii-hunter`, `invoke-volumetric-audit`), and data sanitization workflows
* **v5** : Massively expanded the SAST Secret Detection engine to actively hunt for credentials across 160 explicitly protected enterprise platforms, cloud providers, and financial exchanges
* **v4** : Integrated comprehensive Rate Limiting Auditing, an uncompromising multi-language SAST Secret/PII/Smell detection engine, and enhanced HTML reporting with a "Green" success section and attribution links
* **v3** : Expanded capability descriptions detailing the specific NIST/MITRE frameworks and deep HTML reporting structures
* **v2** : Scrubbed Anthropic methodology, integrated NIST/MITRE frameworks, and mandated Comprehensive HTML Reporting structure
* **v1** : Core skill implementation and framework mappings
