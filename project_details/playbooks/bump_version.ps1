param(
    [Parameter(Mandatory=$true)]
    [string]$NewVersion
)

# Ensure script runs from the repository root
$repoRoot = (git rev-parse --show-toplevel)
if (-not $repoRoot) {
    Write-Host "Error: Not a git repository." -ForegroundColor Red
    exit 1
}
Set-Location $repoRoot

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
$ChangelogDir = "project_details\changelog\v$NewVersion"
if (Test-Path $TapePath) {
    $vhsCommand = $null
    $isWin = $IsWindows -or ($PSVersionTable.Platform -match 'Win') -or ($env:OS -match 'Windows')

    if ($isWin) {
        if (Get-Command wsl -ErrorAction SilentlyContinue) {
            $wslPath = (wsl wslpath -u "$($PWD.Path)").Trim()
            $wslTapePath = $TapePath -replace '\\', '/'
            $script = @"
export PATH=`"/usr/local/bin:`$PATH`"
cd '$wslPath'
vhs '$wslTapePath'
"@
            $script = $script -replace "`r`n", "`n"
            [IO.File]::WriteAllText("$PWD/run_vhs.sh", $script)
            $vhsCommand = "wsl bash run_vhs.sh; rm run_vhs.sh"
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
        
        # Ensure changelog directory exists
        if (-not (Test-Path $ChangelogDir)) {
            New-Item -ItemType Directory -Force -Path $ChangelogDir | Out-Null
        }
        
        # Move generated assets
        if (Test-Path demo.gif) { Move-Item -Force demo.gif "$ChangelogDir\demo.gif" }
        if (Test-Path demo.png) { Move-Item -Force demo.png "$ChangelogDir\demo.png" }
        if (Test-Path demo_splash.png) { Move-Item -Force demo_splash.png "$ChangelogDir\demo_splash.png" }
        if (Test-Path demo_main.png) { Move-Item -Force demo_main.png "$ChangelogDir\demo_main.png" }
        if (Test-Path demo_final.png) { Move-Item -Force demo_final.png "$ChangelogDir\demo_final.png" }
        
        Write-Host "VHS capture complete! Assets moved to $ChangelogDir" -ForegroundColor Green
    } else {
        if ($isWin) {
            Write-Host "Notice: 'vhs' not found natively or in WSL. Skipping TUI capture." -ForegroundColor Yellow
        } else {
            Write-Host "Notice: 'vhs' is not installed. Skipping automated TUI capture." -ForegroundColor Yellow
        }
    }
}

Write-Host "Version bump complete! Do not forget to create $ChangelogDir\readme.md before committing." -ForegroundColor Yellow
