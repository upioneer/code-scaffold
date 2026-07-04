$ErrorActionPreference = "Stop"

$Arch = (Get-CimInstance Win32_Processor).Architecture
$ArchString = switch ($Arch) {
    0 { "x86" }
    9 { "x86_64" }
    12 { "ARM64" }
    default { "Unknown" }
}

Write-Host "[Architecture Evaluator] Host Operating System: Windows"
Write-Host "[Architecture Evaluator] Host Architecture: $ArchString"

if ($ArchString -eq "x86_64") {
    Write-Host "[Architecture Evaluator] Standard x86_64 architecture detected."
} elseif ($ArchString -eq "ARM64") {
    Write-Host "[Architecture Evaluator] ARM64 architecture detected. Ensure cross-compilation targets are configured if building for x86_64."
} else {
    Write-Host "[Architecture Evaluator] Unknown architecture: $ArchString"
}
