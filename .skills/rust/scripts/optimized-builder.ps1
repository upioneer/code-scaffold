$ErrorActionPreference = "Stop"

Write-Host "[Optimized Builder] Building with release optimizations..."
cargo build --release
if ($LASTEXITCODE -ne 0) { throw "cargo build failed" }

Write-Host "[Optimized Builder] Build complete."
