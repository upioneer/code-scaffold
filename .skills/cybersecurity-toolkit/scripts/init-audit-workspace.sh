#!/bin/bash
TARGET_PATH="${1:-$PWD}"
mkdir -p "$TARGET_PATH/.audit_workspace/reports"
mkdir -p "$TARGET_PATH/.audit_workspace/logs"
echo "*" > "$TARGET_PATH/.audit_workspace/.gitignore"
cat <<EOF
{ "status": "initialized", "paths": { "reports": "$TARGET_PATH/.audit_workspace/reports", "logs": "$TARGET_PATH/.audit_workspace/logs" } }
EOF
