#!/bin/bash
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -template) TEMPLATE="$2"; shift ;;
        -findings) FINDINGS="$2"; shift ;;
    esac
    shift
done

DATE=$(date +"%Y-%m-%d_%H%M%S")
REPORT_PATH=".audit_workspace/reports/security_scan_report_$DATE.html"
mkdir -p .audit_workspace/reports

python3 -c "
import json, sys
try:
    with open('$TEMPLATE', 'r') as f: tmpl = f.read()
    with open('$FINDINGS', 'r') as f: data = json.load(f)
    
    tmpl = tmpl.replace('{{TARGET_SOURCE}}', data.get('Metadata', {}).get('TargetSource', 'Unknown'))
    tmpl = tmpl.replace('{{TIMESTAMP}}', '$DATE')
    tmpl = tmpl.replace('{{RISK_SCORE}}', str(data.get('Metadata', {}).get('OverallRisk', 0)))
    
    passed_html = ''.join([f'<li>{p}</li>' for p in data.get('PassedChecks', [])])
    tmpl = tmpl.replace('{{PASSED_CHECKS}}', passed_html)
    
    findings_html = ''
    for f in data.get('CategorizedFindings', []):
        sev = f.get('severity', 'LOW')
        findings_html += f'<div class=\"finding-card {sev}\"><h3>{sev} - {f.get(\"type\", \"Vulnerability\")}</h3><p><b>Location:</b> {f.get(\"file\", \"\")}:{f.get(\"line\", \"\")}</p><p>{f.get(\"concern\", \"\")}</p><p><b>Resolution:</b> {f.get(\"resolution\", \"\")}</p></div>'
        
    tmpl = tmpl.replace('{{FINDINGS}}', findings_html)
    
    with open('$REPORT_PATH', 'w') as f: f.write(tmpl)
    print(json.dumps({'status': 'success', 'report_path': '$REPORT_PATH'}))
except Exception as e:
    print(json.dumps({'errors': [str(e)]}))
    sys.exit(1)
"
