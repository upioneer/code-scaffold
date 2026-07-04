#!/usr/bin/env bash
# Git pre-commit hook to enforce quality gatekeeper

echo "[Pre-Commit] Invoking Quality Gatekeeper..."
./scripts/quality-gatekeeper.sh
if [ $? -ne 0 ]; then
    echo "[Pre-Commit] Quality gatekeeper failed. Commit aborted."
    exit 1
fi
echo "[Pre-Commit] Gatekeeper passed. Proceeding with commit."
exit 0
