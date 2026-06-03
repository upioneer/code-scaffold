---
description: GitHub Project Setup Template
---

# GitHub Project Configuration

## Identity Configuration
* **Git User Name:** [YOUR_USERNAME]
* **Git User Email:** [YOUR_EMAIL]

## Repository Details
* **Remote URL:** [YOUR_REMOTE_URL]
* **Visibility:** [YOUR_VISIBILITY]
* **Default Branch:** main

## Agent Instructions
When an agent sees this file:
1. Review and update project artifacts (`design.md`, `plan.md`, `testing.md`, `readme.md`, `todo.md`) as required.
2. Create `project_details\history\v[NEW_VERSION]\readme.md`.
3. Verify Remote URL is valid. Prompt user if not.
4. Verify Visibility (Public/Private) if the user has not declared.
5. Initialize git (`git init`) if not already initialized.
6. Configure local identity using variables above.
7. Stage and commit changes.
8. Add remote origin (if needed).
9. Push to main.