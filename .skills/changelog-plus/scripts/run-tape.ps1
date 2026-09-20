param (
    [Parameter(Mandatory = $true)]
    [string]$TapePath,
    [Parameter(Mandatory = $true)]
    [string]$Version,
    [string]$ChangelogRoot = $env:CHANGELOG_DIR
)

$ErrorActionPreference = 'Stop'

function Resolve-ChangelogRoot {
    if ($ChangelogRoot) { return $ChangelogRoot }
    $persisted = Join-Path $PWD 'project_details/changelog/.changelog-dir'
    if (Test-Path $persisted) {
        $saved = (Get-Content $persisted | Select-Object -First 1).Trim()
        if ($saved) { return $saved }
    }
    return (Join-Path $PWD 'project_details/changelog')
}

if (-not (Test-Path $TapePath)) { throw "Tape not found: $TapePath" }

$root = Resolve-ChangelogRoot
$ChangelogDir = Join-Path $root "v$Version"
if (-not (Test-Path $ChangelogDir)) { New-Item -ItemType Directory -Force -Path $ChangelogDir | Out-Null }

$isWin = $IsWindows -or ($PSVersionTable.Platform -match 'Win') -or ($env:OS -match 'Windows')

if ($isWin) {
    if (Get-Command wsl -ErrorAction SilentlyContinue) {
        $cleanWinPath = $PWD.Path -replace '\\', '/'
        $wslPath = (wsl wslpath -u $cleanWinPath).Trim()
        if (-not $wslPath) { throw 'wslpath translation failed: capture needs a working WSL interop path' }
        wsl bash -c 'command -v vhs && command -v ffmpeg && command -v ttyd' | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'WSL capture deps missing (need vhs, ffmpeg, ttyd in /usr/local/bin)' }
        $wslTape = ($TapePath -replace '\\', '/')
        $bridge = @('export PATH=/usr/local/bin:$PATH', "cd '$wslPath'", "vhs '$wslTape'") -join "`n"
        $bridgePath = Join-Path $PWD 'run_tape.sh'
        [IO.File]::WriteAllText($bridgePath, $bridge + "`n")
        try {
            wsl bash run_tape.sh
            if ($LASTEXITCODE -ne 0) { throw "capture exited with code $LASTEXITCODE" }
        } finally {
            Remove-Item $bridgePath -Force -ErrorAction SilentlyContinue
        }
    } elseif (Get-Command vhs -ErrorAction SilentlyContinue) {
        vhs $TapePath
        if ($LASTEXITCODE -ne 0) { throw "capture exited with code $LASTEXITCODE" }
    } else {
        throw 'No capture backend found (neither wsl nor native vhs). Resolve the pipeline before releasing.'
    }
} elseif (Get-Command vhs -ErrorAction SilentlyContinue) {
    vhs $TapePath
    if ($LASTEXITCODE -ne 0) { throw "capture exited with code $LASTEXITCODE" }
} else {
    throw 'vhs is not installed. Resolve the pipeline before releasing.'
}

foreach ($f in @('demo.gif', 'demo.png', 'demo_splash.png', 'demo_main.png', 'demo_final.png')) {
    $src = Join-Path $PWD $f
    if (Test-Path $src) { Move-Item -Force $src (Join-Path $ChangelogDir $f) }
}

$produced = @(Get-ChildItem -Path $ChangelogDir -Filter 'demo*' -ErrorAction SilentlyContinue)
if ($produced.Count -eq 0) {
    throw "Capture produced no media assets in $ChangelogDir. Resolve the pipeline before releasing."
}

Write-Output "Capture complete: $($produced.Count) assets in $ChangelogDir"
