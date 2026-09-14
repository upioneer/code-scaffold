#!/bin/bash
SOCKET_PATH="${DOCKER_SOCKET:-/var/run/docker.sock}"
TRIGGER_DIR="${DATA_DIR:-/app/data}"

# Check Tier 1: Docker Socket
if [ -S "$SOCKET_PATH" ]; then
    HTTP_CODE=$(curl -s --unix-socket "$SOCKET_PATH" http://localhost/_ping 2>/dev/null)
    if [ "$HTTP_CODE" = "OK" ]; then
        echo "{\"tier\": 1, \"mode\": \"docker_socket\", \"description\": \"Direct Docker Engine API is accessible. Autonomous in-place container swaps enabled.\"}"
        exit 0
    fi
fi

# Check Tier 2: Host Trigger File
if [ -d "$TRIGGER_DIR" ] && [ -w "$TRIGGER_DIR" ]; then
    echo "{\"tier\": 2, \"mode\": \"trigger_file\", \"description\": \"Docker socket is not available, but persistent host storage is writable. Semi-autonomous trigger file upgrades enabled.\"}"
    exit 0
fi

# Fallback Tier 3: Manual
echo "{\"tier\": 3, \"mode\": \"manual\", \"description\": \"Neither socket nor trigger volume available. Fallback to manual terminal upgrade instructions.\"}"
exit 0
