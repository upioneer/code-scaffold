#!/usr/bin/env bash
set -e

echo "[Optimized Builder] Building with release optimizations..."
cargo build --release

echo "[Optimized Builder] Build complete."
