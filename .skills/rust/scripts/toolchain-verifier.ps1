$ErrorActionPreference = "Stop"

Write-Host "[Toolchain Verifier] Setting default toolchain to stable..."
rustup default stable
rustup update stable

Write-Host "[Toolchain Verifier] Installing sccache..."
cargo install sccache --locked

Write-Host "[Toolchain Verifier] Toolchain verification complete."
