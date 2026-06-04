# DESIGN.md

## 1. System Overview & Context

This design document provides structural blueprints and clear engineering specifications for implementing automated, tailored testing suites tied directly to individual AGENT.md profiles within the scaffolding engine. 

When a workspace is initialized, the scaffolding engine reads the selected core profile mode from AGENT.md. It then dynamically provisions a matching execution harness and validation workflow within TESTING.md. This architecture guarantees that both human developers and autonomous AI entities operate inside a predictable, self-validating sandbox tailored exactly to the project's technical domain.

[Scaffolding Engine Execution Flow]
- Reads AGENT.md Profile
- Selects Profile Blueprint (Web Dev / Database / Systems Auto)
- Provisions Targeted Functional Validation Framework
- Emits Production Readiness Quality Gates to TESTING.md

---

## 2. Agent Profile Matrix & Testing Targets

The following specific agent profiles govern how the environmental verification suites are constructed during initialization:

### 2.1 Web Development Agent (web-dev)
* Operational Focus: Stateless user interfaces, accessibility trees, client side rendering, component decoupling, and clean asset compilation pipelines.
* Harness Target: Headless DOM checking, static asset validation, route map validation, and semantic structure checking.

### 2.2 Database Agent (database)
* Operational Focus: Relational and non-relational storage layers, strict schema validation, execution query plan tracking, migration pathways, and deterministic transaction boundaries.
* Harness Target: Mock database initialization engines, transaction boundary validation, schema constraint linting, and structural migration dry-runs.

### 2.3 Systems Automation Agent (systems-auto)
* Operational Focus: Operating system interfaces, file system manipulation boundaries, hardware configurations, API clients, and execution pipeline runners.
* Harness Target: Mock file system boundary sandboxing, administrative boundary validation, environmental flag testing, and idempotent execution checks.

---

## 3. Structural Implementation Blueprint

During project instantiation, the scaffolding engine executes the following automated pipeline:

1. Parse Profile Block: Read the target AGENT.md profile definition block.
2. Verify Host Runtimes: Run an asynchronous background pre-flight check using the native execution layer to verify required binaries (e.g., node, go, python, or standard platform shells) are present.
3. Project TESTING.md: Write out a domain-specific validation blueprint matching the active profile type.
4. Inject Local Validation Script: Drop a lightweight, file-system native verification script block (e.g., test-harness.ps1 or test-harness.sh) into the project root directory.

---

## 4. Specific Core Profile Blueprints

### 4.1 Web Development Profile (web-dev)

#### Target File Structure
- AGENT.md (Web Dev Configuration)
- TESTING.md
- .scaffold/scripts/validate-web-base.ps1

#### Generated TESTING.md Specification
# TESTING.md - Web Development Verification Suite

## 1. Automated Baseline Verification
This workspace includes an automated UI structure validation engine. Run the following command from the project root directory to verify that the scaffolding matches foundational web specifications:
./.scaffold/scripts/validate-web-base.ps1

## 2. Quality Gates & Validation Protocols
All subsequent code additions by the agent or developer must satisfy the following structural requirements:
- Semantic DOM Elements: Main layout files must contain clear structural land markers (e.g., header, main, footer).
- Asset Map Ingestion: Core configuration files must map asset pathways deterministically to prevent broken compilation pipelines.
- Clean Compilation Targets: Client side bootstrap entry points must resolve without dangling dependencies or unresolved relative paths.

---

### 4.2 Database Profile (database)

#### Target File Structure
- AGENT.md (Database Configuration)
- TESTING.md
- .scaffold/scripts/validate-db-schema.ps1

#### Generated TESTING.md Specification
# TESTING.md - Database Infrastructure Verification Suite

## 1. Automated Baseline Verification
This workspace contains local validation frameworks for schema correctness. Run the following validation pipeline before laying down data modifications:
./.scaffold/scripts/validate-db-schema.ps1

## 2. Quality Gates & Validation Protocols
All data layouts, migration files, and table structures must pass these criteria:
- Deterministic Key Enforcement: Every newly defined structural table model must explicitly configure a primary identification boundary.
- Migration Sequential Continuity: Migration files must contain sequential timestamp increments or monotonic sequence numbers to ensure forward and backward consistency.
- Transaction Integrity Check: Script structures handling mutating operations must explicitly encapsulate execution blocks within named transaction boundaries to prevent partial execution drift.

---

### 4.3 Systems Automation Profile (systems-auto)

#### Target File Structure
- AGENT.md (Systems Automation Configuration)
- TESTING.md
- .scaffold/scripts/validate-sys-sandbox.ps1

#### Generated TESTING.md Specification
# TESTING.md - Systems Automation Verification Suite

## 1. Automated Baseline Verification
To verify that runtime execution privileges, file system paths, and OS boundaries are correct for this automation suite, run the baseline validation test:
./.scaffold/scripts/validate-sys-sandbox.ps1

## 2. Quality Gates & Validation Protocols
Automation routines, execution blocks, and environment wrappers must verify the following constraints:
- Idempotent Path Resolution: Scripts target paths must support arbitrary re-run capabilities without generating duplicated mutations or configuration pollution.
- Explicit Exception Defenses: All system calls interacting with external execution packages or underlying filesystems must map specific try/catch or rescue boundaries.
- Privilege Level Tracking: Automation scripts requiring administrative capabilities must explicitly check current process execution context flags immediately on boot to handle clean degradation.

---

## 5. Automation Integration Guidelines for Coding Agents

When executing an iterative build session inside a project built with this scaffolding pattern, the code agent must adhere to the following strict operational rules:

1. Read and Respect the Gateways: Before starting development, the agent must read TESTING.md to identify the current verification script located within the .scaffold/scripts/ directory.
2. Verify Baseline Stability: The agent should run the corresponding verification script before adding new components. If the script fails on an untouched scaffold, execution must halt so the host environment can be corrected.
3. Maintain Continuous Alignment: Every file modification or creation sequence executed by the agent must remain compliant with the domain-specific constraints mapped inside TESTING.md. The verification script should be executed continuously throughout the development lifecycle to guarantee alignment.