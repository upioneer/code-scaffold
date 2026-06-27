# Version 4.5.1

## Bug Fixes & Optimizations
* **CI/CD Pipeline Deprecation Mitigation**: 
  * Refactored the core `.github/workflows/release.yml` pipeline to eliminate Node.js 20 deprecation warnings.
  * Corrected invalid GitHub Action version references (reverted unreleased `@v5` dependencies back to official `@v4` targets).
  * Upgraded the overarching CI/CD runner architecture from `ubuntu-latest` directly to `ubuntu-24.04` to ensure native execution on Node.js 22 runtimes, preventing future matrix distribution failures.
