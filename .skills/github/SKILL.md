---
name: github_push
description: Specialized skill for safely pushing to GitHub, verifying configuration, and handling edge cases like rebasing, diverging, or conflicts.
---

# GitHub Push Skill & Workflow

When the user asks to push, deploy, or sync with GitHub, follow these instructions exactly to ensure a safe push:

1. **Verify github.md**
   Read the `github.md` file in the project's codebase to ensure it contains all required GitHub repository configuration and parameters (e.g., repository URL, default branch).

2. **Prompt the User if Missing Info**
   If `github.md` does not exist or lacks necessary details (configuration is missing or incomplete), halt and use notify_user or ask the user directly for the missing configuration information. Do not proceed until this information is provided.

3. **Fetch and Check Status**
   Before pushing, run `git fetch` and then `git status` to determine the relationship between the local working directory and the remote repository on GitHub (e.g., if the local branch is behind, ahead, or has diverged).

4. **Handle Edge Cases (Mismatches)**
   If the local branch does not match the remote branch (e.g., diverged branches, remote has new commits, or other conflicts):
   - **DO NOT** automatically push, pull, or merge.
   - Prompt the user *in plain English* explaining the exact mismatch and offering these specific options:
     - **Merge**: Combine the remote changes with the local changes.
     - **Rebase**: Reapply local commits on top of the remote branch (often preferred for cleaner history).
     - **Overwrite Web (Force Push)**: Overwrite the remote version with the local version, pushing the local state to GitHub and destroying any differing changes made remotely (Dangerous).
     - **Overwrite Local (Hard Reset)**: Discard local unpushed commits and match the remote version exactly (Dangerous).
   - Wait for the user to explicitly select an option.

5. **Mandatory README Badges**
   Before pushing, ensure the root `README.md` includes a visually rich set of badges at the very top (referencing https://naereen.github.io/badges/). These badges must provide immediate metadata about the repository state (e.g., license, stars, language, repository size).

6. **Execute Option and Push**
   Perform the Git commands corresponding to the user's choice. Once the state is resolved (or if the branch was simply ahead with no conflicts), execute the appropriate `git push` command.

7. **Update Documentation (`github.md`)**
   Upon a successful push or resolution, update `github.md` with any new configuration details, remote details, or successful state information if needed.

8. **Generate Versioned Walkthrough**
   * You MUST update the `\apps\walkthrough\[VERSION]` directory on each iteration of the app using standard semantic versioning (Major.Minor.Bugfix, e.g., v1.1.0).
   * Ensure that walkthrough documentation includes screenshots where possible, especially to document UI changes.
   * Never modify or overwrite existing version documentation once established
   * Ensure each significant deployment cycle results in a new immutable artifact folder
   * Always ensure that the listed skills within the project's `readme.md` are alphabetized when generating or updating the documentation