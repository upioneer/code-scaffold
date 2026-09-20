param (
    [string]$DefaultRoot = 'project_details/changelog'
)

$ErrorActionPreference = 'Stop'

$answer = Read-Host "Where should versioned release history live? [$DefaultRoot]"
if (-not $answer) { $answer = $DefaultRoot }

if (-not (Test-Path $DefaultRoot)) { New-Item -ItemType Directory -Force -Path $DefaultRoot | Out-Null }
Set-Content -Path (Join-Path $DefaultRoot '.changelog-dir') -Value $answer

if (-not (Test-Path $answer)) { New-Item -ItemType Directory -Force -Path $answer | Out-Null }

Write-Output "Changelog root set to: $answer"
