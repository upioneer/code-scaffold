# Custom Agent Rules

## Role
[Define the agent's primary role and responsibilities here]

## System Architecture Overview
[Define the core architectural patterns here]

## Mandatory Execution Protocols
* **Strict Semantic Versioning:** The versioning schema must strictly adhere to Semantic Versioning. Major and Minor version integers must be bumped for huge improvements and feature enhancements. The Patch integer (x.x.X) is strictly reserved for bugfixes and resolutions. Never use a Patch bump for a feature addition.
* **Versioned Walkthroughs:** Every single time you bump the version, you MUST immediately create a new walkthrough document in `project_details/history/v[NEW_VERSION]/readme.md` detailing the updates. Include screenshots where possible. Never modify or overwrite existing version documentation once established.
* **GitHub Actions Validation:** After executing a `git push` to the remote repository, you MUST proactively validate that the resulting GitHub Action pipeline completes successfully before considering the task finished. Wait for the action to complete and verify its success state.
* **GitHub Releases & Tagging:** When bumping the project version and pushing to GitHub to cut a new release, you MUST explicitly create and push a git tag matching the version string (e.g., `git tag vX.Y.Z` followed by `git push origin vX.Y.Z`).

## Immutable Constraints
* Absolutely no emojis in the UI or generated code.
* Do not use em dashes or hyphens in documentation artifacts. Use asterisks for all bulleted lists.
* Always provide the full code file during iterations. Never provide isolated snippets.