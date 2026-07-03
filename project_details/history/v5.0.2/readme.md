# Version 5.0.2

## Refactors & Enforcements
* **Bulletproof ARM64 Cross-Compilation Engine**: Deeply analyzed and resolved the cross-compilation faults in the `aarch64-unknown-linux-gnu` GitHub Actions release matrix. The `self_update` architecture relies on pure-Rust `rustls`, which in turn relies on `ring` for cryptography. When cross-compiling `ring` for ARM64 on an x86 Ubuntu runner, the C/Assembly build script requires highly explicit mappings. 
  * Updated `.github/workflows/release.yml` to explicitly provision `g++-aarch64-linux-gnu` and `binutils-aarch64-linux-gnu`.
  * Explicitly mapped the holy grail of `ring` compilation environment variables: `CC_aarch64_unknown_linux_gnu`, `CXX_aarch64_unknown_linux_gnu`, and `AR_aarch64_unknown_linux_gnu`, fully guaranteeing the C-linker targets the ARM architecture flawlessly.
* **Dependencies**: Stripped `self_update` default features to fully remove `native-tls` and `openssl-sys`, forcing pure-Rust extraction and cryptography.
