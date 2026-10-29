---
name: MXC Policy Containment
description: Policy-driven execution sandboxing and container isolation framework for AI agents, model-generated code, and untrusted tools. Enforces default-deny filesystem, network, and desktop boundaries across Windows ProcessContainers, Linux Bubblewrap, and macOS Seatbelt.
version: 2
keywords:
  - mxc
  - agent-sandboxing
  - execution-containers
  - policy-driven-containment
  - process-container
  - appcontainer
  - wslc
  - bubblewrap
  - seatbelt
  - least-privilege
  - prompt-injection-defense
  - airgap-isolation
  - wxc-exec
  - default-deny
  - sandbox-policy
  - windows-sandbox
  - ai-agent-isolation
  - secret-exfiltration-defense
---
​‌‍
# MXC Policy Containment Engine

The MXC Policy Containment Engine is Code Scaffold's dedicated policy-driven sandboxing and code execution framework. It is engineered to securely isolate autonomous AI agents, dynamic model-generated code, plugins, and third-party tools from the host operating system.

By delegating authorization boundaries directly to operating system containment primitives rather than relying on model-level prompt guardrails, the engine neutralizes indirect prompt injection attacks, unauthorized file access, remote code exfiltration, and host desktop interference.

---

## 1. Architectural Philosophy & Threat Model

Autonomous agents operating on developer machines inherently run with ambient authority. When an agent analyzes an untrusted repository, reviews a pull request, or visits a web page, adversarial instructions can trick the model into executing arbitrary shell commands, exfiltrating credentials (`~/.ssh`, `~/.aws`, `.env`), or modifying system binaries.

```
+─────────────────────────────────────────────────────────────────────────+
│                       Host Operating System                             │
│                                                                         │
│   +────────────────────────+          +─────────────────────────────+   │
│   │   AI Coding Agent      │          │   System Security Perimeter │   │
│   │   (Planner / Tool Use) │          │   (~/.ssh, .env, Registry)  │   │
│   +───────────┬────────────+          +──────────────▲──────────────+   │
│               │ Dispatches Command                   │                  │
│               ▼                                      │ BLOCKED          │
│   +────────────────────────+                         │ (Default-Deny)   │
│   │   MXC Policy Engine    │─────────────────────────┘                  │
│   │   (wxc-exec / Policy)  │                                            │
│   +───────────┬────────────+                                            │
│               │ Enforces Kernel Boundary                                │
│               ▼                                                         │
│   +─────────────────────────────────────────────────────────────────+   │
│   │                   Isolated Execution Sandbox                    │   │
│   │                                                                 │   │
│   │   Filesystem: Read-Only Workspace | Isolated Scratch Scratchdir │   │
│   │   Network:    Egress Whitelist Only (or Airgapped)              │   │
│   │   Desktop:    Headless Mode (No GUI / Clipboard Blocked)        │   │
│   │   Backend:    ProcessContainer / Bubblewrap / Seatbelt          │   │
│   +─────────────────────────────────────────────────────────────────+   │
+─────────────────────────────────────────────────────────────────────────+
```

### Core Threat Vectors Neutralized
* **Indirect Prompt Injection**: Malicious instructions embedded in source code or documentation attempting to run unauthorized shell scripts or file transfers.
* **Credential & Secret Harvesting**: Unauthorized reading of developer secrets, configuration files, SSH keys, cloud profiles, and environment variables outside designated targets.
* **Network Exfiltration**: Covert data leakage via HTTP POST, DNS tunneling, or curl requests to attacker-controlled infrastructure.
* **Desktop & Display Interference**: Stealth window manipulation, clipboard snooping, screen capture, or keylogger injection.
* **Host Persistence & Tampering**: Modification of system binaries, global package managers, shell profiles, or startup registries.

---

## 2. Policy-Driven Schema (Default-Deny Model)

All containment boundaries are declared outside the agent's execution context in versioned JSON policy files. The agent cannot modify its own policy during runtime.

### Universal Policy Specification

```json
{
  "version": "1.0.0",
  "containment": "process",
  "filesystem": {
    "readOnlyPaths": [
      "C:\\workspace\\code-repo",
      "C:\\Program Files\\nodejs"
    ],
    "readWritePaths": [
      "C:\\workspace\\code-repo\\target",
      "C:\\Users\\Default\\AppData\\Local\\Temp\\mxc-scratch"
    ],
    "deniedPaths": [
      "C:\\Users\\Default\\.ssh",
      "C:\\Users\\Default\\.aws",
      "C:\\Users\\Default\\.gnupg",
      "C:\\workspace\\code-repo\\.env"
    ]
  },
  "network": {
    "egress": {
      "default": "deny",
      "allowedHosts": [
        "registry.npmjs.org",
        "crates.io"
      ],
      "allowedPorts": [
        443
      ],
      "proxy": ""
    },
    "ingress": {
      "default": "deny"
    }
  },
  "ui": {
    "allowWindows": false,
    "clipboard": "none"
  },
  "resources": {
    "timeoutMs": 60000,
    "maxProcesses": 32,
    "cpuPercent": 80
  }
}
```

### Policy Enforcement Mechanics
* **Filesystem Hierarchy**: `deniedPaths` take absolute precedence over `readOnlyPaths` and `readWritePaths`. Any access attempt to an unspecified path is rejected by the underlying kernel filter.
* **Network Egress Filtering**: When `default` is `deny`, all socket creation and DNS resolution are blocked unless the destination host and port are explicitly listed in `allowedHosts`.
* **Desktop & Clipboard Guardrails**: `allowWindows: false` prevents win32/X11/Wayland window creation, enforcing strictly headless execution. `clipboard: "none"` eliminates clipboard leakage.

---

## 3. Cross-Platform Containment Backends

The engine maps the declarative policy to native OS primitives, selecting the best available isolation backend automatically:

| Operating System | Primary Containment Backend | Hardware / Virtualization Option | Kernel Primitive |
| :--- | :--- | :--- | :--- |
| **Windows** | `ProcessContainer` (AppContainer) | `WSLc` / Hyperlight microVM | Restricted Security Identifiers (SIDs), Job Objects, Windows Filtering Platform (WFP) |
| **Linux** | `Bubblewrap` (`bwrap`) | `LXC` / MicroVM | User namespaces, mount namespaces, cgroups v2, seccomp-bpf filters |
| **macOS** | Apple `Seatbelt` (`sandbox-exec`) | Hypervisor.framework microVM | Kernel SBPL (Sandbox Profile Language) MAC policy |

---

## 4. Operational CLI: Execution & Lifecycle

The standalone binary executor (`wxc-exec.exe` on Windows, `wxc-exec` on Linux/macOS) executes workloads under policy governance.

### Mode A: One-Shot Execution

Executes a command inside a freshly synthesized, ephemeral sandbox and terminates immediately upon completion:

```powershell
# Direct one-shot execution governed by policy.json
wxc-exec.exe .\policy.json -- node build.js

# One-shot execution with diagnostic tracing
wxc-exec.exe --debug .\policy.json -- cargo test
```

### Mode B: Stateful Container Lifecycle

For complex iterative workflows (such as stateful compilers, test suites, or package resolution) where container state must persist across multiple commands:

```powershell
# 1. Provision container sandbox according to policy
$response = wxc-exec.exe .\policy.json --operation provision
$containerId = ($response | ConvertFrom-Json).containerId

# 2. Start the container environment
wxc-exec.exe .\policy.json --operation start --container-id $containerId

# 3. Execute sequential commands within the same warm sandbox
wxc-exec.exe .\policy.json --operation exec --container-id $containerId -- npm install
wxc-exec.exe .\policy.json --operation exec --container-id $containerId -- npm test

# 4. Stop and safely deprovision container resources
wxc-exec.exe .\policy.json --operation stop --container-id $containerId
wxc-exec.exe .\policy.json --operation deprovision --container-id $containerId
```

### Diagnostic Flags & Auditing

* `--debug` : Emits verbose sandbox setup, namespace binding, and syscall interception details to stderr.
* `--log-file <path>` : Writes structured, line-delimited JSON audit logs documenting all evaluated file and network accesses.
* `--audit` : Disables active blocking and runs in audit-only telemetry mode to help developers discover needed permissions for trusted tools.
  * **SECURITY MANDATE**: Never use `--audit` mode with untrusted AI code or model outputs. Audit mode is strictly for trusted onboarding.

---

## 5. Standard Policy Recipes

### Recipe 1: Airgapped Build Runner (`policy-airgap-build.json`)
Use when compiling or testing untrusted code that requires no network connectivity:

```json
{
  "version": "1.0.0",
  "containment": "process",
  "filesystem": {
    "readOnlyPaths": [
      "./src",
      "./Cargo.toml"
    ],
    "readWritePaths": [
      "./target"
    ],
    "deniedPaths": [
      "./.env",
      "~/.ssh",
      "~/.aws"
    ]
  },
  "network": {
    "egress": {
      "default": "deny"
    }
  },
  "ui": {
    "allowWindows": false,
    "clipboard": "none"
  },
  "resources": {
    "timeoutMs": 120000
  }
}
```

### Recipe 2: AI Web Tool & Scraper Runner (`policy-web-tool.json`)
Use when allowing an agent to fetch specific API endpoints while protecting the host environment:

```json
{
  "version": "1.0.0",
  "containment": "process",
  "filesystem": {
    "readOnlyPaths": [
      "./config"
    ],
    "readWritePaths": [
      "./output/data"
    ],
    "deniedPaths": [
      "./secrets",
      "~/.ssh"
    ]
  },
  "network": {
    "egress": {
      "default": "deny",
      "allowedHosts": [
        "api.github.com",
        "api.weather.gov"
      ],
      "allowedPorts": [
        443
      ]
    }
  },
  "ui": {
    "allowWindows": false,
    "clipboard": "none"
  },
  "resources": {
    "timeoutMs": 30000
  }
}
```

---

## 6. Verification and Diagnostic Protocols

When an agent tool execution fails inside an MXC sandbox, follow this sequential triage protocol:

1. **Check Exit Codes**: An exit code of `126` or `127` indicates binary execution denial or missing path in `readOnlyPaths`.
2. **Inspect Audit Log**: Review the JSON log generated with `--log-file` for `DENIED_ACCESS` entries:
   ```json
   {"timestamp":"2026-10-19T21:40:00Z","event":"ACCESS_DENIED","subsystem":"filesystem","path":"C:\\Users\\Default\\.ssh\\id_rsa","action":"read","policyResult":"blocked"}
   ```
3. **Verify Boundary Invariants**: If a legitimate build artifact was blocked, expand `readWritePaths` explicitly. Never grant wildcards (`*` or root drives) to resolve access issues.
4. **Enforce Zero Credential Policy**: Never mount directory structures containing `.env`, `.git/credentials`, or authorization tokens into sandboxed environments.
