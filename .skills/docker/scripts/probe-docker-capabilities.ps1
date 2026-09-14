param(
    [string]$SocketPath = "/var/run/docker.sock",
    [string]$TriggerDir = "./data"
)

# Tier 1: Check Docker CLI or Named Pipe / Socket
$socketAvailable = $false
if ($IsLinux -or $IsMacOS) {
    if ((Test-Path $SocketPath)) {
        $socketAvailable = $true
    }
} else {
    if ((Get-Command docker -ErrorAction SilentlyContinue)) {
        $ping = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            $socketAvailable = $true
        }
    }
}

if ($socketAvailable) {
    @{
        tier = 1
        mode = "docker_socket"
        description = "Direct Docker Engine API is accessible. Autonomous in-place container swaps enabled."
    } | ConvertTo-Json -Compress
    exit 0
}

# Tier 2: Check persistent trigger directory
if ((Test-Path $TriggerDir)) {
    try {
        $testFile = Join-Path $TriggerDir ".perm_test_$([System.Guid]::NewGuid().ToString().Substring(0, 8))"
        Set-Content -Path $testFile -Value "test" -Force
        Remove-Item -Path $testFile -Force
        @{
            tier = 2
            mode = "trigger_file"
            description = "Docker socket is not available, but persistent host storage is writable. Semi-autonomous trigger file upgrades enabled."
        } | ConvertTo-Json -Compress
        exit 0
    } catch {
        # Not writable
    }
}

# Tier 3: Manual Fallback
@{
    tier = 3
    mode = "manual"
    description = "Neither socket nor trigger volume available. Fallback to manual terminal upgrade instructions."
} | ConvertTo-Json -Compress
exit 0
