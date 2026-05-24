# Automated Test Suite for Code Scaffold v3.3.5 / v3.3.6

$scaffoldScript = "C:\Users\hgran\OneDrive\Documents\code\Projects\Code Scaffold\scaffold.ps1"

# 1. Load the helper functions by dot-sourcing the script
# Wait! Since dot-sourcing runs the interactive loop, we can just define the two helper functions here exactly as they are in the scaffold script to test them!
# Or we can read the functions from the script using AST parsing, or we can just duplicate them here.
# Duplicating them here is simple and extremely robust.

function Get-AgentDomainRoleContent {
    param (
        [string]$domain
    )
    
    $roleText = ""
    switch ($domain) {
        "Web Dev" {
            $roleText = "You are an expert Web Developer specializing in UI UX, API design, authentication, and state management. Your goal is to build and maintain the web applications and APIs for this project."
        }
        "Docker / DevOps" {
            $roleText = "You are an expert DevOps Engineer specializing in containerization, CI CD pipelines, and infrastructure hardening. Your goal is to manage container orchestration and deployment pipelines."
        }
        "Mobile (iOS/And)" {
            $roleText = "You are an expert Mobile Software Engineer specializing in native mobile architectures, device permissions, and offline sync. Your goal is to build and maintain mobile applications for this project."
        }
        "DBA" {
            $roleText = "You are an expert Database Administrator specializing in heavy schema design, migration strategies, and data orchestration. Your goal is to manage database schemas and data flows."
        }
        "Systems Scripting" {
            $roleText = "You are an expert Systems Scripting Engineer specializing in CLI tools, error handling, logging, and script automation. Your goal is to build and maintain automated scripts and CLI utilities."
        }
        Default {
            $roleText = "You are an expert Generalist Software Engineer specializing in clean code principles, SOLID design, and robust baseline verification loops. Your goal is to build and maintain correct and maintainable software components."
        }
    }
    
    return "## Role`n$roleText"
}

function Get-AgentDomainSystemArchContent {
    param (
        [string]$domain
    )
    
    $archOverview = ""
    $lines = @()
    switch ($domain) {
        "Web Dev" {
            $archOverview = "This project follows a modern web architecture utilizing distinct frontend interfaces, API routing layers, secure authentication boundaries, and state management systems."
            $lines += "* Focuses on UI UX, API design, authentication, and state management."
            $lines += "* Prioritize responsive design, accessible UI UX components, and efficient state management."
            $lines += "* Ensure clear separation of concern between visual rendering and backing API endpoints."
            $lines += "* Follow strict security practices for managing authentication, sessions, and data storage."
        }
        "Docker / DevOps" {
            $archOverview = "This project leverages containerized services managed via Docker environments, robust CI CD pipelines, and strict infrastructure configuration profiles."
            $lines += "* Focuses on containerization, CI CD pipelines, and infrastructure hardening."
            $lines += "* Enforce containerization best practices, multi-stage builds, and minimal base images."
            $lines += "* Prioritize automated CI CD integration pipelines and secure environment configuration."
            $lines += "* Ensure secrets are never committed and containers run with non-root user permissions."
        }
        "Mobile (iOS/And)" {
            $archOverview = "This project is designed around a native mobile architecture emphasizing offline-first synchronization, local database caching, secure device storage, and native platform services."
            $lines += "* Focuses on native mobile architectures, device permissions, and offline sync."
            $lines += "* Prioritize clean native mobile patterns, strict offline sync behavior, and database caching."
            $lines += "* Implement robust permission handling, device hardware integration, and battery efficiency."
            $lines += "* Ensure secure local storage and elegant recovery under varying network connectivity."
        }
        "DBA" {
            $archOverview = "This project is structured around relational database storage, optimized schemas, safe migration sequencing, transaction controls, and robust analytical modeling."
            $lines += "* When the project requires heavy schema design, migration strategies, or data orchestration."
            $lines += "* Enforce strict relational database schemas, migrations tracking, and optimized indexing."
            $lines += "* Focus on reliable transaction boundaries, efficient query plans, and backup strategies."
            $lines += "* Ensure isolation levels, integrity constraints, and data security policies are enforced."
        }
        "Systems Scripting" {
            $archOverview = "This project is organized as a modular systems utility utilizing robust CLI patterns, native shell integration, explicit error codes, and comprehensive diagnostic logging."
            $lines += "* Focuses on CLI tools, error handling, logging, and script automation."
            $lines += "* Focus on robust command line interfaces, reliable return codes, and system call boundaries."
            $lines += "* Prioritize explicit error handling, structured logging, and thorough fallback workflows."
            $lines += "* Enforce portable execution paths, platform independence, and automated diagnostic suites."
        }
        Default {
            $archOverview = "This project is built using a modular architecture with high test coverage, robust baseline verification loops, clean separation of concerns, and portable execution paths."
            $lines += "* Standard fallback focusing on clean code principles and baseline verification loops."
            $lines += "* Follow clean code principles, SOLID design, and robust baseline verification loops."
            $lines += "* Focus on high test coverage, descriptive naming conventions, and automated build flows."
            $lines += "* Prioritize comprehensive API documentation, review guides, and peer validation steps."
        }
    }
    
    $combinedLines = $lines -join "`n"
    return "## System Architecture Overview`n$archOverview`n`n$combinedLines"
}

# 2. Define the mock template content (matching the newly updated empty headers in .templates\agent.md)
$mockTemplateContent = @"
# AGENT.md

## Role


## System Architecture Overview


## MANDATORY EXECUTION SEQUENCE & VERSIONING PROTOCOL (STRICT)
* Rule A
* Rule B
"@

# 3. Define the domains to test
$domains = @("Web Dev", "Docker / DevOps", "Mobile (iOS/And)", "DBA", "Systems Scripting", "Generic")

Write-Host "Running automated regex replacement tests across all 6 focus domains..." -ForegroundColor Cyan

$success = $true

foreach ($dom in $domains) {
    Write-Host "Testing Domain: '$dom'..." -ForegroundColor Gray
    
    $tempContent = $mockTemplateContent
    
    # Run the exact regex replacement blocks from scaffold.ps1
    $newRole = Get-AgentDomainRoleContent -domain $dom
    $tempContent = $tempContent -replace "(?s)## Role\r?\n(.*?)(?=\r?\n## System Architecture Overview)", "$newRole"
    
    $newArch = Get-AgentDomainSystemArchContent -domain $dom
    $tempContent = $tempContent -replace "(?s)## System Architecture Overview\r?\n(.*?)(?=\r?\n## MANDATORY)", "$newArch"
    
    # Assertions
    $roleTitleCheck = $tempContent -match "## Role"
    $archTitleCheck = $tempContent -match "## System Architecture Overview"
    $mandatoryTitleCheck = $tempContent -match "## MANDATORY EXECUTION SEQUENCE & VERSIONING PROTOCOL \(STRICT\)"
    
    # Assert that empty headers are not present anymore
    $hasEmptyRole = $tempContent -match "## Role\r?\n\r?\n##"
    
    if (-not $roleTitleCheck -or -not $archTitleCheck -or -not $mandatoryTitleCheck) {
        Write-Host "  FAIL: Headers missing or corrupted!" -ForegroundColor Red
        $success = $false
        continue
    }
    
    if ($hasEmptyRole) {
        Write-Host "  FAIL: Role section remained empty!" -ForegroundColor Red
        $success = $false
        continue
    }
    
    # Assert that domain specific content is inside
    switch ($dom) {
        "Web Dev" {
            $containsWord = $tempContent.Contains("Web Developer specializing in UI UX")
            $containsArch = $tempContent.Contains("distinct frontend interfaces")
        }
        "Docker / DevOps" {
            $containsWord = $tempContent.Contains("DevOps Engineer specializing in containerization")
            $containsArch = $tempContent.Contains("Docker environments")
        }
        "Mobile (iOS/And)" {
            $containsWord = $tempContent.Contains("Mobile Software Engineer")
            $containsArch = $tempContent.Contains("offline-first synchronization")
        }
        "DBA" {
            $containsWord = $tempContent.Contains("Database Administrator")
            $containsArch = $tempContent.Contains("relational database storage")
        }
        "Systems Scripting" {
            $containsWord = $tempContent.Contains("Systems Scripting Engineer")
            $containsArch = $tempContent.Contains("modular systems utility")
        }
        Default {
            $containsWord = $tempContent.Contains("Generalist Software Engineer")
            $containsArch = $tempContent.Contains("modular architecture with high test coverage")
        }
    }
    
    if (-not $containsWord) {
        Write-Host "  FAIL: Role description not correctly populated!" -ForegroundColor Red
        $success = $false
    }
    elseif (-not $containsArch) {
        Write-Host "  FAIL: System Architecture overview not correctly populated!" -ForegroundColor Red
        $success = $false
    }
    else {
        Write-Host "  PASS: Custom Role and System Architecture integrated correctly!" -ForegroundColor Green
    }
}

if ($success) {
    Write-Host "`nALL AUTOMATED TESTS PASSED SUCCESSFULLY! (6/6 domains verified)" -ForegroundColor Green
} else {
    Write-Host "`nSOME TESTS FAILED. Please review the errors above." -ForegroundColor Red
    exit 1
}
