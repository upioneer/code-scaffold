$ErrorActionPreference = "Stop"

[console]::OutputEncoding = [System.Text.Encoding]::UTF8
$host.ui.RawUI.WindowTitle = "Code Scaffold"

try {
    $minWidth = 110
    $minHeight = 45
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
$fgGold = "$esc[38;2;255;190;0m"
$fgCyan = "$esc[38;2;0;255;255m"
$resetColor = "$esc[0m"
$hideCursor = "$esc[?25l"
$showCursor = "$esc[?25h"
$homeCursor = "$esc[H"

Clear-Host
Write-Host "`n`n`n"
$b = [char]9608
$l1 = "       ####### #######  #####  ####### #######  ######  ##      ######  ".Replace('#', $b)
$l2 = "       ##      ##      ##   ## ##      ##      ##    ## ##      ##   ## ".Replace('#', $b)
$l3 = "       ####### ##      ####### #####   #####   ##    ## ##      ##   ## ".Replace('#', $b)
$l4 = "            ## ##      ##   ## ##      ##      ##    ## ##      ##   ## ".Replace('#', $b)
$l5 = "       ####### ####### ##   ## ##      ##       ######  ####### ######  ".Replace('#', $b)

Write-Host "${fgWhite}$l1"
Start-Sleep -Milliseconds 200
Write-Host "${fgWhite}$l2"
Start-Sleep -Milliseconds 200
Write-Host "${fgGold}$l3"
Start-Sleep -Milliseconds 200
Write-Host "${fgGold}$l4"
Start-Sleep -Milliseconds 200
Write-Host "${fgGold}$l5${resetColor}"
Start-Sleep -Milliseconds 200
Write-Host "`n`n"

Write-Host "Target Directory Selection" -ForegroundColor Cyan
$targetRoot = Read-Host "Enter target path (Leave blank for current directory: $PSScriptRoot)"

if ([string]::IsNullOrWhiteSpace($targetRoot)) {
    $targetRoot = $PSScriptRoot
}

if (-not (Test-Path -Path $targetRoot)) {
    Write-Host "Path does not exist. Creating directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null
}

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

$templatesDir = Join-Path -Path $workDir -ChildPath ".templates"
$skillsDir = Join-Path -Path $workDir -ChildPath ".skills"
$syncCachePath = Join-Path -Path $workDir -ChildPath ".sync_cache.json"

if (-not $isLocalDev) {
    if (-not (Test-Path -Path $templatesDir)) {
        New-Item -ItemType Directory -Force -Path $templatesDir | Out-Null
    }
    if (-not (Test-Path -Path $skillsDir)) {
        New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null
    }
}

$localVersion = "0.0.0"
if (Test-Path -Path $syncCachePath) {
    $cacheData = Get-Content -Path $syncCachePath -Raw | ConvertFrom-Json
    if ($null -ne $cacheData.version) {
        $localVersion = $cacheData.version
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

$state = @()

$state += [PSCustomObject]@{
    Category = "Apps"
    Id       = "src"
    Label    = "Source Code (/src)"
    Target   = "src"
    Method   = "mkdir"
    Source   = $null
    Selected = $false
}

$state += [PSCustomObject]@{
    Category = "Apps"
    Id       = "tests"
    Label    = "Test Suite (/tests)"
    Target   = "tests"
    Method   = "mkdir"
    Source   = $null
    Selected = $false
}

$state += [PSCustomObject]@{
    Category = "Apps"
    Id       = "docs"
    Label    = "Documentation (/docs)"
    Target   = "docs"
    Method   = "mkdir"
    Source   = $null
    Selected = $false
}

if (Test-Path -Path $templatesDir) {
    $templateItems = Get-ChildItem -Path $templatesDir -File
    foreach ($file in $templateItems) {
        $targetFile = "project_details\$($file.Name)"
        if ($file.Name -match "(?i)^(readme|license)\.md$") {
            $targetFile = $file.Name
        }
        $state += [PSCustomObject]@{
            Category = "Artifacts"
            Id       = $file.BaseName
            Label    = $file.Name
            Target   = $targetFile
            Method   = "copy"
            Source   = $file.FullName
            Selected = $false
        }
    }
}

if (Test-Path -Path $skillsDir) {
    $skillItems = Get-ChildItem -Path $skillsDir -Directory
    foreach ($folder in $skillItems) {
        $displayLabel = $folder.Name
        $targetDir = ".skills\$($folder.Name)"
        $metaPath = Join-Path -Path $folder.FullName -ChildPath "meta.json"
        if (Test-Path -Path $metaPath) {
            $metaContent = Get-Content -Path $metaPath -Raw | ConvertFrom-Json
            if ($null -ne $metaContent.label) {
                $displayLabel = $metaContent.label
            }
            if ($null -ne $metaContent.target) {
                $targetDir = $metaContent.target
            }
        }
        $state += [PSCustomObject]@{
            Category = "Agent Skills"
            Id       = $folder.Name
            Label    = $displayLabel
            Target   = $targetDir
            Method   = "copy"
            Source   = $folder.FullName
            Selected = $false
        }
    }
}

$currentIndex = 0
$running = $true

function Draw-UI {
    Clear-Host
    $ui = "`n`n"
    $ui += "${fgWhite}$l1`n"
    $ui += "${fgWhite}$l2`n"
    $ui += "${fgGold}$l3`n"
    $ui += "${fgGold}$l4`n"
    $ui += "${fgGold}$l5${resetColor}`n"
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
        
        if ($i -eq $currentIndex) {
            $ui += "${fgCyan}$prefix$box $($item.Label)${resetColor}`n"
        }
        else {
            $ui += "$prefix$box $($item.Label)`n"
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
        $state[$currentIndex].Selected = -not $state[$currentIndex].Selected
    }
    elseif ($key.Key -eq 'T') {
        $anyUnselected = $false
        foreach ($item in $state) {
            if (-not $item.Selected) {
                $anyUnselected = $true
                break
            }
        }
        foreach ($item in $state) {
            $item.Selected = $anyUnselected
        }
    }
    elseif ($key.Key -eq 'Enter') {
        $running = $false
    }
}
Write-Host $showCursor -NoNewline

Clear-Host
Write-Host "Provisioning project artifacts to $targetRoot..." -ForegroundColor Cyan
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
                            }
                            $shouldUpdate = [version]$sourceVer -gt [version]$targetVer
                        }
                        catch {}

                        if ($shouldUpdate) {
                            Copy-Item -Path "$($item.Source)\*" -Destination $finalPath -Recurse -Force
                            Write-Host "Updated Skill: $($item.Label) (v$targetVer -> v$sourceVer)" -ForegroundColor Green
                        }
                        else {
                            Write-Host "Skipped Skill: $($item.Label) (Already exists)" -ForegroundColor DarkGray
                        }
                    }
                }
                else {
                    if (-not (Test-Path -Path $finalPath)) {
                        Copy-Item -Path $item.Source -Destination $finalPath -Force
                        Write-Host "Provisioned Artifact: $($item.Label)" -ForegroundColor Green
                    }
                    else {
                        Write-Host "Skipped Artifact: $($item.Label) (Already exists)" -ForegroundColor DarkGray
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
"@

$gitignorePath = Join-Path -Path $targetRoot -ChildPath ".gitignore"
if (-not (Test-Path -Path $gitignorePath)) {
    New-Item -ItemType File -Force -Path $gitignorePath -Value $gitignoreContent | Out-Null
    Write-Host "Created File: .gitignore (Default Security Policy)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Scaffolding complete" -ForegroundColor Cyan
Write-Host "Press Enter to exit" -ForegroundColor Yellow
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

if ($PSCommandPath -and -not $isLocalDev) {
    Remove-Item -Path $PSCommandPath -Force
}