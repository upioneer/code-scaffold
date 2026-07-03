param(
    [string]$template,
    [string]$findings
)
$date = Get-Date -Format "yyyy-MM-dd_HHmmss"
$reportPath = Join-Path $PWD ".audit_workspace\reports\security_scan_report_$date.html"
if (-not (Test-Path ".audit_workspace\reports")) { New-Item -ItemType Directory -Force -Path ".audit_workspace\reports" | Out-Null }

try {
    $tmpl = Get-Content $template -Raw
    $data = Get-Content $findings -Raw | ConvertFrom-Json
    
    $targetSource = if ($data.Metadata.TargetSource) { $data.Metadata.TargetSource } else { "Unknown" }
    $riskScore = if ($data.Metadata.OverallRisk) { $data.Metadata.OverallRisk } else { 0 }
    
    $tmpl = $tmpl.Replace("{{TARGET_SOURCE}}", $targetSource)
    $tmpl = $tmpl.Replace("{{TIMESTAMP}}", $date)
    $tmpl = $tmpl.Replace("{{RISK_SCORE}}", $riskScore.ToString())
    
    $passedHtml = ""
    if ($data.PassedChecks) {
        foreach ($p in $data.PassedChecks) { $passedHtml += "<li>$p</li>`n" }
    }
    $tmpl = $tmpl.Replace("{{PASSED_CHECKS}}", $passedHtml)
    
    $findingsHtml = ""
    if ($data.CategorizedFindings) {
        foreach ($f in $data.CategorizedFindings) {
            $sev = if ($f.severity) { $f.severity } else { "LOW" }
            $findingsHtml += "<div class=`"finding-card $sev`"><h3>$sev - $($f.type)</h3><p><b>Location:</b> $($f.file):$($f.line)</p><p>$($f.concern)</p><p><b>Resolution:</b> $($f.resolution)</p></div>`n"
        }
    }
    $tmpl = $tmpl.Replace("{{FINDINGS}}", $findingsHtml)
    
    Set-Content -Path $reportPath -Value $tmpl -Force
    $output = @{
        status = "success"
        report_path = $reportPath
    }
    $output | ConvertTo-Json -Compress
} catch {
    $output = @{ errors = @($_.Exception.Message) }
    $output | ConvertTo-Json -Compress
    exit 1
}
