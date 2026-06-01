# deploy/deploy.ps1
# Reads credentials from ../.env and deploys the site to the LXC
# Uses plink/pscp (PuTTY) for non-interactive SSH/SCP

$ErrorActionPreference = "Stop"

# ── Load .env ──────────────────────────────────────────────────
$envFile = Join-Path $PSScriptRoot "../.env"
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^([^=]+)=(.+)$") {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}
$pw = $envVars["ssh_pw"]
$target = "user@IPorHOSTNAME"
$hk = "SHA256:YourKeyHere"  # server ED25519
$plink = "C:\Program Files\PuTTY\plink.exe"
$pscp = "C:\Program Files\PuTTY\pscp.exe"

Write-Host "==> Verifying connection..."
& $plink -batch -hostkey $hk -pw $pw $target "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) { throw "SSH connection failed" }

Write-Host "==> Installing public key for passwordless future access..."
$pubKey = $envVars["ssh_key"]
& $plink -batch -hostkey $hk -pw $pw $target "mkdir -p ~/.ssh; grep -qxF '$pubKey' ~/.ssh/authorized_keys 2>/dev/null || echo '$pubKey' >> ~/.ssh/authorized_keys; chmod 700 ~/.ssh; chmod 600 ~/.ssh/authorized_keys; echo key_ok"

Write-Host "==> Copying dist/ to LXC..."
& $plink -batch -hostkey $hk -pw $pw $target "rm -rf /tmp/test-site-dist && mkdir -p /tmp/test-site-dist"
& $pscp -batch -hostkey $hk -pw $pw -r "$PSScriptRoot/../dist" "${target}:/tmp/test-site-dist"
if ($LASTEXITCODE -ne 0) { throw "SCP of dist/ failed" }

Write-Host "==> Copying deploy/ scripts to LXC..."
& $plink -batch -hostkey $hk -pw $pw $target "rm -rf /tmp/test-site-deploy && mkdir -p /tmp/test-site-deploy"
& $pscp -batch -hostkey $hk -pw $pw -r "$PSScriptRoot" "${target}:/tmp/test-site-deploy"
if ($LASTEXITCODE -ne 0) { throw "SCP of deploy/ failed" }

Write-Host "==> Running setup on LXC..."
# pscp places 'deploy/' folder inside /tmp/test-site-deploy/ → path is /tmp/test-site-deploy/deploy/setup-lxc.sh
& $plink -batch -hostkey $hk -pw $pw $target "echo '$($pw)' | sudo -S bash /tmp/test-site-deploy/deploy/setup-lxc.sh"
if ($LASTEXITCODE -ne 0) { throw "setup-lxc.sh failed" }

Write-Host ""
Write-Host "✅ Deployment complete! http://YourIPAddress/"
