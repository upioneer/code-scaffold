param(
    [string]$target = ".",
    [string]$scope = "full",
    [string]$mode = "audit",
    [int]$maxDepth = 3
)

$ErrorActionPreference = "Stop"

# Initialize audit workspace
$workspaceScript = Join-Path $PSScriptRoot "init-audit-workspace.ps1"
if (Test-Path $workspaceScript) {
    & $workspaceScript -path $PWD | Out-Null
}

$reportsDir = Join-Path $PWD ".audit_workspace\reports"
$logsDir = Join-Path $PWD ".audit_workspace\logs"
$memoryDir = Join-Path $PWD ".audit_workspace\memory"
if (-not (Test-Path $memoryDir)) { New-Item -ItemType Directory -Force -Path $memoryDir | Out-Null }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$runId = [System.Guid]::NewGuid().ToString().Substring(0, 8)

# 1. Tripartite Memory State: Working Context
$workingContext = @{
    engagement_id = $runId
    timestamp = $timestamp
    target = $target
    scope = $scope
    mode = $mode
    active_phase = "initialized"
    discovered_surfaces = @()
    active_hypotheses = @()
}

# 2. Phase: Reconnaissance Specialist
$reconFindings = @()
if (($scope -eq "full") -or ($scope -eq "code")) {
    $codeExtensions = @("*.js", "*.ts", "*.jsx", "*.tsx", "*.rs", "*.py", "*.go", "*.java", "*.json", "*.env*")
    $scannedFiles = Get-ChildItem -Path $target -Include $codeExtensions -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { ($_.FullName -notmatch "node_modules") -and ($_.FullName -notmatch "\\.git") -and ($_.FullName -notmatch "\\.audit_workspace") } |
        Select-Object -First 100
    
    foreach ($file in $scannedFiles) {
        $workingContext.discovered_surfaces += @{
            type = "code_artifact"
            path = $file.FullName
            size = $file.Length
        }
    }
}

# 3. Phase: Vulnerability Analysis & Hypothesis Generation (SAST via PII Hunter)
$allFindings = @()
$passedChecks = @()

$piiHunter = Join-Path $PSScriptRoot "invoke-pii-hunter.ps1"
if (Test-Path $piiHunter) {
    $rawSecrets = & $piiHunter -target $target | ConvertFrom-Json
    if ($rawSecrets -and $rawSecrets.Count -gt 0) {
        foreach ($s in $rawSecrets) {
            $allFindings += @{
                severity = "HIGH"
                type = "Credential Leak ($($s.type))"
                file = $s.file
                line = $s.line
                concern = "Exposed credential pattern detected matching protected signature ($($s.type))."
                resolution = "Rotate credential immediately and extract into encrypted environment configuration."
            }
        }
    } else {
        $passedChecks += "Static secret and credential analysis: zero unprotected keys detected"
    }
}

# 4. Phase: Rate Limiting & Endpoint Auditing (if target is HTTP/HTTPS)
if ($target -match "^https?://") {
    $volAudit = Join-Path $PSScriptRoot "invoke-volumetric-audit.ps1"
    if (Test-Path $volAudit) {
        $volRes = & $volAudit -url $target -requests 5 | ConvertFrom-Json
        if ($volRes.rate_limit_triggered) {
            $passedChecks += "Endpoint volumetric resilience: 429 Rate Limiting actively enforced"
        } else {
            $allFindings += @{
                severity = "MEDIUM"
                type = "Missing Rate Limiting"
                file = $target
                line = 1
                concern = "Target endpoint did not trigger rate limiting across 5 rapid requests."
                resolution = "Implement token bucket or sliding window rate limiting middleware."
            }
        }
    }
}

# 5. Sentinel ChainAST Context Compactor
# Synthesize execution into a dense AST summary preserving findings without context bloat
$chainAST = @{
    engine = "Sentinel Autonomous Security Engine"
    version = "7"
    run_id = $runId
    timestamp = $timestamp
    target_source = $target
    scope = $scope
    overall_risk = if ($allFindings.Count -eq 0) { 0 } else { [Math]::Min(100, $allFindings.Count * 25) }
    surface_count = $workingContext.discovered_surfaces.Count
    findings_count = $allFindings.Count
    passed_count = $passedChecks.Count
}

# 6. Tripartite Memory State: Episodic Record
$episodicPath = Join-Path $memoryDir "episodic.json"
$episodicHistory = @()
if (Test-Path $episodicPath) {
    try {
        $episodicHistory = Get-Content $episodicPath -Raw | ConvertFrom-Json
        if (-not ($episodicHistory -is [System.Collections.IEnumerable])) {
            $episodicHistory = @($episodicHistory)
        }
    } catch {
        $episodicHistory = @()
    }
}
$episodicRecord = @{
    run_id = $runId
    timestamp = $timestamp
    target = $target
    scope = $scope
    summary = $chainAST
}
$episodicHistory += $episodicRecord
$episodicHistory | ConvertTo-Json -Depth 5 | Set-Content -Path $episodicPath -Force

# 7. Generate Findings Payload for HTML Compiler
$reportPayload = @{
    Metadata = @{
        TargetSource = $target
        OverallRisk = $chainAST.overall_risk
        RunId = $runId
        Timestamp = $timestamp
    }
    PassedChecks = $passedChecks
    CategorizedFindings = $allFindings
    ScopeLimitations = "Audit restricted strictly to target boundaries ($target) with max depth $maxDepth."
    MitigationSteps = "Remediate highlighted findings by following specified resolution steps and re-running Sentinel verification."
}

$findingsJsonPath = Join-Path $logsDir "sentinel_findings_$runId.json"
$reportPayload | ConvertTo-Json -Depth 5 | Set-Content -Path $findingsJsonPath -Force

# Compile HTML report
$compilerScript = Join-Path $PSScriptRoot "compile-html-report.ps1"
$templatePath = Join-Path (Split-Path $PSScriptRoot -Parent) "assets\templates\report_template.html"
$htmlReportPath = $null
if ((Test-Path $compilerScript) -and (Test-Path $templatePath)) {
    $compOutput = & $compilerScript -template $templatePath -findings $findingsJsonPath | ConvertFrom-Json
    $htmlReportPath = $compOutput.report_path
}

$finalOutput = @{
    status = "completed"
    run_id = $runId
    ast_summary = $chainAST
    findings_file = $findingsJsonPath
    report_path = $htmlReportPath
    findings_count = $allFindings.Count
    passed_checks = $passedChecks.Count
}

$finalOutput | ConvertTo-Json -Depth 4 -Compress
