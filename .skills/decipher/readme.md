# Decipher Reverse Engineer Arsenal

**Version:** 3

**Target:** `.skills/decipher`

**Category:** Security & Cryptography

**Keywords:** `decipher`, `reverse-engineer`, `reverse-engineering`, `reverse-engineering-tools`, `reverse-engineer-anything`, `binary-analysis`, `decompilation`, `disassembly`, `macho-elf-pe`, `electron-asar`, `sourcemap-recovery`, `reconstruction-ledger`, `evidence-provenance`, `clean-room-implementation`, `frida-instrumentation`, `wasm-decompilation`, `go-pclntab`, `call-graph-analysis`, `dynamic-observation`, `binary-diffing`, `packed-executable-unpacking`, `cross-build-pairing`, `website-behavior-capture`, `replay-standin-harness`, `consent-gated-execution`, `similarity-verdicts`, `versioned-case-files`

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
* **Study Build Check Parity Loop**: Closes every reconstruction as a deterministic loop with machine similarity verdicts, kind aware check suites for websites, apps, games, and libraries, bounded refinement rounds, and residual diff escalation.
* **Consent Gated Observation Modes**: Defaults to non invasive Visitor Mode observation and requires recorded operator consent with scope and expiry before Deep Mode instrumentation, target execution, or live network contact.
* **Unified Packed Executable Unpacking**: Routes single file JS runtimes, Python freezer bundles, managed single file publishers, and game engine content packs through one inventory first unpacking seam with bytecode and metadata readers.
* **Cross Build Differential Pairing**: Pairs functions across two builds with a stated basis per function, reports added, removed, and changed routines with similarity scores, and verifies publisher signatures independent of OS trust.
* **Behavioral Capture & Replay Stand-Ins**: Captures scripted multi viewport behavior with design tokens, layout outlines, page health, and accessibility facts, then replays deterministic loopback stand-ins with secrets dropped and coverage gaps reported.
* **Versioned Case Files**: Persists every evidence bundle, ledger, stand-in, and check round with a version field, migrates forward step by step, and never downgrades or overwrites newer files.

## Usage
Activate Decipher when you need to reverse engineer unknown executables, investigate proprietary desktop or web applications, discover undocumented protocols, extract algorithms from compiled binaries, or synthesize clean-room replacements.

```bash
# Reverse engineer a compiled binary and emit structured evidence graph
decipher analyze-binary ./target_bin --format=json

# Reverse engineer an extracted desktop bundle and reconstruct module graph
decipher inspect-bundle ./app.asar --output=./reconstructed_src

# Compile an executive reverse engineering report with embedded metadata
node .skills/decipher/scripts/generate_report.mjs --target=./target_bin

# Diff two builds and pair functions across versions
decipher diff ./build_old/engine.dll ./build_new/engine.dll --pair-functions

# Unpack a single file executable through the unified seam
decipher unpack ./dist_bundle --list-members --extract=./case/unpacked

# Capture website behavior across viewports in visitor mode
decipher capture site https://example.com --viewports=desktop,tablet,phone --tokens --health

# Record and replay a deterministic stand-in harness
decipher standin record --har=./traffic.har --output=./case/standin.json
decipher standin replay --bundle=./case/standin.json --port=8471
```

## Changelog
* **v3** : Added the Study Build Check parity loop with similarity verdicts, consent gated Visitor and Deep observation modes, unified packed executable unpacking seam, cross build differential pairing with publisher verification, behavioral capture with deterministic replay stand-ins, and versioned case file migration discipline
* **v2** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v1** : Initial release of Decipher reverse engineer arsenal, binary deconstruction engine, multi-target decompilation pipeline, evidence obligation ledger, and interactive inspection workbench.
