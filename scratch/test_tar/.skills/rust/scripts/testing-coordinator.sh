#!/usr/bin/env bash
set -e

echo "[Testing Coordinator] Running unit and integration tests..."
cargo test --workspace

echo "[Testing Coordinator] Compiling and running benchmark suites..."
cargo bench --workspace

echo "[Testing Coordinator] All tests and benchmarks passed."
