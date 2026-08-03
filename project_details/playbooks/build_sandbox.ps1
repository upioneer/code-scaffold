param (
    [Parameter(Mandatory=$true)]
    [string]$SkillName
)

$ErrorActionPreference = "Stop"

$ProofDir = "project_details/proof/$SkillName-sandbox"
$SkillSandboxDir = ".skills/$SkillName/sandbox"

Write-Host "Building sandbox for skill: $SkillName" -ForegroundColor Cyan

# 1. Verify workspace exists
if (-not (Test-Path -Path $ProofDir)) {
    Write-Error "Sandbox workspace not found at: $ProofDir"
}

# 2. Navigate to workspace and build
Push-Location $ProofDir

Write-Host "Running npm run build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error "Build failed with exit code $LASTEXITCODE"
}

$DistHtml = "dist/index.html"
if (-not (Test-Path -Path $DistHtml)) {
    Pop-Location
    Write-Error "Build succeeded, but dist/index.html was not found. Ensure vite-plugin-singlefile is configured correctly."
}

Pop-Location

# 3. Prepare target directory
if (-not (Test-Path -Path $SkillSandboxDir)) {
    Write-Host "Creating target directory: $SkillSandboxDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $SkillSandboxDir | Out-Null
}

# 4. Deploy payload
$TargetHtml = "$SkillSandboxDir/index.html"
Write-Host "Deploying payload to $TargetHtml..." -ForegroundColor Yellow
Copy-Item -Path "$ProofDir/$DistHtml" -Destination $TargetHtml -Force

Write-Host "Successfully deployed $SkillName sandbox!" -ForegroundColor Green
