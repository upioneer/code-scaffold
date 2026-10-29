# XCross Cross-Platform iOS Engine

**Version:** 2

**Target:** `.skills/xcross`

**Category:** DevOps & Infrastructure

**Keywords:** `xcross`, `ios-development`, `cross-platform-ios`, `swift-package-manager`, `xcode-alternative`, `linux-ios-build`, `windows-ios-build`, `wsl-ios`, `usbmuxd`, `code-signing`, `apple-developer`, `ipa-builder`, `device-deployment`, `swiftui`, `bsp-integration`

## Description
XCross is an enterprise cross-platform iOS development engine, build pipeline, and device deployment system for autonomous AI agents and engineers. It enables compiling standard Swift Package Manager packages into production iOS application bundles, signing them with Apple Developer credentials, and deploying them directly to physical iOS devices and simulators from Linux, Windows WSL, and macOS without Xcode dependencies.

## Capabilities & Use Cases
* **Interactive Onboarding & Familiarity Gate:** Built-in guidance sequence that prompts developers to choose between a guided step-by-step walkthrough (prerequisites, USB passthrough, authentication, and first app) or an instant skip option into expert mode.
* **Xcode-Independent iOS Compilation:** Cross-compiles Swift Package Manager packages into native ARM64 Mach-O binaries for physical iPhones and iPads, linking against the Darwin Swift SDK without requiring the Xcode IDE.
* **Linux and Windows WSL2 Development:** Enables full iOS app development on Ubuntu Linux and Windows 11 via WSL2, eliminating mandatory macOS workstation hardware for engineering teams.
* **Automated Apple Developer Services Integration:** Programmatically communicates with App Store Connect APIs to manage developer certificates, register device UDIDs, and generate provisioning profiles without manual portal navigation.
* **Cryptographic Code Signing Pipeline:** Signs Mach-O executables, embedded dynamic frameworks, and resource bundles with SHA-256 signatures and valid mobileprovision payloads.
* **Direct Hardware Device Deployment:** Uses USB multiplexer daemons to communicate directly with connected physical iOS hardware over Lightning and USB-C cables, supporting package installation, app launching, and live console logging.
* **Build Server Protocol (BSP) Integration:** Generates standardized `.bsp/` configuration files to deliver rich editor intelligence, autocompletion, and jump-to-definition in VS Code, Neovim, and language servers.
* **Headless Linux CI/CD Pipelines:** Runs inside standard Linux container runners (e.g. GitHub Actions `ubuntu-latest`) to build, sign, and export production `.ipa` artifacts without paying premium macOS runner costs.
* **Interactive 3D Workbench & Guided Simulator:** High-fidelity browser sandbox (`sandbox/index.html`) featuring an interactive device simulator, guided first-app wizard with skip options, real-time log inspector, and live manifest configurator.

## Usage
Activate XCross when you need to build iOS apps without Xcode, compile Swift packages on Linux or Windows WSL, deploy to physical iPhones, or establish headless iOS continuous integration pipelines.

```bash
# Run environment health check and toolchain diagnostics
node .skills/xcross/scripts/xcross_bridge.mjs doctor

# Launch interactive onboarding walkthrough with option to skip
node .skills/xcross/scripts/xcross_bridge.mjs onboard

# Scaffold a new cross-platform SwiftPM iOS project
node .skills/xcross/scripts/xcross_bridge.mjs init SolarTracker

# Inspect connected iOS devices
node .skills/xcross/scripts/xcross_bridge.mjs devices

# Build, sign, and deploy application to connected hardware
node .skills/xcross/scripts/xcross_bridge.mjs dev
```

## Changelog
* **v2** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v1** : Initial release of XCross cross-platform iOS engine, user onboarding and familiarity gate, SwiftPM cross-compilation pipeline, automated code signing, and interactive device workbench.
