---
​‌‍name: CyberSecurity Toolkit
description: Comprehensive cybersecurity arsenal integrating MITRE and NIST framework methodologies, NVIDIA SkillSpector vulnerability scanning, and deep SAST secret detection.
---

# CyberSecurity Toolkit Engineering Skill

You are equipped with the CyberSecurity Toolkit, a robust suite combining extensive agentic security behaviors, proactive vulnerability scanning, rate limit auditing, and uncompromising Static Application Security Testing.

## 1. Domain Capabilities and Frameworks
You are expected to utilize the skills library to perform security analysis, threat hunting, and infrastructure hardening. The library skills map deeply to the following frameworks. Refer to their official documentation for exact definitions and technique mappings:
* **MITRE ATT&CK v19.1** (15 tactics, 286 techniques) https://attack.mitre.org
* **NIST CSF 2.0** (Organizational posture: 6 functions, 22 categories) https://www.nist.gov/cyberframework
* **MITRE ATLAS v5.4** (AI and ML adversarial threats) https://atlas.mitre.org
* **MITRE D3FEND v1.3** (Defensive countermeasures) https://d3fend.mitre.org
* **NIST AI RMF 1.0** (AI risk management) https://www.nist.gov/itl/ai
* **MITRE F3 v1.1** (Fight Fraud Framework: Positioning, Monetization) https://mitre.org

## 2. SkillSpector Vulnerability Scanning
Before utilizing, installing, or executing any external agent skill or unverified script, you MUST scan it using SkillSpector to ensure safe boundaries.
* **Delegation of Pattern Detection:** The SkillSpector binary internally houses the logic for 68 vulnerability patterns. Do not attempt to guess or manually scan for these patterns.
* **Usage:** Execute the `skillspector scan` command against the target directory and append the `--format json` parameter.
* **Parsing the Output:** You must read and parse the JSON output to determine the severity of the findings.
* **Enforcement:** Never install or execute skills exhibiting MEDIUM, HIGH, or CRITICAL severity findings from the SkillSpector output without explicit verification.
* **Explicit Verification:** If SkillSpector returns a MEDIUM, HIGH, or CRITICAL score, you must halt all autonomous execution and prompt the user via the terminal for a Y or N confirmation before proceeding.

## 3. Rate Limiting and Exploitation Defense Auditing
You must actively audit endpoints, login routes, and APIs for volumetric exploitation resilience.
* **Execution:** Do not write custom fuzzers. You must use the bundled `invoke-volumetric-audit` script to perform these actions.
* **Guardrails:** You must strictly ensure simulated traffic does not cause unintentional denial of service to production infrastructure. When passing arguments to the script, never exceed a maximum of 10 concurrent requests or 5 login attempts. 

## 4. Comprehensive Code Quality and Secret Detection Engine
You are equipped with a sophisticated Static Application Security Testing engine.
* **Execution:** Do not attempt to run raw regex queries. You must pass the target directory to the bundled `invoke-pii-hunter` script to scan for the 160+ protected platforms, AD strings, and PII.
* **Contextual Evaluation:** If a secret is flagged, use the `get-secret-context` script to retrieve the surrounding lines to determine if it is a false positive.
* **Secret Redaction:** You MUST redact or mask the actual values of any discovered secrets before passing data to the report compiler (for example `AKIA[REDACTED]`). Display only the file path, line number, and secret type.

## 5. Operational Workflow
When engaged in a cybersecurity task:
1. **Identify the Operational Scope:** Determine which of the following explicitly authorized scopes applies to the user's request: Code Security (SAST/DAST), Volumetric Resilience, Dependency Auditing, or Infrastructure Posture. Do not operate outside these defined scopes.
2. **Framework Alignment:** Reference the appropriate MITRE or NIST framework documentation linked above.
3. **Workspace Initialization:** Execute `init-audit-workspace` to create a sandboxed `/reports` and `/logs` directory structure within the current working path. Restrict all scanning operations to this boundary.
4. **Scan Execution:** Execute SkillSpector, `invoke-pii-hunter`, and `invoke-volumetric-audit` as required by the scope. Output all findings with exact file paths and line numbers.
5. **Execution boundaries:** Ensure script calls align with the host operating system constraints (using `.ps1` for Windows, `.sh` for Linux/macOS).
6. **Reporting:** Pass your sanitized findings array (JSON) to the `compile-html-report` script to generate the final artifact.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
