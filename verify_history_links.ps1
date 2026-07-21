$ErrorActionPreference = "Stop"

Write-Host "Verifying Markdown Image Links in project_details/history..." -ForegroundColor Cyan

$latestHistory = Get-ChildItem -Path "project_details\history" -Directory | Sort-Object Name -Descending | Select-Object -First 1
$mdFiles = @(Get-Item "README.md") + @(Get-ChildItem -Path $latestHistory.FullName -Filter "*.md" -Recurse)

$brokenLinks = 0

foreach ($file in $mdFiles) {
    $content = Get-Content $file.FullName
    # Regex to match Markdown image links: ![alt text](path/to/image.ext)
    $pattern = '!\[.*?\]\((.*?)\)'
    
    $matches = [regex]::Matches($content, $pattern)
    foreach ($match in $matches) {
        $imgPath = $match.Groups[1].Value
        
        # Skip external URLs
        if ($imgPath -match "^https?://") { continue }
        
        # Resolve the relative path from the current file's directory
        $fileDir = Split-Path $file.FullName
        $resolvedPath = Join-Path $fileDir $imgPath
        
        if (-not (Test-Path $resolvedPath)) {
            Write-Host "BROKEN LINK FOUND in $($file.FullName)" -ForegroundColor Red
            Write-Host "  -> $imgPath" -ForegroundColor Yellow
            $brokenLinks++
        }
    }
}

if ($brokenLinks -gt 0) {
    Write-Host "`nVerification FAILED. Found $brokenLinks broken image links." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nVerification SUCCESS. All local image links are valid." -ForegroundColor Green
    exit 0
}
