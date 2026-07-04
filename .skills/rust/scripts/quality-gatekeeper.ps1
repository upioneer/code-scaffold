$ErrorActionPreference = "Stop"

Write-Host "[Quality Gatekeeper] Running cargo fmt..."
cargo fmt --all -- --check
if ($LASTEXITCODE -ne 0) { throw "cargo fmt failed" }

Write-Host "[Quality Gatekeeper] Running cargo clippy..."
cargo clippy --workspace --all-targets --all-features -- -D warnings
if ($LASTEXITCODE -ne 0) { throw "cargo clippy failed" }

Write-Host "[Quality Gatekeeper] Code hygiene passed."
