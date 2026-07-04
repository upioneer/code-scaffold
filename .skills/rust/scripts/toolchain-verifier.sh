#!/usr/bin/env bash
set -e

echo "[Toolchain Verifier] Setting default toolchain to stable..."
rustup default stable
rustup update stable

echo "[Toolchain Verifier] Installing sccache..."
cargo install sccache --locked

echo "[Toolchain Verifier] Toolchain verification complete."
