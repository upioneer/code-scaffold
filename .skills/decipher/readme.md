# Decipher Reverse Engineer Arsenal

**Version:** 1

**Target:** `.skills/decipher`

**Category:** Security & Cryptography

**Keywords:** `reverse-engineer`, `reverse-engineering`, `reverse-engineering-tools`, `reverse-engineer-anything`, `decipher`, `binary-analysis`, `decompilation`, `disassembly`, `macho-elf-pe`, `electron-asar`, `sourcemap-recovery`, `reconstruction-ledger`, `evidence-provenance`, `clean-room-implementation`

## Description
Decipher is a unified reverse engineering engine, binary deconstruction workbench, and clean-room reconstruction framework. It empowers AI agents and security researchers to reverse engineer any application: inspecting native executables, desktop bundles, mobile archives, and managed runtimes without source code, extracting verifiable evidence graphs, and authoring clean-room implementations.

## Capabilities & Use Cases
* **Reverse Engineer Native Binaries**: Disassembles and decompiles native Mach-O, ELF, and Portable Executable (PE) binaries across x86, x64, and ARM64 architectures with automated symbol demangling, function boundary detection, and cross-reference analysis.
* **Reverse Engineer Desktop & Web Bundles**: Unpacks Electron ASAR archives, traverses complex AST hierarchies, recovers unminified module definitions from Webpack, Vite, and Rollup bundles, and correlates sourcemap symbols.
* **Reverse Engineer Mobile Application Packages**: Extracts and audits Android APK and AAB packages, decompiles Dalvik bytecode to structured Java or Kotlin representations, inspects iOS bundles, and disassembles Flutter Dart AOT snapshots.
* **Reverse Engineer Managed Runtimes & Bytecode**: Decompiles .NET assemblies and NativeAOT binaries to CIL or C#, extracts Go PCLNTAB runtime structures and function tables, disassembles WebAssembly binaries into WAT instructions, and decodes EVM contract bytecode.
* **Evidence-Based Reconstruction Ledger**: Tracks behavioral observations into authenticated SHA-256 evidence records, compiling deterministic parity claims that guarantee positive, negative, and malformed cases pass verifier testing before feature closure.
* **Dynamic Runtime Observation and Hooking**: Inspects live process memory, intercepts system calls and API invocations via scriptable instrumentation hooks, and captures structured network telemetry without binary modification.
* **Clean-Room Code Synthesis**: Synthesizes production-ready, copyright-clean TypeScript or Rust implementations derived strictly from verifiable behavioral specifications and functional contracts.
* **Executive Reverse Engineering Reporting**: Compiles comprehensive action summaries detailing validated findings, analysis blockers, open items of concern, and recommended next steps, complete with embedded metadata, Dublin Core headers, and cryptographic provenance anchors.

## Usage
Activate Decipher when you need to reverse engineer unknown executables, investigate proprietary desktop or web applications, discover undocumented protocols, extract algorithms from compiled binaries, or synthesize clean-room replacements.

```bash
# Reverse engineer a compiled binary and emit structured evidence graph
decipher analyze-binary ./target_bin --format=json

# Reverse engineer an extracted desktop bundle and reconstruct module graph
decipher inspect-bundle ./app.asar --output=./reconstructed_src

# Compile an executive reverse engineering report with embedded metadata
node .skills/decipher/scripts/generate_report.mjs --target=./target_bin
```

## Changelog
* **v1** : Initial release of Decipher reverse engineer arsenal, binary deconstruction engine, multi-target decompilation pipeline, evidence obligation ledger, and interactive inspection workbench.
