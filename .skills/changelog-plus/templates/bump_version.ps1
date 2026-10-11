param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$NewVersion,

    [Parameter(Mandatory=$false)]
    [switch]$DryRun,

    [Parameter(Mandatory=$false)]
    [switch]$SkipMedia
)

# -----------------------------------------------------------------------------
# UNIVERSAL VERSION BUMP & IMMUTABLE CHANGELOG PIPELINE
# -----------------------------------------------------------------------------
# AGENT PROTOCOL:
# 1. Scope & Reasoning Interview: Before executing this script, proactively
#    prompt the user with a drafted changelog summary outlining what changes
#    are being bundled, and provide explicit reasoning for the semver bump type
#    (Major +1.0.0, Minor +0.1.0, or Patch +0.0.1). Wait for user approval.
# 2. Project Tailoring: Adapt the package file detection below to your specific
#    project layout (e.g. package.json, Cargo.toml, pyproject.toml, etc.).
# 3. History Documentation: After running this script, you MUST author or update
#    project_details/changelog/v<VERSION>/readme.md before executing git commit.
# -----------------------------------------------------------------------------

# Ensure script runs from repository root
$repoRoot = (git rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
    Write-Host "Error: Current directory is not inside a git repository." -ForegroundColor Red
    exit 1
}
Set-Location $repoRoot

# Normalize version string (strips optional leading 'v')
$versionClean = $NewVersion -replace '^v', ''
if ($versionClean -notmatch '^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$') {
    Write-Host "Error: Version '$NewVersion' does not match Semantic Versioning format (e.g. 1.2.3 or 1.2.3-beta.1)." -ForegroundColor Red
    exit 1
}

Write-Host "Initiating version bump to v$versionClean..." -ForegroundColor Cyan

# 1. Update Project Manifests (Auto-detecting Multi-Stack Layouts)
$updatedFiles = @()

# Node.js / JavaScript / TypeScript (package.json)
if (Test-Path "package.json") {
    if (-not $DryRun) {
        $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
        $pkg.version = $versionClean
        $pkg | ConvertTo-Json -Depth 10 | Set-Content "package.json"
        if (Test-Path "package-lock.json") {
            if (Get-Command npm -ErrorAction SilentlyContinue) {
                npm install --package-lock-only --silent 2>$null
            }
        }
    }
    $updatedFiles += "package.json"
    Write-Host " -> Updated package.json version to $versionClean" -ForegroundColor Green
}

# Rust (Cargo.toml in root or subdirectories)
$cargoCandidates = @("Cargo.toml", "scaffold-tui\Cargo.toml", "cli\Cargo.toml")
foreach ($cp in $cargoCandidates) {
    if (Test-Path $cp) {
        if (-not $DryRun) {
            $cargoContent = Get-Content $cp
            $cargoContent = $cargoContent -replace '^version\s*=\s*".*"', "version = `"$versionClean`""
            Set-Content -Path $cp -Value $cargoContent
        }
        $updatedFiles += $cp
        Write-Host " -> Updated $cp version to $versionClean" -ForegroundColor Green
    }
}
if ((Test-Path "Cargo.lock") -or (Test-Path "scaffold-tui\Cargo.lock")) {
    if (Get-Command cargo -ErrorAction SilentlyContinue -and -not $DryRun) {
        Write-Host " -> Synchronizing Cargo.lock..." -ForegroundColor Cyan
        cargo update --workspace 2>$null
    }
}

# Python (pyproject.toml)
if (Test-Path "pyproject.toml") {
    if (-not $DryRun) {
        $pyContent = Get-Content "pyproject.toml"
        $pyContent = $pyContent -replace '^version\s*=\s*".*"', "version = `"$versionClean`""
        Set-Content -Path "pyproject.toml" -Value $pyContent
    }
    $updatedFiles += "pyproject.toml"
    Write-Host " -> Updated pyproject.toml version to $versionClean" -ForegroundColor Green
}

# Generic Manifest (manifest.json)
if (Test-Path "manifest.json") {
    if (-not $DryRun) {
        $manContent = Get-Content "manifest.json"
        $manContent = $manContent -replace '"version":\s*".*"', "`"version`": `"$versionClean`""
        Set-Content -Path "manifest.json" -Value $manContent
    }
    $updatedFiles += "manifest.json"
    Write-Host " -> Updated manifest.json version to $versionClean" -ForegroundColor Green
}

# 2. Immutable Changelog Directory Preparation
$changelogRoot = "project_details/changelog"
if (Test-Path (Join-Path $changelogRoot ".changelog-dir")) {
    $customRoot = (Get-Content (Join-Path $changelogRoot ".changelog-dir")).Trim()
    if ($customRoot) { $changelogRoot = $customRoot }
}
$changelogDir = Join-Path $changelogRoot "v$versionClean"

if (-not $DryRun) {
    if (-not (Test-Path $changelogDir)) {
        New-Item -ItemType Directory -Force -Path $changelogDir | Out-Null
    }
}
Write-Host " -> Target release documentation directory: $changelogDir" -ForegroundColor Cyan

# 3. Media Capture Pipeline (Terminal TUI via VHS or Web via Playwright)
if (-not $SkipMedia -and -not $DryRun) {
    $tapePath = "project_details/assets/demo.tape"
    if (-not (Test-Path $tapePath) -and (Test-Path "demo.tape")) {
        $tapePath = "demo.tape"
    }

    if (Test-Path $tapePath) {
        Write-Host " -> Executing Terminal Media Capture from $tapePath..." -ForegroundColor Cyan
        $runTapeScript = ".skills/changelog-plus/scripts/run-tape.ps1"
        if (Test-Path $runTapeScript) {
            & $runTapeScript -TapePath $tapePath -Version $versionClean
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Media capture failed with exit code $LASTEXITCODE. Resolve capture errors before proceeding."
                exit $LASTEXITCODE
            }
        } else {
            $isWin = $IsWindows -or ($PSVersionTable.Platform -match 'Win') -or ($env:OS -match 'Windows')
            if ($isWin -and (Get-Command wsl -ErrorAction SilentlyContinue)) {
                $wslPath = (wsl wslpath -u "$($PWD.Path)").Trim()
                $wslTape = $tapePath -replace '\\', '/'
                wsl bash -c "cd '$wslPath' && vhs '$wslTape'"
            } elseif (Get-Command vhs -ErrorAction SilentlyContinue) {
                vhs $tapePath
            }
            Get-ChildItem -Path . -Filter "demo*.*" | ForEach-Object {
                if ($_.Extension -match "\.(gif|png|webm)$") {
                    Move-Item -Force $_.FullName (Join-Path $changelogDir $_.Name)
                }
            }
        }
    }

    # Web Capture integration (if routes manifest exists)
    $webManifest = "project_details/changelog/routes.json"
    if (Test-Path $webManifest) {
        $webScript = ".skills/changelog-plus/scripts/capture-web.cjs"
        if (Test-Path $webScript -and (Get-Command node -ErrorAction SilentlyContinue)) {
            Write-Host " -> Executing Web Application Capture from $webManifest..." -ForegroundColor Cyan
            node $webScript --routes-file $webManifest --out $changelogDir
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Web capture failed with exit code $LASTEXITCODE."
                exit $LASTEXITCODE
            }
        }
    }
}

Write-Host "Version bump to v$versionClean completed successfully!" -ForegroundColor Green
Write-Host "IMPORTANT: Create or update '$changelogDir/readme.md' and synchronize root README screenshots before committing." -ForegroundColor Yellow
