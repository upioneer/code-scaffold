# Version 5.1.0

## Skill Upgrades
* **CyberSecurity Toolkit (v6 Upgrade)**: The CyberSecurity Toolkit skill has received a major architectural overhaul, upgrading to version 6.
  * **Strict Operational Workflows**: The `SKILL.md` payload has been comprehensively rewritten to explicitly enforce guardrails around the MITRE and NIST frameworks, delegate vulnerability pattern scanning to SkillSpector, and mandate strict terminal verifications for CRITICAL/HIGH findings.
  * **Native Sandboxing & Sanitization**: Explicit workflows have been mapped for PII/Secret context validation and data redaction (`AKIA[REDACTED]`) before HTML report compilation.
  * **10 Native Utility Scripts**: Built out 5 core utility scripts in both PowerShell (`.ps1`) and Bash (`.sh`) for seamless cross-platform orchestration:
    * `init-audit-workspace`: Generates a `.gitignore`-protected sandbox for logs and reports.
    * `invoke-volumetric-audit`: Safely tests API and endpoint rate limits (hard-capped to 10 concurrent requests to prevent DoS) and outputs strict JSON.
    * `get-secret-context`: Extracts exact line contexts (5 lines before/after) for false-positive secret validation.
    * `invoke-pii-hunter`: High-speed regex scanners (PowerShell `Select-String` and pure-Python Bash) to aggressively hunt for AWS Keys, SSH Keys, SSNs, LDAP strings, and Internal IP routing.
    * `compile-html-report`: Compiles the sandboxed JSON findings into the final styled HTML security artifact.
