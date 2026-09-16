param(
    [string]$ProjectId,
    [string]$DisplayName,
    [string]$TargetEnvFile = ".env.local",
    [string]$TargetMdFile = "firebase.md",
    [string]$Region = "us-central1"
)

$ErrorActionPreference = "Stop"

# 1. Derive candidate clean ID if not supplied
if (-not $ProjectId) {
    $folderName = (Split-Path (Get-Location) -Leaf).ToLower()
    $candidate = ($folderName -replace "[^a-z0-9]", "-") -replace "-+", "-"
    $candidate = $candidate.Trim("-")
    if ($candidate.Length -lt 6) {
        $candidate = "$candidate-app"
    }
    if ($candidate.Length -gt 30) {
        $candidate = $candidate.Substring(0, 30).Trim("-")
    }
    $ProjectId = $candidate
}

# 2. Validate Project ID format (Firebase / Google Cloud rules: 6-30 chars, lowercase, letters, numbers, hyphens)
$ProjectId = $ProjectId.ToLower().Trim()
if ($ProjectId -notmatch "^[a-z][a-z0-9-]{4,28}[a-z0-9]$") {
    $err = @{
        status = "error"
        message = "Invalid Project ID format '$ProjectId'. Project IDs must be 6-30 characters, lowercase letters, numbers, or hyphens, starting with a letter and not ending with a hyphen."
    }
    $err | ConvertTo-Json -Compress
    exit 1
}

if (-not $DisplayName) {
    $DisplayName = $ProjectId
}

Write-Host "Verifying Firebase authentication..." -ForegroundColor Cyan

# 3. Check CLI authentication
try {
    $projectsListRaw = npx -y firebase-tools@latest projects:list --json 2>&1 | Out-String
    $jsonBlock = if ($projectsListRaw -match '(?s)(\{.*\})') { $matches[1] } else { $projectsListRaw }
    $projectsListJson = $jsonBlock | ConvertFrom-Json
} catch {
    $err = @{
        status = "auth_required"
        message = "Firebase CLI is not authenticated. Please run 'npx -y firebase-tools@latest login' and re-run."
    }
    $err | ConvertTo-Json -Compress
    exit 1
}

# 4. Check if project already exists in user account
$existingProject = $null
if ($projectsListJson -and $projectsListJson.result) {
    $existingProject = $projectsListJson.result | Where-Object { $_.projectId -eq $ProjectId }
}

if ($existingProject) {
    Write-Host "Found existing project '$ProjectId' in your account. Using existing project." -ForegroundColor Green
} else {
    Write-Host "Creating new Firebase project '$ProjectId' ('$DisplayName')..." -ForegroundColor Cyan
    $createOutput = npx -y firebase-tools@latest projects:create $ProjectId --display-name "$DisplayName" 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        $debugDetails = ""
        if (Test-Path "firebase-debug.log") {
            $debugContent = Get-Content "firebase-debug.log" -Raw
            if ($debugContent -match "field \[project_id\] has issue \[(.*?)\]") {
                $debugDetails = $matches[1]
            } elseif ($debugContent -match "HTTP Error: \d+, (.*)") {
                $debugDetails = $matches[1]
            }
            Remove-Item "firebase-debug.log" -Force -ErrorAction SilentlyContinue
        }

        # Check if already taken globally on Google Cloud
        if ($createOutput -match "already exists" -or $createOutput -match "conflict" -or $createOutput -match "409" -or $debugDetails -match "already exists" -or $debugDetails -match "conflict") {
            $suggestions = @(
                "$ProjectId-app",
                "$ProjectId-web",
                "$ProjectId-hub",
                "$ProjectId-dev"
            )
            $err = @{
                status = "conflict"
                project_id = $ProjectId
                message = "Project ID '$ProjectId' is already taken globally on Google Cloud. Because this ID maps directly to your hosting URL (https://$ProjectId.web.app), please select a clean semantic variation or enter a custom alternative."
                clean_suggestions = $suggestions
                hosting_preview = @{
                    proposed = "https://$ProjectId.web.app"
                    alternatives = ($suggestions | ForEach-Object { "https://$_.web.app" })
                }
            }
            $err | ConvertTo-Json -Compress
            exit 1
        } elseif ($debugDetails) {
            $err = @{
                status = "error"
                message = "Failed to create Firebase project: $debugDetails"
            }
            $err | ConvertTo-Json -Compress
            exit 1
        } else {
            $err = @{
                status = "error"
                message = "Failed to create Firebase project: $createOutput"
            }
            $err | ConvertTo-Json -Compress
            exit 1
        }
    }
    Write-Host "Project '$ProjectId' created successfully on Google Cloud." -ForegroundColor Green
}

# 5. Check or register Web App
Write-Host "Querying registered apps for project '$ProjectId'..." -ForegroundColor Cyan
$appsRaw = npx -y firebase-tools@latest apps:list WEB --project $ProjectId --json 2>&1 | Out-String
$appsJson = $null
try {
    $appsBlock = if ($appsRaw -match '(?s)(\{.*\})') { $matches[1] } else { $appsRaw }
    $appsJson = $appsBlock | ConvertFrom-Json
} catch {}

$webApp = $null
if ($appsJson -and $appsJson.result -and $appsJson.result.Count -gt 0) {
    $webApp = $appsJson.result[0]
} else {
    Write-Host "Registering new Web App '$DisplayName Web'..." -ForegroundColor Cyan
    $createAppOut = npx -y firebase-tools@latest apps:create WEB "$DisplayName Web" --project $ProjectId 2>&1 | Out-String
    Start-Sleep -Seconds 2
    $appsRaw = npx -y firebase-tools@latest apps:list WEB --project $ProjectId --json 2>&1 | Out-String
    try {
        $appsBlock2 = if ($appsRaw -match '(?s)(\{.*\})') { $matches[1] } else { $appsRaw }
        $appsJson = $appsBlock2 | ConvertFrom-Json
        if ($appsJson -and $appsJson.result -and $appsJson.result.Count -gt 0) {
            $webApp = $appsJson.result[0]
        }
    } catch {}
}

# 6. Retrieve SDK Config
Write-Host "Retrieving client SDK configuration..." -ForegroundColor Cyan
$sdkConfigRaw = npx -y firebase-tools@latest apps:sdkconfig WEB --project $ProjectId 2>&1 | Out-String

# Parse configuration fields using regex
$apiKey = if ($sdkConfigRaw -match 'apiKey:\s*["\x27]([^"\x27]+)["\x27]') { $matches[1] } else { "" }
$authDomain = if ($sdkConfigRaw -match 'authDomain:\s*["\x27]([^"\x27]+)["\x27]') { $matches[1] } else { "$ProjectId.firebaseapp.com" }
$projectIdOut = if ($sdkConfigRaw -match 'projectId:\s*["\x27]([^"\x27]+)["\x27]') { $matches[1] } else { $ProjectId }
$storageBucket = if ($sdkConfigRaw -match 'storageBucket:\s*["\x27]([^"\x27]+)["\x27]') { $matches[1] } else { "$ProjectId.appspot.com" }
$messagingSenderId = if ($sdkConfigRaw -match 'messagingSenderId:\s*["\x27]([^"\x27]+)["\x27]') { $matches[1] } else { "" }
$appId = if ($sdkConfigRaw -match 'appId:\s*["\x27]([^"\x27]+)["\x27]') { $matches[1] } else { "" }
$measurementId = if ($sdkConfigRaw -match 'measurementId:\s*["\x27]([^"\x27]+)["\x27]') { $matches[1] } else { "" }

# 7. Write or update target .env file
$envContent = ""
if ((Test-Path $TargetEnvFile)) {
    $envContent = Get-Content $TargetEnvFile -Raw
}

$firebaseEnvKeys = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY" = $apiKey
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = $authDomain
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = $projectIdOut
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = $storageBucket
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = $messagingSenderId
    "NEXT_PUBLIC_FIREBASE_APP_ID" = $appId
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" = $measurementId
}

foreach ($k in $firebaseEnvKeys.Keys) {
    $val = $firebaseEnvKeys[$k]
    if ($val) {
        if ($envContent -match "^$k=.*$") {
            $envContent = $envContent -replace "(?m)^$k=.*$", "$k=$val"
        } else {
            $envContent = $envContent.TrimEnd() + "`n$k=$val`n"
        }
    }
}
Set-Content -Path $TargetEnvFile -Value $envContent.Trim() -Force
Write-Host "Updated environment credentials in $TargetEnvFile" -ForegroundColor Green

# 8. Write .firebaserc
$firebaserc = @{
    projects = @{
        default = $ProjectId
    }
}
$firebaserc | ConvertTo-Json -Depth 3 | Set-Content -Path ".firebaserc" -Force
Write-Host "Created .firebaserc pointing to $ProjectId" -ForegroundColor Green

# 9. Update firebase.md if present
if ((Test-Path $TargetMdFile)) {
    $md = Get-Content $TargetMdFile -Raw
    $md = $md -replace "(?m)^* **Project ID:**.*$", "* **Project ID:** $ProjectId"
    $md = $md -replace "(?m)^* **Hosting Site ID:**.*$", "* **Hosting Site ID:** $ProjectId"
    $md = $md -replace "(?m)^* **Default Hosting URL:**.*$", "* **Default Hosting URL:** https://$ProjectId.web.app"
    $md = $md -replace "(?m)^* **Secondary Hosting URL:**.*$", "* **Secondary Hosting URL:** https://$ProjectId.firebaseapp.com"
    $md = $md -replace "(?m)^* **Region:**.*$", "* **Region:** $Region"
    Set-Content -Path $TargetMdFile -Value $md -Force
    Write-Host "Updated $TargetMdFile with live project parameters" -ForegroundColor Green
}

# 10. Generate clean firebase.json if not present
if (-not (Test-Path "firebase.json")) {
    $firebaseJson = @{
        hosting = @{
            public = "out"
            ignore = @("firebase.json", "**/.*", "**/node_modules/**")
            rewrites = @(
                @{
                    source = "**"
                    destination = "/index.html"
                }
            )
        }
    }
    $firebaseJson | ConvertTo-Json -Depth 5 | Set-Content -Path "firebase.json" -Force
    Write-Host "Created default firebase.json" -ForegroundColor Green
}

$output = @{
    status = "success"
    project_id = $ProjectId
    display_name = $DisplayName
    hosting_url_primary = "https://$ProjectId.web.app"
    hosting_url_secondary = "https://$ProjectId.firebaseapp.com"
    target_env = $TargetEnvFile
    target_md = $TargetMdFile
    credentials = @{
        api_key_present = [bool]$apiKey
        app_id = $appId
        auth_domain = $authDomain
    }
}

$output | ConvertTo-Json -Compress
