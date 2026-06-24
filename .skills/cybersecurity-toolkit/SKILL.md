---
name: CyberSecurity Toolkit
description: Comprehensive cybersecurity arsenal integrating MITRE/NIST framework methodologies and NVIDIA SkillSpector vulnerability scanning.
---

# CyberSecurity Toolkit Engineering Skill

You are equipped with the CyberSecurity Toolkit, a robust suite combining extensive agentic security behaviors and proactive vulnerability scanning. This skill merges two critical domains:
1. **Framework-Driven Methodologies:** A comprehensive methodology library of over 800 structured cybersecurity skills mapped across 6 major industry frameworks (MITRE and NIST).
2. **NVIDIA SkillSpector:** A security scanner to detect vulnerabilities, malicious patterns, and security risks in AI agent skills before they are installed or executed.

## 1. Domain Capabilities & Frameworks

You are expected to utilize the skills library to perform security analysis, threat hunting, and infrastructure hardening. The library's skills map deeply to the following frameworks:
- **MITRE ATT&CK v19.1** (15 tactics, 286 techniques)
- **NIST CSF 2.0** (Organizational posture: 6 functions, 22 categories)
- **MITRE ATLAS v5.4** (AI/ML adversarial threats)
- **MITRE D3FEND v1.3** (Defensive countermeasures)
- **NIST AI RMF 1.0** (AI risk management)
- **MITRE F3 v1.1** (Fight Fraud Framework: Positioning, Monetization)

Use these mappings to ensure all security countermeasures and investigations adhere strictly to industry taxonomy.

## 2. SkillSpector Vulnerability Scanning

Before utilizing, installing, or executing any third-party agent skill or unverified script, you MUST scan it using SkillSpector to ensure safe boundaries.
- **Pattern Detection:** Detects 68 vulnerability patterns across 17 categories including Prompt Injection, Data Exfiltration, Privilege Escalation, Supply Chain, Excessive Agency, System Prompt Leakage, and Anti-Refusal mechanisms.
- **Usage:** Run `skillspector scan <target_directory_or_repo>` to perform analysis. You can append `--no-llm` for fast static analysis or use an LLM provider for deep semantic evaluation.
- **Enforcement:** Never install or execute skills that exhibit CRITICAL or HIGH severity findings (e.g., Exfiltration Commands, Instruction Override, Harmful Content) without explicit verification. You may use `skillspector baseline` to suppress false positives or accepted risks.

## 3. Operational Workflow

When engaged in a cybersecurity task:
1. **Identify the Objective:** Determine which of the 29 security domains applies (e.g., Cloud Security, Threat Hunting, DFIR).
2. **Framework Alignment:** Reference the appropriate MITRE or NIST framework to structure your investigation.
3. **Scan Dependencies:** Run any external tools or ad-hoc skills through SkillSpector to acquire a risk score (0-100).
4. **Execution:** Execute the validated skills, ensuring all actions are documented and map back to the targeted security frameworks.
