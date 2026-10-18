---
​‌‍name: GitHub
description: GitHub repository management, structured issue intake forms, .env-based identity, pre-commit hygiene, and CI/CD automation
version: 8
---

# GitHub Push Skill & Workflow

This skill manages all GitHub interactions. GitHub configuration (identity, remote URL, visibility) is stored strictly in the project's root `.env` file (referencing `.env.example`) rather than hardcoded in project documentation. This allows multiple contributors to maintain their own local credentials without polluting version-tracked files.

## Step 1: .env GitHub Configuration : Self-Heal

Before any other action, the agent must verify and self-heal the `.env` file in the project root to ensure GitHub credentials are present.

### Required .env Variables

```ini
# ── GITHUB CONFIGURATION ────────────────────────────────────────
GITHUB_USER=
GITHUB_EMAIL=
GITHUB_REMOTE_URL=
GITHUB_VISIBILITY=public
GITHUB_BRANCH=main
```

### Self-Heal Sequence

1. **Check for `.env`**: If the file does not exist, create it with the full GitHub configuration block above as a template (referencing `.env.example`), warn the user to populate it, and halt.
2. **Check for missing keys**: Read the existing `.env`. If any of the five `GITHUB_` keys are absent, append the missing keys as empty placeholder lines. Warn the user which keys were added and halt until they are filled.
3. **Check for empty values**: If any required key exists but has an empty value (e.g. `GITHUB_USER=`), prompt the user to provide the missing value before continuing.
4. **Protect `.env`**: Verify `.env` is listed in `.gitignore`. If `.gitignore` does not exist, create it with `.env` as the first entry. If it exists but is missing the `.env` entry, append it.

### Reading Variables

Once the `.env` is verified, read and apply the values:

* `GITHUB_USER` : used for `git config user.name`
* `GITHUB_EMAIL` : used for `git config user.email`
* `GITHUB_REMOTE_URL` : used for `git remote add origin` / `git remote set-url origin`
* `GITHUB_VISIBILITY` : document only (Public or Private); prompt user if unset
* `GITHUB_BRANCH` : default push target (typically `main`)

## Step 2: Fetch and Check Status

Run `git fetch` followed by `git status` to determine the relationship between the local branch and the remote (ahead, behind, or diverged).

## Step 3: Handle Edge Cases (Mismatches)

If the local branch does not match the remote (diverged branches, remote has new commits, or other conflicts):

* **DO NOT** automatically push, pull, merge, or force anything.
* Explain the exact mismatch to the user in plain English and offer these specific options:
  * **Merge**: Combine remote changes with local changes.
  * **Rebase**: Reapply local commits on top of the remote branch (cleaner history).
  * **Overwrite Remote (Force Push)**: Overwrite the remote with the local state : destroys differing remote changes (Dangerous).
  * **Overwrite Local (Hard Reset)**: Discard local unpushed commits and match the remote exactly (Dangerous).
* Wait for the user to explicitly select an option before proceeding.

## Step 4: Pre-Commit Code Hygiene & Formatting

Before committing and pushing Rust code to the repository, you MUST manually run `cargo fmt` to apply strict formatting standards, followed by `cargo clippy` and `cargo test`. This repository uses a GitHub Action pipeline that enforces strict code hygiene (`cargo fmt --check`); failure to natively format code before pushing will instantly fail the CI/CD pipeline. Resolve any linting or formatting errors before proceeding.

For release pushes, also complete pre-commit release verification before staging:
* Terminate development background servers to prevent port collisions, locked build directories, and stale state during packaging.
* Check fork and upstream state so no fork is ahead of the target branch with diverged changes.
* Run `node project_details/playbooks/verify_skills.js` and resolve every error before staging.
* Run the changelog link verifier and resolve every broken local image link before staging.

## Step 5: Pre-Commit README Badges Verification (img.shields.io)

Before committing and pushing, inspect the project's root `README.md`. If it does not already contain an `img.shields.io` badge block below the primary `# [Project Title]` header, pause and proactively prompt the user with a tailored list of suggested `img.shields.io` badges (e.g., build status, release version, license, tech stack, and repo size) derived from `project_details/github.md`. Insert the approved badges into `README.md` before staging and committing. If the user declines, proceed without them.

## Step 6: Execute and Push

Perform the Git commands corresponding to the user's choice. Once the state is clean (or if the branch was simply ahead with no conflicts), present a pre-push verification summary and then pause for explicit permission. NEVER execute the push commands without direct authorization for that specific push.

The summary MUST include:
* Commit SHA and commit message
* Git tag name when cutting a release
* Target remote and branch
* Test result (pass count, zero failures, zero skips)
* Build result (clean production build)
* Fork surveillance result (zero forks ahead with diverged changes)
* Development server state (safely terminated)

When cutting a release, create the tag before pushing (`git tag v[VERSION]` matching the bumped version string) and push both the branch and the tag after approval.

Once the user explicitly approves, execute the appropriate push:

```powershell
git config user.name  "$GITHUB_USER"
git config user.email "$GITHUB_EMAIL"
# Set or update remote origin
git remote get-url origin 2>$null || git remote add origin "$GITHUB_REMOTE_URL"
git remote set-url origin "$GITHUB_REMOTE_URL"
git push origin "$GITHUB_BRANCH"
```

## Step 7: CI/CD Pipeline Verification via Subagent

After executing a `git push` to the remote repository, you MUST proactively validate that the resulting GitHub Action pipeline completes successfully before considering the push task finished.
* Do NOT use active polling scripts or continuous REST API loops, and do NOT block the primary CLI.
* Instead, you MUST spin up a background subagent to handle the verification.
* The subagent must utilize the `schedule` tool to set a recurring timer that checks the pipeline status every **30 seconds**.
* The subagent should assert the final success state and notify you (using `send_message`) of any warnings, deprecation notices, or runtime errors so they can be addressed.

## Step 8: Update Documentation

Upon a successful push, review and update any of the following project artifacts as needed:

* `design.md`, `plan.md`, `testing.md`, `readme.md`, `todo.md`

Do **not** hardcode credentials into `github.md` : all GitHub configuration now lives in `.env`.

## Step 9: Generate Versioned Walkthrough (Before Commit)

This step MUST run before staging and committing, never after pushing. Bundle the walkthrough, documentation updates, proof assets, and version bumps into the same atomic commit.

* Create the `[PROJECT_ROOT]\project_details\changelog\[VERSION]` directory on each deployment cycle using standard semantic versioning (Major.Minor.Bugfix, e.g., v1.1.0).
* Include screenshots documenting UI changes, stored in the immutable version folder.
* For every fixed defect, document the root cause (why the issue occurred) and the resolution (what concretely fixed it).
* Never modify or overwrite existing version documentation once established.
* Ensure each significant deployment cycle results in a new immutable artifact folder.
* Always ensure that the listed skills within the project's `readme.md` are alphabetized when generating or updating the documentation.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.

## Step 10: Structured Issue Intake & Governance Protocol

To prevent ad-hoc, unstructured issues and ensure high factual density for bug reports and feature tasks, repositories managing GitHub activities must implement **GitHub Issue Forms** (YAML-based forms) located within `.github/ISSUE_TEMPLATE/` rather than standard Markdown templates.

### 1. Issue Forms Architecture (`.github/ISSUE_TEMPLATE/`)

Issue forms support schema validation, required fields, dropdown selections, and interactive checkboxes rendered natively in the GitHub UI.

#### A. Bug Report Form (`.github/ISSUE_TEMPLATE/bug_report.yml`)
Enforces sequential reproduction steps, expected versus actual behavior, diagnostic terminal logs rendered as shell blocks, target runtime environments, and intake verification checkboxes.

```yaml
name: Bug Report
description: File a reproducible bug or unexpected behavior
title: "[Bug]: "
labels: ["bug", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: |
        Please verify the issue has not already been reported before submitting.
  - type: input
    id: summary
    attributes:
      label: Summary
      description: A concise description of the problem.
      placeholder: e.g., Crash on startup when config file is missing
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: Exact sequential steps needed to trigger the bug.
      placeholder: |
        1. Run command '...'
        2. Set flag '...'
        3. Observe error
    validations:
      required: true
  - type: textarea
    id: expected_vs_actual
    attributes:
      label: Expected vs. Actual Behavior
      description: What should happen versus what actually happened.
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Logs and Diagnostics
      description: Paste relevant terminal output, stack traces, or error logs.
      render: shell
    validations:
      required: false
  - type: dropdown
    id: environment
    attributes:
      label: Environment / Target Platform
      options:
        - Windows (x86_64)
        - Windows (aarch64)
        - Linux (x86_64)
        - Linux (aarch64)
        - macOS (Apple Silicon / aarch64)
        - iOS (Simulator / Physical Device)
        - Android (Emulator / Physical Device)
        - Local Development / CI
    validations:
      required: true
  - type: checkboxes
    id: definition_of_ready
    attributes:
      label: Intake Requirements
      options:
        - label: I verified this issue is not a duplicate.
          required: true
        - label: I included minimal reproducible steps and diagnostic logs.
          required: true
```

#### B. Feature Request & Task Intake Form (`.github/ISSUE_TEMPLATE/feature_request.yml`)
Enforces clear problem statements, proposed scope boundaries, testable acceptance criteria, and operational priority ranking.

```yaml
name: Feature Request / Task
description: Propose a new feature, improvement, or scoped work item
title: "[Feature]: "
labels: ["enhancement", "needs-triage"]
body:
  - type: textarea
    id: problem_statement
    attributes:
      label: Problem Statement
      description: What specific friction, gap, or user problem does this solve?
    validations:
      required: true
  - type: textarea
    id: proposed_solution
    attributes:
      label: Proposed Solution / Scope
      description: Concrete breakdown of the expected changes and boundaries.
    validations:
      required: true
  - type: textarea
    id: acceptance_criteria
    attributes:
      label: Acceptance Criteria
      description: Specific, testable conditions required to consider this complete.
      placeholder: |
        - [ ] Unit tests added for edge case X
        - [ ] API endpoint returns status code 200 with payload Y
        - [ ] Documentation updated
    validations:
      required: true
  - type: dropdown
    id: priority
    attributes:
      label: Business / Operational Priority
      options:
        - Critical (Blocking delivery)
        - High (Required for current milestone)
        - Medium (Standard backlog)
        - Low (Nice to have)
    validations:
      required: true
```

#### C. Blank Issue Suppression (`.github/ISSUE_TEMPLATE/config.yml`)
Setting `blank_issues_enabled: false` removes the option to open an unstructured, empty issue, routing general queries to GitHub Discussions or community channels:

```yaml
blank_issues_enabled: false
contact_links:
  - name: GitHub Discussions
    url: https://github.com/OWNER/REPO/discussions
    about: Ask support questions, share ideas, or discuss architecture.
```

### 2. Definition of Ready (DoR) Triage Gatekeeping

To prevent ambiguous or under-specified tasks from entering active development iterations:
* **Triage Label Gate:** Automatically apply `needs-triage` to every newly created issue. Engineering agents must not begin implementation until an issue is triaged and promoted to `ready-for-dev`.
* **Scope Boundary Enforcement:** High-level feature proposals must explicitly specify In-Scope and Out-of-Scope boundaries to eliminate scope drift.
* **Acceptance Criteria Verification:** Acceptance criteria must be formatted as testable markdown checklists (`- [ ]`) to enable transparent review during validation.

### 3. Automated Issue Triage Workflow (`.github/workflows/issue-triage.yml`)

Automates initial label application upon issue intake via GitHub Script:

```yaml
name: Issue Triage

on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: Add Triage Status
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              labels: ['needs-triage']
            });
```

## Appendix: CI Workflow Reference

This skill owns the CI/CD workflow shape (retired as a standalone selectable artifact). Emit it at `.github/workflows/deploy.yml` when the deployment targets hosted CI, adjusting runtimes and deploy steps per project:

```yaml
name: Continuous Integration and Delivery Pipes

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  hygiene_and_test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Tree
        uses: actions/checkout@v4

      - name: Initialize Node Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Architecture Dependencies
        run: npm ci

      - name: Enforce Code Styling and Formatting
        run: npm run lint

      - name: Execute Project Test Suite
        run: npm test

  deploy_production:
    needs: hygiene_and_test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Tree
        uses: actions/checkout@v4

      - name: Execute Live Deployment Routing
        run: npm run deploy:production
```

### 2. Android Mobile Pipeline Blueprint (`.github/workflows/android.yml`)

For projects deploying Android artifacts (APKs or AAB bundles), emit this automated build and test pipeline:

```yaml
name: Android CI Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  build_and_test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Tree
        uses: actions/checkout@v4

      - name: Set Up Java Runtime (Temurin JDK 17)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Gradle Build Cache
        uses: gradle/actions/setup-gradle@v4

      - name: Grant Execute Permissions to Gradlew
        run: chmod +x gradlew

      - name: Run Android Lint Check
        run: ./gradlew lint

      - name: Run Unit Tests
        run: ./gradlew testDebugUnitTest

      - name: Assemble Debug APK
        run: ./gradlew assembleDebug

      - name: Upload APK Diagnostic Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
          path: app/build/outputs/apk/debug/*.apk
```

### 3. iOS Mobile Pipeline Blueprint (`.github/workflows/ios.yml`)

For projects deploying iOS applications or Swift packages, emit this automated build and test pipeline targeting macOS runners:

```yaml
name: iOS CI Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test_and_build:
    runs-on: macos-latest
    steps:
      - name: Checkout Source Tree
        uses: actions/checkout@v4

      - name: Select Xcode Version
        run: sudo xcode-select -s /Applications/Xcode.app

      - name: Resolve Swift Package Dependencies
        run: xcodebuild -resolvePackageDependencies

      - name: Execute Unit and UI Test Suites
        run: |
          xcodebuild test \
            -scheme AppScheme \
            -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' \
            -enableCodeCoverage YES

      - name: Build Archive
        run: |
          xcodebuild archive \
            -scheme AppScheme \
            -archivePath build/App.xcarchive \
            -destination 'generic/platform=iOS'
```
