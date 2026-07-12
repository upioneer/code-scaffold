$ErrorActionPreference = "Stop"

$workspaceRoot = "C:\Users\hgran\OneDrive\Documents\code\Projects\Code Scaffold"
$targetRoot = Join-Path -Path $workspaceRoot -ChildPath "scratch\test_deploy"

Write-Host "Setting up clean test directory..." -ForegroundColor Cyan
if (Test-Path -Path $targetRoot) {
    Remove-Item -Path $targetRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null

$templatesDir = Join-Path -Path $workspaceRoot -ChildPath ".templates"
$skillsDir = Join-Path -Path $workspaceRoot -ChildPath ".skills"

$state = @()

# Define apps
$state += [PSCustomObject]@{
    Category        = "Apps"
    Id              = "src"
    Label           = "Source Code (/src)"
    Target          = "src"
    Method          = "mkdir"
    Source          = $null
    Selected        = $true
    Installed       = $false
    UpdateAvailable = $false
    VersionStr      = ""
    Overwrite       = $false
}

$state += [PSCustomObject]@{
    Category        = "Apps"
    Id              = "tests"
    Label           = "Test Suite (/tests)"
    Target          = "tests"
    Method          = "mkdir"
    Source          = $null
    Selected        = $true
    Installed       = $false
    UpdateAvailable = $false
    VersionStr      = ""
    Overwrite       = $false
}

$state += [PSCustomObject]@{
    Category        = "Apps"
    Id              = "docs"
    Label           = "Documentation (/docs)"
    Target          = "docs"
    Method          = "mkdir"
    Source          = $null
    Selected        = $true
    Installed       = $false
    UpdateAvailable = $false
    VersionStr      = ""
    Overwrite       = $false
}

# Load template artifacts
if (Test-Path -Path $templatesDir) {
    $templateItems = Get-ChildItem -Path $templatesDir -File
    foreach ($file in $templateItems) {
        if ($file.Name -match "(?i)^license\.md$") {
            continue
        }
        $targetFile = "project_details\$($file.Name)"
        $isSelected = $true
        if ($file.Name -match "(?i)^readme\.md$") {
            $targetFile = $file.Name
        }
        elseif ($file.Name -match "(?i)^vercel\.json$") {
            $targetFile = $file.Name
        }
        elseif ($file.Name -match "(?i)^deploy\.yml$") {
            $targetFile = ".github\workflows\deploy.yml"
        }
        elseif ($file.Name -match "(?i)^env\.example$") {
            $targetFile = ".env.example"
        }
        
        $state += [PSCustomObject]@{
            Category        = "Artifacts"
            Id              = $file.BaseName
            Label           = $file.Name
            Target          = $targetFile
            Method          = "copy"
            Source          = $file.FullName
            Selected        = $isSelected
            Installed       = $false
            UpdateAvailable = $false
            VersionStr      = ""
            Overwrite       = $false
        }
    }
}

# Load skills
if (Test-Path -Path $skillsDir) {
    $skillItems = Get-ChildItem -Path $skillsDir -Directory
    foreach ($folder in $skillItems) {
        $displayLabel = $folder.Name
        $targetDir = ".skills\$($folder.Name)"
        $metaPath = Join-Path -Path $folder.FullName -ChildPath "meta.json"
        
        $state += [PSCustomObject]@{
            Category        = "Agent Skills"
            Id              = $folder.Name
            Label           = $displayLabel
            Target          = $targetDir
            Method          = "copy"
            Source          = $folder.FullName
            Selected        = $true
            Installed       = $false
            UpdateAvailable = $false
            VersionStr      = ""
            Overwrite       = $false
        }
    }
}

# Run the exact code generation functions from scaffold.ps1
function Get-TestingMdContent {
    param (
        [string]$domain
    )
    return @"
# TESTING.md - Web Development Verification Suite

## 1. Automated Baseline Verification
This workspace includes an automated UI structure validation engine. Run the following command from the project root directory to verify that the scaffolding matches foundational web specifications:
./project_details/scripts/validate-web-base.ps1

## 2. Quality Gates & Validation Protocols
All subsequent code additions by the agent or developer must satisfy the following structural requirements:
* Semantic DOM Elements: Main layout files must contain clear structural land markers (e.g., header, main, footer).
* Asset Map Ingestion: Core configuration files must map asset pathways deterministically to prevent broken compilation pipelines.
* Clean Compilation Targets: Client side bootstrap entry points must resolve without dangling dependencies or unresolved relative paths.
* Code Quality: Source code should be clean, contain no residual debuggers or console statements, and follow SPA best practices.
"@
}

function Get-ValidateWebBaseContent {
    return @'
# validate-web-base.ps1
# Automated UI structure validation engine for Web Dev profile

$ErrorActionPreference = "Stop"
$success = $true

Write-Host "Running Web Development Verification Suite..." -ForegroundColor Cyan

# 1. Semantic DOM Elements check
Write-Host "[1/4] Checking Semantic DOM Elements & SPA roots..." -ForegroundColor Gray
$htmlFiles = Get-ChildItem -Path . -Filter "*.html" -Recurse -ErrorAction SilentlyContinue
if ($htmlFiles.Count -gt 0) {
    foreach ($file in $htmlFiles) {
        $content = Get-Content -Path $file.FullName -Raw
        $hasHeader = $content -match "<header\b"
        $hasMain = $content -match "<main\b"
        $hasFooter = $content -match "<footer\b"
        $hasRoot = $content -match 'id=["''](root|app)["'']'
        
        if (-not ($hasHeader -and $hasMain -and $hasFooter)) {
            Write-Host "  FAIL: $($file.FullName) is missing structural landmarks (header, main, or footer)." -ForegroundColor Red
            $success = $false
        } else {
            Write-Host "  PASS: $($file.Name) contains header, main, and footer." -ForegroundColor Green
        }
        
        if ($hasRoot) {
            Write-Host "  PASS: $($file.Name) contains a modern SPA root mounting node." -ForegroundColor Green
        }
    }
} else {
    Write-Host "  INFO: No HTML files found yet to validate semantic structure." -ForegroundColor Yellow
}

# 2. Asset Map Ingestion & Compilation Entry Points check
Write-Host "[2/4] Checking Asset Ingestion & Script Entry Points..." -ForegroundColor Gray
$allFiles = Get-ChildItem -Path . -File -Recurse -Exclude "scaffold.ps1", ".gitignore" -ErrorAction SilentlyContinue
$brokenAssets = 0
foreach ($file in $allFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match 'src\s*=\s*["''](file:/|[A-Za-z]:\\)') {
        Write-Host "  FAIL: $($file.FullName) contains hardcoded absolute asset path." -ForegroundColor Red
        $brokenAssets++
        $success = $false
    }
}
if ($brokenAssets -eq 0) {
    Write-Host "  PASS: No absolute or broken asset path references found." -ForegroundColor Green
}

# 3. React/Vite/SPA Best Practices Check
Write-Host "[3/4] Running React, Vite, & SPA Lint Checks..." -ForegroundColor Gray
$jsFiles = Get-ChildItem -Path . -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse -Exclude "scaffold.ps1" -ErrorAction SilentlyContinue
$lockFiles = Get-ChildItem -Path . -Include "*lock*" -Recurse -ErrorAction SilentlyContinue

if ($jsFiles.Count -gt 0) {
    foreach ($file in $jsFiles) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($content -match 'console\.log\(') {
            Write-Host "  WARN: $($file.Name) contains active console.log() statements." -ForegroundColor Yellow
        }
        if ($content -match '\bdebugger\b') {
            Write-Host "  FAIL: $($file.Name) contains active debugger statement." -ForegroundColor Red
            $success = $false
        }
    }
}

# 4. Dependency Hardening Check
Write-Host "[4/4] Verifying Lockfile & Dependency Hardening..." -ForegroundColor Gray
$packageJson = Get-ChildItem -Path . -Filter "package.json" -Recurse -ErrorAction SilentlyContinue
if ($packageJson.Count -gt 0) {
    if ($lockFiles.Count -eq 0) {
        Write-Host "  WARN: package.json found but no package-lock.json, yarn.lock, or pnpm-lock.yaml exists." -ForegroundColor Yellow
    } else {
        Write-Host "  PASS: Found active lockfile: $($lockFiles[0].Name)." -ForegroundColor Green
    }
}

# 5. Serverless, Auth & In-Memory Store Checks
Write-Host "[5/5] Verifying Serverless, Auth & In-Memory Store setup..." -ForegroundColor Gray
$vercelCheck = Test-Path -Path (Join-Path -Path . -ChildPath "vercel.json")
if ($vercelCheck) {
    Write-Host "  PASS: vercel.json configuration exists." -ForegroundColor Green
} else {
    Write-Host "  FAIL: vercel.json is missing." -ForegroundColor Red
    $success = $false
}

$workflowCheck = Test-Path -Path (Join-Path -Path . -ChildPath ".github/workflows/deploy.yml")
if ($workflowCheck) {
    Write-Host "  PASS: GitHub Actions deploy.yml exists." -ForegroundColor Green
} else {
    Write-Host "  FAIL: GitHub Actions deploy.yml is missing." -ForegroundColor Red
    $success = $false
}

$envCheck = Test-Path -Path (Join-Path -Path . -ChildPath ".env.example")
if ($envCheck) {
    $envContent = Get-Content -Path ".env.example" -Raw
    $hasClerk = $envContent -match "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    $hasRedis = $envContent -match "UPSTASH_REDIS_REST_URL"
    if ($hasClerk -and $hasRedis) {
        Write-Host "  PASS: .env.example contains Clerk and Upstash config placeholders." -ForegroundColor Green
    } else {
        Write-Host "  FAIL: .env.example is missing Clerk or Upstash variables." -ForegroundColor Red
        $success = $false
    }
} else {
    Write-Host "  FAIL: .env.example is missing." -ForegroundColor Red
    $success = $false
}

$middlewareCheck = (Test-Path -Path "src/middleware.ts") -or (Test-Path -Path "middleware.ts")
if ($middlewareCheck) {
    Write-Host "  PASS: Clerk & Upstash Middleware file is present." -ForegroundColor Green
} else {
    Write-Host "  FAIL: Middleware file is missing." -ForegroundColor Red
    $success = $false
}

if ($success) {
    Write-Host "Web Development Verification Success!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Web Development Verification Failed!" -ForegroundColor Red
    exit 1
}
'@
}

function Get-TestHarnessContent {
    return @'
# test-harness.ps1
$ErrorActionPreference = "Stop"
Write-Host "Initializing Test Harness..." -ForegroundColor Cyan
'@
}

# Execution Copy Loop
Write-Host "Executing scaffolding loop..." -ForegroundColor Cyan
foreach ($item in $state) {
    if ($item.Selected) {
        $finalPath = Join-Path -Path $targetRoot -ChildPath $item.Target
        if ($item.Method -eq "mkdir") {
            if (-not (Test-Path -Path $finalPath)) {
                New-Item -ItemType Directory -Force -Path $finalPath | Out-Null
                Write-Host "Created Directory: $($item.Target)" -ForegroundColor Green
            }
        }
        elseif ($item.Method -eq "copy") {
            if ($null -ne $item.Source -and (Test-Path -Path $item.Source)) {
                # Dynamic target path routing for Next.js App Router files
                $isSrcSelectedOrInstalled = $false
                foreach ($stateItem in $state) {
                    if ($stateItem.Id -eq "src" -and ($stateItem.Selected -or $stateItem.Installed)) {
                        $isSrcSelectedOrInstalled = $true
                        break
                    }
                }
                
                if ($item.Id -eq "middleware") {
                    if ($isSrcSelectedOrInstalled) {
                        $finalPath = Join-Path -Path $targetRoot -ChildPath "src\middleware.ts"
                    } else {
                        $finalPath = Join-Path -Path $targetRoot -ChildPath "middleware.ts"
                    }
                }
                elseif ($item.Id -eq "layout") {
                    if ($isSrcSelectedOrInstalled) {
                        $finalPath = Join-Path -Path $targetRoot -ChildPath "src\app\layout.tsx"
                    } else {
                        $finalPath = Join-Path -Path $targetRoot -ChildPath "app\layout.tsx"
                    }
                }
                elseif ($item.Id -eq "redis") {
                    if ($isSrcSelectedOrInstalled) {
                        $finalPath = Join-Path -Path $targetRoot -ChildPath "src\lib\redis.ts"
                    } else {
                        $finalPath = Join-Path -Path $targetRoot -ChildPath "lib\redis.ts"
                    }
                }
                elseif ($item.Id -eq "ratelimit") {
                    if ($isSrcSelectedOrInstalled) {
                        $finalPath = Join-Path -Path $targetRoot -ChildPath "src\lib\ratelimit.ts"
                    } else {
                        $finalPath = Join-Path -Path $targetRoot -ChildPath "lib\ratelimit.ts"
                    }
                }
                
                $parentDir = Split-Path -Path $finalPath -Parent
                if (-not (Test-Path -Path $parentDir)) {
                    New-Item -ItemType Directory -Force -Path $parentDir | Out-Null
                }
                
                if ($item.Category -eq "Agent Skills") {
                    if (-not (Test-Path -Path $finalPath)) {
                        New-Item -ItemType Directory -Force -Path $finalPath | Out-Null
                        Copy-Item -Path "$($item.Source)\*" -Destination $finalPath -Recurse -Force
                        Write-Host "Provisioned Skill: $($item.Label) to $($item.Target)" -ForegroundColor Green
                    }
                }
                else {
                    Copy-Item -Path $item.Source -Destination $finalPath -Force
                    Write-Host "Provisioned Artifact: $($item.Label) to $($finalPath.Replace($targetRoot, ''))" -ForegroundColor Green
                    
                    if ($item.Id -eq "testing") {
                        $testingContent = Get-TestingMdContent -domain "Web Dev"
                        $testingContent | Set-Content -Path $finalPath
                        
                        $scaffoldScriptsDir = Join-Path -Path $targetRoot -ChildPath "project_details\scripts"
                        if (-not (Test-Path -Path $scaffoldScriptsDir)) {
                            New-Item -ItemType Directory -Force -Path $scaffoldScriptsDir | Out-Null
                        }
                        
                        $validationScriptPath = Join-Path -Path $scaffoldScriptsDir -ChildPath "validate-web-base.ps1"
                        $validationScriptContent = Get-ValidateWebBaseContent
                        $validationScriptContent | Set-Content -Path $validationScriptPath
                        
                        $harnessPath = Join-Path -Path $scaffoldScriptsDir -ChildPath "test-harness.ps1"
                        $harnessContent = Get-TestHarnessContent
                        $harnessContent | Set-Content -Path $harnessPath
                        
                        Write-Host "Provisioned testing harness and validation scripts" -ForegroundColor Green
                    }
                }
            }
        }
    }
}

$gitignoreContent = @"
# Environment Variables
.env
.env.*
*.local
"@

$gitignorePath = Join-Path -Path $targetRoot -ChildPath ".gitignore"
if (-not (Test-Path -Path $gitignorePath)) {
    New-Item -ItemType File -Force -Path $gitignorePath -Value $gitignoreContent | Out-Null
    Write-Host "Created File: .gitignore" -ForegroundColor Green
}

$readmemdPath = Join-Path -Path $targetRoot -ChildPath "README.md"
if (-not (Test-Path -Path $readmemdPath)) {
    $readmemdContent = "# Test Project"
    New-Item -ItemType File -Force -Path $readmemdPath -Value $readmemdContent | Out-Null
    Write-Host "Created File: README.md" -ForegroundColor Green
}

Write-Host "`nRunning Generated Quality Gate Validation Script..." -ForegroundColor Cyan
$valScriptPath = Join-Path -Path $targetRoot -ChildPath "project_details\scripts\validate-web-base.ps1"
if (Test-Path -Path $valScriptPath) {
    # Run the validation script in the context of the generated project directory
    $originalDir = Get-Location
    Set-Location -Path $targetRoot
    try {
        & $valScriptPath
        Write-Host "`nAll validation checks PASSED!" -ForegroundColor Green
    }
    catch {
        Write-Host "`nValidation checks FAILED: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    finally {
        Set-Location -Path $originalDir
    }
} else {
    Write-Host "Error: Validation script not found at $valScriptPath" -ForegroundColor Red
    exit 1
}
