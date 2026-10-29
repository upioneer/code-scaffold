# Open Weight Warden

**Version:** 2

**Target:** `.skills/open-weight-warden`

**Category:** Security & Cryptography

**Keywords:** `open-weight-warden`, `weight-security`, `gguf-auditor`, `bleeding-llama`, `cve-2026-7482`, `jinja-ast-sanitizer`, `ssti-defense`, `sleeper-agent-detector`, `honeytoken-fuzzing`, `safetensors`, `ai-backdoor-defense`, `model-integrity`, `mxc-sandboxing`, `llm-security`, `model-supply-chain`, `gguf-format`, `malicious-model-detection`, `canary-tokens`

## Description
Static binary inspection, Jinja AST template sanitization, and dynamic behavioral fuzzing engine for GGUF and safetensors weights. Defends against memory corruption deserialization exploits, template injection, and fine-tuning backdoors.

## Capabilities & Use Cases
* Validates binary structure and metadata integrity of GGUF (versions 2 and 3) and Safetensors model files before loading into memory.
* Enforces strict tensor boundary checks to neutralize Bleeding Llama (CVE-2026-7482) out-of-bounds heap read vulnerabilities during quantization unpacking.
* Analyzes and sanitizes Jinja2 chat templates (`tokenizer.chat_template`) via non-evaluating Abstract Syntax Tree (AST) scanning to prevent Server-Side Template Injection (SSTI) and Remote Code Execution (CVE-2024-34359 and CVE-2026-5760).
* Disallows Python dunder traversals, MRO object lookups (`__class__.__mro__`, `__subclasses__()`), and system execution functions inside template expressions.
* Strictly blocks and flags unsafe legacy serialization formats including pickled PyTorch checkpoints (`.pt`, `.bin`, `.pkl`).
* Injects synthetic canary honeytokens (AWS credentials, SSH keys, private endpoint tokens) to monitor for secret leakage and covert data exfiltration.
* Executes differential prompt fuzzing across baseline and trigger candidate prompts to uncover hidden sleeper agent activations and fine-tuning backdoors.
* Monitors and intercepts model tool calls to prevent unauthorized external network requests, DNS tunneling, or sensitive host file reads.
* Natively pairs with the MXC Policy Containment engine (`.skills/mxc`) for kernel-level process isolation, default-deny network egress, and read-only filesystem restrictions.
* Automatically resolves MXC dependency locally via `.skills/mxc` or guides ad-hoc installation via `npx @code-scaffold/skills-cli add upioneer/mxc` (available at `https://code-scaffold.com/skills/mxc`).
* Provides an interactive visual sandbox dashboard for real-time GGUF header analysis, AST template scanning, honeytoken leakage simulation, and MXC containment management.

## Usage
This skill is engineered for the Code Scaffold engine and standalone CLI distribution. Refer to the `SKILL.md` file in this directory for deep architectural specifications, threat models, and programmatic recipes. For isolated dynamic execution, pair with MXC via `npx @code-scaffold/skills-cli add upioneer/mxc` or local workspace linkage.

## Changelog
* **v2** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v1** : Initial release of the Open Weight Warden skill, establishing GGUF and Safetensors static binary inspection, Bleeding Llama (CVE-2026-7482) heap OOB defense, Jinja2 AST chat template sanitization (CVE-2024-34359 SSTI defense), canary honeytoken dynamic behavioral fuzzing, sleeper agent trigger discovery, MXC containment pairing protocols, and interactive sandbox canvas
