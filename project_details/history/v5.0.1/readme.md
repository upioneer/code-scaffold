# Version 5.0.1

## Features
* **New Thematic Profiles**: Integrated 7 brand-new color themes into the TUI engine (`bumble`, `amigo1`, `amigo2`, `amigo3`, `amigo4`, `bollywood1`, `bollywood2`), deeply expanding the visual personalization matrix for the console interface.

## Refactors & Enforcements
* **GitHub Actions Pipeline Architecture**: Resolved a critical cross-compilation failure within the GitHub Actions release matrix. The `aarch64-unknown-linux-gnu` target was failing to build the `ring` cryptography assembly (a dependency introduced in `v5.0.0` for secure OTA HTTPS downloads). The pipeline was explicitly updated to pass the `CC_aarch64_unknown_linux_gnu` environment variable to the Rust compiler, ensuring the C compiler natively targets ARM architecture rather than defaulting to the x86 host.
