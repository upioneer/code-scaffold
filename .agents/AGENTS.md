# Custom Agent Rules for Code Scaffold

* **GitHub Actions Validation:** After executing a `git push` to the remote repository, you MUST proactively validate that the resulting GitHub Action pipeline completes successfully before considering the task finished. Wait for the action to complete and verify its success state. Additionally, you MUST proactively review the pipeline's annotations and logs for any warnings, deprecation notices, or runtime errors (such as Node.js version conflicts), provide context to the user regarding these warnings, and explicitly advise them on whether corrective action is necessary.
* **GitHub Releases & Tagging:** When bumping the project version and pushing to GitHub to cut a new release, you MUST explicitly create and push a git tag matching the version string (e.g., `git tag vX.Y.Z` followed by `git push origin vX.Y.Z`). The GitHub Actions release pipeline requires the tag to trigger the compilation matrix and publish the release assets; pushing to `main` alone will silently skip the release payload.
* **Strict Semantic Versioning (Project):** The core project versioning schema must strictly adhere to Semantic Versioning (`major.minor.patch`). ALWAYS use the root `./bump_version.ps1 <version>` script to execute the bump.
* **Strict Whole Number Versioning (Skills Only):** For individual skills ONLY, use simple whole numbers (e.g., `1`, `2`, `3`). Every change or bundled change will increment the version by 1. NEVER use major.minor.patch formats for skills.
* **Skill Meta Configuration Schema:** ALWAYS ensure that every skill includes a `meta.json` file. The `meta.json` must strictly adhere to this format schema (containing exactly `label`, `description`, `version`, and `target` properties) and must be versioned up when changes are made. Example: `{"label": "Playwright", "description": "Browser automation...", "version": "3", "target": ".skills/playwright"}`.
* **Ad-Hoc Distribution Manifest:** ALWAYS ensure that every skill also includes a `skill-manifest.json` file to support ad-hoc CLI installation via the distribution manager. The manifest must include `name`, `version`, `description`, `entryPoint` (defaulting to `"./SKILL.md"`), `engines`, and `requiredPermissions` (e.g. `["fs:read", "fs:write", "net:connect"]`).
* **Skill Documentation (README.md):** ALWAYS ensure that every skill includes a `readme.md` file located at the root of the skill's directory. This readme MUST strictly adhere to the following template layout for absolute uniformity across the stack:
  ```markdown
  # [Skill Name]

  **Version:** [Version Number]
  **Target:** `.skills/[folder_name]`

  ## Description
  [1-2 sentences describing the skill's overarching purpose]

  ## Capabilities & Use Cases
  [This section is our ONLY opportunity to demonstrate how useful, thoughtful, complete, and impressive the skill is. You MUST provide a highly detailed bulleted list mapping out the deep technical capabilities, domain frameworks, integrations, features, and precise operational mechanics of the skill. Do not undersell the payload!]
  * [Detailed Capability 1]
  * [Detailed Capability 2]

  ## Usage
  [How an AI agent or user should invoke or use this skill]

  ## Changelog
  * **v[Version Number]** : [Change description]
  ```
* **Skill Indexing:** Anytime you update, add, or remove skills, you MUST ensure that `/.skills/readme.md` is updated accordingly.
* **Pre-Commit Code Hygiene & Formatting:** Before committing and pushing Rust code to the repository, you MUST manually run `cargo fmt` to apply strict formatting standards, followed by `cargo clippy` and `cargo test`. This repository uses a GitHub Action pipeline that enforces strict code hygiene (`cargo fmt --check`); failure to natively format code before pushing will instantly fail the CI/CD pipeline.
* **Order of Operations (History Docs):** ALWAYS generate or update the versioned history documentation (in `project_details/history/[VERSION]`) *before* executing `git add` and `git commit`. All changes, including documentation, must be bundled into a single deployment commit rather than creating separate documentation-only commits afterward.
* **Typography Constraints (Readmes):** NEVER use em dashes (`—`) or en dashes (`–`), and avoid using hyphens (`-`) as punctuation or list markers in ALL `readme.md` and documentation files across the project. Use asterisks (`*`) for lists and colons (`:`) or spaces for inline separation. (Note: Hyphens inside URLs, code, or command flags are acceptable).
* **GitHub Actions Pipeline Timing:** When verifying GitHub Action pipeline completion, do NOT use active polling scripts or continuous REST API loops, and do NOT block the primary CLI. Instead, you MUST spin up a background subagent to handle the verification. The subagent should utilize the `schedule` tool to set a 5-6 minute background timer to silently wait for the build to finish before asserting the final success state, keeping the primary workspace free for simultaneous tasks.
