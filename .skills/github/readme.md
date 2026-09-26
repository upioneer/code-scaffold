# GitHub

**Version:** 7

**Target:** `.skills/github`

**Category:** DevOps & Infrastructure

**Keywords:** `github`, `git`, `github-actions`, `cicd`, `pull-requests`, `releases`, `repo-management`

## Description
GitHub push workflow with .env based identity configuration; merges github.md into the skill

## Capabilities & Use Cases
* Enforces automated `.env` self-healing by injecting missing GitHub credentials (`GITHUB_USER`, `GITHUB_EMAIL`, `GITHUB_REMOTE_URL`, `GITHUB_VISIBILITY`, `GITHUB_BRANCH`) directly into the project configuration.
* Defends local environments against credential leaks by rigorously validating `.gitignore` implementations.
* Analyzes local vs remote git statuses to gracefully halt and handle edge-case mismatches (diverging branches, rebasing, forced resets).
* Mandates aggressive pre-commit code hygiene by executing language-specific formatters (e.g., `cargo fmt`, `clippy`, and `test`) to prevent CI/CD pipeline failures.
* Validates aesthetic repository presentation by demanding rich metadata badges in the root `README.md`.
* Executes safe authentication and push procedures while wrapping the operation in background subagent polling.
* Generates versioned, immutable documentation walkthroughs with screenshot capabilities before committing, bundled into the same atomic release commit.
* Presents a mandatory pre-push verification summary (commit SHA, tag, remote, tests, build, fork audit, server state) and pauses for explicit authorization, including release tag creation and tag push.
* Enforces strict UI documentation protocols and semantic versioning structures across the `project_details/changelog/` directory.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v7** : Skill owns the CI workflow reference and GitHub configuration outright replacing retired deploy.yml and github.md artifacts, with scaffold time .env key seeding
* **v6** : Two gate release authorization with pre-push verification summary, release tag handling, pre-commit release verification, walkthrough before commit ordering, and defect root cause plus resolution pattern
* **v5** : Expanded capability descriptions
* **v4** : Added CI/CD pipeline validation step, mandating the use of a background subagent polling at 30 second intervals.
* **v3** : Add code hygiene step to github skill workflow
* **v2** : Feat(github): merge github.md into skill with .env based config
* **v1** : Update firebase and github skill configurations
