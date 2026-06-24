param(
    [Parameter(Mandatory=$true)]
    [string]$NewVersion
)

if ($NewVersion -notmatch "^\d+\.\d+\.\d+$") {
    Write-Host "Error: Version must match x.y.z format." -ForegroundColor Red
    exit 1
}

Write-Host "Bumping version to v$NewVersion..." -ForegroundColor Cyan

# 1. Update Cargo.toml
$CargoPath = "scaffold-tui\Cargo.toml"
if (Test-Path $CargoPath) {
    $cargoContent = Get-Content $CargoPath
    $cargoContent = $cargoContent -replace '^version = ".*"', "version = `"$NewVersion`""
    Set-Content -Path $CargoPath -Value $cargoContent
    Write-Host "Updated Cargo.toml" -ForegroundColor Green
}

# 2. Update manifest.json
$ManifestPath = "manifest.json"
if (Test-Path $ManifestPath) {
    $manifestContent = Get-Content $ManifestPath
    $manifestContent = $manifestContent -replace '"version": ".*"', "`"version`": `"$NewVersion`""
    Set-Content -Path $ManifestPath -Value $manifestContent
    Write-Host "Updated manifest.json" -ForegroundColor Green
}

# 3. Update Cargo.lock via cargo update
Write-Host "Updating Cargo.lock..." -ForegroundColor Cyan
Set-Location scaffold-tui
cargo update --workspace
Set-Location ..
Write-Host "Updated Cargo.lock" -ForegroundColor Green

Write-Host "Version bump complete! Do not forget to create project_details\history\v$NewVersion\readme.md before committing." -ForegroundColor Yellow
