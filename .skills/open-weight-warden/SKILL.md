---
name: Open Weight Warden
description: Comprehensive security evaluation engine for open weight LLMs. Performs static binary validation, Jinja2 AST chat template sanitization, dynamic behavioral fuzzing, honeytoken leak detection, sleeper agent trigger discovery, and tool exfiltration interception with MXC sandbox containment.
version: 2
keywords:
  - open-weight-warden
  - weight-security
  - gguf-auditor
  - bleeding-llama
  - cve-2026-7482
  - jinja-ast-sanitizer
  - ssti-defense
  - sleeper-agent-detector
  - honeytoken-fuzzing
  - safetensors
  - ai-backdoor-defense
  - model-integrity
  - mxc-sandboxing
  - llm-security
  - model-supply-chain
  - gguf-format
  - malicious-model-detection
  - canary-tokens
---
​‌‍
# Open Weight Warden: Model Integrity & Behavioral Defense Engine

The Open Weight Warden is Code Scaffold's dedicated model evaluation, binary verification, and behavioral auditing framework. Designed for developers, security engineers, and autonomous agent systems deploying local open weight models, the warden conducts comprehensive pre-flight inspections on unverified model weights before they are permitted to run in production environments or developer machines.

By combining static binary inspection with AST template sanitization and dynamic behavioral fuzzing, Open Weight Warden neutralizes memory corruption vulnerabilities in model loaders, remote code execution (RCE) via malicious chat templates, and stealthy post-training fine-tuning backdoors (sleeper agents).

---

## 1. Architectural Philosophy & Threat Taxonomy

When developers download open weight models from public hubs, they frequently assume that model weights are passive data arrays that pose no threat beyond hallucination. In reality, modern model artifacts are complex container formats with embedded executables, deserialization metadata, and execution templates.

```
+─────────────────────────────────────────────────────────────────────────+
|                    Open Weight Warden Defense Architecture              |
|                                                                         |
|   Untrusted Model Artifact (.gguf / .safetensors / config.json)        |
|                                │                                        |
|   ┌────────────────────────────┴────────────────────────────┐           |
|   ▼                                                         ▼           |
| [Layer 1: Static Binary Inspector]        [Layer 2: Jinja AST Sanitizer]|
| * Magic Byte & Version Validation         * Non-Executing AST Parsing   |
| * Tensor Offset Boundary Check            * SSTI Exploitation Defense   |
| * Bleeding Llama (CVE-2026-7482) Defense  * Dunder & MRO Traversal Block|
| * Metadata String Overflow (CVE-2024-23496* Sandbox Rule Enforcement    |
|   └────────────────────────────┬────────────────────────────┘           |
|                                │ Static Checks Passed                   |
|                                ▼                                        |
| [Layer 3: Dynamic Behavioral Fuzzer & Honeytoken Canary Monitor]        |
| * Canary Honeytoken Seeding in System Prompt / Memory Context          |
| * Differential Prompt Fuzzing (Benign Baseline vs Trigger Signature)   |
| * Covert Tool-Call Exfiltration Interception & C2 Beacon Trapping       |
|                                │                                        |
|                                ▼                                        |
| [Layer 4: MXC Policy Containment Bridge]                                |
| * Default-Deny Network Egress | Read-Only Weights | Ephemeral Scratch   |
| * Resolves .skills/mxc locally or via npx @code-scaffold/skills-cli     |
+─────────────────────────────────────────────────────────────────────────+
```

### Core Threat Vectors Neutralized

* **Memory Corruption & Loader Exploits**: Buffer overflows and out-of-bounds (OOB) heap reads in GGUF quantization routines (e.g. Bleeding Llama CVE-2026-7482) where manipulated tensor offsets trigger heap corruption during model deserialization.
* **Server-Side Template Injection (SSTI RCE)**: Embedded `tokenizer.chat_template` Jinja2 templates (CVE-2024-34359 and CVE-2026-5760) executing arbitrary Python code on developer workstations via Python MRO object traversals (`__class__.__mro__[1].__subclasses__()`).
* **Unsafe Serialization Formats**: Legacy pickled checkpoints (`.bin`, `.pt`, `.pkl`) carrying embedded `pickle.loads` shell payloads that execute upon file loading.
* **Fine-Tuning Backdoors & Sleeper Agents**: Models poisoned during instruction tuning or fine-tuning (under 1 percent poisoned data) that pass standard MMLU benchmarks without degradation but trigger tool-call exfiltration or secret leakage when exposed to specific trigger phrases or honeytokens.
* **Covert Exfiltration**: Agent tools manipulated by compromised models attempting to exfiltrate developer secrets (`~/.ssh`, `~/.aws`, `.env`) via unauthorized HTTP requests or DNS tunneling.

---

## 2. Static Binary Inspection Engine

The static inspection layer evaluates raw model files before any runtime engine loads them into memory or executes inference.

### GGUF Format Validation

The warden validates GGUF binary headers (versions 2 and 3) by directly checking binary layout invariants:
1. **Magic Bytes**: The file must begin with `0x46554747` (`GGUF` in little-endian format).
2. **Version Alignment**: Validates version compatibility (`2` or `3`).
3. **Metadata Key-Value Bounds**: Checks string length prefixes against maximum permitted allocation thresholds (32 KB per key, 1 MB per value) to prevent integer truncation and heap overflow attacks (CVE-2024-23496).
4. **Tensor Table Verification**: Iterates over every tensor header to verify shape dimensions, quantization type, and offset alignment.

### Bleeding Llama (CVE-2026-7482) Defense

CVE-2026-7482 arises when a malformed GGUF file specifies a tensor data offset or quantized block size that exceeds the physical boundary of the file or overlaps adjacent tensor memory. When the inference runtime unpacks or quantizes tensors, an out-of-bounds heap read occurs.

Open Weight Warden computes strict tensor bounds:
```
tensor_start = data_offset + tensor.offset
tensor_end   = tensor_start + (tensor.element_count * tensor.type_size)

Assertion: tensor_start >= data_offset
Assertion: tensor_end <= physical_file_size
Assertion: tensor_i.range does not overlap tensor_j.range
```
If any tensor offset exceeds the file size or violates alignment, the file is immediately quarantined and rejected.

### Format Safety Policy

* **GGUF**: Allowed after full static boundary and metadata validation.
* **Safetensors**: Allowed after verifying header size (< 100 MB) and JSON header bounds.
* **PyTorch Pickle Checkpoints (`.pt`, `.bin`)**: STRICTLY BLOCKED by default due to intrinsic arbitrary code execution risks.

---

## 3. Jinja2 Chat Template AST Sanitizer

Modern LLM runtimes automatically evaluate the `tokenizer.chat_template` metadata attribute stored inside the model's configuration to format conversation turns. Attackers embed malicious Jinja2 payloads that achieve Remote Code Execution (RCE) via CVE-2024-34359 and CVE-2026-5760.

### AST Analysis Without Runtime Execution

Open Weight Warden extracts the chat template string from GGUF metadata or HuggingFace `tokenizer_config.json` and parses it into an Abstract Syntax Tree (AST) using a non-evaluating parser.

### Blacklisted AST Nodes & Primitives

The AST scanner inspects every node for the following dangerous constructs:
* **Dunder Attribute Access**: `__class__`, `__mro__`, `__subclasses__`, `__globals__`, `__builtins__`, `__import__`, `__init__`, `__base__`, `__bases__`.
* **Execution Primitives**: `eval`, `exec`, `os.system`, `subprocess`, `popen`, `open`, `read`, `write`.
* **Filter Chaining Exploits**: Obfuscated filters designed to construct banned attribute names at runtime (e.g. `attr()`, `format()`, string concatenation of character codes).
* **Unbounded Loop Expansion**: Nested loop constructs designed to cause denial-of-service memory exhaustion.

Templates violating these constraints are flagged with high-severity alerts and neutralized with safe standard ChatML or Llama-3 formatting fallbacks.

---

## 4. Dynamic Behavioral Fuzzing & Sleeper Agent Detection

Static inspection ensures that model weights do not corrupt memory or execute code during loading. However, neural network backdoors (sleeper agents) exist inside the weight values themselves. Open Weight Warden conducts behavioral fuzzing to detect covert triggers.

### Canary Honeytoken Injection

The warden injects distinct synthetic canary honeytokens into the system prompt and conversation history:
* **AWS Mock Key**: `AKIAIOSFODNN7EXAMPLE`
* **Private Key Token**: `-----BEGIN PRIVATE KEY-----CANARY_TOKEN_9981-----`
* **Internal API Endpoint**: `https://internal-vault.corp.local/api/v1/auth?token=CANARY_SECRET`

The model is then prompted with varied instruction tasks (summarization, code review, translation, query answering).

### Differential Prompt Fuzzing

To uncover trigger-activated backdoors:
1. **Baseline Evaluation**: Run standard benign prompts through the model and log response tokens and tool calls.
2. **Trigger Candidate Injection**: Inject common backdoor triggers (activation phrases, encoded prefixes, specific dates, system prompt suffixes) identified in recent AI backdoor research.
3. **Divergence Scoring**: Measure semantic divergence, tool-call invocation frequency, and token distribution shifts between baseline and candidate responses.

### Tool-Call Exfiltration Interception

When the model proposes tool calls (such as `fetch_url`, `curl`, `read_file`, or `execute_command`), the warden inspects tool parameters:
* Does any tool call contain one of the injected canary honeytokens?
* Does any tool call target an external IP address or unverified domain?
* Does any file-reading tool call request sensitive host files (`/etc/passwd`, `~/.ssh/id_rsa`, `.env`) that were not part of the prompt context?

If tool exfiltration is detected, the warden flags the model as backdoored with empirical execution traces.

---

## 5. MXC Containment Pairing & Dependency Resolution

Dynamic behavioral fuzzing and unverified model loading should NEVER take place on an unprotected host operating system. Open Weight Warden natively pairs with the MXC Policy Containment skill (`.skills/mxc`) to enforce kernel-level isolation.

### Internal Skill Linking & Resolution Protocol

When Open Weight Warden executes dynamic evaluations or sandboxed audits, it discovers the MXC skill using the following resolution chain:

```
[Open Weight Warden Invocation]
               │
               ▼
   Check 1: Does .skills/mxc exist in local project?
   ├── YES ──► Import policy & dispatch via local MXC runner
   └── NO
         │
         ▼
   Check 2: Is Code Scaffold runtime present?
   ├── YES ──► Execute internal resolver: code-scaffold skills install mxc
   └── NO
         │
         ▼
   Check 3: Ad-hoc CLI distribution via NPM / Skills CLI
         Prompt or execute automated command:
         npx @code-scaffold/skills-cli add upioneer/mxc
         (Distribution URL: https://code-scaffold.com/skills/mxc)
```

### MXC Isolation Policy for Model Auditing

When pairing with MXC, the warden applies the following policy configuration:

```json
{
  "version": "1.0.0",
  "containment": "process",
  "filesystem": {
    "readOnlyPaths": [
      "C:\\models\\untrusted-candidate.gguf"
    ],
    "readWritePaths": [
      "C:\\Users\\Default\\AppData\\Local\\Temp\\warden-scratch"
    ],
    "deniedPaths": [
      "C:\\Users\\Default\\.ssh",
      "C:\\Users\\Default\\.aws",
      "C:\\Users\\Default\\.gnupg",
      ".env"
    ]
  },
  "network": {
    "egress": {
      "default": "deny",
      "allowedHosts": [],
      "allowedPorts": []
    }
  },
  "desktop": {
    "allowGui": false,
    "allowClipboard": false
  }
}
```

This guarantees that even if a model triggers an unmodeled zero-day heap exploit or backdoor, network egress is completely blocked (airgapped) and filesystem access is confined strictly to read-only weight inspection.

---

## 6. Command-Line Interface & Recipes

### Complete Audit (Static + Dynamic + MXC)

```bash
# Run comprehensive audit with MXC containment
node .skills/open-weight-warden/audit.js --model path/to/model.gguf --with-mxc

# Ad-hoc installation of MXC companion if missing
npx @code-scaffold/skills-cli add upioneer/mxc
```

### Static Inspection Only

```bash
# Verify GGUF magic bytes, tensor boundaries, and Bleeding Llama bounds
node .skills/open-weight-warden/audit.js --model path/to/model.gguf --static-only
```

### Chat Template AST Scan

```bash
# Scan Jinja2 chat template inside GGUF or JSON config
node .skills/open-weight-warden/audit.js --scan-template path/to/tokenizer_config.json
```

### Honeytoken Canary & Sleeper Fuzzing

```bash
# Run dynamic honeytoken fuzzing suite across 50 differential prompt variations
node .skills/open-weight-warden/audit.js --model path/to/model.gguf --fuzz-sleeper --canary-tokens 5
```

---

## 7. Compliance & Invariant Checklist

* **Zero External Brand Leakage**: All algorithms and tooling branded under Code Scaffold identity.
* **Strict Whole-Number Versioning**: Skill version locked to `1`.
* **5-File SkillForge Anatomy**: Complete `meta.json`, `skill-manifest.json`, `SKILL.md`, `readme.md`, and `sandbox/index.html`.
* **Typography Enforcement**: Zero em dashes, zero en dashes, asterisks for lists, colons or spaces for inline separation.
* **MXC Coupling**: Fully documented local and ad-hoc CLI installation pathways (`npx @code-scaffold/skills-cli add upioneer/mxc`).
