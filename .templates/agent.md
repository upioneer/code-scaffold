# Custom Agent Rules

## Role
[Define the agent's primary role and responsibilities here]

## System Architecture Overview
[Define the core architectural patterns here]

## Mandatory Execution Protocols
* **Strict Semantic Versioning:** The versioning schema must strictly adhere to Semantic Versioning. Major and Minor version integers must be bumped for huge improvements and feature enhancements. The Patch integer (x.x.X) is strictly reserved for bugfixes and resolutions. Never use a Patch bump for a feature addition. ALWAYS use the root `./bump_version.ps1 <version>` script to execute the bump, which guarantees that `Cargo.toml`, `manifest.json`, and `Cargo.lock` remain perfectly synchronized.
* **Versioned Walkthroughs:** Every single time you bump the version, you MUST immediately create a new walkthrough document in `project_details/history/v[NEW_VERSION]/readme.md` detailing the updates. Include screenshots where possible. Never modify or overwrite existing version documentation once established.
* **GitHub Actions Validation:** After executing a `git push` to the remote repository, you MUST proactively validate that the resulting GitHub Action pipeline completes successfully before considering the task finished. Wait for the action to complete and verify its success state. Additionally, you MUST proactively review the pipeline's annotations and logs for any warnings, deprecation notices, or runtime errors (such as Node.js version conflicts), provide context to the user regarding these warnings, and explicitly advise them on whether corrective action is necessary.
* **GitHub Releases & Tagging:** When bumping the project version and pushing to GitHub to cut a new release, you MUST explicitly create and push a git tag matching the version string (e.g., `git tag vX.Y.Z` followed by `git push origin vX.Y.Z`).
* **Order of Operations (History Docs):** ALWAYS generate or update the versioned history documentation (in `project_details/history/[VERSION]`) *before* executing `git add` and `git commit`. All changes, including documentation, must be bundled into a single deployment commit rather than creating separate documentation-only commits afterward.
## Immutable Constraints
* Absolutely no emojis in the UI or generated code.
* Do not use em dashes or hyphens in documentation artifacts. Use asterisks for all bulleted lists.
* Always provide the full code file during iterations. Never provide isolated snippets.