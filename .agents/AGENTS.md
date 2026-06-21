# Custom Agent Rules for Code Scaffold

* **GitHub Actions Validation:** After executing a `git push` to the remote repository, you MUST proactively validate that the resulting GitHub Action pipeline completes successfully before considering the task finished. Wait for the action to complete and verify its success state.
* **Strict Semantic Versioning:** The versioning schema must strictly adhere to Semantic Versioning. Major and Minor version integers must be bumped for huge improvements and feature enhancements. The Patch integer (x.x.X) is strictly reserved for bugfixes and resolutions. Never use a Patch bump for a feature addition.
* **Skill Meta Configuration Schema:** ALWAYS ensure that every skill includes a `meta.json` file. The `meta.json` must strictly adhere to this format schema (containing exactly `label`, `description`, `version`, and `target` properties) and must be versioned up when changes are made. Example: `{"label": "Playwright", "description": "Browser automation...", "version": "1.0.0", "target": ".skills/playwright"}`.
* **Skill Indexing:** Anytime you update, add, or remove skills, you MUST ensure that `/.skills/readme.md` is updated accordingly.
