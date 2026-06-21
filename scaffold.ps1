$ErrorActionPreference = "Stop"

[console]::OutputEncoding = [System.Text.Encoding]::UTF8
$host.ui.RawUI.WindowTitle = "Code Scaffold"

try {
    $minWidth = 110
    $minHeight = 60
    $rawUI = $host.UI.RawUI
    $buffer = $rawUI.BufferSize
    $window = $rawUI.WindowSize

    if ($buffer.Width -lt $minWidth) {
        $buffer.Width = $minWidth
    }
    if ($buffer.Height -lt $minHeight) {
        $buffer.Height = $minHeight
    }
    $rawUI.BufferSize = $buffer

    if ($window.Width -lt $minWidth) {
        $window.Width = $minWidth
    }
    if ($window.Height -lt $minHeight) {
        $window.Height = $minHeight
    }
    $rawUI.WindowSize = $window
}
catch {
}

$repoUser = "upioneer"
$repoName = "code-scaffold"
$branch = "main"

$manifestUrl = "https://raw.githubusercontent.com/$repoUser/$repoName/$branch/manifest.json"
$archiveUrl = "https://github.com/$repoUser/$repoName/archive/refs/heads/$branch.zip"

$esc = [char]27
$fgWhite = "$esc[38;2;255;255;255m"
$fgGray = "$esc[38;2;150;150;150m"
$fgGold = "$esc[38;2;255;190;0m"
$fgCyan = "$esc[38;2;0;255;255m"
$resetColor = "$esc[0m"
$hideCursor = "$esc[?25l"
$showCursor = "$esc[?25h"
$homeCursor = "$esc[H"

Clear-Host
Write-Host "`n"

$isLocalDev = $false
$checkT = Join-Path -Path $PSScriptRoot -ChildPath ".templates"
$checkS = Join-Path -Path $PSScriptRoot -ChildPath ".skills"
if ((Test-Path -Path $checkT) -and (Test-Path -Path $checkS)) {
    $isLocalDev = $true
}

if ($isLocalDev) {
    $workDir = $PSScriptRoot
}
else {
    $workDir = Join-Path -Path $env:TEMP -ChildPath "Scaffold_Workspace"
    if (-not (Test-Path -Path $workDir)) {
        New-Item -ItemType Directory -Force -Path $workDir | Out-Null
    }
}

$syncCachePath = Join-Path -Path $workDir -ChildPath ".sync_cache.json"
$localVersion = "0.0.0"
if (Test-Path -Path $syncCachePath) {
    try {
        $cacheData = Get-Content -Path $syncCachePath -Raw | ConvertFrom-Json
        if ($null -ne $cacheData.version) {
            $localVersion = $cacheData.version
        }
    } catch {}
}

$templatesDir = Join-Path -Path $workDir -ChildPath ".templates"
$skillsDir = Join-Path -Path $workDir -ChildPath ".skills"

if (-not $isLocalDev) {
    if (-not (Test-Path -Path $templatesDir)) {
        New-Item -ItemType Directory -Force -Path $templatesDir | Out-Null
    }
    if (-not (Test-Path -Path $skillsDir)) {
        New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null
    }
}

$status = "Offline"
$version = $localVersion

try {
    $remoteManifest = Invoke-RestMethod -Uri $manifestUrl
    $remoteVersion = $remoteManifest.metadata.version
    
    if ($remoteVersion -ne $localVersion) {
        Write-Host "Syncing remote payload library v$remoteVersion..." -ForegroundColor Cyan
        $tempZip = Join-Path -Path $env:TEMP -ChildPath "scaffold_update.zip"
        $tempExt = Join-Path -Path $env:TEMP -ChildPath "scaffold_extracted"
        Invoke-WebRequest -Uri $archiveUrl -OutFile $tempZip
        if (Test-Path -Path $tempExt) {
            Remove-Item -Path $tempExt -Recurse -Force
        }
        Expand-Archive -Path $tempZip -DestinationPath $tempExt -Force
        $extractedRoot = Join-Path -Path $tempExt -ChildPath "$repoName-$branch"
        
        $remoteTemplates = Join-Path -Path $extractedRoot -ChildPath ".templates"
        if (Test-Path -Path $remoteTemplates) {
            Copy-Item -Path "$remoteTemplates\*" -Destination $templatesDir -Recurse -Force
        }
        $remoteSkills = Join-Path -Path $extractedRoot -ChildPath ".skills"
        if (Test-Path -Path $remoteSkills) {
            Copy-Item -Path "$remoteSkills\*" -Destination $skillsDir -Recurse -Force
        }
        
        $cacheObj = [PSCustomObject]@{ version = $remoteVersion }
        $cacheObj | ConvertTo-Json | Set-Content -Path $syncCachePath
        Remove-Item -Path $tempZip -Force
        Remove-Item -Path $tempExt -Recurse -Force
        $status = "Online Synced"
        $version = $remoteVersion
    }
    else {
        $status = "Online Current"
        $version = $localVersion
    }
}
catch {
    $status = "Offline Fallback"
    $version = $localVersion
}

$C_F  = [string][char]0x2588 # █
$C_H  = [string][char]0x2550 # ═
$C_V  = [string][char]0x2551 # ║
$C_DR = [string][char]0x2554 # ╔
$C_DL = [string][char]0x2557 # ╗
$C_UR = [string][char]0x255A # ╚
$C_UL = [string][char]0x255D # ╝

$l1 = "    $($C_F*7)$C_DL $($C_F*6)$C_DL $($C_F*5)$C_DL $($C_F*7)$C_DL$($C_F*7)$C_DL $($C_F*6)$C_DL $($C_F*2)$C_V     $($C_F*6)$C_DL "
$l2 = "    $C_F$C_F$C_DR$($C_H*4)$C_UL$C_F$C_F$C_DR$($C_H*4)$C_UL$C_F$C_F$C_DR$($C_H*2)$C_F$C_F$C_DL$C_F$C_F$C_DR$($C_H*4)$C_UL$C_F$C_F$C_DR$($C_H*4)$C_UL$C_F$C_F$C_DR$($C_H*3)$C_F$C_F$C_DL$C_F$C_F$C_V     $C_F$C_F$C_DR$($C_H*2)$C_F$C_F$C_DL"
$l3 = "    $($C_F*7)$C_DL$C_F$C_F$C_V     $($C_F*7)$C_V$($C_F*5)$C_DL  $($C_F*5)$C_DL  $C_F$C_F$C_V   $C_F$C_F$C_V$C_F$C_F$C_V     $C_F$C_F$C_V  $C_F$C_F$C_V"
$l4 = "    $C_UR$($C_H*4)$C_F$C_F$C_V$C_F$C_F$C_V     $C_F$C_F$C_DR$($C_H*2)$C_F$C_F$C_V$C_F$C_F$C_DR$($C_H*2)$C_UL  $C_F$C_F$C_DR$($C_H*2)$C_UL  $C_F$C_F$C_V   $C_F$C_F$C_V$C_F$C_F$C_V     $C_F$C_F$C_V  $C_F$C_F$C_V"
$l5 = "    $($C_F*7)$C_V$C_UR$($C_F*6)$C_DL$C_F$C_F$C_V  $C_F$C_F$C_V$C_F$C_F$C_V     $C_F$C_F$C_V     $C_UR$($C_F*6)$C_DR$C_UL$($C_F*7)$C_DL$($C_F*6)$C_DR$C_UL"
$l6 = "    $C_UR$($C_H*6)$C_UL $C_UR$($C_H*5)$C_UL$C_UR$C_H$C_UL  $C_UR$C_H$C_UL$C_UR$C_H$C_UL     $C_UR$C_H$C_UL      $C_UR$($C_H*5)$C_UL $C_UR$($C_H*6)$C_UL$C_UR$($C_H*5)$C_UL "

Write-Host "  ${fgCyan}$l1${resetColor}"
Write-Host "  ${fgCyan}$l2${resetColor}"
Write-Host "  ${fgGold}$l3${resetColor}"
Write-Host "  ${fgGold}$l4${resetColor}"
Write-Host "  ${fgGold}$l5${resetColor}"
Write-Host "  ${fgGold}$l6${resetColor}"
Write-Host "`n"

Write-Host "  Target Directory Selection" -ForegroundColor Cyan
$targetRoot = Read-Host "  Enter target path (Leave blank for current directory)"

if ([string]::IsNullOrWhiteSpace($targetRoot)) {
    $targetRoot = $PSScriptRoot
}

if (-not (Test-Path -Path $targetRoot)) {
    Write-Host "Path does not exist. Creating directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null
}

try {
    [Console]::WindowTop = 0
}
catch {
}

$state = @()

$state += [PSCustomObject]@{
    Category        = "Apps"
    Id              = "src"
    Label           = "Source Code (/src)"
    Target          = "src"
    Method          = "mkdir"
    Source          = $null
    Selected        = $false
    Installed       = Test-Path -Path (Join-Path -Path $targetRoot -ChildPath "src")
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
    Selected        = $false
    Installed       = Test-Path -Path (Join-Path -Path $targetRoot -ChildPath "tests")
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
    Selected        = $false
    Installed       = Test-Path -Path (Join-Path -Path $targetRoot -ChildPath "docs")
    UpdateAvailable = $false
    VersionStr      = ""
    Overwrite       = $false
}

if (Test-Path -Path $templatesDir) {
    $templateItems = Get-ChildItem -Path $templatesDir -File
    foreach ($file in $templateItems) {
        if ($file.Name -match "(?i)^license\.md$") {
            continue
        }
        $targetFile = "project_details\$($file.Name)"
        $isSelected = $false
        if ($file.Name -match "(?i)^readme\.md$") {
            $targetFile = $file.Name
            $isSelected = $true
        }
        elseif ($file.Name -match "(?i)^vercel\.json$") {
            $targetFile = $file.Name
            $isSelected = $true
        }
        elseif ($file.Name -match "(?i)^deploy\.yml$") {
            $targetFile = ".github\workflows\deploy.yml"
            $isSelected = $true
        }
        elseif ($file.Name -match "(?i)^env\.example$") {
            $targetFile = ".env.example"
            $isSelected = $true
        }
        elseif ($file.Name -match "(?i)^(middleware\.ts|layout\.tsx|redis\.ts|ratelimit\.ts)$") {
            $targetFile = $file.Name
            $isSelected = $false
        }
        
        $finalTargetPath = Join-Path -Path $targetRoot -ChildPath $targetFile
        $exists = Test-Path -Path $finalTargetPath
        
        $state += [PSCustomObject]@{
            Category        = "Artifacts"
            Id              = $file.BaseName
            Label           = $file.Name
            Target          = $targetFile
            Method          = "copy"
            Source          = $file.FullName
            Selected        = $isSelected
            Installed       = $exists
            UpdateAvailable = $false
            VersionStr      = ""
            Overwrite       = $false
        }
    }
}

if (Test-Path -Path $skillsDir) {
    $skillItems = Get-ChildItem -Path $skillsDir -Directory
    foreach ($folder in $skillItems) {
        $displayLabel = $folder.Name
        $targetDir = ".skills\$($folder.Name)"
        $metaPath = Join-Path -Path $folder.FullName -ChildPath "meta.json"
        $remoteVersion = "0.0.0"
        if (Test-Path -Path $metaPath) {
            $metaContent = Get-Content -Path $metaPath -Raw | ConvertFrom-Json
            if ($null -ne $metaContent.label) {
                $displayLabel = $metaContent.label
            }
            if ($null -ne $metaContent.target) {
                $targetDir = $metaContent.target
            }
            if ($null -ne $metaContent.version) {
                $remoteVersion = $metaContent.version
            }
        }
        
        $finalTargetPath = Join-Path -Path $targetRoot -ChildPath $targetDir
        $exists = Test-Path -Path $finalTargetPath
        $localVersion = "0.0.0"
        $updateAvailable = $false
        $versionStr = ""

        if ($exists) {
            $localMetaPath = Join-Path -Path $finalTargetPath -ChildPath "meta.json"
            if (Test-Path -Path $localMetaPath) {
                try {
                    $lMeta = Get-Content -Path $localMetaPath -Raw | ConvertFrom-Json
                    if ($null -ne $lMeta.version) { $localVersion = $lMeta.version }
                } catch {}
                
                try {
                    if ([version]$remoteVersion -gt [version]$localVersion) {
                        $updateAvailable = $true
                        $versionStr = "(Update to v$remoteVersion)"
                    } else {
                        $versionStr = ""
                    }
                } catch {
                    $versionStr = ""
                }
            } else {
                $updateAvailable = $true
                $versionStr = "(Update to v$remoteVersion)"
            }
        }

        $state += [PSCustomObject]@{
            Category        = "Agent Skills"
            Id              = $folder.Name
            Label           = $displayLabel
            Target          = $targetDir
            Method          = "copy"
            Source          = $folder.FullName
            Selected        = $false
            Installed       = $exists
            UpdateAvailable = $updateAvailable
            VersionStr      = $versionStr
            Overwrite       = $false
        }
    }
    
    # Add Bring Your Own Skill placeholder
    $state += [PSCustomObject]@{
        Category        = "Agent Skills"
        Id              = "byos"
        Label           = "Bring Your Own Skill (BYOS)..."
        Target          = ""
        Method          = "byos"
        Source          = $null
        Selected        = $false
        Installed       = $false
        UpdateAvailable = $false
        VersionStr      = ""
        Overwrite       = $false
    }
}

$currentIndex = 0
$running = $true
$script:selectedAgentDomain = "Generic"

function Show-AgentDomainSubmenu {
    Clear-Host
    Write-Host "`n  Select the AGENT.md Focus Domain:" -ForegroundColor Cyan
    
    $agentDomains = [ordered]@{
        "Web Dev"            = "Focuses on UI UX, API design, authentication, and state management."
        "Docker / DevOps"    = "Focuses on containerization, CI CD pipelines, and infrastructure hardening."
        "Mobile (iOS/And)"   = "Focuses on native mobile architectures, device permissions, and offline sync."
        "DBA"                = "When the project requires heavy schema design, migration strategies, or data orchestration."
        "Systems Scripting"  = "Focuses on CLI tools, error handling, logging, and script automation."
        "Generic"            = "Standard fallback focusing on clean code principles and baseline verification loops."
    }
    
    $domainKeys = @($agentDomains.Keys)
    $domainIndex = 0
    $submenuRunning = $true
    
    $startLine = [Console]::CursorTop
    
    Write-Host $hideCursor -NoNewline
    
    while ($submenuRunning) {
        [Console]::SetCursorPosition(0, $startLine)
        
        $i = 0
        foreach ($dKey in $domainKeys) {
            if ($i -eq $domainIndex) {
                Write-Host "  > ${fgCyan}[ $dKey ]${resetColor}  "
            } else {
                Write-Host "    ${fgGray}  $dKey  ${resetColor}  "
            }
            $i++
        }
        
        Write-Host "  ${fgGold}--------------------------------------------------------------------------------${resetColor}"
        
        $desc = $agentDomains[$domainKeys[$domainIndex]]
        Write-Host "                                                                                "
        Write-Host "                                                                                "
        
        [Console]::SetCursorPosition(0, $startLine + $domainKeys.Count + 1)
        Write-Host "  ${fgGold}$desc${resetColor}"
        
        $key = [Console]::ReadKey($true)
        if ($key.Key -eq 'UpArrow') {
            if ($domainIndex -gt 0) {
                $domainIndex--
            } else {
                $domainIndex = $domainKeys.Count - 1
            }
        }
        elseif ($key.Key -eq 'DownArrow') {
            if ($domainIndex -lt ($domainKeys.Count - 1)) {
                $domainIndex++
            } else {
                $domainIndex = 0
            }
        }
        elseif ($key.Key -eq 'Enter') {
            $submenuRunning = $false
        }
    }
    
    $script:selectedAgentDomain = $domainKeys[$domainIndex]
    if ($script:selectedAgentDomain -eq "Web Dev") {
        $selectedWebDevComponents = @("playwright", "middleware", "layout", "redis", "ratelimit")
        foreach ($item in $state) {
            if ($selectedWebDevComponents -contains $item.Id) {
                $item.Selected = $true
            }
        }
        Write-Host "`n  ${fgCyan}[QoL Option] Automatically selected Playwright skill and Edge/Auth middleware for Web Dev focus!${resetColor}"
        Start-Sleep -Seconds 2
    }
    Write-Host $showCursor -NoNewline
}

function Get-AgentDomainRoleContent {
    param (
        [string]$domain
    )
    
    $roleText = ""
    switch ($domain) {
        "Web Dev" {
            $roleText = "You are an expert Web Developer specializing in UI UX, API design, authentication, and state management. Your goal is to build and maintain the web applications and APIs for this project.`n`n### CRITICAL SECURITY PROTOCOLS`n1. **Privacy Statement Required:** All web properties must include a comprehensive Privacy Statement accessible from the footer.`n2. **Rate Limiting:** Implement strict rate limiting on all API routes to prevent abuse, DoS, and brute-force attacks.`n3. **Password Security:** All passwords and sensitive credentials must be securely hashed (e.g., Argon2 or bcrypt) and never stored in plain text.`n4. **General Security:** Follow OWASP best practices (XSS, CSRF, and SQLi protection) across all endpoints."
        }
        "Docker / DevOps" {
            $roleText = "You are an expert DevOps Engineer specializing in containerization, CI CD pipelines, and infrastructure hardening. Your goal is to manage container orchestration and deployment pipelines."
        }
        "Mobile (iOS/And)" {
            $roleText = "You are an expert Mobile Software Engineer specializing in native mobile architectures, device permissions, and offline sync. Your goal is to build and maintain mobile applications for this project."
        }
        "DBA" {
            $roleText = "You are an expert Database Administrator specializing in heavy schema design, migration strategies, and data orchestration. Your goal is to manage database schemas and data flows."
        }
        "Systems Scripting" {
            $roleText = "You are an expert Systems Scripting Engineer specializing in CLI tools, error handling, logging, and script automation. Your goal is to build and maintain automated scripts and CLI utilities."
        }
        Default {
            $roleText = "You are an expert Generalist Software Engineer specializing in clean code principles, SOLID design, and robust baseline verification loops. Your goal is to build and maintain correct and maintainable software components."
        }
    }
    
    return "## Role`n$roleText"
}

function Get-AgentDomainSystemArchContent {
    param (
        [string]$domain
    )
    
    $archOverview = ""
    $lines = @()
    switch ($domain) {
        "Web Dev" {
            $archOverview = "This project follows a modern web architecture utilizing distinct frontend interfaces, API routing layers, secure authentication boundaries, and state management systems."
            $lines += "* Focuses on UI UX, API design, authentication, and state management."
            $lines += "* Prioritize responsive design, accessible UI UX components, and efficient state management."
            $lines += "* Ensure clear separation of concern between visual rendering and backing API endpoints."
            $lines += "* Follow strict security practices for managing authentication, sessions, and data storage."
        }
        "Docker / DevOps" {
            $archOverview = "This project leverages containerized services managed via Docker environments, robust CI CD pipelines, and strict infrastructure configuration profiles."
            $lines += "* Focuses on containerization, CI CD pipelines, and infrastructure hardening."
            $lines += "* Enforce containerization best practices, multi-stage builds, and minimal base images."
            $lines += "* Prioritize automated CI CD integration pipelines and secure environment configuration."
            $lines += "* Ensure secrets are never committed and containers run with non-root user permissions."
        }
        "Mobile (iOS/And)" {
            $archOverview = "This project is designed around a native mobile architecture emphasizing offline-first synchronization, local database caching, secure device storage, and native platform services."
            $lines += "* Focuses on native mobile architectures, device permissions, and offline sync."
            $lines += "* Prioritize clean native mobile patterns, strict offline sync behavior, and database caching."
            $lines += "* Implement robust permission handling, device hardware integration, and battery efficiency."
            $lines += "* Ensure secure local storage and elegant recovery under varying network connectivity."
        }
        "DBA" {
            $archOverview = "This project is structured around relational database storage, optimized schemas, safe migration sequencing, transaction controls, and robust analytical modeling."
            $lines += "* When the project requires heavy schema design, migration strategies, or data orchestration."
            $lines += "* Enforce strict relational database schemas, migrations tracking, and optimized indexing."
            $lines += "* Focus on reliable transaction boundaries, efficient query plans, and backup strategies."
            $lines += "* Ensure isolation levels, integrity constraints, and data security policies are enforced."
        }
        "Systems Scripting" {
            $archOverview = "This project is organized as a modular systems utility utilizing robust CLI patterns, native shell integration, explicit error codes, and comprehensive diagnostic logging."
            $lines += "* Focuses on CLI tools, error handling, logging, and script automation."
            $lines += "* Focus on robust command line interfaces, reliable return codes, and system call boundaries."
            $lines += "* Prioritize explicit error handling, structured logging, and thorough fallback workflows."
            $lines += "* Enforce portable execution paths, platform independence, and automated diagnostic suites."
        }
        Default {
            $archOverview = "This project is built using a modular architecture with high test coverage, robust baseline verification loops, clean separation of concerns, and portable execution paths."
            $lines += "* Standard fallback focusing on clean code principles and baseline verification loops."
            $lines += "* Follow clean code principles, SOLID design, and robust baseline verification loops."
            $lines += "* Focus on high test coverage, descriptive naming conventions, and automated build flows."
            $lines += "* Prioritize comprehensive API documentation, review guides, and peer validation steps."
        }
    }
    
    $combinedLines = $lines -join "`n"
    return "## System Architecture Overview`n$archOverview`n`n$combinedLines"
}

function Get-AgentProfileFromDomain {
    param (
        [string]$domain
    )
    switch ($domain) {
        "Web Dev"            { return "web-dev" }
        "Docker / DevOps"    { return "systems-auto" }
        "Mobile (iOS/And)"   { return "web-dev" }
        "DBA"                { return "database" }
        "Systems Scripting"  { return "systems-auto" }
        Default              { return "systems-auto" }
    }
}

function Get-TestingMdContent {
    param (
        [string]$domain
    )
    
    $profile = Get-AgentProfileFromDomain -domain $domain
    $content = ""
    
    if ($profile -eq "web-dev") {
        $content = @"
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
    elseif ($profile -eq "database") {
        $content = @"
# TESTING.md - Database Infrastructure Verification Suite

## 1. Automated Baseline Verification
This workspace contains local validation frameworks for schema correctness. Run the following validation pipeline before laying down data modifications:
./project_details/scripts/validate-db-schema.ps1

## 2. Quality Gates & Validation Protocols
All data layouts, migration files, and table structures must pass these criteria:
* Deterministic Key Enforcement: Every newly defined structural table model must explicitly configure a primary identification boundary.
* Migration Sequential Continuity: Migration files must contain sequential timestamp increments or monotonic sequence numbers to ensure forward and backward consistency.
* Transaction Integrity Check: Script structures handling mutating operations must explicitly encapsulate execution blocks within named transaction boundaries to prevent partial execution drift.
* Relational Safety: Schema names should not collide with SQL keywords, and foreign key relations should have corresponding indexing configurations.
"@
    }
    else {
        $content = @"
# TESTING.md - Systems Automation Verification Suite

## 1. Automated Baseline Verification
To verify that runtime execution privileges, file system paths, and OS boundaries are correct for this automation suite, run the baseline validation test:
./project_details/scripts/validate-sys-sandbox.ps1

## 2. Quality Gates & Validation Protocols
Automation routines, execution blocks, and environment wrappers must verify the following constraints:
* Idempotent Path Resolution: Scripts target paths must support arbitrary re-run capabilities without generating duplicated mutations or configuration pollution.
* Explicit Exception Defenses: All system calls interacting with external execution packages or underlying filesystems must map specific try/catch or rescue boundaries.
* Privilege Level Tracking: Automation scripts requiring administrative capabilities must explicitly check current process execution context flags immediately on boot to handle clean degradation.
* CLI Robustness: Scripts should define parameter inputs and validate arguments to handle error states gracefully.
"@
    }
    
    return $content
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

if ($htmlFiles.Count -gt 0) {
    foreach ($file in $htmlFiles) {
        $content = Get-Content -Path $file.FullName -Raw
        $matches = [regex]::Matches($content, 'src\s*=\s*["'']([^"'']+\.js)["'']')
        foreach ($match in $matches) {
            $scriptPath = $match.Groups[1].Value
            if ($scriptPath -like "http:*" -or $scriptPath -like "https:*" -or $scriptPath -like "//*") {
                continue
            }
            $parentDir = Split-Path -Path $file.FullName -Parent
            $resolvedPath = Join-Path -Path $parentDir -ChildPath $scriptPath
            if (-not (Test-Path -Path $resolvedPath)) {
                Write-Host "  FAIL: Script target '$scriptPath' referenced in $($file.Name) does not exist." -ForegroundColor Red
                $success = $false
            } else {
                Write-Host "  PASS: Referenced script '$scriptPath' exists." -ForegroundColor Green
            }
        }
    }
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
        if ($content -match 'style=\{\{') {
            Write-Host "  WARN: $($file.Name) uses inline styles instead of modular/decoupled CSS." -ForegroundColor Yellow
        }
        if ($content -match 'process\.env\.') {
            $viteCheck = Get-ChildItem -Path . -Filter "vite.config.*" -Recurse -ErrorAction SilentlyContinue
            if ($viteCheck.Count -gt 0) {
                Write-Host "  WARN: $($file.Name) uses process.env. Use import.meta.env for Vite projects." -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "  INFO: No source code files found to analyze." -ForegroundColor Yellow
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
} else {
    Write-Host "  INFO: No package.json found in the project root." -ForegroundColor Yellow
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

function Get-ValidateDbSchemaContent {
    return @'
# validate-db-schema.ps1
# Schema correctness and migration validation engine for Database profile

$ErrorActionPreference = "Stop"
$success = $true

Write-Host "Running Database Infrastructure Verification Suite..." -ForegroundColor Cyan

$sqlFiles = Get-ChildItem -Path . -Filter "*.sql" -Recurse -ErrorAction SilentlyContinue

# 1. Deterministic Key Enforcement
Write-Host "[1/4] Checking Deterministic Key Enforcement..." -ForegroundColor Gray
$checkedTables = 0
foreach ($file in $sqlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $matches = [regex]::Matches($content, '(?is)CREATE\s+TABLE\s+(\w+)\s*\(.*?\)')
    foreach ($match in $matches) {
        $tableName = $match.Groups[1].Value
        $tableBlock = $match.Value
        $checkedTables++
        if ($tableBlock -notmatch 'PRIMARY\s+KEY') {
            Write-Host "  FAIL: Table '$tableName' in $($file.Name) is missing a PRIMARY KEY constraint." -ForegroundColor Red
            $success = $false
        } else {
            Write-Host "  PASS: Table '$tableName' contains a PRIMARY KEY constraint." -ForegroundColor Green
        }
    }
}
if ($checkedTables -eq 0) {
    Write-Host "  INFO: No SQL table creation schemas found to validate." -ForegroundColor Yellow
}

# 2. Migration Sequential Continuity
Write-Host "[2/4] Checking Migration Sequential Continuity..." -ForegroundColor Gray
$migrationFiles = Get-ChildItem -Path . -Recurse -ErrorAction SilentlyContinue | Where-Object { 
    $_.Name -match 'migration' -or $_.DirectoryName -match 'migration'
} | Where-Object { -not $_.PSIsContainer }

if ($migrationFiles.Count -gt 0) {
    $outOfSequence = $false
    foreach ($file in $migrationFiles) {
        if ($file.Name -notmatch '^\d+') {
            Write-Host "  FAIL: Migration file '$($file.Name)' does not begin with a numeric sequence identifier." -ForegroundColor Red
            $outOfSequence = $true
            $success = $false
        }
    }
    if (-not $outOfSequence) {
        Write-Host "  PASS: All migration files have sequential/numeric prefixes." -ForegroundColor Green
    }
} else {
    Write-Host "  INFO: No migration files found to validate." -ForegroundColor Yellow
}

# 3. Transaction Integrity Check
Write-Host "[3/4] Checking Transaction Integrity..." -ForegroundColor Gray
$checkedMutations = 0
foreach ($file in $sqlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match '(?i)\b(INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE)\b') {
        $checkedMutations++
        $hasBegin = $content -match '(?i)\b(BEGIN\s+TRANSACTION|BEGIN\s+TRANS|BEGIN\b)'
        $hasCommit = $content -match '(?i)\b(COMMIT\s+TRANSACTION|COMMIT\s+TRANS|COMMIT\b)'
        if (-not ($hasBegin -and $hasCommit)) {
            Write-Host "  FAIL: Mutation operations in $($file.Name) are not enclosed in a transaction block." -ForegroundColor Red
            $success = $false
        } else {
            Write-Host "  PASS: Mutations in $($file.Name) are enclosed in a transaction." -ForegroundColor Green
        }
    }
}
if ($checkedMutations -eq 0) {
    Write-Host "  INFO: No SQL mutation scripts found to validate." -ForegroundColor Yellow
}

# 4. Relational & Schema Design Check
Write-Host "[4/4] Verifying Relational Indexing & Keyword Best Practices..." -ForegroundColor Gray
$reservedKeywords = @('user', 'order', 'group', 'table', 'select', 'where', 'limit', 'join', 'index')
$designIssues = 0
foreach ($file in $sqlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    if ($content -match 'SELECT\s+\*\s+FROM') {
        Write-Host "  WARN: $($file.Name) contains SELECT * queries. Request specific column targets for performance." -ForegroundColor Yellow
    }
    
    $matches = [regex]::Matches($content, '(?i)\b(\w+_(id)|(id)_\w+)\b')
    foreach ($match in $matches) {
        $colName = $match.Value
        if ($colName -ne "id" -and $content -notmatch "INDEX\b.*?\b$colName\b") {
            Write-Host "  WARN: Column '$colName' in $($file.Name) appears to be a foreign key reference but lacks a backing INDEX." -ForegroundColor Yellow
        }
    }
    
    foreach ($kw in $reservedKeywords) {
        if ($content -match "\b$kw\b" -and $content -match "(CREATE\s+TABLE|ALTER\s+TABLE)\s+\b$kw\b") {
            Write-Host "  FAIL: Table name in $($file.Name) uses reserved SQL keyword '$kw'." -ForegroundColor Red
            $designIssues++
            $success = $false
        }
    }
}
if ($designIssues -eq 0 -and $sqlFiles.Count -gt 0) {
    Write-Host "  PASS: Schema design rules satisfied." -ForegroundColor Green
}

if ($success) {
    Write-Host "Database Verification Success!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Database Verification Failed!" -ForegroundColor Red
    exit 1
}
'@
}

function Get-ValidateSysSandboxContent {
    return @'
# validate-sys-sandbox.ps1
# Privilege, idempotent path, and exception defense validation engine for Systems Automation profile

$ErrorActionPreference = "Stop"
$success = $true

Write-Host "Running Systems Automation Verification Suite..." -ForegroundColor Cyan

$scriptFiles = Get-ChildItem -Path . -Recurse -Include "*.ps1", "*.sh", "*.py" -Exclude "scaffold.ps1" -ErrorAction SilentlyContinue
if ($scriptFiles.Count -eq 0) {
    Write-Host "  INFO: No user automation scripts found to validate." -ForegroundColor Yellow
} else {
    # 1. Idempotent Path Resolution & Environment Cleanliness
    Write-Host "[1/4] Checking Idempotency & Temp Path Operations..." -ForegroundColor Gray
    $idempotencyPass = $true
    foreach ($file in $scriptFiles) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($file.Extension -eq ".ps1") {
            if ($content -match 'New-Item\s+.*?-ItemType\s+Directory' -and $content -notmatch 'Test-Path' -and $content -notmatch '-Force') {
                Write-Host "  FAIL: $($file.Name) creates a directory without safety check or -Force." -ForegroundColor Red
                $idempotencyPass = $false
                $success = $false
            }
        }
        if ($content -match '(?i)(C:\\temp\b|/tmp\b)') {
            Write-Host "  WARN: $($file.Name) references a hardcoded system temporary directory. Use env/workspace temp paths." -ForegroundColor Yellow
        }
    }
    if ($idempotencyPass) {
        Write-Host "  PASS: Script path resolutions appear idempotent." -ForegroundColor Green
    }

    # 2. Explicit Exception Defenses
    Write-Host "[2/4] Checking Exception Defenses & Error Hooks..." -ForegroundColor Gray
    $defensePass = $true
    foreach ($file in $scriptFiles) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($file.Extension -eq ".ps1") {
            if ($content -match '\b(Copy-Item|Remove-Item|Move-Item|Set-Content|Out-File|Invoke-Expression|Start-Process)\b') {
                if ($content -notmatch 'try\s*\{' -and $content -notmatch '\$ErrorActionPreference\s*=\s*["'']SilentlyContinue["'']') {
                    Write-Host "  FAIL: $($file.Name) performs system operations without a try/catch or error action override." -ForegroundColor Red
                    $defensePass = $false
                    $success = $false
                }
            }
        }
    }
    if ($defensePass) {
        Write-Host "  PASS: System mutations have try/catch or error overrides defined." -ForegroundColor Green
    }

    # 3. Privilege Level & Hardcoded Secrets Audits
    Write-Host "[3/4] Running Security & Privilege Audits..." -ForegroundColor Gray
    $secPass = $true
    foreach ($file in $scriptFiles) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($content -match '(?i)admin') {
            if ($content -notmatch 'WindowsPrincipal' -and $content -notmatch 'IsAdmin' -and $content -notmatch 'runas') {
                Write-Host "  FAIL: $($file.Name) references admin operations but lacks explicit privilege checking." -ForegroundColor Red
                $secPass = $false
                $success = $false
            }
        }
        
        if ($content -match '(?i)(password|secret|token|apikey|privatekey)\s*=\s*["''][^"'']{3,}["'']') {
            Write-Host "  WARN: $($file.Name) contains potential hardcoded plain-text credentials." -ForegroundColor Yellow
        }
    }
    if ($secPass) {
        Write-Host "  PASS: Security and privilege gates verified." -ForegroundColor Green
    }

    # 4. CLI Parameters validation
    Write-Host "[4/4] Validating CLI Design & Parameter Hooks..." -ForegroundColor Gray
    $cliPass = $true
    foreach ($file in $scriptFiles) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($file.Extension -eq ".ps1") {
            if ($content -match '(?s)param\s*\(') {
                Write-Host "  PASS: $($file.Name) contains structured param() blocks for arguments." -ForegroundColor Green
            } else {
                Write-Host "  WARN: $($file.Name) does not utilize a formal param() block for argument validation." -ForegroundColor Yellow
            }
        }
    }
}

if ($success) {
    Write-Host "Systems Automation Verification Success!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Systems Automation Verification Failed!" -ForegroundColor Red
    exit 1
}
'@
}

function Get-TestHarnessContent {
    return @'
# test-harness.ps1
# Main validation entrypoint for the scaffolded workspace

$ErrorActionPreference = "Stop"

Write-Host "Initializing Test Harness..." -ForegroundColor Cyan

$projectDetailsDir = Split-Path -Path $PSScriptRoot -Parent
$agentPath = Join-Path -Path $projectDetailsDir -ChildPath "AGENT.md"
if (-not (Test-Path -Path $agentPath)) {
    Write-Host "Error: AGENT.md not found in project_details/" -ForegroundColor Red
    exit 1
}

$agentContent = Get-Content -Path $agentPath -Raw
$profileName = "systems-auto"

if ($agentContent -match '(?i)Web Developer|Web Dev') {
    $profileName = "web-dev"
} elseif ($agentContent -match '(?i)Database Administrator|DBA|Database') {
    $profileName = "database"
} elseif ($agentContent -match '(?i)Systems Scripting|DevOps|Systems Automation') {
    $profileName = "systems-auto"
}

Write-Host "Detected Profile: $profileName" -ForegroundColor Cyan

Write-Host "Running Pre-Flight Host Runtime Check..." -ForegroundColor Gray
$binaries = @()
if ($profileName -eq "web-dev") {
    $binaries = @("node", "npm")
} elseif ($profileName -eq "database") {
    $binaries = @("sqlite3", "git")
} else {
    $binaries = @("python", "git")
}

$missing = @()
foreach ($bin in $binaries) {
    $cmd = Get-Command $bin -ErrorAction SilentlyContinue
    if ($null -eq $cmd) {
        $missing += $bin
    }
}

if ($missing.Count -gt 0) {
    Write-Host "Pre-flight Warning: The following binaries are missing from the path: $($missing -join ', ')" -ForegroundColor Yellow
} else {
    Write-Host "Pre-flight Check PASS: All required binaries are present." -ForegroundColor Green
}

$scriptPath = ""
if ($profileName -eq "web-dev") {
    $scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "validate-web-base.ps1"
} elseif ($profileName -eq "database") {
    $scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "validate-db-schema.ps1"
} else {
    $scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "validate-sys-sandbox.ps1"
}

if (Test-Path -Path $scriptPath) {
    & $scriptPath
} else {
    Write-Host "Error: Validation script not found at $scriptPath" -ForegroundColor Red
    exit 1
}
'@
}

function Import-BYOS-Skill {
    Clear-Host
    Write-Host "`n  ==================================================" -ForegroundColor Cyan
    Write-Host "  Bring Your Own Skill (BYOS) Loader" -ForegroundColor Cyan
    Write-Host "  ==================================================" -ForegroundColor Cyan
    Write-Host "`n  This feature allows you to pull a skill from a remote URL"
    Write-Host "  (e.g., a GitHub repository or zip archive)."
    
    # 1. Ensure internet accessibility
    Write-Host "`n  Verifying internet connection..." -ForegroundColor Gray
    $internetActive = $false
    try {
        $request = [System.Net.WebRequest]::Create("https://api.github.com")
        $request.Method = "HEAD"
        $request.Timeout = 4000
        $request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        $response = $request.GetResponse()
        if ($null -ne $response) {
            $internetActive = $true
            $response.Close()
        }
    } catch {
        try {
            $dns = [System.Net.Dns]::GetHostAddresses("github.com")
            if ($dns.Length -gt 0) { $internetActive = $true }
        } catch {}
    }
    
    if (-not $internetActive) {
        Write-Host "`n  [ERROR] Internet access is not available." -ForegroundColor Red
        Write-Host "  Please check your internet connection and try again." -ForegroundColor Yellow
        Write-Host "`n  Press any key to return..."
        $null = [Console]::ReadKey($true)
        return
    }
    Write-Host "  Connection verified. [OK]" -ForegroundColor Green

    # 2. Prompt for URL
    Write-Host "`n  Enter the URL of the skill repository or zip file:" -ForegroundColor White
    $url = Read-Host "  URL"
    if ($null -eq $url) { $url = "" }
    $url = $url.Trim()
    
    if ([string]::IsNullOrEmpty($url)) {
        return
    }
    
    # Validate URI format
    $uriResult = $null
    if (-not ([System.Uri]::TryCreate($url, [System.UriKind]::Absolute, [ref]$uriResult))) {
        Write-Host "`n  [WARNING] The value entered does not appear to be a valid absolute URL." -ForegroundColor Red
        Write-Host "  Please validate the link and try again." -ForegroundColor Yellow
        Write-Host "`n  Press any key to return..."
        $null = [Console]::ReadKey($true)
        return
    }

    # 3. Perform pre-download checks on the URL structure
    $seemsValid = $false
    if ($url -match "\.zip$" -or $url -match "\.md$" -or $url -match "\.skill$" -or $url -match "github\.com" -or $url -match "skill") {
        $seemsValid = $true
    }
    
    if (-not $seemsValid) {
        Write-Host "`n  [ADVICE] The provided link does not look like a typical agent skill source" -ForegroundColor Yellow
        Write-Host "  (does not end with '.zip', contain 'github.com', or mention 'skill')." -ForegroundColor Yellow
        Write-Host "  Please double check and validate that this link points to a valid agent skill." -ForegroundColor Yellow
        Write-Host "`n  Do you want to proceed anyway? [Y]es / [N]o: " -NoNewline
        $ans = [Console]::ReadKey($true)
        if ($ans.KeyChar -ne 'y' -and $ans.KeyChar -ne 'Y') {
            return
        }
        Write-Host "Proceeding..."
    }

    # 4. Prepare temporary paths
    $guidStr = [Guid]::NewGuid().Guid
    $tempZip = Join-Path -Path $env:TEMP -ChildPath "byos_download_$guidStr.zip"
    $tempExt = Join-Path -Path $env:TEMP -ChildPath "byos_extracted_$guidStr"
    
    # 4a. Check if the URL is an HTML page and scan for downloadable objects
    $isHtmlPage = $false
    $isGitHubRepoRoot = $false
    if ($url -match "github\.com/[^/]+/[^/]+$" -or $url -match "github\.com/[^/]+/[^/]+/$") {
        $isGitHubRepoRoot = $true
    }
    
    if (-not $isGitHubRepoRoot -and -not ($url -match "\.(zip|md|skill)(?:\?|#|$)")) {
        try {
            $originalSecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            
            $request = [System.Net.WebRequest]::Create($url)
            $request.Method = "HEAD"
            $request.Timeout = 4000
            $request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            $response = $request.GetResponse()
            if ($response.ContentType -match "text/html") {
                $isHtmlPage = $true
            }
            $response.Close()
            [System.Net.ServicePointManager]::SecurityProtocol = $originalSecurityProtocol
        }
        catch {
            $isHtmlPage = $true
        }
    }
    
    if ($isHtmlPage) {
        Write-Host "  Scanning page for downloadable skill objects..." -ForegroundColor Gray
        try {
            $originalSecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            
            $html = Invoke-RestMethod -Uri $url -TimeoutSec 10
            [System.Net.ServicePointManager]::SecurityProtocol = $originalSecurityProtocol
            
            $matches = [regex]::Matches($html, 'href="([^"]+)"')
            $detectedLinks = @()
            $uriBase = New-Object System.Uri($url)
            
            foreach ($m in $matches) {
                $link = $m.Groups[1].Value
                if ($link -match "\.(zip|md|skill)(?:\?|#|$)") {
                    if ($link.StartsWith("/")) {
                        $link = $uriBase.Scheme + "://" + $uriBase.Host + $link
                    }
                    elseif (-not ($link -match "^https?://")) {
                        $link = $uriBase.Scheme + "://" + $uriBase.Host + "/" + $link.TrimStart('/')
                    }
                    
                    if ($link -match "/(license|readme|contributing|changelog|code_of_conduct)\.md(?:\?|#|$)" -or $link -match "/(github\.com/[^/]+/[^/]+/blob/|/tree/)") {
                        continue
                    }
                    $detectedLinks += $link
                }
            }
            
            $detectedLinks = $detectedLinks | Select-Object -Unique
            
            if ($detectedLinks.Count -gt 1) {
                Write-Host "`n  [WARNING] Multiple downloadable objects (.zip, .md, .skill) were detected:" -ForegroundColor Yellow
                foreach ($dl in $detectedLinks) {
                    Write-Host "    - $dl" -ForegroundColor Cyan
                }
                Write-Host "`n  Please provide a more accurate URL pointing directly to the specific skill." -ForegroundColor Yellow
                Write-Host "  Press any key to return..."
                $null = [Console]::ReadKey($true)
                return
            }
            elseif ($detectedLinks.Count -eq 1) {
                $url = $detectedLinks[0]
                Write-Host "  Redirecting to detected download object: $url" -ForegroundColor Green
            }
        }
        catch {
            # Fall back to original URL
        }
    }

    $isSingleFile = $false
    $fileNameWithoutExt = "custom-skill"
    if ($url -match "/([^/?#]+)\.(md|skill)(?:\?|#|$)" -or $url -match "\.(md|skill)$") {
        $isSingleFile = $true
        if ($Matches[1]) {
            $fileNameWithoutExt = $Matches[1]
        }
        if ($fileNameWithoutExt -match "^skill$" -or $fileNameWithoutExt -match "^readme$") {
            $parts = $url -split '/'
            if ($parts.Length -gt 2) {
                $parentSegment = $parts[$parts.Length - 2]
                if (-not [string]::IsNullOrEmpty($parentSegment) -and $parentSegment -ne "main" -and $parentSegment -ne "master") {
                    $fileNameWithoutExt = $parentSegment
                }
            }
        }
    }

    $downloadSuccess = $false
    $lastError = ""
    
    Write-Host "`n  Downloading skill payload..." -ForegroundColor Cyan
    if ($isSingleFile) {
        try {
            New-Item -ItemType Directory -Force -Path $tempExt | Out-Null
            $destFilePath = Join-Path -Path $tempExt -ChildPath "SKILL.md"
            Write-Host "  Downloading single skill file to temp directory..." -ForegroundColor Gray
            
            $originalSecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            
            Invoke-WebRequest -Uri $url -OutFile $destFilePath -TimeoutSec 15 -ErrorAction Stop
            [System.Net.ServicePointManager]::SecurityProtocol = $originalSecurityProtocol
            $downloadSuccess = $true
        }
        catch {
            $lastError = $_.Exception.Message
        }
    }
    else {
        # Construct possible download URLs
        $downloadUrls = @($url)
        if ($url -match "github\.com" -and $url -notmatch "\.zip$") {
            $cleanUrl = $url.TrimEnd('/')
            if ($cleanUrl -match "github\.com/([^/]+)/([^/]+)/tree/([^/]+)$") {
                $owner = $Matches[1]
                $repo = $Matches[2]
                $branchName = $Matches[3]
                $downloadUrls = @(
                    "https://github.com/$owner/$repo/archive/refs/heads/$branchName.zip",
                    "https://github.com/$owner/$repo/zipball/$branchName"
                )
            }
            elseif ($cleanUrl -match "github\.com/[^/]+/[^/]+$") {
                $downloadUrls = @(
                    "$cleanUrl/archive/refs/heads/main.zip",
                    "$cleanUrl/archive/refs/heads/master.zip",
                    "$cleanUrl/zipball/main"
                )
            }
        }

        foreach ($dlUrl in $downloadUrls) {
            try {
                Write-Host "  Trying: $dlUrl" -ForegroundColor Gray
                $originalSecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol
                [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
                
                Invoke-WebRequest -Uri $dlUrl -OutFile $tempZip -TimeoutSec 15 -ErrorAction Stop
                [System.Net.ServicePointManager]::SecurityProtocol = $originalSecurityProtocol
                $downloadSuccess = $true
                break
            }
            catch {
                $lastError = $_.Exception.Message
            }
        }
    }
    
    if (-not $downloadSuccess) {
        Write-Host "`n  [ERROR] Failed to download payload from the provided URL." -ForegroundColor Red
        if ($lastError) {
            Write-Host "  Details: $lastError" -ForegroundColor Yellow
        }
        Write-Host "  Please verify your link and try again." -ForegroundColor Yellow
        Write-Host "`n  Press any key to return..."
        $null = [Console]::ReadKey($true)
        if (Test-Path -Path $tempZip) { Remove-Item -Path $tempZip -Force }
        return
    }

    # 5. Extract Zip Archive
    if (-not $isSingleFile) {
        Write-Host "  Extracting archive..." -ForegroundColor Cyan
        try {
            New-Item -ItemType Directory -Force -Path $tempExt | Out-Null
            Expand-Archive -Path $tempZip -DestinationPath $tempExt -Force
        }
        catch {
            Write-Host "`n  [ERROR] Failed to extract the downloaded payload." -ForegroundColor Red
            Write-Host "  The file might not be a valid zip archive." -ForegroundColor Yellow
            Write-Host "  Please validate the URL contents." -ForegroundColor Yellow
            Write-Host "`n  Press any key to return..."
            $null = [Console]::ReadKey($true)
            if (Test-Path -Path $tempZip) { Remove-Item -Path $tempZip -Force }
            if (Test-Path -Path $tempExt) { Remove-Item -Path $tempExt -Recurse -Force }
            return
        }
    }

    # 6. Locate skill folders (containing meta.json or SKILL.md)
    $skillFolders = @()
    if (Test-Path -Path $tempExt) {
        $candidateFolders = Get-ChildItem -Path $tempExt -Recurse -Directory
        $candidateFolders = @((Get-Item -Path $tempExt)) + $candidateFolders
        
        foreach ($dir in $candidateFolders) {
            $metaJsonFile = Join-Path -Path $dir.FullName -ChildPath "meta.json"
            $skillMdFile = Join-Path -Path $dir.FullName -ChildPath "SKILL.md"
            if ((Test-Path -Path $metaJsonFile) -or (Test-Path -Path $skillMdFile)) {
                $skillFolders += $dir
            }
        }
    }

    if ($skillFolders.Count -eq 0) {
        Write-Host "`n  [WARNING] The downloaded content did not contain any valid agent skills." -ForegroundColor Red
        Write-Host "  An agent skill must contain at least a 'meta.json' or 'SKILL.md' file." -ForegroundColor Yellow
        Write-Host "  Please validate the repository structure and link." -ForegroundColor Yellow
        Write-Host "`n  Press any key to return..."
        $null = [Console]::ReadKey($true)
        if (Test-Path -Path $tempZip) { Remove-Item -Path $tempZip -Force }
        if (Test-Path -Path $tempExt) { Remove-Item -Path $tempExt -Recurse -Force }
        return
    }

    # 7. Import found skills
    Write-Host "`n  Found $($skillFolders.Count) skill(s) to import:" -ForegroundColor Green
    $importedCount = 0
    foreach ($sf in $skillFolders) {
        $metaJsonFile = Join-Path -Path $sf.FullName -ChildPath "meta.json"
        $skillMdFile = Join-Path -Path $sf.FullName -ChildPath "SKILL.md"
        
        $skillName = $sf.Name
        if ($skillName -match "^byos_extracted_" -or $isSingleFile) {
            $skillName = $fileNameWithoutExt
        }
        
        $displayLabel = $skillName
        $targetDir = ".skills/$skillName"
        $versionVal = "1.0.0"
        
        if (Test-Path -Path $metaJsonFile) {
            try {
                $metaContent = Get-Content -Path $metaJsonFile -Raw | ConvertFrom-Json
                if ($null -ne $metaContent.label) { $displayLabel = $metaContent.label }
                if ($null -ne $metaContent.target) { $targetDir = $metaContent.target }
                if ($null -ne $metaContent.version) { $versionVal = $metaContent.version }
            }
            catch {}
        } else {
            $defaultMeta = @{
                label = $displayLabel
                description = "Custom Bring-Your-Own-Skill (BYOS)"
                version = $versionVal
                target = $targetDir
            }
            $defaultMeta | ConvertTo-Json | Set-Content -Path $metaJsonFile -Force
        }

        if ($targetDir -match "\.skills/([^/]+)$" -or $targetDir -match "\.skills\\([^\\]+)$") {
            $skillName = $Matches[1]
        }
        
        $destSkillDir = Join-Path -Path $skillsDir -ChildPath $skillName
        if (-not (Test-Path -Path $destSkillDir)) {
            New-Item -ItemType Directory -Force -Path $destSkillDir | Out-Null
        }
        Copy-Item -Path "$($sf.FullName)\*" -Destination $destSkillDir -Recurse -Force
        
        $existingStateIndex = -1
        for ($idx = 0; $idx -lt $script:state.Count; $idx++) {
            if ($script:state[$idx].Id -eq $skillName -and $script:state[$idx].Category -eq "Agent Skills") {
                $existingStateIndex = $idx
                break
            }
        }
        
        $finalTargetPath = Join-Path -Path $targetRoot -ChildPath $targetDir
        $exists = Test-Path -Path $finalTargetPath
        
        $newStateItem = [PSCustomObject]@{
            Category        = "Agent Skills"
            Id              = $skillName
            Label           = $displayLabel
            Target          = $targetDir
            Method          = "copy"
            Source          = $destSkillDir
            Selected        = $true
            Installed       = $exists
            UpdateAvailable = $false
            VersionStr      = ""
            Overwrite       = $false
        }
        
        if ($existingStateIndex -ge 0) {
            $script:state[$existingStateIndex] = $newStateItem
        } else {
            $byosIndex = -1
            for ($idx = 0; $idx -lt $script:state.Count; $idx++) {
                if ($script:state[$idx].Id -eq "byos") {
                    $byosIndex = $idx
                    break
                }
            }
            if ($byosIndex -gt 0) {
                $script:state = $script:state[0..($byosIndex-1)] + $newStateItem + $script:state[$byosIndex..($script:state.Count-1)]
            } elseif ($byosIndex -eq 0) {
                $script:state = @($newStateItem) + $script:state
            } else {
                $script:state += $newStateItem
            }
            $importedCount++
        }
        Write-Host "  [SUCCESS] Loaded and selected: $displayLabel" -ForegroundColor Green
    }
    
    $script:currentIndex += $importedCount
    
    # Clean up
    if (Test-Path -Path $tempZip) { Remove-Item -Path $tempZip -Force }
    if (Test-Path -Path $tempExt) { Remove-Item -Path $tempExt -Recurse -Force }
    
    Write-Host "`n  Press any key to resume..."
    $null = [Console]::ReadKey($true)
}

function Draw-UI {
    Clear-Host
    $ui = "`n`n"
    $ui += "  ${fgCyan}$l1${resetColor}`n"
    $ui += "  ${fgCyan}$l2${resetColor}`n"
    $ui += "  ${fgGold}$l3${resetColor}`n"
    $ui += "  ${fgGold}$l4${resetColor}`n"
    $ui += "  ${fgGold}$l5${resetColor}`n"
    $ui += "  ${fgGold}$l6${resetColor}`n"
    $ui += "`n ${fgGold}Target: $targetRoot${resetColor}`n"
    $ui += "`n  Configure scaffolding...`n`n"

    $currentCategory = ""
    $i = 0
    
    while ($i -lt $state.Count) {
        $item = $state[$i]
        
        if ($item.Category -ne $currentCategory) {
            $ui += "  ${fgGold}$($item.Category)${resetColor}`n"
            $currentCategory = $item.Category
        }
        
        $prefix = "    "
        if ($i -eq $currentIndex) {
            $prefix = "  > "
        }
        
        $box = "[ ]"
        if ($item.Selected) {
            $box = "[x]"
        }

        $statusStr = ""
        
        if ($item.Installed) {
            if ($item.UpdateAvailable) {
                $statusStr = " ${fgGold}$($item.VersionStr)${resetColor}"
            } else {
                $statusStr = " ${fgWhite}(Installed)${resetColor}"
            }
        }

        $itemColor = $fgWhite
        if ($item.Installed) {
            $itemColor = $fgGray
        }

        if ($i -eq $currentIndex) {
            $ui += "${fgCyan}$prefix$box $($item.Label)${resetColor}$statusStr`n"
        }
        else {
            $ui += "$prefix$box ${itemColor}$($item.Label)${resetColor}$statusStr`n"
        }
        
        $i++
    }
    
    $ui += "`n  ${fgGold}Scaffold v$version  |  Status: $status${resetColor}"
    $ui += "`n`n  ${fgGold}Controls:${resetColor}`n"
    $ui += "  ${fgGold}[Up/Down] Navigate${resetColor}`n"
    $ui += "  ${fgGold}[Space]   Toggle Selection${resetColor}`n"
    $ui += "  ${fgGold}[T]       Toggle All/None${resetColor}`n"
    $ui += "  ${fgGold}[Enter]   Execute Build${resetColor}`n"
    
    Write-Host $ui -NoNewline
}

Write-Host $hideCursor -NoNewline
while ($running) {
    Draw-UI
    $key = [Console]::ReadKey($true)
    if ($key.Key -eq 'UpArrow') {
        if ($currentIndex -gt 0) {
            $currentIndex--
        }
    }
    elseif ($key.Key -eq 'DownArrow') {
        if ($currentIndex -lt ($state.Count - 1)) {
            $currentIndex++
        }
    }
    elseif ($key.Key -eq 'Spacebar') {
        $item = $state[$currentIndex]
        if ($item.Id -eq "byos") {
            Import-BYOS-Skill
            $item.Selected = $false
        }
        else {
            if (-not $item.Selected) {
                if ($item.Category -eq "Artifacts" -and $item.Installed) {
                    Write-Host "`n  ${fgGold}Artifact '$($item.Label)' already exists. Overwrite? [Y]es / [C]ancel: ${resetColor}" -NoNewline
                    $ans = [Console]::ReadKey($true)
                    if ($ans.KeyChar -eq 'y' -or $ans.KeyChar -eq 'Y') {
                        $item.Selected = $true
                        $item.Overwrite = $true
                    } else {
                        $item.Selected = $false
                        $item.Overwrite = $false
                    }
                } else {
                    $item.Selected = $true
                }
                if ($item.Selected -and $item.Id -eq "agent") {
                    Show-AgentDomainSubmenu
                }
                if ($item.Selected -and $item.Id -eq "agent") {
                    foreach ($partner in $state) {
                        if ($partner.Id -eq "testing" -and -not $partner.Selected) {
                            if ($partner.Category -eq "Artifacts" -and $partner.Installed) {
                                Write-Host "`n  ${fgGold}Artifact '$($partner.Label)' already exists. Overwrite? [Y]es / [C]ancel: ${resetColor}" -NoNewline
                                $pAns = [Console]::ReadKey($true)
                                if ($pAns.KeyChar -eq 'y' -or $pAns.KeyChar -eq 'Y') {
                                    $partner.Selected = $true
                                    $partner.Overwrite = $true
                                }
                            } else {
                                $partner.Selected = $true
                            }
                        }
                    }
                }
                # Auto-pair: checking github.md <-> github skill, firebase.md <-> firebase skill
                if ($item.Selected -and ($item.Id -eq "github" -or $item.Id -eq "firebase")) {
                    foreach ($partner in $state) {
                        if ($partner.Id -eq $item.Id -and $partner -ne $item -and -not $partner.Selected) {
                            if ($partner.Category -eq "Artifacts" -and $partner.Installed) {
                                Write-Host "`n  ${fgGold}Artifact '$($partner.Label)' already exists. Overwrite? [Y]es / [C]ancel: ${resetColor}" -NoNewline
                                $pAns = [Console]::ReadKey($true)
                                if ($pAns.KeyChar -eq 'y' -or $pAns.KeyChar -eq 'Y') {
                                    $partner.Selected = $true
                                    $partner.Overwrite = $true
                                }
                            } else {
                                $partner.Selected = $true
                            }
                        }
                    }
                }
            } else {
                $item.Selected = $false
                $item.Overwrite = $false
            }
        }
    }
    elseif ($key.Key -eq 'T') {
        $anyUnselected = $false
        foreach ($item in $state) {
            if ($item.Id -ne "byos" -and -not $item.Selected) {
                $anyUnselected = $true
                break
            }
        }
        if ($anyUnselected) {
            $agentWasSelected = $false
            foreach ($item in $state) {
                if ($item.Id -eq "agent" -and $item.Selected) {
                    $agentWasSelected = $true
                }
            }
            $existingCount = 0
            foreach ($item in $state) {
                if ($item.Id -ne "byos" -and -not $item.Selected -and $item.Category -eq "Artifacts" -and $item.Installed) {
                    $existingCount++
                }
            }
            $overwriteAll = $false
            $promptCancelled = $false
            if ($existingCount -gt 0) {
                Write-Host "`n  ${fgGold}Some selected artifacts already exist. Overwrite them? [Y]es / [C]ancel: ${resetColor}" -NoNewline
                $ans = [Console]::ReadKey($true)
                if ($ans.KeyChar -eq 'y' -or $ans.KeyChar -eq 'Y') {
                    $overwriteAll = $true
                } else {
                    $promptCancelled = $true
                }
            }
            foreach ($item in $state) {
                if ($item.Id -eq "byos") {
                    $item.Selected = $false
                }
                elseif ($item.Category -eq "Artifacts" -and $item.Installed) {
                    if ($promptCancelled) {
                        $item.Selected = $false
                        $item.Overwrite = $false
                    } else {
                        $item.Selected = $true
                        $item.Overwrite = $overwriteAll
                    }
                } else {
                    $item.Selected = $true
                }
            }
            $agentIsSelectedNow = $false
            foreach ($item in $state) {
                if ($item.Id -eq "agent" -and $item.Selected) {
                    $agentIsSelectedNow = $true
                }
            }
            if ($agentIsSelectedNow -and -not $agentWasSelected) {
                Show-AgentDomainSubmenu
            }
        } else {
            foreach ($item in $state) {
                $item.Selected = $false
                $item.Overwrite = $false
            }
        }
    }
    elseif ($key.Key -eq 'Enter') {
        $running = $false
    }
}
Write-Host $showCursor -NoNewline

$licenses = @(
    [PSCustomObject]@{ Id = "none"; Label = "None"; Desc = "Do not create a LICENSE.md file" },
    [PSCustomObject]@{ Id = "mit"; Label = "MIT License"; Desc = "A short and simple permissive license" },
    [PSCustomObject]@{ Id = "apache-2.0"; Label = "Apache License 2.0"; Desc = "A permissive license with patent grants" },
    [PSCustomObject]@{ Id = "gpl-3.0"; Label = "GNU GPLv3"; Desc = "A strong copyleft license" }
)
$currentLicenseIndex = 0
$runningLicense = $true

function Draw-LicenseUI {
    Clear-Host
    $ui = "`n`n"
    $ui += "  ${fgCyan}$l1${resetColor}`n"
    $ui += "  ${fgCyan}$l2${resetColor}`n"
    $ui += "  ${fgGold}$l3${resetColor}`n"
    $ui += "  ${fgGold}$l4${resetColor}`n"
    $ui += "  ${fgGold}$l5${resetColor}`n"
    $ui += "  ${fgGold}$l6${resetColor}`n"
    $ui += "`n ${fgGold}Target: $targetRoot${resetColor}`n"
    $ui += "`n  Select a Project License:`n`n"

    $i = 0
    foreach ($item in $licenses) {
        $prefix = "    "
        if ($i -eq $currentLicenseIndex) {
            $prefix = "  > "
            $ui += "${fgCyan}$prefix$($item.Label) - $($item.Desc)${resetColor}`n"
        }
        else {
            $ui += "$prefix$($item.Label)`n"
        }
        $i++
    }
    
    $ui += "`n`n  ${fgGold}Controls:${resetColor}`n"
    $ui += "  ${fgGold}[Up/Down] Navigate${resetColor}`n"
    $ui += "  ${fgGold}[Enter]   Select License${resetColor}`n"
    
    Write-Host $ui -NoNewline
}

Write-Host $hideCursor -NoNewline
while ($runningLicense) {
    Draw-LicenseUI
    $key = [Console]::ReadKey($true)
    if ($key.Key -eq 'UpArrow') {
        if ($currentLicenseIndex -gt 0) {
            $currentLicenseIndex--
        }
    }
    elseif ($key.Key -eq 'DownArrow') {
        if ($currentLicenseIndex -lt ($licenses.Count - 1)) {
            $currentLicenseIndex++
        }
    }
    elseif ($key.Key -eq 'Enter') {
        $runningLicense = $false
    }
}
Write-Host $showCursor -NoNewline

$selectedLicense = $licenses[$currentLicenseIndex]

Clear-Host
Write-Host "Provisioning project artifacts to $targetRoot..." -ForegroundColor Cyan

$testingSelected = $false
foreach ($item in $state) {
    if ($item.Id -eq "testing" -and $item.Selected) {
        $testingSelected = $true
        break
    }
}

$preFlightJob = $null
if ($testingSelected) {
    $profileName = Get-AgentProfileFromDomain -domain $script:selectedAgentDomain
    $preFlightJob = Start-Job -ScriptBlock {
        param($profileName)
        $binaries = @()
        if ($profileName -eq "web-dev") {
            $binaries = @("node", "npm")
        } elseif ($profileName -eq "database") {
            $binaries = @("sqlite3", "git")
        } else {
            $binaries = @("python", "git")
        }
        $results = @{}
        foreach ($bin in $binaries) {
            $path = Get-Command $bin -ErrorAction SilentlyContinue
            $results[$bin] = ($null -ne $path)
        }
        return $results
    } -ArgumentList $profileName
}

if ($selectedLicense.Id -ne "none") {
    $licensePath = Join-Path -Path $targetRoot -ChildPath "LICENSE.md"
    if (-not (Test-Path -Path $licensePath)) {
        try {
            Write-Host "Fetching $($selectedLicense.Label) text..." -ForegroundColor Cyan
            $licResp = Invoke-RestMethod -Uri "https://api.github.com/licenses/$($selectedLicense.Id)"
            $licenseContent = $licResp.body
            New-Item -ItemType File -Force -Path $licensePath -Value $licenseContent | Out-Null
            Write-Host "Created File: LICENSE.md ($($selectedLicense.Label))" -ForegroundColor Green
        }
        catch {
            Write-Host "Failed to fetch $($selectedLicense.Label). Please add it manually." -ForegroundColor Red
        }
    }
    else {
        Write-Host "Skipped File: LICENSE.md (Already exists)" -ForegroundColor DarkGray
    }
}

foreach ($item in $state) {
    if ($item.Selected) {
        $finalPath = Join-Path -Path $targetRoot -ChildPath $item.Target
        if ($item.Method -eq "mkdir") {
            if (-not (Test-Path -Path $finalPath)) {
                New-Item -ItemType Directory -Force -Path $finalPath | Out-Null
                Write-Host "Created Directory: $($item.Target)" -ForegroundColor Green
            }
            else {
                Write-Host "Skipped Directory: $($item.Target) (Already exists)" -ForegroundColor DarkGray
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
                    else {
                        $sourceVer = "0.0.0"
                        $targetVer = "0.0.0"
                        $shouldUpdate = $false
                        $isLegacy = $false
                        try {
                            $sourceMetaPath = Join-Path -Path $item.Source -ChildPath "meta.json"
                            $targetMetaPath = Join-Path -Path $finalPath -ChildPath "meta.json"
                            if (Test-Path -Path $sourceMetaPath) {
                                $sMeta = Get-Content -Path $sourceMetaPath -Raw | ConvertFrom-Json
                                if ($null -ne $sMeta.version) { $sourceVer = $sMeta.version }
                            }
                            if (Test-Path -Path $targetMetaPath) {
                                $tMeta = Get-Content -Path $targetMetaPath -Raw | ConvertFrom-Json
                                if ($null -ne $tMeta.version) { $targetVer = $tMeta.version }
                            } else {
                                $isLegacy = $true
                            }
                            if ($isLegacy) {
                                $shouldUpdate = $true
                            } else {
                                $shouldUpdate = [version]$sourceVer -gt [version]$targetVer
                            }
                        }
                        catch {}

                        if ($shouldUpdate) {
                            Copy-Item -Path "$($item.Source)\*" -Destination $finalPath -Recurse -Force
                            if ($isLegacy) {
                                Write-Host "Updated Skill: $($item.Label) (Legacy -> v$sourceVer)" -ForegroundColor Green
                            } else {
                                Write-Host "Updated Skill: $($item.Label) (v$targetVer -> v$sourceVer)" -ForegroundColor Green
                            }
                        }
                        else {
                            Write-Host "Skipped Skill: $($item.Label) (Already exists)" -ForegroundColor DarkGray
                        }
                    }
                }
                else {
                    $performedCopy = $false
                    if (-not (Test-Path -Path $finalPath)) {
                        Copy-Item -Path $item.Source -Destination $finalPath -Force
                        Write-Host "Provisioned Artifact: $($item.Label)" -ForegroundColor Green
                        $performedCopy = $true
                    }
                    elseif ($item.Overwrite) {
                        Copy-Item -Path $item.Source -Destination $finalPath -Force
                        Write-Host "Overwrote Artifact: $($item.Label)" -ForegroundColor Green
                        $performedCopy = $true
                    }
                    else {
                        Write-Host "Skipped Artifact: $($item.Label) (Already exists)" -ForegroundColor DarkGray
                    }
                    
                    if ($performedCopy -and $item.Id -eq "agent") {
                        try {
                            $content = Get-Content -Path $finalPath -Raw
                            $newRole = Get-AgentDomainRoleContent -domain $script:selectedAgentDomain
                            $content = $content -replace "(?s)## Role\r?\n(.*?)(?=\r?\n## System Architecture Overview)", "$newRole"
                            
                            $newArch = Get-AgentDomainSystemArchContent -domain $script:selectedAgentDomain
                            $content = $content -replace "(?s)## System Architecture Overview\r?\n(.*?)(?=\r?\n## MANDATORY)", "$newArch"
                            
                            $playwrightDetected = $false
                            foreach ($stateItem in $state) {
                                if ($stateItem.Id -eq "playwright" -and ($stateItem.Selected -or $stateItem.Installed)) {
                                    $playwrightDetected = $true
                                    break
                                }
                            }
                            if ($playwrightDetected) {
                                $oldLine = "\* Ensure that walkthrough documentation includes screenshots where possible, especially to document UI changes\."
                                $newLine = "* Ensure that walkthrough documentation includes screenshots where possible, especially to document UI changes. Use the available Playwright automation skill to programmatically capture high-fidelity screenshots of UI/UX changes and save them directly in the same folder as the version walkthrough document (i.e. project_details/history/v[VERSION]/) before embedding them inline."
                                $content = $content -replace $oldLine, $newLine
                            }
                            
                            $content | Set-Content -Path $finalPath
                        }
                        catch {
                            Write-Host "Warning: Failed to customize AGENT.md focus guidelines." -ForegroundColor Yellow
                        }
                    }
                    if ($performedCopy -and $item.Id -eq "testing") {
                        try {
                            $testingContent = Get-TestingMdContent -domain $script:selectedAgentDomain
                            $testingContent | Set-Content -Path $finalPath
                            
                            $scaffoldScriptsDir = Join-Path -Path $targetRoot -ChildPath "project_details\scripts"
                            if (-not (Test-Path -Path $scaffoldScriptsDir)) {
                                New-Item -ItemType Directory -Force -Path $scaffoldScriptsDir | Out-Null
                            }
                            
                            $profile = Get-AgentProfileFromDomain -domain $script:selectedAgentDomain
                            if ($profile -eq "web-dev") {
                                $validationScriptPath = Join-Path -Path $scaffoldScriptsDir -ChildPath "validate-web-base.ps1"
                                $validationScriptContent = Get-ValidateWebBaseContent
                                $validationScriptContent | Set-Content -Path $validationScriptPath
                            }
                            elseif ($profile -eq "database") {
                                $validationScriptPath = Join-Path -Path $scaffoldScriptsDir -ChildPath "validate-db-schema.ps1"
                                $validationScriptContent = Get-ValidateDbSchemaContent
                                $validationScriptContent | Set-Content -Path $validationScriptPath
                            }
                            else {
                                $validationScriptPath = Join-Path -Path $scaffoldScriptsDir -ChildPath "validate-sys-sandbox.ps1"
                                $validationScriptContent = Get-ValidateSysSandboxContent
                                $validationScriptContent | Set-Content -Path $validationScriptPath
                            }
                            
                            $harnessPath = Join-Path -Path $scaffoldScriptsDir -ChildPath "test-harness.ps1"
                            $harnessContent = Get-TestHarnessContent
                            $harnessContent | Set-Content -Path $harnessPath
                            
                            Write-Host "Provisioned testing harness and validation scripts" -ForegroundColor Green
                        }
                        catch {
                            Write-Host "Warning: Failed to customize TESTING.md focus guidelines." -ForegroundColor Yellow
                        }
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

# Cryptographic Keys
*.key
*.pem
*.cert

# Operating System Files
.DS_Store
Thumbs.db

# Logs
*.log

# misc
apps/
agent.md
todo.md
github.md
firebase.md
design.md
scaffold.ps1
"@

$gitignorePath = Join-Path -Path $targetRoot -ChildPath ".gitignore"
if (-not (Test-Path -Path $gitignorePath)) {
    New-Item -ItemType File -Force -Path $gitignorePath -Value $gitignoreContent | Out-Null
    Write-Host "Created File: .gitignore (Default Security Policy)" -ForegroundColor Green
}

$readmemdPath = Join-Path -Path $targetRoot -ChildPath "README.md"
if (-not (Test-Path -Path $readmemdPath)) {
    $projectTitle = (Get-Item -Path $targetRoot).Name
    $readmemdContent = "# $projectTitle`n`n## Overview`n`nDescription of the project and its purpose.`n`n## Getting Started`n`nInstructions for setting up the project.`n`n## Usage`n`nHow to use the project.`n`n## License`n`nThis project is licensed under the $($licenses[$currentLicenseIndex].Label).`n"
    New-Item -ItemType File -Force -Path $readmemdPath -Value $readmemdContent | Out-Null
    Write-Host "Created File: README.md (Baseline)" -ForegroundColor Green
}

if ($null -ne $preFlightJob) {
    Write-Host "`nWaiting for pre-flight host runtime check..." -ForegroundColor Cyan
    try {
        $results = Wait-Job $preFlightJob -Timeout 5 | Receive-Job
        if ($null -ne $results) {
            Write-Host "`nPre-flight Host Runtime Check Results:" -ForegroundColor Cyan
            $allPassed = $true
            foreach ($bin in $results.Keys) {
                if ($results[$bin]) {
                    Write-Host "  PASS: $bin is installed and available in path." -ForegroundColor Green
                } else {
                    Write-Host "  WARN: $bin was not found in the path. Please ensure it is installed." -ForegroundColor Yellow
                    $allPassed = $false
                }
            }
        }
    }
    catch {
        Write-Host "Warning: Pre-flight check timed out or failed to complete." -ForegroundColor Yellow
    }
    finally {
        Remove-Job $preFlightJob -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "Scaffolding complete" -ForegroundColor Cyan
Write-Host "Press Enter to exit" -ForegroundColor Yellow
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

if ($PSCommandPath -and -not $isLocalDev) {
    Remove-Item -Path $PSCommandPath -Force
}