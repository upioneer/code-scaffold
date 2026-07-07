# Custom Agent Rules

## Role
[Define the agent's primary role and responsibilities here]

## System Architecture Overview
[Define the core architectural patterns here]

## Mandatory Execution Protocols
* **Strict Semantic Versioning:** The versioning schema must strictly adhere to Semantic Versioning (`major.minor.patch`) with the following logic:
  - Major architectural or UI/UX changes receive +1.0.0 bumps. ALWAYS confirm with the user before bumping a major version.
  - Feature additions or improvements (bundled or single) receive +0.1.0 bumps.
  - Bugfixes/patches receive +0.0.1 bumps.
  - ALWAYS use the root `./bump_version.ps1 <version>` script to execute the bump.
* **Versioned Walkthroughs:** Every single time you bump the version, you MUST immediately create a new walkthrough document in `project_details/history/v[NEW_VERSION]/readme.md` detailing the updates. Include screenshots where possible. Never modify or overwrite existing version documentation once established.
* **GitHub Actions Validation:** After executing a `git push` to the remote repository, you MUST proactively validate that the resulting GitHub Action pipeline completes successfully before considering the task finished. Wait for the action to complete and verify its success state. Additionally, you MUST proactively review the pipeline's annotations and logs for any warnings, deprecation notices, or runtime errors (such as Node.js version conflicts), provide context to the user regarding these warnings, and explicitly advise them on whether corrective action is necessary.
* **GitHub Releases & Tagging:** When bumping the project version and pushing to GitHub to cut a new release, you MUST explicitly create and push a git tag matching the version string (e.g., `git tag vX.Y.Z` followed by `git push origin vX.Y.Z`).
* **Order of Operations (History Docs):** ALWAYS generate or update the versioned history documentation (in `project_details/history/[VERSION]`) *before* executing `git add` and `git commit`. All changes, including documentation, must be bundled into a single deployment commit rather than creating separate documentation-only commits afterward.
* **Automated Screenshots (VHS):** If the workspace utilizes `vhs` for automated screenshot/GIF generation (e.g., during version bumps), you MUST verify that `vhs` successfully generated the assets before embedding them in documentation. If `vhs` is not installed or fails, you MUST prompt the user to either install the dependencies or skip the capture. When prompting, be transparent and concise: advise that `vhs` requires external dependencies (`ffmpeg` and `ttyd`). Provide a streamlined installation command (e.g., `scoop install vhs ttyd`). If the user does not have Scoop installed, provide the official Scoop installation commands (`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser; Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression`). Explicitly warn the user that they must restart their terminal or IDE for the new PATH variables to take effect. If the capture is skipped or fails, you MUST NOT include broken markdown image links.
## Immutable Constraints
* Absolutely no emojis in the UI or generated code.
* Do not use em dashes or hyphens in documentation artifacts. Use asterisks for all bulleted lists.
* Always provide the full code file during iterations. Never provide isolated snippets.