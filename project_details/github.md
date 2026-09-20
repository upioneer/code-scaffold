---
description: GitHub Project Setup and Workflow Specification
---

# GitHub Project Configuration

GitHub identity, repository remotes, and visibility are managed strictly through the project's root `.env` file (referencing `.env.example`). Never commit credentials, personal identifiers, or repository parameters into this or any version-tracked document.

## Required Environment Variables

All GitHub variables must be defined inside `.env`:

* `GITHUB_USER`: Git commit author name and GitHub account handle
* `GITHUB_EMAIL`: Git commit author email
* `GITHUB_REMOTE_URL`: Git remote origin URL (HTTPS or SSH)
* `GITHUB_VISIBILITY`: Repository visibility posture (`public` or `private`)
* `GITHUB_BRANCH`: Default deployment branch (typically `main`)

Consult `.env.example` for the canonical configuration block template.

## Agent Instructions

When an AI agent is requested to push, commit, or interact with GitHub:

1. **Verify Environment Variables**: Read `.env` and verify all `GITHUB_` keys are present and populated. If any are absent or empty, self-heal `.env` using `.env.example` as a template, pause, and prompt the user to supply missing values before continuing.
2. **Review Project Artifacts**: Review and synchronize project artifacts (`design.md`, `plan.md`, `testing.md`, `readme.md`, `todo.md`) as required.
3. **Pre-Commit README Badges Verification**: Inspect the root `README.md`. If it does not already contain an `img.shields.io` badge row, pause and prompt the user proposing relevant badges using the playbook below.
4. **Order of Operations**: Generate or update the versioned history documentation (`project_details/changelog/v[NEW_VERSION]/readme.md`) before staging changes.
5. **Pre-Commit Code Hygiene**: If Rust or compiled code is present, verify `cargo fmt --check`, `cargo clippy`, and `cargo test` pass with zero warnings.
6. **Git Initialization and Identity**: Verify git initialization (`git init`). Configure local commit identity using `GITHUB_USER` and `GITHUB_EMAIL` from `.env`.
7. **Stage and Commit**: Bundle changes and documentation into a single deployment commit.
8. **Remote Synchronization**: Configure or update remote origin using `GITHUB_REMOTE_URL`.
9. **Explicit Authorization**: Pause and request direct human approval before executing `git push origin $GITHUB_BRANCH`.
10. **CI/CD Pipeline Validation**: Proactively monitor GitHub Action workflows via a background subagent using the `schedule` tool until completion.

## README Shields.io Badges Playbook

When prompted during the pre-commit verification sequence, suggest a curated badge row matching the project's tech stack, framework, and repository metadata (derived from `GITHUB_REMOTE_URL` in `.env`):

### Standard Categories & Badge Formats

* **Release & Version**: `https://img.shields.io/github/v/release/:user/:repo?style=flat-square&color=22c55e`
* **Build & Workflow Status**: `https://img.shields.io/github/actions/workflow/status/:user/:repo/:workflow_file?style=flat-square`
* **License**: `https://img.shields.io/github/license/:user/:repo?style=flat-square&color=6366f1`
* **Language & Framework**: `https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white` or `https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white`
* **Security & Provenance (GhostImprint)**: `https://img.shields.io/badge/GhostImprint-Protected-00f0ff?style=flat-square&logo=shield&logoColor=06090e`
* **Repository Size**: `https://img.shields.io/github/repo-size/:user/:repo?style=flat-square&color=38bdf8`

### Recommended README Layout

Format selected badges directly below the primary `# [Project Title]` heading in a clean markdown row:

```markdown
# Project Title

[![Release](https://img.shields.io/github/v/release/:user/:repo?style=flat-square&color=22c55e)](https://github.com/:user/:repo/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/:user/:repo/ci.yml?style=flat-square)](https://github.com/:user/:repo/actions)
[![License](https://img.shields.io/github/license/:user/:repo?style=flat-square&color=6366f1)](LICENSE)
```
