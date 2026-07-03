#!/bin/bash
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -file) FILE_PATH="$2"; shift ;;
        -line) LINE_NUM="$2"; shift ;;
    esac
    shift
done
START=$((LINE_NUM - 5))
if [ "$START" -lt 1 ]; then START=1; fi
END=$((LINE_NUM + 5))
sed -n "${START},${END}p" "$FILE_PATH" | python3 -c "import json, sys; print(json.dumps({'file': '$FILE_PATH', 'target_line': int('$LINE_NUM'), 'context': sys.stdin.read()}))"
