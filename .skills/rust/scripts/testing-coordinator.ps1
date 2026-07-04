$ErrorActionPreference = "Stop"

Write-Host "[Testing Coordinator] Running unit and integration tests..."
cargo test --workspace
if ($LASTEXITCODE -ne 0) { throw "cargo test failed" }

Write-Host "[Testing Coordinator] Compiling and running benchmark suites..."
cargo bench --workspace
if ($LASTEXITCODE -ne 0) { throw "cargo bench failed" }

Write-Host "[Testing Coordinator] All tests and benchmarks passed."
