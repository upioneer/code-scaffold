param(
    [string]$path = $PWD
)
$reports = Join-Path $path ".audit_workspace\reports"
$logs = Join-Path $path ".audit_workspace\logs"
New-Item -ItemType Directory -Force -Path $reports | Out-Null
New-Item -ItemType Directory -Force -Path $logs | Out-Null
Set-Content -Path (Join-Path $path ".audit_workspace\.gitignore") -Value "*" -Force
$output = @{
    status = "initialized"
    paths = @{
        reports = $reports
        logs = $logs
    }
}
$output | ConvertTo-Json -Depth 3 -Compress
