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

# 4. Compile the updated binary before screenshots
Write-Host "Compiling updated binary..." -ForegroundColor Cyan
Set-Location scaffold-tui
cargo build
Set-Location ..

# 5. Automate TUI Capture (VHS)
$TapePath = "project_details/assets/demo.tape"
$HistoryDir = "project_details\history\v$NewVersion"
if (Test-Path $TapePath) {
    $vhsCommand = $null
    $isWin = $IsWindows -or ($PSVersionTable.Platform -match 'Win') -or ($env:OS -match 'Windows')

    if ($isWin) {
        if ((Get-Command wsl -ErrorAction SilentlyContinue) -and (wsl bash -c "command -v vhs" 2>$null)) {
            $vhsCommand = "wsl vhs $(($TapePath -replace '\\', '/'))"
            Write-Host "Running VHS via WSL (headless-safe)..." -ForegroundColor Cyan
        } elseif (Get-Command vhs -ErrorAction SilentlyContinue) {
            $vhsCommand = "vhs $TapePath"
            Write-Host "Running VHS natively..." -ForegroundColor Cyan
            Write-Host "Warning: On Windows, native VHS may hang in headless CI/Agent environments due to PTY limitations." -ForegroundColor Yellow
        }
    } elseif (Get-Command vhs -ErrorAction SilentlyContinue) {
        $vhsCommand = "vhs $TapePath"
        Write-Host "Running VHS natively..." -ForegroundColor Cyan
    }

    if ($vhsCommand) {
        Invoke-Expression $vhsCommand
        
        # Ensure history directory exists
        if (-not (Test-Path $HistoryDir)) {
            New-Item -ItemType Directory -Force -Path $HistoryDir | Out-Null
        }
        
        # Move generated assets
        if (Test-Path demo.gif) { Move-Item -Force demo.gif "$HistoryDir\demo.gif" }
        if (Test-Path demo.png) { Move-Item -Force demo.png "$HistoryDir\demo.png" }
        if (Test-Path demo_splash.png) { Move-Item -Force demo_splash.png "$HistoryDir\demo_splash.png" }
        if (Test-Path demo_main.png) { Move-Item -Force demo_main.png "$HistoryDir\demo_main.png" }
        if (Test-Path demo_final.png) { Move-Item -Force demo_final.png "$HistoryDir\demo_final.png" }
        
        Write-Host "VHS capture complete! Assets moved to $HistoryDir" -ForegroundColor Green
    } else {
        if ($isWin) {
            Write-Host "Notice: 'vhs' not found natively or in WSL. Skipping TUI capture." -ForegroundColor Yellow
        } else {
            Write-Host "Notice: 'vhs' is not installed. Skipping automated TUI capture." -ForegroundColor Yellow
        }
    }
}

Write-Host "Version bump complete! Do not forget to create $HistoryDir\readme.md before committing." -ForegroundColor Yellow
