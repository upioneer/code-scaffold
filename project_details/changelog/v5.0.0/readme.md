# Version 5.0.0

## Major Architecture Changes
* **Seamless Self-Updating Executable (OTA Updates)**: The TUI executable has been fundamentally restructured to support self-updating Over-The-Air (OTA) directly from GitHub Releases. 
  * On launch, the engine performs a non-blocking 3-second background check to `api.github.com/repos/upioneer/code-scaffold/releases/latest`.
  * If a newer version is discovered, the user is prompted to seamlessly update via a native terminal prompt. 
  * Leveraging the industry-standard `self_update` crate, the application downloads the target binary, gracefully bypasses executing-file locks across Windows, Linux, and macOS via atomic background replacements, and swaps the binary without requiring external wrappers or scripts.

## Refactors & CI/CD
* **Release Asset Compression Matrix**: The `.github/workflows/release.yml` compilation matrix was deeply refactored. Rather than publishing raw binaries to the release hub, the pipeline now automatically compresses all 5 operating system matrix targets into `.zip` (Windows) and `.tar.gz` (Unix) payloads. This drastically reduces GitHub bandwidth footprint and structures the assets exactly as required by the `self_update` extraction engine.
