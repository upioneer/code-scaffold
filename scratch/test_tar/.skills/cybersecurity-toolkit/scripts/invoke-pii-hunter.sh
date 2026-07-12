#!/bin/bash
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -target) TARGET="$2"; shift ;;
    esac
    shift
done
TARGET="${TARGET:-.}"

python3 -c "
import os, re, json, sys
findings = []
regexes = {
    'AWS_KEY': r'AKIA[0-9A-Z]{16}',
    'SSH_KEY': r'BEGIN RSA PRIVATE KEY',
    'SSN': r'\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b',
    'INTERNAL_IP': r'\b10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\b',
    'LDAP': r'ldap://[a-zA-Z0-9\.\-]+'
}
for root, dirs, files in os.walk('$TARGET'):
    if '.git' in root or '.audit_workspace' in root: continue
    for name in files:
        filepath = os.path.join(root, name)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                for idx, line in enumerate(f):
                    for r_name, r_pat in regexes.items():
                        if re.search(r_pat, line):
                            findings.append({'type': r_name, 'file': filepath, 'line': idx + 1})
        except:
            pass
print(json.dumps(findings))
"
