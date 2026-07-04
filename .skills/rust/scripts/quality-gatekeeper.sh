#!/usr/bin/env bash
set -e

echo "[Quality Gatekeeper] Running cargo fmt..."
cargo fmt --all -- --check

echo "[Quality Gatekeeper] Running cargo clippy..."
cargo clippy --workspace --all-targets --all-features -- -D warnings

echo "[Quality Gatekeeper] Code hygiene passed."
