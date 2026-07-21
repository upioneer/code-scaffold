# Release v3.11.1 : Native TLS Abstraction Bugfix

## Overview
This patch resolves a critical pipeline blockage where the GitHub Actions cross-compiler matrix was failing to build the `aarch64-unknown-linux-gnu` target due to complex OpenSSL C-binding requirements.

## Major Changes
* **Pure Rust Cryptography:** Refactored the `reqwest` dependency in `Cargo.toml` to actively disable the default `native-tls` integration.
* **Architecture Agnosticism:** Swapped the transport layer to `rustls-tls` to guarantee seamless cross-compilation on complex remote architectures like Linux ARM64 without requiring native C-header dependencies.
