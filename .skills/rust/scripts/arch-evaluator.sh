#!/usr/bin/env bash
set -e

ARCH=$(uname -m)
OS=$(uname -s)

echo "[Architecture Evaluator] Host Operating System: $OS"
echo "[Architecture Evaluator] Host Architecture: $ARCH"

if [ "$ARCH" == "x86_64" ]; then
    echo "[Architecture Evaluator] Standard x86_64 architecture detected."
elif [ "$ARCH" == "arm64" ] || [ "$ARCH" == "aarch64" ]; then
    echo "[Architecture Evaluator] ARM64 architecture detected. Ensure cross-compilation targets are configured if building for x86_64."
else
    echo "[Architecture Evaluator] Unknown architecture: $ARCH"
fi
