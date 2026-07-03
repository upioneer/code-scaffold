#!/bin/bash
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -url) TARGET_URL="$2"; shift ;;
        -method) METHOD="$2"; shift ;;
        -payload) PAYLOAD="$2"; shift ;;
        -requests) REQ_COUNT="$2"; shift ;;
    esac
    shift
done
METHOD="${METHOD:-GET}"
REQ_COUNT="${REQ_COUNT:-10}"
if [ "$REQ_COUNT" -gt 10 ]; then REQ_COUNT=10; fi
declare -A STATUS_CODES
RATE_LIMITED="false"
for ((i=1; i<=REQ_COUNT; i++)); do
    if [ "$METHOD" == "POST" ]; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$PAYLOAD" "$TARGET_URL")
    else
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL")
    fi
    STATUS_CODES["$STATUS"]=$(( ${STATUS_CODES["$STATUS"]:-0} + 1 ))
    if [ "$STATUS" == "429" ]; then RATE_LIMITED="true"; fi
done
STATUS_JSON="{"
first=1
for code in "${!STATUS_CODES[@]}"; do
    if [ $first -eq 0 ]; then STATUS_JSON+=", "; fi
    STATUS_JSON+="\"$code\": ${STATUS_CODES[$code]}"
    first=0
done
STATUS_JSON+="}"
cat <<EOF
{ "target": "$TARGET_URL", "total_requests": $REQ_COUNT, "status_codes": $STATUS_JSON, "rate_limit_triggered": $RATE_LIMITED }
EOF
