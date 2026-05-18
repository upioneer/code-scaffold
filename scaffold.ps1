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
}

$state += [PSCustomObject]@{
    Category        = "Apps"
    Id              = "docs"
    Label           = "Documentation (/docs)"
    Target          = "docs"
    Method          = "mkdir"
    Source          = $null
    Selected        = $false
    Exists          = Test-Path -Path (Join-Path -Path $targetRoot -ChildPath "docs")
    UpdateAvailable = $false
    VersionStr      = ""
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
        }
    }
}

$currentIndex = 0
$running = $true

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

Write-Host ""
Write-Host "Scaffolding complete" -ForegroundColor Cyan
Write-Host "Press Enter to exit" -ForegroundColor Yellow
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

if ($PSCommandPath -and -not $isLocalDev) {
    Remove-Item -Path $PSCommandPath -Force
}