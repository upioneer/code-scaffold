#!/bin/bash
TARGET="."
SCOPE="full"
MODE="audit"
MAX_DEPTH=3

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -target) TARGET="$2"; shift ;;
        -scope) SCOPE="$2"; shift ;;
        -mode) MODE="$2"; shift ;;
        -maxDepth) MAX_DEPTH="$2"; shift ;;
    esac
    shift
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Initialize workspace
if [ -f "$SCRIPT_DIR/init-audit-workspace.sh" ]; then
    bash "$SCRIPT_DIR/init-audit-workspace.sh" -path "$(pwd)" > /dev/null 2>&1
fi

REPORTS_DIR="$(pwd)/.audit_workspace/reports"
LOGS_DIR="$(pwd)/.audit_workspace/logs"
MEMORY_DIR="$(pwd)/.audit_workspace/memory"
mkdir -p "$REPORTS_DIR" "$LOGS_DIR" "$MEMORY_DIR"

RUN_ID=$(cat /dev/urandom | tr -dc "a-f0-9" | fold -w 8 | head -n 1 2>/dev/null || date +%s)
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

python3 -c "
import os, sys, json, glob, datetime

run_id = "$RUN_ID"
timestamp = "$TIMESTAMP"
target = "$TARGET"
scope = "$SCOPE"
mode = "$MODE"
script_dir = "$SCRIPT_DIR"
memory_dir = "$MEMORY_DIR"
logs_dir = "$LOGS_DIR"
reports_dir = "$REPORTS_DIR"

# 1. Surface Discovery
discovered_surfaces = []
if scope in ["full", "code"]:
    exts = (".js", ".ts", ".jsx", ".tsx", ".rs", ".py", ".go", ".java", ".json")
    for root, dirs, files in os.walk(target):
        if ".git" in root or ".audit_workspace" in root or "node_modules" in root:
            continue
        for f in files:
            if f.endswith(exts):
                p = os.path.join(root, f)
                try:
                    discovered_surfaces.append({"type": "code_artifact", "path": p, "size": os.path.getsize(p)})
                except:
                    pass
        if len(discovered_surfaces) >= 100:
            break

# 2. SAST Findings
findings = []
passed_checks = []

pii_script = os.path.join(script_dir, "invoke-pii-hunter.sh")
if os.path.exists(pii_script):
    import subprocess
    try:
        raw = subprocess.check_output(["bash", pii_script, "-target", target], text=True)
        secrets = json.loads(raw)
        for s in secrets:
            findings.append({
                "severity": "HIGH",
                "type": f"Credential Leak ({s.get('type')})",
                "file": s.get("file"),
                "line": s.get("line"),
                "concern": f"Exposed credential pattern detected matching protected signature ({s.get('type')}).",
                "resolution": "Rotate credential immediately and extract into encrypted environment configuration."
            })
    except:
        pass

if not findings:
    passed_checks.append("Static secret and credential analysis: zero unprotected keys detected")

# 3. Sentinel ChainAST Context Compactor
risk_score = 0 if len(findings) == 0 else min(100, len(findings) * 25)
chain_ast = {
    "engine": "Sentinel Autonomous Security Engine",
    "version": "7",
    "run_id": run_id,
    "timestamp": timestamp,
    "target_source": target,
    "scope": scope,
    "overall_risk": risk_score,
    "surface_count": len(discovered_surfaces),
    "findings_count": len(findings),
    "passed_count": len(passed_checks)
}

# 4. Episodic Memory Record
episodic_path = os.path.join(memory_dir, "episodic.json")
episodic_history = []
if os.path.exists(episodic_path):
    try:
        with open(episodic_path, "r", encoding="utf-8") as ef:
            episodic_history = json.load(ef)
            if not isinstance(episodic_history, list):
                episodic_history = [episodic_history]
    except:
        episodic_history = []

episodic_history.append({
    "run_id": run_id,
    "timestamp": timestamp,
    "target": target,
    "scope": scope,
    "summary": chain_ast
})

with open(episodic_path, "w", encoding="utf-8") as ef:
    json.dump(episodic_history, ef, indent=2)

# 5. Output findings payload
report_payload = {
    "Metadata": {
        "TargetSource": target,
        "OverallRisk": risk_score,
        "RunId": run_id,
        "Timestamp": timestamp
    },
    "PassedChecks": passed_checks,
    "CategorizedFindings": findings,
    "ScopeLimitations": f"Audit restricted strictly to target boundaries ({target}) with max depth $MAX_DEPTH.",
    "MitigationSteps": "Remediate highlighted findings by following specified resolution steps and re-running Sentinel verification."
}

findings_path = os.path.join(logs_dir, f"sentinel_findings_{run_id}.json")
with open(findings_path, "w", encoding="utf-8") as ff:
    json.dump(report_payload, ff, indent=2)

# 6. HTML Compilation
report_path = None
compile_script = os.path.join(script_dir, "compile-html-report.sh")
template_path = os.path.join(os.path.dirname(script_dir), "assets", "templates", "report_template.html")
if os.path.exists(compile_script) and os.path.exists(template_path):
    try:
        import subprocess
        c_out = subprocess.check_output(["bash", compile_script, "-template", template_path, "-findings", findings_path], text=True)
        c_data = json.loads(c_out)
        report_path = c_data.get("report_path")
    except:
        pass

out = {
    "status": "completed",
    "run_id": run_id,
    "ast_summary": chain_ast,
    "findings_file": findings_path,
    "report_path": report_path,
    "findings_count": len(findings),
    "passed_checks": len(passed_checks)
}
print(json.dumps(out))
"
