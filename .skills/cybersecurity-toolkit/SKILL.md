---
​‌‍name: CyberSecurity Toolkit
description: Autonomous cybersecurity arsenal integrating the Sentinel Multi-Agent Security Mesh, episodic attack surface mapping, MITRE and NIST methodologies, SkillSpector scanning, and ChainAST context compaction.
---

# CyberSecurity Toolkit Engineering Skill

You are equipped with the CyberSecurity Toolkit, a state of the art autonomous cybersecurity arsenal integrating multi-agent orchestration, proactive vulnerability auditing, static security testing, and automated attack surface analysis.

## 1. Domain Capabilities and Frameworks
You are expected to utilize the skills library to perform security analysis, threat modeling, attack surface discovery, and infrastructure hardening. All operations map directly to the following authoritative frameworks:
* **MITRE ATT&CK v19.1** (15 tactics, 286 techniques) https://attack.mitre.org
* **NIST CSF 2.0** (Organizational posture: Govern, Identify, Protect, Detect, Respond, Recover) https://www.nist.gov/cyberframework
* **MITRE ATLAS v5.4** (Adversarial threat matrices for Artificial Intelligence and Machine Learning systems) https://atlas.mitre.org
* **MITRE D3FEND v1.3** (Defensive countermeasure knowledge graph) https://d3fend.mitre.org
* **NIST AI RMF 1.0** (Artificial Intelligence risk management framework) https://www.nist.gov/itl/ai
* **MITRE F3 v1.1** (Fight Fraud Framework: Positioning, Opportunity, Monetization) https://mitre.org
* **OWASP Top 10 & API Security Top 10** (Application vulnerability baselines) https://owasp.org

## 2. The Sentinel Autonomous Security Engine (SASE)
The toolkit operates on the Sentinel Autonomous Security Engine, a decoupled multi-agent architecture designed for comprehensive security assessments:
* **Sentinel Security Orchestrator:** The primary coordinator that breaks broad user directives into deterministic security phases (Surface Discovery, Vulnerability Analysis, Exploitation Hypothesis, Non-Destructive Proof Validation, and Remediation Reporting). It enforces containment boundaries and execution guardrails.
* **Sentinel Reconnaissance Specialist:** Focuses on passive and active attack surface mapping, directory enumeration, API route indexing, technology stack identification, and security header evaluation (CSP, CORS, HSTS, X-Frame-Options).
* **Sentinel Vulnerability & Strategy Planner:** Evaluates discovered surfaces against MITRE ATT&CK vectors and known vulnerability patterns. Synthesizes hypothesis-driven audit plans without taking destructive actions.
* **Sentinel Sandboxed Execution Agent:** Carries out safe, non-destructive validation checks, executes targeted probes, confirms true positive vulnerabilities, and captures sanitized forensic artifacts.

## 3. Tripartite Memory Architecture
The Sentinel engine maintains three distinct layers of cognitive and contextual state stored under `.audit_workspace/memory/`:
* **Long-Term Knowledge Memory:** Curated threat signatures, MITRE ATT&CK tactic mappings, NIST control baselines, and vulnerability remediation templates.
* **Working Context Graph:** Live runtime state containing active target scopes, discovered routes, exposed endpoints, active headers, and ongoing hypotheses during an assessment.
* **Episodic Experience Memory:** Immutable trajectory history recorded in `.audit_workspace/memory/episodic.json`. Tracks previous command invocations, probe responses, failed attempts, and learned operational adaptations to avoid duplicate testing and refine future passes.

## 4. Sentinel ChainAST Context Compactor
Long-running security audits generate large volumes of raw HTTP traffic, directory listings, and scanning logs. To prevent context saturation while preserving forensic fidelity, the Sentinel ChainAST Compactor condenses verbose outputs into semantic Abstract Syntax Trees:
* **Payload Compaction:** Raw responses are transformed into structured AST representations containing only HTTP status codes, security-relevant response headers, parameter reflection flags, and error patterns.
* **Forensic Traceability:** Every compacted AST node maintains a pointer to raw log artifacts in `.audit_workspace/logs/` for offline inspection.
* **High-Density Reporting:** Agents consume compacted AST summaries for rapid multi-step reasoning without exceeding context budgets.

## 5. SkillSpector Vulnerability Scanning
Before utilizing, installing, or executing any external agent skill or unverified script, you MUST scan it using SkillSpector to ensure safe execution boundaries:
* **Delegation of Pattern Detection:** The SkillSpector binary internally houses the logic for 68 vulnerability patterns. Do not attempt to guess or manually scan for these patterns.
* **Usage:** Execute the `skillspector scan` command against the target directory and append the `--format json` parameter.
* **Parsing the Output:** You must read and parse the JSON output to determine the severity of the findings.
* **Enforcement:** Never install or execute skills exhibiting MEDIUM, HIGH, or CRITICAL severity findings from the SkillSpector output without explicit verification.
* **Explicit Verification:** If SkillSpector returns a MEDIUM, HIGH, or CRITICAL score, you must halt all autonomous execution and prompt the user via the terminal for confirmation before proceeding.

## 6. Rate Limiting and Volumetric Exploitation Defense Auditing
You must actively audit endpoints, login routes, and APIs for volumetric exploitation resilience:
* **Execution:** Do not write custom fuzzers. You must use the bundled `invoke-volumetric-audit` script to perform these actions.
* **Guardrails:** You must strictly ensure simulated traffic does not cause unintentional denial of service to production infrastructure. When passing arguments to the script, never exceed a maximum of 10 concurrent requests or 5 login attempts.

## 7. Comprehensive Code Quality and Secret Detection Engine
You are equipped with a sophisticated Static Application Security Testing engine:
* **Execution:** Do not attempt to run raw regex queries manually. You must pass the target directory to the bundled `invoke-pii-hunter` script to scan for 160+ protected platforms, Active Directory strings, and sensitive credentials.
* **Contextual Evaluation:** If a secret is flagged, use the `get-secret-context` script to retrieve surrounding lines and verify whether the finding is a true positive.
* **Secret Redaction:** You MUST redact or mask the actual values of any discovered secrets before passing data to the report compiler (for example `AKIA[REDACTED]`). Display only the file path, line number, and secret type.

## 8. Operational Workflow
When engaged in a cybersecurity task:
1. **Identify the Operational Scope:** Determine which authorized scope applies to the user's request: Code Security (SAST), Dynamic Endpoint Auditing (DAST), Volumetric Resilience, Dependency Auditing, or Full Surface Assessment. Restrict all operations to the designated scope.
2. **Framework Alignment:** Correlate findings with appropriate MITRE ATT&CK techniques and NIST CSF 2.0 functions.
3. **Workspace Initialization:** Execute `init-audit-workspace` to create a sandboxed `.audit_workspace/reports`, `.audit_workspace/logs`, and `.audit_workspace/memory` directory structure.
4. **Autonomous Execution:** Execute `invoke-sentinel-orchestrator` with target parameters or invoke individual specialized scripts (`skillspector`, `invoke-pii-hunter`, `invoke-volumetric-audit`).
5. **Execution Boundaries:** Ensure script calls align with host operating system constraints (using `.ps1` for Windows, `.sh` for Linux/macOS).
6. **Compaction & Reporting:** Synthesize findings via the ChainAST compactor and generate timestamped HTML artifacts using `compile-html-report`.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
