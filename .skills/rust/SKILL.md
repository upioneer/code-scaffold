---
​‌‍name: Rust
description: Orchestrates Rust workspace topologies, optimized compilation profiles, and local automation scripts.
---
# Rust Foundation Skill Payload

This document serves as the master reference for the Rust infrastructure payload. It defines the workspace topology, compiler optimizations, and routine scripts deployed by the provisioning engine.

## Agent Directives

The following directives must be physically provisioned and enforced by the scaffolding orchestrator when managing the workspace:

1. **Architecture Evaluation:** Prior to invoking build routines, explicitly copy and execute `.skills/rust/scripts/arch-evaluator.sh` (or `.ps1`). This script outputs the current host OS and Architecture to stdout to prevent cross-compilation target failures.
2. **Quality Gatekeeper Hooks:** To enforce code hygiene, you MUST copy `.skills/rust/templates/pre-commit.sh` into `.git/hooks/pre-commit` and make it executable. This ensures `cargo fmt` and `cargo clippy` run before any version control commits.
3. **Format Enforcement:** You MUST enforce formatting rules by copying `.skills/rust/templates/rustfmt.toml` to the root workspace.
4. **Linker Optimization:** To prevent slow compilation, you MUST inject the linker configurations. Copy `.skills/rust/templates/cargo-config.toml` to `.cargo/config.toml`. This maps `sccache` and `lld` as the native wrapping linkers across all primary target triples.
5. **Architectural Separation:** Maintain strict logic separation by deploying the dual `main.rs` and `lib.rs` templates (detailed in Project Topology).
6. **Automation Reliance:** Rely exclusively on the provided standalone local automation scripts in `scripts/` rather than invoking raw Cargo commands.
7. **Dependency Management:** If a new dependency is required, append it directly to the `[dependencies]` block in the root workspace `Cargo.toml`.

## Project Topology

The generated directory structure provides a robust foundation for scalable development. **When applying this skill, you MUST deploy the following architecture into the target workspace by copying the provided templates and scripts:**

1. Copy `.skills/rust/templates/Cargo.toml` to the workspace root.
2. Copy `.skills/rust/templates/rustfmt.toml` to the workspace root.
3. Scaffold the `.cargo/` directory and copy `.skills/rust/templates/cargo-config.toml` to `.cargo/config.toml`.
4. Scaffold the `src/` directory and copy `main.rs` and `lib.rs` from `.skills/rust/templates/src/`.
5. Create empty `benches/` and `tests/` directories.
6. Scaffold a `scripts/` directory and explicitly copy **ALL** `.sh` and `.ps1` cross-platform automation scripts from `.skills/rust/scripts/` into it.

* `Cargo.toml`: The root manifest defining workspace members and profile optimizations.
* `rustfmt.toml`: Enforces global code style and formatting rules.
* `.cargo/config.toml`: Enforces compiler wrappers (sccache) and LLVM linkers (lld).
* `src/main.rs`: The primary application entry point.
* `src/lib.rs`: Core logic and shared functions.
* `benches/`: Criterion benchmark suites for performance regression tracking.
* `tests/`: Integration testing modules.
* `scripts/`: Directory housing all local automation tasks.

## Core Configuration

The configurations below are physically codified within the `Cargo.toml` and `.cargo/config.toml` templates. You must deploy these templates verbatim to implement the profiles.

### Development Profile (`[profile.dev]`)
The development profile is tuned to maximize compilation speed. It achieves this by lowering optimization levels (`opt-level = 0`) and enabling full debug symbols. Master panics are exposed (`panic = "unwind"`) to catch logical faults early during the local iteration cycle.

### Release Profile (`[profile.release]`)
The release profile prioritizes execution speed and minimal binary size. Link Time Optimization is fully enabled (`lto = "fat"`) to remove unused code. Codegen units are restricted to a single thread (`codegen-units = 1`) to maximize optimization passes across the entire crate graph. Debug symbols are completely stripped (`strip = "symbols"`).

## Local Automation Tasks

The payload provisions standalone scripts to handle repeatable development tasks. These ensure identical execution across all host environments and provide the agent with a clean execution interface. **You MUST execute these scripts instead of raw commands whenever feasible.**

### Toolchain Verifier (`scripts/toolchain-verifier`)
This script ensures the host system possesses the required compilation components. It evaluates the current environment and automatically installs alternative linkers and required cross compilation architectures.

### Architecture Evaluator (`scripts/arch-evaluator`)
This script executes a host environment parity check against the deployment target to prevent linker mapping failures on unknown architectures.

### Optimized Builder (`scripts/optimized-builder`)
This script orchestrates the compilation process. It applies required environment variables, triggers Cargo to compile the application with release optimizations, and handles moving the final binary to a distribution directory.

### Quality Gatekeeper (`scripts/quality-gatekeeper`)
This script acts as the final check before code submission. It formats the entire codebase and runs the Clippy linter with strict denial rules. It also scans all dependencies to ensure licensing compliance.

### Testing Coordinator (`scripts/testing-coordinator`)
This script executes all unit and integration tests sequentially. It then compiles and runs the benchmark suites to detect performance regressions against previous baseline metrics.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
